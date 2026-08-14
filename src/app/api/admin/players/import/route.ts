import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import * as XLSX from 'xlsx'
import { DraftPoolImport } from '@/types'
import { assertLeagueMutable, verifyLeagueAdmin, userAdminsAnyLeague } from '@/lib/auth-helpers'
import { resolvePosition, splitFullName, ALLOWED_POSITIONS_PL } from '@/lib/draft-players'

interface ImportResult {
  success: boolean
  imported: number
  skipped: number
  errors: string[]
  details: {
    players: Record<string, unknown>[]
  }
}

// The 2026/27 pool is imported UNASSIGNED — managers are assigned via the live
// draft, so there is no Manager/Team Name column. The spreadsheet uses four
// Polish-headed columns: Imię i Nazwisko, Liga, Klub, Pozycja.
const REQUIRED_COLUMNS = ['Imię i Nazwisko', 'Klub', 'Pozycja'] as const

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const leagueId = formData.get('leagueId') as string

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    if (!leagueId) {
      return NextResponse.json({ error: 'League ID required' }, { status: 400 })
    }

    // Authorise per league: any admin of THIS league (not just a global admin)
    // may import its player pool.
    const { isAdmin } = await verifyLeagueAdmin(userId, leagueId)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const mutable = await assertLeagueMutable(leagueId)
    if (!mutable.ok) {
      return NextResponse.json({ error: mutable.error }, { status: mutable.status })
    }

    // Verify league exists and get its name
    const { data: league, error: leagueError } = await supabaseAdmin
      .from('leagues')
      .select('id, name')
      .eq('id', leagueId)
      .single()

    if (leagueError || !league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 })
    }

    const leagueName = league.name

    // Parse Excel file
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer)
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet) as DraftPoolImport[]

    if (!jsonData || jsonData.length === 0) {
      return NextResponse.json({ error: 'No data found in file' }, { status: 400 })
    }

    // Validate required columns (Liga is optional)
    const firstRow = jsonData[0]
    const missingColumns = REQUIRED_COLUMNS.filter(col => !(col in firstRow))

    if (missingColumns.length > 0) {
      return NextResponse.json({
        error: `Brakujące wymagane kolumny: ${missingColumns.join(', ')}. Opcjonalne: Liga`
      }, { status: 400 })
    }

    const result: ImportResult = {
      success: true,
      imported: 0,
      skipped: 0,
      errors: [],
      details: {
        players: []
      }
    }

    // A full draft pool is ~5000 rows. Validating and de-duplicating in memory
    // and inserting in chunks keeps this to roughly a dozen round-trips; the
    // previous row-at-a-time SELECT+INSERT was two per row (~10k), which blew
    // through the 30s function limit (vercel.json) and left a PARTIAL import
    // behind, since there is no transaction spanning the loop.
    const dedupeKey = (name: string, surname: string) =>
      `${name.toLowerCase()}|${surname.toLowerCase()}`

    // Every player already in this league, so the duplicate check costs one
    // paged read instead of one query per row. Supabase caps a select at 1000
    // rows by default, so page explicitly rather than silently seeing a prefix
    // and re-inserting everyone past it.
    const existingKeys = new Set<string>()
    const PAGE = 1000
    for (let from = 0; ; from += PAGE) {
      const { data: page, error: existingError } = await supabaseAdmin
        .from('players')
        .select('name, surname')
        .eq('league_id', leagueId)
        .range(from, from + PAGE - 1)

      if (existingError) {
        return NextResponse.json(
          { error: `Nie udało się odczytać istniejących zawodników: ${existingError.message}` },
          { status: 500 }
        )
      }
      for (const p of page ?? []) existingKeys.add(dedupeKey(p.name ?? '', p.surname ?? ''))
      if (!page || page.length < PAGE) break
    }

    type PendingPlayer = {
      name: string
      surname: string
      league: string
      league_id: string
      position: string
      club: string
      football_league: string | null
      manager_id: null
      total_goals: number
    }
    const pending: PendingPlayer[] = []

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i]
      const rowNum = i + 2 // Excel row number (1-indexed + header row)

      const fullName = String(row['Imię i Nazwisko'] ?? '').trim()
      const club = String(row['Klub'] ?? '').trim()
      const rawPosition = String(row['Pozycja'] ?? '').trim()

      // Validate required fields
      if (!fullName || !club || !rawPosition) {
        result.errors.push(`Wiersz ${rowNum}: Brak wymaganych pól (Imię i Nazwisko, Klub, Pozycja)`)
        result.skipped++
        continue
      }

      // Split the full name into first name + surname.
      const { name: firstName, surname } = splitFullName(fullName)
      if (!firstName) {
        result.errors.push(`Wiersz ${rowNum}: Nieprawidłowe imię i nazwisko`)
        result.skipped++
        continue
      }

      // Map/validate position (Goalkeeper is not supported).
      const position = resolvePosition(rawPosition)
      if (!position) {
        result.errors.push(
          `Wiersz ${rowNum}: Nieprawidłowa pozycja "${rawPosition}". Dozwolone: ${ALLOWED_POSITIONS_PL}`
        )
        result.skipped++
        continue
      }

      // Matches the old behaviour: already in the league, or named identically
      // to an earlier row in this same file, is skipped rather than inserted.
      const key = dedupeKey(firstName, surname)
      if (existingKeys.has(key)) {
        result.errors.push(`Wiersz ${rowNum}: Zawodnik "${firstName} ${surname}" już istnieje w lidze ${leagueName}`)
        result.skipped++
        continue
      }
      existingKeys.add(key)

      const footballLeague = row['Liga'] ? String(row['Liga']).trim() || null : null

      // Insert player UNASSIGNED (manager_id null). The draft assigns managers.
      // SAFEGUARD: always use leagueName from the target league to prevent
      // cross-league data.
      pending.push({
        name: firstName,
        surname,
        league: leagueName,
        league_id: leagueId, // CRITICAL: scopes the player to THIS league
        position,
        club,
        football_league: footballLeague,
        manager_id: null,
        total_goals: 0
      })
    }

    const CHUNK = 500
    for (let from = 0; from < pending.length; from += CHUNK) {
      const chunk = pending.slice(from, from + CHUNK)
      const { data: inserted, error: playerError } = await supabaseAdmin
        .from('players')
        .insert(chunk)
        .select('id')

      if (playerError) {
        // Report the spreadsheet rows this chunk covers, not the chunk index —
        // the row numbers are what the admin can actually act on.
        result.errors.push(
          `Nie udało się zaimportować ${chunk.length} zawodników ` +
          `(${chunk[0].name} ${chunk[0].surname} ...) - ${playerError.message}`
        )
        result.skipped += chunk.length
        continue
      }

      result.details.players.push(...(inserted ?? []))
      result.imported += inserted?.length ?? chunk.length
    }

    return NextResponse.json({
      message: `Import zakończony. Zaimportowano ${result.imported} zawodników, pominięto ${result.skipped}.`,
      result
    })

  } catch (error) {
    console.error('Player import error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Template download endpoint
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // The template is generic (not league-scoped); allow any league admin.
    if (!(await userAdminsAnyLeague(userId))) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Template data: the four Polish columns of the draft pool import
    const templateData = [
      {
        'Imię i Nazwisko': 'Lionel Messi',
        'Liga': 'MLS',
        'Klub': 'Inter Miami',
        'Pozycja': 'Napastnik'
      },
      {
        'Imię i Nazwisko': 'Virgil van Dijk',
        'Liga': 'Premier League',
        'Klub': 'Liverpool FC',
        'Pozycja': 'Obrońca'
      },
      {
        'Imię i Nazwisko': 'Luka Modrić',
        'Liga': 'La Liga',
        'Klub': 'Real Madrid',
        'Pozycja': 'Pomocnik'
      }
    ]

    // Create workbook
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(templateData, {
      header: ['Imię i Nazwisko', 'Liga', 'Klub', 'Pozycja']
    })

    // Set column widths
    worksheet['!cols'] = [
      { width: 26 }, // Imię i Nazwisko
      { width: 20 }, // Liga
      { width: 20 }, // Klub
      { width: 14 }  // Pozycja
    ]

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Zawodnicy')

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="player-import-template.xlsx"'
      }
    })

  } catch (error) {
    console.error('Template download error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

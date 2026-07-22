import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import * as XLSX from 'xlsx'
import { DraftPoolImport } from '@/types'
import { assertLeagueMutable } from '@/lib/auth-helpers'
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
// draft, so there is no Manager/Team Name column. The spreadsheet uses five
// Polish-headed columns: Imię i Nazwisko, Kraj, Liga, Klub, Pozycja.
const REQUIRED_COLUMNS = ['Imię i Nazwisko', 'Klub', 'Pozycja'] as const

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('clerk_id', userId)
      .single()

    if (userError || !user?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
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

    // Validate required columns (Kraj and Liga are optional)
    const firstRow = jsonData[0]
    const missingColumns = REQUIRED_COLUMNS.filter(col => !(col in firstRow))

    if (missingColumns.length > 0) {
      return NextResponse.json({
        error: `Brakujące wymagane kolumny: ${missingColumns.join(', ')}. Opcjonalne: Kraj, Liga`
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

    // Process each row
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i]
      const rowNum = i + 2 // Excel row number (1-indexed + header row)

      try {
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

        const country = row['Kraj'] ? String(row['Kraj']).trim() || null : null
        const footballLeague = row['Liga'] ? String(row['Liga']).trim() || null : null

        // Check if player already exists in this league
        const { data: existingPlayer } = await supabaseAdmin
          .from('players')
          .select('id')
          .eq('name', firstName)
          .eq('surname', surname)
          .eq('league', leagueName)
          .maybeSingle()

        if (existingPlayer) {
          result.errors.push(`Wiersz ${rowNum}: Zawodnik "${firstName} ${surname}" już istnieje w lidze ${leagueName}`)
          result.skipped++
          continue
        }

        // Insert player UNASSIGNED (manager_id null). The draft assigns managers.
        // SAFEGUARD: always use leagueName from the target league to prevent
        // cross-league data.
        const { data: player, error: playerError } = await supabaseAdmin
          .from('players')
          .insert({
            name: firstName,
            surname,
            league: leagueName, // CRITICAL: must match the target league
            position,
            country,
            club,
            football_league: footballLeague,
            manager_id: null,
            total_goals: 0
          })
          .select()
          .single()

        if (playerError) {
          result.errors.push(`Wiersz ${rowNum}: Nie udało się utworzyć zawodnika - ${playerError.message}`)
          result.skipped++
          continue
        }

        result.details.players.push(player)
        result.imported++
      } catch (error) {
        result.errors.push(`Wiersz ${rowNum}: Nieoczekiwany błąd - ${error instanceof Error ? error.message : 'Nieznany błąd'}`)
        result.skipped++
      }
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

    // Check if user is admin
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('clerk_id', userId)
      .single()

    if (userError || !user?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Template data: the five Polish columns of the draft pool import
    const templateData = [
      {
        'Imię i Nazwisko': 'Lionel Messi',
        'Kraj': 'Argentyna',
        'Liga': 'MLS',
        'Klub': 'Inter Miami',
        'Pozycja': 'Napastnik'
      },
      {
        'Imię i Nazwisko': 'Virgil van Dijk',
        'Kraj': 'Holandia',
        'Liga': 'Premier League',
        'Klub': 'Liverpool FC',
        'Pozycja': 'Obrońca'
      },
      {
        'Imię i Nazwisko': 'Luka Modrić',
        'Kraj': 'Chorwacja',
        'Liga': 'La Liga',
        'Klub': 'Real Madrid',
        'Pozycja': 'Pomocnik'
      }
    ]

    // Create workbook
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(templateData, {
      header: ['Imię i Nazwisko', 'Kraj', 'Liga', 'Klub', 'Pozycja']
    })

    // Set column widths
    worksheet['!cols'] = [
      { width: 26 }, // Imię i Nazwisko
      { width: 16 }, // Kraj
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

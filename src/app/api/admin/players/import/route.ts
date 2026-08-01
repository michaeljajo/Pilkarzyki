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
  replaced: number
  errors: string[]
}

interface PlayerInsert {
  name: string
  surname: string
  league: string
  position: string
  club: string
  football_league: string | null
  manager_id: null
  total_goals: number
}

// The 2026/27 pool is imported UNASSIGNED — managers are assigned via the live
// draft, so there is no Manager/Team Name column. The spreadsheet uses four
// Polish-headed columns: Imię i Nazwisko, Liga, Klub, Pozycja.
const REQUIRED_COLUMNS = ['Imię i Nazwisko', 'Klub', 'Pozycja'] as const

// A full-season pool is 5000+ rows, so the import is set-based: a guard query,
// one delete, then chunked inserts. A SELECT + INSERT per row would exceed the
// 30s function limit long before finishing.
const INSERT_BATCH_SIZE = 500
// Cap the reported errors so a badly-formed sheet cannot produce a multi-MB
// response; the counts stay exact either way.
const MAX_REPORTED_ERRORS = 100

/**
 * The pool is a full snapshot of every scraped squad, so rows sharing a name
 * are expected and legitimate: "Vitinha" at PSG and at Genoa are different
 * players, and a single club can field two players of the same name. Nothing
 * here may deduplicate on name — a player's identity is its own row id.
 *
 * Because the import consequently cannot recognise a row it inserted earlier,
 * re-running it REPLACES the undrafted pool instead of appending to it. That is
 * only safe while nothing depends on those rows, so it is refused once a draft
 * has started or any player has been assigned to a manager.
 */
async function assertPoolReplaceable(
  leagueId: string,
  leagueName: string
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const { count: assignedCount, error: assignedError } = await supabaseAdmin
    .from('players')
    .select('id', { count: 'exact', head: true })
    .eq('league', leagueName)
    .not('manager_id', 'is', null)

  if (assignedError) {
    return { ok: false, status: 500, error: `Nie udało się zweryfikować puli: ${assignedError.message}` }
  }

  if (assignedCount && assignedCount > 0) {
    return {
      ok: false,
      status: 409,
      error:
        `Nie można zaimportować puli: ${assignedCount} zawodników jest już przypisanych do menedżerów. ` +
        'Import zastępuje całą pulę i jest dozwolony wyłącznie przed draftem.'
    }
  }

  // A live draft keeps its picks in draft_picks and only writes
  // players.manager_id when it finishes, so the check above cannot see it.
  const { data: startedDrafts, error: draftError } = await supabaseAdmin
    .from('drafts')
    .select('status')
    .eq('league_id', leagueId)
    .neq('status', 'setup')

  if (draftError) {
    return { ok: false, status: 500, error: `Nie udało się zweryfikować statusu draftu: ${draftError.message}` }
  }

  if (startedDrafts && startedDrafts.length > 0) {
    return {
      ok: false,
      status: 409,
      error:
        'Nie można zaimportować puli: draft dla tej ligi został już rozpoczęty lub zakończony. ' +
        'Import zastępuje całą pulę i jest dozwolony wyłącznie przed draftem.'
    }
  }

  return { ok: true }
}

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
      replaced: 0,
      errors: []
    }

    const addError = (message: string) => {
      if (result.errors.length < MAX_REPORTED_ERRORS) {
        result.errors.push(message)
      }
    }

    // Validate every row first, so a sheet that is broken in some way is
    // rejected before anything in the database is touched.
    const toInsert: { rowNum: number; player: PlayerInsert }[] = []

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i]
      const rowNum = i + 2 // Excel row number (1-indexed + header row)

      const fullName = String(row['Imię i Nazwisko'] ?? '').trim()
      const club = String(row['Klub'] ?? '').trim()
      const rawPosition = String(row['Pozycja'] ?? '').trim()

      // Validate required fields
      if (!fullName || !club || !rawPosition) {
        addError(`Wiersz ${rowNum}: Brak wymaganych pól (Imię i Nazwisko, Klub, Pozycja)`)
        result.skipped++
        continue
      }

      // Split the full name into first name + surname.
      const { name: firstName, surname } = splitFullName(fullName)
      if (!firstName) {
        addError(`Wiersz ${rowNum}: Nieprawidłowe imię i nazwisko`)
        result.skipped++
        continue
      }

      // Map/validate position (Goalkeeper is not supported).
      const position = resolvePosition(rawPosition)
      if (!position) {
        addError(
          `Wiersz ${rowNum}: Nieprawidłowa pozycja "${rawPosition}". Dozwolone: ${ALLOWED_POSITIONS_PL}`
        )
        result.skipped++
        continue
      }

      const footballLeague = row['Liga'] ? String(row['Liga']).trim() || null : null

      // Players are inserted UNASSIGNED (manager_id null); the draft assigns
      // managers. Rows are NOT deduplicated — see assertPoolReplaceable.
      // SAFEGUARD: always use leagueName from the target league to prevent
      // cross-league data.
      toInsert.push({
        rowNum,
        player: {
          name: firstName,
          surname,
          league: leagueName, // CRITICAL: must match the target league
          position,
          club,
          football_league: footballLeague,
          manager_id: null,
          total_goals: 0
        }
      })
    }

    if (toInsert.length === 0) {
      return NextResponse.json({
        error: 'Żaden wiersz nie przeszedł walidacji — pula nie została zmieniona.',
        result
      }, { status: 400 })
    }

    const replaceable = await assertPoolReplaceable(leagueId, leagueName)
    if (!replaceable.ok) {
      return NextResponse.json({ error: replaceable.error }, { status: replaceable.status })
    }

    // Clear the old undrafted pool. assertPoolReplaceable has established that
    // no player in this league is assigned, so this deletes the whole pool;
    // the manager_id filter is a belt-and-braces guard against ever removing
    // a drafted player.
    const { count: replacedCount, error: deleteError } = await supabaseAdmin
      .from('players')
      .delete({ count: 'exact' })
      .eq('league', leagueName)
      .is('manager_id', null)

    if (deleteError) {
      return NextResponse.json({
        error: `Nie udało się wyczyścić poprzedniej puli: ${deleteError.message}`
      }, { status: 500 })
    }

    result.replaced = replacedCount ?? 0

    // Insert in batches. A batch is atomic, so on failure we retry that batch
    // row by row to pinpoint the offending row rather than losing all of it.
    for (let start = 0; start < toInsert.length; start += INSERT_BATCH_SIZE) {
      const batch = toInsert.slice(start, start + INSERT_BATCH_SIZE)

      const { error: batchError } = await supabaseAdmin
        .from('players')
        .insert(batch.map(entry => entry.player))

      if (!batchError) {
        result.imported += batch.length
        continue
      }

      for (const entry of batch) {
        const { error: rowError } = await supabaseAdmin
          .from('players')
          .insert(entry.player)

        if (rowError) {
          addError(`Wiersz ${entry.rowNum}: Nie udało się utworzyć zawodnika - ${rowError.message}`)
          result.skipped++
        } else {
          result.imported++
        }
      }
    }

    if (result.skipped > result.errors.length) {
      result.errors.push(
        `…oraz ${result.skipped - result.errors.length} kolejnych pominiętych wierszy (lista skrócona).`
      )
    }

    return NextResponse.json({
      message:
        `Import zakończony. Zaimportowano ${result.imported} zawodników` +
        `${result.replaced ? `, zastąpiono poprzednią pulę (${result.replaced})` : ''}` +
        `${result.skipped ? `, pominięto ${result.skipped}` : ''}.`,
      result
    })

  } catch (error) {
    console.error('Player import error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Internal server error'
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

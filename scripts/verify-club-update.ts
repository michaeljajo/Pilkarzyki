/**
 * Verify the transfer-window club update (import route, mode "update").
 *
 * Two parts:
 *
 *  1. Unit checks of planClubUpdates() against hand-built pools, covering the
 *     cases that decide whether the pass is safe: shared names, missing
 *     players, an absent Liga column, repeated rows, accented spellings.
 *
 *  2. A dry run of the real spreadsheet against the real pool of a league,
 *     which reports what an upload WOULD do without writing anything.
 *
 * Usage:
 *   npx tsx scripts/verify-club-update.ts                 # unit checks only
 *   npx tsx scripts/verify-club-update.ts <leagueId> <file.xlsx>   # + dry run
 */

import { readFile } from 'fs/promises'
import * as XLSX from 'xlsx'
import { supabaseAdmin } from '../src/lib/supabase'
import {
  planClubUpdates,
  type ClubUpdateRow,
  type PoolPlayerRef,
} from '../src/lib/draft-players'

let failures = 0

function check(label: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual)
  const e = JSON.stringify(expected)
  if (a === e) {
    console.log(`  ✅ ${label}`)
  } else {
    failures++
    console.log(`  ❌ ${label}\n       expected ${e}\n       actual   ${a}`)
  }
}

function player(id: string, name: string, surname: string,
                club: string | null, league: string | null = null): PoolPlayerRef {
  return { id, name, surname, club, football_league: league }
}

function row(name: string, club: string, liga?: string): ClubUpdateRow {
  return liga === undefined
    ? { 'Imię i Nazwisko': name, Klub: club }
    : { 'Imię i Nazwisko': name, Klub: club, Liga: liga }
}

function unitChecks() {
  console.log('\n1. planClubUpdates() unit checks\n')

  // --- the happy path -------------------------------------------------------
  {
    const pool = [player('p1', 'Moise', 'Kean', 'Fiorentina', 'Włochy')]
    const plan = planClubUpdates([row('Moise Kean', 'Como', 'Włochy')], pool, 'WNC')
    check('a real move is planned',
      plan.updates, [{ id: 'p1', row: 2, club: 'Como', football_league: 'Włochy' }])
    check('  and nothing is skipped', [plan.skipped, plan.unchanged], [0, 0])
  }

  // --- a player who did not move -------------------------------------------
  {
    const pool = [player('p1', 'Moise', 'Kean', 'Como', 'Włochy')]
    const plan = planClubUpdates([row('Moise Kean', 'Como', 'Włochy')], pool, 'WNC')
    check('an unchanged player is not written',
      [plan.updates.length, plan.unchanged], [0, 1])
  }

  // --- a country change alone still counts ---------------------------------
  {
    const pool = [player('p1', 'Ayase', 'Ueda', 'Lille', 'Holandia')]
    const plan = planClubUpdates([row('Ayase Ueda', 'Lille', 'Francja')], pool, 'WNC')
    check('a league-only correction is planned',
      plan.updates, [{ id: 'p1', row: 2, club: 'Lille', football_league: 'Francja' }])
  }

  // --- shared name: must refuse, not guess ---------------------------------
  {
    const pool = [
      player('p1', 'Arthur', '', 'Bayer 04 Leverkusen', 'Niemcy'),
      player('p2', 'Arthur', '', 'Juventus', 'Włochy'),
    ]
    const plan = planClubUpdates([row('Arthur', 'SV Werder Bremen', 'Niemcy')], pool, 'WNC')
    check('an ambiguous name writes nothing', plan.updates, [])
    check('  and is skipped', plan.skipped, 1)
    check('  and names both clubs in the error',
      plan.errors[0].includes('Bayer 04 Leverkusen') && plan.errors[0].includes('Juventus'), true)
  }

  // --- a player who is not in the pool -------------------------------------
  {
    const plan = planClubUpdates([row('Nowy Zawodnik', 'Lech Poznan', 'Polska')], [], 'WNC')
    check('an unknown player is skipped, not inserted',
      [plan.updates.length, plan.skipped], [0, 1])
    check('  and is pointed at the insert mode',
      plan.errors[0].includes('Dodaj nowych'), true)
  }

  // --- no Liga column: the stored league must survive ----------------------
  {
    const pool = [player('p1', 'Mika', 'Godts', 'AFC Ajax', 'Holandia')]
    const plan = planClubUpdates([row('Mika Godts', 'Paris Saint-Germain')], pool, 'WNC')
    check('an absent Liga column leaves football_league alone',
      plan.updates, [{ id: 'p1', row: 2, club: 'Paris Saint-Germain' }])
  }

  // --- an empty Liga cell in a file that HAS the column ---------------------
  {
    const pool = [player('p1', 'Mika', 'Godts', 'AFC Ajax', 'Holandia')]
    const plan = planClubUpdates(
      [row('Someone Else', 'Lille', 'Francja'), row('Mika Godts', 'PSG', '')],
      [...pool, player('p2', 'Someone', 'Else', 'Lille', 'Francja')],
      'WNC'
    )
    check('a blank Liga cell clears the league when the column exists',
      plan.updates, [{ id: 'p1', row: 3, club: 'PSG', football_league: null }])
  }

  // --- the same player twice ------------------------------------------------
  {
    const pool = [player('p1', 'Moise', 'Kean', 'Fiorentina', 'Włochy')]
    const plan = planClubUpdates(
      [row('Moise Kean', 'Como', 'Włochy'), row('Moise Kean', 'Inter', 'Włochy')],
      pool, 'WNC'
    )
    check('a repeated player is written once', plan.updates.length, 1)
    check('  taking the first row', plan.updates[0].club, 'Como')
    check('  and the repeat is skipped', plan.skipped, 1)
  }

  // --- accents ---------------------------------------------------------------
  {
    const pool = [player('p1', 'Luka', 'Modrić', 'AC Milan', 'Włochy')]
    const plan = planClubUpdates([row('Luka Modric', 'Real Madrid', 'Hiszpania')], pool, 'WNC')
    check('an ASCII spelling matches an accented pool name', plan.updates.length, 1)
  }

  // --- junk rows -------------------------------------------------------------
  {
    const plan = planClubUpdates(
      [{ 'Imię i Nazwisko': '', Klub: 'Como' }, { 'Imię i Nazwisko': 'X', Klub: '' }],
      [], 'WNC'
    )
    check('rows missing a name or club are skipped', [plan.updates.length, plan.skipped], [0, 2])
  }

  // --- the guarantee that matters -------------------------------------------
  {
    const pool = [player('p1', 'Moise', 'Kean', 'Fiorentina', 'Włochy')]
    const plan = planClubUpdates([row('Moise Kean', 'Como', 'Włochy')], pool, 'WNC')
    const written = Object.keys(plan.updates[0]).sort()
    check('only id/row/club/football_league are ever written',
      written, ['club', 'football_league', 'id', 'row'])
  }
}

async function dryRun(leagueId: string, filePath: string) {
  console.log(`\n2. Dry run: ${filePath}\n`)

  const { data: league } = await supabaseAdmin
    .from('leagues').select('name').eq('id', leagueId).single()
  if (!league) {
    console.log(`  ❌ league ${leagueId} not found`)
    failures++
    return
  }

  const pool: PoolPlayerRef[] = []
  const PAGE = 1000
  for (let from = 0; ; from += PAGE) {
    const { data: page, error } = await supabaseAdmin
      .from('players')
      .select('id, name, surname, club, football_league')
      .eq('league_id', leagueId)
      .range(from, from + PAGE - 1)
    if (error) {
      console.log(`  ❌ ${error.message}`)
      failures++
      return
    }
    pool.push(...((page ?? []) as PoolPlayerRef[]))
    if (!page || page.length < PAGE) break
  }

  const wb = XLSX.read(await readFile(filePath))
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]) as ClubUpdateRow[]

  const plan = planClubUpdates(rows, pool, league.name)

  console.log(`  league        : ${league.name} (${pool.length} players)`)
  console.log(`  file rows     : ${rows.length}`)
  console.log(`  would update  : ${plan.updates.length}`)
  console.log(`  unchanged     : ${plan.unchanged}`)
  console.log(`  skipped       : ${plan.skipped}`)

  // Everything the update would touch must still be owned by whoever owns it.
  const ids = plan.updates.map(u => u.id)
  const owned: Record<string, unknown>[] = []
  for (let i = 0; i < ids.length; i += 200) {
    const { data } = await supabaseAdmin
      .from('players')
      .select('id, manager_id, total_goals, league_id')
      .in('id', ids.slice(i, i + 200))
    owned.push(...(data ?? []))
  }
  const foreign = owned.filter(p => p.league_id !== leagueId)
  console.log(`  of those, owned by a manager: ${owned.filter(p => p.manager_id).length}`)
  check('every targeted player belongs to this league', foreign.length, 0)

  if (plan.errors.length) {
    console.log(`\n  first ${Math.min(8, plan.errors.length)} of ${plan.errors.length} messages:`)
    for (const e of plan.errors.slice(0, 8)) console.log(`    - ${e}`)
  }
}

async function main() {
  console.log('🔍 Verifying transfer-window club update')
  unitChecks()

  const [leagueId, filePath] = process.argv.slice(2)
  if (leagueId && filePath) {
    await dryRun(leagueId, filePath)
  } else {
    console.log('\n2. Dry run skipped (pass <leagueId> <file.xlsx> to run one)')
  }

  console.log(failures === 0 ? '\n✅ All checks passed\n' : `\n❌ ${failures} check(s) failed\n`)
  process.exit(failures === 0 ? 0 : 1)
}

main()

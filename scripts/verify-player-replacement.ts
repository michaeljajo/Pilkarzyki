/**
 * Verify the one-for-one player replacement (Transfery → "Zmiana zawodnika").
 *
 * Two parts:
 *
 *  1. Unit checks of validateReplacement() and mapReplacementRpcError() — the
 *     rules that decide whether a replacement may go ahead, and how a database
 *     exception reaches the admin as a sentence they can act on.
 *
 *  2. A read-only probe of a league: is migration 034 applied (is the
 *     admin_replace_player function there), is a draft blocking replacements,
 *     and how large is the free-agent pool the picker will show. Nothing is
 *     written — the probe calls the RPC with ids that cannot exist, which
 *     raises LEAGUE_NOT_FOUND before the function touches a single row.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/verify-player-replacement.ts
 *   npx tsx --env-file=.env.local scripts/verify-player-replacement.ts <leagueId>
 */

import {
  validateReplacement,
  mapReplacementRpcError,
  replacementNote,
  type ReplacementCheck,
  type ReplacementPlayerRef,
} from '../src/lib/player-replacement'

/** The HTTP status a check would produce; 200 when it allows the replacement. */
const statusOf = (check: ReplacementCheck) => (check.ok ? 200 : check.status)

const LEAGUE = '11111111-1111-1111-1111-111111111111'
const OTHER_LEAGUE = '22222222-2222-2222-2222-222222222222'
const MANAGER = '33333333-3333-3333-3333-333333333333'
const OTHER_MANAGER = '44444444-4444-4444-4444-444444444444'
// A uuid that no row can carry, used for the read-only RPC probe.
const NOWHERE = '00000000-0000-0000-0000-000000000000'

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

function player(
  id: string,
  overrides: Partial<ReplacementPlayerRef> = {}
): ReplacementPlayerRef {
  return {
    id,
    name: 'Jan',
    surname: `Kowalski-${id}`,
    position: 'Forward',
    club: 'FC Test',
    football_league: 'Ekstraklasa',
    manager_id: null,
    league_id: LEAGUE,
    ...overrides,
  }
}

function unitChecks() {
  console.log('\n1. validateReplacement()')

  const owned = player('out', { manager_id: MANAGER })
  const free = player('in')

  check(
    'a squad player for a free agent is allowed',
    validateReplacement({ leagueId: LEAGUE, managerId: MANAGER, playerOut: owned, playerIn: free }),
    { ok: true }
  )

  check(
    'an unknown outgoing player is rejected',
    validateReplacement({ leagueId: LEAGUE, managerId: MANAGER, playerOut: null, playerIn: free }).ok,
    false
  )

  check(
    'an unknown incoming player is rejected',
    validateReplacement({ leagueId: LEAGUE, managerId: MANAGER, playerOut: owned, playerIn: null }).ok,
    false
  )

  check(
    'the same player on both sides is rejected',
    validateReplacement({
      leagueId: LEAGUE,
      managerId: MANAGER,
      playerOut: owned,
      playerIn: player('out', { manager_id: MANAGER }),
    }),
    { ok: false, status: 400, error: 'Wybierz dwóch różnych zawodników.' }
  )

  check(
    'an incoming player from another league is rejected',
    statusOf(validateReplacement({
      leagueId: LEAGUE,
      managerId: MANAGER,
      playerOut: owned,
      playerIn: player('in', { league_id: OTHER_LEAGUE }),
    })),
    400
  )

  check(
    'an outgoing player from another league is rejected',
    statusOf(validateReplacement({
      leagueId: LEAGUE,
      managerId: MANAGER,
      playerOut: player('out', { manager_id: MANAGER, league_id: OTHER_LEAGUE }),
      playerIn: free,
    })),
    400
  )

  check(
    "an outgoing player from another manager's squad is rejected",
    statusOf(validateReplacement({
      leagueId: LEAGUE,
      managerId: MANAGER,
      playerOut: player('out', { manager_id: OTHER_MANAGER }),
      playerIn: free,
    })),
    400
  )

  check(
    'an unowned outgoing player is rejected',
    statusOf(validateReplacement({
      leagueId: LEAGUE,
      managerId: MANAGER,
      playerOut: player('out', { manager_id: null }),
      playerIn: free,
    })),
    400
  )

  check(
    'an already-owned incoming player is rejected',
    statusOf(validateReplacement({
      leagueId: LEAGUE,
      managerId: MANAGER,
      playerOut: owned,
      playerIn: player('in', { manager_id: OTHER_MANAGER }),
    })),
    409
  )

  console.log('\n2. replacementNote() / mapReplacementRpcError()')

  check(
    'the audit note names both sides',
    replacementNote(
      player('out', { name: 'Robert', surname: 'Lewandowski', manager_id: MANAGER }),
      player('in', { name: 'Lamine', surname: 'Yamal' })
    ),
    'Zmiana zawodnika: Robert Lewandowski → Lamine Yamal'
  )

  check(
    'a raised PLAYER_TAKEN becomes a 409 the admin can act on',
    mapReplacementRpcError('...PLAYER_TAKEN...').status,
    409
  )

  check(
    'a raised DRAFT_IN_PROGRESS becomes a 409',
    mapReplacementRpcError('...DRAFT_IN_PROGRESS...').status,
    409
  )

  check(
    'an unrecognised database error stays a 500',
    mapReplacementRpcError('deadlock detected').status,
    500
  )
}

async function dbProbe(leagueId: string) {
  // Imported lazily so the unit checks run without any environment at all.
  const { supabaseAdmin } = await import('../src/lib/supabase')

  console.log('\n3. Database readiness')

  const { data: league } = await supabaseAdmin
    .from('leagues')
    .select('id, name, is_active')
    .eq('id', leagueId)
    .maybeSingle()

  if (!league) {
    failures++
    console.log(`  ❌ league ${leagueId} not found`)
    return
  }
  console.log(`  ℹ️  league: ${league.name} (aktywna: ${league.is_active ? 'tak' : 'nie'})`)

  // Probe the RPC with ids that match nothing: it raises LEAGUE_NOT_FOUND on
  // its first statement, so this neither writes nor depends on real data.
  const { error } = await supabaseAdmin.rpc('admin_replace_player', {
    p_league_id: NOWHERE,
    p_manager_id: NOWHERE,
    p_player_out: NOWHERE,
    p_player_in: LEAGUE,
    p_effective_from: new Date().toISOString(),
    p_created_by: null,
    p_notes: 'probe',
  })

  const message = error?.message ?? ''
  if (message.includes('LEAGUE_NOT_FOUND')) {
    console.log('  ✅ admin_replace_player is installed (migration 034 applied)')
  } else if (!error) {
    failures++
    console.log('  ❌ probe unexpectedly succeeded — the function did not validate its league')
  } else {
    failures++
    console.log(
      `  ❌ admin_replace_player not callable — apply supabase/migrations/034_add_player_replacement.sql\n       ${message}`
    )
  }

  const { data: drafts } = await supabaseAdmin
    .from('drafts')
    .select('kind, status')
    .eq('league_id', leagueId)
    .neq('status', 'finished')

  const blocking = (drafts ?? []).filter((d) => d.kind === 'midseason' || d.status === 'live')
  if (blocking.length > 0) {
    console.log(
      `  ⚠️  a draft is in flight (${blocking.map((d) => `${d.kind}/${d.status}`).join(', ')}) — replacements are blocked until it finishes`
    )
  } else {
    console.log('  ✅ no draft in flight — replacements are allowed')
  }

  const { count: freeAgents } = await supabaseAdmin
    .from('players')
    .select('id', { count: 'exact', head: true })
    .eq('league_id', leagueId)
    .is('manager_id', null)

  const { count: owned } = await supabaseAdmin
    .from('players')
    .select('id', { count: 'exact', head: true })
    .eq('league_id', leagueId)
    .not('manager_id', 'is', null)

  console.log(`  ℹ️  pool: ${freeAgents ?? 0} wolnych, ${owned ?? 0} w składach`)
}

async function main() {
  console.log('🔁 Verifying player replacement')
  unitChecks()

  const leagueId = process.argv[2]
  if (leagueId) {
    await dbProbe(leagueId)
  } else {
    console.log('\n3. Database readiness — skipped (pass a leagueId to run it)')
  }

  console.log(failures === 0 ? '\n✅ All checks passed' : `\n❌ ${failures} check(s) failed`)
  process.exit(failures === 0 ? 0 : 1)
}

main()

/**
 * Seed a test draft so the live-draft feature can be dry-run without N real
 * people. Creates (or reuses) a league, N fake managers (users + squads), an
 * unassigned player pool, and a draft row in 'setup'.
 *
 * Usage:
 *   npx tsx scripts/seed-test-draft.ts [leagueName] [managers] [poolSize]
 *
 * Defaults: leagueName="Draft Test League", managers=18, poolSize=200
 *
 * The created managers have clerk_id values like "test-draft-<n>" — they are
 * NOT real Clerk users, so they cannot sign in. Use them to exercise the draft
 * mechanics (start / pick via RPC / skip / undo / finalize). To test the UI as
 * different people, add real Clerk users as managers instead.
 */

import { supabaseAdmin } from '../src/lib/supabase'

const LEAGUE_NAME = process.argv[2] || 'Draft Test League'
const MANAGER_COUNT = Number(process.argv[3] || 18)
const POOL_SIZE = Number(process.argv[4] || 200)

const POSITIONS = ['Defender', 'Midfielder', 'Forward'] as const
const LEAGUES = ['Ekstraklasa', 'Premier League', 'La Liga', 'Bundesliga', 'Ligue 1', 'Serie A']
const CLUBS = ['Legia', 'Arsenal', 'Real Madryt', 'Bayern', 'PSG', 'Juventus', 'Barcelona', 'Liverpool', 'Milan']

function pick<T>(arr: readonly T[], i: number): T {
  return arr[i % arr.length]
}

async function main() {
  console.log(`\nSeeding test draft: league="${LEAGUE_NAME}", managers=${MANAGER_COUNT}, pool=${POOL_SIZE}\n`)

  // 1. Admin user + league --------------------------------------------------
  const adminClerkId = 'test-draft-admin'
  const { data: adminUser } = await supabaseAdmin
    .from('users')
    .upsert({ clerk_id: adminClerkId, email: 'draft-admin@test.local', first_name: 'Draft', last_name: 'Admin' }, { onConflict: 'clerk_id' })
    .select('id')
    .single()

  let { data: league } = await supabaseAdmin
    .from('leagues')
    .select('id, name')
    .eq('name', LEAGUE_NAME)
    .maybeSingle()

  if (!league) {
    const { data: created, error } = await supabaseAdmin
      .from('leagues')
      .insert({ name: LEAGUE_NAME, admin_id: adminUser!.id, season: '2026/2027', current_gameweek: 1, max_managers: MANAGER_COUNT, is_active: true })
      .select('id, name')
      .single()
    if (error) throw error
    league = created
    console.log(`✅ Created league ${league.id}`)
  } else {
    console.log(`↺ Reusing league ${league.id}`)
  }

  // Make admin a league admin (junction table) if present.
  await supabaseAdmin.from('league_admins').upsert(
    { league_id: league.id, user_id: adminUser!.id },
    { onConflict: 'league_id,user_id' }
  ).then(() => {}, () => {})

  // 2. Fake managers + squads ----------------------------------------------
  for (let i = 1; i <= MANAGER_COUNT; i++) {
    const clerkId = `test-draft-${i}`
    const { data: u } = await supabaseAdmin
      .from('users')
      .upsert({ clerk_id: clerkId, email: `draft-mgr-${i}@test.local`, first_name: 'Menedżer', last_name: String(i) }, { onConflict: 'clerk_id' })
      .select('id')
      .single()

    await supabaseAdmin
      .from('squads')
      .upsert({ league_id: league.id, manager_id: u!.id, team_name: `Drużyna ${i}` }, { onConflict: 'manager_id,league_id' })
  }
  console.log(`✅ ${MANAGER_COUNT} managers + squads ready`)

  // 3. Player pool (unassigned) --------------------------------------------
  const { count: existingPlayers } = await supabaseAdmin
    .from('players')
    .select('id', { count: 'exact', head: true })
    .eq('league', league.name)

  if ((existingPlayers || 0) < POOL_SIZE) {
    const rows = []
    for (let i = (existingPlayers || 0) + 1; i <= POOL_SIZE; i++) {
      rows.push({
        name: `Zawodnik`,
        surname: `Nr${i}`,
        league: league.name,
        position: pick(POSITIONS, i),
        club: pick(CLUBS, i),
        football_league: pick(LEAGUES, i),
        manager_id: null,
        total_goals: 0,
      })
    }
    // Insert in chunks.
    for (let i = 0; i < rows.length; i += 100) {
      const chunk = rows.slice(i, i + 100)
      const { error } = await supabaseAdmin.from('players').insert(chunk)
      if (error) throw error
    }
    console.log(`✅ Player pool topped up to ${POOL_SIZE}`)
  } else {
    console.log(`↺ Player pool already has ${existingPlayers} players`)
  }

  // 4. Draft row (setup) ----------------------------------------------------
  const { data: draft } = await supabaseAdmin
    .from('drafts')
    .upsert({ league_id: league.id }, { onConflict: 'league_id' })
    .select('id, status')
    .single()

  console.log(`✅ Draft ${draft!.id} (status=${draft!.status})`)
  console.log('\nDone. Open /dashboard/leagues/' + league.id + '/draft as the admin to configure and start.\n')
  process.exit(0)
}

main().catch(err => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})

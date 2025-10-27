import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function purgeDatabase() {
  console.log('⚠️  WARNING: This will DELETE ALL DATA from the database!')
  console.log('⏳ Starting database purge...\n')

  try {
    // Step 1: Clear Cup Tournament Data
    console.log('1️⃣  Deleting cup tournament data...')

    const { error: e1 } = await supabase.from('cup_group_standings').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (e1) console.error('  ❌ cup_group_standings:', e1.message)
    else console.log('  ✅ cup_group_standings cleared')

    const { error: e2 } = await supabase.from('cup_lineups').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (e2) console.error('  ❌ cup_lineups:', e2.message)
    else console.log('  ✅ cup_lineups cleared')

    const { error: e3 } = await supabase.from('cup_matches').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (e3) console.error('  ❌ cup_matches:', e3.message)
    else console.log('  ✅ cup_matches cleared')

    const { error: e4 } = await supabase.from('cup_gameweeks').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (e4) console.error('  ❌ cup_gameweeks:', e4.message)
    else console.log('  ✅ cup_gameweeks cleared')

    const { error: e5 } = await supabase.from('cup_groups').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (e5) console.error('  ❌ cup_groups:', e5.message)
    else console.log('  ✅ cup_groups cleared')

    const { error: e6 } = await supabase.from('cups').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (e6) console.error('  ❌ cups:', e6.message)
    else console.log('  ✅ cups cleared')

    // Step 2: Clear League Data
    console.log('\n2️⃣  Deleting league data...')

    const { error: e7 } = await supabase.from('results').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (e7) console.error('  ❌ results:', e7.message)
    else console.log('  ✅ results cleared')

    const { error: e8 } = await supabase.from('lineups').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (e8) console.error('  ❌ lineups:', e8.message)
    else console.log('  ✅ lineups cleared')

    const { error: e9 } = await supabase.from('matches').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (e9) console.error('  ❌ matches:', e9.message)
    else console.log('  ✅ matches cleared')

    const { error: e10 } = await supabase.from('gameweeks').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (e10) console.error('  ❌ gameweeks:', e10.message)
    else console.log('  ✅ gameweeks cleared')

    const { error: e11 } = await supabase.from('players').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (e11) console.error('  ❌ players:', e11.message)
    else console.log('  ✅ players cleared')

    const { error: e12 } = await supabase.from('squads').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (e12) console.error('  ❌ squads:', e12.message)
    else console.log('  ✅ squads cleared')

    const { error: e13 } = await supabase.from('leagues').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (e13) console.error('  ❌ leagues:', e13.message)
    else console.log('  ✅ leagues cleared')

    // Step 3: Clear User Data
    console.log('\n3️⃣  Deleting user data...')

    const { error: e14 } = await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (e14) console.error('  ❌ users:', e14.message)
    else console.log('  ✅ users cleared')

    // Verify all tables are empty
    console.log('\n4️⃣  Verifying database is empty...')

    const tables = [
      'cups', 'cup_groups', 'cup_gameweeks', 'cup_matches',
      'cup_lineups', 'cup_group_standings', 'results', 'lineups',
      'matches', 'gameweeks', 'players', 'squads', 'leagues', 'users'
    ]

    let allEmpty = true
    for (const table of tables) {
      const { count } = await supabase.from(table).select('*', { count: 'exact', head: true })
      if (count && count > 0) {
        console.log(`  ⚠️  ${table}: ${count} rows remaining`)
        allEmpty = false
      } else {
        console.log(`  ✅ ${table}: 0 rows`)
      }
    }

    if (allEmpty) {
      console.log('\n✅ Database purge completed successfully!')
    } else {
      console.log('\n⚠️  Some tables still have data - check RLS policies or foreign key constraints')
    }

  } catch (error) {
    console.error('\n❌ Error during purge:', error)
    process.exit(1)
  }
}

// Run the purge
purgeDatabase()

import { supabaseAdmin } from '../src/lib/supabase'

async function deleteWNCCupData() {
  const leagueId = '8b6d933e-e011-4fd5-8bc0-8344e2841192' // WNC League

  // Get league info
  const { data: league } = await supabaseAdmin
    .from('leagues')
    .select('id, name, season')
    .eq('id', leagueId)
    .single()

  if (!league) {
    console.log('League not found')
    process.exit(1)
  }

  console.log(`\n${'='.repeat(60)}`)
  console.log('DELETING CUP DATA')
  console.log(`${'='.repeat(60)}`)
  console.log(`\nLeague: ${league.name} (${league.season})`)
  console.log(`ID: ${league.id}`)

  // Get cup ID
  const { data: cup } = await supabaseAdmin
    .from('cups')
    .select('id, name')
    .eq('league_id', leagueId)
    .single()

  if (!cup) {
    console.log('\nNo cup found for this league. Nothing to delete.')
    process.exit(0)
  }

  console.log(`\nCup: ${cup.name} (ID: ${cup.id})`)

  // Get cup gameweek IDs for deletion
  const { data: cupGameweeks } = await supabaseAdmin
    .from('cup_gameweeks')
    .select('id')
    .eq('cup_id', cup.id)

  const cupGameweekIds = cupGameweeks?.map(cgw => cgw.id) || []

  console.log(`\nFound ${cupGameweekIds.length} cup gameweeks`)
  console.log('\nStarting deletion...\n')

  // Delete in correct order to respect foreign key constraints

  // 1. Delete cup lineups
  if (cupGameweekIds.length > 0) {
    const { error: lineupsError, count: lineupsCount } = await supabaseAdmin
      .from('cup_lineups')
      .delete({ count: 'exact' })
      .in('cup_gameweek_id', cupGameweekIds)

    if (lineupsError) {
      console.error(`✗ Error deleting cup lineups: ${lineupsError.message}`)
    } else {
      console.log(`✓ Deleted ${lineupsCount || 0} cup lineups`)
    }
  }

  // 2. Delete cup matches
  if (cupGameweekIds.length > 0) {
    const { error: matchesError, count: matchesCount } = await supabaseAdmin
      .from('cup_matches')
      .delete({ count: 'exact' })
      .in('cup_gameweek_id', cupGameweekIds)

    if (matchesError) {
      console.error(`✗ Error deleting cup matches: ${matchesError.message}`)
    } else {
      console.log(`✓ Deleted ${matchesCount || 0} cup matches`)
    }
  }

  // 3. Delete cup gameweeks
  const { error: gameweeksError, count: gameweeksCount } = await supabaseAdmin
    .from('cup_gameweeks')
    .delete({ count: 'exact' })
    .eq('cup_id', cup.id)

  if (gameweeksError) {
    console.error(`✗ Error deleting cup gameweeks: ${gameweeksError.message}`)
  } else {
    console.log(`✓ Deleted ${gameweeksCount || 0} cup gameweeks`)
  }

  // 4. Delete cup groups
  const { error: groupsError, count: groupsCount } = await supabaseAdmin
    .from('cup_groups')
    .delete({ count: 'exact' })
    .eq('cup_id', cup.id)

  if (groupsError) {
    console.error(`✗ Error deleting cup groups: ${groupsError.message}`)
  } else {
    console.log(`✓ Deleted ${groupsCount || 0} cup group entries`)
  }

  // 5. Delete the cup itself
  const { error: cupError } = await supabaseAdmin
    .from('cups')
    .delete()
    .eq('id', cup.id)

  if (cupError) {
    console.error(`✗ Error deleting cup: ${cupError.message}`)
  } else {
    console.log(`✓ Deleted cup "${cup.name}"`)
  }

  console.log(`\n${'='.repeat(60)}`)
  console.log('✅ CUP DATA DELETION COMPLETE!')
  console.log(`${'='.repeat(60)}`)
  console.log(`\nNext steps:`)
  console.log(`1. Go to http://localhost:3000/dashboard/admin/migration`)
  console.log(`2. Enter League ID: ${leagueId}`)
  console.log(`3. Upload your migration Excel file`)
  console.log(`4. Click "Start Import"`)
  console.log(`5. Check console logs for detailed import information`)
  console.log(`${'='.repeat(60)}\n`)
}

deleteWNCCupData()
  .then(() => {
    process.exit(0)
  })
  .catch(err => {
    console.error('Error:', err)
    process.exit(1)
  })

import { supabaseAdmin } from '../src/lib/supabase'
import * as readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve))
}

async function deleteAllCupData() {
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
  console.log('WARNING: DESTRUCTIVE OPERATION')
  console.log(`${'='.repeat(60)}`)
  console.log(`\nThis will DELETE ALL cup-related data for league:`)
  console.log(`  Name: ${league.name}`)
  console.log(`  Season: ${league.season}`)
  console.log(`  ID: ${league.id}`)
  console.log(`\nThe following data will be PERMANENTLY DELETED:`)
  console.log(`  - All cup gameweeks`)
  console.log(`  - All cup matches`)
  console.log(`  - All cup lineups`)
  console.log(`  - All cup groups`)
  console.log(`  - The cup itself`)
  console.log(`\nNOTE: This will NOT delete:`)
  console.log(`  - League gameweeks`)
  console.log(`  - League matches`)
  console.log(`  - League lineups`)
  console.log(`  - Results (player goals)`)
  console.log(`  - Players`)
  console.log(`  - Squads`)
  console.log(`\n${' ='.repeat(60)}`)

  const answer = await question('\nAre you ABSOLUTELY SURE you want to continue? Type "DELETE" to confirm: ')

  if (answer.trim() !== 'DELETE') {
    console.log('\nOperation cancelled.')
    rl.close()
    process.exit(0)
  }

  console.log('\n\nStarting deletion...\n')

  // Get cup ID
  const { data: cup } = await supabaseAdmin
    .from('cups')
    .select('id, name')
    .eq('league_id', leagueId)
    .single()

  if (!cup) {
    console.log('No cup found for this league. Nothing to delete.')
    rl.close()
    process.exit(0)
  }

  console.log(`Cup: ${cup.name} (ID: ${cup.id})`)

  // Get cup gameweek IDs for deletion
  const { data: cupGameweeks } = await supabaseAdmin
    .from('cup_gameweeks')
    .select('id')
    .eq('cup_id', cup.id)

  const cupGameweekIds = cupGameweeks?.map(cgw => cgw.id) || []

  console.log(`\nFound ${cupGameweekIds.length} cup gameweeks`)

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
  console.log('Cup data deletion complete!')
  console.log(`${'='.repeat(60)}`)
  console.log(`\nYou can now re-import the cup data using the migration tool.`)
  console.log(`The new import will use the league isolation safeguards.`)
  console.log(`${'='.repeat(60)}\n`)

  rl.close()
}

deleteAllCupData()
  .then(() => {
    process.exit(0)
  })
  .catch(err => {
    console.error('Error:', err)
    rl.close()
    process.exit(1)
  })

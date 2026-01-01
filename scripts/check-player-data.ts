import { supabaseAdmin } from '../src/lib/supabase'

async function checkPlayerData() {
  console.log('=== Player Data Investigation ===\n')

  // 1. Get all leagues
  const { data: leagues, error: leaguesError } = await supabaseAdmin
    .from('leagues')
    .select('id, name, season')
    .order('name')

  if (leaguesError) {
    console.error('Error fetching leagues:', leaguesError)
    return
  }

  console.log('📋 Leagues in database:')
  leagues?.forEach(league => {
    console.log(`  - ${league.name} (${league.season}) [ID: ${league.id}]`)
  })
  console.log()

  // 2. Get player counts by league
  const { data: players, error: playersError } = await supabaseAdmin
    .from('players')
    .select('id, name, surname, league, manager_id')

  if (playersError) {
    console.error('Error fetching players:', playersError)
    return
  }

  console.log(`👤 Total players in database: ${players?.length || 0}\n`)

  // Group by league
  const byLeague = new Map<string, any[]>()
  players?.forEach(player => {
    const leaguePlayers = byLeague.get(player.league) || []
    leaguePlayers.push(player)
    byLeague.set(player.league, leaguePlayers)
  })

  console.log('📊 Players by league:')
  byLeague.forEach((leaguePlayers, leagueName) => {
    const withManager = leaguePlayers.filter(p => p.manager_id).length
    const withoutManager = leaguePlayers.filter(p => !p.manager_id).length
    console.log(`  ${leagueName}:`)
    console.log(`    Total: ${leaguePlayers.length}`)
    console.log(`    With manager: ${withManager}`)
    console.log(`    Without manager: ${withoutManager}`)
  })
  console.log()

  // 3. Check for leagues without players
  console.log('⚠️  League-Player mismatch check:')
  leagues?.forEach(league => {
    const playerCount = byLeague.get(league.name)?.length || 0
    if (playerCount === 0) {
      console.log(`  ⚠️  League "${league.name}" has NO players!`)
    }
  })
  console.log()

  // 4. Check for players with league names that don't match any league
  const validLeagueNames = new Set(leagues?.map(l => l.name) || [])
  const orphanedLeagues = Array.from(byLeague.keys()).filter(
    leagueName => !validLeagueNames.has(leagueName)
  )

  if (orphanedLeagues.length > 0) {
    console.log('⚠️  Players with invalid league names:')
    orphanedLeagues.forEach(leagueName => {
      const count = byLeague.get(leagueName)?.length || 0
      console.log(`  "${leagueName}": ${count} players`)
      console.log('  Sample players:')
      byLeague.get(leagueName)?.slice(0, 5).forEach(p => {
        console.log(`    - ${p.name} ${p.surname}`)
      })
    })
    console.log()
  }

  // 5. Show sample players from each league
  console.log('📝 Sample players from each league:')
  byLeague.forEach((leaguePlayers, leagueName) => {
    console.log(`  ${leagueName} (showing first 5):`)
    leaguePlayers.slice(0, 5).forEach(p => {
      const managerStatus = p.manager_id ? '✓ Has manager' : '✗ No manager'
      console.log(`    - ${p.name} ${p.surname} [${managerStatus}]`)
    })
  })
}

checkPlayerData()
  .then(() => {
    console.log('\n✅ Investigation complete')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Investigation failed:', error)
    process.exit(1)
  })

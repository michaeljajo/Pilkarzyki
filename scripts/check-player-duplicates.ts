import { supabaseAdmin } from '../src/lib/supabase'

async function checkPlayerDuplicates() {
  console.log('=== Checking Player-League Assignment ===\n')

  // Check players table schema
  const { data: sample } = await supabaseAdmin
    .from('players')
    .select('*')
    .limit(1)
    .single()

  console.log('Players Table Columns:', Object.keys(sample || {}))
  console.log('')

  // Get all players
  const { data: allPlayers } = await supabaseAdmin
    .from('players')
    .select('id, name, surname, league, manager_id')
    .order('surname')

  if (!allPlayers) {
    console.log('No players found')
    return
  }

  console.log(`Total players in database: ${allPlayers.length}\n`)

  // Find duplicate player names
  const nameMap = new Map<string, any[]>()

  allPlayers.forEach(player => {
    const fullName = `${player.name} ${player.surname}`
    if (!nameMap.has(fullName)) {
      nameMap.set(fullName, [])
    }
    nameMap.get(fullName)!.push(player)
  })

  console.log('=== Duplicate Player Names ===\n')
  let duplicateCount = 0

  for (const [name, players] of nameMap.entries()) {
    if (players.length > 1) {
      duplicateCount++
      console.log(`${name}: ${players.length} instances`)
      players.forEach(p => {
        console.log(`  - ID: ${p.id.substring(0, 8)}... | League: "${p.league || 'NULL'}" | Manager: ${p.manager_id?.substring(0, 8) || 'NULL'}...`)
      })
      console.log('')
    }
  }

  console.log(`\nDuplicate player names: ${duplicateCount}`)
  console.log(`Unique player names: ${nameMap.size}`)

  // Check leagues in database
  const { data: leagues } = await supabaseAdmin
    .from('leagues')
    .select('id, name, season')

  console.log('\n=== Leagues in Database ===')
  leagues?.forEach(league => {
    const leaguePlayers = allPlayers.filter(p => p.league === league.name)
    console.log(`${league.name} (${league.season}): ${leaguePlayers.length} players`)
  })

  // Players without league assignment
  const noLeaguePlayers = allPlayers.filter(p => !p.league || p.league === '')
  if (noLeaguePlayers.length > 0) {
    console.log(`\n⚠️  Players with no league: ${noLeaguePlayers.length}`)
  }

  console.log('\n=== Done ===')
}

checkPlayerDuplicates().catch(console.error)

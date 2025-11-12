import { supabaseAdmin } from '../src/lib/supabase'

async function createMissingCupResults() {
  console.log('=== Creating Missing Cup Results ===\n')

  // Get all cup lineups
  const { data: allCupLineups } = await supabaseAdmin
    .from('cup_lineups')
    .select(`
      id,
      manager_id,
      cup_gameweek_id,
      player_ids,
      cup_gameweeks!inner(
        cup_week,
        league_gameweek_id
      )
    `)

  if (!allCupLineups) {
    console.log('No cup lineups found')
    return
  }

  console.log(`Found ${allCupLineups.length} cup lineups\n`)

  let resultsCreated = 0
  let alreadyExist = 0
  let errors = 0

  for (const lineup of allCupLineups) {
    if (!lineup.player_ids || lineup.player_ids.length === 0) continue

    const cupGameweek = Array.isArray(lineup.cup_gameweeks)
      ? lineup.cup_gameweeks[0]
      : lineup.cup_gameweeks

    if (!cupGameweek) continue

    for (const playerId of lineup.player_ids) {
      // Check if result exists
      const { data: existingResult } = await supabaseAdmin
        .from('results')
        .select('id')
        .eq('player_id', playerId)
        .eq('gameweek_id', cupGameweek.league_gameweek_id)
        .single()

      if (existingResult) {
        alreadyExist++
        continue
      }

      // Get player info for better logging
      const { data: player } = await supabaseAdmin
        .from('players')
        .select('name, surname')
        .eq('id', playerId)
        .single()

      const playerName = player ? `${player.name} ${player.surname}` : playerId

      // Result doesn't exist - create it
      const { error } = await supabaseAdmin
        .from('results')
        .insert({
          gameweek_id: cupGameweek.league_gameweek_id,
          player_id: playerId,
          goals: 0,
          has_played: true  // Mark as played since they were in a cup lineup
        })

      if (error) {
        console.log(`❌ Failed to create result for ${playerName} in CW${cupGameweek.cup_week}: ${error.message}`)
        errors++
      } else {
        console.log(`✓ Created result for ${playerName} in Cup Week ${cupGameweek.cup_week}`)
        resultsCreated++
      }
    }
  }

  console.log('\n=== Summary ===')
  console.log(`Results created: ${resultsCreated}`)
  console.log(`Results already exist: ${alreadyExist}`)
  console.log(`Errors: ${errors}`)
  console.log('\n=== Done ===')
}

createMissingCupResults().catch(console.error)

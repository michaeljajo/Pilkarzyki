import { supabaseAdmin } from '../src/lib/supabase'
import * as XLSX from 'xlsx'
import * as path from 'path'
import {
  parseCupFixtures,
  parseManagersMapping,
  parseCupGameweeks,
  type CupFixtureRow,
  type ManagersMappingRow,
  type CupGameweekRow
} from '../src/utils/migration-parser'

async function repairCupResults() {
  console.log('=== Repairing Cup Results from Migration File ===\n')

  // Read the migration Excel file
  const migrationFile = path.join(__dirname, '../migrations/migration-template (1).xlsx')
  const workbook = XLSX.readFile(migrationFile)

  // Parse managers mapping
  const managersMappingData = XLSX.utils.sheet_to_json(
    workbook.Sheets['Managers_Mapping']
  ) as ManagersMappingRow[]
  const mm = parseManagersMapping(managersMappingData)

  if (mm.errors.length > 0) {
    console.error('Errors parsing managers mapping:', mm.errors)
    return
  }

  console.log(`Parsed ${mm.data.size} team mappings\n`)

  // Parse cup gameweeks
  const cupGameweeksData = XLSX.utils.sheet_to_json(
    workbook.Sheets['Cup_Gameweeks']
  ) as CupGameweekRow[]
  const cgw = parseCupGameweeks(cupGameweeksData)

  if (cgw.errors.length > 0) {
    console.error('Errors parsing cup gameweeks:', cgw.errors)
    return
  }

  console.log(`Parsed ${cgw.data.length} cup gameweeks\n`)

  // Parse cup fixtures
  const cupFixturesData = XLSX.utils.sheet_to_json(
    workbook.Sheets['Cup_Fixtures_And_Results']
  ) as CupFixtureRow[]
  const cf = parseCupFixtures(cupFixturesData, mm.data)

  if (cf.errors.length > 0) {
    console.error('Errors parsing cup fixtures:', cf.errors)
    return
  }

  console.log(`Parsed ${cf.data.length} cup fixtures\n`)

  // Get manager ID mapping from database
  const { data: users } = await supabaseAdmin
    .from('users')
    .select('id, clerk_id')

  const { data: clerkEmails } = await supabaseAdmin
    .from('users')
    .select('clerk_id')

  // We need Clerk to get emails... let me use a different approach
  // Get all squads and their manager_ids
  const { data: squads } = await supabaseAdmin
    .from('squads')
    .select('manager_id, team_name, league_id')

  const teamNameToManagerId = new Map<string, string>()
  squads?.forEach(squad => {
    if (squad.team_name) {
      teamNameToManagerId.set(squad.team_name, squad.manager_id)
    }
  })

  console.log(`Found ${teamNameToManagerId.size} team-manager mappings from squads\n`)

  // Get gameweek mappings
  const { data: gameweeks } = await supabaseAdmin
    .from('gameweeks')
    .select('id, week, league_id')
    .order('week')

  const { data: cupGameweeks } = await supabaseAdmin
    .from('cup_gameweeks')
    .select('id, cup_week, league_gameweek_id')
    .order('cup_week')

  const cupWeekToLeagueGameweek = new Map<number, string>()
  cupGameweeks?.forEach(cgw => {
    cupWeekToLeagueGameweek.set(cgw.cup_week, cgw.league_gameweek_id)
  })

  console.log(`Mapped ${cupWeekToLeagueGameweek.size} cup weeks to league gameweeks\n`)

  // Get all players
  const { data: players } = await supabaseAdmin
    .from('players')
    .select('id, name, surname')

  const playerNameToId = new Map<string, string>()
  players?.forEach(player => {
    const fullName = `${player.name} ${player.surname}`.toLowerCase().trim()
    playerNameToId.set(fullName, player.id)
  })

  console.log(`Found ${playerNameToId.size} players\n`)

  // Process cup fixtures and create missing results
  let resultsCreated = 0
  let resultsSkipped = 0
  let errors = 0

  for (const fixture of cf.data) {
    // Only process completed fixtures with goals
    if (!fixture.isCompleted) continue

    const leagueGameweekId = cupWeekToLeagueGameweek.get(fixture.cupGameweek)
    if (!leagueGameweekId) {
      console.log(`⚠ Fixture CW${fixture.cupGameweek}: No league gameweek mapping found`)
      errors++
      continue
    }

    // Process home players
    const homePlayers = [
      { name: fixture.homeLineup.player1, goals: fixture.homeGoals.player1 },
      { name: fixture.homeLineup.player2, goals: fixture.homeGoals.player2 },
      { name: fixture.homeLineup.player3, goals: fixture.homeGoals.player3 }
    ]

    for (const player of homePlayers) {
      if (!player.name) continue

      const playerId = playerNameToId.get(player.name.toLowerCase().trim())
      if (!playerId) {
        console.log(`⚠ Player not found: ${player.name}`)
        errors++
        continue
      }

      // Check if result already exists
      const { data: existing } = await supabaseAdmin
        .from('results')
        .select('id, goals')
        .eq('gameweek_id', leagueGameweekId)
        .eq('player_id', playerId)
        .single()

      if (existing) {
        resultsSkipped++
        continue
      }

      // Create result only if goals data exists
      if (player.goals !== undefined && player.goals !== null) {
        const { error } = await supabaseAdmin
          .from('results')
          .insert({
            gameweek_id: leagueGameweekId,
            player_id: playerId,
            goals: player.goals,
            has_played: true
          })

        if (error) {
          console.log(`❌ Failed to create result for ${player.name}: ${error.message}`)
          errors++
        } else {
          console.log(`✓ Created result: ${player.name} - ${player.goals} goals (GW: ${leagueGameweekId})`)
          resultsCreated++
        }
      }
    }

    // Process away players
    const awayPlayers = [
      { name: fixture.awayLineup.player1, goals: fixture.awayGoals.player1 },
      { name: fixture.awayLineup.player2, goals: fixture.awayGoals.player2 },
      { name: fixture.awayLineup.player3, goals: fixture.awayGoals.player3 }
    ]

    for (const player of awayPlayers) {
      if (!player.name) continue

      const playerId = playerNameToId.get(player.name.toLowerCase().trim())
      if (!playerId) {
        console.log(`⚠ Player not found: ${player.name}`)
        errors++
        continue
      }

      // Check if result already exists
      const { data: existing } = await supabaseAdmin
        .from('results')
        .select('id, goals')
        .eq('gameweek_id', leagueGameweekId)
        .eq('player_id', playerId)
        .single()

      if (existing) {
        resultsSkipped++
        continue
      }

      // Create result only if goals data exists
      if (player.goals !== undefined && player.goals !== null) {
        const { error } = await supabaseAdmin
          .from('results')
          .insert({
            gameweek_id: leagueGameweekId,
            player_id: playerId,
            goals: player.goals,
            has_played: true
          })

        if (error) {
          console.log(`❌ Failed to create result for ${player.name}: ${error.message}`)
          errors++
        } else {
          console.log(`✓ Created result: ${player.name} - ${player.goals} goals (GW: ${leagueGameweekId})`)
          resultsCreated++
        }
      }
    }
  }

  console.log('\n=== Results Summary ===')
  console.log(`Created: ${resultsCreated}`)
  console.log(`Skipped (already exist): ${resultsSkipped}`)
  console.log(`Errors: ${errors}`)

  // Now recalculate all cup match scores
  console.log('\n=== Recalculating Cup Match Scores ===\n')

  const { data: cupMatches } = await supabaseAdmin
    .from('cup_matches')
    .select('id, cup_gameweek_id, home_manager_id, away_manager_id')

  let recalculated = 0

  for (const match of cupMatches || []) {
    // Get league gameweek ID
    const { data: cupGameweek } = await supabaseAdmin
      .from('cup_gameweeks')
      .select('league_gameweek_id, cup_week')
      .eq('id', match.cup_gameweek_id)
      .single()

    if (!cupGameweek) continue

    // Get home lineup
    const { data: homeLineup } = await supabaseAdmin
      .from('cup_lineups')
      .select('player_ids')
      .eq('manager_id', match.home_manager_id)
      .eq('cup_gameweek_id', match.cup_gameweek_id)
      .single()

    // Get away lineup
    const { data: awayLineup } = await supabaseAdmin
      .from('cup_lineups')
      .select('player_ids')
      .eq('manager_id', match.away_manager_id)
      .eq('cup_gameweek_id', match.cup_gameweek_id)
      .single()

    let homeScore = 0
    let awayScore = 0

    // Calculate home score
    if (homeLineup?.player_ids && homeLineup.player_ids.length > 0) {
      const { data: homeResults } = await supabaseAdmin
        .from('results')
        .select('goals')
        .eq('gameweek_id', cupGameweek.league_gameweek_id)
        .in('player_id', homeLineup.player_ids)

      homeScore = homeResults?.reduce((sum, r) => sum + (r.goals || 0), 0) || 0
    }

    // Calculate away score
    if (awayLineup?.player_ids && awayLineup.player_ids.length > 0) {
      const { data: awayResults } = await supabaseAdmin
        .from('results')
        .select('goals')
        .eq('gameweek_id', cupGameweek.league_gameweek_id)
        .in('player_id', awayLineup.player_ids)

      awayScore = awayResults?.reduce((sum, r) => sum + (r.goals || 0), 0) || 0
    }

    // Update match scores
    const { error: updateError } = await supabaseAdmin
      .from('cup_matches')
      .update({ home_score: homeScore, away_score: awayScore })
      .eq('id', match.id)

    if (updateError) {
      console.log(`❌ Match ${match.id} (CW${cupGameweek.cup_week}): Failed - ${updateError.message}`)
    } else {
      console.log(`✓ Match ${match.id} (CW${cupGameweek.cup_week}): ${homeScore}-${awayScore}`)
      recalculated++
    }
  }

  console.log(`\n=== Recalculation Summary ===`)
  console.log(`Matches recalculated: ${recalculated}`)

  console.log('\n=== Repair Complete ===')
}

repairCupResults().catch(console.error)

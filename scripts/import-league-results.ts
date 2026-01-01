import { supabaseAdmin } from '../src/lib/supabase'
import * as XLSX from 'xlsx'
import {
  parseManagersMapping,
  parseLeagueFixtures,
  type ManagersMappingRow,
  type LeagueFixtureRow,
  type ParsedLineup,
  type ParsedGoals
} from '../src/utils/migration-parser'

const MIGRATION_FILE_PATH = '/Users/michael/Desktop/VS Code/Pilkarzyki/migrations/migration-template (1).xlsx'
const WNC_LEAGUE_ID = '8b6d933e-e011-4fd5-8bc0-8344e2841192'

async function importLeagueResults() {
  console.log('\n=== LEAGUE RESULTS IMPORT ===\n')

  // Get league info
  const { data: league } = await supabaseAdmin
    .from('leagues')
    .select('id, name')
    .eq('id', WNC_LEAGUE_ID)
    .single()

  if (!league) {
    console.error('League not found')
    process.exit(1)
  }

  console.log(`League: ${league.name}`)
  console.log(`League ID: ${league.id}\n`)

  // Parse Excel file
  const workbook = XLSX.readFile(MIGRATION_FILE_PATH)

  // Parse Managers_Mapping
  const managersMappingData = XLSX.utils.sheet_to_json(
    workbook.Sheets['Managers_Mapping']
  ) as ManagersMappingRow[]

  const mm = parseManagersMapping(managersMappingData)

  if (mm.errors.length > 0) {
    console.error('Managers_Mapping errors:', mm.errors)
    process.exit(1)
  }

  // Parse League Fixtures
  const leagueFixturesData = XLSX.utils.sheet_to_json(
    workbook.Sheets['League_Fixtures_And_Results']
  ) as LeagueFixtureRow[]

  const lf = parseLeagueFixtures(leagueFixturesData, mm.data)

  if (lf.errors.length > 0) {
    console.error('League fixtures parsing errors:', lf.errors)
    process.exit(1)
  }

  console.log(`Parsed ${lf.data.length} league fixtures\n`)

  // Get existing gameweeks
  const { data: existingGameweeks } = await supabaseAdmin
    .from('gameweeks')
    .select('id, week')
    .eq('league_id', WNC_LEAGUE_ID)
    .order('week')

  const gameweekMap = new Map(existingGameweeks?.map(gw => [gw.week, gw.id]))

  console.log(`Found ${gameweekMap.size} existing league gameweeks\n`)

  // Get manager map for this league ONLY
  const { data: leagueSquads } = await supabaseAdmin
    .from('squads')
    .select('manager_id')
    .eq('league_id', WNC_LEAGUE_ID)

  const managerIds = leagueSquads?.map(s => s.manager_id) || []

  const { data: users } = await supabaseAdmin
    .from('users')
    .select('id, email')
    .in('id', managerIds)

  const managerMap = new Map(users?.map(u => [u.email.toLowerCase(), u.id]))

  console.log(`Found ${managerMap.size} managers in league\n`)

  // Get players for this league ONLY
  const { data: players } = await supabaseAdmin
    .from('players')
    .select('id, name, surname, manager_id, league')
    .eq('league', league.name)
    .in('manager_id', managerIds)

  const playerMap = new Map<string, string>()
  const playerToManagerMap = new Map<string, string>()
  const playerLeagueMap = new Map<string, string>()

  players?.forEach(p => {
    const fullName = `${p.name} ${p.surname}`.toLowerCase().trim()
    playerMap.set(fullName, p.id)
    playerToManagerMap.set(p.id, p.manager_id)
    playerLeagueMap.set(p.id, p.league)
  })

  console.log(`Found ${playerMap.size} players\n`)

  // Import league results and lineups
  console.log('Importing league lineups and results...\n')
  let lineupsCreated = 0
  let resultsCreated = 0
  let skippedFixtures = 0

  for (const match of lf.data) {
    const gameweekId = gameweekMap.get(match.gameweek)
    const homeManagerId = managerMap.get(match.homeManager.toLowerCase())
    const awayManagerId = managerMap.get(match.awayManager.toLowerCase())

    if (!gameweekId || !homeManagerId || !awayManagerId) {
      console.log(`  ⚠ Skipping fixture (GW ${match.gameweek}): missing data`)
      skippedFixtures++
      continue
    }

    // Create lineup and results for home manager
    if (match.homeLineup.player1 || match.homeLineup.player2 || match.homeLineup.player3) {
      const result = await createLeagueLineupAndResults(
        homeManagerId,
        gameweekId,
        match.homeLineup,
        match.homeGoals,
        playerMap,
        playerToManagerMap,
        playerLeagueMap,
        league.name
      )

      if (result.success) {
        lineupsCreated++
        resultsCreated += result.resultsCreated
      }
    }

    // Create lineup and results for away manager
    if (match.awayLineup.player1 || match.awayLineup.player2 || match.awayLineup.player3) {
      const result = await createLeagueLineupAndResults(
        awayManagerId,
        gameweekId,
        match.awayLineup,
        match.awayGoals,
        playerMap,
        playerToManagerMap,
        playerLeagueMap,
        league.name
      )

      if (result.success) {
        lineupsCreated++
        resultsCreated += result.resultsCreated
      }
    }
  }

  console.log(`\n=== IMPORT COMPLETE ===`)
  console.log(`✓ League lineups: ${lineupsCreated}`)
  console.log(`✓ Results: ${resultsCreated}`)
  console.log(`⚠ Skipped fixtures: ${skippedFixtures}`)
  console.log(`=======================\n`)
}

async function createLeagueLineupAndResults(
  managerId: string,
  gameweekId: string,
  lineup: ParsedLineup,
  goals: ParsedGoals,
  playerMap: Map<string, string>,
  playerToManagerMap: Map<string, string>,
  playerLeagueMap: Map<string, string>,
  expectedLeague: string
): Promise<{ success: boolean; resultsCreated: number }> {
  let resultsCreated = 0

  try {
    const playerIds: string[] = []
    const players = [
      { name: lineup.player1, goals: goals.player1 },
      { name: lineup.player2, goals: goals.player2 },
      { name: lineup.player3, goals: goals.player3 }
    ]

    for (const player of players) {
      if (!player.name) continue

      const playerId = playerMap.get(player.name.toLowerCase().trim())
      if (!playerId) {
        console.log(`  ⚠ Player not found: ${player.name}`)
        continue
      }

      // Validate league
      const playerLeague = playerLeagueMap.get(playerId)
      if (playerLeague !== expectedLeague) {
        console.log(`  ⚠ LEAGUE MISMATCH: ${player.name} is in ${playerLeague}, expected ${expectedLeague}`)
        continue
      }

      // Validate manager
      const playerManagerId = playerToManagerMap.get(playerId)
      if (playerManagerId !== managerId) {
        console.log(`  ⚠ MANAGER MISMATCH: ${player.name} doesn't belong to this manager`)
        continue
      }

      playerIds.push(playerId)

      // Create result if goals are specified
      if (player.goals !== undefined && player.goals !== null) {
        const { data: existingResult } = await supabaseAdmin
          .from('results')
          .select('id')
          .eq('gameweek_id', gameweekId)
          .eq('player_id', playerId)
          .single()

        if (!existingResult) {
          const { error: resultError } = await supabaseAdmin
            .from('results')
            .insert({
              gameweek_id: gameweekId,
              player_id: playerId,
              goals: player.goals,
              has_played: true
            })

          if (!resultError) {
            resultsCreated++
          }
        }
      }
    }

    if (playerIds.length === 0) {
      return { success: false, resultsCreated }
    }

    // Check if lineup already exists
    const { data: existingLineup } = await supabaseAdmin
      .from('lineups')
      .select('id')
      .eq('manager_id', managerId)
      .eq('gameweek_id', gameweekId)
      .single()

    if (existingLineup) {
      console.log(`  ⚠ Lineup already exists for this manager in this gameweek`)
      return { success: false, resultsCreated }
    }

    // Create league lineup
    const { error: lineupError } = await supabaseAdmin
      .from('lineups')
      .insert({
        manager_id: managerId,
        gameweek_id: gameweekId,
        player_ids: playerIds,
        is_locked: true,
        total_goals: 0
      })

    if (lineupError) {
      console.log(`  ⚠ Failed to create lineup:`, lineupError.message)
      return { success: false, resultsCreated }
    }

    return { success: true, resultsCreated }
  } catch (error) {
    return { success: false, resultsCreated }
  }
}

importLeagueResults()
  .then(() => {
    console.log('Done!')
    process.exit(0)
  })
  .catch(err => {
    console.error('Error:', err)
    process.exit(1)
  })

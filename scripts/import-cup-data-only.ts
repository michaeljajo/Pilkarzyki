import { supabaseAdmin } from '../src/lib/supabase'
import * as XLSX from 'xlsx'
import {
  parseManagersMapping,
  parseCupGroups,
  parseCupGameweeks,
  parseCupFixtures,
  type ManagersMappingRow,
  type CupGroupRow,
  type CupGameweekRow,
  type CupFixtureRow,
  type ParsedLineup,
  type ParsedGoals
} from '../src/utils/migration-parser'

const MIGRATION_FILE_PATH = '/Users/michael/Desktop/VS Code/Pilkarzyki/migrations/migration-template (1).xlsx'
const WNC_LEAGUE_ID = '8b6d933e-e011-4fd5-8bc0-8344e2841192'

async function importCupDataOnly() {
  console.log('\n=== CUP DATA IMPORT (Using Existing Gameweeks) ===\n')

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

  // Parse Cup sheets
  const cupGroupsData = XLSX.utils.sheet_to_json(
    workbook.Sheets['Cup_Groups']
  ) as CupGroupRow[]

  const cupGameweeksData = XLSX.utils.sheet_to_json(
    workbook.Sheets['Cup_Gameweeks']
  ) as CupGameweekRow[]

  const cupFixturesData = XLSX.utils.sheet_to_json(
    workbook.Sheets['Cup_Fixtures_And_Results']
  ) as CupFixtureRow[]

  const cg = parseCupGroups(cupGroupsData, mm.data)
  const cgw = parseCupGameweeks(cupGameweeksData)
  const cf = parseCupFixtures(cupFixturesData, mm.data)

  if (cg.errors.length > 0 || cgw.errors.length > 0 || cf.errors.length > 0) {
    console.error('Parsing errors:', [...cg.errors, ...cgw.errors, ...cf.errors])
    process.exit(1)
  }

  console.log(`Parsed:`)
  console.log(`  - ${cg.data.length} cup groups`)
  console.log(`  - ${cgw.data.length} cup gameweeks`)
  console.log(`  - ${cf.data.length} cup fixtures\n`)

  // Get existing gameweeks
  const { data: existingGameweeks } = await supabaseAdmin
    .from('gameweeks')
    .select('id, week')
    .eq('league_id', WNC_LEAGUE_ID)

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

  // Create or get cup
  let cupId: string
  const { data: existingCup } = await supabaseAdmin
    .from('cups')
    .select('id')
    .eq('league_id', WNC_LEAGUE_ID)
    .single()

  if (existingCup) {
    cupId = existingCup.id
    console.log(`Using existing cup: ${cupId}\n`)
  } else {
    const { data: newCup, error: cupError } = await supabaseAdmin
      .from('cups')
      .insert({
        league_id: WNC_LEAGUE_ID,
        name: `${league.name} Cup`,
        stage: 'group_stage',
        is_active: true
      })
      .select('id')
      .single()

    if (cupError) {
      console.error('Failed to create cup:', cupError)
      process.exit(1)
    }

    cupId = newCup.id
    console.log(`Created new cup: ${cupId}\n`)
  }

  // Import cup groups
  console.log('Importing cup groups...')
  for (const group of cg.data) {
    for (const managerEmail of group.managers) {
      const managerId = managerMap.get(managerEmail.toLowerCase())

      if (!managerId) {
        console.log(`  ⚠ Manager not found: ${managerEmail}`)
        continue
      }

      const { error } = await supabaseAdmin
        .from('cup_groups')
        .insert({
          cup_id: cupId,
          group_name: group.groupName,
          manager_id: managerId
        })

      if (error) {
        console.log(`  ✗ Failed to add ${managerEmail} to group ${group.groupName}`)
      }
    }
  }
  console.log(`✓ Cup groups imported\n`)

  // Import cup gameweeks
  console.log('Importing cup gameweeks...')
  const cupGameweekMap = new Map<number, string>()

  for (const cupGw of cgw.data) {
    const leagueGameweekId = gameweekMap.get(cupGw.leagueGameweek)

    if (!leagueGameweekId) {
      console.log(`  ✗ League gameweek ${cupGw.leagueGameweek} not found for cup week ${cupGw.cupWeek}`)
      continue
    }

    const { data: cupGameweek, error } = await supabaseAdmin
      .from('cup_gameweeks')
      .insert({
        cup_id: cupId,
        league_gameweek_id: leagueGameweekId,
        cup_week: cupGw.cupWeek,
        stage: cupGw.stage,
        leg: cupGw.leg
      })
      .select('id, cup_week')
      .single()

    if (error) {
      console.log(`  ✗ Failed to create cup gameweek ${cupGw.cupWeek}:`, error.message)
      continue
    }

    cupGameweekMap.set(cupGameweek.cup_week, cupGameweek.id)
  }
  console.log(`✓ ${cupGameweekMap.size} cup gameweeks imported\n`)

  // Import cup matches and results
  console.log('Importing cup matches, lineups, and results...\n')
  let matchesCreated = 0
  let lineupsCreated = 0
  let resultsCreated = 0

  for (const match of cf.data) {
    if (!match.homeManager || !match.awayManager) {
      continue // Skip knockout matches without managers
    }

    const cupGameweekId = cupGameweekMap.get(match.cupGameweek)
    const homeManagerId = managerMap.get(match.homeManager.toLowerCase())
    const awayManagerId = managerMap.get(match.awayManager.toLowerCase())

    if (!cupGameweekId || !homeManagerId || !awayManagerId) {
      console.log(`  ⚠ Skipping cup match (cup week ${match.cupGameweek}): missing data`)
      continue
    }

    // Get league gameweek ID for results
    const cupGameweekData = cgw.data.find(g => g.cupWeek === match.cupGameweek)
    const leagueGameweekId = cupGameweekData ? gameweekMap.get(cupGameweekData.leagueGameweek) : undefined

    if (!leagueGameweekId) {
      console.log(`  ⚠ Skipping cup match (cup week ${match.cupGameweek}): no league gameweek`)
      continue
    }

    // Create cup match
    const { data: createdMatch, error: matchError } = await supabaseAdmin
      .from('cup_matches')
      .insert({
        cup_id: cupId,
        cup_gameweek_id: cupGameweekId,
        home_manager_id: homeManagerId,
        away_manager_id: awayManagerId,
        stage: match.stage,
        leg: match.leg,
        group_name: match.groupName || null,
        is_completed: match.isCompleted
      })
      .select('id')
      .single()

    if (matchError) {
      console.log(`  ✗ Failed to create cup match (week ${match.cupGameweek}):`, matchError.message)
      continue
    }

    matchesCreated++

    // Create lineups and results for both managers
    if (match.homeLineup.player1 || match.homeLineup.player2 || match.homeLineup.player3) {
      const result = await createCupLineupAndResults(
        homeManagerId,
        leagueGameweekId,
        cupGameweekId,
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

    if (match.awayLineup.player1 || match.awayLineup.player2 || match.awayLineup.player3) {
      const result = await createCupLineupAndResults(
        awayManagerId,
        leagueGameweekId,
        cupGameweekId,
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

    // Update match scores
    if (match.isCompleted) {
      await updateCupMatchScores(createdMatch.id, cupGameweekId, leagueGameweekId)
    }
  }

  console.log(`\n=== IMPORT COMPLETE ===`)
  console.log(`✓ Cup matches: ${matchesCreated}`)
  console.log(`✓ Cup lineups: ${lineupsCreated}`)
  console.log(`✓ Results: ${resultsCreated}`)
  console.log(`=======================\n`)
}

async function createCupLineupAndResults(
  managerId: string,
  leagueGameweekId: string,
  cupGameweekId: string,
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
          .eq('gameweek_id', leagueGameweekId)
          .eq('player_id', playerId)
          .single()

        if (!existingResult) {
          const { error: resultError } = await supabaseAdmin
            .from('results')
            .insert({
              gameweek_id: leagueGameweekId,
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

    // Create cup lineup
    const { error: lineupError } = await supabaseAdmin
      .from('cup_lineups')
      .insert({
        manager_id: managerId,
        cup_gameweek_id: cupGameweekId,
        player_ids: playerIds,
        is_locked: true
      })

    if (lineupError) {
      console.log(`  ⚠ Failed to create cup lineup:`, lineupError.message)
      return { success: false, resultsCreated }
    }

    return { success: true, resultsCreated }
  } catch (error) {
    return { success: false, resultsCreated }
  }
}

async function updateCupMatchScores(matchId: string, cupGameweekId: string, leagueGameweekId: string) {
  const { data: match } = await supabaseAdmin
    .from('cup_matches')
    .select('home_manager_id, away_manager_id')
    .eq('id', matchId)
    .single()

  if (!match) return

  const { data: homeLineup } = await supabaseAdmin
    .from('cup_lineups')
    .select('player_ids')
    .eq('manager_id', match.home_manager_id)
    .eq('cup_gameweek_id', cupGameweekId)
    .single()

  const { data: awayLineup } = await supabaseAdmin
    .from('cup_lineups')
    .select('player_ids')
    .eq('manager_id', match.away_manager_id)
    .eq('cup_gameweek_id', cupGameweekId)
    .single()

  let homeScore = 0
  let awayScore = 0

  if (homeLineup?.player_ids) {
    const { data: results } = await supabaseAdmin
      .from('results')
      .select('goals')
      .eq('gameweek_id', leagueGameweekId)
      .in('player_id', homeLineup.player_ids)

    homeScore = results?.reduce((sum, r) => sum + (r.goals || 0), 0) || 0
  }

  if (awayLineup?.player_ids) {
    const { data: results } = await supabaseAdmin
      .from('results')
      .select('goals')
      .eq('gameweek_id', leagueGameweekId)
      .in('player_id', awayLineup.player_ids)

    awayScore = results?.reduce((sum, r) => sum + (r.goals || 0), 0) || 0
  }

  await supabaseAdmin
    .from('cup_matches')
    .update({ home_score: homeScore, away_score: awayScore })
    .eq('id', matchId)
}

importCupDataOnly()
  .then(() => {
    console.log('Done!')
    process.exit(0)
  })
  .catch(err => {
    console.error('Error:', err)
    process.exit(1)
  })

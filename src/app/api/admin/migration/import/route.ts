import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import * as XLSX from 'xlsx'
import {
  parseLeagueGameweeks,
  parseLeagueFixtures,
  parseCupGroups,
  parseCupGameweeks,
  parseCupFixtures,
  validateMigrationData,
  type LeagueGameweekRow,
  type LeagueFixtureRow,
  type CupGroupRow,
  type CupGameweekRow,
  type CupFixtureRow,
  type MigrationData,
  type ParsedLeagueMatch,
  type ParsedCupMatch,
  type ParsedLineup,
  type ParsedGoals
} from '@/utils/migration-parser'

interface ImportResult {
  success: boolean
  imported: {
    gameweeks: number
    leagueMatches: number
    cupGroups: number
    cupGameweeks: number
    cupMatches: number
    lineups: number
    cupLineups: number
    results: number
  }
  errors: string[]
  warnings: string[]
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('clerk_id', userId)
      .single()

    if (userError || !user?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const leagueId = formData.get('leagueId') as string

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    if (!leagueId) {
      return NextResponse.json({ error: 'League ID required' }, { status: 400 })
    }

    // Verify league exists
    const { data: league, error: leagueError } = await supabaseAdmin
      .from('leagues')
      .select('id, name')
      .eq('id', leagueId)
      .single()

    if (leagueError || !league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 })
    }

    // Parse Excel file
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer)

    // Validate sheets exist
    const requiredSheets = [
      'League_Gameweeks',
      'League_Fixtures_And_Results',
      'Cup_Groups',
      'Cup_Gameweeks',
      'Cup_Fixtures_And_Results'
    ]

    const missingSheets = requiredSheets.filter(sheet => !workbook.SheetNames.includes(sheet))
    if (missingSheets.length > 0) {
      return NextResponse.json({
        error: `Missing required sheets: ${missingSheets.join(', ')}`
      }, { status: 400 })
    }

    // Parse all sheets
    const leagueGameweeksData = XLSX.utils.sheet_to_json(
      workbook.Sheets['League_Gameweeks']
    ) as LeagueGameweekRow[]

    const leagueFixturesData = XLSX.utils.sheet_to_json(
      workbook.Sheets['League_Fixtures_And_Results']
    ) as LeagueFixtureRow[]

    const cupGroupsData = XLSX.utils.sheet_to_json(
      workbook.Sheets['Cup_Groups']
    ) as CupGroupRow[]

    const cupGameweeksData = XLSX.utils.sheet_to_json(
      workbook.Sheets['Cup_Gameweeks']
    ) as CupGameweekRow[]

    const cupFixturesData = XLSX.utils.sheet_to_json(
      workbook.Sheets['Cup_Fixtures_And_Results']
    ) as CupFixtureRow[]

    // Parse data
    const lgw = parseLeagueGameweeks(leagueGameweeksData)
    const lf = parseLeagueFixtures(leagueFixturesData)
    const cg = parseCupGroups(cupGroupsData)
    const cgw = parseCupGameweeks(cupGameweeksData)
    const cf = parseCupFixtures(cupFixturesData)

    // Collect all parsing errors
    const parsingErrors = [
      ...lgw.errors,
      ...lf.errors,
      ...cg.errors,
      ...cgw.errors,
      ...cf.errors
    ]

    if (parsingErrors.length > 0) {
      return NextResponse.json({
        error: 'Parsing errors found',
        details: parsingErrors
      }, { status: 400 })
    }

    // Create migration data structure
    const migrationData: MigrationData = {
      leagueGameweeks: lgw.data,
      leagueMatches: lf.data,
      cupGroups: cg.data,
      cupGameweeks: cgw.data,
      cupMatches: cf.data
    }

    // Validate data
    const validation = validateMigrationData(migrationData)
    if (!validation.isValid) {
      return NextResponse.json({
        error: 'Validation errors found',
        details: validation.errors
      }, { status: 400 })
    }

    // Import data
    const result = await importMigrationData(migrationData, leagueId, league.name)

    return NextResponse.json({
      message: 'Migration completed successfully',
      result
    })

  } catch (error) {
    console.error('Migration import error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function importMigrationData(
  data: MigrationData,
  leagueId: string,
  leagueName: string
): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    imported: {
      gameweeks: 0,
      leagueMatches: 0,
      cupGroups: 0,
      cupGameweeks: 0,
      cupMatches: 0,
      lineups: 0,
      cupLineups: 0,
      results: 0
    },
    errors: [],
    warnings: []
  }

  try {
    // Step 1: Import league gameweeks
    const gameweekMap = new Map<number, string>() // week -> gameweek_id

    for (const gw of data.leagueGameweeks) {
      const { data: gameweek, error } = await supabaseAdmin
        .from('gameweeks')
        .insert({
          league_id: leagueId,
          week: gw.week,
          start_date: gw.startDate.toISOString(),
          end_date: gw.endDate.toISOString(),
          lock_date: gw.lockDate.toISOString(),
          is_completed: gw.isCompleted
        })
        .select('id, week')
        .single()

      if (error) {
        result.errors.push(`Failed to create gameweek ${gw.week}: ${error.message}`)
        continue
      }

      gameweekMap.set(gameweek.week, gameweek.id)
      result.imported.gameweeks++
    }

    // Step 2: Get or create cup
    let cupId: string
    const { data: existingCup } = await supabaseAdmin
      .from('cups')
      .select('id')
      .eq('league_id', leagueId)
      .single()

    if (existingCup) {
      cupId = existingCup.id
      result.warnings.push('Cup already exists for this league, using existing')
    } else {
      const { data: newCup, error: cupError } = await supabaseAdmin
        .from('cups')
        .insert({
          league_id: leagueId,
          name: `${leagueName} Cup`,
          stage: 'group_stage',
          is_active: true
        })
        .select('id')
        .single()

      if (cupError) {
        result.errors.push(`Failed to create cup: ${cupError.message}`)
        throw new Error('Cup creation failed')
      }

      cupId = newCup.id
    }

    // Step 3: Get all managers (from Clerk and Supabase)
    const client = await clerkClient()
    const clerkUsers = await client.users.getUserList({ limit: 500 })
    const managerMap = new Map<string, string>() // email -> user_id

    for (const clerkUser of clerkUsers.data) {
      const email = clerkUser.emailAddresses[0]?.emailAddress
      if (!email) continue

      // Ensure user exists in Supabase
      const { data: supabaseUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('clerk_id', clerkUser.id)
        .single()

      if (supabaseUser) {
        managerMap.set(email.toLowerCase(), supabaseUser.id)
      }
    }

    // Step 4: Import cup groups
    for (const group of data.cupGroups) {
      for (const managerEmail of group.managers) {
        const managerId = managerMap.get(managerEmail.toLowerCase())

        if (!managerId) {
          result.errors.push(`Manager not found: ${managerEmail}`)
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
          result.errors.push(`Failed to add ${managerEmail} to group ${group.groupName}: ${error.message}`)
        } else {
          result.imported.cupGroups++
        }
      }
    }

    // Step 5: Import cup gameweeks
    const cupGameweekMap = new Map<number, string>() // cup_week -> cup_gameweek_id

    for (const cgw of data.cupGameweeks) {
      const leagueGameweekId = gameweekMap.get(cgw.leagueGameweek)

      if (!leagueGameweekId) {
        result.errors.push(`Cup gameweek ${cgw.cupWeek}: League gameweek ${cgw.leagueGameweek} not found`)
        continue
      }

      const { data: cupGameweek, error } = await supabaseAdmin
        .from('cup_gameweeks')
        .insert({
          cup_id: cupId,
          league_gameweek_id: leagueGameweekId,
          cup_week: cgw.cupWeek,
          stage: cgw.stage,
          leg: cgw.leg
        })
        .select('id, cup_week')
        .single()

      if (error) {
        result.errors.push(`Failed to create cup gameweek ${cgw.cupWeek}: ${error.message}`)
        continue
      }

      cupGameweekMap.set(cupGameweek.cup_week, cupGameweek.id)
      result.imported.cupGameweeks++
    }

    // Step 6: Get all players for lineup/results matching
    const { data: players } = await supabaseAdmin
      .from('players')
      .select('id, name, surname')
      .eq('league', leagueName)

    const playerMap = new Map<string, string>() // full_name -> player_id
    players?.forEach(player => {
      const fullName = `${player.name} ${player.surname}`.toLowerCase().trim()
      playerMap.set(fullName, player.id)
    })

    // Step 7: Import league matches, lineups, and results
    for (const match of data.leagueMatches) {
      const gameweekId = gameweekMap.get(match.gameweek)
      const homeManagerId = managerMap.get(match.homeManager.toLowerCase())
      const awayManagerId = managerMap.get(match.awayManager.toLowerCase())

      if (!gameweekId || !homeManagerId || !awayManagerId) {
        result.errors.push(
          `League match GW${match.gameweek}: Missing gameweek, home manager, or away manager`
        )
        continue
      }

      // Create match
      const { data: createdMatch, error: matchError } = await supabaseAdmin
        .from('matches')
        .insert({
          league_id: leagueId,
          gameweek_id: gameweekId,
          home_manager_id: homeManagerId,
          away_manager_id: awayManagerId,
          is_completed: match.isCompleted
        })
        .select('id')
        .single()

      if (matchError) {
        result.errors.push(`Failed to create league match GW${match.gameweek}: ${matchError.message}`)
        continue
      }

      result.imported.leagueMatches++

      // Create home lineup and results
      if (match.homeLineup.player1 || match.homeLineup.player2 || match.homeLineup.player3) {
        const lineupResult = await createLineup(
          homeManagerId,
          gameweekId,
          match.homeLineup,
          match.homeGoals,
          playerMap,
          false
        )

        if (lineupResult.success) {
          result.imported.lineups++
          result.imported.results += lineupResult.resultsCreated
        } else {
          result.errors.push(...lineupResult.errors)
        }
      }

      // Create away lineup and results
      if (match.awayLineup.player1 || match.awayLineup.player2 || match.awayLineup.player3) {
        const lineupResult = await createLineup(
          awayManagerId,
          gameweekId,
          match.awayLineup,
          match.awayGoals,
          playerMap,
          false
        )

        if (lineupResult.success) {
          result.imported.lineups++
          result.imported.results += lineupResult.resultsCreated
        } else {
          result.errors.push(...lineupResult.errors)
        }
      }

      // Calculate and update match scores
      if (match.isCompleted) {
        await updateMatchScores(createdMatch.id, gameweekId)
      }
    }

    // Step 8: Import cup matches, lineups, and results
    for (const match of data.cupMatches) {
      // Skip matches without managers (knockout matches to be created later)
      if (!match.homeManager || !match.awayManager) {
        continue
      }

      const cupGameweekId = cupGameweekMap.get(match.cupGameweek)
      const homeManagerId = managerMap.get(match.homeManager.toLowerCase())
      const awayManagerId = managerMap.get(match.awayManager.toLowerCase())

      if (!cupGameweekId || !homeManagerId || !awayManagerId) {
        result.errors.push(
          `Cup match CW${match.cupGameweek}: Missing cup gameweek, home manager, or away manager`
        )
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
        result.errors.push(`Failed to create cup match CW${match.cupGameweek}: ${matchError.message}`)
        continue
      }

      result.imported.cupMatches++

      // Create home cup lineup
      if (match.homeLineup.player1 || match.homeLineup.player2 || match.homeLineup.player3) {
        const lineupResult = await createLineup(
          homeManagerId,
          cupGameweekId,
          match.homeLineup,
          match.homeGoals,
          playerMap,
          true
        )

        if (lineupResult.success) {
          result.imported.cupLineups++
          // Results are already counted from league lineups (shared table)
        } else {
          result.errors.push(...lineupResult.errors)
        }
      }

      // Create away cup lineup
      if (match.awayLineup.player1 || match.awayLineup.player2 || match.awayLineup.player3) {
        const lineupResult = await createLineup(
          awayManagerId,
          cupGameweekId,
          match.awayLineup,
          match.awayGoals,
          playerMap,
          true
        )

        if (lineupResult.success) {
          result.imported.cupLineups++
        } else {
          result.errors.push(...lineupResult.errors)
        }
      }

      // Calculate and update cup match scores
      if (match.isCompleted) {
        await updateCupMatchScores(createdMatch.id, cupGameweekId)
      }
    }

    return result

  } catch (error) {
    result.success = false
    result.errors.push(`Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return result
  }
}

async function createLineup(
  managerId: string,
  gameweekId: string,
  lineup: ParsedLineup,
  goals: ParsedGoals,
  playerMap: Map<string, string>,
  isCupLineup: boolean
): Promise<{ success: boolean; errors: string[]; resultsCreated: number }> {
  const errors: string[] = []
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
        errors.push(`Player not found: ${player.name}`)
        continue
      }

      playerIds.push(playerId)

      // Create result if goals are specified
      if (player.goals !== undefined && player.goals !== null) {
        // Check if result already exists (might be shared between league and cup)
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

          if (resultError) {
            errors.push(`Failed to create result for ${player.name}: ${resultError.message}`)
          } else {
            resultsCreated++
          }
        }
      }
    }

    if (playerIds.length === 0) {
      return { success: false, errors: ['No valid players in lineup'], resultsCreated }
    }

    // Create lineup
    const table = isCupLineup ? 'cup_lineups' : 'lineups'
    const gameweekField = isCupLineup ? 'cup_gameweek_id' : 'gameweek_id'

    const { error: lineupError } = await supabaseAdmin
      .from(table)
      .insert({
        manager_id: managerId,
        [gameweekField]: gameweekId,
        player_ids: playerIds,
        is_locked: true
      })

    if (lineupError) {
      errors.push(`Failed to create lineup: ${lineupError.message}`)
      return { success: false, errors, resultsCreated }
    }

    return { success: true, errors: [], resultsCreated }

  } catch (error) {
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      resultsCreated
    }
  }
}

async function updateMatchScores(matchId: string, gameweekId: string) {
  // Get match managers
  const { data: match } = await supabaseAdmin
    .from('matches')
    .select('home_manager_id, away_manager_id')
    .eq('id', matchId)
    .single()

  if (!match) return

  // Get lineups
  const { data: homeLineup } = await supabaseAdmin
    .from('lineups')
    .select('player_ids')
    .eq('manager_id', match.home_manager_id)
    .eq('gameweek_id', gameweekId)
    .single()

  const { data: awayLineup } = await supabaseAdmin
    .from('lineups')
    .select('player_ids')
    .eq('manager_id', match.away_manager_id)
    .eq('gameweek_id', gameweekId)
    .single()

  // Calculate scores
  let homeScore = 0
  let awayScore = 0

  if (homeLineup?.player_ids) {
    const { data: results } = await supabaseAdmin
      .from('results')
      .select('goals')
      .eq('gameweek_id', gameweekId)
      .in('player_id', homeLineup.player_ids)

    homeScore = results?.reduce((sum, r) => sum + (r.goals || 0), 0) || 0
  }

  if (awayLineup?.player_ids) {
    const { data: results } = await supabaseAdmin
      .from('results')
      .select('goals')
      .eq('gameweek_id', gameweekId)
      .in('player_id', awayLineup.player_ids)

    awayScore = results?.reduce((sum, r) => sum + (r.goals || 0), 0) || 0
  }

  // Update match
  await supabaseAdmin
    .from('matches')
    .update({ home_score: homeScore, away_score: awayScore })
    .eq('id', matchId)
}

async function updateCupMatchScores(matchId: string, cupGameweekId: string) {
  // Get match managers
  const { data: match } = await supabaseAdmin
    .from('cup_matches')
    .select('home_manager_id, away_manager_id')
    .eq('id', matchId)
    .single()

  if (!match) return

  // Get cup lineups
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

  // Get league gameweek ID from cup gameweek
  const { data: cupGameweek } = await supabaseAdmin
    .from('cup_gameweeks')
    .select('league_gameweek_id')
    .eq('id', cupGameweekId)
    .single()

  if (!cupGameweek) return

  // Calculate scores
  let homeScore = 0
  let awayScore = 0

  if (homeLineup?.player_ids) {
    const { data: results } = await supabaseAdmin
      .from('results')
      .select('goals')
      .eq('gameweek_id', cupGameweek.league_gameweek_id)
      .in('player_id', homeLineup.player_ids)

    homeScore = results?.reduce((sum, r) => sum + (r.goals || 0), 0) || 0
  }

  if (awayLineup?.player_ids) {
    const { data: results } = await supabaseAdmin
      .from('results')
      .select('goals')
      .eq('gameweek_id', cupGameweek.league_gameweek_id)
      .in('player_id', awayLineup.player_ids)

    awayScore = results?.reduce((sum, r) => sum + (r.goals || 0), 0) || 0
  }

  // Update cup match
  await supabaseAdmin
    .from('cup_matches')
    .update({ home_score: homeScore, away_score: awayScore })
    .eq('id', matchId)
}

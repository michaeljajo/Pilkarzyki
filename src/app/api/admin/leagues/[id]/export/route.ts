import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import * as XLSX from 'xlsx'

/**
 * GET /api/admin/leagues/[id]/export
 * Exports all league and cup data to Excel file
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: leagueId } = await context.params

    // Check if user is admin
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('is_admin, id')
      .eq('clerk_id', userId)
      .single()

    if (userError || !user?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get league info
    const { data: league } = await supabaseAdmin
      .from('leagues')
      .select('*')
      .eq('id', leagueId)
      .single()

    if (!league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 })
    }

    // Verify admin owns this league
    if (league.admin_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized for this league' }, { status: 403 })
    }

    // Fetch all data in parallel
    const [
      gameweeksData,
      matchesData,
      resultsData,
      standingsData,
      managersData,
      playersData,
      lineupsData,
      lineupHistoryData,
      cupData,
      cupGameweeksData,
      cupMatchesData,
      cupGroupStandingsData,
      cupLineupsData,
      cupLineupHistoryData
    ] = await Promise.all([
      // League gameweeks
      supabaseAdmin
        .from('gameweeks')
        .select('*')
        .eq('league_id', leagueId)
        .order('week', { ascending: true }),

      // League matches
      supabaseAdmin
        .from('matches')
        .select(`
          *,
          gameweeks!inner(week, league_id),
          home_manager:users!matches_home_manager_id_fkey(id, first_name, last_name, email),
          away_manager:users!matches_away_manager_id_fkey(id, first_name, last_name, email)
        `)
        .eq('gameweeks.league_id', leagueId)
        .order('gameweeks(week)', { ascending: true }),

      // Results
      supabaseAdmin
        .from('results')
        .select(`
          *,
          players(name, surname),
          gameweeks!inner(id, week, league_id)
        `)
        .eq('gameweeks.league_id', leagueId),

      // Standings
      supabaseAdmin
        .from('standings')
        .select(`
          *,
          users(first_name, last_name, email)
        `)
        .eq('league_id', leagueId)
        .order('position', { ascending: true }),

      // Managers and their squads
      supabaseAdmin
        .from('squads')
        .select(`
          *,
          users(id, first_name, last_name, email),
          squad_players(
            player_id,
            players(id, name, surname, position, club, football_league)
          )
        `)
        .eq('league_id', leagueId),

      // All players in league
      supabaseAdmin
        .from('players')
        .select('*')
        .eq('league', league.name),

      // All lineups
      supabaseAdmin
        .from('lineups')
        .select(`
          *,
          users(first_name, last_name, email),
          gameweeks!inner(week, league_id)
        `)
        .eq('gameweeks.league_id', leagueId)
        .order('gameweeks(week)', { ascending: true }),

      // Lineup history
      supabaseAdmin
        .from('lineup_history')
        .select(`
          *,
          users!lineup_history_manager_id_fkey(first_name, last_name, email),
          admin:users!lineup_history_admin_creator_id_fkey(first_name, last_name, email),
          gameweeks!inner(week, league_id)
        `)
        .eq('gameweeks.league_id', leagueId)
        .order('created_at', { ascending: true }),

      // Cup data
      supabaseAdmin
        .from('cups')
        .select('*')
        .eq('league_id', leagueId)
        .single(),

      // Cup gameweeks
      supabaseAdmin
        .from('cup_gameweeks')
        .select(`
          *,
          cups!inner(league_id),
          gameweeks(week, start_date, end_date, lock_date)
        `)
        .eq('cups.league_id', leagueId)
        .order('cup_week', { ascending: true }),

      // Cup matches
      supabaseAdmin
        .from('cup_matches')
        .select(`
          *,
          cups!inner(league_id),
          home_manager:users!cup_matches_home_manager_id_fkey(first_name, last_name, email),
          away_manager:users!cup_matches_away_manager_id_fkey(first_name, last_name, email),
          cup_gameweeks(cup_week, stage)
        `)
        .eq('cups.league_id', leagueId),

      // Cup group standings
      supabaseAdmin
        .from('cup_group_standings')
        .select(`
          *,
          cups!inner(league_id)
        `)
        .eq('cups.league_id', leagueId)
        .order('group_name, position', { ascending: true }),

      // Cup lineups
      supabaseAdmin
        .from('cup_lineups')
        .select(`
          *,
          users(first_name, last_name, email),
          cup_gameweeks!inner(cup_week, cups!inner(league_id))
        `)
        .eq('cup_gameweeks.cups.league_id', leagueId),

      // Cup lineup history
      supabaseAdmin
        .from('cup_lineup_history')
        .select(`
          *,
          users(first_name, last_name, email),
          cup_gameweeks!inner(cup_week, cups!inner(league_id))
        `)
        .eq('cup_gameweeks.cups.league_id', leagueId)
        .order('created_at', { ascending: true })
    ])

    const gameweeks = gameweeksData.data || []
    const matches = matchesData.data || []
    const results = resultsData.data || []
    const standings = standingsData.data || []
    const managers = managersData.data || []
    const players = playersData.data || []
    const lineups = lineupsData.data || []
    const lineupHistory = lineupHistoryData.data || []
    const cup = cupData.data
    const cupGameweeks = cupGameweeksData.data || []
    const cupMatches = cupMatchesData.data || []
    const cupGroupStandings = cupGroupStandingsData.data || []
    const cupLineups = cupLineupsData.data || []
    const cupLineupHistory = cupLineupHistoryData.data || []

    // Create workbook
    const workbook = XLSX.utils.book_new()

    // Helper function to format date
    const formatDate = (date: string | null) => {
      if (!date) return ''
      return new Date(date).toLocaleString('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }

    const formatDateOnly = (date: string | null) => {
      if (!date) return ''
      return new Date(date).toLocaleDateString('en-GB')
    }

    // Create player ID to name map
    const playerMap = new Map(players.map(p => [p.id, `${p.name} ${p.surname}`]))

    // Sheet 1: League Results (with lineups)
    const leagueResultsData = gameweeks.map(gw => {
      const gwMatches = matches.filter((m: any) => m.gameweek_id === gw.id)
      const gwResults = results.filter((r: any) => r.gameweek_id === gw.id)

      return gwMatches.map((match: any) => {
        // Get lineups for both managers
        const homeLineup = lineups.find((l: any) =>
          l.manager_id === match.home_manager_id && l.gameweek_id === gw.id
        )
        const awayLineup = lineups.find((l: any) =>
          l.manager_id === match.away_manager_id && l.gameweek_id === gw.id
        )

        // Get player names and goals
        const getPlayerData = (playerIds: string[], managerId: string) => {
          const playerData = []
          for (let i = 0; i < 3; i++) {
            const playerId = playerIds?.[i]
            if (playerId) {
              const result = gwResults.find((r: any) => r.player_id === playerId)
              playerData.push({
                name: playerMap.get(playerId) || 'Unknown',
                goals: result?.goals || 0
              })
            } else {
              playerData.push({ name: '', goals: '' })
            }
          }
          return playerData
        }

        const homePlayers = getPlayerData(homeLineup?.player_ids || [], match.home_manager_id)
        const awayPlayers = getPlayerData(awayLineup?.player_ids || [], match.away_manager_id)

        return {
          Gameweek: gw.week,
          Date: formatDateOnly(gw.start_date),
          HomeManager: `${match.home_manager?.first_name || ''} ${match.home_manager?.last_name || ''}`.trim(),
          HomePlayer1: homePlayers[0].name,
          HomePlayer1Goals: homePlayers[0].goals,
          HomePlayer2: homePlayers[1].name,
          HomePlayer2Goals: homePlayers[1].goals,
          HomePlayer3: homePlayers[2].name,
          HomePlayer3Goals: homePlayers[2].goals,
          HomeScore: match.home_score ?? '',
          AwayManager: `${match.away_manager?.first_name || ''} ${match.away_manager?.last_name || ''}`.trim(),
          AwayPlayer1: awayPlayers[0].name,
          AwayPlayer1Goals: awayPlayers[0].goals,
          AwayPlayer2: awayPlayers[1].name,
          AwayPlayer2Goals: awayPlayers[1].goals,
          AwayPlayer3: awayPlayers[2].name,
          AwayPlayer3Goals: awayPlayers[2].goals,
          AwayScore: match.away_score ?? '',
          IsCompleted: match.is_completed ? 'YES' : 'NO'
        }
      })
    }).flat()

    const ws1 = XLSX.utils.json_to_sheet(leagueResultsData)
    ws1['!cols'] = [
      { width: 10 }, { width: 12 }, { width: 20 },
      { width: 18 }, { width: 8 }, { width: 18 }, { width: 8 }, { width: 18 }, { width: 8 }, { width: 10 },
      { width: 20 }, { width: 18 }, { width: 8 }, { width: 18 }, { width: 8 }, { width: 18 }, { width: 8 },
      { width: 10 }, { width: 12 }
    ]
    XLSX.utils.book_append_sheet(workbook, ws1, 'League_Results')

    // Sheet 2: League Table
    const tableData = standings.map((s: any) => {
      const manager = managers.find((m: any) => m.manager_id === s.manager_id)
      return {
        Position: s.position,
        Manager: `${s.users?.first_name || ''} ${s.users?.last_name || ''}`.trim(),
        TeamName: manager?.team_name || '',
        Email: s.users?.email || '',
        Played: s.played,
        Won: s.won,
        Drawn: s.drawn,
        Lost: s.lost,
        GoalsFor: s.goals_for,
        GoalsAgainst: s.goals_against,
        GoalDifference: s.goal_difference,
        Points: s.points
      }
    })
    const ws2 = XLSX.utils.json_to_sheet(tableData)
    ws2['!cols'] = [
      { width: 10 }, { width: 20 }, { width: 20 }, { width: 30 },
      { width: 8 }, { width: 8 }, { width: 8 }, { width: 8 },
      { width: 10 }, { width: 12 }, { width: 12 }, { width: 8 }
    ]
    XLSX.utils.book_append_sheet(workbook, ws2, 'League_Table')

    // Sheet 3: League Schedule
    const scheduleData = gameweeks.map(gw => {
      const gwMatches = matches.filter((m: any) => m.gameweek_id === gw.id)
      return gwMatches.map((match: any) => ({
        Gameweek: gw.week,
        StartDate: formatDateOnly(gw.start_date),
        LockDate: formatDate(gw.lock_date),
        HomeManager: `${match.home_manager?.first_name || ''} ${match.home_manager?.last_name || ''}`.trim(),
        AwayManager: `${match.away_manager?.first_name || ''} ${match.away_manager?.last_name || ''}`.trim(),
        HomeScore: match.home_score ?? '',
        AwayScore: match.away_score ?? '',
        IsCompleted: match.is_completed ? 'YES' : 'NO'
      }))
    }).flat()
    const ws3 = XLSX.utils.json_to_sheet(scheduleData)
    ws3['!cols'] = [
      { width: 10 }, { width: 12 }, { width: 20 },
      { width: 20 }, { width: 20 }, { width: 10 }, { width: 10 }, { width: 12 }
    ]
    XLSX.utils.book_append_sheet(workbook, ws3, 'League_Schedule')

    // Sheet 4: Managers and Teams
    const managersTeamsData = managers.map((m: any) => {
      const squadPlayers = m.squad_players || []
      const playersList = squadPlayers
        .map((sp: any) => {
          const player = sp.players
          return player ? `${player.name} ${player.surname} (${player.position})` : ''
        })
        .filter(Boolean)
        .join(', ')

      return {
        Manager: `${m.users?.first_name || ''} ${m.users?.last_name || ''}`.trim(),
        Email: m.users?.email || '',
        TeamName: m.team_name || '',
        PlayerCount: squadPlayers.length,
        Players: playersList
      }
    })
    const ws4 = XLSX.utils.json_to_sheet(managersTeamsData)
    ws4['!cols'] = [
      { width: 20 }, { width: 30 }, { width: 20 }, { width: 12 }, { width: 100 }
    ]
    XLSX.utils.book_append_sheet(workbook, ws4, 'Managers_And_Teams')

    // Sheet 5: Lineup Change Log
    const lineupLogData = lineupHistory.map((lh: any) => {
      const manager = `${lh.users?.first_name || ''} ${lh.users?.last_name || ''}`.trim()
      const gameweek = lh.gameweeks?.week || 'Unknown'
      const playerNames = (lh.player_ids || []).map((pid: string) => playerMap.get(pid) || 'Unknown').join(', ')
      const createdBy = lh.created_by_admin
        ? `Admin: ${lh.admin?.first_name || ''} ${lh.admin?.last_name || ''}`.trim()
        : 'Manager'

      return {
        Timestamp: formatDate(lh.created_at),
        Gameweek: gameweek,
        Manager: manager,
        Email: lh.users?.email || '',
        Players: playerNames,
        CreatedBy: createdBy
      }
    })
    const ws5 = XLSX.utils.json_to_sheet(lineupLogData)
    ws5['!cols'] = [
      { width: 20 }, { width: 10 }, { width: 20 }, { width: 30 }, { width: 60 }, { width: 20 }
    ]
    XLSX.utils.book_append_sheet(workbook, ws5, 'Lineup_Change_Log')

    // Cup sheets (only if cup exists)
    if (cup) {
      // Sheet 6: Cup Results
      const cupResultsData = cupMatches.map((match: any) => {
        const cupGw = match.cup_gameweeks
        const homeManager = match.home_manager
          ? `${match.home_manager.first_name || ''} ${match.home_manager.last_name || ''}`.trim()
          : match.home_team_source || 'TBD'
        const awayManager = match.away_manager
          ? `${match.away_manager.first_name || ''} ${match.away_manager.last_name || ''}`.trim()
          : match.away_team_source || 'TBD'

        return {
          CupWeek: cupGw?.cup_week || '',
          Stage: match.stage,
          Leg: match.leg || '',
          MatchNumber: match.match_number || '',
          GroupName: match.group_name || '',
          HomeTeam: homeManager,
          AwayTeam: awayManager,
          HomeScore: match.home_score ?? '',
          AwayScore: match.away_score ?? '',
          HomeAggregate: match.home_aggregate_score ?? '',
          AwayAggregate: match.away_aggregate_score ?? '',
          IsCompleted: match.is_completed ? 'YES' : 'NO'
        }
      })
      const ws6 = XLSX.utils.json_to_sheet(cupResultsData)
      ws6['!cols'] = [
        { width: 10 }, { width: 15 }, { width: 8 }, { width: 12 }, { width: 12 },
        { width: 20 }, { width: 20 }, { width: 10 }, { width: 10 },
        { width: 12 }, { width: 12 }, { width: 12 }
      ]
      XLSX.utils.book_append_sheet(workbook, ws6, 'Cup_Results')

      // Sheet 7: Cup Group Standings
      if (cupGroupStandings.length > 0) {
        const cupStandingsData = cupGroupStandings.map((s: any) => ({
          Group: s.group_name,
          Position: s.position,
          Manager: s.manager_name,
          Played: s.played,
          Won: s.won,
          Drawn: s.drawn,
          Lost: s.lost,
          GoalsFor: s.goals_for,
          GoalsAgainst: s.goals_against,
          GoalDifference: s.goal_difference,
          Points: s.points,
          Qualified: s.qualified ? 'YES' : 'NO'
        }))
        const ws7 = XLSX.utils.json_to_sheet(cupStandingsData)
        ws7['!cols'] = [
          { width: 10 }, { width: 10 }, { width: 20 },
          { width: 8 }, { width: 8 }, { width: 8 }, { width: 8 },
          { width: 10 }, { width: 12 }, { width: 12 }, { width: 8 }, { width: 10 }
        ]
        XLSX.utils.book_append_sheet(workbook, ws7, 'Cup_Group_Standings')
      }

      // Sheet 8: Cup Lineup Change Log
      if (cupLineupHistory.length > 0) {
        const cupLineupLogData = cupLineupHistory.map((clh: any) => {
          const manager = `${clh.users?.first_name || ''} ${clh.users?.last_name || ''}`.trim()
          const cupWeek = clh.cup_gameweeks?.cup_week || 'Unknown'
          const playerNames = (clh.player_ids || []).map((pid: string) => playerMap.get(pid) || 'Unknown').join(', ')

          return {
            Timestamp: formatDate(clh.created_at),
            CupWeek: cupWeek,
            Manager: manager,
            Email: clh.users?.email || '',
            Players: playerNames
          }
        })
        const ws8 = XLSX.utils.json_to_sheet(cupLineupLogData)
        ws8['!cols'] = [
          { width: 20 }, { width: 10 }, { width: 20 }, { width: 30 }, { width: 60 }
        ]
        XLSX.utils.book_append_sheet(workbook, ws8, 'Cup_Lineup_Change_Log')
      }
    }

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // Return file
    const filename = `${league.name}_${league.season}_Export_${new Date().toISOString().split('T')[0]}.xlsx`

    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error('Error exporting data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

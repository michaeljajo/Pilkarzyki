import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { recalculateLeagueStandings, recalculateCupGroupStandings } from '@/utils/standings-calculator'
import { calculateMatchScore, calculateLineupTotalGoals } from '@/utils/own-goal-calculator'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: gameweekId } = await params

    // Get matches for this gameweek
    const { data: matches, error: matchError } = await supabaseAdmin
      .from('matches')
      .select(`
        *,
        home_manager:users!matches_home_manager_id_fkey(
          id,
          email,
          first_name,
          last_name
        ),
        away_manager:users!matches_away_manager_id_fkey(
          id,
          email,
          first_name,
          last_name
        ),
        gameweeks(
          id,
          week,
          league_id,
          leagues(name, season)
        )
      `)
      .eq('gameweek_id', gameweekId)
      .order('id', { ascending: true })

    if (matchError) {
      console.error('Error fetching matches:', matchError)
      return NextResponse.json({ error: matchError.message }, { status: 500 })
    }

    // Get all lineups for this gameweek with manager and player details
    const { data: lineups, error } = await supabaseAdmin
      .from('lineups')
      .select(`
        *,
        users!lineups_manager_id_fkey(
          id,
          email,
          first_name,
          last_name
        ),
        gameweeks(
          id,
          week,
          league_id,
          leagues(name, season)
        )
      `)
      .eq('gameweek_id', gameweekId)

    if (error) {
      console.error('Error fetching lineups:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // OPTIMIZED: Batch fetch all players and results to avoid N+1 queries
    // Collect all unique player IDs across all lineups
    const allPlayerIds = Array.from(
      new Set(
        (lineups || [])
          .flatMap(lineup => lineup.player_ids || [])
          .filter(Boolean)
      )
    )

    // Batch fetch all players
    let playersMap = new Map()
    if (allPlayerIds.length > 0) {
      const { data: players, error: playersError } = await supabaseAdmin
        .from('players')
        .select('*')
        .in('id', allPlayerIds)

      if (playersError) {
        console.error('Error fetching players:', playersError)
      } else {
        playersMap = new Map(players?.map(p => [p.id, p]) || [])
      }
    }

    // Batch fetch all results for this gameweek
    let resultsMap = new Map()
    if (allPlayerIds.length > 0) {
      const { data: results, error: resultsError } = await supabaseAdmin
        .from('results')
        .select('player_id, goals, has_played')
        .eq('gameweek_id', gameweekId)
        .in('player_id', allPlayerIds)

      if (resultsError) {
        console.error('Error fetching results:', resultsError)
      } else {
        resultsMap = new Map(results?.map(r => [r.player_id, { goals: r.goals, has_played: r.has_played }]) || [])
      }
    }

    // Map lineups with their players and results (no more async operations)
    const lineupsWithPlayers = (lineups || []).map(lineup => {
      if (!lineup.player_ids || lineup.player_ids.length === 0) {
        return {
          ...lineup,
          players: []
        }
      }

      const playersWithResults = lineup.player_ids
        .map((playerId: string) => {
          const player = playersMap.get(playerId)
          if (!player) return null

          const result = resultsMap.get(playerId)
          return {
            ...player,
            goals_scored: result?.goals || 0,
            has_played: result?.has_played || false
          }
        })
        .filter(Boolean)

      return {
        ...lineup,
        players: playersWithResults
      }
    })

    return NextResponse.json({
      lineups: lineupsWithPlayers,
      matches: matches || []
    })
  } catch (error) {
    console.error('Error in gameweek lineups API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: gameweekId } = await params
    const { results } = await request.json()

    if (!Array.isArray(results)) {
      return NextResponse.json({
        error: 'Results must be an array of { player_id, goals, has_played? } objects'
      }, { status: 400 })
    }

    // Start a transaction-like operation
    const resultPromises = results.map(async ({ player_id, goals, has_played }) => {
      const { error } = await supabaseAdmin
        .from('results')
        .upsert({
          gameweek_id: gameweekId,
          player_id,
          goals: parseInt(goals) || 0,
          has_played: has_played !== undefined ? has_played : false
        }, {
          onConflict: 'gameweek_id,player_id'
        })

      if (error) {
        console.error('Error updating result:', error)
        throw error
      }
    })

    await Promise.all(resultPromises)

    // OPTIMIZED: Batch fetch all results once for lineup updates
    const { data: lineups } = await supabaseAdmin
      .from('lineups')
      .select('id, player_ids')
      .eq('gameweek_id', gameweekId)

    if (lineups && lineups.length > 0) {
      // Fetch all results for this gameweek once
      const { data: allResults } = await supabaseAdmin
        .from('results')
        .select('player_id, goals')
        .eq('gameweek_id', gameweekId)

      const resultsMap = new Map(allResults?.map(r => [r.player_id, r.goals]) || [])

      // Calculate totals and prepare batch update (excluding own goals)
      const lineupUpdates = lineups.map(lineup => {
        if (!lineup.player_ids || lineup.player_ids.length === 0) {
          return { id: lineup.id, total_goals: 0 }
        }

        const totalGoals = calculateLineupTotalGoals(
          lineup.player_ids,
          resultsMap
        )

        return { id: lineup.id, total_goals: totalGoals }
      })

      // Batch update all lineups
      for (const update of lineupUpdates) {
        const { error } = await supabaseAdmin
          .from('lineups')
          .update({ total_goals: update.total_goals })
          .eq('id', update.id)

        if (error) {
          console.error('Error updating lineup total:', error)
        }
      }
    }

    // OPTIMIZED: Update match scores using already-fetched data
    const { data: matches } = await supabaseAdmin
      .from('matches')
      .select('id, home_manager_id, away_manager_id')
      .eq('gameweek_id', gameweekId)

    if (matches && matches.length > 0) {
      // Fetch all lineups for this gameweek once (if not already fetched)
      const { data: allGameweekLineups } = await supabaseAdmin
        .from('lineups')
        .select('manager_id, player_ids')
        .eq('gameweek_id', gameweekId)

      // Create a map of manager_id -> lineup
      const lineupsMapByManager = new Map(
        allGameweekLineups?.map(l => [l.manager_id, l]) || []
      )

      // We already have resultsMap from the lineup updates above
      // Reuse it or fetch again if needed
      const { data: allResults } = await supabaseAdmin
        .from('results')
        .select('player_id, goals')
        .eq('gameweek_id', gameweekId)

      const resultsMap = new Map(allResults?.map(r => [r.player_id, r.goals]) || [])

      // Calculate match scores without additional queries (with own goal logic)
      const matchUpdates = matches.map(match => {
        const homeLineup = lineupsMapByManager.get(match.home_manager_id)
        const awayLineup = lineupsMapByManager.get(match.away_manager_id)

        // Use utility function to calculate scores with own goal logic
        const { homeScore, awayScore } = calculateMatchScore(
          homeLineup?.player_ids || [],
          awayLineup?.player_ids || [],
          resultsMap
        )

        return {
          id: match.id,
          home_score: homeScore,
          away_score: awayScore,
          is_completed: true
        }
      })

      // Batch update all matches
      for (const update of matchUpdates) {
        const { error } = await supabaseAdmin
          .from('matches')
          .update({
            home_score: update.home_score,
            away_score: update.away_score,
            is_completed: update.is_completed
          })
          .eq('id', update.id)

        if (error) {
          console.error('Error updating match score:', error)
        }
      }
    }

    // Update cup match scores
    const { data: cupGameweeks } = await supabaseAdmin
      .from('cup_gameweeks')
      .select('id, cup_id')
      .eq('league_gameweek_id', gameweekId)

    if (cupGameweeks && cupGameweeks.length > 0) {
      // Collect unique cup IDs for standings recalculation
      const cupIds = new Set<string>()

      for (const cupGameweek of cupGameweeks) {
        cupIds.add(cupGameweek.cup_id)

        // Get cup matches for this cup gameweek
        const { data: cupMatches } = await supabaseAdmin
          .from('cup_matches')
          .select('id, home_manager_id, away_manager_id, stage, leg, match_number')
          .eq('cup_gameweek_id', cupGameweek.id)

        if (cupMatches && cupMatches.length > 0) {
          // Get cup lineups for this cup gameweek
          const { data: cupLineups } = await supabaseAdmin
            .from('cup_lineups')
            .select('manager_id, player_ids')
            .eq('cup_gameweek_id', cupGameweek.id)

          const cupLineupsMapByManager = new Map(
            cupLineups?.map(l => [l.manager_id, l]) || []
          )

          // Fetch results for this gameweek
          const { data: allResults } = await supabaseAdmin
            .from('results')
            .select('player_id, goals')
            .eq('gameweek_id', gameweekId)

          const resultsMap = new Map(allResults?.map(r => [r.player_id, r.goals]) || [])

          // Check if this is a knockout decider (for ET inclusion in main score)
          const { data: cupGwDetails } = await supabaseAdmin
            .from('cup_gameweeks')
            .select('stage, leg')
            .eq('id', cupGameweek.id)
            .single()

          const isKnockoutDecider = cupGwDetails &&
            cupGwDetails.stage !== 'group_stage' &&
            (cupGwDetails.leg === 2 || cupGwDetails.stage === 'final')

          // Fetch ET lineups for knockout deciders
          let etLineupsMapByManager = new Map<string, { manager_id: string; player_ids: string[] }>()
          let etLineups: { manager_id: string; player_ids: string[] }[] = []
          if (isKnockoutDecider) {
            const { data: fetchedEtLineups } = await supabaseAdmin
              .from('cup_et_lineups')
              .select('manager_id, player_ids')
              .eq('cup_gameweek_id', cupGameweek.id)

            if (fetchedEtLineups && fetchedEtLineups.length > 0) {
              etLineups = fetchedEtLineups
              etLineupsMapByManager = new Map(
                fetchedEtLineups.map(l => [l.manager_id, l])
              )
            }
          }

          // Calculate cup match scores — for knockout deciders, include ET player goals in the main score
          const cupMatchUpdates = cupMatches.map(match => {
            const homeLineup = cupLineupsMapByManager.get(match.home_manager_id)
            const awayLineup = cupLineupsMapByManager.get(match.away_manager_id)

            // Regular score from cup lineups only
            const { homeScore: regularHome, awayScore: regularAway } = calculateMatchScore(
              homeLineup?.player_ids || [],
              awayLineup?.player_ids || [],
              resultsMap
            )

            // ET score (knockout deciders only)
            let etHomeScore = 0
            let etAwayScore = 0
            if (isKnockoutDecider) {
              const homeEtLineup = etLineupsMapByManager.get(match.home_manager_id)
              const awayEtLineup = etLineupsMapByManager.get(match.away_manager_id)
              if (homeEtLineup || awayEtLineup) {
                const etResult = calculateMatchScore(
                  homeEtLineup?.player_ids || [],
                  awayEtLineup?.player_ids || [],
                  resultsMap
                )
                etHomeScore = etResult.homeScore
                etAwayScore = etResult.awayScore
              }
            }

            return {
              id: match.id,
              home_score: regularHome + etHomeScore,
              away_score: regularAway + etAwayScore,
              home_et_score: isKnockoutDecider ? etHomeScore : undefined,
              away_et_score: isKnockoutDecider ? etAwayScore : undefined,
              is_completed: true
            }
          })

          // Batch update all cup matches
          for (const update of cupMatchUpdates) {
            const updateData: Record<string, unknown> = {
              home_score: update.home_score,
              away_score: update.away_score,
              is_completed: update.is_completed
            }
            if (update.home_et_score !== undefined) {
              updateData.home_et_score = update.home_et_score
              updateData.away_et_score = update.away_et_score
            }

            const { error } = await supabaseAdmin
              .from('cup_matches')
              .update(updateData)
              .eq('id', update.id)

            if (error) {
              console.error('Error updating cup match score:', error)
            }
          }

          // Calculate aggregate scores for leg 2 knockout matches
          const leg2Matches = cupMatches.filter(m => m.leg === 2 && m.stage !== 'group_stage')
          if (leg2Matches.length > 0) {
            // Get all cup_gameweek IDs for this cup to scope leg 1 lookup
            const { data: allCupGws } = await supabaseAdmin
              .from('cup_gameweeks')
              .select('id')
              .eq('cup_id', cupGameweek.cup_id)

            const allCupGwIds = allCupGws?.map(g => g.id) || []

            for (const leg2Match of leg2Matches) {
              const leg2Update = cupMatchUpdates.find(u => u.id === leg2Match.id)
              if (!leg2Update) continue

              // Find leg 1 match: same stage, leg=1, within the same cup
              // Use match_number if available, otherwise fall back to manager matching
              let leg1Query = supabaseAdmin
                .from('cup_matches')
                .select('home_score, away_score, home_manager_id, away_manager_id')
                .in('cup_gameweek_id', allCupGwIds)
                .eq('stage', leg2Match.stage)
                .eq('leg', 1)

              if (leg2Match.match_number != null) {
                leg1Query = leg1Query.eq('match_number', leg2Match.match_number)
              }

              const { data: leg1Matches } = await leg1Query

              // If no match_number, find by manager pairing (swapped home/away)
              let leg1 = leg1Matches?.[0]
              if (!leg2Match.match_number && leg1Matches && leg1Matches.length > 1) {
                leg1 = leg1Matches.find(m =>
                  m.home_manager_id === leg2Match.away_manager_id &&
                  m.away_manager_id === leg2Match.home_manager_id
                ) || leg1Matches[0]
              }

              if (leg1) {
                // Determine if managers are swapped between legs
                // Leg 1: A(home) vs B(away), Leg 2: B(home) vs A(away)
                let leg2HomeAggregate: number
                let leg2AwayAggregate: number

                if (leg2Match.home_manager_id === leg1.away_manager_id) {
                  // Normal swap: leg2 home was leg1 away
                  leg2HomeAggregate = leg2Update.home_score + (leg1.away_score || 0)
                  leg2AwayAggregate = leg2Update.away_score + (leg1.home_score || 0)
                } else {
                  // Same order
                  leg2HomeAggregate = leg2Update.home_score + (leg1.home_score || 0)
                  leg2AwayAggregate = leg2Update.away_score + (leg1.away_score || 0)
                }

                await supabaseAdmin
                  .from('cup_matches')
                  .update({
                    home_aggregate_score: leg2HomeAggregate,
                    away_aggregate_score: leg2AwayAggregate
                  })
                  .eq('id', leg2Match.id)
              }
            }
          }

          // Also recalculate leg 2 aggregates when leg 1 results are re-saved
          const leg1KnockoutMatches = cupMatches.filter(m => m.leg === 1 && m.stage !== 'group_stage' && m.stage !== 'final')
          if (leg1KnockoutMatches.length > 0) {
            const { data: allCupGws } = await supabaseAdmin
              .from('cup_gameweeks')
              .select('id')
              .eq('cup_id', cupGameweek.cup_id)

            const allCupGwIds = allCupGws?.map(g => g.id) || []

            for (const leg1Match of leg1KnockoutMatches) {
              const leg1Update = cupMatchUpdates.find(u => u.id === leg1Match.id)
              if (!leg1Update) continue

              // Find the corresponding leg 2 match
              let leg2Query = supabaseAdmin
                .from('cup_matches')
                .select('id, home_score, away_score, home_manager_id, away_manager_id')
                .in('cup_gameweek_id', allCupGwIds)
                .eq('stage', leg1Match.stage)
                .eq('leg', 2)

              if (leg1Match.match_number != null) {
                leg2Query = leg2Query.eq('match_number', leg1Match.match_number)
              }

              const { data: leg2Matches } = await leg2Query

              let leg2 = leg2Matches?.[0]
              if (!leg1Match.match_number && leg2Matches && leg2Matches.length > 1) {
                leg2 = leg2Matches.find(m =>
                  m.home_manager_id === leg1Match.away_manager_id &&
                  m.away_manager_id === leg1Match.home_manager_id
                ) || leg2Matches[0]
              }

              if (leg2 && leg2.home_score != null) {
                let leg2HomeAggregate: number
                let leg2AwayAggregate: number

                if (leg2.home_manager_id === leg1Match.away_manager_id) {
                  leg2HomeAggregate = (leg2.home_score || 0) + leg1Update.away_score
                  leg2AwayAggregate = (leg2.away_score || 0) + leg1Update.home_score
                } else {
                  leg2HomeAggregate = (leg2.home_score || 0) + leg1Update.home_score
                  leg2AwayAggregate = (leg2.away_score || 0) + leg1Update.away_score
                }

                await supabaseAdmin
                  .from('cup_matches')
                  .update({
                    home_aggregate_score: leg2HomeAggregate,
                    away_aggregate_score: leg2AwayAggregate
                  })
                  .eq('id', leg2.id)
              }
            }
          }

          // Update cup lineup total_goals (excluding own goals)
          if (cupLineups && cupLineups.length > 0) {
            for (const lineup of cupLineups) {
              if (lineup.player_ids && lineup.player_ids.length > 0) {
                const totalGoals = calculateLineupTotalGoals(
                  lineup.player_ids,
                  resultsMap
                )

                await supabaseAdmin
                  .from('cup_lineups')
                  .update({ total_goals: totalGoals })
                  .eq('cup_gameweek_id', cupGameweek.id)
                  .eq('manager_id', lineup.manager_id)
              }
            }
          }

          // Update ET lineup total_goals
          if (etLineups.length > 0) {
            for (const etLineup of etLineups) {
              if (etLineup.player_ids && etLineup.player_ids.length > 0) {
                const totalGoals = calculateLineupTotalGoals(
                  etLineup.player_ids,
                  resultsMap
                )

                await supabaseAdmin
                  .from('cup_et_lineups')
                  .update({ total_goals: totalGoals })
                  .eq('cup_gameweek_id', cupGameweek.id)
                  .eq('manager_id', etLineup.manager_id)
              }
            }
          }
        }
      }

      // Recalculate cup group standings after updating all cup match results
      for (const cupId of cupIds) {
        try {
          await recalculateCupGroupStandings(cupId)
        } catch (cupStandingsError) {
          console.error('Error updating cup group standings:', cupStandingsError)
          // Don't fail the entire request if standings update fails
        }
      }
    }

    // Recalculate league standings after updating match results
    try {
      // Get the league ID from the gameweek
      const { data: gameweek } = await supabaseAdmin
        .from('gameweeks')
        .select('league_id')
        .eq('id', gameweekId)
        .single()

      if (gameweek?.league_id) {
        await recalculateLeagueStandings(gameweek.league_id)
      }
    } catch (standingsError) {
      console.error('Error updating league standings:', standingsError)
      // Don't fail the entire request if standings update fails
    }

    return NextResponse.json({ message: 'Results updated successfully' })
  } catch (error) {
    console.error('Error in gameweek lineups PUT API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
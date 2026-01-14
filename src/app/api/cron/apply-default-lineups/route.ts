import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()

    // Find all gameweeks that have passed their lock_date but are not yet completed
    const { data: lockedGameweeks, error: fetchError } = await supabaseAdmin
      .from('gameweeks')
      .select('id, league_id, week, lock_date, is_completed')
      .eq('is_completed', false)
      .lt('lock_date', now.toISOString())

    if (fetchError) {
      console.error('[Cron] Error fetching locked gameweeks:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!lockedGameweeks || lockedGameweeks.length === 0) {
      return NextResponse.json({
        message: 'No locked gameweeks to process',
        appliedLineups: 0,
        appliedCupLineups: 0
      })
    }


    let totalAppliedLineups = 0
    let totalAppliedCupLineups = 0
    const errors = []

    // Process each locked gameweek
    for (const gameweek of lockedGameweeks) {
      try {

        // Get all managers in this league (via squads)
        const { data: squads } = await supabaseAdmin
          .from('squads')
          .select('manager_id')
          .eq('league_id', gameweek.league_id)

        if (!squads || squads.length === 0) {
          continue
        }

        const managerIds = squads.map(s => s.manager_id)

        // Get existing lineups for this gameweek
        const { data: existingLineups } = await supabaseAdmin
          .from('lineups')
          .select('manager_id')
          .eq('gameweek_id', gameweek.id)

        const managersWithLineups = new Set(existingLineups?.map(l => l.manager_id) || [])
        const managersWithoutLineups = managerIds.filter(id => !managersWithLineups.has(id))


        // Apply default lineups for managers without lineups
        for (const managerId of managersWithoutLineups) {
          // Get manager's default lineup
          const { data: defaultLineup } = await supabaseAdmin
            .from('default_lineups')
            .select('player_ids')
            .eq('manager_id', managerId)
            .eq('league_id', gameweek.league_id)
            .single()

          if (defaultLineup && defaultLineup.player_ids && defaultLineup.player_ids.length > 0) {
            // Create lineup from default
            const { error: insertError } = await supabaseAdmin
              .from('lineups')
              .insert({
                manager_id: managerId,
                gameweek_id: gameweek.id,
                player_ids: defaultLineup.player_ids,
                is_locked: true,
                total_goals: 0,
                is_from_default: true
              })

            if (insertError) {
              console.error(`[Cron] Error inserting default lineup for manager ${managerId}:`, insertError)
              errors.push({ managerId, gameweekId: gameweek.id, error: insertError.message })
            } else {
              totalAppliedLineups++
            }
          } else {
          }
        }

        // Now handle cup lineups if this gameweek has cup matches
        const { data: cupGameweeks } = await supabaseAdmin
          .from('cup_gameweeks')
          .select('id, cup_id')
          .eq('league_gameweek_id', gameweek.id)

        if (cupGameweeks && cupGameweeks.length > 0) {
          for (const cupGameweek of cupGameweeks) {
            // Get all managers participating in cup matches for this cup gameweek
            const { data: cupMatches } = await supabaseAdmin
              .from('cup_matches')
              .select('home_manager_id, away_manager_id')
              .eq('cup_gameweek_id', cupGameweek.id)

            if (!cupMatches || cupMatches.length === 0) continue

            const cupManagerIds = new Set<string>()
            cupMatches.forEach(match => {
              cupManagerIds.add(match.home_manager_id)
              cupManagerIds.add(match.away_manager_id)
            })

            // Get existing cup lineups
            const { data: existingCupLineups } = await supabaseAdmin
              .from('cup_lineups')
              .select('manager_id')
              .eq('cup_gameweek_id', cupGameweek.id)

            const managersWithCupLineups = new Set(existingCupLineups?.map(l => l.manager_id) || [])
            const managersWithoutCupLineups = Array.from(cupManagerIds).filter(
              id => !managersWithCupLineups.has(id)
            )


            // Apply default cup lineups
            for (const managerId of managersWithoutCupLineups) {
              const { data: defaultCupLineup } = await supabaseAdmin
                .from('default_cup_lineups')
                .select('player_ids')
                .eq('manager_id', managerId)
                .eq('cup_id', cupGameweek.cup_id)
                .single()

              if (defaultCupLineup && defaultCupLineup.player_ids && defaultCupLineup.player_ids.length > 0) {
                const { error: insertError } = await supabaseAdmin
                  .from('cup_lineups')
                  .insert({
                    manager_id: managerId,
                    cup_gameweek_id: cupGameweek.id,
                    player_ids: defaultCupLineup.player_ids,
                    is_locked: true,
                    total_goals: 0,
                    is_from_default: true
                  })

                if (insertError) {
                  console.error(`[Cron] Error inserting default cup lineup for manager ${managerId}:`, insertError)
                  errors.push({ managerId, cupGameweekId: cupGameweek.id, error: insertError.message })
                } else {
                  totalAppliedCupLineups++
                }
              } else {
              }
            }
          }
        }

      } catch (error) {
        console.error(`[Cron] Unexpected error processing gameweek ${gameweek.id}:`, error)
        errors.push({
          gameweekId: gameweek.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    if (errors.length > 0) {
      console.error(`[Cron] Encountered ${errors.length} errors`)
    }

    return NextResponse.json({
      message: `Applied ${totalAppliedLineups} default lineups and ${totalAppliedCupLineups} default cup lineups`,
      appliedLineups: totalAppliedLineups,
      appliedCupLineups: totalAppliedCupLineups,
      processedGameweeks: lockedGameweeks.length,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('[Cron] Fatal error in apply-default-lineups cron:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

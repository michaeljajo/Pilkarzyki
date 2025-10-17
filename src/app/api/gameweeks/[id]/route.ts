import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updates = await request.json()

    // Get the current gameweek data before updating
    const { data: currentGameweek } = await supabaseAdmin
      .from('gameweeks')
      .select('league_id, week, is_completed')
      .eq('id', id)
      .single()

    // If setting as current, unset all other current gameweeks
    if (updates.is_current) {
      await supabaseAdmin
        .from('gameweeks')
        .update({ is_current: false })
        .neq('id', id)
    }

    const { data, error } = await supabaseAdmin
      .from('gameweeks')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If gameweek is being marked as completed, advance the league's current_gameweek
    if (currentGameweek && updates.is_completed === true && currentGameweek.is_completed === false) {
      console.log(`Gameweek ${currentGameweek.week} marked as completed, advancing league...`)

      // Get current league data
      const { data: league } = await supabaseAdmin
        .from('leagues')
        .select('current_gameweek')
        .eq('id', currentGameweek.league_id)
        .single()

      // Only advance if this gameweek matches the league's current gameweek
      if (league && league.current_gameweek === currentGameweek.week) {
        const nextGameweek = currentGameweek.week + 1

        // Check if the next gameweek exists
        const { data: nextGameweekExists } = await supabaseAdmin
          .from('gameweeks')
          .select('id')
          .eq('league_id', currentGameweek.league_id)
          .eq('week', nextGameweek)
          .single()

        if (nextGameweekExists) {
          // Advance the league to the next gameweek
          const { error: leagueError } = await supabaseAdmin
            .from('leagues')
            .update({ current_gameweek: nextGameweek })
            .eq('id', currentGameweek.league_id)

          if (leagueError) {
            console.error('Error advancing league gameweek:', leagueError)
          } else {
            console.log(`League advanced to gameweek ${nextGameweek}`)
          }
        } else {
          console.log(`No next gameweek (${nextGameweek}) found, season may be complete`)
        }
      }
    }

    return NextResponse.json({ gameweek: data })
  } catch (error) {
    console.error('Error in gameweek PUT API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabaseAdmin
      .from('gameweeks')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Gameweek deleted successfully' })
  } catch (error) {
    console.error('Error in gameweek DELETE API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
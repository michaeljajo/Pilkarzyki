import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { auth } from '@clerk/nextjs/server'
import { verifyLeagueAdmin } from '@/lib/auth-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    const { id } = await params
    console.log('GET /api/leagues/[id]/gameweeks - userId:', userId, 'leagueId:', id)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is admin of this league
    const { isAdmin, error: authError } = await verifyLeagueAdmin(userId, id)
    if (!isAdmin) {
      return NextResponse.json({ error: authError || 'Forbidden' }, { status: 403 })
    }

    const { data, error } = await supabaseAdmin
      .from('gameweeks')
      .select('*')
      .eq('league_id', id)
      .order('week', { ascending: true })

    console.log('Gameweeks query result:', { data, error })

    if (error) {
      console.error('Error fetching gameweeks:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ gameweeks: data || [] })
  } catch (error) {
    console.error('GET gameweeks catch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    const { id } = await params
    console.log('POST /api/leagues/[id]/gameweeks - userId:', userId, 'leagueId:', id)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is admin of this league
    const { isAdmin, error: authError } = await verifyLeagueAdmin(userId, id)
    if (!isAdmin) {
      return NextResponse.json({ error: authError || 'Forbidden' }, { status: 403 })
    }

    const { gameweeks } = await request.json()
    console.log('Creating gameweeks:', gameweeks)

    // Check if league exists
    const { data: league, error: leagueError } = await supabaseAdmin
      .from('leagues')
      .select('*')
      .eq('id', id)
      .single()

    if (leagueError || !league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 })
    }

    // Insert gameweeks
    const gameweeksToInsert = gameweeks.map((gw: { week: number; startDate: string; endDate: string; lockDate?: string }) => ({
      league_id: id,
      week: gw.week,
      start_date: gw.startDate,
      end_date: gw.endDate,
      lock_date: gw.lockDate || gw.startDate,
      is_completed: false
    }))

    const { data, error } = await supabaseAdmin
      .from('gameweeks')
      .insert(gameweeksToInsert)
      .select('*')

    if (error) {
      console.error('Error creating gameweeks:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('Successfully created gameweeks:', data)
    return NextResponse.json({ gameweeks: data })
  } catch (error) {
    console.error('POST gameweeks catch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
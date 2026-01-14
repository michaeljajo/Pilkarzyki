import { NextRequest, NextResponse } from 'next/server'
import { createClerkSupabaseClientSsr } from '@/lib/supabase-server'
import { auth } from '@clerk/nextjs/server'
import { Position } from '@/types'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }


    const { searchParams } = new URL(request.url)
    const managerId = searchParams.get('managerId')
    const league = searchParams.get('league')

    // Temporarily use admin client to test RLS issue
    const supabase = supabaseAdmin

    let query = supabase
      .from('players')
      .select(`
        *,
        manager:users(id, first_name, last_name)
      `)
      .order('name')

    if (managerId) {
      query = query.eq('manager_id', managerId)
    }

    if (league) {
      query = query.eq('league', league)
    }

    const { data, error } = await query

    if (error) {
      console.error('Players API database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ players: data })
  } catch (error) {
    console.error('Players API catch block error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, surname, league, position, managerId } = await request.json()

    // Validate position
    const validPositions: Position[] = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward']
    if (!validPositions.includes(position)) {
      return NextResponse.json({ error: 'Invalid position' }, { status: 400 })
    }

    const supabase = await createClerkSupabaseClientSsr()

    const { data, error } = await supabase
      .from('players')
      .insert({
        name,
        surname,
        league,
        position,
        manager_id: managerId || null,
        total_goals: 0
      })
      .select(`
        *,
        manager:users(id, first_name, last_name)
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ player: data })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Bulk import endpoint for Excel/CSV imports
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { players } = await request.json()

    if (!Array.isArray(players) || players.length === 0) {
      return NextResponse.json({ error: 'Invalid players data' }, { status: 400 })
    }

    const supabase = await createClerkSupabaseClientSsr()

    // Validate all players before inserting
    const validPositions: Position[] = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward']

    for (const player of players) {
      if (!validPositions.includes(player.position)) {
        return NextResponse.json({
          error: `Invalid position: ${player.position} for player ${player.name} ${player.surname}`
        }, { status: 400 })
      }
    }

    // Get manager IDs for Manager column (if provided)
    const managerEmails = [...new Set(players.map(p => p.manager).filter(Boolean))]
    const managerMap: { [email: string]: string } = {}

    if (managerEmails.length > 0) {
      const { data: managers } = await supabase
        .from('users')
        .select('id, email')
        .in('email', managerEmails)

      managers?.forEach(manager => {
        managerMap[manager.email] = manager.id
      })
    }

    // Transform players for insertion
    const playersToInsert = players.map(player => ({
      name: player.name,
      surname: player.surname,
      league: player.league,
      position: player.position,
      manager_id: player.manager ? managerMap[player.manager] || null : null,
      total_goals: 0
    }))

    const { data, error } = await supabase
      .from('players')
      .insert(playersToInsert)
      .select(`
        *,
        manager:users(id, first_name, last_name, email)
      `)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      players: data,
      imported: data.length,
      message: `Successfully imported ${data.length} players`
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
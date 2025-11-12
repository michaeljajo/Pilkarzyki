import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: leagueId } = await params

    // Get user's database ID
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get squad for this user and league
    const { data: squad, error: squadError } = await supabaseAdmin
      .from('squads')
      .select('id, manager_id, league_id, team_name')
      .eq('manager_id', user.id)
      .eq('league_id', leagueId)
      .single()

    if (squadError) {
      // No squad found - user not part of this league
      return NextResponse.json({ squad: null })
    }

    return NextResponse.json({ squad })
  } catch (error) {
    console.error('Error fetching squad info:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

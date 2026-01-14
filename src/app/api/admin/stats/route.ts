import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }


    // Use admin client for reliable stats
    const [usersResult, leaguesResult, playersResult, gameweeksResult] = await Promise.all([
      supabaseAdmin.from('users').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('leagues').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('players').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('gameweeks').select('id', { count: 'exact', head: true }).eq('is_completed', false)
    ])

    const stats = {
      totalUsers: usersResult.count || 0,
      totalLeagues: leaguesResult.count || 0,
      totalPlayers: playersResult.count || 0,
      activeGameweeks: gameweeksResult.count || 0
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    // Return default stats instead of error to prevent timeout
    return NextResponse.json({
      stats: {
        totalUsers: 0,
        totalLeagues: 0,
        totalPlayers: 0,
        activeGameweeks: 0
      }
    })
  }
}
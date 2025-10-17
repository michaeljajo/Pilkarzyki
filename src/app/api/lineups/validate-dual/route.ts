import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateDualLineups } from '@/utils/validation'

/**
 * POST /api/lineups/validate-dual
 * Validate both league and cup lineups together
 * Body: { leaguePlayerIds: string[], cupPlayerIds: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { leaguePlayerIds, cupPlayerIds } = await request.json()

    if (!Array.isArray(leaguePlayerIds) || !Array.isArray(cupPlayerIds)) {
      return NextResponse.json(
        { error: 'leaguePlayerIds and cupPlayerIds arrays are required' },
        { status: 400 }
      )
    }

    // Fetch player data for both lineups
    const allPlayerIds = [...new Set([...leaguePlayerIds, ...cupPlayerIds])]

    const { data: players, error: playersError } = await supabaseAdmin
      .from('players')
      .select('*')
      .in('id', allPlayerIds)

    if (playersError) {
      return NextResponse.json({ error: playersError.message }, { status: 500 })
    }

    if (!players) {
      return NextResponse.json({ error: 'Failed to fetch player data' }, { status: 500 })
    }

    // Create player lookup map
    const playerMap = new Map(players.map(p => [p.id, p]))

    // Build lineup arrays
    const leagueLineup = leaguePlayerIds
      .map(id => playerMap.get(id))
      .filter(p => p !== undefined)

    const cupLineup = cupPlayerIds
      .map(id => playerMap.get(id))
      .filter(p => p !== undefined)

    // Validate dual lineups
    const validation = validateDualLineups(leagueLineup, cupLineup)

    return NextResponse.json({
      isValid: validation.isValid,
      leagueErrors: validation.leagueErrors,
      cupErrors: validation.cupErrors,
      crossLineupErrors: validation.crossLineupErrors
    })
  } catch (error) {
    console.error('Error validating dual lineups:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

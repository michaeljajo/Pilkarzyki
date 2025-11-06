import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validateTeamName, formatTeamName } from '@/utils/team-name-resolver'

/**
 * PATCH /api/squads/[id]/team-name
 * Set or update team name for a squad
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: squadId } = await context.params
    const body = await request.json()
    const { teamName } = body

    if (!teamName) {
      return NextResponse.json({ error: 'Nazwa drużyny jest wymagana' }, { status: 400 })
    }

    // Validate team name
    const validation = validateTeamName(teamName)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Get user's internal ID
    const { data: userRecord } = await supabaseAdmin
      .from('users')
      .select('id, is_admin')
      .eq('clerk_id', userId)
      .single()

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get squad details
    const { data: squad, error: squadError } = await supabaseAdmin
      .from('squads')
      .select('id, manager_id, league_id')
      .eq('id', squadId)
      .single()

    if (squadError || !squad) {
      return NextResponse.json({ error: 'Squad not found' }, { status: 404 })
    }

    // Verify user owns this squad (or is admin)
    if (squad.manager_id !== userRecord.id && !userRecord.is_admin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if team name is already taken in this league
    const formattedName = formatTeamName(teamName)
    const { data: existingSquad } = await supabaseAdmin
      .from('squads')
      .select('id')
      .eq('league_id', squad.league_id)
      .eq('team_name', formattedName)
      .neq('id', squadId)
      .single()

    if (existingSquad) {
      return NextResponse.json({ error: 'Ta nazwa drużyny jest już zajęta w tej lidze' }, { status: 409 })
    }

    // Update team name
    const { error: updateError } = await supabaseAdmin
      .from('squads')
      .update({ team_name: formattedName })
      .eq('id', squadId)

    if (updateError) {
      console.error('Error updating team name:', updateError)
      return NextResponse.json({ error: 'Failed to update team name' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      teamName: formattedName
    })
  } catch (error) {
    console.error('Error in team name update:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getQualifiedTeams } from '@/utils/knockout-resolver'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: cupId } = await context.params

    const { teams, error } = await getQualifiedTeams(cupId)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    // Group teams by group name
    const teamsByGroup = teams.reduce((acc, team) => {
      if (!acc[team.groupName]) {
        acc[team.groupName] = []
      }
      acc[team.groupName].push(team)
      return acc
    }, {} as Record<string, typeof teams>)

    return NextResponse.json({
      teams,
      teamsByGroup,
      totalQualified: teams.length
    })

  } catch (error) {
    console.error('Error fetching qualified teams:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

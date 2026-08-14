/**
 * Mid-Season Draft Export API
 * Exports current squad data in the format required for draft upload
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { fetchAllRows } from '@/lib/fetch-all-rows'
import * as XLSX from 'xlsx'

interface ExportManager {
  id: string
  email: string | null
  first_name: string | null
  last_name: string | null
}

interface ExportPlayerRow {
  id: string
  name: string
  surname: string | null
  position: string
  club: string | null
  football_league: string | null
  manager_id: string | null
  // PostgREST returns the embedded row as an object, but types it as an array
  // for to-many relationships — the reader below handles both.
  users: ExportManager | ExportManager[] | null
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('clerk_id', userId)
      .single()

    if (userError || !user?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get leagueId from query params
    const { searchParams } = new URL(request.url)
    const leagueId = searchParams.get('leagueId')

    if (!leagueId) {
      return NextResponse.json({ error: 'League ID required' }, { status: 400 })
    }

    // Verify league exists and get its name
    const { data: league, error: leagueError } = await supabaseAdmin
      .from('leagues')
      .select('id, name')
      .eq('id', leagueId)
      .single()

    if (leagueError || !league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 })
    }

    const leagueName = league.name

    // Get all players in this league with their current manager assignments.
    // Paged: an unpaged select silently stops at 1000 rows, which would have
    // exported a fifth of a full ~5000-player pool as if it were the whole
    // thing. The `id` tiebreaker keeps the sort total so no row is dropped or
    // duplicated across page boundaries.
    const players = await fetchAllRows<ExportPlayerRow>((from, to) =>
      supabaseAdmin
        .from('players')
        .select(`
          id,
          name,
          surname,
          position,
          club,
          football_league,
          manager_id,
          users:manager_id (
            id,
            email,
            first_name,
            last_name
          )
        `)
        .eq('league_id', leagueId)
        .order('name', { ascending: true })
        .order('id', { ascending: true })
        .range(from, to)
    )

    // Get squad/team name for each manager
    const { data: squads, error: squadsError } = await supabaseAdmin
      .from('squads')
      .select('manager_id, team_name')
      .eq('league_id', leagueId)

    const teamNameMap = new Map<string, string>()
    if (squads) {
      squads.forEach(squad => {
        if (squad.manager_id && squad.team_name) {
          teamNameMap.set(squad.manager_id, squad.team_name)
        }
      })
    }

    // Format data for Excel export
    const exportData = players.map(player => {
      const manager = Array.isArray(player.users) ? player.users[0] : player.users
      const fullName = `${player.name}${player.surname ? ' ' + player.surname : ''}`

      let managerEmail = ''
      let teamName = ''

      if (manager) {
        managerEmail = manager.email || ''
        teamName = teamNameMap.get(manager.id) || ''
      }

      return {
        Name: fullName,
        Position: player.position,
        Club: player.club,
        League: player.football_league || '',
        Manager: managerEmail,
        'Team Name': teamName
      }
    })

    // Create workbook
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(exportData)

    // Set column widths for better readability
    worksheet['!cols'] = [
      { width: 25 }, // Name
      { width: 12 }, // Position
      { width: 20 }, // Club
      { width: 20 }, // League
      { width: 30 }, // Manager
      { width: 25 }  // Team Name
    ]

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Current Squads')

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // Create filename with league name and date
    const date = new Date().toISOString().split('T')[0]
    const filename = `${leagueName.replace(/\s+/g, '-')}-squads-${date}.xlsx`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=${filename}`
      }
    })

  } catch (error) {
    console.error('Squad export error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

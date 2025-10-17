import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import * as XLSX from 'xlsx'
import { Position, PlayerImport } from '@/types'

interface ImportResult {
  success: boolean
  imported: number
  skipped: number
  errors: string[]
  details: {
    players: Record<string, unknown>[]
    squads: Record<string, unknown>[]
  }
}

export async function POST(request: NextRequest) {
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

    const formData = await request.formData()
    const file = formData.get('file') as File
    const leagueId = formData.get('leagueId') as string

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    if (!leagueId) {
      return NextResponse.json({ error: 'League ID required' }, { status: 400 })
    }

    // Verify league exists
    const { data: league, error: leagueError } = await supabaseAdmin
      .from('leagues')
      .select('id')
      .eq('id', leagueId)
      .single()

    if (leagueError || !league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 })
    }

    // Parse Excel file
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer)
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet) as PlayerImport[]

    if (!jsonData || jsonData.length === 0) {
      return NextResponse.json({ error: 'No data found in file' }, { status: 400 })
    }

    // Validate required columns
    const requiredColumns = ['Name', 'Surname', 'League', 'Position', 'Manager']
    const firstRow = jsonData[0]
    const missingColumns = requiredColumns.filter(col => !(col in firstRow))

    if (missingColumns.length > 0) {
      return NextResponse.json({
        error: `Missing required columns: ${missingColumns.join(', ')}`
      }, { status: 400 })
    }

    const result: ImportResult = {
      success: true,
      imported: 0,
      skipped: 0,
      errors: [],
      details: {
        players: [],
        squads: []
      }
    }

    // Get existing users from Clerk for manager matching
    const client = await clerkClient()
    const clerkUsers = await client.users.getUserList()

    // Transform Clerk users to match expected format
    const existingUsers = clerkUsers.data.map(user => ({
      clerk_id: user.id,
      email: user.emailAddresses[0]?.emailAddress || '',
      first_name: user.firstName || '',
      last_name: user.lastName || ''
    }))


    // Process each row
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i]
      const rowNum = i + 2 // Excel row number (1-indexed + header row)

      try {
        // Validate required fields
        if (!row.Name || !row.Surname || !row.League || !row.Position || !row.Manager) {
          result.errors.push(`Row ${rowNum}: Missing required fields`)
          result.skipped++
          continue
        }

        // Validate position
        const validPositions: Position[] = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward']
        if (!validPositions.includes(row.Position as Position)) {
          result.errors.push(`Row ${rowNum}: Invalid position "${row.Position}". Must be one of: ${validPositions.join(', ')}`)
          result.skipped++
          continue
        }

        // Find manager by email or name
        const clerkManager = existingUsers.find(user =>
          user.email === row.Manager ||
          `${user.first_name} ${user.last_name}`.toLowerCase() === row.Manager.toLowerCase() ||
          user.first_name?.toLowerCase() === row.Manager.toLowerCase()
        )

        if (!clerkManager) {
          result.errors.push(`Row ${rowNum}: Manager "${row.Manager}" not found`)
          result.skipped++
          continue
        }

        // Ensure manager exists in Supabase users table
        const { data: supabaseManager, error: managerError } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('clerk_id', clerkManager.clerk_id)
          .single()

        if (managerError && managerError.code === 'PGRST116') {
          // Manager doesn't exist in Supabase, create them
          const { data: newManager, error: createError } = await supabaseAdmin
            .from('users')
            .insert({
              clerk_id: clerkManager.clerk_id,
              email: clerkManager.email,
              first_name: clerkManager.first_name,
              last_name: clerkManager.last_name,
              is_admin: false
            })
            .select('id')
            .single()

          if (createError) {
            result.errors.push(`Row ${rowNum}: Failed to create manager in database - ${createError.message}`)
            result.skipped++
            continue
          }
          supabaseManager = newManager
        } else if (managerError) {
          result.errors.push(`Row ${rowNum}: Failed to fetch manager from database - ${managerError.message}`)
          result.skipped++
          continue
        }

        const manager = supabaseManager

        // Check if player already exists
        const { data: existingPlayer } = await supabaseAdmin
          .from('players')
          .select('id')
          .eq('name', row.Name)
          .eq('surname', row.Surname)
          .eq('league', row.League)
          .single()

        if (existingPlayer) {
          result.errors.push(`Row ${rowNum}: Player "${row.Name} ${row.Surname}" already exists in ${row.League}`)
          result.skipped++
          continue
        }

        // Insert player
        const { data: player, error: playerError } = await supabaseAdmin
          .from('players')
          .insert({
            name: row.Name,
            surname: row.Surname,
            league: row.League,
            position: row.Position,
            manager_id: manager.id,
            total_goals: 0
          })
          .select()
          .single()

        if (playerError) {
          result.errors.push(`Row ${rowNum}: Failed to create player - ${playerError.message}`)
          result.skipped++
          continue
        }

        result.details.players.push(player)
        result.imported++

        // Create or update squad
        const { data: existingSquad } = await supabaseAdmin
          .from('squads')
          .select('id')
          .eq('manager_id', manager.id)
          .eq('league_id', leagueId)
          .single()

        let squadId = existingSquad?.id

        if (!existingSquad) {
          const { data: newSquad, error: squadError } = await supabaseAdmin
            .from('squads')
            .insert({
              manager_id: manager.id,
              league_id: leagueId
            })
            .select()
            .single()

          if (squadError) {
            result.errors.push(`Row ${rowNum}: Failed to create squad - ${squadError.message}`)
            continue
          }

          squadId = newSquad.id
          result.details.squads.push(newSquad)
        }

        // Add player to squad
        if (squadId) {
          const { error: squadPlayerError } = await supabaseAdmin
            .from('squad_players')
            .insert({
              squad_id: squadId,
              player_id: player.id
            })

          if (squadPlayerError) {
            result.errors.push(`Row ${rowNum}: Failed to add player to squad - ${squadPlayerError.message}`)
          }
        }

      } catch (error) {
        result.errors.push(`Row ${rowNum}: Unexpected error - ${error instanceof Error ? error.message : 'Unknown error'}`)
        result.skipped++
      }
    }

    return NextResponse.json({
      message: `Import completed. ${result.imported} players imported, ${result.skipped} skipped.`,
      result
    })

  } catch (error) {
    console.error('Player import error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Template download endpoint
export async function GET() {
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

    // Create template data
    const templateData = [
      {
        Name: 'Lionel',
        Surname: 'Messi',
        League: 'La Liga',
        Position: 'Forward',
        Manager: 'manager@example.com'
      },
      {
        Name: 'Virgil',
        Surname: 'van Dijk',
        League: 'Premier League',
        Position: 'Defender',
        Manager: 'manager@example.com'
      },
      {
        Name: 'Luka',
        Surname: 'Modric',
        League: 'La Liga',
        Position: 'Midfielder',
        Manager: 'manager2@example.com'
      }
    ]

    // Create workbook
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(templateData)

    // Set column widths
    worksheet['!cols'] = [
      { width: 15 }, // Name
      { width: 15 }, // Surname
      { width: 20 }, // League
      { width: 12 }, // Position
      { width: 25 }  // Manager
    ]

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Players')

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="player-import-template.xlsx"'
      }
    })

  } catch (error) {
    console.error('Template download error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
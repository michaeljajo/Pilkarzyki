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

    // Parse Excel file
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer)
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet) as PlayerImport[]

    if (!jsonData || jsonData.length === 0) {
      return NextResponse.json({ error: 'No data found in file' }, { status: 400 })
    }

    // Validate required columns (League is not required - uses the league being imported to)
    const requiredColumns = ['Name', 'Position', 'Club']
    const firstRow = jsonData[0]
    const missingColumns = requiredColumns.filter(col => !(col in firstRow))

    if (missingColumns.length > 0) {
      return NextResponse.json({
        error: `Missing required columns: ${missingColumns.join(', ')}. Optional: Manager`
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

    // Fetch ALL users by paginating through all pages
    let allClerkUsers: any[] = []
    let offset = 0
    const limit = 100 // Max limit per page

    while (true) {
      const clerkUsers = await client.users.getUserList({ limit, offset })
      allClerkUsers = allClerkUsers.concat(clerkUsers.data)

      // Break if we've fetched all users
      if (allClerkUsers.length >= clerkUsers.totalCount) {
        break
      }

      offset += limit
    }

    // Transform Clerk users to match expected format
    const existingUsers = allClerkUsers.map(user => ({
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
        if (!row.Name || !row.Position || !row.Club) {
          result.errors.push(`Row ${rowNum}: Missing required fields (Name, Position, Club)`)
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

        // Parse full name into first name and surname
        const nameParts = row.Name.trim().split(/\s+/)
        const firstName = nameParts[0] || ''
        const surname = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ''

        if (!firstName) {
          result.errors.push(`Row ${rowNum}: Name cannot be empty`)
          result.skipped++
          continue
        }

        // Manager is now optional
        let clerkManager = null
        if (row.Manager && row.Manager.trim()) {
          const managerValue = row.Manager.trim()
          clerkManager = existingUsers.find(user =>
            user.email === managerValue ||
            `${user.first_name} ${user.last_name}`.toLowerCase() === managerValue.toLowerCase() ||
            user.first_name?.toLowerCase() === managerValue.toLowerCase()
          )

          if (!clerkManager) {
            result.errors.push(`Row ${rowNum}: Manager "${managerValue}" not found`)
            result.skipped++
            continue
          }
        }

        // Ensure manager exists in Supabase users table (if manager was specified)
        let manager = null
        if (clerkManager) {
          const { data: supabaseManager, error: managerError } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('clerk_id', clerkManager.clerk_id)
            .single()

          manager = supabaseManager

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
            manager = newManager
          } else if (managerError) {
            result.errors.push(`Row ${rowNum}: Failed to fetch manager from database - ${managerError.message}`)
            result.skipped++
            continue
          }

          if (!manager) {
            result.errors.push(`Row ${rowNum}: Manager data is missing`)
            result.skipped++
            continue
          }
        }

        // Check if player already exists in this league
        const { data: existingPlayer } = await supabaseAdmin
          .from('players')
          .select('id')
          .eq('name', firstName)
          .eq('surname', surname)
          .eq('league', leagueName)
          .single()

        if (existingPlayer) {
          result.errors.push(`Row ${rowNum}: Player "${row.Name}" already exists in ${leagueName}`)
          result.skipped++
          continue
        }

        // Insert player (using the league name from the league being imported to)
        const { data: player, error: playerError } = await supabaseAdmin
          .from('players')
          .insert({
            name: firstName,
            surname: surname,
            league: leagueName,
            position: row.Position,
            club: row.Club,
            football_league: row.League || null,
            manager_id: manager?.id || null,
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

        // Create or update squad (only if manager is assigned)
        if (manager) {
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
        Name: 'Lionel Messi',
        Position: 'Forward',
        Club: 'Inter Miami',
        League: 'MLS',
        Manager: 'manager@example.com'
      },
      {
        Name: 'Virgil van Dijk',
        Position: 'Defender',
        Club: 'Liverpool FC',
        League: 'Premier League',
        Manager: 'manager@example.com'
      },
      {
        Name: 'Luka Modric',
        Position: 'Midfielder',
        Club: 'Real Madrid',
        League: 'La Liga',
        Manager: 'manager2@example.com'
      }
    ]

    // Create workbook
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(templateData)

    // Set column widths
    worksheet['!cols'] = [
      { width: 20 }, // Name
      { width: 12 }, // Position
      { width: 20 }, // Club
      { width: 20 }, // League
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
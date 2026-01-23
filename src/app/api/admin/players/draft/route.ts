/**
 * Mid-Season Draft Upload API
 * Handles player reassignments during mid-season draft
 * Preserves historical data by creating transfer records
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import * as XLSX from 'xlsx'
import { Position, PlayerImport } from '@/types'
import { validateTeamName, formatTeamName } from '@/utils/team-name-resolver'
import { createPlayerTransfer, validateTransferDate, getNextTransferDate } from '@/utils/transfer-resolver'

interface DraftResult {
  success: boolean
  transferred: number
  created: number
  unchanged: number
  unassigned: number
  errors: string[]
  details: {
    transfers: Array<{
      playerName: string
      fromManager: string
      toManager: string
    }>
    newPlayers: Array<{
      playerName: string
      manager: string
    }>
    unassignedPlayers: Array<{
      playerName: string
      fromManager: string
    }>
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: adminUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('is_admin, id')
      .eq('clerk_id', userId)
      .single()

    if (userError || !adminUser?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const leagueId = formData.get('leagueId') as string
    const effectiveDateStr = formData.get('effectiveDate') as string | null

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

    // Determine effective date for transfers
    let effectiveDate: Date
    if (effectiveDateStr) {
      effectiveDate = new Date(effectiveDateStr)
    } else {
      // Default to next gameweek start date
      const nextDate = await getNextTransferDate(leagueId)
      if (!nextDate) {
        return NextResponse.json({
          error: 'Could not determine next transfer date. Please specify an effective date.'
        }, { status: 400 })
      }
      effectiveDate = nextDate
    }

    // Validate transfer date doesn't affect locked gameweeks
    const validation = await validateTransferDate(leagueId, effectiveDate)
    if (!validation.isValid) {
      return NextResponse.json({
        error: validation.error || 'Invalid transfer date'
      }, { status: 400 })
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
    const requiredColumns = ['Name', 'Position', 'Club']
    const firstRow = jsonData[0]
    const missingColumns = requiredColumns.filter(col => !(col in firstRow))

    if (missingColumns.length > 0) {
      return NextResponse.json({
        error: `Missing required columns: ${missingColumns.join(', ')}. Optional: Manager`
      }, { status: 400 })
    }

    const result: DraftResult = {
      success: true,
      transferred: 0,
      created: 0,
      unchanged: 0,
      unassigned: 0,
      errors: [],
      details: {
        transfers: [],
        newPlayers: [],
        unassignedPlayers: []
      }
    }

    // Get existing users from Clerk for manager matching
    const client = await clerkClient()
    let allClerkUsers: any[] = []
    let offset = 0
    const limit = 100

    while (true) {
      const clerkUsers = await client.users.getUserList({ limit, offset })
      allClerkUsers = allClerkUsers.concat(clerkUsers.data)
      if (allClerkUsers.length >= clerkUsers.totalCount) {
        break
      }
      offset += limit
    }

    const existingUsers = allClerkUsers.map(user => ({
      clerk_id: user.id,
      email: user.emailAddresses[0]?.emailAddress || '',
      first_name: user.firstName || '',
      last_name: user.lastName || ''
    }))

    // Get all existing players in this league to detect transfers
    const { data: existingPlayers } = await supabaseAdmin
      .from('players')
      .select(`
        id,
        name,
        surname,
        position,
        manager_id,
        club,
        football_league
      `)
      .eq('league', leagueName)

    const existingPlayersMap = new Map(
      existingPlayers?.map(p => [`${p.name}|${p.surname}`, p]) || []
    )

    // Process each row
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i]
      const rowNum = i + 2 // Excel row number (1-indexed + header row)

      try {
        // Validate required fields
        if (!row.Name || !row.Position || !row.Club) {
          result.errors.push(`Row ${rowNum}: Missing required fields (Name, Position, Club)`)
          continue
        }

        // Validate position
        const validPositions: Position[] = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward']
        if (!validPositions.includes(row.Position as Position)) {
          result.errors.push(`Row ${rowNum}: Invalid position "${row.Position}". Must be one of: ${validPositions.join(', ')}`)
          continue
        }

        // Parse full name into first name and surname
        const nameParts = row.Name.trim().split(/\s+/)
        const firstName = nameParts[0] || ''
        const surname = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ''

        if (!firstName) {
          result.errors.push(`Row ${rowNum}: Name cannot be empty`)
          continue
        }

        // Find or resolve manager
        let newManager = null
        if (row.Manager && row.Manager.trim()) {
          const managerValue = row.Manager.trim()
          const clerkManager = existingUsers.find(user =>
            user.email === managerValue ||
            `${user.first_name} ${user.last_name}`.toLowerCase() === managerValue.toLowerCase() ||
            user.first_name?.toLowerCase() === managerValue.toLowerCase()
          )

          if (!clerkManager) {
            result.errors.push(`Row ${rowNum}: Manager "${managerValue}" not found`)
            continue
          }

          // Ensure manager exists in Supabase users table
          const { data: supabaseManager, error: managerError } = await supabaseAdmin
            .from('users')
            .select('id, first_name, last_name, email')
            .eq('clerk_id', clerkManager.clerk_id)
            .single()

          if (managerError && managerError.code === 'PGRST116') {
            // Create manager if doesn't exist
            const { data: createdManager, error: createError } = await supabaseAdmin
              .from('users')
              .insert({
                clerk_id: clerkManager.clerk_id,
                email: clerkManager.email,
                first_name: clerkManager.first_name,
                last_name: clerkManager.last_name,
                is_admin: false
              })
              .select('id, first_name, last_name, email')
              .single()

            if (createError) {
              result.errors.push(`Row ${rowNum}: Failed to create manager - ${createError.message}`)
              continue
            }
            newManager = createdManager
          } else if (managerError) {
            result.errors.push(`Row ${rowNum}: Failed to fetch manager - ${managerError.message}`)
            continue
          } else {
            newManager = supabaseManager
          }
        }

        // Check if player already exists
        const playerKey = `${firstName}|${surname}`
        const existingPlayer = existingPlayersMap.get(playerKey)

        if (existingPlayer) {
          // EXISTING PLAYER - Check for transfer
          const oldManagerId = existingPlayer.manager_id
          const newManagerId = newManager?.id || null

          if (oldManagerId === newManagerId) {
            // No change in manager
            result.unchanged++
            continue
          }

          // TRANSFER DETECTED
          // Get old manager name for reporting
          let oldManagerName = 'Unassigned'
          if (oldManagerId) {
            const { data: oldMgr } = await supabaseAdmin
              .from('users')
              .select('first_name, last_name, email')
              .eq('id', oldManagerId)
              .single()

            if (oldMgr) {
              oldManagerName = oldMgr.first_name && oldMgr.last_name
                ? `${oldMgr.first_name} ${oldMgr.last_name}`
                : oldMgr.email
            }
          }

          const newManagerName = newManager
            ? (newManager.first_name && newManager.last_name
              ? `${newManager.first_name} ${newManager.last_name}`
              : newManager.email)
            : 'Unassigned'

          // Create transfer record
          const transfer = await createPlayerTransfer(
            existingPlayer.id,
            newManagerId,
            effectiveDate,
            'draft',
            leagueId,
            adminUser.id,
            `Draft transfer: ${oldManagerName} → ${newManagerName}`
          )

          if (!transfer.success) {
            result.errors.push(`Row ${rowNum}: Failed to create transfer record for ${row.Name} - ${transfer.error}`)
            console.error(`Transfer error details for ${row.Name}:`, transfer.details)
            continue
          }

          // Update squads
          if (oldManagerId) {
            // Remove from old squad
            const { data: oldSquad } = await supabaseAdmin
              .from('squads')
              .select('id')
              .eq('manager_id', oldManagerId)
              .eq('league_id', leagueId)
              .single()

            if (oldSquad) {
              await supabaseAdmin
                .from('squad_players')
                .delete()
                .eq('squad_id', oldSquad.id)
                .eq('player_id', existingPlayer.id)
            }
          }

          if (newManagerId) {
            // Add to new squad (create squad if doesn't exist)
            let squadId: string | null = null
            const { data: existingSquad } = await supabaseAdmin
              .from('squads')
              .select('id')
              .eq('manager_id', newManagerId)
              .eq('league_id', leagueId)
              .single()

            if (existingSquad) {
              squadId = existingSquad.id
            } else {
              // Process team name if provided
              let teamName: string | null = null
              if (row['Team Name'] && typeof row['Team Name'] === 'string' && row['Team Name'].trim()) {
                const validation = validateTeamName(row['Team Name'].trim())
                if (validation.valid) {
                  teamName = formatTeamName(row['Team Name'].trim())
                }
              }

              const { data: newSquad, error: squadError } = await supabaseAdmin
                .from('squads')
                .insert({
                  manager_id: newManagerId,
                  league_id: leagueId,
                  team_name: teamName
                })
                .select('id')
                .single()

              if (squadError) {
                result.errors.push(`Row ${rowNum}: Failed to create squad - ${squadError.message}`)
                continue
              }
              squadId = newSquad.id
            }

            // Add player to new squad
            const { error: squadPlayerError } = await supabaseAdmin
              .from('squad_players')
              .insert({
                squad_id: squadId,
                player_id: existingPlayer.id
              })

            if (squadPlayerError && squadPlayerError.code !== '23505') { // Ignore duplicate key errors
              result.errors.push(`Row ${rowNum}: Failed to add player to squad - ${squadPlayerError.message}`)
              continue
            }
          }

          result.transferred++
          result.details.transfers.push({
            playerName: row.Name,
            fromManager: oldManagerName,
            toManager: newManagerName
          })

        } else {
          // NEW PLAYER - Create player with transfer record
          const { data: player, error: playerError } = await supabaseAdmin
            .from('players')
            .insert({
              name: firstName,
              surname: surname,
              league: leagueName,
              position: row.Position,
              club: row.Club,
              football_league: row.League || null,
              manager_id: newManager?.id || null,
              total_goals: 0
            })
            .select()
            .single()

          if (playerError) {
            result.errors.push(`Row ${rowNum}: Failed to create player - ${playerError.message}`)
            continue
          }

          // Create initial transfer record for new player
          const transfer = await createPlayerTransfer(
            player.id,
            newManager?.id || null,
            effectiveDate,
            'draft',
            leagueId,
            adminUser.id,
            `New player added via draft`
          )

          if (!transfer.success) {
            result.errors.push(`Row ${rowNum}: Failed to create transfer record for new player ${row.Name} - ${transfer.error}`)
            console.error(`Transfer error details for new player ${row.Name}:`, transfer.details)
          }

          // Add to squad if manager assigned
          if (newManager) {
            let squadId: string | null = null
            const { data: existingSquad } = await supabaseAdmin
              .from('squads')
              .select('id')
              .eq('manager_id', newManager.id)
              .eq('league_id', leagueId)
              .single()

            if (existingSquad) {
              squadId = existingSquad.id
            } else {
              // Process team name if provided
              let teamName: string | null = null
              if (row['Team Name'] && typeof row['Team Name'] === 'string' && row['Team Name'].trim()) {
                const validation = validateTeamName(row['Team Name'].trim())
                if (validation.valid) {
                  teamName = formatTeamName(row['Team Name'].trim())
                }
              }

              const { data: newSquad, error: squadError } = await supabaseAdmin
                .from('squads')
                .insert({
                  manager_id: newManager.id,
                  league_id: leagueId,
                  team_name: teamName
                })
                .select('id')
                .single()

              if (squadError) {
                result.errors.push(`Row ${rowNum}: Failed to create squad - ${squadError.message}`)
                continue
              }
              squadId = newSquad.id
            }

            await supabaseAdmin
              .from('squad_players')
              .insert({
                squad_id: squadId,
                player_id: player.id
              })
          }

          result.created++
          result.details.newPlayers.push({
            playerName: row.Name,
            manager: newManager
              ? (newManager.first_name && newManager.last_name
                ? `${newManager.first_name} ${newManager.last_name}`
                : newManager.email)
              : 'Unassigned'
          })
        }

      } catch (error) {
        result.errors.push(`Row ${rowNum}: Unexpected error - ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // STEP 2: Detect players who are NO LONGER in the file and should be unassigned
    // Build a set of all player names that appear in the uploaded file
    const playersInFile = new Set<string>()
    for (const row of jsonData) {
      if (row.Name) {
        const nameParts = row.Name.trim().split(/\s+/)
        const firstName = nameParts[0] || ''
        const surname = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ''
        playersInFile.add(`${firstName}|${surname}`)
      }
    }

    // Find players in this league who have a manager but are NOT in the uploaded file
    const { data: allLeaguePlayers } = await supabaseAdmin
      .from('players')
      .select(`
        id,
        name,
        surname,
        manager_id,
        users:manager_id (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('league', leagueName)
      .not('manager_id', 'is', null) // Only players currently assigned to a manager

    // Check each assigned player - if not in file, unassign them
    for (const player of allLeaguePlayers || []) {
      const playerKey = `${player.name}|${player.surname}`

      if (!playersInFile.has(playerKey)) {
        // This player is NOT in the uploaded file - they should be unassigned
        const oldManager = Array.isArray(player.users) ? player.users[0] : player.users
        const oldManagerName = oldManager
          ? (oldManager.first_name && oldManager.last_name
            ? `${oldManager.first_name} ${oldManager.last_name}`
            : oldManager.email)
          : 'Unknown'

        // Create transfer to NULL (unassigned)
        const transfer = await createPlayerTransfer(
          player.id,
          null, // NULL manager = unassigned
          effectiveDate,
          'draft',
          leagueId,
          adminUser.id,
          `Draft removal: Player no longer in squad`
        )

        if (!transfer.success) {
          result.errors.push(`Failed to unassign ${player.name} ${player.surname} from ${oldManagerName} - ${transfer.error}`)
          console.error(`Unassignment error details for ${player.name} ${player.surname}:`, transfer.details)
          continue
        }

        // Remove from squad
        if (player.manager_id) {
          const { data: squad } = await supabaseAdmin
            .from('squads')
            .select('id')
            .eq('manager_id', player.manager_id)
            .eq('league_id', leagueId)
            .single()

          if (squad) {
            await supabaseAdmin
              .from('squad_players')
              .delete()
              .eq('squad_id', squad.id)
              .eq('player_id', player.id)
          }
        }

        result.unassigned++
        result.details.unassignedPlayers.push({
          playerName: `${player.name} ${player.surname}`,
          fromManager: oldManagerName
        })
      }
    }

    return NextResponse.json({
      message: `Draft processed. ${result.transferred} transfers, ${result.created} new players, ${result.unassigned} unassigned, ${result.unchanged} unchanged.`,
      effectiveDate: effectiveDate.toISOString(),
      result
    })

  } catch (error) {
    console.error('Draft upload error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

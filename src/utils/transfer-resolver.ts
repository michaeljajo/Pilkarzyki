/**
 * Transfer Resolver Utilities
 * Helper functions for resolving player-manager relationships across time periods
 * Used to maintain historical data integrity during mid-season drafts
 */

import { supabaseAdmin } from '@/lib/supabase'
import { PlayerTransferRow } from '@/types'

/**
 * Get the manager who owned a player during a specific gameweek
 * Uses the player_transfers table to resolve historical ownership
 *
 * @param playerId - UUID of the player
 * @param gameweekId - UUID of the gameweek
 * @returns Manager ID or null if player was unassigned
 */
export async function getManagerAtGameweek(
  playerId: string,
  gameweekId: string
): Promise<string | null> {
  try {
    // Use the database function for efficient lookup
    const { data, error } = await supabaseAdmin.rpc('get_manager_at_gameweek', {
      p_player_id: playerId,
      p_gameweek_id: gameweekId
    })

    if (error) {
      console.error('Error resolving manager at gameweek:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Exception in getManagerAtGameweek:', error)
    return null
  }
}

/**
 * Get current (active) manager for a player
 * Returns the manager from the transfer record where effective_until IS NULL
 *
 * @param playerId - UUID of the player
 * @returns Manager ID or null if player is unassigned
 */
export async function getCurrentManager(playerId: string): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin.rpc('get_current_manager', {
      p_player_id: playerId
    })

    if (error) {
      console.error('Error getting current manager:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Exception in getCurrentManager:', error)
    return null
  }
}

/**
 * Get all transfers for a player, ordered chronologically
 * Useful for displaying transfer history
 *
 * @param playerId - UUID of the player
 * @returns Array of transfer records
 */
export async function getPlayerTransferHistory(
  playerId: string
): Promise<PlayerTransferRow[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('player_transfers')
      .select('*')
      .eq('player_id', playerId)
      .order('effective_from', { ascending: true })

    if (error) {
      console.error('Error fetching player transfer history:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Exception in getPlayerTransferHistory:', error)
    return []
  }
}

/**
 * Create a new player transfer record
 * Automatically closes previous active transfer for the player
 *
 * @param playerId - UUID of the player being transferred
 * @param managerId - UUID of the new manager (null for unassigned)
 * @param effectiveFrom - Date when transfer becomes effective
 * @param transferType - Type of transfer (initial, draft, swap)
 * @param leagueId - UUID of the league (required for data isolation)
 * @param createdBy - UUID of admin creating the transfer
 * @param notes - Optional notes about the transfer
 * @returns Created transfer record or null on error
 */
export async function createPlayerTransfer(
  playerId: string,
  managerId: string | null,
  effectiveFrom: Date,
  transferType: 'initial' | 'draft' | 'swap',
  leagueId: string,
  createdBy?: string,
  notes?: string
): Promise<{ success: true; data: PlayerTransferRow } | { success: false; error: string; details?: any }> {
  try {
    // Get player and verify it exists
    const { data: player, error: playerError } = await supabaseAdmin
      .from('players')
      .select('id, league')
      .eq('id', playerId)
      .single()

    if (playerError || !player) {
      console.error('Player not found:', { playerId, playerError })
      return {
        success: false,
        error: `Player not found: ${playerId}`,
        details: playerError
      }
    }

    // Get league by ID to verify player belongs to it
    const { data: league, error: leagueError } = await supabaseAdmin
      .from('leagues')
      .select('id, name')
      .eq('id', leagueId)
      .single()

    if (leagueError || !league) {
      console.error('League not found:', { leagueId, leagueError })
      return {
        success: false,
        error: `League not found: ${leagueId}`,
        details: leagueError
      }
    }

    // Verify player's league name matches the league's name
    if (player.league !== league.name) {
      console.error('Player does not belong to the specified league', {
        playerLeague: player.league,
        leagueName: league.name
      })
      return {
        success: false,
        error: `Player league mismatch: player is in "${player.league}" but transfer is for "${league.name}"`,
        details: { playerLeague: player.league, leagueName: league.name }
      }
    }

    console.log('Transfer validation passed:', {
      playerId,
      playerLeague: player.league,
      leagueId,
      leagueName: league.name,
      managerId,
      transferType
    })

    const { data, error } = await supabaseAdmin
      .from('player_transfers')
      .insert({
        player_id: playerId,
        manager_id: managerId,
        league_id: leagueId,
        effective_from: effectiveFrom.toISOString(),
        effective_until: null, // New transfer is active
        transfer_type: transferType,
        created_by: createdBy,
        notes: notes
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating player transfer:', {
        error,
        playerId,
        managerId,
        leagueId,
        playerLeague: player.league,
        leagueName: league.name,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      return {
        success: false,
        error: `Database error: ${error.message}`,
        details: {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          playerId,
          managerId,
          leagueId
        }
      }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Exception in createPlayerTransfer:', error)
    return {
      success: false,
      error: `Exception: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    }
  }
}

/**
 * Batch resolve managers for multiple players at a specific gameweek
 * More efficient than calling getManagerAtGameweek multiple times
 *
 * @param playerIds - Array of player UUIDs
 * @param gameweekId - UUID of the gameweek
 * @param leagueId - UUID of the league (required for proper data isolation)
 * @returns Map of playerId -> managerId (or null)
 */
export async function batchGetManagersAtGameweek(
  playerIds: string[],
  gameweekId: string,
  leagueId: string
): Promise<Map<string, string | null>> {
  const resultMap = new Map<string, string | null>()

  if (playerIds.length === 0) {
    return resultMap
  }

  try {
    // Get gameweek start date and verify league
    const { data: gameweek, error: gameweekError } = await supabaseAdmin
      .from('gameweeks')
      .select('start_date, league_id')
      .eq('id', gameweekId)
      .single()

    if (gameweekError || !gameweek) {
      console.error('Error fetching gameweek:', gameweekError)
      return resultMap
    }

    // Verify gameweek belongs to the specified league
    if (gameweek.league_id !== leagueId) {
      console.error('Gameweek does not belong to specified league')
      return resultMap
    }

    const gameweekStart = gameweek.start_date

    // Fetch all relevant transfers in one query
    // CRITICAL: Filter by league_id to prevent cross-league data leakage
    const { data: transfers, error: transfersError } = await supabaseAdmin
      .from('player_transfers')
      .select('player_id, manager_id, effective_from, effective_until')
      .in('player_id', playerIds)
      .eq('league_id', leagueId)
      .lte('effective_from', gameweekStart)
      .or(`effective_until.is.null,effective_until.gte.${gameweekStart}`)

    if (transfersError) {
      console.error('Error fetching transfers:', transfersError)
      return resultMap
    }

    // For each player, find the most recent transfer before/during gameweek
    for (const playerId of playerIds) {
      const playerTransfers = transfers?.filter(t => t.player_id === playerId) || []

      if (playerTransfers.length === 0) {
        resultMap.set(playerId, null)
        continue
      }

      // Sort by effective_from descending and take the first one
      const activeTransfer = playerTransfers.sort((a, b) =>
        new Date(b.effective_from).getTime() - new Date(a.effective_from).getTime()
      )[0]

      resultMap.set(playerId, activeTransfer.manager_id)
    }

    return resultMap
  } catch (error) {
    console.error('Exception in batchGetManagersAtGameweek:', error)
    return resultMap
  }
}

/**
 * Get the effective date for a new transfer
 * Should be the start date of the next unlocked gameweek
 *
 * @param leagueId - UUID of the league
 * @returns Date when transfers should become effective
 */
export async function getNextTransferDate(leagueId: string): Promise<Date | null> {
  try {
    // Find the next gameweek that hasn't started yet
    const { data: nextGameweek, error } = await supabaseAdmin
      .from('gameweeks')
      .select('start_date, lock_date')
      .eq('league_id', leagueId)
      .gte('lock_date', new Date().toISOString())
      .order('week', { ascending: true })
      .limit(1)
      .single()

    if (error || !nextGameweek) {
      console.error('Error finding next gameweek:', error)
      return null
    }

    return new Date(nextGameweek.start_date)
  } catch (error) {
    console.error('Exception in getNextTransferDate:', error)
    return null
  }
}

/**
 * Validate that a transfer date doesn't affect locked/completed gameweeks
 *
 * @param leagueId - UUID of the league
 * @param effectiveDate - Proposed transfer effective date
 * @returns Object with isValid flag and error message if invalid
 */
export async function validateTransferDate(
  leagueId: string,
  effectiveDate: Date
): Promise<{ isValid: boolean; error?: string }> {
  try {
    // Check if the effective date falls within or before any completed gameweeks
    // A transfer is invalid if it would affect gameweeks that are already locked/completed
    const { data: conflictingGameweeks, error } = await supabaseAdmin
      .from('gameweeks')
      .select('week, start_date, end_date, is_completed')
      .eq('league_id', leagueId)
      .eq('is_completed', true)
      .gte('end_date', effectiveDate.toISOString())

    if (error) {
      return { isValid: false, error: 'Error validating transfer date' }
    }

    if (conflictingGameweeks && conflictingGameweeks.length > 0) {
      const weeks = conflictingGameweeks.map(gw => gw.week).join(', ')
      return {
        isValid: false,
        error: `Cannot backdate transfers into locked/completed gameweeks: ${weeks}`
      }
    }

    return { isValid: true }
  } catch (error) {
    console.error('Exception in validateTransferDate:', error)
    return { isValid: false, error: 'Exception during validation' }
  }
}

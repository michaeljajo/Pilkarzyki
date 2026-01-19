import { supabaseAdmin } from '@/lib/supabase'

/**
 * Verifies that a user is an admin of a specific league
 * Uses the league_admins junction table to support multiple admins per league
 * @param clerkUserId - The Clerk user ID
 * @param leagueId - The league ID to check
 * @returns Object with isAdmin boolean and optional userInternalId
 */
export async function verifyLeagueAdmin(clerkUserId: string, leagueId: string): Promise<{
  isAdmin: boolean
  userInternalId?: string
  error?: string
}> {
  try {
    // Get user's internal ID
    const { data: userRecord, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUserId)
      .single()

    if (userError || !userRecord) {
      return { isAdmin: false, error: 'User not found' }
    }

    // Check if user is in the league_admins table for this league
    const { data: adminRecord, error: adminError } = await supabaseAdmin
      .from('league_admins')
      .select('id')
      .eq('league_id', leagueId)
      .eq('user_id', userRecord.id)
      .maybeSingle()

    if (adminError) {
      console.error('Error checking league admin:', adminError)
      return { isAdmin: false, error: 'Error checking admin status' }
    }

    const isAdmin = !!adminRecord

    return {
      isAdmin,
      userInternalId: userRecord.id,
      error: isAdmin ? undefined : 'You are not an admin of this league'
    }
  } catch (error) {
    console.error('Error verifying league admin:', error)
    return { isAdmin: false, error: 'Internal server error' }
  }
}

/**
 * Checks if a user administers any leagues
 * Uses the league_admins junction table to support multiple admins per league
 * Note: No longer uses global admin status - users must be explicitly added as league admins
 * @param clerkUserId - The Clerk user ID
 * @returns Boolean indicating if user has admin access to any league
 */
export async function userAdminsAnyLeague(clerkUserId: string): Promise<boolean> {
  try {
    // Get user's internal ID
    const { data: userRecord, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUserId)
      .single()

    if (userError || !userRecord) {
      return false
    }

    // Check if user is admin of any active league via league_admins table
    const { data: adminRecords, error: adminError } = await supabaseAdmin
      .from('league_admins')
      .select('league_id, leagues!inner(is_active)')
      .eq('user_id', userRecord.id)
      .limit(1)

    if (adminError) {
      console.error('Error checking league admins:', adminError)
      return false
    }

    // Filter for active leagues
    const hasActiveLeague = adminRecords?.some((record: any) =>
      record.leagues?.is_active === true
    )

    return !!hasActiveLeague
  } catch (error) {
    console.error('Error checking if user admins any league:', error)
    return false
  }
}

/**
 * Gets leagues where the user is a manager (has a squad)
 * @param clerkUserId - The Clerk user ID
 * @returns Array of league IDs where user is a manager
 */
export async function getUserManagedLeagueIds(clerkUserId: string): Promise<string[]> {
  try {
    // Get user's internal ID
    const { data: userRecord, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUserId)
      .single()

    if (userError || !userRecord) {
      return []
    }

    // Get squads where user is the manager
    const { data: squads, error: squadsError} = await supabaseAdmin
      .from('squads')
      .select('league_id')
      .eq('manager_id', userRecord.id)

    if (squadsError) {
      console.error('Error fetching user squads:', squadsError)
      return []
    }

    return squads?.map(squad => squad.league_id) || []
  } catch (error) {
    console.error('Error getting user managed leagues:', error)
    return []
  }
}

/**
 * Gets all admins for a specific league
 * @param leagueId - The league ID
 * @returns Array of user records who are admins of the league
 */
export async function getLeagueAdmins(leagueId: string): Promise<Array<{
  id: string
  email: string
  firstName?: string
  lastName?: string
}>> {
  try {
    const { data: adminRecords, error } = await supabaseAdmin
      .from('league_admins')
      .select('user_id, users!inner(id, email, first_name, last_name)')
      .eq('league_id', leagueId)

    if (error) {
      console.error('Error fetching league admins:', error)
      return []
    }

    return adminRecords?.map((record: any) => ({
      id: record.users.id,
      email: record.users.email,
      firstName: record.users.first_name,
      lastName: record.users.last_name
    })) || []
  } catch (error) {
    console.error('Error getting league admins:', error)
    return []
  }
}

/**
 * Adds a user as an admin to a league
 * @param leagueId - The league ID
 * @param userId - The user ID to add as admin
 * @param createdBy - Optional user ID of who is granting admin access
 * @param maxAdmins - Maximum number of admins allowed (default: 5)
 * @returns Success boolean and optional error message
 */
export async function addLeagueAdmin(
  leagueId: string,
  userId: string,
  createdBy?: string,
  maxAdmins: number = 5
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check current admin count
    const { count, error: countError } = await supabaseAdmin
      .from('league_admins')
      .select('*', { count: 'exact', head: true })
      .eq('league_id', leagueId)

    if (countError) {
      return { success: false, error: 'Error checking admin count' }
    }

    if (count !== null && count >= maxAdmins) {
      return { success: false, error: `Maximum of ${maxAdmins} admins reached` }
    }

    // Add admin
    const { error: insertError } = await supabaseAdmin
      .from('league_admins')
      .insert({
        league_id: leagueId,
        user_id: userId,
        created_by: createdBy
      })

    if (insertError) {
      if (insertError.code === '23505') { // Unique constraint violation
        return { success: false, error: 'User is already an admin of this league' }
      }
      console.error('Error adding league admin:', insertError)
      return { success: false, error: 'Error adding admin' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error adding league admin:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Removes a user as an admin from a league
 * @param leagueId - The league ID
 * @param userId - The user ID to remove as admin
 * @returns Success boolean and optional error message
 */
export async function removeLeagueAdmin(
  leagueId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if this is the last admin
    const { count, error: countError } = await supabaseAdmin
      .from('league_admins')
      .select('*', { count: 'exact', head: true })
      .eq('league_id', leagueId)

    if (countError) {
      return { success: false, error: 'Error checking admin count' }
    }

    if (count !== null && count <= 1) {
      return { success: false, error: 'Cannot remove the last admin' }
    }

    // Remove admin
    const { error: deleteError } = await supabaseAdmin
      .from('league_admins')
      .delete()
      .eq('league_id', leagueId)
      .eq('user_id', userId)

    if (deleteError) {
      console.error('Error removing league admin:', deleteError)
      return { success: false, error: 'Error removing admin' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error removing league admin:', error)
    return { success: false, error: 'Internal server error' }
  }
}
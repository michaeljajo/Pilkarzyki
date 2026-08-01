import { supabaseAdmin } from '@/lib/supabase'

export const ARCHIVED_LEAGUE_ERROR_MESSAGE =
  'Ten sezon został zarchiwizowany i jest tylko do odczytu. Zmiany nie są możliwe.'

/**
 * Checks whether a league is currently mutable (is_active = true).
 * Use in every mutation endpoint that writes to league-scoped data
 * (lineups, results, posts, cup matches, squad edits, etc.) so that
 * archived seasons remain a read-only historical record.
 *
 * Returns { ok: true } when the league is active. On failure returns
 * a Polish error message and an appropriate HTTP status suitable for
 * NextResponse.json({ error }, { status }).
 */
export async function assertLeagueMutable(leagueId: string): Promise<
  { ok: true } | { ok: false; status: number; error: string }
> {
  if (!leagueId) {
    return { ok: false, status: 400, error: 'Brak identyfikatora ligi.' }
  }

  const { data, error } = await supabaseAdmin
    .from('leagues')
    .select('is_active')
    .eq('id', leagueId)
    .maybeSingle()

  if (error) {
    console.error('assertLeagueMutable: DB error', error)
    return {
      ok: false,
      status: 500,
      error: 'Błąd serwera podczas weryfikacji statusu ligi.',
    }
  }

  if (!data) {
    return { ok: false, status: 404, error: 'Nie znaleziono ligi.' }
  }

  if (data.is_active === false) {
    return { ok: false, status: 403, error: ARCHIVED_LEAGUE_ERROR_MESSAGE }
  }

  return { ok: true }
}

/**
 * Variant of assertLeagueMutable when the caller has a cup id
 * (all cup-scoped mutations: results, groups, schedule, advance, etc.).
 */
export async function assertLeagueMutableByCup(cupId: string) {
  if (!cupId) {
    return { ok: false as const, status: 400, error: 'Brak identyfikatora pucharu.' }
  }
  const { data, error } = await supabaseAdmin
    .from('cups')
    .select('league_id')
    .eq('id', cupId)
    .maybeSingle()
  if (error) {
    console.error('assertLeagueMutableByCup: DB error', error)
    return { ok: false as const, status: 500, error: 'Błąd serwera podczas weryfikacji statusu ligi.' }
  }
  if (!data) {
    return { ok: false as const, status: 404, error: 'Nie znaleziono pucharu.' }
  }
  return assertLeagueMutable(data.league_id)
}

/**
 * Variant when the caller has a gameweek id
 * (league lineup submits, results, gameweek edits).
 */
export async function assertLeagueMutableByGameweek(gameweekId: string) {
  if (!gameweekId) {
    return { ok: false as const, status: 400, error: 'Brak identyfikatora kolejki.' }
  }
  const { data, error } = await supabaseAdmin
    .from('gameweeks')
    .select('league_id')
    .eq('id', gameweekId)
    .maybeSingle()
  if (error) {
    console.error('assertLeagueMutableByGameweek: DB error', error)
    return { ok: false as const, status: 500, error: 'Błąd serwera podczas weryfikacji statusu ligi.' }
  }
  if (!data) {
    return { ok: false as const, status: 404, error: 'Nie znaleziono kolejki.' }
  }
  return assertLeagueMutable(data.league_id)
}

/**
 * Variant when the caller has a cup_gameweek id (cup lineup submits,
 * ET lineups, penalty lineups).
 */
export async function assertLeagueMutableByCupGameweek(cupGameweekId: string) {
  if (!cupGameweekId) {
    return { ok: false as const, status: 400, error: 'Brak identyfikatora kolejki pucharu.' }
  }
  const { data, error } = await supabaseAdmin
    .from('cup_gameweeks')
    .select('cup_id')
    .eq('id', cupGameweekId)
    .maybeSingle()
  if (error) {
    console.error('assertLeagueMutableByCupGameweek: DB error', error)
    return { ok: false as const, status: 500, error: 'Błąd serwera podczas weryfikacji statusu ligi.' }
  }
  if (!data) {
    return { ok: false as const, status: 404, error: 'Nie znaleziono kolejki pucharu.' }
  }
  return assertLeagueMutableByCup(data.cup_id)
}

/**
 * Variant when the caller has a squad id (team name edits).
 */
export async function assertLeagueMutableBySquad(squadId: string) {
  if (!squadId) {
    return { ok: false as const, status: 400, error: 'Brak identyfikatora składu.' }
  }
  const { data, error } = await supabaseAdmin
    .from('squads')
    .select('league_id')
    .eq('id', squadId)
    .maybeSingle()
  if (error) {
    console.error('assertLeagueMutableBySquad: DB error', error)
    return { ok: false as const, status: 500, error: 'Błąd serwera podczas weryfikacji statusu ligi.' }
  }
  if (!data) {
    return { ok: false as const, status: 404, error: 'Nie znaleziono składu.' }
  }
  return assertLeagueMutable(data.league_id)
}

/**
 * Variant when the caller has a post id (Tablica posts).
 */
export async function assertLeagueMutableByPost(postId: string) {
  if (!postId) {
    return { ok: false as const, status: 400, error: 'Brak identyfikatora wpisu.' }
  }
  const { data, error } = await supabaseAdmin
    .from('posts')
    .select('league_id')
    .eq('id', postId)
    .maybeSingle()
  if (error) {
    console.error('assertLeagueMutableByPost: DB error', error)
    return { ok: false as const, status: 500, error: 'Błąd serwera podczas weryfikacji statusu ligi.' }
  }
  if (!data) {
    return { ok: false as const, status: 404, error: 'Nie znaleziono wpisu.' }
  }
  return assertLeagueMutable(data.league_id)
}

/**
 * Variant when the caller has a league name (players table uses
 * league name as its foreign key rather than an id).
 */
export async function assertLeagueMutableByName(leagueName: string) {
  if (!leagueName) {
    return { ok: false as const, status: 400, error: 'Brak nazwy ligi.' }
  }
  const { data, error } = await supabaseAdmin
    .from('leagues')
    .select('is_active')
    .eq('name', leagueName)
    .maybeSingle()
  if (error) {
    console.error('assertLeagueMutableByName: DB error', error)
    return { ok: false as const, status: 500, error: 'Błąd serwera podczas weryfikacji statusu ligi.' }
  }
  if (!data) {
    // No league with that name exists yet — treat as mutable so imports
    // targeting a not-yet-created league name still succeed.
    return { ok: true as const }
  }
  if (data.is_active === false) {
    return { ok: false as const, status: 403, error: ARCHIVED_LEAGUE_ERROR_MESSAGE }
  }
  return { ok: true as const }
}

/**
 * Variant when the caller has a result id.
 */
export async function assertLeagueMutableByResult(resultId: string) {
  if (!resultId) {
    return { ok: false as const, status: 400, error: 'Brak identyfikatora wyniku.' }
  }
  const { data, error } = await supabaseAdmin
    .from('results')
    .select('gameweek_id')
    .eq('id', resultId)
    .maybeSingle()
  if (error) {
    console.error('assertLeagueMutableByResult: DB error', error)
    return { ok: false as const, status: 500, error: 'Błąd serwera podczas weryfikacji statusu ligi.' }
  }
  if (!data) {
    return { ok: false as const, status: 404, error: 'Nie znaleziono wyniku.' }
  }
  return assertLeagueMutableByGameweek(data.gameweek_id)
}

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
 * Whether a signed-in user may VIEW a league: its admins, its managers, and —
 * when the league is flagged public — anyone at all.
 *
 * Read access only. Callers must keep using verifyLeagueAdmin / squad ownership
 * for anything that writes; a public league is a showcase, not an open door.
 */
export async function canViewLeague(
  clerkUserId: string,
  leagueId: string
): Promise<{ canView: boolean; userInternalId?: string; isPublic: boolean }> {
  try {
    const { data: userRecord } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', clerkUserId)
      .single()

    if (!userRecord) return { canView: false, isPublic: false }

    const [{ data: league }, { data: squad }, { data: adminRecord }] = await Promise.all([
      supabaseAdmin.from('leagues').select('is_public').eq('id', leagueId).maybeSingle(),
      supabaseAdmin
        .from('squads')
        .select('id')
        .eq('league_id', leagueId)
        .eq('manager_id', userRecord.id)
        .maybeSingle(),
      supabaseAdmin
        .from('league_admins')
        .select('id')
        .eq('league_id', leagueId)
        .eq('user_id', userRecord.id)
        .maybeSingle(),
    ])

    const isPublic = league?.is_public === true

    return {
      canView: isPublic || !!squad || !!adminRecord,
      userInternalId: userRecord.id,
      isPublic,
    }
  } catch (error) {
    console.error('Error checking league view access:', error)
    return { canView: false, isPublic: false }
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

    // Check if user is admin of any ACTIVE league via league_admins table.
    // The is_active filter must be applied in the query itself — filtering
    // after a .limit(1) can fetch a single archived-league row and wrongly
    // report no admin access when the user also admins an active league.
    const { data: adminRecords, error: adminError } = await supabaseAdmin
      .from('league_admins')
      .select('league_id, leagues!inner(is_active)')
      .eq('user_id', userRecord.id)
      .eq('leagues.is_active', true)
      .limit(1)

    if (adminError) {
      console.error('Error checking league admins:', adminError)
      return false
    }

    return (adminRecords?.length ?? 0) > 0
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
import { supabaseAdmin } from '@/lib/supabase'
import { clerkClient } from '@clerk/nextjs/server'
import { resolveUserNames } from '@/utils/name-resolver'
import { logger } from '@/lib/logger'

interface GetOrCreateUserOptions {
  selectFields?: string
  context?: string
}

/**
 * The shape we rely on here. `selectFields` is caller-supplied, so Supabase
 * cannot infer the row type and falls back to GenericStringError — hence the
 * explicit cast at each query. `id` is always present because every caller
 * selects either '*' or a list including it.
 */
interface UserRow {
  id: string
  [key: string]: unknown
}

/**
 * Gets a user by Clerk ID, creating them if they don't exist
 * @param clerkUserId - The Clerk user ID
 * @param options - Optional configuration
 * @returns User record with requested fields
 */
export async function getOrCreateUser(
  clerkUserId: string,
  options: GetOrCreateUserOptions = {}
): Promise<any> {
  const { selectFields = '*', context = 'User Manager' } = options

  try {
    // Try to get existing user
    const { data: existingUserRow, error: fetchError } = await supabaseAdmin
      .from('users')
      .select(selectFields)
      .eq('clerk_id', clerkUserId)
      .single()

    const existingUser = existingUserRow as UserRow | null

    if (existingUser) {
      logger.debug(`${context} - found existing user`)
      return existingUser
    }

    // If user doesn't exist (not an error, just not found), create them
    if (fetchError?.code === 'PGRST116') {
      logger.debug(`${context} - creating new user`)

      // Pull the real Clerk profile so the mirror holds the user's actual
      // identity instead of a placeholder ("User Account" / user-<id>@temp.com).
      let email = ''
      let firstName = ''
      let lastName = ''
      try {
        const client = await clerkClient()
        const clerkUser = await client.users.getUser(clerkUserId)
        email = clerkUser.emailAddresses[0]?.emailAddress || ''
        const resolved = resolveUserNames({
          email,
          first_name: clerkUser.firstName,
          last_name: clerkUser.lastName,
          username: clerkUser.username,
        })
        firstName = resolved.firstName
        lastName = resolved.lastName
      } catch (clerkError) {
        // If Clerk is unreachable we still create the row, but with a resolved
        // fallback name rather than a fake email address.
        logger.warn(`${context} - Could not fetch Clerk profile:`, clerkError)
        const resolved = resolveUserNames({ email: '' })
        firstName = resolved.firstName
        lastName = resolved.lastName
      }

      const { data: newUserRow, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          clerk_id: clerkUserId,
          email,
          first_name: firstName,
          last_name: lastName,
        })
        .select(selectFields)
        .single()

      if (createError) {
        logger.error(`${context} - Error creating user:`, createError)
        throw new Error(`Failed to create user: ${createError.message}`)
      }

      const newUser = newUserRow as unknown as UserRow
      logger.debug(`${context} - created new user`)
      return newUser
    }

    // If it's a different error, throw it
    if (fetchError) {
      logger.error(`${context} - Error fetching user:`, fetchError)
      throw new Error(`Failed to fetch user: ${fetchError.message}`)
    }

    throw new Error('Unexpected error in getOrCreateUser')
  } catch (error) {
    console.error(`${context} - Unexpected error:`, error)
    throw error
  }
}

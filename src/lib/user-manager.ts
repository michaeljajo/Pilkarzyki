import { supabaseAdmin } from '@/lib/supabase'

interface GetOrCreateUserOptions {
  selectFields?: string
  context?: string
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
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select(selectFields)
      .eq('clerk_id', clerkUserId)
      .single()

    if (existingUser) {
      console.log(`${context} - Found existing user:`, existingUser.id)
      return existingUser
    }

    // If user doesn't exist (not an error, just not found), create them
    if (fetchError?.code === 'PGRST116') {
      console.log(`${context} - Creating new user for Clerk ID:`, clerkUserId)

      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          clerk_id: clerkUserId,
          email: `user-${clerkUserId}@temp.com`,
          first_name: 'User',
          last_name: 'Account',
        })
        .select(selectFields)
        .single()

      if (createError) {
        console.error(`${context} - Error creating user:`, createError)
        throw new Error(`Failed to create user: ${createError.message}`)
      }

      console.log(`${context} - Created new user:`, newUser.id)
      return newUser
    }

    // If it's a different error, throw it
    if (fetchError) {
      console.error(`${context} - Error fetching user:`, fetchError)
      throw new Error(`Failed to fetch user: ${fetchError.message}`)
    }

    throw new Error('Unexpected error in getOrCreateUser')
  } catch (error) {
    console.error(`${context} - Unexpected error:`, error)
    throw error
  }
}

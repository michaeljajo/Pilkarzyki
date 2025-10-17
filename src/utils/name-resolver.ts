/**
 * Enhanced name resolution utility for consistent user name processing
 * Handles username, first/last name, and email fallbacks consistently
 */

interface ClerkUserData {
  email: string
  first_name?: string | null
  last_name?: string | null
  username?: string | null
}

interface ResolvedNames {
  firstName: string
  lastName: string
}

export function resolveUserNames(userData: ClerkUserData): ResolvedNames {
  const email = userData.email || ''
  const emailPrefix = email.split('@')[0] || 'User'

  let firstName = ''
  let lastName = ''

  if (userData.username) {
    // PRIORITY 1: Use username as primary source
    console.log('✅ Using username:', userData.username)
    if (userData.username.includes(' ')) {
      // Split on space: "John Doe" → "John" "Doe"
      const nameParts = userData.username.split(' ')
      firstName = nameParts[0] || ''
      lastName = nameParts.slice(1).join(' ') || ''
    } else if (userData.username.includes('.')) {
      // Split on dot: "john.doe" → "john" "doe"
      const nameParts = userData.username.split('.')
      firstName = nameParts[0] || ''
      lastName = nameParts.slice(1).join(' ') || ''
    } else {
      // Single username: "johndoe" → "johndoe" ""
      firstName = userData.username
      lastName = ''
    }
  } else if (userData.first_name || userData.last_name) {
    // PRIORITY 2: Use provided first/last names
    console.log('✅ Using first/last names')
    firstName = userData.first_name || ''
    lastName = userData.last_name || ''
  } else {
    // PRIORITY 3: Last resort - use email prefix
    console.log('⚠️ Falling back to email prefix')
    firstName = emailPrefix
    lastName = ''
  }

  // Ensure we never have completely empty names
  if (!firstName && !lastName) {
    firstName = emailPrefix
  }

  console.log('💾 Resolved names:', { firstName, lastName })

  return {
    firstName,
    lastName
  }
}
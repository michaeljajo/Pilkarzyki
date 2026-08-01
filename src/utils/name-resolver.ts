import { logger } from '@/lib/logger'
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
  const isGmail = email.toLowerCase().endsWith('@gmail.com')

  let firstName = ''
  let lastName = ''

  if (userData.username) {
    // PRIORITY 1: Use username as primary source
    logger.debug('name-resolver: using username')
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
    logger.debug('name-resolver: using clerk profile names')
    firstName = userData.first_name || ''
    lastName = userData.last_name || ''
  } else {
    // PRIORITY 3: Last resort - use email prefix
    logger.debug('name-resolver: falling back to email prefix')
    firstName = emailPrefix
    lastName = ''
  }

  // Ensure we never have completely empty names
  if (!firstName && !lastName) {
    firstName = emailPrefix
  }

  // Log which strategy won, not the names themselves — the source is what you
  // need when a name resolves oddly, and it carries no personal data.
  logger.debug('name-resolver: resolved via', {
    source: userData.username ? 'username' : (userData.first_name || userData.last_name) ? 'clerk_profile' : 'email_prefix',
    isGmail
  })

  return {
    firstName,
    lastName
  }
}
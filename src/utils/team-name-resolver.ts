/**
 * Team name resolution utility for consistent manager/team display across the app
 * Priority: team_name > first_name + last_name > email
 */

interface Manager {
  first_name?: string | null
  last_name?: string | null
  email?: string
}

interface Squad {
  team_name?: string | null
}

interface TeamNameOptions {
  manager: Manager
  squad?: Squad | null
  fallbackName?: string
}

/**
 * Get the display name for a manager, prioritizing team name if available
 * @param options - Manager and optional squad information
 * @returns Display name string
 */
export function getTeamOrManagerName(options: TeamNameOptions): string {
  const { manager, squad, fallbackName = 'Unknown Manager' } = options

  // Priority 1: Team name from squad
  if (squad?.team_name) {
    return squad.team_name
  }

  // Priority 2: Manager's first and last name
  if (manager.first_name || manager.last_name) {
    const fullName = `${manager.first_name || ''} ${manager.last_name || ''}`.trim()
    if (fullName) {
      return fullName
    }
  }

  // Priority 3: Email address
  if (manager.email) {
    return manager.email
  }

  // Fallback
  return fallbackName
}

/**
 * Validate team name meets requirements
 * - 3-30 characters
 * - Only alphanumeric characters and spaces
 * @param teamName - Team name to validate
 * @returns Validation result with error message if invalid
 */
export function validateTeamName(teamName: string): { valid: boolean; error?: string } {
  if (!teamName || teamName.trim().length === 0) {
    return { valid: false, error: 'Nazwa drużyny jest wymagana' }
  }

  const trimmed = teamName.trim()

  if (trimmed.length < 3) {
    return { valid: false, error: 'Nazwa drużyny musi mieć co najmniej 3 znaki' }
  }

  if (trimmed.length > 30) {
    return { valid: false, error: 'Nazwa drużyny może mieć maksymalnie 30 znaków' }
  }

  // Allow alphanumeric characters, spaces, and common Polish characters
  const validPattern = /^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ0-9\s]+$/
  if (!validPattern.test(trimmed)) {
    return { valid: false, error: 'Nazwa drużyny może zawierać tylko litery, cyfry i spacje' }
  }

  return { valid: true }
}

/**
 * Format team name for storage and display.
 *
 * Casing is left exactly as the manager typed it — "Juve ToMino" stays
 * "Juve ToMino" — because inner capitals in team names are deliberate. Only
 * surrounding and repeated whitespace is collapsed, so two names that differ
 * only in spacing cannot both be stored.
 *
 * @param teamName - Team name to format
 * @returns Formatted team name
 */
export function formatTeamName(teamName: string): string {
  return teamName.replace(/\s+/g, ' ').trim()
}

/**
 * Compare two team names case-insensitively, the way the league sees them:
 * "Juve ToMino" and "juve tomino" are the same team, not two.
 */
export function teamNamesMatch(a: string, b: string): boolean {
  return formatTeamName(a).toLocaleLowerCase('pl-PL') === formatTeamName(b).toLocaleLowerCase('pl-PL')
}

/**
 * Application-wide constants and configuration
 */

export const LEAGUE_LIMITS = {
  MAX_PER_USER: 5,
  MAX_MANAGERS: 16,
  MIN_MANAGERS: 2,
} as const

export const SEASON_FORMAT = {
  generate: () => {
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth()

    // If it's before July, use previous year as start
    const startYear = currentMonth < 7 ? currentYear - 1 : currentYear
    const endYear = startYear + 1

    return `${startYear}/${endYear}`
  },
  validate: (season: string) => {
    const pattern = /^\d{4}\/\d{4}$/
    return pattern.test(season)
  },
} as const

export const VALIDATION_MESSAGES = {
  LEAGUE_LIMIT_REACHED: 'You have reached the maximum limit of 5 leagues per user',
  INVALID_SEASON_FORMAT: 'Season must be in YYYY/YYYY format',
  INVALID_MANAGER_COUNT: 'League must have between 2 and 16 managers',
  UNAUTHORIZED: 'You are not authorized to perform this action',
} as const

export const LINEUP_LIMITS = {
  MAX_PLAYERS: 3,
  MIN_PLAYERS: 1,
} as const

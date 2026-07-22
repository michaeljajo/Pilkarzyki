/**
 * Application-wide constants and configuration
 */

export const LEAGUE_LIMITS = {
  MAX_PER_USER: 5,
  // Upper bound for the admin-defined league size. The actual size is stored
  // per-league on leagues.max_managers (default DEFAULT_MANAGERS) and enforced
  // when adding managers.
  MAX_MANAGERS: 32,
  MIN_MANAGERS: 2,
  DEFAULT_MANAGERS: 18,
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
  INVALID_MANAGER_COUNT: 'Liczba menedżerów musi wynosić od 2 do 32',
  MANAGER_LIMIT_REACHED: 'Osiągnięto maksymalną liczbę menedżerów w tej lidze',
  UNAUTHORIZED: 'You are not authorized to perform this action',
} as const

export const LINEUP_LIMITS = {
  MAX_PLAYERS: 3,
  MIN_PLAYERS: 1,
} as const

import { GameweekSchedule, SeasonConfig } from '@/types'

export interface SeasonParameters {
  startDate: Date
  endDate: Date
  maxManagers: number
  gameweekIntervalDays?: number
  lockHoursBefore?: number
}

export interface GameweekCalculationResult {
  totalGameweeks: number
  seasonConfig: SeasonConfig
  isValid: boolean
  errors: string[]
}

export function calculateTotalGameweeks(maxManagers: number): number {
  if (maxManagers < 2) {
    throw new Error('Need at least 2 managers for a league')
  }
  return 2 * (maxManagers - 1)
}

export function calculateSeasonDuration(maxManagers: number, intervalDays: number = 7): number {
  const totalGameweeks = calculateTotalGameweeks(maxManagers)
  return totalGameweeks * intervalDays
}

export function generateGameweekSchedules(params: SeasonParameters): GameweekCalculationResult {
  const {
    startDate,
    endDate,
    maxManagers,
    gameweekIntervalDays = 7,
    lockHoursBefore = 24
  } = params

  const errors: string[] = []
  const totalGameweeks = calculateTotalGameweeks(maxManagers)

  // Validate date range
  const seasonDurationDays = calculateSeasonDuration(maxManagers, gameweekIntervalDays)
  const requiredEndDate = new Date(startDate.getTime() + (seasonDurationDays * 24 * 60 * 60 * 1000))

  if (endDate < requiredEndDate) {
    errors.push(
      `Season end date is too early. Need ${seasonDurationDays} days for ${totalGameweeks} gameweeks. ` +
      `Minimum end date: ${requiredEndDate.toDateString()}`
    )
  }

  if (startDate >= endDate) {
    errors.push('Start date must be before end date')
  }

  if (startDate < new Date()) {
    errors.push('Start date cannot be in the past')
  }

  // Generate gameweek schedules
  const gameweeks: GameweekSchedule[] = []

  for (let week = 1; week <= totalGameweeks; week++) {
    const gameweekStartDate = new Date(
      startDate.getTime() + ((week - 1) * gameweekIntervalDays * 24 * 60 * 60 * 1000)
    )

    const gameweekEndDate = new Date(
      gameweekStartDate.getTime() + ((gameweekIntervalDays - 1) * 24 * 60 * 60 * 1000) + (23 * 60 * 60 * 1000) + (59 * 60 * 1000)
    )

    const lockDate = new Date(
      gameweekStartDate.getTime() - (lockHoursBefore * 60 * 60 * 1000)
    )

    // Validate that this gameweek fits within the season
    if (gameweekEndDate > endDate) {
      errors.push(`Gameweek ${week} extends beyond season end date`)
      break
    }

    gameweeks.push({
      week,
      startDate: gameweekStartDate,
      endDate: gameweekEndDate,
      lockDate
    })
  }

  return {
    totalGameweeks,
    seasonConfig: {
      totalGameweeks,
      gameweeks
    },
    isValid: errors.length === 0,
    errors
  }
}

export function validateSeasonFit(
  startDate: Date,
  endDate: Date,
  maxManagers: number,
  intervalDays: number = 7
): { fits: boolean; requiredDays: number; availableDays: number } {
  const requiredDays = calculateSeasonDuration(maxManagers, intervalDays)
  const availableDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

  return {
    fits: availableDays >= requiredDays,
    requiredDays,
    availableDays
  }
}

export function getRecommendedEndDate(startDate: Date, maxManagers: number, intervalDays: number = 7): Date {
  const requiredDays = calculateSeasonDuration(maxManagers, intervalDays)
  return new Date(startDate.getTime() + (requiredDays * 24 * 60 * 60 * 1000))
}

export function formatGameweekPreview(gameweeks: GameweekSchedule[]): string {
  if (gameweeks.length === 0) return 'No gameweeks generated'

  const firstRoundEnd = Math.ceil(gameweeks.length / 2)
  const firstRound = gameweeks.slice(0, firstRoundEnd)
  const secondRound = gameweeks.slice(firstRoundEnd)

  return [
    `First Round-Robin: Weeks 1-${firstRoundEnd} (${firstRound[0]?.startDate.toDateString()} - ${firstRound[firstRound.length - 1]?.endDate.toDateString()})`,
    `Second Round-Robin: Weeks ${firstRoundEnd + 1}-${gameweeks.length} (${secondRound[0]?.startDate.toDateString()} - ${secondRound[secondRound.length - 1]?.endDate.toDateString()})`
  ].join('\n')
}
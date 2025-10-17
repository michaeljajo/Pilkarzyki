import {
  addWeeks,
  setHours,
  setMinutes,
  format,
  parseISO,
  isAfter,
  isBefore,
  startOfWeek,
  addDays
} from 'date-fns'
import { GameweekSchedule } from '@/types'

export function createGameweekSchedule(
  startDate: Date,
  totalWeeks: number = 30
): GameweekSchedule[] {
  const schedule: GameweekSchedule[] = []

  for (let week = 1; week <= totalWeeks; week++) {
    const weekStartDate = addWeeks(startDate, week - 1)

    // Find Friday of this week (gameweek starts Friday 6pm CEST)
    const friday = addDays(startOfWeek(weekStartDate, { weekStartsOn: 1 }), 4) // Monday = 1, Friday = 5
    const gameweekStart = setHours(setMinutes(friday, 0), 18) // 6pm

    // Find Monday of next week (gameweek ends Monday 11:59pm CEST)
    const monday = addDays(friday, 4)
    const gameweekEnd = setHours(setMinutes(monday, 59), 23) // 11:59pm

    // Lock date is Friday 8pm CEST (2 hours after start)
    const lockDate = setHours(setMinutes(friday, 0), 20) // 8pm

    schedule.push({
      week,
      startDate: gameweekStart,
      endDate: gameweekEnd,
      lockDate
    })
  }

  return schedule
}

export function isGameweekLocked(lockDate: Date): boolean {
  const now = new Date()
  return isAfter(now, lockDate)
}

export function isGameweekActive(startDate: Date, endDate: Date): boolean {
  const now = new Date()
  return isAfter(now, startDate) && isBefore(now, endDate)
}

export function formatGameweekDate(date: Date): string {
  return format(date, 'EEE dd MMM yyyy HH:mm')
}

export function parseGameweekDate(dateString: string): Date {
  return parseISO(dateString)
}

export function getTimeUntilLock(lockDate: Date): string {
  const now = new Date()
  const diff = lockDate.getTime() - now.getTime()

  if (diff <= 0) return 'Locked'

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}
/**
 * Gameweek scheduling.
 *
 * Every gameweek runs on the same weekly rhythm, expressed in Polish local
 * time — the wall-clock times below are what admins and managers actually
 * read on screen:
 *
 *   start  Friday   18:00  — lineups open
 *   lock   Saturday 00:01  — lineups freeze
 *   end    Monday   23:59  — results are final
 *
 * `gameweeks.start_date` / `lock_date` / `end_date` are TIMESTAMPTZ, so each
 * boundary is stored as an absolute instant. A season is ~34 weeks and so
 * crosses both DST transitions; the UTC offset is therefore resolved for each
 * week individually. Adding a flat 7 × 24h instead would leave the whole
 * season after late March starting at 17:00 or 19:00 Warsaw time.
 *
 * The Vercel crons in `vercel.json` are coupled to these boundaries and run on
 * UTC, which drifts an hour against Warsaw across the year:
 *
 *   apply-default-lineups  01:00 UTC — must fire *after* `lock_date`
 *   complete-gameweeks     01:30 UTC — must fire *after* `end_date`
 *
 * Firing early is the harmful direction: it would freeze defaults into a
 * gameweek still open, or complete one still being played. The current times
 * clear their boundaries by ~2h at the worst point of the year. If the
 * wall-clock times above ever move later, push the crons later to match.
 */

export const LEAGUE_TIME_ZONE = 'Europe/Warsaw'

/** A date with no time component, in the league's local calendar. */
export interface CalendarDate {
  year: number
  /** 1-12. */
  month: number
  /** 1-31. */
  day: number
}

export interface GameweekWindow {
  week: number
  startDate: Date
  lockDate: Date
  endDate: Date
}

/**
 * Each boundary as an offset from the gameweek's Friday, plus the local
 * wall-clock time it lands on.
 */
const BOUNDARIES = {
  start: { dayOffset: 0, hour: 18, minute: 0 },
  lock: { dayOffset: 1, hour: 0, minute: 1 },
  end: { dayOffset: 3, hour: 23, minute: 59 },
} as const

const FRIDAY = 5 // Date.getUTCDay(): 0 = Sunday

/**
 * The zone's UTC offset (ms) at a given instant, derived by asking Intl what
 * the local wall clock reads there and diffing against the instant itself.
 */
function zoneOffsetMs(instant: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(instant))

  const field = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((part) => part.type === type)?.value)

  // Some runtimes report midnight as hour 24.
  const hour = field('hour') % 24

  const wallClockAsUtc = Date.UTC(
    field('year'),
    field('month') - 1,
    field('day'),
    hour,
    field('minute'),
    field('second')
  )

  // Intl resolves to whole seconds, so compare against a whole-second instant.
  return wallClockAsUtc - Math.floor(instant / 1000) * 1000
}

/**
 * Resolve a local wall-clock time in `timeZone` to the absolute instant it
 * refers to.
 */
export function zonedWallClockToUtc(
  date: CalendarDate,
  hour: number,
  minute: number,
  timeZone: string = LEAGUE_TIME_ZONE
): Date {
  const wallClockAsUtc = Date.UTC(date.year, date.month - 1, date.day, hour, minute, 0, 0)

  // First pass: assume the offset in force at the naive instant.
  const firstOffset = zoneOffsetMs(wallClockAsUtc, timeZone)
  let instant = wallClockAsUtc - firstOffset

  // Within a day of a DST transition the offset at the corrected instant can
  // differ from the one we guessed with, so re-resolve once.
  const secondOffset = zoneOffsetMs(instant, timeZone)
  if (secondOffset !== firstOffset) {
    instant = wallClockAsUtc - secondOffset
  }

  return new Date(instant)
}

/** Calendar-only day arithmetic — never touches instants, so DST cannot skew it. */
export function addDays(date: CalendarDate, days: number): CalendarDate {
  const shifted = new Date(Date.UTC(date.year, date.month - 1, date.day + days))
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  }
}

/**
 * Parse a `YYYY-MM-DD` string (what `<input type="date">` submits) into a
 * CalendarDate, rejecting anything that isn't a real date.
 */
export function parseCalendarDate(value: string): CalendarDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  // Date.UTC silently rolls over impossible dates (2026-02-30 → 2026-03-02),
  // so round-trip and compare.
  const probe = new Date(Date.UTC(year, month - 1, day))
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() + 1 !== month ||
    probe.getUTCDate() !== day
  ) {
    return null
  }

  return { year, month, day }
}

/** The Friday on or after `date`. A date that is already a Friday is unchanged. */
export function snapToFriday(date: CalendarDate): CalendarDate {
  const weekday = new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay()
  return addDays(date, (FRIDAY - weekday + 7) % 7)
}

/** Today's date as read in `timeZone`. */
export function todayInZone(timeZone: string = LEAGUE_TIME_ZONE): CalendarDate {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const field = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((part) => part.type === type)?.value)

  return { year: field('year'), month: field('month'), day: field('day') }
}

/** The next Friday that could sensibly open a season. */
export function defaultKickoffFriday(timeZone: string = LEAGUE_TIME_ZONE): CalendarDate {
  return snapToFriday(todayInZone(timeZone))
}

/** Serialise a CalendarDate back to `YYYY-MM-DD`. */
export function formatCalendarDate({ year, month, day }: CalendarDate): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/**
 * Build `count` consecutive weekly gameweek windows, the first starting on
 * `firstFriday`.
 */
export function buildGameweekWindows(
  firstFriday: CalendarDate,
  count: number,
  timeZone: string = LEAGUE_TIME_ZONE
): GameweekWindow[] {
  return Array.from({ length: count }, (_, index) => {
    const friday = addDays(firstFriday, index * 7)

    const at = (boundary: { dayOffset: number; hour: number; minute: number }) =>
      zonedWallClockToUtc(
        addDays(friday, boundary.dayOffset),
        boundary.hour,
        boundary.minute,
        timeZone
      )

    return {
      week: index + 1,
      startDate: at(BOUNDARIES.start),
      lockDate: at(BOUNDARIES.lock),
      endDate: at(BOUNDARIES.end),
    }
  })
}

/** Render an instant in the league's timezone, for admin-facing previews. */
export function formatInLeagueZone(
  date: Date,
  timeZone: string = LEAGUE_TIME_ZONE
): string {
  return new Intl.DateTimeFormat('pl-PL', {
    timeZone,
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

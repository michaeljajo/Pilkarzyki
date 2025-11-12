import { CupStage } from '@/types'

// Sheet data interfaces
export interface LeagueGameweekRow {
  Week: number
  StartDate: string
  EndDate: string
  LockDate: string
  LockTime?: number
  CompletionDate?: string
  CompletionTime?: number
  IsCompleted: string | boolean
}

export interface LeagueFixtureRow {
  Gameweek: number
  HomeTeam: string
  AwayTeam: string
  HomePlayer1?: string
  HomePlayer1Goals?: number
  HomePlayer2?: string
  HomePlayer2Goals?: number
  HomePlayer3?: string
  HomePlayer3Goals?: number
  AwayPlayer1?: string
  AwayPlayer1Goals?: number
  AwayPlayer2?: string
  AwayPlayer2Goals?: number
  AwayPlayer3?: string
  AwayPlayer3Goals?: number
  IsCompleted: string | boolean
}

export interface CupGroupRow {
  GroupName: string
  'Team Name': string
}

export interface ManagersMappingRow {
  'Team Name': string
  Manager: string
}

export interface CupGameweekRow {
  CupWeek: number
  LeagueGameweek: number
  Stage: CupStage
  Leg: number
}

export interface CupFixtureRow {
  CupGameweek: number
  Stage: CupStage
  Leg: number
  GroupName?: string
  HomeTeam?: string
  AwayTeam?: string
  HomePlayer1?: string
  HomePlayer1Goals?: number
  HomePlayer2?: string
  HomePlayer2Goals?: number
  HomePlayer3?: string
  HomePlayer3Goals?: number
  AwayPlayer1?: string
  AwayPlayer1Goals?: number
  AwayPlayer2?: string
  AwayPlayer2Goals?: number
  AwayPlayer3?: string
  AwayPlayer3Goals?: number
  IsCompleted: string | boolean
}

// Parsed and validated data structures
export interface ParsedLeagueGameweek {
  week: number
  startDate: Date
  endDate: Date
  lockDate: Date
  isCompleted: boolean
}

export interface ParsedLineup {
  player1?: string
  player2?: string
  player3?: string
}

export interface ParsedGoals {
  player1?: number
  player2?: number
  player3?: number
}

export interface ParsedLeagueMatch {
  gameweek: number
  homeManager: string
  awayManager: string
  homeLineup: ParsedLineup
  awayLineup: ParsedLineup
  homeGoals: ParsedGoals
  awayGoals: ParsedGoals
  isCompleted: boolean
}

export interface ParsedCupGroup {
  groupName: string
  managers: string[]
}

export interface ParsedCupGameweek {
  cupWeek: number
  leagueGameweek: number
  stage: CupStage
  leg: number
}

export interface ParsedCupMatch {
  cupGameweek: number
  stage: CupStage
  leg: number
  groupName?: string
  homeManager?: string
  awayManager?: string
  homeLineup: ParsedLineup
  awayLineup: ParsedLineup
  homeGoals: ParsedGoals
  awayGoals: ParsedGoals
  isCompleted: boolean
}

export interface MigrationData {
  managersMapping: Map<string, string> // team name -> manager email
  leagueGameweeks: ParsedLeagueGameweek[]
  leagueMatches: ParsedLeagueMatch[]
  cupGroups: ParsedCupGroup[]
  cupGameweeks: ParsedCupGameweek[]
  cupMatches: ParsedCupMatch[]
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// Utility functions
export function parseBoolean(value: string | boolean): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim()
    return lower === 'true' || lower === 'yes' || lower === '1'
  }
  return false
}

export function parseDate(value: string | Date | number): Date {
  if (value instanceof Date) return value
  // Handle Excel date serial numbers
  if (typeof value === 'number') {
    // Excel dates are days since 1900-01-01
    const excelEpoch = new Date(1900, 0, 1)
    const date = new Date(excelEpoch.getTime() + (value - 2) * 24 * 60 * 60 * 1000)
    return date
  }
  return new Date(value)
}

export function combineDateTime(date: Date, timeValue?: number): Date {
  if (!timeValue) return date

  // Excel time is a fraction of a day (0.5 = 12:00 PM)
  const millisInDay = 24 * 60 * 60 * 1000
  const timeMillis = timeValue * millisInDay

  const combined = new Date(date.getTime() + timeMillis)
  return combined
}

export function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime())
}

export function parseManagersMapping(rows: ManagersMappingRow[]): {
  data: Map<string, string>
  errors: string[]
} {
  const data = new Map<string, string>()
  const errors: string[] = []

  rows.forEach((row, index) => {
    const rowNum = index + 2 // Excel row (1-indexed + header)

    try {
      const teamName = row['Team Name']
      const manager = row.Manager

      if (!teamName || !manager) {
        errors.push(`Row ${rowNum}: Missing required fields (Team Name, Manager)`)
        return
      }

      const cleanTeamName = String(teamName).trim()
      const cleanManager = String(manager).trim().toLowerCase()

      if (data.has(cleanTeamName)) {
        errors.push(`Row ${rowNum}: Duplicate team name "${cleanTeamName}"`)
        return
      }

      data.set(cleanTeamName, cleanManager)
    } catch (error) {
      errors.push(`Row ${rowNum}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })

  return { data, errors }
}

export function parseLeagueGameweeks(rows: LeagueGameweekRow[]): {
  data: ParsedLeagueGameweek[]
  errors: string[]
} {
  const data: ParsedLeagueGameweek[] = []
  const errors: string[] = []

  rows.forEach((row, index) => {
    const rowNum = index + 2 // Excel row (1-indexed + header)

    try {
      if (!row.Week || !row.StartDate || !row.EndDate) {
        errors.push(`Row ${rowNum}: Missing required fields (Week, StartDate, EndDate)`)
        return
      }

      const startDate = parseDate(row.StartDate)
      const endDate = parseDate(row.EndDate)
      const lockDateBase = row.LockDate ? parseDate(row.LockDate) : endDate

      // Combine lock date with lock time if available
      const lockDate = combineDateTime(lockDateBase, row.LockTime)

      if (!isValidDate(startDate)) {
        errors.push(`Row ${rowNum}: Invalid StartDate`)
        return
      }
      if (!isValidDate(endDate)) {
        errors.push(`Row ${rowNum}: Invalid EndDate`)
        return
      }
      if (!isValidDate(lockDate)) {
        errors.push(`Row ${rowNum}: Invalid LockDate`)
        return
      }

      data.push({
        week: Number(row.Week),
        startDate,
        endDate,
        lockDate,
        isCompleted: parseBoolean(row.IsCompleted)
      })
    } catch (error) {
      errors.push(`Row ${rowNum}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })

  return { data, errors }
}

export function parseLeagueFixtures(
  rows: LeagueFixtureRow[],
  managersMapping: Map<string, string>
): {
  data: ParsedLeagueMatch[]
  errors: string[]
} {
  const data: ParsedLeagueMatch[] = []
  const errors: string[] = []

  rows.forEach((row, index) => {
    const rowNum = index + 2

    try {
      if (!row.Gameweek || !row.HomeTeam || !row.AwayTeam) {
        errors.push(`Row ${rowNum}: Missing required fields (Gameweek, HomeTeam, AwayTeam)`)
        return
      }

      const homeTeam = String(row.HomeTeam).trim()
      const awayTeam = String(row.AwayTeam).trim()

      // Resolve team names to manager emails
      const homeManager = managersMapping.get(homeTeam)
      const awayManager = managersMapping.get(awayTeam)

      if (!homeManager) {
        // Debug: log available teams
        const availableTeams = Array.from(managersMapping.keys()).join('", "')
        errors.push(`Row ${rowNum}: Home team "${homeTeam}" not found in Managers_Mapping. Available teams: "${availableTeams}"`)
        return
      }
      if (!awayManager) {
        const availableTeams = Array.from(managersMapping.keys()).join('", "')
        errors.push(`Row ${rowNum}: Away team "${awayTeam}" not found in Managers_Mapping. Available teams: "${availableTeams}"`)
        return
      }

      data.push({
        gameweek: Number(row.Gameweek),
        homeManager,
        awayManager,
        homeLineup: {
          player1: row.HomePlayer1 ? String(row.HomePlayer1).trim() : undefined,
          player2: row.HomePlayer2 ? String(row.HomePlayer2).trim() : undefined,
          player3: row.HomePlayer3 ? String(row.HomePlayer3).trim() : undefined
        },
        awayLineup: {
          player1: row.AwayPlayer1 ? String(row.AwayPlayer1).trim() : undefined,
          player2: row.AwayPlayer2 ? String(row.AwayPlayer2).trim() : undefined,
          player3: row.AwayPlayer3 ? String(row.AwayPlayer3).trim() : undefined
        },
        homeGoals: {
          player1: row.HomePlayer1Goals !== undefined && row.HomePlayer1Goals !== null && row.HomePlayer1Goals !== ''
            ? Number(row.HomePlayer1Goals) : undefined,
          player2: row.HomePlayer2Goals !== undefined && row.HomePlayer2Goals !== null && row.HomePlayer2Goals !== ''
            ? Number(row.HomePlayer2Goals) : undefined,
          player3: row.HomePlayer3Goals !== undefined && row.HomePlayer3Goals !== null && row.HomePlayer3Goals !== ''
            ? Number(row.HomePlayer3Goals) : undefined
        },
        awayGoals: {
          player1: row.AwayPlayer1Goals !== undefined && row.AwayPlayer1Goals !== null && row.AwayPlayer1Goals !== ''
            ? Number(row.AwayPlayer1Goals) : undefined,
          player2: row.AwayPlayer2Goals !== undefined && row.AwayPlayer2Goals !== null && row.AwayPlayer2Goals !== ''
            ? Number(row.AwayPlayer2Goals) : undefined,
          player3: row.AwayPlayer3Goals !== undefined && row.AwayPlayer3Goals !== null && row.AwayPlayer3Goals !== ''
            ? Number(row.AwayPlayer3Goals) : undefined
        },
        isCompleted: parseBoolean(row.IsCompleted)
      })
    } catch (error) {
      errors.push(`Row ${rowNum}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })

  return { data, errors }
}

export function parseCupGroups(
  rows: CupGroupRow[],
  managersMapping: Map<string, string>
): {
  data: ParsedCupGroup[]
  errors: string[]
} {
  const data: Map<string, string[]> = new Map()
  const errors: string[] = []

  rows.forEach((row, index) => {
    const rowNum = index + 2

    try {
      const groupName = row.GroupName
      const teamName = row['Team Name']

      if (!groupName || !teamName) {
        errors.push(`Row ${rowNum}: Missing required fields (GroupName, Team Name)`)
        return
      }

      const cleanGroupName = String(groupName).trim().toUpperCase()
      const cleanTeamName = String(teamName).trim()

      // Resolve team name to manager email
      const manager = managersMapping.get(cleanTeamName)

      if (!manager) {
        const availableTeams = Array.from(managersMapping.keys()).join('", "')
        errors.push(`Row ${rowNum}: Team "${cleanTeamName}" not found in Managers_Mapping. Available teams: "${availableTeams}"`)
        return
      }

      if (!data.has(cleanGroupName)) {
        data.set(cleanGroupName, [])
      }
      data.get(cleanGroupName)!.push(manager)
    } catch (error) {
      errors.push(`Row ${rowNum}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })

  return {
    data: Array.from(data.entries()).map(([groupName, managers]) => ({
      groupName,
      managers
    })),
    errors
  }
}

export function parseCupGameweeks(rows: CupGameweekRow[]): {
  data: ParsedCupGameweek[]
  errors: string[]
} {
  const data: ParsedCupGameweek[] = []
  const errors: string[] = []

  const validStages: CupStage[] = ['group_stage', 'round_of_16', 'quarter_final', 'semi_final', 'final']

  rows.forEach((row, index) => {
    const rowNum = index + 2

    try {
      if (!row.CupWeek || !row.LeagueGameweek || !row.Stage || !row.Leg) {
        errors.push(`Row ${rowNum}: Missing required fields (CupWeek, LeagueGameweek, Stage, Leg)`)
        return
      }

      const stage = row.Stage as CupStage
      if (!validStages.includes(stage)) {
        errors.push(`Row ${rowNum}: Invalid stage "${row.Stage}". Must be one of: ${validStages.join(', ')}`)
        return
      }

      const leg = Number(row.Leg)
      if (leg !== 1 && leg !== 2) {
        errors.push(`Row ${rowNum}: Leg must be 1 or 2`)
        return
      }

      data.push({
        cupWeek: Number(row.CupWeek),
        leagueGameweek: Number(row.LeagueGameweek),
        stage,
        leg
      })
    } catch (error) {
      errors.push(`Row ${rowNum}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })

  return { data, errors }
}

export function parseCupFixtures(
  rows: CupFixtureRow[],
  managersMapping: Map<string, string>
): {
  data: ParsedCupMatch[]
  errors: string[]
} {
  const data: ParsedCupMatch[] = []
  const errors: string[] = []

  const validStages: CupStage[] = ['group_stage', 'round_of_16', 'quarter_final', 'semi_final', 'final']

  rows.forEach((row, index) => {
    const rowNum = index + 2

    try {
      if (!row.CupGameweek || !row.Stage || !row.Leg) {
        errors.push(`Row ${rowNum}: Missing required fields (CupGameweek, Stage, Leg)`)
        return
      }

      const stage = row.Stage as CupStage
      if (!validStages.includes(stage)) {
        errors.push(`Row ${rowNum}: Invalid stage "${row.Stage}"`)
        return
      }

      const leg = Number(row.Leg)
      if (leg !== 1 && leg !== 2) {
        errors.push(`Row ${rowNum}: Leg must be 1 or 2`)
        return
      }

      // Group stage matches must have teams and group name
      if (stage === 'group_stage') {
        if (!row.HomeTeam || !row.AwayTeam || !row.GroupName) {
          errors.push(`Row ${rowNum}: Group stage matches must have HomeTeam, AwayTeam, and GroupName`)
          return
        }
      }

      // Skip knockout matches without teams (they'll be created via draw tool)
      if (stage !== 'group_stage' && (!row.HomeTeam || !row.AwayTeam)) {
        // This is expected - skip silently
        return
      }

      // Resolve team names to manager emails
      let homeManager: string | undefined
      let awayManager: string | undefined

      if (row.HomeTeam) {
        const homeTeam = String(row.HomeTeam).trim()
        homeManager = managersMapping.get(homeTeam)
        if (!homeManager) {
          const availableTeams = Array.from(managersMapping.keys()).join('", "')
          errors.push(`Row ${rowNum}: Home team "${homeTeam}" not found in Managers_Mapping. Available teams: "${availableTeams}"`)
          return
        }
      }

      if (row.AwayTeam) {
        const awayTeam = String(row.AwayTeam).trim()
        awayManager = managersMapping.get(awayTeam)
        if (!awayManager) {
          const availableTeams = Array.from(managersMapping.keys()).join('", "')
          errors.push(`Row ${rowNum}: Away team "${awayTeam}" not found in Managers_Mapping. Available teams: "${availableTeams}"`)
          return
        }
      }

      data.push({
        cupGameweek: Number(row.CupGameweek),
        stage,
        leg,
        groupName: row.GroupName ? String(row.GroupName).trim().toUpperCase() : undefined,
        homeManager,
        awayManager,
        homeLineup: {
          player1: row.HomePlayer1 ? String(row.HomePlayer1).trim() : undefined,
          player2: row.HomePlayer2 ? String(row.HomePlayer2).trim() : undefined,
          player3: row.HomePlayer3 ? String(row.HomePlayer3).trim() : undefined
        },
        awayLineup: {
          player1: row.AwayPlayer1 ? String(row.AwayPlayer1).trim() : undefined,
          player2: row.AwayPlayer2 ? String(row.AwayPlayer2).trim() : undefined,
          player3: row.AwayPlayer3 ? String(row.AwayPlayer3).trim() : undefined
        },
        homeGoals: {
          player1: row.HomePlayer1Goals !== undefined && row.HomePlayer1Goals !== null && row.HomePlayer1Goals !== ''
            ? Number(row.HomePlayer1Goals) : undefined,
          player2: row.HomePlayer2Goals !== undefined && row.HomePlayer2Goals !== null && row.HomePlayer2Goals !== ''
            ? Number(row.HomePlayer2Goals) : undefined,
          player3: row.HomePlayer3Goals !== undefined && row.HomePlayer3Goals !== null && row.HomePlayer3Goals !== ''
            ? Number(row.HomePlayer3Goals) : undefined
        },
        awayGoals: {
          player1: row.AwayPlayer1Goals !== undefined && row.AwayPlayer1Goals !== null && row.AwayPlayer1Goals !== ''
            ? Number(row.AwayPlayer1Goals) : undefined,
          player2: row.AwayPlayer2Goals !== undefined && row.AwayPlayer2Goals !== null && row.AwayPlayer2Goals !== ''
            ? Number(row.AwayPlayer2Goals) : undefined,
          player3: row.AwayPlayer3Goals !== undefined && row.AwayPlayer3Goals !== null && row.AwayPlayer3Goals !== ''
            ? Number(row.AwayPlayer3Goals) : undefined
        },
        isCompleted: parseBoolean(row.IsCompleted)
      })
    } catch (error) {
      errors.push(`Row ${rowNum}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })

  return { data, errors }
}

export function validateMigrationData(data: MigrationData): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Validate league gameweeks are sequential
  const weeks = data.leagueGameweeks.map(gw => gw.week).sort((a, b) => a - b)
  for (let i = 0; i < weeks.length; i++) {
    if (weeks[i] !== i + 1) {
      errors.push(`League gameweeks must be sequential. Missing week ${i + 1}`)
    }
  }

  // Validate league match gameweeks exist
  const validWeeks = new Set(weeks)
  data.leagueMatches.forEach((match, index) => {
    if (!validWeeks.has(match.gameweek)) {
      errors.push(`League match ${index + 1}: References non-existent gameweek ${match.gameweek}`)
    }
  })

  // Validate cup gameweek references
  data.cupGameweeks.forEach((cgw, index) => {
    if (!validWeeks.has(cgw.leagueGameweek)) {
      errors.push(`Cup gameweek ${index + 1}: References non-existent league gameweek ${cgw.leagueGameweek}`)
    }
  })

  // Validate cup match references
  const validCupWeeks = new Set(data.cupGameweeks.map(cgw => cgw.cupWeek))
  data.cupMatches.forEach((match, index) => {
    if (!validCupWeeks.has(match.cupGameweek)) {
      errors.push(`Cup match ${index + 1}: References non-existent cup gameweek ${match.cupGameweek}`)
    }
  })

  // Validate group stage matches have group names
  data.cupMatches.forEach((match, index) => {
    if (match.stage === 'group_stage' && !match.groupName) {
      errors.push(`Cup match ${index + 1}: Group stage match missing group name`)
    }
  })

  // Check for duplicate managers
  const managerEmails = new Set<string>()
  const duplicates = new Set<string>()

  data.leagueMatches.forEach(match => {
    if (managerEmails.has(match.homeManager)) duplicates.add(match.homeManager)
    if (managerEmails.has(match.awayManager)) duplicates.add(match.awayManager)
    managerEmails.add(match.homeManager)
    managerEmails.add(match.awayManager)
  })

  if (duplicates.size > 0) {
    warnings.push(`Managers appear in multiple matches (expected for round-robin): ${Array.from(duplicates).join(', ')}`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

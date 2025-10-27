export interface User {
  id: string
  clerkId: string
  email: string
  firstName?: string
  lastName?: string
  isAdmin: boolean
  createdAt: Date
  updatedAt: Date
}

export interface League {
  id: string
  name: string
  adminId: string
  maxManagers?: number // Database still has this column - needs manual migration
  currentGameweek: number
  season: string
  startDate?: Date
  endDate?: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Player {
  id: string
  name: string
  surname: string
  league: string
  position: Position
  club?: string
  managerId?: string
  totalGoals?: number
  createdAt: Date
  updatedAt: Date
}

// Interface that matches the actual database response structure with joins
export interface PlayerWithManager {
  id: string
  name: string
  surname: string
  league: string
  position: Position
  club?: string
  manager_id?: string
  total_goals?: number
  created_at: Date
  updated_at: Date
  manager?: {
    id: string
    first_name?: string
    last_name?: string
  } | null
}

export interface Squad {
  id: string
  managerId: string
  leagueId: string
  players: Player[]
  createdAt: Date
  updatedAt: Date
}

export interface Lineup {
  id: string
  managerId: string
  gameweekId: string
  playerIds: string[]
  isLocked: boolean
  totalGoals: number
  createdByAdmin?: boolean
  adminCreatorId?: string
  createdAt: Date
  updatedAt: Date
}

export interface Gameweek {
  id: string
  leagueId: string
  week: number
  startDate: Date
  endDate: Date
  lockDate: Date
  isCompleted: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Match {
  id: string
  gameweekId: string
  homeManagerId: string
  awayManagerId: string
  homeScore?: number
  awayScore?: number
  isCompleted: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Result {
  id: string
  gameweekId: string
  playerId: string
  goals: number
  createdAt: Date
}

export interface Standing {
  managerId: string
  managerName: string
  email: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
  position: number
}

export type Position = 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Forward'

export type UserRole = 'admin' | 'manager'

export interface PlayerImport {
  Name: string  // Full name (first name + surname combined)
  Position: Position
  Club: string
  League?: string  // Optional - if not provided, uses the league being imported to
  Manager?: string  // Optional - manager assignment
}

export interface LineupValidation {
  isValid: boolean
  errors: string[]
}

export interface GameweekSchedule {
  week: number
  startDate: Date
  endDate: Date
  lockDate: Date
}

export interface SeasonConfig {
  totalGameweeks: number
  gameweeks: GameweekSchedule[]
}

// Enhanced types for head-to-head results management
export interface PlayerWithResult {
  id: string
  name: string
  surname: string
  position: Position
  manager_id?: string
  goals_scored?: number
}

export interface ManagerLineup {
  id: string
  manager_id: string
  gameweek_id: string
  player_ids: string[]
  players: PlayerWithResult[]
  total_goals: number
  manager: {
    id: string
    first_name?: string
    last_name?: string
    email: string
  }
}

export interface MatchWithLineups {
  id: string
  gameweek_id: string
  home_manager_id: string
  away_manager_id: string
  home_score?: number
  away_score?: number
  is_completed: boolean
  home_manager: {
    id: string
    first_name?: string
    last_name?: string
    email: string
  }
  away_manager: {
    id: string
    first_name?: string
    last_name?: string
    email: string
  }
  home_lineup?: ManagerLineup
  away_lineup?: ManagerLineup
}

export interface GameweekMatchData {
  gameweek: {
    id: string
    week: number
    league_id: string
    leagues?: {
      name: string
      season: string
    }
  }
  matches: MatchWithLineups[]
}

export interface GameweekLineup {
  id: string
  manager_id: string
  gameweek_id: string
  player_ids: string[]
  is_locked: boolean
  total_goals: number
  created_at: Date
  updated_at: Date
  users?: {
    id: string
    email: string
    first_name?: string
    last_name?: string
  }
  gameweeks?: {
    id: string
    week: number
    league_id: string
    leagues?: {
      name: string
      season: string
    }
  }
  players: PlayerWithResult[]
}

export interface GameweekWithLeague {
  id: string
  league_id: string
  week: number
  start_date: string
  end_date: string
  lock_date: string
  is_completed: boolean
  created_at: string
  leagues?: {
    id: string
    name: string
    season: string
  }
}

export interface PlayerResult {
  player_id: string
  goals: number
}

export interface GameweekResultsUpdate {
  results: PlayerResult[]
}

// Cup Tournament Types

export type CupStage = 'group_stage' | 'round_of_16' | 'quarter_final' | 'semi_final' | 'final'

export interface Cup {
  id: string
  leagueId: string
  name: string
  stage: CupStage
  isActive: boolean
  winnerId?: string
  createdAt: Date
  updatedAt: Date
}

export interface CupGroup {
  id: string
  cupId: string
  groupName: string
  managerId: string
  createdAt: Date
}

export interface CupGameweek {
  id: string
  cupId: string
  leagueGameweekId: string
  cupWeek: number
  stage: CupStage
  leg: number
  createdAt: Date
}

export interface CupMatch {
  id: string
  cupId: string
  cupGameweekId: string
  homeManagerId: string
  awayManagerId: string
  stage: CupStage
  leg: number
  groupName?: string
  homeScore?: number
  awayScore?: number
  homeAggregateScore?: number
  awayAggregateScore?: number
  isCompleted: boolean
  winnerId?: string
  createdAt: Date
  updatedAt: Date
}

export interface CupLineup {
  id: string
  managerId: string
  cupGameweekId: string
  playerIds: string[]
  isLocked: boolean
  totalGoals: number
  createdAt: Date
  updatedAt: Date
}

export interface CupGroupStanding {
  id: string
  cupId: string
  groupName: string
  managerId: string
  managerName: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
  position: number
  qualified: boolean
  updatedAt: Date
}

// Database response types (snake_case)

export interface CupWithLeague {
  id: string
  league_id: string
  name: string
  stage: CupStage
  is_active: boolean
  winner_id?: string
  created_at: string
  updated_at: string
  leagues?: {
    id: string
    name: string
    season: string
  }
}

export interface CupMatchWithManagers {
  id: string
  cup_id: string
  cup_gameweek_id: string
  home_manager_id: string
  away_manager_id: string
  stage: CupStage
  leg: number
  group_name?: string
  home_score?: number
  away_score?: number
  home_aggregate_score?: number
  away_aggregate_score?: number
  is_completed: boolean
  winner_id?: string
  created_at: string
  updated_at: string
  home_manager: {
    id: string
    first_name?: string
    last_name?: string
    email: string
  }
  away_manager: {
    id: string
    first_name?: string
    last_name?: string
    email: string
  }
}

export interface CupGameweekWithDetails {
  id: string
  cup_id: string
  league_gameweek_id: string
  cup_week: number
  stage: CupStage
  leg: number
  created_at: string
  gameweeks?: {
    id: string
    week: number
    start_date: string
    end_date: string
    lock_date: string
    is_completed: boolean
  }
}

// Dual lineup validation types

export interface DualLineupValidation {
  isValid: boolean
  leagueErrors: string[]
  cupErrors: string[]
  crossLineupErrors: string[]
}

export interface DualLineupData {
  leagueLineup: Player[]
  cupLineup: Player[]
  gameweekId: string
  cupGameweekId: string
}
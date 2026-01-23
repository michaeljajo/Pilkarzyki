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
  adminId: string // DEPRECATED: Use league_admins table instead
  maxManagers?: number // Database still has this column - needs manual migration
  currentGameweek: number
  season: string
  startDate?: Date
  endDate?: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// League admin relationship (many-to-many)
export interface LeagueAdmin {
  id: string
  leagueId: string
  userId: string
  createdAt: Date
  createdBy?: string
}

// Database response type (snake_case)
export interface LeagueAdminRow {
  id: string
  league_id: string
  user_id: string
  created_at: string
  created_by?: string
}

export interface Player {
  id: string
  name: string
  surname: string
  league: string
  position: Position
  club?: string
  footballLeague?: string  // Real-life football league (e.g., "Premier League", "La Liga")
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
  teamName?: string
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
  isFromDefault?: boolean
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
  hasPlayed: boolean
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

export type TransferType = 'initial' | 'draft' | 'swap'

// Player transfer tracking for mid-season drafts
export interface PlayerTransfer {
  id: string
  playerId: string
  managerId?: string  // NULL for unassigned players
  leagueId: string  // Required for data isolation
  effectiveFrom: Date
  effectiveUntil?: Date  // NULL for current/active assignment
  transferType: TransferType
  createdAt: Date
  createdBy?: string  // Admin who created the transfer
  notes?: string
  updatedAt: Date
}

// Database response type (snake_case)
export interface PlayerTransferRow {
  id: string
  player_id: string
  manager_id?: string
  league_id: string  // Required for data isolation
  effective_from: string
  effective_until?: string
  transfer_type: TransferType
  created_at: string
  created_by?: string
  notes?: string
  updated_at: string
}

export interface PlayerImport {
  Name: string  // Full name (first name + surname combined)
  Position: Position
  Club: string
  League?: string  // Optional - Real-life football league (e.g., "Premier League", "La Liga")
  Manager?: string  // Optional - manager assignment
  'Team Name'?: string  // Optional - team name for the squad
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
  has_played?: boolean
}

export interface ManagerLineup {
  id: string
  manager_id: string
  gameweek_id: string
  player_ids: string[]
  players: PlayerWithResult[]
  total_goals: number
  is_from_default?: boolean
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
  is_from_default?: boolean
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
  has_played?: boolean
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
  homeManagerId?: string  // Optional: null when using placeholder
  awayManagerId?: string  // Optional: null when using placeholder
  homeTeamSource?: string  // Placeholder reference (e.g., "winner_group_A", "QF1")
  awayTeamSource?: string  // Placeholder reference (e.g., "runner_up_group_C", "SF2")
  stage: CupStage
  leg: number
  matchNumber?: number  // Match number within stage (e.g., 1 for QF1, 2 for QF2)
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
  isFromDefault?: boolean
  createdAt: Date
  updatedAt: Date
}

export interface DefaultLineup {
  id: string
  managerId: string
  leagueId: string
  playerIds: string[]
  createdAt: Date
  updatedAt: Date
}

export interface DefaultCupLineup {
  id: string
  managerId: string
  cupId: string
  playerIds: string[]
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
  home_manager_id?: string  // Optional: null when using placeholder
  away_manager_id?: string  // Optional: null when using placeholder
  home_team_source?: string  // Placeholder reference
  away_team_source?: string  // Placeholder reference
  stage: CupStage
  leg: number
  match_number?: number  // Match number within stage (e.g., 1 for QF1, 2 for QF2)
  group_name?: string
  home_score?: number
  away_score?: number
  home_aggregate_score?: number
  away_aggregate_score?: number
  is_completed: boolean
  winner_id?: string
  created_at: string
  updated_at: string
  home_manager?: {
    id: string
    first_name?: string
    last_name?: string
    email: string
  } | null  // Now nullable
  away_manager?: {
    id: string
    first_name?: string
    last_name?: string
    email: string
  } | null  // Now nullable
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

// Resolved match team for display purposes
export interface ResolvedMatchTeam {
  type: 'resolved' | 'placeholder'
  managerId?: string
  managerName?: string
  placeholderText: string  // e.g., "Winner Group A" or "A1"
  placeholderShort: string  // e.g., "A1"
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

// Top Scorer types

export interface TopScorer {
  playerId: string
  playerName: string
  playerSurname: string
  position: Position
  managerId: string
  managerName: string
  totalGoals: number
  gamesPlayed: number
}

// Posts (Tablica) types

export interface Post {
  id: string
  leagueId: string
  userId: string
  content: string
  createdAt: Date
  updatedAt: Date
}

export interface PostWithUser {
  id: string
  league_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
  users: {
    id: string
    first_name?: string
    last_name?: string
    email: string
  }
}

// Lineup History types

export interface LineupHistory {
  id: string
  managerId: string
  gameweekId: string
  playerIds: string[]
  createdAt: Date
  createdByAdmin?: boolean
  adminCreatorId?: string
}

export interface CupLineupHistory {
  id: string
  managerId: string
  cupGameweekId: string
  playerIds: string[]
  createdAt: Date
}

// Database response types for lineup history (snake_case)

export interface LineupHistoryRow {
  id: string
  manager_id: string
  gameweek_id: string
  player_ids: string[]
  created_at: string
  created_by_admin?: boolean
  admin_creator_id?: string
}

export interface CupLineupHistoryRow {
  id: string
  manager_id: string
  cup_gameweek_id: string
  player_ids: string[]
  created_at: string
}
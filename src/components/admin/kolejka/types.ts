import { MatchWithLineups, PlayerWithResult } from '@/types'

/** A league gameweek row (subset used by the Kolejka page). */
export interface KolejkaGameweek {
  id: string
  league_id: string
  week: number
  start_date: string
  end_date: string
  lock_date?: string
  is_completed: boolean
}

export interface Cup {
  id: string
  name: string
  league_id: string
}

export interface CupGameweek {
  id: string
  cup_week: number
  stage: string
  leg: number
  gameweek: {
    id: string
    week: number
  }
  matches: MatchWithLineups[]
}

export interface EtLineupData {
  id: string
  manager_id: string
  cup_gameweek_id: string
  player_ids: string[]
  total_goals: number
  players: PlayerWithResult[]
}

export interface PenaltyLineupData {
  id: string
  manager_id: string
  cup_gameweek_id: string
  player_ids: string[]
  goals: number[]
  players: { id: string; name: string; surname: string }[]
}

/** Where the current gameweek sits in its lifecycle. */
export type GameweekState = 'open' | 'locked' | 'completed'

/** Derive the lifecycle state from lock date + completion flag. */
export function deriveGameweekState(gw: KolejkaGameweek | undefined): GameweekState {
  if (!gw) return 'open'
  if (gw.is_completed) return 'completed'
  const lockMs = gw.lock_date ? new Date(gw.lock_date).getTime() : null
  if (lockMs !== null && Date.now() >= lockMs) return 'locked'
  return 'open'
}

/** Polish label for a cup stage. */
export function getStageLabel(stage: string): string {
  const labels: Record<string, string> = {
    group_stage: 'Faza Grupowa',
    round_of_16: '1/8 Finału',
    quarter_final: 'Ćwierćfinał',
    semi_final: 'Półfinał',
    final: 'Finał',
  }
  return labels[stage] || stage
}

/** A knockout decider hosts extra time + penalties. */
export function isKnockoutDecider(cgw: { stage: string; leg: number }): boolean {
  return cgw.stage !== 'group_stage' && (cgw.leg === 2 || cgw.stage === 'final')
}

/** Manager display name: team name → full name → first name → email. */
export function getManagerDisplayName(manager: {
  first_name?: string
  last_name?: string
  email?: string
  squad?: { team_name?: string } | null
}): string {
  if (manager?.squad?.team_name) return manager.squad.team_name
  if (manager?.first_name && manager?.last_name) return `${manager.first_name} ${manager.last_name}`
  if (manager?.first_name) return manager.first_name
  return manager?.email || 'Nieznany menedżer'
}

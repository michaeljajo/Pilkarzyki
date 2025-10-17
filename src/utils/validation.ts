import { Player, Position, LineupValidation } from '@/types'

export function validateLineup(selectedPlayers: Player[]): LineupValidation {
  const errors: string[] = []

  // Must select exactly 3 players
  if (selectedPlayers.length !== 3) {
    errors.push('Musisz wybrać dokładnie 3 zawodników')
    return { isValid: false, errors }
  }

  // Check for unique leagues
  const leagues = selectedPlayers.map(p => p.league)
  const uniqueLeagues = new Set(leagues)
  if (uniqueLeagues.size !== 3) {
    errors.push('Każdy zawodnik musi pochodzić z innej ligi')
  }

  // Check maximum 2 forwards constraint
  const forwards = selectedPlayers.filter(p => p.position === 'Forward')
  if (forwards.length > 2) {
    errors.push('Możesz wybrać maksymalnie 2 napastników')
  }

  // Must have at least 1 non-forward (midfielder or defender)
  const nonForwards = selectedPlayers.filter(p => p.position === 'Midfielder' || p.position === 'Defender')
  if (nonForwards.length === 0) {
    errors.push('Musisz wybrać co najmniej 1 pomocnika lub obrońcę')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function isValidPosition(position: string): position is Position {
  return ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'].includes(position)
}

export function formatPlayerName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim()
}

export function calculatePoints(won: number, drawn: number, lost: number): number {
  return (won * 3) + (drawn * 1) + (lost * 0)
}

/**
 * Validate dual lineups (league + cup) to ensure no player overlap
 */
export function validateDualLineups(
  leagueLineup: Player[],
  cupLineup: Player[]
): {
  isValid: boolean
  leagueErrors: string[]
  cupErrors: string[]
  crossLineupErrors: string[]
} {
  const leagueValidation = validateLineup(leagueLineup)
  const cupValidation = validateLineup(cupLineup)

  const crossLineupErrors: string[] = []

  // Check for player overlap between league and cup lineups
  const leaguePlayerIds = new Set(leagueLineup.map(p => p.id))
  const cupPlayerIds = new Set(cupLineup.map(p => p.id))

  const overlappingPlayers = leagueLineup.filter(p => cupPlayerIds.has(p.id))
  if (overlappingPlayers.length > 0) {
    const playerNames = overlappingPlayers.map(p => `${p.name} ${p.surname}`).join(', ')
    crossLineupErrors.push(`Zawodnik(cy) wybrani w obu składach: ${playerNames}`)
  }

  return {
    isValid: leagueValidation.isValid && cupValidation.isValid && crossLineupErrors.length === 0,
    leagueErrors: leagueValidation.errors,
    cupErrors: cupValidation.errors,
    crossLineupErrors
  }
}
import { Player } from '@/types'
import { validateLineup } from '@/utils/validation'

/**
 * Result of evaluating a default lineup against a manager's CURRENT squad.
 */
export interface DefaultLineupValidity {
  isValid: boolean
  /** IDs stored in the default that are no longer part of the current squad. */
  removedPlayerIds: string[]
  /** The default's players that are still in the squad, resolved to full rows. */
  players: Player[]
}

/**
 * Single source of truth for "is this default lineup valid against the current
 * squad". Used both by the mandatory-default gate (league layout) and, defensively,
 * by the apply-default-lineups cron so an invalid default is never materialised.
 *
 * A default is VALID when:
 *  - it is non-empty,
 *  - every stored player still belongs to the manager's current squad (so a
 *    transfer that removes a defaulted player automatically invalidates it),
 *  - it satisfies the normal lineup rules (via {@link validateLineup}: unique
 *    real-life leagues, max 2 forwards, at least one non-forward when full), and
 *  - for the league default, it contains exactly 3 players. Cup defaults follow
 *    the regular cup-lineup rules (1–3 players) — pass requireExactlyThree: false.
 *
 * `squadPlayers` must be the manager's live squad rows (DB shape, i.e. with the
 * snake_case `football_league` field) for the league in question.
 */
export function evaluateDefaultLineup(
  playerIds: string[] | null | undefined,
  squadPlayers: Player[],
  opts: { requireExactlyThree: boolean }
): DefaultLineupValidity {
  const ids = playerIds ?? []
  const squadById = new Map(squadPlayers.map((p) => [p.id, p]))
  const removedPlayerIds = ids.filter((id) => !squadById.has(id))
  const resolved = ids
    .map((id) => squadById.get(id))
    .filter((p): p is Player => !!p)

  // Missing / empty default.
  if (ids.length === 0) {
    return { isValid: false, removedPlayerIds, players: resolved }
  }

  // A player was transferred out of the squad — re-arm the gate.
  if (removedPlayerIds.length > 0) {
    return { isValid: false, removedPlayerIds, players: resolved }
  }

  // League defaults must be a full lineup so the cron always fields a complete team.
  if (opts.requireExactlyThree && ids.length !== 3) {
    return { isValid: false, removedPlayerIds, players: resolved }
  }

  const validation = validateLineup(resolved)
  return { isValid: validation.isValid, removedPlayerIds, players: resolved }
}

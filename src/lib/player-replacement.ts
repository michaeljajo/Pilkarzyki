/**
 * One-for-one player replacement — the decision layer.
 *
 * A manager gives up a player who is no longer usable (typically because he
 * moved to a club outside the ten football leagues this game covers) and takes
 * a free agent from the pool instead. The write itself is a single transaction
 * in the admin_replace_player RPC (migration 034); this module holds the part
 * that is pure, so it can be read and tested without a database.
 *
 * The same rules are enforced again inside the RPC, against rows it has locked.
 * That is deliberate, not duplication for its own sake: the checks here produce
 * the message an admin actually reads, while the ones in the RPC are what makes
 * two concurrent replacements safe.
 */

/** The columns of a player this decision needs. Matches the DB row shape. */
export interface ReplacementPlayerRef {
  id: string
  name: string
  surname: string
  position: string
  club?: string | null
  football_league?: string | null
  manager_id: string | null
  league_id: string
}

export type ReplacementCheck =
  | { ok: true }
  | { ok: false; status: number; error: string }

/** "Robert Lewandowski" — the label used in messages and the audit note. */
export function playerFullName(p: Pick<ReplacementPlayerRef, 'name' | 'surname'>): string {
  return `${p.name} ${p.surname}`.trim()
}

/**
 * Decide whether a replacement may go ahead.
 *
 * `playerOut` / `playerIn` are null when the id did not resolve to a player.
 * Returns the first violated rule, so the admin fixes one thing at a time.
 */
export function validateReplacement(input: {
  leagueId: string
  managerId: string
  playerOut: ReplacementPlayerRef | null
  playerIn: ReplacementPlayerRef | null
}): ReplacementCheck {
  const { leagueId, managerId, playerOut, playerIn } = input

  if (!playerOut || !playerIn) {
    return { ok: false, status: 404, error: 'Nie znaleziono zawodnika.' }
  }

  if (playerOut.id === playerIn.id) {
    return { ok: false, status: 400, error: 'Wybierz dwóch różnych zawodników.' }
  }

  if (playerOut.league_id !== leagueId || playerIn.league_id !== leagueId) {
    return { ok: false, status: 400, error: 'Zawodnik nie należy do tej ligi.' }
  }

  if (playerOut.manager_id !== managerId) {
    return {
      ok: false,
      status: 400,
      error: `${playerFullName(playerOut)} nie należy do składu wybranego menedżera.`,
    }
  }

  if (playerIn.manager_id !== null) {
    return {
      ok: false,
      status: 409,
      error: `${playerFullName(playerIn)} ma już menedżera — wybierz zawodnika z puli wolnych.`,
    }
  }

  return { ok: true }
}

/**
 * The note stored on both player_transfers rows, so the reason a player left a
 * squad is readable straight from the transfer history months later.
 */
export function replacementNote(
  playerOut: ReplacementPlayerRef,
  playerIn: ReplacementPlayerRef
): string {
  return `Zmiana zawodnika: ${playerFullName(playerOut)} → ${playerFullName(playerIn)}`
}

/** Maps an admin_replace_player exception to a Polish message + HTTP status. */
const RPC_ERRORS: Record<string, { status: number; message: string }> = {
  SAME_PLAYER: { status: 400, message: 'Wybierz dwóch różnych zawodników.' },
  LEAGUE_NOT_FOUND: { status: 404, message: 'Nie znaleziono ligi.' },
  DRAFT_IN_PROGRESS: {
    status: 409,
    message: 'W tej lidze trwa draft — dokończ go przed ręczną zmianą zawodnika.',
  },
  PLAYER_NOT_FOUND: { status: 404, message: 'Nie znaleziono zawodnika.' },
  PLAYER_WRONG_LEAGUE: { status: 400, message: 'Zawodnik nie należy do tej ligi.' },
  PLAYER_UNASSIGNED: { status: 400, message: 'Odchodzący zawodnik nie ma menedżera.' },
  MANAGER_MISMATCH: {
    status: 409,
    message: 'Skład menedżera zmienił się w międzyczasie — odśwież stronę i spróbuj ponownie.',
  },
  PLAYER_TAKEN: {
    status: 409,
    message: 'Wchodzący zawodnik został już przypisany — odśwież stronę i wybierz innego.',
  },
  SQUAD_NOT_FOUND: { status: 404, message: 'Nie znaleziono składu menedżera.' },
}

export function mapReplacementRpcError(raw: string): { status: number; message: string } {
  for (const key of Object.keys(RPC_ERRORS)) {
    if (raw.includes(key)) return RPC_ERRORS[key]
  }
  return { status: 500, message: 'Błąd serwera podczas zmiany zawodnika.' }
}

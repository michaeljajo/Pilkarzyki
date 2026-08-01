// Draft delegations ("zastępstwa"): a manager who cannot attend nominates
// another manager of the league to confirm picks for him.
//
// The client never decides *whether* a delegated pick is allowed — that is
// enforced in draft_make_pick. These helpers only drive the UI, and in
// particular derive the "acting for" mode from whose turn it actually is, so a
// delegate can never aim a pick at the wrong squad.

export interface Delegation {
  delegatorSquadId: string
  delegateUserId: string
}

/** The user standing in for a squad, or null when its own manager picks. */
export function delegateForSquad(
  delegations: Delegation[] | undefined,
  squadId: string | null | undefined
): string | null {
  if (!squadId) return null
  return delegations?.find((d) => d.delegatorSquadId === squadId)?.delegateUserId ?? null
}

/**
 * The squad the viewer is currently standing in for, or null. A manager's own
 * turn is never "acting for" — that stays an ordinary pick.
 */
export function resolveActingForSquadId({
  delegations,
  onClockSquadId,
  myUserId,
  mySquadId,
}: {
  delegations: Delegation[] | undefined
  onClockSquadId: string | null | undefined
  myUserId: string | null | undefined
  mySquadId: string | null | undefined
}): string | null {
  if (!onClockSquadId || !myUserId) return null
  if (onClockSquadId === mySquadId) return null
  return delegateForSquad(delegations, onClockSquadId) === myUserId ? onClockSquadId : null
}

import { CupStage, CupFormat } from '@/types'

export interface CupScheduleMatch {
  homeManagerId: string
  awayManagerId: string
  cupWeek: number
  stage: CupStage
  leg: number
  groupName?: string
}

export interface GroupAssignment {
  groupName: string
  managerIds: string[]
}

// Sentinel used by the circle method to represent the idle slot in an
// odd-sized group. Pairings against BYE are dropped, which is what produces
// the resting (bye) manager for that round. Chosen so it can never collide
// with a real manager UUID.
const BYE = '__BYE__'

// ---------------------------------------------------------------------
// Bracket helpers
// ---------------------------------------------------------------------

/** Bracket size that a knockout stage represents (final = 2, SF = 4, …). */
export function stageBracketSize(stage: CupStage): number {
  switch (stage) {
    case 'final': return 2
    case 'semi_final': return 4
    case 'quarter_final': return 8
    case 'round_of_16': return 16
    case 'round_of_32': return 32
    default: return 0
  }
}

/** The knockout stage that hosts a bracket of the given size. */
export function stageForBracketSize(size: number): CupStage | null {
  switch (size) {
    case 2: return 'final'
    case 4: return 'semi_final'
    case 8: return 'quarter_final'
    case 16: return 'round_of_16'
    case 32: return 'round_of_32'
    default: return null
  }
}

/** Descending list of knockout stages for a bracket of `totalQualifiers`. */
export function expectedKnockoutStages(totalQualifiers: number): CupStage[] {
  const stages: CupStage[] = []
  for (let size = totalQualifiers; size >= 2; size = size / 2) {
    const stage = stageForBracketSize(size)
    if (!stage) return []
    stages.push(stage)
  }
  return stages
}

function isPowerOfTwo(n: number): boolean {
  return Number.isInteger(n) && n >= 1 && (n & (n - 1)) === 0
}

/**
 * Generate group names (A, B, C, D, ...)
 */
export function generateGroupNames(groupCount: number): string[] {
  return Array.from({ length: groupCount }, (_, i) => String.fromCharCode(65 + i)) // A, B, C, D, ...
}

/**
 * Auto-balance `total` participants across `count` groups as evenly as
 * possible, larger groups first: 18 into 2 → [9, 9]; 18 into 4 → [5, 5, 4, 4].
 */
export function autoBalanceGroupSizes(total: number, count: number): number[] {
  if (count < 1) return []
  const base = Math.floor(total / count)
  const remainder = total % count
  return Array.from({ length: count }, (_, i) => (i < remainder ? base + 1 : base))
}

/** Resolve the group sizes a format implies for a given participant count. */
export function resolveGroupSizes(participantCount: number, format: CupFormat): number[] {
  if (format.groups.sizes && format.groups.sizes.length > 0) {
    return format.groups.sizes
  }
  return autoBalanceGroupSizes(participantCount, format.groups.count)
}

// ---------------------------------------------------------------------
// Format validation
// ---------------------------------------------------------------------

export interface CupFormatSummary {
  participantCount: number
  groupCount: number
  groupSizes: number[]
  legs: 1 | 2
  groupStageWeeks: number
  knockoutWeeks: number
  totalWeeks: number
  groupMatchesTotal: number
  totalQualifiers: number
  knockoutStages: CupStage[]
  /** Group matches a manager plays (min/max across differently-sized groups). */
  matchesPerManager: { min: number; max: number }
  /** Byes a manager sits out during the group stage (min/max). */
  byesPerManager: { min: number; max: number }
}

export interface ValidateCupFormatResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  summary: CupFormatSummary
}

/** Number of group-stage cup weeks a group of size `n` occupies, given legs. */
function groupRounds(size: number, legs: 1 | 2): number {
  if (size < 2) return 0
  const base = size % 2 === 1 ? size : size - 1
  return base * legs
}

/**
 * Validate a cup format against a concrete participant count. Errors block
 * generation; warnings are advisory. Always returns a best-effort summary so
 * the wizard can display it. All messages are in Polish (user-facing).
 */
export function validateCupFormat(
  participantCount: number,
  format: CupFormat
): ValidateCupFormatResult {
  const errors: string[] = []
  const warnings: string[] = []

  const count = format.groups.count
  const legs = format.groups.legs
  const { topPerGroup, bestRemaining } = format.qualification

  // Resolve group sizes.
  let sizes: number[]
  if (format.groups.sizes && format.groups.sizes.length > 0) {
    sizes = format.groups.sizes
    if (sizes.length !== count) {
      errors.push(`Liczba podanych rozmiarów grup (${sizes.length}) nie zgadza się z liczbą grup (${count}).`)
    }
    const sum = sizes.reduce((a, b) => a + b, 0)
    if (sum !== participantCount) {
      errors.push(`Suma rozmiarów grup (${sum}) nie zgadza się z liczbą uczestników (${participantCount}).`)
    }
  } else {
    sizes = autoBalanceGroupSizes(participantCount, count)
  }

  if (count < 1) {
    errors.push('Musi być co najmniej jedna grupa.')
  }
  if (legs !== 1 && legs !== 2) {
    errors.push('Liczba meczów w grupie musi wynosić 1 (pojedyncze) lub 2 (podwójne).')
  }
  if (format.aggregateTieBreak !== 'et_penalties') {
    errors.push('Nieobsługiwany sposób rozstrzygania remisu w dwumeczu.')
  }

  const smallestGroup = sizes.length > 0 ? Math.min(...sizes) : 0
  if (smallestGroup < 2) {
    errors.push('Każda grupa musi liczyć co najmniej 2 menedżerów.')
  }

  if (!Number.isInteger(topPerGroup) || topPerGroup < 1) {
    errors.push('Liczba awansujących z grupy musi wynosić co najmniej 1.')
  } else if (smallestGroup >= 2 && topPerGroup >= smallestGroup) {
    errors.push(`Liczba awansujących z grupy (${topPerGroup}) musi być mniejsza niż najmniejsza grupa (${smallestGroup}).`)
  }

  if (!Number.isInteger(bestRemaining) || bestRemaining < 0) {
    errors.push('Liczba najlepszych z pozostałych musi być liczbą nieujemną.')
  }

  const totalQualifiers = count * topPerGroup + bestRemaining
  if (!isPowerOfTwo(totalQualifiers) || totalQualifiers < 2) {
    errors.push(`Liczba awansujących (${totalQualifiers}) musi być potęgą dwójki (2, 4, 8, 16, 32).`)
  }

  // Knockout round list must match the bracket exactly.
  const expectedStages = expectedKnockoutStages(totalQualifiers)
  if (isPowerOfTwo(totalQualifiers) && totalQualifiers >= 2) {
    const actualStages = format.knockout.map(k => k.stage)
    if (actualStages.length !== expectedStages.length) {
      errors.push(`Faza pucharowa musi mieć ${expectedStages.length} rund(y) dla ${totalQualifiers} drużyn.`)
    } else {
      for (let i = 0; i < expectedStages.length; i++) {
        if (actualStages[i] !== expectedStages[i]) {
          errors.push(`Runda ${i + 1} fazy pucharowej powinna być etapem „${expectedStages[i]}”.`)
          break
        }
      }
    }
    const lastStage = actualStages[actualStages.length - 1]
    if (lastStage && lastStage !== 'final') {
      errors.push('Ostatnia runda fazy pucharowej musi być finałem.')
    }
  }
  for (const round of format.knockout) {
    if (round.legs !== 1 && round.legs !== 2) {
      errors.push(`Runda „${round.stage}” musi mieć 1 lub 2 mecze.`)
      break
    }
  }

  // Uneven groups + best-remaining ⇒ teams played a different number of games.
  const uneven = new Set(sizes).size > 1
  if (uneven && bestRemaining > 0) {
    warnings.push('Grupy mają różną liczbę drużyn — „najlepsi z pozostałych” rozegrają różną liczbę meczów, co może być niesprawiedliwe.')
  }

  // ---- Summary (best effort) ----
  const groupStageWeeks = sizes.length > 0 ? Math.max(...sizes.map(s => groupRounds(s, legs))) : 0
  const knockoutWeeks = format.knockout.reduce((sum, r) => sum + r.legs, 0)
  const groupMatchesTotal = sizes.reduce((sum, s) => sum + (s * (s - 1) / 2) * legs, 0)

  const matchesPer = sizes.map(s => (s - 1) * legs)
  const byesPer = sizes.map(s => groupStageWeeks - (s - 1) * legs)

  const summary: CupFormatSummary = {
    participantCount,
    groupCount: count,
    groupSizes: sizes,
    legs,
    groupStageWeeks,
    knockoutWeeks,
    totalWeeks: groupStageWeeks + knockoutWeeks,
    groupMatchesTotal,
    totalQualifiers,
    knockoutStages: format.knockout.map(k => k.stage),
    matchesPerManager: {
      min: matchesPer.length ? Math.min(...matchesPer) : 0,
      max: matchesPer.length ? Math.max(...matchesPer) : 0,
    },
    byesPerManager: {
      min: byesPer.length ? Math.min(...byesPer) : 0,
      max: byesPer.length ? Math.max(...byesPer) : 0,
    },
  }

  return { valid: errors.length === 0, errors, warnings, summary }
}

// ---------------------------------------------------------------------
// Group stage schedule (circle method)
// ---------------------------------------------------------------------

/**
 * Single round-robin rounds for one group via the circle method. Returns an
 * array of rounds; each round is an array of [home, away] pairs. Pairings
 * against the BYE sentinel are dropped (that manager rests this round).
 *
 * A group of size n yields n rounds when n is odd (one bye per round) and
 * n - 1 rounds when n is even.
 */
function circleRounds(ids: string[]): [string, string][][] {
  const arr = [...ids]
  if (arr.length % 2 === 1) arr.push(BYE)
  const n = arr.length
  const rounds: [string, string][][] = []

  const fixed = arr[0]
  let rotating = arr.slice(1)

  for (let r = 0; r < n - 1; r++) {
    const circle = [fixed, ...rotating]
    const pairs: [string, string][] = []
    for (let i = 0; i < n / 2; i++) {
      const a = circle[i]
      const b = circle[n - 1 - i]
      if (a === BYE || b === BYE) continue
      // Alternate home/away by round so no one is always at home.
      pairs.push(r % 2 === 0 ? [a, b] : [b, a])
    }
    rounds.push(pairs)
    // Rotate everyone except the fixed slot one step clockwise.
    rotating = [rotating[rotating.length - 1], ...rotating.slice(0, -1)]
  }

  return rounds
}

/**
 * Generate the complete group stage schedule for all groups, any group size.
 *
 * Rounds are aligned across groups: group round k is always cup week k, so the
 * total number of group cup weeks is the maximum round count over all groups
 * (managers in smaller groups simply rest in the trailing weeks). For a double
 * round-robin (legs = 2) the second half mirrors the first with home/away
 * reversed.
 *
 * Group matches always carry leg = 1 (leg is only meaningful for two-legged
 * knockout ties). Asserts that no manager plays more than once in a cup week.
 */
export function generateGroupStageSchedule(
  groupAssignments: GroupAssignment[],
  legs: 1 | 2
): CupScheduleMatch[] {
  const all: CupScheduleMatch[] = []

  for (const group of groupAssignments) {
    if (group.managerIds.length < 2) {
      throw new Error(`Group ${group.groupName} must have at least 2 managers`)
    }

    const firstHalf = circleRounds(group.managerIds)
    const rounds: [string, string][][] =
      legs === 2
        ? [...firstHalf, ...firstHalf.map(round => round.map(([h, a]) => [a, h] as [string, string]))]
        : firstHalf

    rounds.forEach((pairs, roundIdx) => {
      const cupWeek = roundIdx + 1
      for (const [home, away] of pairs) {
        all.push({
          homeManagerId: home,
          awayManagerId: away,
          cupWeek,
          stage: 'group_stage',
          leg: 1,
          groupName: group.groupName,
        })
      }
    })
  }

  assertNoDoubleBooking(all)
  return all
}

/** Guarantee: no manager appears in more than one match in the same cup week. */
function assertNoDoubleBooking(matches: CupScheduleMatch[]): void {
  const seenByWeek = new Map<number, Set<string>>()
  for (const m of matches) {
    let week = seenByWeek.get(m.cupWeek)
    if (!week) {
      week = new Set<string>()
      seenByWeek.set(m.cupWeek, week)
    }
    for (const id of [m.homeManagerId, m.awayManagerId]) {
      if (week.has(id)) {
        throw new Error(`Manager ${id} is booked twice in cup week ${m.cupWeek}`)
      }
      week.add(id)
    }
  }
}

// ---------------------------------------------------------------------
// Knockout / stage progression
// ---------------------------------------------------------------------

/**
 * Which stage comes after `currentStage`, driven entirely by the cup's format
 * knockout list. For the group → knockout transition, when `totalQualifiers`
 * is provided the matching bracket stage is chosen (robust for legacy formats
 * whose default knockout list may not match a small bracket); otherwise the
 * first configured knockout round is used. Returns null past the final.
 */
export function getNextStage(
  currentStage: CupStage,
  format: CupFormat,
  totalQualifiers?: number
): CupStage | null {
  const list = format.knockout.map(k => k.stage)
  if (list.length === 0) return null

  if (currentStage === 'group_stage') {
    if (totalQualifiers != null) {
      const match = list.find(s => stageBracketSize(s) === totalQualifiers)
      if (match) return match
    }
    return list[0] ?? null
  }

  const idx = list.indexOf(currentStage)
  if (idx === -1) return null
  return list[idx + 1] ?? null
}

/** Number of legs configured for a knockout stage (defaults sensibly). */
export function legsForStage(format: CupFormat, stage: CupStage): 1 | 2 {
  const round = format.knockout.find(k => k.stage === stage)
  if (round) return round.legs
  return stage === 'final' ? 1 : 2
}

// ---------------------------------------------------------------------
// Qualification
// ---------------------------------------------------------------------

export interface QualificationRow {
  managerId: string
  groupName: string
  position: number
  points: number
  goalsFor: number
  goalsAgainst: number
}

/**
 * Given the fully-ranked group standings, return the set of manager IDs that
 * qualify: positions 1..topPerGroup in every group, plus the best
 * `bestRemaining` teams among the next-placed (topPerGroup + 1) teams across
 * groups, ranked by the same order used inside a group (points → goals for →
 * goals against). Head-to-head is intentionally not applied across groups.
 */
export function computeQualifiedManagerIds(
  rows: QualificationRow[],
  qualification: { topPerGroup: number; bestRemaining: number }
): Set<string> {
  const qualified = new Set<string>()

  for (const row of rows) {
    if (row.position >= 1 && row.position <= qualification.topPerGroup) {
      qualified.add(row.managerId)
    }
  }

  if (qualification.bestRemaining > 0) {
    const nextPos = qualification.topPerGroup + 1
    const candidates = rows
      .filter(r => r.position === nextPos)
      .sort((a, b) =>
        b.points - a.points ||
        b.goalsFor - a.goalsFor ||
        b.goalsAgainst - a.goalsAgainst
      )
    candidates.slice(0, qualification.bestRemaining).forEach(c => qualified.add(c.managerId))
  }

  return qualified
}

// ---------------------------------------------------------------------
// Group assignment validation
// ---------------------------------------------------------------------

/**
 * Validate that manager→group assignments are consistent with the cup format:
 * the right number of groups, matching (auto-balanced or explicit) sizes,
 * every group ≥ 2, no manager assigned twice, and all participants covered.
 */
export function validateGroupAssignments(
  groupAssignments: GroupAssignment[],
  totalManagers: number,
  format: CupFormat
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  const assignedManagers = groupAssignments.reduce((sum, g) => sum + g.managerIds.length, 0)
  if (assignedManagers !== totalManagers) {
    errors.push(`Total assigned managers (${assignedManagers}) doesn't match participants (${totalManagers})`)
  }

  if (groupAssignments.length !== format.groups.count) {
    errors.push(`Expected ${format.groups.count} groups but got ${groupAssignments.length}`)
  }

  for (const group of groupAssignments) {
    if (group.managerIds.length < 2) {
      errors.push(`Group ${group.groupName} must have at least 2 managers`)
    }
  }

  // Expected sizes as a multiset (order-independent).
  const expectedSizes = resolveGroupSizes(totalManagers, format).slice().sort((a, b) => a - b)
  const actualSizes = groupAssignments.map(g => g.managerIds.length).slice().sort((a, b) => a - b)
  if (expectedSizes.length === actualSizes.length &&
      !expectedSizes.every((s, i) => s === actualSizes[i])) {
    errors.push(`Group sizes ${actualSizes.join(', ')} do not match the expected ${expectedSizes.join(', ')}`)
  }

  const allManagerIds = groupAssignments.flatMap(g => g.managerIds)
  const uniqueManagerIds = new Set(allManagerIds)
  if (uniqueManagerIds.size !== allManagerIds.length) {
    errors.push('Some managers are assigned to multiple groups')
  }

  return { isValid: errors.length === 0, errors }
}

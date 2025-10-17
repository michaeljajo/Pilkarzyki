import { CupStage } from '@/types'

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

/**
 * Validates if a league can have a cup tournament
 * Only leagues with 4, 8, 16, or 32 managers are allowed
 */
export function canLeagueHaveCup(managerCount: number): boolean {
  return managerCount === 4 || managerCount === 8 || managerCount === 16 || managerCount === 32
}

/**
 * Calculate number of groups needed for a given manager count
 * Groups are always 2 or 4 managers each (2 for 4-team cups, 4 for all others)
 */
export function calculateGroupCount(managerCount: number): number {
  if (!canLeagueHaveCup(managerCount)) {
    throw new Error('Cup tournaments only available for leagues with 4, 8, 16, or 32 managers')
  }
  if (managerCount === 4) {
    return 2 // Two groups of 2
  }
  return managerCount / 4
}

/**
 * Generate group names (A, B, C, D, ...)
 */
export function generateGroupNames(groupCount: number): string[] {
  return Array.from({ length: groupCount }, (_, i) => String.fromCharCode(65 + i)) // A, B, C, D, ...
}

/**
 * Generate double round-robin schedule within a single group (2 or 4 managers)
 * Each manager plays every other manager twice (home and away)
 */
function generateGroupRoundRobin(managerIds: string[]): { home: string; away: string }[] {
  if (managerIds.length !== 2 && managerIds.length !== 4) {
    throw new Error('Groups must have exactly 2 or 4 managers')
  }

  const matches: { home: string; away: string }[] = []

  // Generate all unique pairings
  for (let i = 0; i < managerIds.length; i++) {
    for (let j = i + 1; j < managerIds.length; j++) {
      // First leg: i at home
      matches.push({
        home: managerIds[i],
        away: managerIds[j]
      })
      // Second leg: j at home (reverse fixture)
      matches.push({
        home: managerIds[j],
        away: managerIds[i]
      })
    }
  }

  return matches
}

/**
 * Distribute group matches across gameweeks to ensure no manager plays twice in same week
 */
function distributeGroupMatches(
  matches: { home: string; away: string }[],
  groupName: string,
  startWeek: number
): CupScheduleMatch[] {
  const scheduleMatches: CupScheduleMatch[] = []
  const managerGameweeks: Record<string, Set<number>> = {}

  let currentWeek = startWeek

  for (const match of matches) {
    // Initialize tracking for managers if not exists
    if (!managerGameweeks[match.home]) managerGameweeks[match.home] = new Set()
    if (!managerGameweeks[match.away]) managerGameweeks[match.away] = new Set()

    // Find first week where both managers are free
    while (
      managerGameweeks[match.home].has(currentWeek) ||
      managerGameweeks[match.away].has(currentWeek)
    ) {
      currentWeek++
    }

    // Schedule the match
    scheduleMatches.push({
      homeManagerId: match.home,
      awayManagerId: match.away,
      cupWeek: currentWeek,
      stage: 'group_stage',
      leg: 1,
      groupName
    })

    // Mark both managers as busy this week
    managerGameweeks[match.home].add(currentWeek)
    managerGameweeks[match.away].add(currentWeek)

    // Try next week for next match
    currentWeek = startWeek
  }

  return scheduleMatches
}

/**
 * Generate complete group stage schedule for all groups
 */
export function generateGroupStageSchedule(
  groupAssignments: GroupAssignment[]
): CupScheduleMatch[] {
  const allMatches: CupScheduleMatch[] = []
  const startWeek = 1

  for (const group of groupAssignments) {
    if (group.managerIds.length !== 2 && group.managerIds.length !== 4) {
      throw new Error(`Group ${group.groupName} must have exactly 2 or 4 managers`)
    }

    // Generate round-robin matches for this group
    const groupMatches = generateGroupRoundRobin(group.managerIds)

    // Distribute matches across gameweeks
    const scheduledMatches = distributeGroupMatches(groupMatches, group.groupName, startWeek)

    allMatches.push(...scheduledMatches)
  }

  return allMatches
}

/**
 * Generate knockout bracket based on group standings
 * @param qualifiedManagers Array of [groupName, position1Id, position2Id]
 * Example: [['A', 'mgr1', 'mgr2'], ['B', 'mgr3', 'mgr4']] means Group A winner is mgr1, runner-up is mgr2
 */
export interface QualifiedTeam {
  groupName: string
  position: number // 1 or 2
  managerId: string
}

export function generateKnockoutBracket(
  qualifiedTeams: QualifiedTeam[],
  startWeek: number
): CupScheduleMatch[] {
  // Sort by group name to ensure consistent bracket
  const sortedTeams = [...qualifiedTeams].sort((a, b) => a.groupName.localeCompare(b.groupName))

  // Group teams by position
  const winners = sortedTeams.filter(t => t.position === 1)
  const runnersUp = sortedTeams.filter(t => t.position === 2)

  // Create bracket: A1 vs B2, B1 vs A2, C1 vs D2, D1 vs C2, etc.
  const matches: CupScheduleMatch[] = []
  const currentWeek = startWeek

  // Determine stage based on number of qualified teams
  const numTeams = qualifiedTeams.length
  let stage: CupStage
  if (numTeams === 16) stage = 'round_of_16'
  else if (numTeams === 8) stage = 'quarter_final'
  else if (numTeams === 4) stage = 'semi_final'
  else stage = 'final'

  // For 8 teams (2 groups): A1 vs B2, B1 vs A2
  // For 16 teams (4 groups): A1 vs B2, B1 vs A2, C1 vs D2, D1 vs C2
  // For 32 teams (8 groups): A1 vs B2, B1 vs A2, C1 vs D2, D1 vs C2, E1 vs F2, F1 vs E2, G1 vs H2, H1 vs G2

  for (let i = 0; i < winners.length; i += 2) {
    const firstWinner = winners[i]
    const secondWinner = winners[i + 1]
    const firstRunnerUp = runnersUp[i]
    const secondRunnerUp = runnersUp[i + 1]

    // Match 1: Winner of group i vs Runner-up of group i+1
    // Leg 1
    matches.push({
      homeManagerId: firstWinner.managerId,
      awayManagerId: secondRunnerUp.managerId,
      cupWeek: currentWeek,
      stage,
      leg: 1
    })

    // Leg 2 (only if not final)
    if (stage !== 'final') {
      matches.push({
        homeManagerId: secondRunnerUp.managerId,
        awayManagerId: firstWinner.managerId,
        cupWeek: currentWeek + 1,
        stage,
        leg: 2
      })
    }

    // Match 2: Winner of group i+1 vs Runner-up of group i
    matches.push({
      homeManagerId: secondWinner.managerId,
      awayManagerId: firstRunnerUp.managerId,
      cupWeek: currentWeek,
      stage,
      leg: 1
    })

    if (stage !== 'final') {
      matches.push({
        homeManagerId: firstRunnerUp.managerId,
        awayManagerId: secondWinner.managerId,
        cupWeek: currentWeek + 1,
        stage,
        leg: 2
      })
    }
  }

  return matches
}

/**
 * Generate subsequent knockout round based on previous round winners
 */
export function generateNextKnockoutRound(
  previousRoundWinners: string[],
  startWeek: number,
  stage: CupStage
): CupScheduleMatch[] {
  const matches: CupScheduleMatch[] = []
  const numMatches = previousRoundWinners.length / 2

  for (let i = 0; i < numMatches; i++) {
    const home = previousRoundWinners[i * 2]
    const away = previousRoundWinners[i * 2 + 1]

    // Leg 1
    matches.push({
      homeManagerId: home,
      awayManagerId: away,
      cupWeek: startWeek,
      stage,
      leg: 1
    })

    // Leg 2 (only if not final)
    if (stage !== 'final') {
      matches.push({
        homeManagerId: away,
        awayManagerId: home,
        cupWeek: startWeek + 1,
        stage,
        leg: 2
      })
    }
  }

  return matches
}

/**
 * Calculate which stage comes after current stage
 */
export function getNextStage(currentStage: CupStage, numQualified: number): CupStage | null {
  if (currentStage === 'group_stage') {
    if (numQualified === 16) return 'round_of_16'
    if (numQualified === 8) return 'quarter_final'
    if (numQualified === 4) return 'semi_final'
  }
  if (currentStage === 'round_of_16') return 'quarter_final'
  if (currentStage === 'quarter_final') return 'semi_final'
  if (currentStage === 'semi_final') return 'final'
  return null // Final has no next stage
}

/**
 * Validate group assignments
 */
export function validateGroupAssignments(
  groupAssignments: GroupAssignment[],
  totalManagers: number
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check if total managers matches sum of group assignments
  const assignedManagers = groupAssignments.reduce((sum, g) => sum + g.managerIds.length, 0)
  if (assignedManagers !== totalManagers) {
    errors.push(`Total assigned managers (${assignedManagers}) doesn't match league managers (${totalManagers})`)
  }

  // Determine expected group size based on total managers
  const expectedGroupSize = totalManagers === 4 ? 2 : 4

  // Check if all groups have correct number of managers
  groupAssignments.forEach(group => {
    if (group.managerIds.length !== expectedGroupSize) {
      errors.push(`Group ${group.groupName} has ${group.managerIds.length} managers (must be ${expectedGroupSize})`)
    }
  })

  // Check for duplicate manager assignments
  const allManagerIds = groupAssignments.flatMap(g => g.managerIds)
  const uniqueManagerIds = new Set(allManagerIds)
  if (uniqueManagerIds.size !== allManagerIds.length) {
    errors.push('Some managers are assigned to multiple groups')
  }

  // Check if number of groups matches manager count
  const expectedGroups = totalManagers === 4 ? 2 : totalManagers / 4
  if (groupAssignments.length !== expectedGroups) {
    errors.push(`Expected ${expectedGroups} groups but got ${groupAssignments.length}`)
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

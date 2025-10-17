export interface ScheduleMatch {
  homeManagerId: string
  awayManagerId: string
  gameweek: number
}

export function generateRoundRobinSchedule(managerIds: string[]): ScheduleMatch[] {
  const matches: ScheduleMatch[] = []
  const numManagers = managerIds.length

  if (numManagers < 2) {
    throw new Error('Need at least 2 managers to create a schedule')
  }

  // For odd number of managers, add a "bye" placeholder
  const managers = [...managerIds]
  if (numManagers % 2 === 1) {
    managers.push('BYE')
  }

  const totalManagers = managers.length
  const totalRounds = totalManagers - 1
  let gameweek = 1

  // Generate first round-robin (rounds 1 to totalRounds)
  for (let round = 0; round < totalRounds; round++) {
    const roundMatches: ScheduleMatch[] = []

    for (let i = 0; i < totalManagers / 2; i++) {
      const home = managers[i]
      const away = managers[totalManagers - 1 - i]

      // Skip matches involving the "BYE" team
      if (home !== 'BYE' && away !== 'BYE') {
        roundMatches.push({
          homeManagerId: home,
          awayManagerId: away,
          gameweek
        })
      }
    }

    matches.push(...roundMatches)
    gameweek++

    // Rotate all teams except the first one
    const temp = managers[1]
    for (let i = 1; i < totalManagers - 1; i++) {
      managers[i] = managers[i + 1]
    }
    managers[totalManagers - 1] = temp
  }

  // Generate second round-robin (reverse home/away)
  const secondRoundMatches = matches.map(match => ({
    homeManagerId: match.awayManagerId,
    awayManagerId: match.homeManagerId,
    gameweek: match.gameweek + totalRounds
  }))

  return [...matches, ...secondRoundMatches]
}

export function validateSchedule(
  matches: ScheduleMatch[],
  managerIds: string[],
  totalGameweeks: number
): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Check if each manager plays each other manager exactly twice
  const matchCounts: Record<string, Record<string, number>> = {}

  managerIds.forEach(managerId => {
    matchCounts[managerId] = {}
    managerIds.forEach(opponentId => {
      if (managerId !== opponentId) {
        matchCounts[managerId][opponentId] = 0
      }
    })
  })

  matches.forEach(match => {
    const { homeManagerId, awayManagerId } = match
    if (matchCounts[homeManagerId] && matchCounts[homeManagerId][awayManagerId] !== undefined) {
      matchCounts[homeManagerId][awayManagerId]++
    }
    if (matchCounts[awayManagerId] && matchCounts[awayManagerId][homeManagerId] !== undefined) {
      matchCounts[awayManagerId][homeManagerId]++
    }
  })

  // Verify each manager plays each other manager exactly twice
  managerIds.forEach(managerId => {
    managerIds.forEach(opponentId => {
      if (managerId !== opponentId) {
        const count = matchCounts[managerId][opponentId]
        if (count !== 2) {
          errors.push(`${managerId} plays ${opponentId} ${count} times (should be 2)`)
        }
      }
    })
  })

  // Check gameweek distribution
  const maxGameweek = Math.max(...matches.map(m => m.gameweek))
  if (maxGameweek > totalGameweeks) {
    errors.push(`Schedule requires ${maxGameweek} gameweeks but only ${totalGameweeks} available`)
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}
import { getTeamOrManagerName } from '@/utils/team-name-resolver'

interface Manager {
  id: string
  first_name?: string
  last_name?: string
  email: string
  squad?: { team_name?: string }
}

interface KnockoutMatch {
  id: string
  stage: string
  leg: number
  home_manager: Manager
  away_manager: Manager
  home_aggregate_score?: number
  away_aggregate_score?: number
  is_completed: boolean
  winner_id?: string
}

interface KnockoutBracketProps {
  matches: KnockoutMatch[]
}

export function KnockoutBracket({ matches }: KnockoutBracketProps) {
  const getManagerDisplayName = (manager: Manager) => {
    return getTeamOrManagerName({
      manager: {
        first_name: manager.first_name,
        last_name: manager.last_name,
        email: manager.email
      },
      squad: manager.squad
    })
  }

  const getStageLabel = (stage: string) => {
    const stageLabels: Record<string, string> = {
      'round_of_16': '1/8 finału',
      'quarter_final': 'Ćwierćfinał',
      'semi_final': 'Półfinał',
      'final': 'Finał'
    }
    return stageLabels[stage] || stage
  }

  const getStageOrder = (stage: string): number => {
    const order: Record<string, number> = {
      'round_of_16': 1,
      'quarter_final': 2,
      'semi_final': 3,
      'final': 4
    }
    return order[stage] || 99
  }

  // Group matches by stage
  const matchesByStage = matches.reduce((acc, match) => {
    if (!acc[match.stage]) {
      acc[match.stage] = []
    }
    acc[match.stage].push(match)
    return acc
  }, {} as Record<string, KnockoutMatch[]>)

  // Sort stages
  const sortedStages = Object.keys(matchesByStage).sort((a, b) =>
    getStageOrder(a) - getStageOrder(b)
  )

  // Group leg 1 and leg 2 matches into ties (for 2-legged ties)
  const groupMatchesIntoTies = (stageMatches: KnockoutMatch[]) => {
    // For final, return as-is (single match)
    if (stageMatches[0]?.stage === 'final') {
      return stageMatches.map(m => [m])
    }

    // Group by home/away pair (assumes consistent ordering)
    const ties: KnockoutMatch[][] = []
    const processedIds = new Set<string>()

    stageMatches.forEach(match => {
      if (processedIds.has(match.id)) return

      const pairedMatch = stageMatches.find(m =>
        m.id !== match.id &&
        !processedIds.has(m.id) &&
        ((m.home_manager.id === match.away_manager.id && m.away_manager.id === match.home_manager.id) ||
         (m.home_manager.id === match.home_manager.id && m.away_manager.id === match.away_manager.id))
      )

      if (pairedMatch) {
        ties.push([match, pairedMatch].sort((a, b) => a.leg - b.leg))
        processedIds.add(match.id)
        processedIds.add(pairedMatch.id)
      } else {
        ties.push([match])
        processedIds.add(match.id)
      }
    })

    return ties
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-12 px-6">
        <div className="text-5xl mb-4">🏆</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Faza pucharowa</h3>
        <p className="text-gray-600">
          Faza pucharowa rozpocznie się po zakończeniu fazy grupowej.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {sortedStages.map((stage) => {
        const stageMatches = matchesByStage[stage]
        const ties = groupMatchesIntoTies(stageMatches)

        return (
          <div key={stage} className="bg-white border-2 border-amber-600 rounded-2xl overflow-hidden shadow-sm">
            {/* Stage Header */}
            <div className="bg-amber-600 py-4" style={{ paddingLeft: '24px', paddingRight: '24px' }}>
              <h3 className="text-lg font-bold text-white">{getStageLabel(stage)}</h3>
            </div>

            {/* Ties */}
            <div className="p-6 space-y-4">
              {ties.map((tie, index) => {
                const leg2Match = tie.find(m => m.leg === 2) || tie[0]
                const homeAggregate = leg2Match.home_aggregate_score ?? 0
                const awayAggregate = leg2Match.away_aggregate_score ?? 0
                const isDecided = leg2Match.winner_id && leg2Match.is_completed
                const winner = isDecided
                  ? (leg2Match.winner_id === leg2Match.home_manager.id
                      ? leg2Match.home_manager
                      : leg2Match.away_manager)
                  : null

                return (
                  <div key={index} className="border-2 border-amber-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <p className={`text-base ${winner?.id === tie[0].home_manager.id ? 'font-bold text-amber-900' : 'text-gray-700'}`}>
                          {getManagerDisplayName(tie[0].home_manager)}
                          {winner?.id === tie[0].home_manager.id && ' ✓'}
                        </p>
                      </div>
                      {tie.length > 1 && (
                        <div className="text-lg font-bold text-amber-900 px-4">
                          {homeAggregate} - {awayAggregate}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className={`text-base ${winner?.id === tie[0].away_manager.id ? 'font-bold text-amber-900' : 'text-gray-700'}`}>
                          {getManagerDisplayName(tie[0].away_manager)}
                          {winner?.id === tie[0].away_manager.id && ' ✓'}
                        </p>
                      </div>
                    </div>

                    {/* Show individual leg scores if 2-legged */}
                    {tie.length > 1 && (
                      <div className="mt-3 pt-3 border-t border-amber-100 text-sm text-gray-600 space-y-1">
                        {tie.map((match) => (
                          <div key={match.id} className="flex justify-between">
                            <span>Mecz {match.leg}:</span>
                            <span className="font-medium">
                              {match.home_aggregate_score ?? 0} - {match.away_aggregate_score ?? 0}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

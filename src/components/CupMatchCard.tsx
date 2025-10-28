import { Icon } from 'lucide-react'
import { soccerBall } from '@lucide/lab'

interface Player {
  id: string
  name: string
  surname: string
  position: string
  goals_scored?: number
}

interface Lineup {
  id: string
  manager_id: string
  cup_gameweek_id: string
  players: Player[]
  total_goals: number
}

interface Manager {
  id: string
  first_name?: string
  last_name?: string
  email: string
}

interface CupMatch {
  id: string
  stage: string
  leg: number
  group_name?: string
  home_score?: number
  away_score?: number
  home_aggregate_score?: number
  away_aggregate_score?: number
  is_completed: boolean
  home_manager: Manager
  away_manager: Manager
  home_lineup?: Lineup
  away_lineup?: Lineup
}

interface CupMatchCardProps {
  match: CupMatch
}

export function CupMatchCard({ match }: CupMatchCardProps) {
  const getManagerDisplayName = (manager: Manager) => {
    if (manager?.first_name && manager?.last_name) {
      return `${manager.first_name} ${manager.last_name}`
    }
    if (manager?.first_name) {
      return manager.first_name
    }
    return manager?.email || 'Unknown Manager'
  }

  const getStageLabel = (stage: string) => {
    const stageLabels: Record<string, string> = {
      'group_stage': 'Faza Grupowa',
      'round_of_16': '1/8 finału',
      'quarter_final': 'Ćwierćfinał',
      'semi_final': 'Półfinał',
      'final': 'Finał'
    }
    return stageLabels[stage] || stage
  }

  const homeGoals = match.home_lineup?.total_goals || 0
  const awayGoals = match.away_lineup?.total_goals || 0
  const homePlayers = match.home_lineup?.players || []
  const awayPlayers = match.away_lineup?.players || []

  const showAggregate = match.stage !== 'group_stage' && match.stage !== 'final' && match.leg === 2

  return (
    <div className="bg-white border-2 border-amber-600 rounded-2xl hover:shadow-lg transition-shadow duration-200" style={{ padding: '20px' }}>
      {/* Stage Badge */}
      <div className="mb-3 flex items-center justify-between">
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
          {getStageLabel(match.stage)}
          {match.group_name && ` - ${match.group_name}`}
          {match.stage !== 'group_stage' && match.stage !== 'final' && ` - Mecz ${match.leg}`}
        </div>
      </div>

      {/* Match Score Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1" style={{ paddingRight: '24px' }}>
          <p className="text-lg font-semibold text-amber-800">
            {getManagerDisplayName(match.home_manager)}
          </p>
        </div>
        <div className="flex items-center gap-4 px-8">
          <span className="text-3xl font-bold text-amber-900">{homeGoals}</span>
          <span className="text-2xl font-medium text-gray-400">-</span>
          <span className="text-3xl font-bold text-amber-900">{awayGoals}</span>
        </div>
        <div className="flex-1 text-right" style={{ paddingLeft: '24px' }}>
          <p className="text-lg font-semibold text-amber-800">
            {getManagerDisplayName(match.away_manager)}
          </p>
        </div>
      </div>

      {/* Aggregate Score (for knockout rounds, leg 2) */}
      {showAggregate && (
        <div className="flex items-center justify-center mb-3 text-sm text-gray-600">
          <span>
            Łącznie: {match.home_aggregate_score || 0} - {match.away_aggregate_score || 0}
          </span>
        </div>
      )}

      {/* Player Details */}
      <div className="flex items-start justify-between pt-3 border-t-2 border-amber-200">
        {/* Home Team Players */}
        <div className="flex-1 space-y-1" style={{ paddingRight: '32px' }}>
          {homePlayers.length > 0 ? (
            homePlayers.map((player) => {
              const goals = player.goals_scored || 0
              return (
                <div key={player.id} className="flex items-baseline gap-2 h-[20px]">
                  <p className={`text-sm leading-5 ${goals > 0 ? 'font-bold text-amber-900' : 'text-gray-600'}`}>
                    {player.name} {player.surname}
                  </p>
                  {goals > 0 && (
                    <div className="flex items-center gap-1">
                      {Array.from({ length: goals }).map((_, i) => (
                        <Icon key={i} iconNode={soccerBall} size={12} className="text-amber-900" strokeWidth={2} />
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <div className="flex items-baseline gap-2 h-[20px]">
              <p className="text-sm text-gray-400 italic leading-5">Nie ustawiono składu</p>
            </div>
          )}
        </div>

        {/* Away Team Players */}
        <div className="flex-1 text-right space-y-1" style={{ paddingLeft: '32px' }}>
          {awayPlayers.length > 0 ? (
            awayPlayers.map((player) => {
              const goals = player.goals_scored || 0
              return (
                <div key={player.id} className="flex items-baseline justify-end gap-2 h-[20px]">
                  {goals > 0 && (
                    <div className="flex items-center gap-1">
                      {Array.from({ length: goals }).map((_, i) => (
                        <Icon key={i} iconNode={soccerBall} size={12} className="text-amber-900" strokeWidth={2} />
                      ))}
                    </div>
                  )}
                  <p className={`text-sm leading-5 ${goals > 0 ? 'font-bold text-amber-900' : 'text-gray-600'}`}>
                    {player.name} {player.surname}
                  </p>
                </div>
              )
            })
          ) : (
            <div className="flex items-baseline justify-end gap-2 h-[20px]">
              <p className="text-sm text-gray-400 italic leading-5">Nie ustawiono składu</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

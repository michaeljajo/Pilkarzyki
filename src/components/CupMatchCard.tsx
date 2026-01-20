import { Icon } from 'lucide-react'
import { soccerBall } from '@lucide/lab'
import { getTeamOrManagerName } from '@/utils/team-name-resolver'
import { formatPlaceholder } from '@/utils/placeholder-formatter'

interface Player {
  id: string
  name: string
  surname: string
  position: string
  goals_scored?: number
  has_played?: boolean
}

interface Lineup {
  id: string
  manager_id: string
  cup_gameweek_id: string
  players: Player[]
  total_goals: number
  is_from_default?: boolean
}

interface Manager {
  id: string
  first_name?: string
  last_name?: string
  email: string
  squad?: {
    team_name?: string
  }
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
  home_manager?: Manager | null
  away_manager?: Manager | null
  home_team_source?: string
  away_team_source?: string
  home_lineup?: Lineup
  away_lineup?: Lineup
}

interface CupMatchCardProps {
  match: CupMatch
}

export function CupMatchCard({ match }: CupMatchCardProps) {
  const getManagerDisplayName = (manager: Manager | null | undefined, teamSource?: string) => {
    // If manager is null/undefined, show placeholder or TBD
    if (!manager) {
      if (teamSource) {
        // Format the placeholder for display
        const formatted = formatPlaceholder(teamSource)
        return formatted.short
      }
      return 'TBD'
    }

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
      'group_stage': 'Faza Grupowa',
      'round_of_16': '1/8 finału',
      'quarter_final': 'Ćwierćfinał',
      'semi_final': 'Półfinał',
      'final': 'Finał'
    }
    return stageLabels[stage] || stage
  }

  const homeGoals = match.home_score || 0
  const awayGoals = match.away_score || 0
  const homePlayers = match.home_lineup?.players || []
  const awayPlayers = match.away_lineup?.players || []

  // Check if all players have played for each manager
  const allHomePlayersPlayed = homePlayers.length > 0 && homePlayers.every(p => p.has_played === true)
  const allAwayPlayersPlayed = awayPlayers.length > 0 && awayPlayers.every(p => p.has_played === true)

  // Get name colors: navy if all played, green if some haven't
  const homeNameColor = allHomePlayersPlayed ? 'text-[#061852]' : 'text-[#2E7D32]'
  const awayNameColor = allAwayPlayersPlayed ? 'text-[#061852]' : 'text-[#2E7D32]'

  const showAggregate = match.stage !== 'group_stage' && match.stage !== 'final' && match.leg === 2

  return (
    <div className="bg-white border-2 border-[#29544D] rounded-2xl hover:shadow-lg transition-shadow duration-200" style={{ padding: '20px' }}>
      {/* Stage Badge */}
      <div className="mb-3 flex items-center justify-between">
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#DECF99] text-[#29544D] text-xs font-semibold">
          {getStageLabel(match.stage)}
          {match.group_name && ` - ${match.group_name}`}
          {match.stage !== 'group_stage' && match.stage !== 'final' && ` - Mecz ${match.leg}`}
        </div>
      </div>

      {/* Match Score Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1 pr-2 sm:pr-4 md:pr-6">
          <p className={`text-sm sm:text-base md:text-lg font-semibold ${homeNameColor}`}>
            {getManagerDisplayName(match.home_manager, match.home_team_source)}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 px-2 sm:px-4 md:px-8">
          <span className="text-2xl sm:text-3xl font-bold text-[#061852]">{homeGoals}</span>
          <span className="text-xl sm:text-2xl font-medium text-gray-400">-</span>
          <span className="text-2xl sm:text-3xl font-bold text-[#061852]">{awayGoals}</span>
        </div>
        <div className="flex-1 text-right pl-2 sm:pl-4 md:pl-6">
          <p className={`text-sm sm:text-base md:text-lg font-semibold ${awayNameColor}`}>
            {getManagerDisplayName(match.away_manager, match.away_team_source)}
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
      <div className="flex items-start justify-between pt-3 border-t-2 border-[#DECF99]">
        {/* Home Team Players */}
        <div className="flex-1 space-y-1 pr-2 sm:pr-4 md:pr-8">
          {homePlayers.length > 0 ? (
            homePlayers.map((player) => {
              const goals = player.goals_scored || 0
              const hasPlayed = player.has_played || false
              const isOwnGoal = goals === -1
              const isFromDefault = match.home_lineup?.is_from_default || false
              return (
                <div key={player.id} className="flex items-baseline gap-2 h-[20px]">
                  <p className={`text-xs sm:text-sm leading-5 truncate ${
                    isOwnGoal ? 'font-bold text-red-600' :
                    hasPlayed && goals > 0 ? 'font-bold text-[#061852]' :
                    hasPlayed && goals === 0 ? 'italic text-gray-600' :
                    'text-gray-600'
                  } ${isFromDefault ? 'underline' : ''}`}>
                    {player.name} {player.surname}
                    {isOwnGoal && <span className="ml-1">(OG)</span>}
                  </p>
                  {goals > 0 && (
                    <div className="flex items-center gap-1 shrink-0">
                      {Array.from({ length: goals }).map((_, i) => (
                        <Icon key={i} iconNode={soccerBall} size={12} className="text-[#061852]" strokeWidth={2} />
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <div className="flex items-baseline gap-2 h-[20px]">
              <p className="text-xs sm:text-sm text-gray-400 italic leading-5">Nie ustawiono składu</p>
            </div>
          )}
        </div>

        {/* Away Team Players */}
        <div className="flex-1 text-right space-y-1 pl-2 sm:pl-4 md:pl-8">
          {awayPlayers.length > 0 ? (
            awayPlayers.map((player) => {
              const goals = player.goals_scored || 0
              const hasPlayed = player.has_played || false
              const isOwnGoal = goals === -1
              const isFromDefault = match.away_lineup?.is_from_default || false
              return (
                <div key={player.id} className="flex items-baseline justify-end gap-2 h-[20px]">
                  {goals > 0 && (
                    <div className="flex items-center gap-1 shrink-0">
                      {Array.from({ length: goals }).map((_, i) => (
                        <Icon key={i} iconNode={soccerBall} size={12} className="text-[#061852]" strokeWidth={2} />
                      ))}
                    </div>
                  )}
                  <p className={`text-xs sm:text-sm leading-5 truncate ${
                    isOwnGoal ? 'font-bold text-red-600' :
                    hasPlayed && goals > 0 ? 'font-bold text-[#061852]' :
                    hasPlayed && goals === 0 ? 'italic text-gray-600' :
                    'text-gray-600'
                  } ${isFromDefault ? 'underline' : ''}`}>
                    {player.name} {player.surname}
                    {isOwnGoal && <span className="ml-1">(OG)</span>}
                  </p>
                </div>
              )
            })
          ) : (
            <div className="flex items-baseline justify-end gap-2 h-[20px]">
              <p className="text-xs sm:text-sm text-gray-400 italic leading-5">Nie ustawiono składu</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

import { getTeamOrManagerName } from '@/utils/team-name-resolver'
import { formatPlaceholder } from '@/utils/placeholder-formatter'

interface Manager {
  id: string
  first_name?: string
  last_name?: string
  email: string
  squad?: {
    team_name?: string
  }
}

interface ScheduleMatchCardProps {
  match: {
    id: string
    type: 'league' | 'cup'
    gameweekNumber: number
    startDate: string
    endDate: string
    lockDate: string
    isCompleted: boolean
    homeManager: Manager | null
    awayManager: Manager | null
    homeTeamSource?: string
    awayTeamSource?: string
    homeScore?: number
    awayScore?: number
    stage?: string
    leg?: number
    groupName?: string
  }
}

export function ScheduleMatchCard({ match }: ScheduleMatchCardProps) {
  const getManagerDisplayName = (manager: Manager | null, teamSource?: string) => {
    if (!manager) {
      if (teamSource) {
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

  const getStageLabel = (stage?: string) => {
    if (!stage) return ''
    const stageLabels: Record<string, string> = {
      'group_stage': 'Faza Grupowa',
      'round_of_16': '1/8 finału',
      'quarter_final': 'Ćwierćfinał',
      'semi_final': 'Półfinał',
      'final': 'Finał'
    }
    return stageLabels[stage] || stage
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('pl-PL', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    })
  }

  const formatDateRange = (startStr: string, endStr: string) => {
    const start = new Date(startStr)
    const end = new Date(endStr)

    const startDay = start.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })
    const endDay = end.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })

    return `${startDay} - ${endDay}`
  }

  const isUpcoming = !match.isCompleted && new Date(match.lockDate) > new Date()
  const isPast = match.isCompleted || new Date(match.endDate) < new Date()

  return (
    <div className={`bg-white border-2 rounded-2xl transition-all duration-200 ${
      isPast ? 'border-gray-300 opacity-75' : 'border-[#29544D] hover:shadow-lg'
    }`} style={{ padding: '16px' }}>
      {/* Header with badges */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Match Type Badge */}
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
            match.type === 'league'
              ? 'bg-[#061852] text-white'
              : 'bg-[#DECF99] text-[#29544D]'
          }`}>
            {match.type === 'league' ? 'Liga' : 'Puchar'}
          </span>

          {/* Gameweek Badge */}
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium whitespace-nowrap">
            Kolejka {match.gameweekNumber}
          </span>

          {/* Stage Badge for Cup */}
          {match.type === 'cup' && match.stage && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium whitespace-nowrap">
              {getStageLabel(match.stage)}
              {match.groupName && ` - ${match.groupName}`}
              {match.stage !== 'group_stage' && match.stage !== 'final' && match.leg && ` (Mecz ${match.leg})`}
            </span>
          )}

          {/* Completion Status */}
          {match.isCompleted && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium whitespace-nowrap">
              Zakończony
            </span>
          )}
        </div>

        {/* Date */}
        <div className="text-sm text-gray-600 whitespace-nowrap">
          {formatDateRange(match.startDate, match.endDate)}
        </div>
      </div>

      {/* Match Details */}
      <div className="flex items-center justify-between">
        {/* Home Team */}
        <div className="flex-1" style={{ paddingRight: '16px' }}>
          <p className={`text-base font-semibold ${
            isPast ? 'text-gray-700' : 'text-[#061852]'
          }`}>
            {getManagerDisplayName(match.homeManager, match.homeTeamSource)}
          </p>
        </div>

        {/* Score or VS */}
        <div className="flex items-center gap-3 px-6">
          {match.isCompleted && match.homeScore !== undefined && match.awayScore !== undefined ? (
            <>
              <span className="text-2xl font-bold text-[#061852]">{match.homeScore}</span>
              <span className="text-xl font-medium text-gray-400">-</span>
              <span className="text-2xl font-bold text-[#061852]">{match.awayScore}</span>
            </>
          ) : (
            <span className="text-lg font-medium text-gray-400">vs</span>
          )}
        </div>

        {/* Away Team */}
        <div className="flex-1 text-right" style={{ paddingLeft: '16px' }}>
          <p className={`text-base font-semibold ${
            isPast ? 'text-gray-700' : 'text-[#061852]'
          }`}>
            {getManagerDisplayName(match.awayManager, match.awayTeamSource)}
          </p>
        </div>
      </div>

      {/* Lock Date for Upcoming Matches */}
      {isUpcoming && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Deadline składu: {formatDate(match.lockDate)}
          </p>
        </div>
      )}
    </div>
  )
}

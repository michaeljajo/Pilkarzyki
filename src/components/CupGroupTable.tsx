interface Manager {
  id: string
  first_name?: string
  last_name?: string
  email: string
}

interface GroupStanding {
  id: string
  group_name: string
  manager_id: string
  played: number
  won: number
  drawn: number
  lost: number
  goals_for: number
  goals_against: number
  goal_difference: number
  points: number
  position: number
  qualified: boolean
  updated_at: string
  manager: Manager
}

interface Group {
  group_name: string
  standings: GroupStanding[]
}

interface CupGroupTableProps {
  groups: Group[]
}

export function CupGroupTable({ groups }: CupGroupTableProps) {
  const getManagerDisplayName = (manager: Manager) => {
    if (manager?.first_name && manager?.last_name) {
      return `${manager.first_name} ${manager.last_name}`
    }
    if (manager?.first_name) {
      return manager.first_name
    }
    return manager?.email || 'Unknown Manager'
  }

  const getRowBgColor = (standing: GroupStanding) => {
    if (standing.position === 1) return 'bg-amber-100/40' // Gold for 1st
    if (standing.position === 2 && standing.qualified) return 'bg-amber-50/40' // Light amber for 2nd (qualified)
    if (standing.position === 2) return 'bg-[#FAFAFA]' // Off-white for 2nd (not qualified)
    return 'bg-white'
  }

  if (groups.length === 0) {
    return (
      <div className="text-center py-12 px-6">
        <div className="text-5xl mb-4">🏆</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Brak danych grupowych</h3>
        <p className="text-gray-600">
          Faza grupowa jeszcze się nie rozpoczęła.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <div key={group.group_name} className="bg-white border-2 border-amber-600 rounded-2xl overflow-hidden shadow-sm">
          {/* Group Header */}
          <div className="bg-amber-600 py-4" style={{ paddingLeft: '24px', paddingRight: '24px' }}>
            <h3 className="text-lg font-bold text-white">{group.group_name}</h3>
          </div>

          {/* Table Content */}
          {group.standings.length === 0 ? (
            <div className="text-center py-8 px-6">
              <p className="text-gray-600">Brak danych dla tej grupy</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-amber-200">
                    <th className="text-left py-3 pr-6 text-xs font-semibold text-gray-500 uppercase tracking-wider w-16" style={{ paddingLeft: '24px' }}>#</th>
                    <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Menedżer</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">M</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">Z</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">R</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">P</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">B+</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">B-</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">B=</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">PKT</th>
                  </tr>
                </thead>
                <tbody>
                  {group.standings.map((standing) => (
                    <tr
                      key={standing.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150 ${getRowBgColor(standing)}`}
                    >
                      <td className="py-4 pr-6 text-left" style={{ paddingLeft: '24px' }}>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-900">{standing.position}</span>
                          {standing.qualified && (
                            <span className="text-green-600 text-xs font-semibold">✓</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-semibold text-gray-900">{getManagerDisplayName(standing.manager)}</span>
                      </td>
                      <td className="py-4 px-4 text-center text-gray-700">{standing.played}</td>
                      <td className="py-4 px-4 text-center text-gray-700">{standing.won}</td>
                      <td className="py-4 px-4 text-center text-gray-700">{standing.drawn}</td>
                      <td className="py-4 px-4 text-center text-gray-700">{standing.lost}</td>
                      <td className="py-4 px-4 text-center text-gray-700">{standing.goals_for}</td>
                      <td className="py-4 px-4 text-center text-gray-700">{standing.goals_against}</td>
                      <td className="py-4 px-4 text-center font-medium text-gray-900">
                        {standing.goal_difference > 0 ? '+' : ''}{standing.goal_difference}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="font-bold text-amber-900 text-base">{standing.points}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}

      {/* Legend */}
      <div className="text-center text-sm text-gray-600 mt-4">
        <p>✓ = Awansował do następnej fazy</p>
      </div>
    </div>
  )
}

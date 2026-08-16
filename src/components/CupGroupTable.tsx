'use client'

import { getTeamOrManagerName } from '@/utils/team-name-resolver'
import { ManualTiebreakerModal } from '@/components/admin/ManualTiebreakerModal'
import { useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'

interface Manager {
  id: string
  first_name?: string
  last_name?: string
  email: string
  squad?: { team_name?: string }
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
  manualTiebreaker?: number | null
}

interface Group {
  group_name: string
  standings: GroupStanding[]
}

interface CupGroupTableProps {
  groups: Group[]
  cupId?: string
  showAdminControls?: boolean
  /** Internal (Supabase) id of the signed-in manager; selects their group by default. */
  currentManagerId?: string | null
  onRefresh?: () => void
}

/**
 * Cup group standings. Deliberately a copy of LeagueTable's presentation — same
 * card chrome, same column widths, same sticky header, same row tiers — so the
 * two competitions read as one app. The only structural difference is the tab
 * strip: exactly one group is on screen at a time, never side by side or
 * stacked.
 */
export function CupGroupTable({
  groups,
  cupId,
  showAdminControls = false,
  currentManagerId,
  onRefresh,
}: CupGroupTableProps) {
  const [showTiebreakerModal, setShowTiebreakerModal] = useState(false)
  const [selectedGroupName, setSelectedGroupName] = useState<string | null>(null)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

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

  // The signed-in manager's own group, falling back to the first one. Derived
  // rather than pushed into state on mount: `groups` and `currentManagerId`
  // arrive from an async fetch, and an effect-synced default would flash the
  // wrong group before correcting itself.
  const defaultGroupName = useMemo(() => {
    if (currentManagerId) {
      const ownGroup = groups.find(group =>
        group.standings.some(standing => standing.manager_id === currentManagerId)
      )
      if (ownGroup) return ownGroup.group_name
    }
    return groups[0]?.group_name ?? ''
  }, [groups, currentManagerId])

  // An explicit click wins; otherwise show the default. Guarded against a stale
  // selection surviving a reload that renamed or dropped the group.
  const activeGroupName =
    selectedGroupName && groups.some(group => group.group_name === selectedGroupName)
      ? selectedGroupName
      : defaultGroupName

  const activeGroup = groups.find(group => group.group_name === activeGroupName)

  // Everyone shows as unqualified until standings have been recalculated at
  // least once. Tinting the whole table red in that state would be misleading,
  // so the elimination zone only paints once there is a cut line to show.
  const hasQualifiers = activeGroup?.standings.some(standing => standing.qualified) ?? false

  const getRowBgColor = (standing: GroupStanding) => {
    if (hasQualifiers && !standing.qualified) return 'bg-[#EF4444]/5' // Red for eliminated
    if (standing.position === 1) return 'bg-[#DECF99]/20' // Gold for 1st
    if (standing.position === 2) return 'bg-[#FAFAFA]' // Off-white for 2nd
    if (standing.position === 3) return 'bg-[#8B6F47]/10' // Brown for 3rd
    return 'bg-white'
  }

  // Arrow keys move between tabs, as expected of a tablist.
  const handleTabKeyDown = (event: React.KeyboardEvent, index: number) => {
    const offset = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (offset === 0) return
    event.preventDefault()
    const next = (index + offset + groups.length) % groups.length
    setSelectedGroupName(groups[next].group_name)
    tabRefs.current[next]?.focus()
  }

  if (groups.length === 0) {
    return (
      <div className="bg-white border-2 border-[#29544D] rounded-xl sm:rounded-2xl overflow-clip shadow-sm">
        <div className="text-center py-8 sm:py-12 px-2 sm:px-6">
          <div className="text-3xl sm:text-5xl mb-3 sm:mb-4">🏆</div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Brak danych grupowych</h3>
          <p className="text-sm sm:text-base text-gray-600">
            Faza grupowa jeszcze się nie rozpoczęła.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Group switcher — one group on screen at a time. */}
      <div role="tablist" aria-label="Grupy" className="mb-4 flex flex-wrap gap-2">
        {groups.map((group, index) => {
          const active = group.group_name === activeGroupName
          return (
            <button
              key={group.group_name}
              ref={(element) => { tabRefs.current[index] = element }}
              type="button"
              role="tab"
              id={`cup-group-tab-${group.group_name}`}
              aria-selected={active}
              aria-controls={`cup-group-panel-${group.group_name}`}
              tabIndex={active ? 0 : -1}
              onClick={() => setSelectedGroupName(group.group_name)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
              className={`min-h-[40px] rounded-full border-2 px-4 text-sm font-semibold transition-colors ${
                active
                  ? 'border-[#29544D] bg-[#29544D] text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-[#29544D]/40 hover:text-[#29544D]'
              }`}
            >
              Grupa {group.group_name}
            </button>
          )
        })}
      </div>

      {activeGroup && (
        <div
          role="tabpanel"
          id={`cup-group-panel-${activeGroup.group_name}`}
          aria-labelledby={`cup-group-tab-${activeGroup.group_name}`}
        >
          {/* `overflow: clip`, not `hidden` — see LeagueTable: `hidden` would make
              this a scroll container and trap the sticky header row inside it. */}
          <div className="bg-white border-2 border-[#29544D] rounded-xl sm:rounded-2xl overflow-clip shadow-sm">
            {/* Header bar exists only to hold the admin controls; the tab above
                already names the group. */}
            {showAdminControls && cupId ? (
              <div className="bg-[#29544D] py-3 sm:py-4 px-4 sm:px-6">
                <div className="flex items-center justify-end">
                  <Button
                    onClick={() => setShowTiebreakerModal(true)}
                    variant="secondary"
                    size="sm"
                    className="text-xs sm:text-sm"
                  >
                    Rozstrzyganie
                  </Button>
                </div>
              </div>
            ) : null}

            {activeGroup.standings.length === 0 ? (
              <div className="text-center py-8 sm:py-12 px-2 sm:px-6">
                <div className="text-3xl sm:text-5xl mb-3 sm:mb-4">⚽</div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Brak rozegranych meczów</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Rozegraj mecze, aby zobaczyć tabelę grupy!
                </p>
              </div>
            ) : (
              // Horizontal scrolling below md (10 columns do not fit a phone),
              // plain overflow from md up so the header row can stick.
              <div className="overflow-x-auto md:overflow-visible">
                <table className="w-full">
                  {/* The border sits on each th, not the tr — a sticky row's own
                      border does not paint reliably. */}
                  <thead>
                    <tr>
                      <th className="text-center py-2 sm:py-3 px-1 sm:px-6 md:sticky md:top-[var(--app-header-h,118px)] z-10 bg-white border-b-2 border-[#DECF99] text-xs font-semibold text-gray-500 uppercase tracking-wider w-12 sm:w-20">#</th>
                      <th className="text-left py-2 sm:py-3 px-1 sm:px-4 md:sticky md:top-[var(--app-header-h,118px)] z-10 bg-white border-b-2 border-[#DECF99] text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[120px] sm:min-w-[180px]">Menedżer</th>
                      <th className="text-center py-2 sm:py-3 px-0.5 sm:px-4 md:sticky md:top-[var(--app-header-h,118px)] z-10 bg-white border-b-2 border-[#DECF99] text-xs font-semibold text-gray-500 uppercase tracking-wider w-9 sm:w-20">M</th>
                      <th className="text-center py-2 sm:py-3 px-0.5 sm:px-4 md:sticky md:top-[var(--app-header-h,118px)] z-10 bg-white border-b-2 border-[#DECF99] text-xs font-semibold text-gray-500 uppercase tracking-wider w-9 sm:w-20">Z</th>
                      <th className="text-center py-2 sm:py-3 px-0.5 sm:px-4 md:sticky md:top-[var(--app-header-h,118px)] z-10 bg-white border-b-2 border-[#DECF99] text-xs font-semibold text-gray-500 uppercase tracking-wider w-9 sm:w-20">R</th>
                      <th className="text-center py-2 sm:py-3 px-0.5 sm:px-4 md:sticky md:top-[var(--app-header-h,118px)] z-10 bg-white border-b-2 border-[#DECF99] text-xs font-semibold text-gray-500 uppercase tracking-wider w-9 sm:w-20">P</th>
                      <th className="text-center py-2 sm:py-3 px-0.5 sm:px-4 md:sticky md:top-[var(--app-header-h,118px)] z-10 bg-white border-b-2 border-[#DECF99] text-xs font-semibold text-gray-500 uppercase tracking-wider w-10 sm:w-24">B+</th>
                      <th className="text-center py-2 sm:py-3 px-0.5 sm:px-4 md:sticky md:top-[var(--app-header-h,118px)] z-10 bg-white border-b-2 border-[#DECF99] text-xs font-semibold text-gray-500 uppercase tracking-wider w-10 sm:w-24">B-</th>
                      <th className="text-center py-2 sm:py-3 px-0.5 sm:px-4 md:sticky md:top-[var(--app-header-h,118px)] z-10 bg-white border-b-2 border-[#DECF99] text-xs font-semibold text-gray-500 uppercase tracking-wider w-10 sm:w-24">B=</th>
                      <th className="text-center py-2 sm:py-3 px-0.5 sm:px-4 md:sticky md:top-[var(--app-header-h,118px)] z-10 bg-white border-b-2 border-[#DECF99] text-xs font-semibold text-gray-500 uppercase tracking-wider w-12 sm:w-24">PKT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeGroup.standings.map((standing) => (
                      <tr
                        key={standing.id}
                        className={`border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150 ${getRowBgColor(standing)}`}
                      >
                        <td className="py-3 sm:py-4 px-1 sm:px-6">
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-xs sm:text-sm font-bold text-gray-900">{standing.position}</span>
                            {standing.qualified && (
                              <span className="text-green-600 text-[10px] sm:text-xs font-semibold" title="Awans">✓</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 sm:py-4 px-1 sm:px-4 min-w-[120px] sm:min-w-[180px]">
                          {/* Names stay on one line; the wrapper scrolls instead. */}
                          <span className="text-xs sm:text-base font-semibold text-gray-900 whitespace-nowrap">{getManagerDisplayName(standing.manager)}</span>
                        </td>
                        <td className="py-3 sm:py-4 px-0.5 sm:px-4 text-center text-xs sm:text-sm text-gray-700">{standing.played}</td>
                        <td className="py-3 sm:py-4 px-0.5 sm:px-4 text-center text-xs sm:text-sm text-gray-700">{standing.won}</td>
                        <td className="py-3 sm:py-4 px-0.5 sm:px-4 text-center text-xs sm:text-sm text-gray-700">{standing.drawn}</td>
                        <td className="py-3 sm:py-4 px-0.5 sm:px-4 text-center text-xs sm:text-sm text-gray-700">{standing.lost}</td>
                        <td className="py-3 sm:py-4 px-0.5 sm:px-4 text-center text-xs sm:text-sm text-gray-700">{standing.goals_for}</td>
                        <td className="py-3 sm:py-4 px-0.5 sm:px-4 text-center text-xs sm:text-sm text-gray-700">{standing.goals_against}</td>
                        <td className="py-3 sm:py-4 px-0.5 sm:px-4 text-center text-xs sm:text-sm font-medium text-gray-900">
                          {standing.goal_difference > 0 ? '+' : ''}{standing.goal_difference}
                        </td>
                        <td className="py-3 sm:py-4 px-0.5 sm:px-4 text-center">
                          <span className="font-bold text-[#061852] text-sm sm:text-base">{standing.points}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {hasQualifiers && (
            <p className="text-center text-sm text-gray-600 mt-4">✓ = Awansował do następnej fazy</p>
          )}
        </div>
      )}

      {/* Manual Tiebreaker Modal */}
      {showAdminControls && cupId && activeGroup && (
        <ManualTiebreakerModal
          isOpen={showTiebreakerModal}
          onClose={() => setShowTiebreakerModal(false)}
          standings={activeGroup.standings.map(s => ({
            managerId: s.manager_id,
            managerName: getManagerDisplayName(s.manager),
            teamName: s.manager.squad?.team_name,
            points: s.points,
            goalsFor: s.goals_for,
            goalsAgainst: s.goals_against,
            manualTiebreaker: s.manualTiebreaker
          }))}
          competitionId={cupId}
          competitionType="cup"
          onSave={() => {
            if (onRefresh) {
              onRefresh()
            }
          }}
        />
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { LeagueNavigation } from '@/components/LeagueNavigation'
import { ScheduleMatchCard } from '@/components/ScheduleMatchCard'

interface Manager {
  id: string
  first_name?: string
  last_name?: string
  email: string
  squad?: {
    team_name?: string
  }
}

interface ScheduleMatch {
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

interface SchedulePageProps {
  params: Promise<{ id: string }>
}

export default function SchedulePage({ params }: SchedulePageProps) {
  const { user } = useUser()
  const router = useRouter()
  const [leagueId, setLeagueId] = useState<string>('')
  const [leagueName, setLeagueName] = useState<string>('')
  const [matches, setMatches] = useState<ScheduleMatch[]>([])
  const [managers, setManagers] = useState<Manager[]>([])
  const [selectedManager, setSelectedManager] = useState<string>('')
  const [hidePastGameweeks, setHidePastGameweeks] = useState(false)
  const [loading, setLoading] = useState(true)
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function resolveParams() {
      const resolvedParams = await params
      setLeagueId(resolvedParams.id)

      // Fetch league name
      try {
        const response = await fetch(`/api/manager/leagues/${resolvedParams.id}`)
        if (response.ok) {
          const data = await response.json()
          setLeagueName(data.league?.name || 'League')
        }
      } catch (error) {
        console.error('Failed to fetch league name:', error)
      }
    }
    resolveParams()
  }, [params])

  useEffect(() => {
    if (leagueId) {
      fetchSchedule()
    }
  }, [leagueId, selectedManager])

  useEffect(() => {
    if (!user) {
      router.push('/sign-in')
    }
  }, [user, router])

  const fetchSchedule = async () => {
    try {
      setLoading(true)
      const url = selectedManager
        ? `/api/leagues/${leagueId}/combined-schedule?managerId=${selectedManager}`
        : `/api/leagues/${leagueId}/combined-schedule`

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setMatches(data.matches || [])
        setManagers(data.managers || [])
      } else {
        console.error('Failed to fetch schedule')
      }
    } catch (error) {
      console.error('Failed to fetch schedule:', error)
    } finally {
      setLoading(false)
    }
  }

  const getManagerDisplayName = (manager: Manager) => {
    if (manager.squad?.team_name) {
      return manager.squad.team_name
    }
    if (manager.first_name && manager.last_name) {
      return `${manager.first_name} ${manager.last_name}`
    }
    return manager.email.split('@')[0]
  }

  const toggleDate = (dateKey: string) => {
    setExpandedDates(prev => {
      const newSet = new Set(prev)
      if (newSet.has(dateKey)) {
        newSet.delete(dateKey)
      } else {
        newSet.add(dateKey)
      }
      return newSet
    })
  }

  // Group matches by date
  const groupedMatches = matches.reduce((groups, match) => {
    const dateKey = new Date(match.startDate).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    if (!groups[dateKey]) {
      groups[dateKey] = {
        matches: [],
        startDate: match.startDate
      }
    }

    groups[dateKey].matches.push(match)
    return groups
  }, {} as Record<string, { matches: ScheduleMatch[], startDate: string }>)

  // Filter out past gameweeks if checkbox is checked
  const filteredGroups = Object.entries(groupedMatches).filter(([dateKey, group]) => {
    if (!hidePastGameweeks) return true

    const endDate = new Date(group.matches[0]?.endDate)
    return endDate >= new Date()
  })

  // Sort by date
  const sortedGroups = filteredGroups.sort((a, b) => {
    return new Date(a[1].startDate).getTime() - new Date(b[1].startDate).getTime()
  })

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-white">
      <LeagueNavigation
        leagueId={leagueId}
        leagueName={leagueName}
        currentPage="schedule"
      />

      <main className="w-full flex justify-center" style={{ paddingTop: '48px', paddingBottom: '64px' }}>
        <div className="w-full max-w-4xl px-6">
          {/* Header */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900">Terminarz</h1>
          </div>

          {/* Filters */}
          <div className="mb-6 space-y-4">
            {/* Manager Filter */}
            <div className="flex justify-center">
              <select
                value={selectedManager}
                onChange={(e) => setSelectedManager(e.target.value)}
                className="w-full max-w-md px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300 bg-white"
                disabled={loading}
              >
                <option value="">Wszyscy managerowie</option>
                {managers
                  .sort((a, b) => getManagerDisplayName(a).localeCompare(getManagerDisplayName(b)))
                  .map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {getManagerDisplayName(manager)}
                    </option>
                  ))}
              </select>
            </div>

            {/* Hide Past Gameweeks Checkbox */}
            <div className="flex justify-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hidePastGameweeks}
                  onChange={(e) => setHidePastGameweeks(e.target.checked)}
                  className="w-4 h-4 text-[#061852] border-gray-300 rounded focus:ring-[#061852] focus:ring-2"
                />
                <span className="text-sm text-gray-700">Ukryj przeszłe kolejki</span>
              </label>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Schedule */}
          {!loading && (
            <div className="space-y-8">
              {sortedGroups.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-gray-400">
                    <div className="text-3xl mb-2">📅</div>
                    <div className="text-sm">
                      {hidePastGameweeks
                        ? 'Brak nadchodzących meczów'
                        : 'Brak meczów w terminarzu'}
                    </div>
                  </div>
                </div>
              ) : (
                sortedGroups.map(([dateKey, group]) => {
                  const isExpanded = expandedDates.has(dateKey)
                  return (
                    <div key={dateKey}>
                      {/* Date Header - Clickable */}
                      <div
                        className="mb-4 cursor-pointer select-none"
                        onClick={() => toggleDate(dateKey)}
                      >
                        <h2 className="text-sm font-bold text-[#061852] border-b-2 border-[#DECF99] pb-2 flex items-center justify-between hover:text-[#29544D] transition-colors">
                          <span>{dateKey}</span>
                          <svg
                            className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </h2>
                      </div>

                      {/* Matches for this date - Collapsible */}
                      {isExpanded && (
                        <div className="space-y-4">
                          {group.matches
                            .sort((a, b) => {
                              // Sort by type (league first), then by gameweek number
                              if (a.type !== b.type) {
                                return a.type === 'league' ? -1 : 1
                              }
                              return a.gameweekNumber - b.gameweekNumber
                            })
                            .map((match) => (
                              <ScheduleMatchCard key={match.id} match={match} />
                            ))}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

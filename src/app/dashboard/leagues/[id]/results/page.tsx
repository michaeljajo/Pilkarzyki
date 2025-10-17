'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { LeagueNavigation } from '@/components/LeagueNavigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Icon } from 'lucide-react'
import { soccerBall } from '@lucide/lab'

interface League {
  id: string
  name: string
  season: string
}

interface Gameweek {
  id: string
  league_id: string
  week: number
  start_date: string
  end_date: string
  is_completed: boolean
  leagues?: League
}

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
  gameweek_id: string
  players: Player[]
  total_goals: number
  manager: {
    id: string
    first_name?: string
    last_name?: string
    email: string
  }
}

interface Match {
  id: string
  gameweek_id: string
  home_manager_id: string
  away_manager_id: string
  home_score?: number
  away_score?: number
  is_completed: boolean
  home_manager: {
    id: string
    first_name?: string
    last_name?: string
    email: string
  }
  away_manager: {
    id: string
    first_name?: string
    last_name?: string
    email: string
  }
  home_lineup?: Lineup
  away_lineup?: Lineup
}

interface GameweekMatchData {
  gameweek: Gameweek
  matches: Match[]
}

interface LeagueResultsPageProps {
  params: Promise<{ id: string }>
}

export default function LeagueResultsPage({ params }: LeagueResultsPageProps) {
  const { user } = useUser()
  const router = useRouter()
  const [leagueId, setLeagueId] = useState<string>('')
  const [leagueName, setLeagueName] = useState<string>('')
  const [gameweeks, setGameweeks] = useState<Gameweek[]>([])
  const [selectedGameweek, setSelectedGameweek] = useState<string>('')
  const [matchData, setMatchData] = useState<GameweekMatchData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingResults, setLoadingResults] = useState(false)

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
      fetchGameweeks()
    }
  }, [leagueId])

  useEffect(() => {
    if (selectedGameweek) {
      fetchMatchData()
    } else {
      setMatchData(null)
    }
  }, [selectedGameweek])

  useEffect(() => {
    if (!user) {
      router.push('/sign-in')
    }
  }, [user, router])

  const fetchGameweeks = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/gameweeks')
      if (response.ok) {
        const data = await response.json()
        // Filter gameweeks for this league
        const leagueGameweeks = data.gameweeks?.filter((gw: Gameweek) =>
          gw.leagues?.name === leagueName || gw.league_id === leagueId
        ) || []
        setGameweeks(leagueGameweeks)
      }
    } catch (error) {
      console.error('Failed to fetch gameweeks:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMatchData = async () => {
    if (!selectedGameweek) return

    try {
      setLoadingResults(true)
      const response = await fetch(`/api/gameweeks/${selectedGameweek}/matches-with-lineups`)
      if (response.ok) {
        const data = await response.json()
        setMatchData(data)
      } else {
        console.error('Failed to fetch match data')
        setMatchData(null)
      }
    } catch (error) {
      console.error('Failed to fetch match data:', error)
      setMatchData(null)
    } finally {
      setLoadingResults(false)
    }
  }

  const getManagerDisplayName = (manager: { first_name?: string; last_name?: string; email: string }) => {
    if (manager?.first_name && manager?.last_name) {
      return `${manager.first_name} ${manager.last_name}`
    }
    if (manager?.first_name) {
      return manager.first_name
    }
    return manager?.email || 'Unknown Manager'
  }

  const isUserManager = (managerId: string) => {
    // This would need to be enhanced to properly check if the current user is this manager
    return false // For now, just highlight differently
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-white">
      <LeagueNavigation
        leagueId={leagueId}
        leagueName={leagueName}
        currentPage="results"
      />

      <main className="w-full flex justify-center" style={{ paddingTop: '48px', paddingBottom: '64px' }}>
        <div className="w-full max-w-4xl px-6">
          {/* Header */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900">Wyniki</h1>
          </div>

          {/* Gameweek Selector */}
          <div className="mb-6 flex justify-center">
            <select
              value={selectedGameweek}
              onChange={(e) => setSelectedGameweek(e.target.value)}
              className="w-full max-w-md px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300 bg-white"
              disabled={loading}
            >
              <option value="">Wybierz kolejkę...</option>
              {gameweeks.map((gameweek) => (
                <option key={gameweek.id} value={gameweek.id}>
                  Kolejka {gameweek.week}{gameweek.is_completed ? ' (Final)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Loading */}
          {loadingResults && (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Match Results */}
          {selectedGameweek && matchData && !loadingResults && (
            <div>
              {/* Matches */}
              {matchData.matches.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-gray-400">
                    <div className="text-3xl mb-2">⚽</div>
                    <div className="text-sm">Brak meczów w tej kolejce</div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {matchData.matches.map((match) => {
                    const homeGoals = match.home_lineup?.total_goals || 0
                    const awayGoals = match.away_lineup?.total_goals || 0
                    const homePlayers = match.home_lineup?.players || []
                    const awayPlayers = match.away_lineup?.players || []

                    return (
                      <div key={match.id} className="bg-white border-2 border-[#29544D] rounded-2xl hover:shadow-lg transition-shadow duration-200" style={{ padding: '20px' }}>
                        {/* Match Score Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1" style={{ paddingRight: '24px' }}>
                            <p className="text-lg font-semibold text-[#29544D]">
                              {getManagerDisplayName(match.home_manager)}
                            </p>
                          </div>
                          <div className="flex items-center gap-4 px-8">
                            <span className="text-3xl font-bold text-[#061852]">{homeGoals}</span>
                            <span className="text-2xl font-medium text-gray-400">-</span>
                            <span className="text-3xl font-bold text-[#061852]">{awayGoals}</span>
                          </div>
                          <div className="flex-1 text-right" style={{ paddingLeft: '24px' }}>
                            <p className="text-lg font-semibold text-[#29544D]">
                              {getManagerDisplayName(match.away_manager)}
                            </p>
                          </div>
                        </div>

                        {/* Player Details */}
                        <div className="flex items-start justify-between pt-3 border-t-2 border-[#DECF99]">
                          {/* Home Team Players */}
                          <div className="flex-1 space-y-1" style={{ paddingRight: '32px' }}>
                            {homePlayers.length > 0 ? (
                              homePlayers.map((player) => {
                                const goals = player.goals_scored || 0
                                return (
                                  <div key={player.id} className="flex items-baseline gap-2 h-[20px]">
                                    <p className={`text-sm leading-5 ${goals > 0 ? 'font-bold text-[#061852]' : 'text-gray-600'}`}>
                                      {player.name} {player.surname}
                                    </p>
                                    {goals > 0 && (
                                      <div className="flex items-center gap-1">
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
                                          <Icon key={i} iconNode={soccerBall} size={12} className="text-[#061852]" strokeWidth={2} />
                                        ))}
                                      </div>
                                    )}
                                    <p className={`text-sm leading-5 ${goals > 0 ? 'font-bold text-[#061852]' : 'text-gray-600'}`}>
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
                  })}
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {!selectedGameweek && !loading && (
            <div className="text-center py-16">
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
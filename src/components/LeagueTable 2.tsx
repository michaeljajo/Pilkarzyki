'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface Standing {
  position: number
  managerId: string
  managerName: string
  email: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
}

interface League {
  id: string
  name: string
  season: string
}

interface LeagueTableProps {
  leagueId: string
  showAdminControls?: boolean
}

export default function LeagueTable({ leagueId, showAdminControls = false }: LeagueTableProps) {
  const [standings, setStandings] = useState<Standing[]>([])
  const [league, setLeague] = useState<League | null>(null)
  const [loading, setLoading] = useState(true)
  const [recalculating, setRecalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStandings = useCallback(async () => {
    try {
      setError(null)
      setLoading(true)

      const response = await fetch(`/api/leagues/${leagueId}/standings`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch standings`)
      }

      const data = await response.json()
      setStandings(data.standings || [])
      setLeague(data.league)

      // Clear any previous errors on successful fetch
      setError(null)
    } catch (err) {
      console.error('Error fetching standings:', err)
      setError(err instanceof Error ? err.message : 'Unable to load league standings. Please try again.')
      setStandings([]) // Clear standings on error
    } finally {
      setLoading(false)
    }
  }, [leagueId])

  const recalculateStandings = async () => {
    setRecalculating(true)
    setError(null)

    try {
      const response = await fetch(`/api/leagues/${leagueId}/standings`, {
        method: 'POST'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to recalculate standings`)
      }

      const data = await response.json()
      setStandings(data.standings || [])
      setLeague(data.league)

      // Show a brief success indicator
      setTimeout(() => {
        // You could add a success state here if needed
      }, 500)

    } catch (err) {
      console.error('Error recalculating standings:', err)
      setError(err instanceof Error ? err.message : 'Unable to recalculate standings. Please try again.')
    } finally {
      setRecalculating(false)
    }
  }

  useEffect(() => {
    fetchStandings()
  }, [leagueId, fetchStandings])

  const getPositionColor = (position: number) => {
    if (position === 1) return 'text-yellow-600 font-bold' // Gold for 1st
    if (position <= 3) return 'text-primary-teal font-semibold' // Teal for top 3
    if (position <= Math.ceil(standings.length / 2)) return 'text-navy-600' // Navy for upper half
    if (position >= standings.length - 2) return 'text-red-600' // Red for bottom 3
    return 'text-navy-900'
  }

  const getRowBgColor = (position: number) => {
    if (position === 1) return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-l-4 border-yellow-400' // Gold background for 1st
    if (position <= 3) return 'bg-gradient-to-r from-background-light to-teal-100 border-l-4 border-primary-teal' // Teal for top 3
    if (position >= standings.length - 2) return 'bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-400' // Red for bottom 3
    return 'bg-white hover:bg-background-light/50 border-l-4 border-transparent hover:border-teal-200'
  }

  const getPositionIcon = (position: number) => {
    if (position === 1) return '👑' // Crown for 1st
    if (position <= 3) return '🏆' // Trophy for top 3
    if (position >= standings.length - 2) return '⚠️' // Warning for bottom 3
    return '⚽' // Football for others
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>League Table</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>League Table</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="mb-4">
              <div className="text-red-500 text-4xl mb-3">⚠️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Standings</h3>
              <p className="text-red-600 mb-2">{error}</p>
              <p className="text-sm text-gray-500 mb-4">
                This usually means the standings need to be calculated. Try refreshing or contact your administrator.
              </p>
            </div>
            <div className="space-x-3">
              <Button onClick={fetchStandings} variant="secondary" size="sm" disabled={loading}>
                {loading ? 'Retrying...' : 'Retry'}
              </Button>
              {showAdminControls && (
                <Button onClick={recalculateStandings} size="sm" disabled={recalculating}>
                  {recalculating ? 'Calculating...' : 'Recalculate'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/90 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between border-b border-teal-100">
        <div>
          <CardTitle className="flex items-center gap-2 text-navy-900">
            <span>🏆</span>
            League Table
          </CardTitle>
          {league && (
            <p className="text-navy-600 text-sm mt-1">
              {league.name} • {league.season}
            </p>
          )}
        </div>
        {showAdminControls && (
          <Button
            onClick={recalculateStandings}
            loading={recalculating}
            disabled={recalculating}
            variant="secondary"
            size="sm"
          >
            {recalculating ? 'Recalculating...' : 'Recalculate'}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {standings.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">⚽</div>
            <h3 className="text-lg font-semibold text-navy-900 mb-2">No Matches Played Yet</h3>
            <p className="text-navy-600">
              Play some matches to see the league table and standings!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b-2 border-teal-200 bg-gradient-to-r from-background-light to-navy-50">
                  <th className="text-center py-3 px-3 font-bold text-navy-800 w-12">#</th>
                  <th className="text-left py-3 px-3 font-bold text-navy-800">
                    <span className="flex items-center gap-1">
                      👤 Manager
                    </span>
                  </th>
                  <th className="text-center py-3 px-2 font-bold text-navy-800 w-12" title="Played">P</th>
                  <th className="text-center py-3 px-2 font-bold text-navy-800 w-12" title="Won">W</th>
                  <th className="text-center py-3 px-2 font-bold text-navy-800 w-12" title="Drawn">D</th>
                  <th className="text-center py-3 px-2 font-bold text-navy-800 w-12" title="Lost">L</th>
                  <th className="text-center py-3 px-2 font-bold text-navy-800 w-16" title="Goals For">
                    <span className="flex items-center justify-center gap-1">
                      ⚽ GF
                    </span>
                  </th>
                  <th className="text-center py-3 px-2 font-bold text-navy-800 w-16" title="Goals Against">GA</th>
                  <th className="text-center py-3 px-2 font-bold text-navy-800 w-16" title="Goal Difference">GD</th>
                  <th className="text-center py-3 px-2 font-bold text-navy-800 w-20" title="Points">
                    <span className="flex items-center justify-center gap-1">
                      🏆 Pts
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {standings.map((standing) => (
                  <tr
                    key={standing.managerId}
                    className={`border-b border-gray-100/50 transition-all duration-200 ${getRowBgColor(standing.position)}`}
                  >
                    <td className={`py-4 px-3 text-center ${getPositionColor(standing.position)}`}>
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-sm">{getPositionIcon(standing.position)}</span>
                        <span className="font-bold">{standing.position}</span>
                      </div>
                    </td>
                    <td className="py-4 px-3">
                      <div>
                        <div className="font-semibold text-navy-900 flex items-center gap-2">
                          <span className="text-lg">👤</span>
                          {standing.managerName}
                        </div>
                        <div className="text-sm text-navy-600">
                          {standing.email}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-2 text-center text-navy-700 font-medium">{standing.played}</td>
                    <td className="py-4 px-2 text-center text-green-600 font-semibold">{standing.won}</td>
                    <td className="py-4 px-2 text-center text-yellow-600 font-medium">{standing.drawn}</td>
                    <td className="py-4 px-2 text-center text-red-600 font-medium">{standing.lost}</td>
                    <td className="py-4 px-2 text-center text-navy-700 font-medium">{standing.goalsFor}</td>
                    <td className="py-4 px-2 text-center text-navy-700 font-medium">{standing.goalsAgainst}</td>
                    <td className={`py-4 px-2 text-center font-bold ${
                      standing.goalDifference > 0 ? 'text-green-600' :
                      standing.goalDifference < 0 ? 'text-red-600' : 'text-navy-700'
                    }`}>
                      {standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}
                    </td>
                    <td className="py-4 px-2 text-center font-bold text-xl text-navy-900">
                      <div className="flex items-center justify-center gap-1">
                        {standing.points}
                        <span className="text-sm">pts</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Legend */}
            <div className="mt-6 p-4 bg-gradient-to-r from-background-light to-navy-50 rounded-xl border border-teal-200">
              <h4 className="font-semibold text-navy-900 mb-3 flex items-center gap-2">
                <span>🏆</span>
                League Position Guide
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-gradient-to-r from-yellow-100 to-yellow-200 border-l-4 border-yellow-400 rounded"></div>
                  <div>
                    <span className="font-semibold text-yellow-600">👑 Champion</span>
                    <div className="text-xs text-navy-600">First place glory</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-gradient-to-r from-background-light to-teal-100 border-l-4 border-primary-teal rounded"></div>
                  <div>
                    <span className="font-semibold text-primary-teal">🏆 Top 3</span>
                    <div className="text-xs text-navy-600">Elite positions</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-400 rounded"></div>
                  <div>
                    <span className="font-semibold text-red-600">⚠️ Bottom 3</span>
                    <div className="text-xs text-navy-600">Relegation zone</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tiebreaker Rules */}
            <div className="mt-4 p-4 bg-white/50 rounded-xl border border-gray-200">
              <h4 className="font-semibold text-navy-900 mb-2 flex items-center gap-2">
                <span>⚖️</span>
                Tiebreaker Rules
              </h4>
              <p className="text-sm text-navy-600">
                <span className="font-medium">1.</span> Points →
                <span className="font-medium"> 2.</span> Goal Difference →
                <span className="font-medium"> 3.</span> Goals Scored →
                <span className="font-medium"> 4.</span> Head-to-Head Record
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
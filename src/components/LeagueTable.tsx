'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { getTeamOrManagerName } from '@/utils/team-name-resolver'

interface Standing {
  position: number
  managerId: string
  managerName: string
  teamName?: string | null
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

  const getDisplayName = (standing: Standing) => {
    // API already returns teamName if available, otherwise falls back to managerName
    // But we use getTeamOrManagerName for consistency
    if (standing.teamName) {
      return standing.teamName
    }
    return standing.managerName || standing.email || 'Unknown'
  }

  const fetchStandings = useCallback(async () => {
    try {
      setError(null)
      setLoading(true)

      const response = await fetch(`/api/leagues/${leagueId}/standings`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: Nie udało się pobrać tabeli`)
      }

      const data = await response.json()
      setStandings(data.standings || [])
      setLeague(data.league)

      // Clear any previous errors on successful fetch
      setError(null)
    } catch (err) {
      console.error('Error fetching standings:', err)
      setError(err instanceof Error ? err.message : 'Nie udało się załadować tabeli ligi. Spróbuj ponownie.')
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
        throw new Error(errorData.error || `HTTP ${response.status}: Nie udało się przeliczyć tabeli`)
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
      setError(err instanceof Error ? err.message : 'Nie udało się przeliczyć tabeli. Spróbuj ponownie.')
    } finally {
      setRecalculating(false)
    }
  }

  useEffect(() => {
    fetchStandings()
  }, [leagueId, fetchStandings])

  const getRowBgColor = (position: number) => {
    if (position === 1) return 'bg-[#DECF99]/20' // Gold for 1st
    if (position === 2) return 'bg-[#FAFAFA]' // Off-white for 2nd
    if (position === 3) return 'bg-[#8B6F47]/10' // Brown for 3rd
    if (position >= standings.length - 1) return 'bg-[#EF4444]/5' // Red for bottom 2
    return 'bg-white'
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tabela</CardTitle>
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
          <CardTitle>Tabela</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="mb-4">
              <div className="text-red-500 text-4xl mb-3">⚠️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nie można załadować tabeli</h3>
              <p className="text-red-600 mb-2">{error}</p>
              <p className="text-sm text-gray-500 mb-4">
                Zazwyczaj oznacza to, że tabela musi zostać przeliczona. Spróbuj odświeżyć lub skontaktuj się z administratorem.
              </p>
            </div>
            <div className="space-x-3">
              <Button onClick={fetchStandings} variant="secondary" size="sm" disabled={loading}>
                {loading ? 'Ponawianie...' : 'Spróbuj ponownie'}
              </Button>
              {showAdminControls && (
                <Button onClick={recalculateStandings} size="sm" disabled={recalculating}>
                  {recalculating ? 'Przeliczanie...' : 'Przelicz'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="bg-white border-2 border-[#29544D] rounded-2xl overflow-hidden shadow-sm">
      {/* Table Header */}
      {showAdminControls ? (
        <div className="bg-[#29544D] py-4" style={{ paddingLeft: '24px', paddingRight: '24px' }}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Tabela</h3>
            <Button
              onClick={recalculateStandings}
              loading={recalculating}
              disabled={recalculating}
              variant="secondary"
              size="sm"
            >
              {recalculating ? 'Przeliczanie...' : 'Przelicz'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-[#29544D] py-4" style={{ paddingLeft: '24px', paddingRight: '24px' }}>
          <h3 className="text-lg font-bold text-white">Tabela</h3>
        </div>
      )}

      {/* Table Content */}
      {standings.length === 0 ? (
        <div className="text-center py-12 px-6">
          <div className="text-5xl mb-4">⚽</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Brak rozegranych meczów</h3>
          <p className="text-gray-600">
            Rozegraj mecze, aby zobaczyć tabelę ligową!
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-[#DECF99]">
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
              {standings.map((standing) => (
                <tr
                  key={standing.managerId}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150 ${getRowBgColor(standing.position)}`}
                >
                  <td className="py-4 pr-6 text-left" style={{ paddingLeft: '24px' }}>
                    <span className="text-sm font-bold text-gray-900">{standing.position}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-semibold text-gray-900">{getDisplayName(standing)}</span>
                  </td>
                  <td className="py-4 px-4 text-center text-gray-700">{standing.played}</td>
                  <td className="py-4 px-4 text-center text-gray-700">{standing.won}</td>
                  <td className="py-4 px-4 text-center text-gray-700">{standing.drawn}</td>
                  <td className="py-4 px-4 text-center text-gray-700">{standing.lost}</td>
                  <td className="py-4 px-4 text-center text-gray-700">{standing.goalsFor}</td>
                  <td className="py-4 px-4 text-center text-gray-700">{standing.goalsAgainst}</td>
                  <td className="py-4 px-4 text-center font-medium text-gray-900">
                    {standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="font-bold text-[#061852] text-base">{standing.points}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
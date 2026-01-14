'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

interface Player {
  id: string
  name: string
  surname: string
  position: string
  club: string
  manager?: {
    first_name: string
    last_name: string
  }
}

export default function LeaguePlayersPage() {
  const params = useParams()
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (params.id) {
      fetchPlayers()
    }
  }, [params.id])

  async function fetchPlayers() {
    try {
      setLoading(true)
      const response = await fetch(`/api/leagues/${params.id}/players`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch players')
      }

      setPlayers(data.players || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Zawodnicy Ligi</h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base lg:text-lg text-gray-600">
            Przeglądaj i zarządzaj zawodnikami w tej lidze
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button onClick={fetchPlayers} variant="secondary" size="lg" className="w-full sm:w-auto">
            Odśwież
          </Button>
          <Link href={`/dashboard/admin/leagues/${params.id}/players/draft`} className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full">Transfery</Button>
          </Link>
          <Link href={`/dashboard/admin/leagues/${params.id}/players/import`} className="w-full sm:w-auto">
            <Button size="lg" className="w-full">Importuj Zawodników</Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Zawodnicy ({players.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {players.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Brak zawodników w tej lidze</p>
              <Link href={`/dashboard/admin/leagues/${params.id}/players/import`}>
                <Button className="mt-4">Importuj Zawodników</Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block sm:hidden space-y-3">
                {players.map((player) => (
                  <div key={player.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="font-semibold text-base text-gray-900 mb-2">
                      {player.name} {player.surname}
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Klub:</span>
                        <span className="text-gray-900 font-medium">{player.club}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Pozycja:</span>
                        <span className="text-gray-900 font-medium">{player.position}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Menedżer:</span>
                        <span className="text-gray-900 font-medium">
                          {player.manager
                            ? `${player.manager.first_name} ${player.manager.last_name}`
                            : 'Nieprzypisany'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <div className="inline-block min-w-full align-middle">
                  <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Nazwisko
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Klub
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Pozycja
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Menedżer
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {players.map((player) => (
                          <tr key={player.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {player.name} {player.surname}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {player.club}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {player.position}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {player.manager
                                ? `${player.manager.first_name} ${player.manager.last_name}`
                                : 'Nieprzypisany'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface Result {
  id: string
  player_name: string
  goals: number
  gameweek_week: number
  manager_name: string
}

export default function LeagueResultsPage() {
  const params = useParams()
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (params.id) {
      fetchResults()
    }
  }, [params.id])

  async function fetchResults() {
    try {
      setLoading(true)
      const response = await fetch(`/api/leagues/${params.id}/results`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch results')
      }

      setResults(data.results || [])
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

  // Group results by gameweek
  const resultsByGameweek = results.reduce((acc, result) => {
    const gw = result.gameweek_week
    if (!acc[gw]) acc[gw] = []
    acc[gw].push(result)
    return acc
  }, {} as Record<number, Result[]>)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wyniki Ligi</h1>
          <p className="mt-1 text-gray-600">
            Zobacz i zarządzaj wynikami meczów tej ligi
          </p>
        </div>
        <Button onClick={fetchResults} variant="secondary">
          Odśwież
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {Object.keys(resultsByGameweek).length === 0 ? (
        <Card>
          <CardContent className="text-center py-8 text-gray-500">
            <p>Nie zarejestrowano jeszcze wyników</p>
            <p className="text-sm mt-2">Wyniki pojawią się tutaj po wprowadzeniu goli</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.keys(resultsByGameweek)
            .sort((a, b) => Number(b) - Number(a))
            .map((gw) => (
              <Card key={gw}>
                <CardHeader>
                  <CardTitle>Kolejka {gw}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Zawodnik
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Menedżer
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Gole
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {resultsByGameweek[Number(gw)].map((result) => (
                          <tr key={result.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {result.player_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {result.manager_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {result.goals}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  )
}

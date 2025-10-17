'use client'

import { useState, useEffect } from 'react'
import LeagueTable from '@/components/LeagueTable'

interface League {
  id: string
  name: string
  season: string
}

export default function TablePage() {
  const [leagues, setLeagues] = useState<League[]>([])
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeagues()
  }, [])

  const fetchLeagues = async () => {
    try {
      const response = await fetch('/api/leagues')
      if (response.ok) {
        const data = await response.json()
        setLeagues(data.leagues || [])
      }
    } catch (error) {
      console.error('Failed to fetch leagues:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">League Table</h1>
          <p className="text-gray-600 mt-2">View and manage league standings</p>
        </div>

        {/* League Selection */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select League
              </label>
              <select
                value={selectedLeagueId}
                onChange={(e) => setSelectedLeagueId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a league...</option>
                {leagues.map((league) => (
                  <option key={league.id} value={league.id}>
                    {league.name} ({league.season})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* League Table */}
        {selectedLeagueId && (
          <LeagueTable leagueId={selectedLeagueId} showAdminControls={true} />
        )}

        {!selectedLeagueId && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">🏆</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a League</h3>
            <p className="text-gray-500">Choose a league from the dropdown above to view its standings table.</p>
          </div>
        )}
    </div>
  )
}
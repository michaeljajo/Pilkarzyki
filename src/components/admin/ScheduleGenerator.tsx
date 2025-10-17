'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface League {
  id: string
  name: string
  admin_id: string
}

interface Manager {
  id: string
  first_name: string
  last_name: string
}

interface ScheduleGameweek {
  id: string
  week: number
  is_completed: boolean
  matches: {
    id: string
    home_manager_id: string
    away_manager_id: string
    home_score: number | null
    away_score: number | null
    is_completed: boolean
    home_manager: Manager
    away_manager: Manager
  }[]
}

export function ScheduleGenerator() {
  const [leagues, setLeagues] = useState<League[]>([])
  const [selectedLeague, setSelectedLeague] = useState<string>('')
  const [schedule, setSchedule] = useState<ScheduleGameweek[]>([])
  const [error, setError] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch leagues on component mount
  useEffect(() => {
    async function fetchLeagues() {
      try {
        const response = await fetch('/api/leagues')
        if (!response.ok) {
          throw new Error('Failed to fetch leagues')
        }
        const data = await response.json()
        setLeagues(data.leagues || [])
      } catch (err) {
        console.error('Error fetching leagues:', err)
        setError('Failed to load leagues')
      } finally {
        setIsLoading(false)
      }
    }

    fetchLeagues()
  }, [])

  const handleGenerateSchedule = async () => {
    if (!selectedLeague) {
      setError('Please select a league first')
      return
    }

    setError('')
    setIsGenerating(true)
    setSchedule([])

    try {
      const response = await fetch(`/api/leagues/${selectedLeague}/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate schedule')
      }

      // After successful generation, wait a moment and fetch the schedule
      setTimeout(async () => {
        await fetchSchedule()
      }, 300)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate schedule')
    } finally {
      setIsGenerating(false)
    }
  }

  const fetchSchedule = async () => {
    if (!selectedLeague) return

    try {
      const response = await fetch(`/api/leagues/${selectedLeague}/schedule`)
      if (!response.ok) {
        throw new Error('Failed to fetch schedule')
      }
      const data = await response.json()
      setSchedule(data.schedule || [])
    } catch (err) {
      console.error('Error fetching schedule:', err)
      setError('Failed to load schedule')
    }
  }

  // Fetch schedule when league selection changes
  useEffect(() => {
    if (selectedLeague) {
      fetchSchedule()
    } else {
      setSchedule([])
    }
  }, [selectedLeague])

  const handleDeleteSchedule = async () => {
    if (!selectedLeague) return

    setError('')
    setIsGenerating(true)

    try {
      const response = await fetch(`/api/leagues/${selectedLeague}/schedule`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete schedule')
      }

      setSchedule([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete schedule')
    } finally {
      setIsGenerating(false)
    }
  }

  const totalMatches = schedule.reduce((total, gameweek) => total + gameweek.matches.length, 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-pulse text-gray-500">Loading leagues...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* League Selection */}
      <Card>
        <CardHeader>
          <CardTitle>League Selection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="league" className="block text-sm font-medium text-gray-700 mb-2">
              Select League
            </label>
            <select
              id="league"
              value={selectedLeague}
              onChange={(e) => setSelectedLeague(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Choose a league...</option>
              {leagues.map((league) => (
                <option key={league.id} value={league.id}>
                  {league.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleGenerateSchedule}
              disabled={!selectedLeague || isGenerating}
              loading={isGenerating}
              className="flex-1"
            >
              Generate Head-to-Head Schedule
            </Button>

            {schedule.length > 0 && (
              <Button
                onClick={handleDeleteSchedule}
                disabled={isGenerating}
                variant="destructive"
                className="flex-1"
              >
                Delete Schedule
              </Button>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {schedule.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Schedule</CardTitle>
            <p className="text-sm text-gray-600">
              {schedule.length} gameweeks • {totalMatches} total matches
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {schedule.map((gameweek) => (
                <div key={gameweek.id} className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3">Gameweek {gameweek.week}</h3>
                  {gameweek.matches.length > 0 ? (
                    <div className="space-y-2">
                      {gameweek.matches.map((match) => (
                        <div
                          key={match.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                        >
                          <div className="flex items-center space-x-4">
                            <span className="font-medium">
                              {match.home_manager.first_name} {match.home_manager.last_name}
                            </span>
                            <span className="text-gray-500">vs</span>
                            <span className="font-medium">
                              {match.away_manager.first_name} {match.away_manager.last_name}
                            </span>
                          </div>
                          {match.is_completed && (
                            <div className="text-sm font-mono">
                              {match.home_score} - {match.away_score}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No matches scheduled</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedLeague && schedule.length === 0 && !isGenerating && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No schedule found for this league.</p>
            <p className="text-sm text-gray-400 mt-2">
              Click &quot;Generate Head-to-Head Schedule&quot; to create a new schedule.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { GameweekMatchData, MatchWithLineups, PlayerWithResult } from '@/types'
import { MatchResultCard } from '@/components/admin/MatchResultCard'

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

export default function ResultsPage() {
  const [gameweeks, setGameweeks] = useState<Gameweek[]>([])
  const [matchData, setMatchData] = useState<GameweekMatchData | null>(null)
  const [selectedGameweek, setSelectedGameweek] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [playerGoals, setPlayerGoals] = useState<{[key: string]: number}>({})

  useEffect(() => {
    fetchGameweeks()
  }, [])

  useEffect(() => {
    if (selectedGameweek) {
      fetchMatchData()
    } else {
      setMatchData(null)
      setPlayerGoals({})
    }
  }, [selectedGameweek])

  const fetchGameweeks = async () => {
    try {
      const response = await fetch('/api/gameweeks')
      if (response.ok) {
        const data = await response.json()
        const gameweeksList = data.gameweeks || []
        setGameweeks(gameweeksList)

        // Auto-select current active gameweek if no gameweek is currently selected
        if (!selectedGameweek && gameweeksList.length > 0) {
          // Find the current active gameweek (last completed + 1, or first non-completed)
          const sortedGameweeks = gameweeksList.sort((a: Gameweek, b: Gameweek) => a.week - b.week)

          // Find the first non-completed gameweek
          const activeGameweek = sortedGameweeks.find((gw: Gameweek) => !gw.is_completed)

          if (activeGameweek) {
            setSelectedGameweek(activeGameweek.id)
          } else {
            // If all gameweeks are completed, select the last one
            const lastGameweek = sortedGameweeks[sortedGameweeks.length - 1]
            if (lastGameweek) {
              setSelectedGameweek(lastGameweek.id)
            }
          }
        }
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
      setLoading(true)
      const response = await fetch(`/api/gameweeks/${selectedGameweek}/matches-with-lineups`)
      if (response.ok) {
        const data = await response.json()
        setMatchData(data)

        // Initialize playerGoals state with existing results
        const goalsMap: {[key: string]: number} = {}
        data.matches?.forEach((match: MatchWithLineups) => {
          match.home_lineup?.players?.forEach((player: PlayerWithResult) => {
            goalsMap[player.id] = player.goals_scored || 0
          })
          match.away_lineup?.players?.forEach((player: PlayerWithResult) => {
            goalsMap[player.id] = player.goals_scored || 0
          })
        })
        setPlayerGoals(goalsMap)
      } else {
        console.error('Failed to fetch match data')
        setMatchData(null)
      }
    } catch (error) {
      console.error('Failed to fetch match data:', error)
      setMatchData(null)
    } finally {
      setLoading(false)
    }
  }

  const handlePlayerGoalsChange = (playerId: string, goals: number) => {
    setPlayerGoals(prev => ({
      ...prev,
      [playerId]: goals
    }))
  }

  const updateGameweekStatus = async (isCompleted: boolean) => {
    if (!selectedGameweek || !matchData) return

    setUpdatingStatus(true)

    try {
      const gameweek = gameweeks.find(gw => gw.id === selectedGameweek)
      if (!gameweek) return

      const response = await fetch(`/api/gameweeks/${selectedGameweek}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          week: gameweek.week,
          start_date: gameweek.start_date,
          end_date: gameweek.end_date,
          lock_date: gameweek.lock_date,
          is_completed: isCompleted
        }),
      })

      if (response.ok) {
        // Refresh gameweeks data to show updated status
        await fetchGameweeks()
        // Refresh match data to ensure consistency
        await fetchMatchData()

        alert(`Gameweek marked as ${isCompleted ? 'completed' : 'active'} successfully!`)
      } else {
        const error = await response.json()
        alert(`Error updating gameweek status: ${error.error}`)
      }
    } catch (error) {
      console.error('Failed to update gameweek status:', error)
      alert('Failed to update gameweek status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const saveAllResults = async () => {
    if (!selectedGameweek) return

    setSaving(true)

    try {
      // Prepare results data for the existing API
      const results = Object.entries(playerGoals).map(([player_id, goals]) => ({
        player_id,
        goals
      }))

      const response = await fetch(`/api/gameweeks/${selectedGameweek}/lineups`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ results }),
      })

      if (response.ok) {
        alert('All results saved successfully! Match scores and standings updated.')
        // Refresh the data to show updated match scores
        await fetchMatchData()
      } else {
        const error = await response.json()
        alert(`Error saving results: ${error.error}`)
      }
    } catch (error) {
      alert('Failed to save results')
    } finally {
      setSaving(false)
    }
  }

  const saveIndividualMatch = async (matchId: string) => {
    if (!selectedGameweek || !matchData) return

    setSaving(true)

    try {
      const match = matchData.matches.find(m => m.id === matchId)
      if (!match) return

      // Get all player IDs from this match
      const matchPlayerIds = [
        ...(match.home_lineup?.players?.map(p => p.id) || []),
        ...(match.away_lineup?.players?.map(p => p.id) || [])
      ]

      // Prepare results data only for this match's players
      const results = matchPlayerIds.map(playerId => ({
        player_id: playerId,
        goals: playerGoals[playerId] || 0
      }))

      const response = await fetch(`/api/gameweeks/${selectedGameweek}/lineups`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ results }),
      })

      if (response.ok) {
        alert('Match results saved successfully!')
        // Refresh the data to show updated match scores
        await fetchMatchData()
      } else {
        const error = await response.json()
        alert(`Error saving match results: ${error.error}`)
      }
    } catch (error) {
      alert('Failed to save match results')
    } finally {
      setSaving(false)
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Head-to-Head Results</h1>
          <p className="text-gray-600 mt-2">Manage match results and player goal scoring</p>
        </div>
      </div>

      {/* Gameweek Selector */}
      <div className="mb-6 bg-white rounded-lg shadow-md p-6">
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Gameweek
            </label>
            <select
              value={selectedGameweek}
              onChange={(e) => setSelectedGameweek(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a gameweek...</option>
              {gameweeks.map((gameweek) => (
                <option key={gameweek.id} value={gameweek.id}>
                  Week {gameweek.week} - {gameweek.leagues?.name} ({gameweek.leagues?.season})
                  {gameweek.is_completed ? ' (Completed)' : ' (Active)'}
                </option>
              ))}
            </select>
          </div>
          {selectedGameweek && matchData && (
            <div className="flex items-end">
              <button
                onClick={saveAllResults}
                disabled={saving}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? 'Saving All Results...' : 'Save All Match Results'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Match Results */}
      {selectedGameweek && matchData && (
        <div className="space-y-6">
          {/* Gameweek Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-semibold text-blue-900 mb-1">
                  {matchData.gameweek.leagues?.name} - Week {matchData.gameweek.week}
                </h2>
                <p className="text-blue-700 text-sm">
                  Season: {matchData.gameweek.leagues?.season} •
                  {matchData.matches.length} {matchData.matches.length === 1 ? 'match' : 'matches'} scheduled
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <label className="block text-sm font-medium text-blue-900 mb-1">
                    Status
                  </label>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    {(() => {
                      const currentGameweek = gameweeks.find(gw => gw.id === selectedGameweek)
                      const isCompleted = currentGameweek?.is_completed || false

                      return (
                        <>
                          <button
                            onClick={() => updateGameweekStatus(false)}
                            disabled={updatingStatus}
                            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                              !isCompleted
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-gray-700 hover:bg-gray-200'
                            } disabled:opacity-50`}
                          >
                            Active
                          </button>
                          <button
                            onClick={() => updateGameweekStatus(true)}
                            disabled={updatingStatus}
                            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                              isCompleted
                                ? 'bg-green-600 text-white shadow-sm'
                                : 'text-gray-700 hover:bg-gray-200'
                            } disabled:opacity-50`}
                          >
                            Completed
                          </button>
                        </>
                      )
                    })()}
                  </div>
                </div>
                {updatingStatus && (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                )}
              </div>
            </div>
          </div>

          {/* Matches */}
          {matchData.matches.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-gray-500">
                <div className="text-lg font-medium">No matches scheduled</div>
                <div className="text-sm mt-1">No matches found for this gameweek</div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {matchData.matches.map((match, index) => (
                <div key={match.id}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Match {index + 1}
                    </h3>
                    <button
                      onClick={() => saveIndividualMatch(match.id)}
                      disabled={saving}
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save This Match'}
                    </button>
                  </div>
                  <MatchResultCard
                    match={match}
                    onPlayerGoalsChange={handlePlayerGoalsChange}
                    playerGoals={playerGoals}
                    disabled={saving}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      {selectedGameweek && matchData && matchData.matches.length > 0 && (
        <div className="mt-8 bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
          <h3 className="font-medium text-gray-900 mb-2">How to use:</h3>
          <ul className="space-y-1 list-disc list-inside">
            <li>Input goals scored by each player (0-10 range)</li>
            <li>Scores are calculated automatically as you type</li>
            <li>Save individual matches or all results at once</li>
            <li>Change gameweek status from Active to Completed when done</li>
            <li>League standings will be updated automatically</li>
          </ul>
        </div>
      )}
    </div>
  )
}
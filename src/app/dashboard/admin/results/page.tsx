'use client'

import { useState, useEffect } from 'react'
import { GameweekMatchData, MatchWithLineups, PlayerWithResult } from '@/types'
import { Icon } from 'lucide-react'
import { soccerBall } from '@lucide/lab'
import { calculateMatchScore } from '@/utils/own-goal-calculator'

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
  lock_date?: string
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
  const [playerHasPlayed, setPlayerHasPlayed] = useState<{[key: string]: boolean}>({})

  useEffect(() => {
    fetchGameweeks()
  }, [])

  useEffect(() => {
    if (selectedGameweek) {
      fetchMatchData()
    } else {
      setMatchData(null)
      setPlayerGoals({})
      setPlayerHasPlayed({})
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

        // Initialize playerGoals and playerHasPlayed state with existing results
        const goalsMap: {[key: string]: number} = {}
        const hasPlayedMap: {[key: string]: boolean} = {}
        data.matches?.forEach((match: MatchWithLineups) => {
          match.home_lineup?.players?.forEach((player: PlayerWithResult) => {
            goalsMap[player.id] = player.goals_scored || 0
            hasPlayedMap[player.id] = player.has_played || false
          })
          match.away_lineup?.players?.forEach((player: PlayerWithResult) => {
            goalsMap[player.id] = player.goals_scored || 0
            hasPlayedMap[player.id] = player.has_played || false
          })
        })
        setPlayerGoals(goalsMap)
        setPlayerHasPlayed(hasPlayedMap)
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
        goals,
        has_played: playerHasPlayed[player_id] || false
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
        goals: playerGoals[playerId] || 0,
        has_played: playerHasPlayed[playerId] || false
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
    <div className="max-w-7xl mx-auto p-2 sm:p-4">
      <div className="flex justify-between items-center mb-3 sm:mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Results</h1>
        </div>
      </div>

      {/* Gameweek Selector */}
      <div className="mb-3 sm:mb-4 bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Gameweek
            </label>
            <select
              value={selectedGameweek}
              onChange={(e) => setSelectedGameweek(e.target.value)}
              className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save All Results'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Match Results */}
      {selectedGameweek && matchData && (
        <div className="space-y-3 sm:space-y-4">
          {/* Gameweek Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
              <div>
                <h2 className="text-sm sm:text-base font-semibold text-blue-900">
                  {matchData.gameweek.leagues?.name} - Week {matchData.gameweek.week}
                </h2>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {(() => {
                  const currentGameweek = gameweeks.find(gw => gw.id === selectedGameweek)
                  const isCompleted = currentGameweek?.is_completed || false

                  return (
                    <select
                      value={isCompleted ? 'completed' : 'active'}
                      onChange={(e) => updateGameweekStatus(e.target.value === 'completed')}
                      disabled={updatingStatus}
                      className="px-3 py-1 text-xs font-medium border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                    </select>
                  )
                })()}
                {updatingStatus && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                )}
              </div>
            </div>
          </div>

          {/* Matches */}
          {matchData.matches.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400">
                <div className="text-3xl mb-2">⚽</div>
                <div className="text-sm">Brak meczów w tej kolejce</div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {matchData.matches.map((match) => {
                const homePlayers = match.home_lineup?.players || []
                const awayPlayers = match.away_lineup?.players || []

                // Use own-goal-calculator to properly handle own goals
                const homePlayerGoalsMap = new Map(
                  homePlayers.map(p => [p.id, playerGoals[p.id] || 0])
                )
                const awayPlayerGoalsMap = new Map(
                  awayPlayers.map(p => [p.id, playerGoals[p.id] || 0])
                )
                const { homeScore: homeGoals, awayScore: awayGoals } = calculateMatchScore(
                  homePlayers.map(p => p.id),
                  awayPlayers.map(p => p.id),
                  new Map([...homePlayerGoalsMap, ...awayPlayerGoalsMap])
                )

                const getManagerDisplayName = (manager: { first_name?: string; last_name?: string; email: string; squad?: { team_name?: string } | null }) => {
                  // Priority 1: Team name
                  if (manager?.squad?.team_name) {
                    return manager.squad.team_name
                  }
                  // Priority 2: First and last name
                  if (manager?.first_name && manager?.last_name) {
                    return `${manager.first_name} ${manager.last_name}`
                  }
                  // Priority 3: First name only
                  if (manager?.first_name) {
                    return manager.first_name
                  }
                  // Priority 4: Email
                  return manager?.email || 'Unknown Manager'
                }

                // Check if all players have played for a manager
                const allPlayersHavePlayed = (players: PlayerWithResult[] | undefined) => {
                  if (!players || players.length === 0) return false
                  const result = players.every(p => playerHasPlayed[p.id] === true)
                  return result
                }

                // Get name color based on whether all players have played
                const getManagerNameColor = (players: PlayerWithResult[] | undefined) => {
                  return allPlayersHavePlayed(players) ? 'text-[#061852]' : 'text-[#2E7D32]'
                }

                return (
                  <div key={match.id} className="bg-white border-2 border-[#29544D] rounded-2xl hover:shadow-lg transition-shadow duration-200 p-2 sm:p-5">
                    {/* Save Button */}
                    <div className="flex justify-end mb-2 sm:mb-3">
                      <button
                        onClick={() => saveIndividualMatch(match.id)}
                        disabled={saving}
                        className="px-2 sm:px-4 py-0.5 sm:py-1 text-xs sm:text-sm bg-[#29544D] text-white rounded-lg hover:bg-[#1f3d37] disabled:opacity-50"
                      >
                        {saving ? 'Zapisywanie...' : 'Zapisz wynik'}
                      </button>
                    </div>

                    {/* Match Score Header */}
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <div className="flex-1 pr-2 sm:pr-6">
                        <p className={`text-sm sm:text-lg font-semibold ${getManagerNameColor(homePlayers)}`}>
                          {getManagerDisplayName(match.home_manager)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4 px-2 sm:px-8">
                        <span className="text-xl sm:text-3xl font-bold text-[#061852]">{homeGoals}</span>
                        <span className="text-base sm:text-2xl font-medium text-gray-400">-</span>
                        <span className="text-xl sm:text-3xl font-bold text-[#061852]">{awayGoals}</span>
                      </div>
                      <div className="flex-1 text-right pl-2 sm:pl-6">
                        <p className={`text-sm sm:text-lg font-semibold ${getManagerNameColor(awayPlayers)}`}>
                          {getManagerDisplayName(match.away_manager)}
                        </p>
                      </div>
                    </div>

                    {/* Player Details */}
                    <div className="flex items-start justify-between pt-2 sm:pt-3 border-t-2 border-[#DECF99]">
                      {/* Home Team Players */}
                      <div className="flex-1 space-y-0.5 sm:space-y-1 pr-4 sm:pr-12">
                        {homePlayers.length > 0 ? (
                          homePlayers.map((player) => {
                            const goals = playerGoals[player.id] || 0
                            const hasPlayed = playerHasPlayed[player.id] || false
                            return (
                              <div key={player.id} className="flex items-start gap-1 sm:gap-2 min-h-[24px] sm:min-h-[32px]">
                                <input
                                  type="checkbox"
                                  checked={hasPlayed}
                                  onChange={(e) => setPlayerHasPlayed(prev => ({ ...prev, [player.id]: e.target.checked }))}
                                  disabled={saving}
                                  className="w-3 h-3 sm:w-4 sm:h-4 cursor-pointer disabled:cursor-not-allowed mt-0.5"
                                  title="Oznacz, że zawodnik rozegrał mecz"
                                />
                                <input
                                  type="number"
                                  min="-1"
                                  max="9"
                                  value={goals}
                                  onChange={(e) => handlePlayerGoalsChange(player.id, parseInt(e.target.value) || 0)}
                                  disabled={saving}
                                  className={`w-8 sm:w-12 px-0.5 sm:px-1 py-0 sm:py-0.5 text-[10px] sm:text-xs text-center border rounded focus:outline-none focus:ring-1 disabled:bg-gray-100 ${
                                    goals === -1
                                      ? 'border-red-300 bg-red-50 text-red-700 focus:ring-red-500'
                                      : 'border-gray-300 focus:ring-[#29544D]'
                                  }`}
                                />
                                <p className={`text-[11px] sm:text-sm ${
                                  goals === -1 ? 'font-bold text-red-600' :
                                  hasPlayed && goals > 0 ? 'font-bold text-[#061852]' :
                                  hasPlayed && goals === 0 ? 'italic text-gray-600' :
                                  'text-gray-600'
                                }`}>
                                  {player.name} {player.surname}
                                  {goals === -1 && <span className="ml-1 text-red-600">(OG)</span>}
                                  {goals > 0 && Array.from({ length: goals }).map((_, i) => (
                                    <Icon key={i} iconNode={soccerBall} size={10} className="text-[#061852] sm:w-3 sm:h-3 inline-block align-middle ml-0.5" strokeWidth={2} />
                                  ))}
                                </p>
                              </div>
                            )
                          })
                        ) : (
                          <div className="flex items-baseline gap-2 min-h-[24px] sm:min-h-[32px]">
                            <p className="text-[11px] sm:text-sm text-gray-400 italic">Nie ustawiono składu</p>
                          </div>
                        )}
                      </div>

                      {/* Away Team Players */}
                      <div className="flex-1 text-right space-y-0.5 sm:space-y-1 pl-4 sm:pl-12">
                        {awayPlayers.length > 0 ? (
                          awayPlayers.map((player) => {
                            const goals = playerGoals[player.id] || 0
                            const hasPlayed = playerHasPlayed[player.id] || false
                            return (
                              <div key={player.id} className="flex items-start justify-end gap-1 sm:gap-2 min-h-[24px] sm:min-h-[32px]">
                                <p className={`text-[11px] sm:text-sm text-right ${
                                  goals === -1 ? 'font-bold text-red-600' :
                                  hasPlayed && goals > 0 ? 'font-bold text-[#061852]' :
                                  hasPlayed && goals === 0 ? 'italic text-gray-600' :
                                  'text-gray-600'
                                }`}>
                                  {goals > 0 && Array.from({ length: goals }).map((_, i) => (
                                    <Icon key={i} iconNode={soccerBall} size={10} className="text-[#061852] sm:w-3 sm:h-3 inline-block align-middle mr-0.5" strokeWidth={2} />
                                  ))}
                                  {player.name} {player.surname}
                                  {goals === -1 && <span className="ml-1 text-red-600">(OG)</span>}
                                </p>
                                <input
                                  type="number"
                                  min="-1"
                                  max="9"
                                  value={goals}
                                  onChange={(e) => handlePlayerGoalsChange(player.id, parseInt(e.target.value) || 0)}
                                  disabled={saving}
                                  className={`w-8 sm:w-12 px-0.5 sm:px-1 py-0 sm:py-0.5 text-[10px] sm:text-xs text-center border rounded focus:outline-none focus:ring-1 disabled:bg-gray-100 ${
                                    goals === -1
                                      ? 'border-red-300 bg-red-50 text-red-700 focus:ring-red-500'
                                      : 'border-gray-300 focus:ring-[#29544D]'
                                  }`}
                                />
                                <input
                                  type="checkbox"
                                  checked={hasPlayed}
                                  onChange={(e) => setPlayerHasPlayed(prev => ({ ...prev, [player.id]: e.target.checked }))}
                                  disabled={saving}
                                  className="w-3 h-3 sm:w-4 sm:h-4 cursor-pointer disabled:cursor-not-allowed mt-0.5"
                                  title="Oznacz, że zawodnik rozegrał mecz"
                                />
                              </div>
                            )
                          })
                        ) : (
                          <div className="flex items-baseline gap-2 justify-end min-h-[24px] sm:min-h-[32px]">
                            <p className="text-[11px] sm:text-sm text-gray-400 italic">Nie ustawiono składu</p>
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
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { GameweekMatchData, MatchWithLineups, PlayerWithResult } from '@/types'
import { Icon, Trophy } from 'lucide-react'
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
  lock_date?: string
  is_completed: boolean
  leagues?: League
}

interface Cup {
  id: string
  name: string
  league_id: string
}

interface CupGameweek {
  id: string
  cup_week: number
  stage: string
  leg: number
  gameweek: {
    id: string
    week: number
  }
  matches: MatchWithLineups[]
}

export default function LeagueResultsPage() {
  const params = useParams()
  const leagueId = params.id as string

  const [gameweeks, setGameweeks] = useState<Gameweek[]>([])
  const [matchData, setMatchData] = useState<GameweekMatchData | null>(null)
  const [cup, setCup] = useState<Cup | null>(null)
  const [cupGameweeks, setCupGameweeks] = useState<CupGameweek[]>([])
  const [selectedGameweek, setSelectedGameweek] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [playerGoals, setPlayerGoals] = useState<{[key: string]: number}>({})
  const [playerHasPlayed, setPlayerHasPlayed] = useState<{[key: string]: boolean}>({})

  useEffect(() => {
    fetchGameweeks()
    fetchCup()
  }, [leagueId])

  useEffect(() => {
    if (selectedGameweek) {
      fetchMatchData()
      fetchCupMatches()
    } else {
      setMatchData(null)
      setCupGameweeks([])
      setPlayerGoals({})
      setPlayerHasPlayed({})
    }
  }, [selectedGameweek, cup])

  const fetchGameweeks = async () => {
    try {
      const response = await fetch('/api/gameweeks')
      if (response.ok) {
        const data = await response.json()
        // Filter gameweeks for this specific league
        const leagueGameweeks = (data.gameweeks || []).filter((gw: Gameweek) =>
          gw.league_id === leagueId
        )
        setGameweeks(leagueGameweeks)

        // Auto-select current active gameweek if no gameweek is currently selected
        if (!selectedGameweek && leagueGameweeks.length > 0) {
          const sortedGameweeks = leagueGameweeks.sort((a: Gameweek, b: Gameweek) => a.week - b.week)
          const activeGameweek = sortedGameweeks.find((gw: Gameweek) => !gw.is_completed)

          if (activeGameweek) {
            setSelectedGameweek(activeGameweek.id)
          } else {
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

  const fetchCup = async () => {
    try {
      const response = await fetch(`/api/cups?leagueId=${leagueId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.cup) {
          setCup(data.cup)
        }
      }
    } catch (error) {
      console.error('Failed to fetch cup:', error)
    }
  }

  const fetchCupMatches = async () => {
    if (!cup || !selectedGameweek) return

    try {
      const response = await fetch(`/api/cups/${cup.id}/results`)
      if (response.ok) {
        const data = await response.json()
        // Find cup gameweeks that match the selected league gameweek
        const matchingCupGameweeks = (data.gameweeks || []).filter(
          (cgw: CupGameweek) => cgw.gameweek?.id === selectedGameweek
        )
        setCupGameweeks(matchingCupGameweeks)

        // Add cup match players to playerGoals and playerHasPlayed state
        matchingCupGameweeks.forEach((cgw: CupGameweek) => {
          cgw.matches?.forEach((match: MatchWithLineups) => {
            match.home_lineup?.players?.forEach((player: PlayerWithResult) => {
              setPlayerGoals(prev => ({
                ...prev,
                [player.id]: player.goals_scored || 0
              }))
              setPlayerHasPlayed(prev => ({
                ...prev,
                [player.id]: player.has_played || false
              }))
            })
            match.away_lineup?.players?.forEach((player: PlayerWithResult) => {
              setPlayerGoals(prev => ({
                ...prev,
                [player.id]: player.goals_scored || 0
              }))
              setPlayerHasPlayed(prev => ({
                ...prev,
                [player.id]: player.has_played || false
              }))
            })
          })
        })
      }
    } catch (error) {
      console.error('Failed to fetch cup matches:', error)
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

  const handlePlayerGoalsChange = (playerId: string, value: string) => {
    // Only allow single digit 0-9
    // If value is empty or contains non-numeric characters, default to 0
    // If value is multiple digits, take only the last digit
    let goals = 0

    if (value === '') {
      goals = 0
    } else {
      // Remove any non-digit characters
      const cleaned = value.replace(/\D/g, '')
      if (cleaned.length === 0) {
        goals = 0
      } else {
        // Take only the last digit if multiple digits are entered
        const lastDigit = cleaned.slice(-1)
        goals = parseInt(lastDigit)
        // Ensure it's between 0-9
        goals = Math.min(Math.max(goals, 0), 9)
      }
    }

    setPlayerGoals(prev => ({
      ...prev,
      [playerId]: goals
    }))
  }

  const handlePlayerGoalsFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Select all text when input is focused to allow easy replacement
    e.target.select()
  }

  const handlePlayerGoalsInput = (e: React.FormEvent<HTMLInputElement>) => {
    // Immediately restrict input to single digit
    const input = e.currentTarget
    const value = input.value

    if (value.length > 1) {
      // Take only the last character
      input.value = value.slice(-1)
    }
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
        await fetchGameweeks()
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
        await fetchMatchData()
        await fetchCupMatches()
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
      // Try to find match in league matches first
      let match = matchData.matches.find(m => m.id === matchId)

      // If not found, search in cup matches
      if (!match) {
        for (const cupGameweek of cupGameweeks) {
          const cupMatch = cupGameweek.matches.find(m => m.id === matchId)
          if (cupMatch) {
            match = cupMatch
            break
          }
        }
      }

      if (!match) return

      const matchPlayerIds = [
        ...(match.home_lineup?.players?.map(p => p.id) || []),
        ...(match.away_lineup?.players?.map(p => p.id) || [])
      ]

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
        await fetchMatchData()
        await fetchCupMatches()
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
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Results</h1>
        </div>
      </div>

      {/* Gameweek Selector */}
      <div className="mb-4 bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid md:grid-cols-2 gap-3">
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
                  Week {gameweek.week}{gameweek.is_completed ? ' (Completed)' : ' (Active)'}
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
        <div className="space-y-4">
          {/* Gameweek Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base font-semibold text-blue-900">
                  {matchData.gameweek.leagues?.name} - Week {matchData.gameweek.week}
                </h2>
              </div>
              <div className="flex items-center gap-2">
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
          {matchData.matches.length === 0 && cupGameweeks.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400">
                <div className="text-3xl mb-2">⚽</div>
                <div className="text-sm">Brak meczów w tej kolejce</div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* League Matches */}
              {matchData.matches.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Mecze Ligowe</h3>
                  <div className="space-y-6">
                    {matchData.matches.map((match) => {
                const homeGoals = match.home_lineup?.players?.reduce((sum, p) => sum + (playerGoals[p.id] || 0), 0) || 0
                const awayGoals = match.away_lineup?.players?.reduce((sum, p) => sum + (playerGoals[p.id] || 0), 0) || 0
                const homePlayers = match.home_lineup?.players || []
                const awayPlayers = match.away_lineup?.players || []

                const getManagerDisplayName = (manager: { first_name?: string; last_name?: string; email: string }) => {
                  if (manager?.first_name && manager?.last_name) {
                    return `${manager.first_name} ${manager.last_name}`
                  }
                  if (manager?.first_name) {
                    return manager.first_name
                  }
                  return manager?.email || 'Unknown Manager'
                }

                return (
                  <div key={match.id} className="bg-white border-2 border-[#29544D] rounded-2xl hover:shadow-lg transition-shadow duration-200" style={{ padding: '20px' }}>
                    {/* Save Button */}
                    <div className="flex justify-end mb-3">
                      <button
                        onClick={() => saveIndividualMatch(match.id)}
                        disabled={saving}
                        className="px-4 py-1 text-sm bg-[#29544D] text-white rounded-lg hover:bg-[#1f3d37] disabled:opacity-50"
                      >
                        {saving ? 'Zapisywanie...' : 'Zapisz wynik'}
                      </button>
                    </div>

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
                            const goals = playerGoals[player.id] || 0
                            const hasPlayed = playerHasPlayed[player.id] || false
                            return (
                              <div key={player.id} className="flex items-baseline gap-2 h-[20px]">
                                <input
                                  type="checkbox"
                                  checked={hasPlayed}
                                  onChange={(e) => setPlayerHasPlayed(prev => ({ ...prev, [player.id]: e.target.checked }))}
                                  disabled={saving}
                                  className="w-4 h-4 cursor-pointer disabled:cursor-not-allowed"
                                  title="Oznacz, że zawodnik rozegrał mecz"
                                />
                                <input
                                  type="number"
                                  min="0"
                                  max="9"
                                  value={goals}
                                  onChange={(e) => handlePlayerGoalsChange(player.id, e.target.value)}
                                  onInput={handlePlayerGoalsInput}
                                  onFocus={handlePlayerGoalsFocus}
                                  disabled={saving}
                                  className="w-12 px-1 py-0.5 text-xs text-center border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#29544D] disabled:bg-gray-100"
                                />
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
                            const goals = playerGoals[player.id] || 0
                            const hasPlayed = playerHasPlayed[player.id] || false
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
                                <input
                                  type="number"
                                  min="0"
                                  max="9"
                                  value={goals}
                                  onChange={(e) => handlePlayerGoalsChange(player.id, e.target.value)}
                                  onInput={handlePlayerGoalsInput}
                                  onFocus={handlePlayerGoalsFocus}
                                  disabled={saving}
                                  className="w-12 px-1 py-0.5 text-xs text-center border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#29544D] disabled:bg-gray-100"
                                />
                                <input
                                  type="checkbox"
                                  checked={hasPlayed}
                                  onChange={(e) => setPlayerHasPlayed(prev => ({ ...prev, [player.id]: e.target.checked }))}
                                  disabled={saving}
                                  className="w-4 h-4 cursor-pointer disabled:cursor-not-allowed"
                                  title="Oznacz, że zawodnik rozegrał mecz"
                                />
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
                </div>
              )}

              {/* Cup Matches */}
              {cupGameweeks.length > 0 && cupGameweeks.map((cupGameweek) => {
                const getStageLabel = (stage: string) => {
                  const labels: Record<string, string> = {
                    'group_stage': 'Faza Grupowa',
                    'round_of_16': '1/8 Finału',
                    'quarter_final': 'Ćwierćfinał',
                    'semi_final': 'Półfinał',
                    'final': 'Finał'
                  }
                  return labels[stage] || stage
                }

                return (
                  <div key={cupGameweek.id} className="mt-8">
                    <div className="flex items-center gap-2 mb-3">
                      <Trophy size={20} className="text-yellow-600" />
                      <h3 className="text-lg font-semibold text-gray-800">
                        Mecze Pucharowe - {getStageLabel(cupGameweek.stage)}
                        {cupGameweek.leg === 2 ? ' (Rewanż)' : ''}
                      </h3>
                    </div>
                    <div className="space-y-6">
                      {cupGameweek.matches.map((match) => {
                        const homeGoals = match.home_lineup?.players?.reduce((sum, p) => sum + (playerGoals[p.id] || 0), 0) || 0
                        const awayGoals = match.away_lineup?.players?.reduce((sum, p) => sum + (playerGoals[p.id] || 0), 0) || 0
                        const homePlayers = match.home_lineup?.players || []
                        const awayPlayers = match.away_lineup?.players || []

                        const getManagerDisplayName = (manager: { first_name?: string; last_name?: string; email: string }) => {
                          if (manager?.first_name && manager?.last_name) {
                            return `${manager.first_name} ${manager.last_name}`
                          }
                          if (manager?.first_name) {
                            return manager.first_name
                          }
                          return manager?.email || 'Unknown Manager'
                        }

                        return (
                          <div key={match.id} className="bg-white border-2 border-yellow-600 rounded-2xl hover:shadow-lg transition-shadow duration-200" style={{ padding: '20px' }}>
                            {/* Save Button */}
                            <div className="flex justify-end mb-3">
                              <button
                                onClick={() => saveIndividualMatch(match.id)}
                                disabled={saving}
                                className="px-4 py-1 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                              >
                                {saving ? 'Zapisywanie...' : 'Zapisz wynik'}
                              </button>
                            </div>

                            {/* Match Score Header */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex-1" style={{ paddingRight: '24px' }}>
                                <p className="text-lg font-semibold text-yellow-700">
                                  {getManagerDisplayName(match.home_manager)}
                                </p>
                              </div>
                              <div className="flex items-center gap-4 px-8">
                                <span className="text-3xl font-bold text-[#061852]">{homeGoals}</span>
                                <span className="text-2xl font-medium text-gray-400">-</span>
                                <span className="text-3xl font-bold text-[#061852]">{awayGoals}</span>
                              </div>
                              <div className="flex-1 text-right" style={{ paddingLeft: '24px' }}>
                                <p className="text-lg font-semibold text-yellow-700">
                                  {getManagerDisplayName(match.away_manager)}
                                </p>
                              </div>
                            </div>

                            {/* Player Details */}
                            <div className="flex items-start justify-between pt-3 border-t-2 border-yellow-200">
                              {/* Home Team Players */}
                              <div className="flex-1 space-y-1" style={{ paddingRight: '32px' }}>
                                {homePlayers.length > 0 ? (
                                  homePlayers.map((player) => {
                                    const goals = playerGoals[player.id] || 0
                                    const hasPlayed = playerHasPlayed[player.id] || false
                                    return (
                                      <div key={player.id} className="flex items-baseline gap-2 h-[20px]">
                                        <input
                                          type="checkbox"
                                          checked={hasPlayed}
                                          onChange={(e) => setPlayerHasPlayed(prev => ({ ...prev, [player.id]: e.target.checked }))}
                                          disabled={saving}
                                          className="w-4 h-4 cursor-pointer disabled:cursor-not-allowed"
                                          title="Oznacz, że zawodnik rozegrał mecz"
                                        />
                                        <input
                                          type="number"
                                          min="0"
                                          max="9"
                                          value={goals}
                                          onChange={(e) => handlePlayerGoalsChange(player.id, e.target.value)}
                                          onInput={handlePlayerGoalsInput}
                                          onFocus={handlePlayerGoalsFocus}
                                          disabled={saving}
                                          className="w-12 px-1 py-0.5 text-xs text-center border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-600 disabled:bg-gray-100"
                                        />
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
                                    const goals = playerGoals[player.id] || 0
                                    const hasPlayed = playerHasPlayed[player.id] || false
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
                                        <input
                                          type="number"
                                          min="0"
                                          max="9"
                                          value={goals}
                                          onChange={(e) => handlePlayerGoalsChange(player.id, e.target.value)}
                                          onInput={handlePlayerGoalsInput}
                                          onFocus={handlePlayerGoalsFocus}
                                          disabled={saving}
                                          className="w-12 px-1 py-0.5 text-xs text-center border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-600 disabled:bg-gray-100"
                                        />
                                        <input
                                          type="checkbox"
                                          checked={hasPlayed}
                                          onChange={(e) => setPlayerHasPlayed(prev => ({ ...prev, [player.id]: e.target.checked }))}
                                          disabled={saving}
                                          className="w-4 h-4 cursor-pointer disabled:cursor-not-allowed"
                                          title="Oznacz, że zawodnik rozegrał mecz"
                                        />
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

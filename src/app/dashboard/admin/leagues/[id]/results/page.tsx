'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { GameweekMatchData, MatchWithLineups, PlayerWithResult } from '@/types'
import { Icon, Trophy } from 'lucide-react'
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
    // Allow -1 to 9
    // If value is empty, default to 0
    let goals = 0

    if (value === '' || value === '-') {
      goals = 0
    } else {
      const parsed = parseInt(value)
      if (isNaN(parsed)) {
        goals = 0
      } else {
        // Clamp between -1 and 9
        goals = Math.min(Math.max(parsed, -1), 9)
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
    <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6">
      <div className="flex justify-between items-center mb-3 sm:mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Results</h1>
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
              className="w-full p-2 sm:p-2.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-4 py-2 sm:py-2.5 text-sm sm:text-base bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 font-medium"
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

          {/* Helper Functions */}
          {(() => {
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
              return players.every(p => playerHasPlayed[p.id] === true)
            }

            // Get name color based on whether all players have played
            const getManagerNameColor = (players: PlayerWithResult[] | undefined) => {
              return allPlayersHavePlayed(players) ? 'text-[#061852]' : 'text-[#2E7D32]'
            }

            return (
              <>
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
                                  onChange={(e) => handlePlayerGoalsChange(player.id, e.target.value)}
                                  onFocus={handlePlayerGoalsFocus}
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
                                  onChange={(e) => handlePlayerGoalsChange(player.id, e.target.value)}
                                  onFocus={handlePlayerGoalsFocus}
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
                          <div key={match.id} className="bg-white border-2 border-yellow-600 rounded-2xl hover:shadow-lg transition-shadow duration-200 p-2 sm:p-5">
                            {/* Save Button */}
                            <div className="flex justify-end mb-2 sm:mb-3">
                              <button
                                onClick={() => saveIndividualMatch(match.id)}
                                disabled={saving}
                                className="px-2 sm:px-4 py-0.5 sm:py-1 text-xs sm:text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
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
                            <div className="flex items-start justify-between pt-2 sm:pt-3 border-t-2 border-yellow-200">
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
                                          onChange={(e) => handlePlayerGoalsChange(player.id, e.target.value)}
                                          onFocus={handlePlayerGoalsFocus}
                                          disabled={saving}
                                          className={`w-8 sm:w-12 px-0.5 sm:px-1 py-0 sm:py-0.5 text-[10px] sm:text-xs text-center border rounded focus:outline-none focus:ring-1 disabled:bg-gray-100 ${
                                            goals === -1
                                              ? 'border-red-300 bg-red-50 text-red-700 focus:ring-red-500'
                                              : 'border-gray-300 focus:ring-yellow-600'
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
                                          onChange={(e) => handlePlayerGoalsChange(player.id, e.target.value)}
                                          onFocus={handlePlayerGoalsFocus}
                                          disabled={saving}
                                          className={`w-8 sm:w-12 px-0.5 sm:px-1 py-0 sm:py-0.5 text-[10px] sm:text-xs text-center border rounded focus:outline-none focus:ring-1 disabled:bg-gray-100 ${
                                            goals === -1
                                              ? 'border-red-300 bg-red-50 text-red-700 focus:ring-red-500'
                                              : 'border-gray-300 focus:ring-yellow-600'
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
                  </div>
                )
              })}
                  </div>
                )}
              </>
            )
          })()}
        </div>
      )}
    </div>
  )
}

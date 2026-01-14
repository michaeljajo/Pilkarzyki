'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { PlayerJersey } from '@/components/ui/PlayerJersey'
import { FootballField } from '@/components/ui/FootballField'
import { Player, League, Gameweek, Lineup, Cup, CupGameweek, CupLineup, DefaultLineup, DefaultCupLineup } from '@/types'
import { validateLineup, validateDualLineups } from '@/utils/validation'
import { Clock, Lock, Save, Settings, Trophy, AlertCircle, CalendarX } from 'lucide-react'

interface SquadData {
  league: League
  players: Player[]
  currentGameweek: Gameweek | null
  currentLineup: Lineup | null
  defaultLineup?: DefaultLineup | null
  cup?: Cup
  currentCupGameweek?: CupGameweek
  currentCupLineup?: CupLineup
  defaultCupLineup?: DefaultCupLineup | null
  isDualGameweek: boolean
}

interface SquadSelectionProps {
  leagueId: string
  isDefaultMode?: boolean
}

interface DropZoneProps {
  onDrop: (e: React.DragEvent, index: number) => void
  onDragOver: (e: React.DragEvent) => void
  onRemove: (index: number) => void
  onDragStart: (e: React.DragEvent, player: { name: string; surname: string; position: string; league?: string; id?: string }) => void
  player: Player | null
  index: number
  isDragOver: boolean
  className?: string
}

function DropZone({ onDrop, onDragOver, onRemove, onDragStart, player, index, isDragOver, className }: DropZoneProps) {
  return (
    <div
      onDrop={(e) => onDrop(e, index)}
      onDragOver={onDragOver}
      className={`
        relative transition-all duration-200
        ${!player && 'rounded-xl border-2'}
        ${isDragOver ? 'border-primary-teal bg-background-light scale-105' : !player && 'border-dashed border-white/50 bg-white/20 backdrop-blur-sm'}
        ${!player && 'hover:scale-105 cursor-pointer'}
        ${className}
      `}
      style={!player ? { width: '140px', height: '136px' } : undefined}
    >
      {player ? (
        <div className="relative group">
          <PlayerJersey
            player={player}
            isSelected={false}
            onDragStart={onDragStart}
            className="cursor-move"
          />
          <button
            onClick={() => onRemove(index)}
            className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full text-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600 z-10"
          >
            ×
          </button>
        </div>
      ) : (
        <div className="w-full h-full"></div>
      )}
    </div>
  )
}

export default function SquadSelection({ leagueId, isDefaultMode = false }: SquadSelectionProps) {
  const [squadData, setSquadData] = useState<SquadData | null>(null)
  const [selectedPlayers, setSelectedPlayers] = useState<(Player | null)[]>([null, null, null])
  const [selectedCupPlayers, setSelectedCupPlayers] = useState<(Player | null)[]>([null, null, null])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draggedPlayer, setDraggedPlayer] = useState<Player | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [dragTarget, setDragTarget] = useState<'league' | 'cup' | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [cupValidationErrors, setCupValidationErrors] = useState<string[]>([])
  const [crossLineupErrors, setCrossLineupErrors] = useState<string[]>([])
  const [isMobile, setIsMobile] = useState(false)
  const [defaultLoadedMessage, setDefaultLoadedMessage] = useState<string | null>(null)

  // Helper function to safely get lock date
  const getLockDate = (gameweek: Gameweek | CupGameweek | null | undefined): Date | null => {
    if (!gameweek) return null
    // Handle both snake_case (database) and camelCase (typed) properties
    const lockDate = (gameweek as Gameweek).lockDate || (gameweek as { lock_date?: Date | string }).lock_date
    return lockDate ? new Date(lockDate) : null
  }

  // Detect screen size for responsive UI
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024) // lg breakpoint
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    async function fetchSquadData() {
      try {
        const response = await fetch(`/api/manager/leagues/${leagueId}/squad`)

        if (!response.ok) {
          throw new Error('Nie udało się pobrać danych składu')
        }

        const data = await response.json()
        setSquadData(data)

        // Helper to load players from IDs
        const loadPlayersFromIds = (playerIds: string[]) =>
          playerIds.map((playerId: string) =>
            data.players.find((p: Player) => p.id === playerId) || null
          )

        // DEFAULT MODE: Load default lineups for editing
        if (isDefaultMode) {
          if (data.defaultLineup?.player_ids) {
            setSelectedPlayers(loadPlayersFromIds(data.defaultLineup.player_ids))
          }
          if (data.defaultCupLineup?.player_ids) {
            setSelectedCupPlayers(loadPlayersFromIds(data.defaultCupLineup.player_ids))
          }
        }
        // REGULAR MODE: Conditional pre-population based on lock status
        else {
          const now = new Date()
          const lockDate = getLockDate(data.currentGameweek)
          const isLocked = lockDate && now > lockDate

          // League lineup handling
          if (data.currentLineup?.player_ids) {
            // Always load existing lineup
            setSelectedPlayers(loadPlayersFromIds(data.currentLineup.player_ids))
          } else if (isLocked && data.defaultLineup?.player_ids) {
            // After lock: use default if no lineup exists
            setSelectedPlayers(loadPlayersFromIds(data.defaultLineup.player_ids))
            setDefaultLoadedMessage('Załadowano domyślny skład (żelazo)')
          }
          // Before lock: show empty (already initialized as [null, null, null])

          // Cup lineup handling (same logic)
          if (data.currentCupLineup?.player_ids) {
            setSelectedCupPlayers(loadPlayersFromIds(data.currentCupLineup.player_ids))
          } else if (isLocked && data.defaultCupLineup?.player_ids) {
            setSelectedCupPlayers(loadPlayersFromIds(data.defaultCupLineup.player_ids))
            setDefaultLoadedMessage('Załadowano domyślny skład (żelazo)')
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Nieznany błąd')
      } finally {
        setLoading(false)
      }
    }

    fetchSquadData()
  }, [leagueId])

  // Validate lineups whenever selected players change
  useEffect(() => {
    const activePlayers = selectedPlayers.filter(p => p !== null) as Player[]
    const activeCupPlayers = selectedCupPlayers.filter(p => p !== null) as Player[]

    if (squadData?.isDualGameweek) {
      // Validate both lineups together
      if (activePlayers.length > 0 || activeCupPlayers.length > 0) {
        const dualValidation = validateDualLineups(activePlayers, activeCupPlayers)
        setValidationErrors(dualValidation.leagueErrors)
        setCupValidationErrors(dualValidation.cupErrors)
        setCrossLineupErrors(dualValidation.crossLineupErrors)
      } else {
        setValidationErrors([])
        setCupValidationErrors([])
        setCrossLineupErrors([])
      }
    } else {
      // Validate league lineup only
      if (activePlayers.length > 0) {
        const validation = validateLineup(activePlayers)
        setValidationErrors(validation.errors)
      } else {
        setValidationErrors([])
      }
      setCupValidationErrors([])
      setCrossLineupErrors([])
    }
  }, [selectedPlayers, selectedCupPlayers, squadData?.isDualGameweek])

  const handleDragStart = (e: React.DragEvent, player: Player | { name: string; surname: string; position: string; league?: string; id?: string }) => {
    setDraggedPlayer(player as Player)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDragEnter = (e: React.DragEvent, index: number, target: 'league' | 'cup') => {
    e.preventDefault()
    setDragOverIndex(index)
    setDragTarget(target)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    // Only clear if we're leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverIndex(null)
      setDragTarget(null)
    }
  }

  const handleDrop = (e: React.DragEvent, index: number, target: 'league' | 'cup') => {
    e.preventDefault()
    setDragOverIndex(null)
    setDragTarget(null)

    if (!draggedPlayer) return

    // Determine which lineup we're modifying
    const isLeague = target === 'league'
    const currentLineup = isLeague ? selectedPlayers : selectedCupPlayers
    const otherLineup = isLeague ? selectedCupPlayers : selectedPlayers
    const setLineup = isLeague ? setSelectedPlayers : setSelectedCupPlayers
    const setOtherLineup = isLeague ? setSelectedCupPlayers : setSelectedPlayers

    const newLineup = [...currentLineup]

    // Remove player from current position in BOTH lineups
    const currentIndex = currentLineup.findIndex(p => p?.id === draggedPlayer.id)
    if (currentIndex !== -1) {
      newLineup[currentIndex] = null
    }

    // Also remove from other lineup if it's there (enforce uniqueness)
    const otherIndex = otherLineup.findIndex(p => p?.id === draggedPlayer.id)
    if (otherIndex !== -1) {
      const updatedOtherLineup = [...otherLineup]
      updatedOtherLineup[otherIndex] = null
      setOtherLineup(updatedOtherLineup)
    }

    // Add player to new position
    newLineup[index] = draggedPlayer
    setLineup(newLineup)
    setDraggedPlayer(null)
  }

  const removePlayer = (index: number, target: 'league' | 'cup') => {
    if (target === 'league') {
      const newSelectedPlayers = [...selectedPlayers]
      newSelectedPlayers[index] = null
      setSelectedPlayers(newSelectedPlayers)
    } else {
      const newSelectedCupPlayers = [...selectedCupPlayers]
      newSelectedCupPlayers[index] = null
      setSelectedCupPlayers(newSelectedCupPlayers)
    }
  }

  // Mobile dropdown selection handler
  const handleDropdownChange = (index: number, playerId: string, target: 'league' | 'cup') => {
    const player = squadData?.players.find(p => p.id === playerId) || null

    if (target === 'league') {
      const newSelectedPlayers = [...selectedPlayers]

      // Remove this player from other positions in both lineups if selected
      if (player) {
        newSelectedPlayers.forEach((p, i) => {
          if (p?.id === playerId && i !== index) {
            newSelectedPlayers[i] = null
          }
        })

        // Also remove from cup lineup if present
        if (squadData?.isDualGameweek) {
          const newSelectedCupPlayers = [...selectedCupPlayers]
          newSelectedCupPlayers.forEach((p, i) => {
            if (p?.id === playerId) {
              newSelectedCupPlayers[i] = null
            }
          })
          setSelectedCupPlayers(newSelectedCupPlayers)
        }
      }

      newSelectedPlayers[index] = player
      setSelectedPlayers(newSelectedPlayers)
    } else {
      const newSelectedCupPlayers = [...selectedCupPlayers]

      // Remove this player from other positions in both lineups if selected
      if (player) {
        newSelectedCupPlayers.forEach((p, i) => {
          if (p?.id === playerId && i !== index) {
            newSelectedCupPlayers[i] = null
          }
        })

        // Also remove from league lineup if present
        const newSelectedPlayers = [...selectedPlayers]
        newSelectedPlayers.forEach((p, i) => {
          if (p?.id === playerId) {
            newSelectedPlayers[i] = null
          }
        })
        setSelectedPlayers(newSelectedPlayers)
      }

      newSelectedCupPlayers[index] = player
      setSelectedCupPlayers(newSelectedCupPlayers)
    }
  }

  const saveLineups = async () => {
    // In default mode, we don't need a currentGameweek
    if (!isDefaultMode && !squadData?.currentGameweek) return

    setSaving(true)
    try {
      const leaguePlayerIds = selectedPlayers.filter(p => p !== null).map(p => p!.id)

      // DEFAULT MODE: Save to default lineup APIs
      if (isDefaultMode) {
        const cupPlayerIds = selectedCupPlayers.filter(p => p !== null).map(p => p!.id)

        // Save league default lineup
        const leagueResponse = await fetch('/api/default-lineups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leagueId: squadData?.league.id,
            playerIds: leaguePlayerIds
          }),
        })

        if (!leagueResponse.ok) {
          const errorData = await leagueResponse.json()
          throw new Error(errorData.error || 'Nie udało się zapisać domyślnego składu ligowego')
        }

        // Save cup default lineup if cup exists
        if (squadData?.cup && cupPlayerIds.length > 0) {
          const cupResponse = await fetch('/api/default-cup-lineups', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cupId: squadData.cup.id,
              playerIds: cupPlayerIds
            }),
          })

          if (!cupResponse.ok) {
            const errorData = await cupResponse.json()
            throw new Error(errorData.error || 'Nie udało się zapisać domyślnego składu pucharowego')
          }

          alert('Domyślne składy (żelazo) zostały zapisane pomyślnie!')
        } else {
          alert('Domyślny skład (żelazo) został zapisany pomyślnie!')
        }
      }
      // REGULAR MODE: Save to regular lineup APIs
      else {
        if (squadData.isDualGameweek && squadData.currentCupGameweek) {
          // Save both lineups atomically
          const cupPlayerIds = selectedCupPlayers.filter(p => p !== null).map(p => p!.id)

          // Save league lineup
          const leagueResponse = await fetch('/api/lineups', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              gameweekId: squadData.currentGameweek!.id,
              playerIds: leaguePlayerIds
            }),
          })

          if (!leagueResponse.ok) {
            const errorData = await leagueResponse.json()
            throw new Error(errorData.error || 'Nie udało się zapisać składu ligowego')
          }

          // Save cup lineup
          const cupResponse = await fetch('/api/cup-lineups', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cupGameweekId: squadData.currentCupGameweek.id,
              playerIds: cupPlayerIds
            }),
          })

          if (!cupResponse.ok) {
            const errorData = await cupResponse.json()
            throw new Error(errorData.error || 'Nie udało się zapisać składu pucharowego')
          }

          alert('Oba składy zostały zapisane pomyślnie!')
        } else {
          // Save league lineup only
          const response = await fetch('/api/lineups', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              gameweekId: squadData.currentGameweek!.id,
              playerIds: leaguePlayerIds
            }),
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Nie udało się zapisać składu')
          }

          alert('Skład został zapisany pomyślnie!')
        }
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Nie udało się zapisać składu')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error || !squadData) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Błąd: {error}</p>
        <Button onClick={() => window.location.reload()} variant="secondary" className="mt-4">
          Spróbuj ponownie
        </Button>
      </div>
    )
  }

  const lockDate = getLockDate(squadData?.currentGameweek)
  const isGameweekLocked = lockDate && new Date() > lockDate
  const activePlayers = selectedPlayers.filter(p => p !== null) as Player[]
  const activeCupPlayers = selectedCupPlayers.filter(p => p !== null) as Player[]

  // Format deadline information
  const formatDeadline = (date: Date | null) => {
    if (!date) return null
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }
    return date.toLocaleDateString('pl-PL', options)
  }

  const isLeagueLineupValid = activePlayers.length >= 1 && activePlayers.length <= 3 && validationErrors.length === 0
  const isCupLineupValid = activeCupPlayers.length >= 1 && activeCupPlayers.length <= 3 && cupValidationErrors.length === 0
  const isValid = squadData.isDualGameweek
    ? isLeagueLineupValid && isCupLineupValid && crossLineupErrors.length === 0
    : isLeagueLineupValid

  // Get players that are already selected in either lineup
  const selectedPlayerIds = new Set([
    ...selectedPlayers.filter(p => p !== null).map(p => p!.id),
    ...(squadData.isDualGameweek ? selectedCupPlayers.filter(p => p !== null).map(p => p!.id) : [])
  ])

  // Mobile UI with dropdowns
  if (isMobile) {
    return (
      <div className="bg-gradient-to-br from-background-light to-white field-pattern">
        {!squadData.currentGameweek ? (
          <div className="text-center py-16">
            <div className="flex justify-center mb-4">
              <CalendarX size={64} className="text-gray-400" />
            </div>
            <p className="text-navy-600 text-lg">Nie znaleziono aktywnej kolejki. Skontaktuj się z administratorem ligi.</p>
          </div>
        ) : (
          <div className="space-y-4 pb-4">
            {/* Deadline Info */}
            {!isDefaultMode && lockDate && (
              <div className={`mx-4 p-3 rounded-lg border ${isGameweekLocked ? 'bg-red-50 border-red-300' : 'bg-blue-50 border-blue-300'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                      {isGameweekLocked ? (
                        <>
                          <Lock size={14} />
                          <span>Skład zablokowany</span>
                        </>
                      ) : (
                        <>
                          <Clock size={14} />
                          <span>Termin składu</span>
                        </>
                      )}
                    </div>
                    <div className={`text-sm font-bold ${isGameweekLocked ? 'text-red-700' : 'text-blue-700'}`}>
                      {formatDeadline(lockDate)}
                    </div>
                  </div>
                  {squadData.currentGameweek && (
                    <div className="text-right">
                      <div className="text-xs text-gray-600">Kolejka</div>
                      <div className="text-lg font-bold text-gray-900">{squadData.currentGameweek.week}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="px-4 space-y-2">
              <Button
                onClick={saveLineups}
                disabled={!isValid || (isGameweekLocked && !isDefaultMode) || saving}
                loading={saving}
                className="w-full"
              >
                <div className="flex items-center justify-center gap-2">
                  {isDefaultMode ? (
                    <>
                      <Settings size={16} />
                      <span>Zapisz domyślny skład (żelazo)</span>
                    </>
                  ) : isGameweekLocked ? (
                    <>
                      <Lock size={16} />
                      <span>Zablokowane</span>
                    </>
                  ) : squadData.isDualGameweek ? (
                    <>
                      <Save size={16} />
                      <span>Zapisz oba składy</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>Zapisz</span>
                    </>
                  )}
                </div>
              </Button>

              {/* "Ustaw żelazo" button - only in regular mode */}
              {!isDefaultMode && (
                <Button
                  onClick={() => window.location.href = `/dashboard/leagues/${leagueId}/default-lineup`}
                  variant="secondary"
                  className="w-full"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Settings size={16} />
                    <span>Ustaw żelazo</span>
                  </div>
                </Button>
              )}
            </div>

            {/* League Lineup */}
            <Card className={`border-gray-300 ${isDefaultMode ? 'bg-gray-50' : 'bg-[#F2F2F2]'}`}>
              <CardHeader className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-1.5">
                    {isDefaultMode && <Settings size={16} />}
                    <span>{isDefaultMode ? 'Żelazny skład ligowy' : 'Skład Ligowy'}</span>
                  </CardTitle>
                  {!isDefaultMode && squadData.isDualGameweek && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                      Kolejka {squadData.currentGameweek.week}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="px-4 py-2">
                {/* Pitch Visualization with Stacked Names */}
                <div className="relative mb-4" style={{ transform: 'scale(0.75)', transformOrigin: 'top center' }}>
                  <FootballField className="mb-1.5 mx-0 max-w-none" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex flex-col gap-4 items-center" style={{ marginTop: '-20px' }}>
                      {/* Goalkeeper */}
                      {selectedPlayers[0] ? (
                        <div className="bg-white rounded-lg px-4 py-2 shadow-md border-2 border-navy-600 min-w-[140px]">
                          <div className="font-bold text-gray-900 text-center text-xs leading-tight">
                            {selectedPlayers[0].name} {selectedPlayers[0].surname}
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-lg border-2 border-dashed border-white/70 bg-white/30 backdrop-blur-sm px-4 py-2 min-w-[140px] h-[36px]">
                        </div>
                      )}

                      {/* Midfielder/Defender */}
                      {selectedPlayers[1] ? (
                        <div className="bg-white rounded-lg px-4 py-2 shadow-md border-2 border-navy-600 min-w-[140px]">
                          <div className="font-bold text-gray-900 text-center text-xs leading-tight">
                            {selectedPlayers[1].name} {selectedPlayers[1].surname}
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-lg border-2 border-dashed border-white/70 bg-white/30 backdrop-blur-sm px-4 py-2 min-w-[140px] h-[36px]">
                        </div>
                      )}

                      {/* Forward */}
                      {selectedPlayers[2] ? (
                        <div className="bg-white rounded-lg px-4 py-2 shadow-md border-2 border-navy-600 min-w-[140px]">
                          <div className="font-bold text-gray-900 text-center text-xs leading-tight">
                            {selectedPlayers[2].name} {selectedPlayers[2].surname}
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-lg border-2 border-dashed border-white/70 bg-white/30 backdrop-blur-sm px-4 py-2 min-w-[140px] h-[36px]">
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dropdown Selectors */}
                <div className="space-y-3 mt-4">
                  {/* Position 1 */}
                  <Select
                    value={selectedPlayers[0]?.id || ''}
                    onChange={(e) => handleDropdownChange(0, e.target.value, 'league')}
                    disabled={!isDefaultMode && !!isGameweekLocked}
                    className="text-sm h-10"
                  >
                    <option value="">Wybierz zawodnika</option>
                    {squadData.players
                      .map(player => (
                        <option
                          key={player.id}
                          value={player.id}
                          disabled={selectedPlayerIds.has(player.id) && selectedPlayers[0]?.id !== player.id}
                        >
                          {player.name} {player.surname} ({player.club})
                        </option>
                      ))}
                  </Select>

                  {/* Position 2 */}
                  <Select
                    value={selectedPlayers[1]?.id || ''}
                    onChange={(e) => handleDropdownChange(1, e.target.value, 'league')}
                    disabled={!isDefaultMode && !!isGameweekLocked}
                    className="text-sm h-10"
                  >
                    <option value="">Wybierz zawodnika</option>
                    {squadData.players
                      .map(player => (
                        <option
                          key={player.id}
                          value={player.id}
                          disabled={selectedPlayerIds.has(player.id) && selectedPlayers[1]?.id !== player.id}
                        >
                          {player.name} {player.surname} ({player.club})
                        </option>
                      ))}
                  </Select>

                  {/* Position 3 */}
                  <Select
                    value={selectedPlayers[2]?.id || ''}
                    onChange={(e) => handleDropdownChange(2, e.target.value, 'league')}
                    disabled={!isDefaultMode && !!isGameweekLocked}
                    className="text-sm h-10"
                  >
                    <option value="">Wybierz zawodnika</option>
                    {squadData.players
                      .map(player => (
                        <option
                          key={player.id}
                          value={player.id}
                          disabled={selectedPlayerIds.has(player.id) && selectedPlayers[2]?.id !== player.id}
                        >
                          {player.name} {player.surname} ({player.club})
                        </option>
                      ))}
                  </Select>
                </div>

                {/* League Validation Errors */}
                {validationErrors.length > 0 && (
                  <div className="mt-3 bg-red-50/90 backdrop-blur-sm border border-red-200 rounded p-2">
                    <ul className="text-[10px] text-red-700 space-y-0.5">
                      {validationErrors.map((error, index) => (
                        <li key={index} className="flex items-start gap-1">
                          <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
                          <span>{error}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cup Lineup (Only shown if dual gameweek or default mode with cup) */}
            {((squadData.isDualGameweek && squadData.currentCupGameweek) || (isDefaultMode && squadData.cup)) && (
              <Card className={`border-yellow-500 border-2 ${isDefaultMode ? 'bg-gray-50' : 'bg-[#F2F2F2]'}`}>
                <CardHeader className={`px-4 py-3 rounded-t-2xl ${isDefaultMode ? 'bg-gray-100' : 'bg-yellow-50'}`}>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-1.5">
                      {isDefaultMode ? <Settings size={16} /> : <Trophy size={16} />}
                      <span>{isDefaultMode ? 'Żelazny skład pucharowy' : 'Skład Pucharowy'}</span>
                    </CardTitle>
                    {!isDefaultMode && squadData.currentCupGameweek && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded">
                        {squadData.cup?.name || 'Puchar'} - Kolejka {squadData.currentCupGameweek.cupWeek}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="px-4 py-2">
                  {/* Pitch Visualization with Stacked Names */}
                  <div className="relative mb-4" style={{ transform: 'scale(0.75)', transformOrigin: 'top center' }}>
                    <FootballField className="mb-1.5 mx-0 max-w-none" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex flex-col gap-4 items-center" style={{ marginTop: '-20px' }}>
                        {/* Goalkeeper */}
                        {selectedCupPlayers[0] ? (
                          <div className="bg-white rounded-lg px-4 py-2 shadow-md border-2 border-yellow-500 min-w-[140px]">
                            <div className="font-bold text-gray-900 text-center text-xs leading-tight">
                              {selectedCupPlayers[0].name} {selectedCupPlayers[0].surname}
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-lg border-2 border-dashed border-white/70 bg-white/30 backdrop-blur-sm px-4 py-2 min-w-[140px] h-[36px]">
                          </div>
                        )}

                        {/* Midfielder/Defender */}
                        {selectedCupPlayers[1] ? (
                          <div className="bg-white rounded-lg px-4 py-2 shadow-md border-2 border-yellow-500 min-w-[140px]">
                            <div className="font-bold text-gray-900 text-center text-xs leading-tight">
                              {selectedCupPlayers[1].name} {selectedCupPlayers[1].surname}
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-lg border-2 border-dashed border-white/70 bg-white/30 backdrop-blur-sm px-4 py-2 min-w-[140px] h-[36px]">
                          </div>
                        )}

                        {/* Forward */}
                        {selectedCupPlayers[2] ? (
                          <div className="bg-white rounded-lg px-4 py-2 shadow-md border-2 border-yellow-500 min-w-[140px]">
                            <div className="font-bold text-gray-900 text-center text-xs leading-tight">
                              {selectedCupPlayers[2].name} {selectedCupPlayers[2].surname}
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-lg border-2 border-dashed border-white/70 bg-white/30 backdrop-blur-sm px-4 py-2 min-w-[140px] h-[36px]">
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dropdown Selectors */}
                  <div className="space-y-3 mt-4">
                    {/* Goalkeeper */}
                    <Select
                      value={selectedCupPlayers[0]?.id || ''}
                      onChange={(e) => handleDropdownChange(0, e.target.value, 'cup')}
                      disabled={!isDefaultMode && !!isGameweekLocked}
                      className="text-sm h-10"
                    >
                      <option value="">Wybierz zawodnika</option>
                      {squadData.players
                        .map(player => (
                          <option
                            key={player.id}
                            value={player.id}
                            disabled={selectedPlayerIds.has(player.id) && selectedCupPlayers[0]?.id !== player.id}
                          >
                            {player.name} {player.surname} ({player.club})
                          </option>
                        ))}
                    </Select>

                    {/* Position 2 */}
                    <Select
                      value={selectedCupPlayers[1]?.id || ''}
                      onChange={(e) => handleDropdownChange(1, e.target.value, 'cup')}
                      disabled={!isDefaultMode && !!isGameweekLocked}
                      className="text-sm h-10"
                    >
                      <option value="">Wybierz zawodnika</option>
                      {squadData.players
                        .map(player => (
                          <option
                            key={player.id}
                            value={player.id}
                            disabled={selectedPlayerIds.has(player.id) && selectedCupPlayers[1]?.id !== player.id}
                          >
                            {player.name} {player.surname} ({player.club})
                          </option>
                        ))}
                    </Select>

                    {/* Position 3 */}
                    <Select
                      value={selectedCupPlayers[2]?.id || ''}
                      onChange={(e) => handleDropdownChange(2, e.target.value, 'cup')}
                      disabled={!isDefaultMode && !!isGameweekLocked}
                      className="text-sm h-10"
                    >
                      <option value="">Wybierz zawodnika</option>
                      {squadData.players
                        .map(player => (
                          <option
                            key={player.id}
                            value={player.id}
                            disabled={selectedPlayerIds.has(player.id) && selectedCupPlayers[2]?.id !== player.id}
                          >
                            {player.name} {player.surname} ({player.club})
                          </option>
                        ))}
                    </Select>
                  </div>

                  {/* Cup Validation Errors */}
                  {cupValidationErrors.length > 0 && (
                    <div className="mt-3 bg-red-50/90 backdrop-blur-sm border border-red-200 rounded p-2">
                      <ul className="text-[10px] text-red-700 space-y-0.5">
                        {cupValidationErrors.map((error, index) => (
                          <li key={index} className="flex items-start gap-1">
                            <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
                            <span>{error}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Cross-Lineup Errors */}
            {crossLineupErrors.length > 0 && (
              <div className="bg-red-50/90 backdrop-blur-sm border-2 border-red-500 rounded-xl p-3">
                <h4 className="font-semibold text-red-700 mb-1 text-sm flex items-center gap-1">
                  <AlertCircle size={16} />
                  <span>Konflikt Składów</span>
                </h4>
                <ul className="text-xs text-red-700 space-y-1">
                  {crossLineupErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Desktop UI with drag-and-drop
  return (
    <div className="bg-gradient-to-br from-background-light to-white field-pattern">
      {!squadData.currentGameweek ? (
        <div className="text-center py-16">
          <div className="flex justify-center mb-4">
            <CalendarX size={64} className="text-gray-400" />
          </div>
          <p className="text-navy-600 text-lg">Nie znaleziono aktywnej kolejki. Skontaktuj się z administratorem ligi.</p>
        </div>
      ) : (
        <div className="grid xl:grid-cols-3 gap-2.5">
          {/* Squad Pool - Left Side (Sticky) */}
          <div className="xl:col-span-1" style={{ width: 'fit-content' }}>
            <div style={{ position: 'sticky', top: '80px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Deadline Info */}
              {!isDefaultMode && lockDate && (
                <div className={`p-3 rounded-lg border ${isGameweekLocked ? 'bg-red-50 border-red-300' : 'bg-blue-50 border-blue-300'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                        {isGameweekLocked ? (
                          <>
                            <Lock size={14} />
                            <span>Skład zablokowany</span>
                          </>
                        ) : (
                          <>
                            <Clock size={14} />
                            <span>Termin składu</span>
                          </>
                        )}
                      </div>
                      <div className={`text-sm font-bold ${isGameweekLocked ? 'text-red-700' : 'text-blue-700'}`}>
                        {formatDeadline(lockDate)}
                      </div>
                    </div>
                    {squadData.currentGameweek && (
                      <div className="text-right">
                        <div className="text-xs text-gray-600">Kolejka</div>
                        <div className="text-lg font-bold text-gray-900">{squadData.currentGameweek.week}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Card className="h-fit">
                <CardContent style={{ padding: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {squadData.players.slice(0, 2).map((player) => (
                        <PlayerJersey
                          key={player.id}
                          player={player}
                          onDragStart={handleDragStart}
                          isSelected={selectedPlayerIds.has(player.id)}
                          isDragging={draggedPlayer?.id === player.id}
                          className="cursor-move"
                        />
                      ))}
                    </div>
                    {Array.from({ length: Math.ceil((squadData.players.length - 2) / 2) }).map((_, rowIndex) => (
                      <div key={rowIndex} style={{ display: 'flex', gap: '4px' }}>
                        {squadData.players.slice(2 + rowIndex * 2, 2 + (rowIndex + 1) * 2).map((player) => (
                          <PlayerJersey
                            key={player.id}
                            player={player}
                            onDragStart={handleDragStart}
                            isSelected={selectedPlayerIds.has(player.id)}
                            isDragging={draggedPlayer?.id === player.id}
                            className="cursor-move"
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="space-y-2">
                <Button
                  onClick={saveLineups}
                  disabled={!isValid || (isGameweekLocked && !isDefaultMode) || saving}
                  loading={saving}
                  className="text-[11px] py-1.5"
                  style={{ width: '100%' }}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    {isDefaultMode ? (
                      <>
                        <Settings size={14} />
                        <span>Zapisz domyślny skład (żelazo)</span>
                      </>
                    ) : isGameweekLocked ? (
                      <>
                        <Lock size={14} />
                        <span>Zablokowane</span>
                      </>
                    ) : squadData.isDualGameweek ? (
                      <>
                        <Save size={14} />
                        <span>Zapisz oba składy</span>
                      </>
                    ) : (
                      <>
                        <Save size={14} />
                        <span>Zapisz</span>
                      </>
                    )}
                  </div>
                </Button>

                {/* "Ustaw żelazo" button - only in regular mode */}
                {!isDefaultMode && (
                  <Button
                    onClick={() => window.location.href = `/dashboard/leagues/${leagueId}/default-lineup`}
                    variant="secondary"
                    className="text-[11px] py-1.5"
                    style={{ width: '100%' }}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <Settings size={14} />
                      <span>Ustaw żelazo</span>
                    </div>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Pitches - Right Side */}
          <div className="xl:col-span-2 space-y-6">
            {/* League Pitch */}
            <Card className={isDefaultMode ? "bg-gray-50 border-gray-300" : "bg-[#F2F2F2] border-gray-300"}>
              <CardHeader style={{ padding: '12px 16px' }}>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {isDefaultMode && <Settings size={18} />}
                    <span>{isDefaultMode ? 'Żelazny skład ligowy' : 'Skład Ligowy'}</span>
                  </CardTitle>
                  {!isDefaultMode && squadData.isDualGameweek && (
                    <span className="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-700 rounded">
                      Kolejka {squadData.currentGameweek.week}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent style={{ padding: '2px' }}>
                <div className="relative" style={{ transform: 'scale(0.85)', transformOrigin: 'center' }}>
                  <FootballField className="mb-1.5 mx-0 max-w-none" />
                  <div className="absolute inset-0">
                    {[0, 1, 2].map((index) => (
                      <div
                        key={index}
                        className="absolute"
                        style={{
                          left: index === 0 ? '50%' : index === 1 ? '23.8%' : '68%',
                          top: index === 0 ? '80%' : '48.5%',
                          transform: index === 0 ? 'translate(-50%, -50%)' : index === 1 ? 'translateY(-50%)' : 'translate(-50%, -50%)'
                        }}
                        onDragEnter={(e) => handleDragEnter(e, index, 'league')}
                        onDragLeave={handleDragLeave}
                      >
                        <DropZone
                          onDrop={(e, idx) => handleDrop(e, idx, 'league')}
                          onDragOver={handleDragOver}
                          onRemove={(idx) => removePlayer(idx, 'league')}
                          onDragStart={handleDragStart}
                          player={selectedPlayers[index]}
                          index={index}
                          isDragOver={dragOverIndex === index && dragTarget === 'league'}
                          className="pitch-position"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* League Validation Errors */}
                {validationErrors.length > 0 && (
                  <div className="mt-1.5 bg-red-50/90 backdrop-blur-sm border border-red-200 rounded p-1.5">
                    <ul className="text-[10px] text-red-700 space-y-0.5">
                      {validationErrors.map((error, index) => (
                        <li key={index} className="flex items-start gap-1">
                          <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
                          <span>{error}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cup Pitch (Only shown if dual gameweek or default mode with cup) */}
            {((squadData.isDualGameweek && squadData.currentCupGameweek) || (isDefaultMode && squadData.cup)) && (
              <Card className={isDefaultMode ? "bg-gray-50 border-yellow-500 border-2 overflow-hidden" : "bg-[#F2F2F2] border-yellow-500 border-2 overflow-hidden"}>
                <CardHeader style={{ padding: '16px 24px' }} className={isDefaultMode ? "bg-gray-100 rounded-t-2xl" : "bg-yellow-50 rounded-t-2xl"}>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {isDefaultMode ? <Settings size={18} /> : <Trophy size={18} />}
                      <span>{isDefaultMode ? 'Żelazny skład pucharowy' : 'Skład Pucharowy'}</span>
                    </CardTitle>
                    {!isDefaultMode && squadData.currentCupGameweek && (
                      <span className="text-xs font-semibold px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                        {squadData.cup?.name || 'Puchar'} - Kolejka {squadData.currentCupGameweek.cupWeek}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent style={{ padding: '2px' }}>
                  <div className="relative" style={{ transform: 'scale(0.85)', transformOrigin: 'center' }}>
                    <FootballField className="mb-1.5 mx-0 max-w-none" />
                    <div className="absolute inset-0">
                      {[0, 1, 2].map((index) => (
                        <div
                          key={index}
                          className="absolute"
                          style={{
                            left: index === 0 ? '50%' : index === 1 ? '23.8%' : '68%',
                            top: index === 0 ? '80%' : '48.5%',
                            transform: index === 0 ? 'translate(-50%, -50%)' : index === 1 ? 'translateY(-50%)' : 'translate(-50%, -50%)'
                          }}
                          onDragEnter={(e) => handleDragEnter(e, index, 'cup')}
                          onDragLeave={handleDragLeave}
                        >
                          <DropZone
                            onDrop={(e, idx) => handleDrop(e, idx, 'cup')}
                            onDragOver={handleDragOver}
                            onRemove={(idx) => removePlayer(idx, 'cup')}
                            onDragStart={handleDragStart}
                            player={selectedCupPlayers[index]}
                            index={index}
                            isDragOver={dragOverIndex === index && dragTarget === 'cup'}
                            className="pitch-position"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cup Validation Errors */}
                  {cupValidationErrors.length > 0 && (
                    <div className="mt-1.5 bg-red-50/90 backdrop-blur-sm border border-red-200 rounded p-1.5">
                      <ul className="text-[10px] text-red-700 space-y-0.5">
                        {cupValidationErrors.map((error, index) => (
                          <li key={index} className="flex items-start gap-1">
                            <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
                            <span>{error}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Cross-Lineup Errors */}
            {crossLineupErrors.length > 0 && (
              <div className="bg-red-50/90 backdrop-blur-sm border-2 border-red-500 rounded-xl p-4">
                <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-1.5">
                  <AlertCircle size={18} />
                  <span>Konflikt Składów</span>
                </h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {crossLineupErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

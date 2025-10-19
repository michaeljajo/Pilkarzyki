'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PlayerJersey } from '@/components/ui/PlayerJersey'
import { FootballField } from '@/components/ui/FootballField'
import { Player, League, Gameweek, Lineup } from '@/types'
import { validateLineup, validateDualLineups } from '@/utils/validation'

interface SquadData {
  league: League
  players: Player[]
  currentGameweek: Gameweek | null
  currentLineup: Lineup | null
  cup?: { id: string; name: string; league_id: string }
  currentCupGameweek?: { id: string; cup_week: number; league_gameweek_id: string }
  currentCupLineup?: { id: string; cup_gameweek_id: string; player_ids: string[] }
  isDualGameweek: boolean
}

interface SquadSelectionProps {
  leagueId: string
}

interface DropZoneProps {
  onDrop: (e: React.DragEvent, index: number) => void
  onDragOver: (e: React.DragEvent) => void
  onRemove: (index: number) => void
  onDragStart: (e: React.DragEvent, player: { name: string; surname: string; position: 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Forward'; league?: string; id?: string }) => void
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

export default function SquadSelection({ leagueId }: SquadSelectionProps) {
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

  // Helper function to safely get lock date
  const getLockDate = (gameweek: Gameweek | { lock_date?: string; lockDate?: string } | null) => {
    if (!gameweek) return null
    const lockDate = 'lock_date' in gameweek ? gameweek.lock_date : 'lockDate' in gameweek ? gameweek.lockDate : null
    return lockDate ? new Date(lockDate) : null
  }

  useEffect(() => {
    async function fetchSquadData() {
      try {
        const response = await fetch(`/api/manager/leagues/${leagueId}/squad`)

        if (!response.ok) {
          throw new Error('Failed to fetch squad data')
        }

        const data = await response.json()
        setSquadData(data)

        // If there's an existing league lineup, set the selected players
        if (data.currentLineup?.player_ids) {
          const lineupPlayers = data.currentLineup.player_ids.map((playerId: string) =>
            data.players.find((p: Player) => p.id === playerId) || null
          )
          setSelectedPlayers(lineupPlayers)
        }

        // If there's an existing cup lineup, set the selected cup players
        if (data.currentCupLineup?.player_ids) {
          const cupLineupPlayers = data.currentCupLineup.player_ids.map((playerId: string) =>
            data.players.find((p: Player) => p.id === playerId) || null
          )
          setSelectedCupPlayers(cupLineupPlayers)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
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

  const handleDragStart = (e: React.DragEvent, player: { name: string; surname: string; position: 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Forward'; league?: string; id?: string }) => {
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

  const saveLineups = async () => {
    if (!squadData?.currentGameweek) return

    setSaving(true)
    try {
      const leaguePlayerIds = selectedPlayers.filter(p => p !== null).map(p => p!.id)

      if (squadData.isDualGameweek && squadData.currentCupGameweek) {
        // Save both lineups atomically
        const cupPlayerIds = selectedCupPlayers.filter(p => p !== null).map(p => p!.id)

        // Save league lineup
        const leagueResponse = await fetch('/api/lineups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameweekId: squadData.currentGameweek.id,
            playerIds: leaguePlayerIds
          }),
        })

        if (!leagueResponse.ok) {
          const errorData = await leagueResponse.json()
          throw new Error(errorData.error || 'Failed to save league lineup')
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
          throw new Error(errorData.error || 'Failed to save cup lineup')
        }

        alert('Both lineups saved successfully!')
      } else {
        // Save league lineup only
        const response = await fetch('/api/lineups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameweekId: squadData.currentGameweek.id,
            playerIds: leaguePlayerIds
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to save lineup')
        }

        alert('Lineup saved successfully!')
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save lineup')
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
        <p className="text-red-600">Error: {error}</p>
        <Button onClick={() => window.location.reload()} variant="secondary" className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  const lockDate = getLockDate(squadData?.currentGameweek)
  const isGameweekLocked = lockDate && new Date() > lockDate
  const activePlayers = selectedPlayers.filter(p => p !== null) as Player[]
  const activeCupPlayers = selectedCupPlayers.filter(p => p !== null) as Player[]

  const isLeagueLineupValid = activePlayers.length === 3 && validationErrors.length === 0
  const isCupLineupValid = activeCupPlayers.length === 3 && cupValidationErrors.length === 0
  const isValid = squadData.isDualGameweek
    ? isLeagueLineupValid && isCupLineupValid && crossLineupErrors.length === 0
    : isLeagueLineupValid

  // Get players that are already selected in either lineup
  const selectedPlayerIds = new Set([
    ...selectedPlayers.filter(p => p !== null).map(p => p!.id),
    ...(squadData.isDualGameweek ? selectedCupPlayers.filter(p => p !== null).map(p => p!.id) : [])
  ])

  return (
    <div className="bg-gradient-to-br from-background-light to-white field-pattern">
      {!squadData.currentGameweek ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">⚽</div>
          <p className="text-navy-600 text-lg">No active gameweek found. Contact your league admin.</p>
        </div>
      ) : (
        <div className="grid xl:grid-cols-3 gap-2.5">
          {/* Squad Pool - Left Side (Sticky) */}
          <div className="xl:col-span-1" style={{ width: 'fit-content' }}>
            <div className="sticky" style={{ top: '80px' }}>
              <div className="space-y-2.5">
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
                <Button
                  onClick={saveLineups}
                  disabled={!isValid || isGameweekLocked || saving}
                  loading={saving}
                  className="text-[11px] py-1.5 w-full"
                >
                  {isGameweekLocked ? (
                    <>🔒 Locked</>
                  ) : squadData.isDualGameweek ? (
                    <>⚽ Save Both Lineups</>
                  ) : (
                    <>⚽ Save</>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Pitches - Right Side */}
          <div className="xl:col-span-2 space-y-8">
            {/* League Pitch */}
            <Card className="bg-[#F2F2F2] border-gray-300">
              <CardHeader style={{ padding: '12px 16px' }}>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">League Lineup</CardTitle>
                  {squadData.isDualGameweek && (
                    <span className="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-700 rounded">
                      Gameweek {squadData.currentGameweek.week}
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
                        <li key={index}>⚠️ {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cup Pitch (Only shown if dual gameweek) */}
            {squadData.isDualGameweek && squadData.currentCupGameweek && (
              <Card className="bg-[#F2F2F2] border-yellow-500 border-2 overflow-hidden">
                <CardHeader style={{ padding: '12px 16px' }} className="bg-yellow-50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span>🏆</span>
                      Cup Lineup
                    </CardTitle>
                    <span className="text-xs font-semibold px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                      {squadData.cup?.name || 'Cup'} - Week {squadData.currentCupGameweek.cup_week}
                    </span>
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
                          <li key={index}>⚠️ {error}</li>
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
                <h4 className="font-semibold text-red-700 mb-2">⚠️ Lineup Conflict</h4>
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

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PlayerJersey } from '@/components/ui/PlayerJersey'
import { FootballField } from '@/components/ui/FootballField'
import { Player, League, Gameweek, Lineup } from '@/types'
import { validateLineup } from '@/utils/validation'

interface SquadData {
  league: League
  players: Player[]
  currentGameweek: Gameweek | null
  currentLineup: Lineup | null
}

interface SquadSelectionProps {
  leagueId: string
}


interface DropZoneProps {
  onDrop: (e: React.DragEvent, index: number) => void
  onDragOver: (e: React.DragEvent) => void
  onRemove: (index: number) => void
  onDragStart: (e: React.DragEvent, player: Player) => void
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
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draggedPlayer, setDraggedPlayer] = useState<Player | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Helper function to safely get lock date
  const getLockDate = (gameweek: any) => {
    if (!gameweek) return null
    const lockDate = gameweek.lock_date || gameweek.lockDate
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

        // If there's an existing lineup, set the selected players
        if (data.currentLineup?.player_ids) {
          const lineupPlayers = data.currentLineup.player_ids.map((playerId: string) =>
            data.players.find((p: Player) => p.id === playerId) || null
          )
          setSelectedPlayers(lineupPlayers)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchSquadData()
  }, [leagueId])

  // Validate lineup whenever selected players change
  useEffect(() => {
    const activePlayers = selectedPlayers.filter(p => p !== null) as Player[]
    if (activePlayers.length > 0) {
      const validation = validateLineup(activePlayers)
      setValidationErrors(validation.errors)
    } else {
      setValidationErrors([])
    }
  }, [selectedPlayers])

  const handleDragStart = (e: React.DragEvent, player: Player) => {
    setDraggedPlayer(player)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    // Only clear if we're leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverIndex(null)
    }
  }

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(null)

    if (!draggedPlayer) return

    const newSelectedPlayers = [...selectedPlayers]

    // Remove player from current position if already selected
    const currentIndex = newSelectedPlayers.findIndex(p => p?.id === draggedPlayer.id)
    if (currentIndex !== -1) {
      newSelectedPlayers[currentIndex] = null
    }

    // Add player to new position
    newSelectedPlayers[index] = draggedPlayer
    setSelectedPlayers(newSelectedPlayers)
    setDraggedPlayer(null)
  }


  const removePlayer = (index: number) => {
    const newSelectedPlayers = [...selectedPlayers]
    newSelectedPlayers[index] = null
    setSelectedPlayers(newSelectedPlayers)
  }

  const saveLineup = async () => {
    if (!squadData?.currentGameweek) return

    setSaving(true)
    try {
      const playerIds = selectedPlayers.filter(p => p !== null).map(p => p!.id)

      const response = await fetch('/api/lineups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameweekId: squadData.currentGameweek.id,
          playerIds
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save lineup')
      }

      alert('Lineup saved successfully!')
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
  const isLineupValid = activePlayers.length === 3 && validationErrors.length === 0

  return (
    <div className="bg-gradient-to-br from-background-light to-white field-pattern">
      {!squadData.currentGameweek ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">⚽</div>
            <p className="text-navy-600 text-lg">No active gameweek found. Contact your league admin.</p>
          </div>
        ) : (
          <div className="grid xl:grid-cols-3 gap-2.5">
            {/* Squad Pool - Left Side */}
            <div className="xl:col-span-1" style={{ width: 'fit-content' }}>
              <Card className="h-fit">
                <CardContent style={{ padding: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {squadData.players.slice(0, 2).map((player) => (
                        <PlayerJersey
                          key={player.id}
                          player={player}
                          onDragStart={handleDragStart}
                          isSelected={selectedPlayers.some(p => p?.id === player.id)}
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
                            isSelected={selectedPlayers.some(p => p?.id === player.id)}
                            isDragging={draggedPlayer?.id === player.id}
                            className="cursor-move"
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Football Pitch - Right Side */}
            <div className="xl:col-span-2">
              <Card className="bg-[#F2F2F2] border-gray-300">
                <CardContent style={{ padding: '2px' }}>
                  {/* Football Field with Player Positions */}
                  <div className="relative" style={{ transform: 'scale(0.85)', transformOrigin: 'center' }}>
                    <FootballField className="mb-1.5 mx-0 max-w-none" />

                      {/* Player Drop Zones on Pitch */}
                      <div className="absolute inset-0">
                      {/* Formation: 1 Midfielder (center), 2 Forwards (horizontal line at penalty box) */}

                      {/* Position 0 - Midfielder (center bottom, just above halfway line) */}
                      <div
                        className="absolute"
                        style={{ left: '50%', top: '80%', transform: 'translate(-50%, -50%)' }}
                        onDragEnter={(e) => handleDragEnter(e, 0)}
                        onDragLeave={handleDragLeave}
                      >
                        <DropZone
                          onDrop={handleDrop}
                          onDragOver={handleDragOver}
                          onRemove={removePlayer}
                          onDragStart={handleDragStart}
                          player={selectedPlayers[0]}
                          index={0}
                          isDragOver={dragOverIndex === 0}
                          className="pitch-position"
                        />
                      </div>

                      {/* Position 1 - Forward Left (left side, mid-field) */}
                      <div
                        className="absolute"
                        style={{ left: '23.8%', top: '48.5%', transform: 'translateY(-50%)' }}
                        onDragEnter={(e) => handleDragEnter(e, 1)}
                        onDragLeave={handleDragLeave}
                      >
                        <DropZone
                          onDrop={handleDrop}
                          onDragOver={handleDragOver}
                          onRemove={removePlayer}
                          onDragStart={handleDragStart}
                          player={selectedPlayers[1]}
                          index={1}
                          isDragOver={dragOverIndex === 1}
                          className="pitch-position"
                        />
                      </div>

                      {/* Position 2 - Forward Right (right side, mid-field) */}
                      <div
                        className="absolute"
                        style={{ left: '68%', top: '48.5%', transform: 'translate(-50%, -50%)' }}
                        onDragEnter={(e) => handleDragEnter(e, 2)}
                        onDragLeave={handleDragLeave}
                      >
                        <DropZone
                          onDrop={handleDrop}
                          onDragOver={handleDragOver}
                          onRemove={removePlayer}
                          onDragStart={handleDragStart}
                          player={selectedPlayers[2]}
                          index={2}
                          isDragOver={dragOverIndex === 2}
                          className="pitch-position"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Validation Errors */}
                  {validationErrors.length > 0 && (
                    <div className="mt-1.5 bg-red-50/90 backdrop-blur-sm border border-red-200 rounded p-1.5">
                      <ul className="text-[10px] text-red-700 space-y-0.5">
                        {validationErrors.map((error, index) => (
                          <li key={index}>⚠️ {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-1.5 flex justify-center">
                    <Button
                      onClick={saveLineup}
                      disabled={!isLineupValid || isGameweekLocked || saving}
                      loading={saving}
                      className="text-[11px] py-1.5"
                      style={{ width: '100%', maxWidth: '384px' }}
                    >
                      {isGameweekLocked ? (
                        <>🔒 Locked</>
                      ) : (
                        <>⚽ Save</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
    </div>
  )
}
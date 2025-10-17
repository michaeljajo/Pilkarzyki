'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { User, Player, Position } from '@/types'

interface SquadAssignmentProps {
  managers: User[]
  players: Player[]
  onAssignPlayer: (playerId: string, managerId: string | null) => void
  loading: boolean
}

function SquadAssignment({ managers, players, onAssignPlayer, loading }: SquadAssignmentProps) {
  const [selectedLeague, setSelectedLeague] = useState<string>('')
  const [selectedPosition, setSelectedPosition] = useState<Position | ''>('')
  const [searchTerm, setSearchTerm] = useState('')

  const leagues = [...new Set(players.map(p => p.league))].sort()
  const positions: Position[] = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward']

  const filteredPlayers = players.filter(player => {
    const matchesLeague = !selectedLeague || player.league === selectedLeague
    const matchesPosition = !selectedPosition || player.position === selectedPosition
    const matchesSearch = !searchTerm ||
      `${player.name} ${player.surname}`.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesLeague && matchesPosition && matchesSearch
  })

  const unassignedPlayers = filteredPlayers.filter(p => !p.managerId)
  const assignedPlayers = filteredPlayers.filter(p => p.managerId)

  const getManagerName = (managerId: string) => {
    const manager = managers.find(m => m.id === managerId)
    return manager ? `${manager.firstName} ${manager.lastName}` : 'Unknown Manager'
  }

  const getPositionColor = (position: Position) => {
    switch (position) {
      case 'Goalkeeper': return 'bg-yellow-100 text-yellow-800'
      case 'Defender': return 'bg-blue-100 text-blue-800'
      case 'Midfielder': return 'bg-green-100 text-green-800'
      case 'Forward': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                League
              </label>
              <select
                value={selectedLeague}
                onChange={(e) => setSelectedLeague(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Leagues</option>
                {leagues.map(league => (
                  <option key={league} value={league}>{league}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position
              </label>
              <select
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value as Position | '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Positions</option>
                {positions.map(position => (
                  <option key={position} value={position}>{position}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Player
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Player name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="text-center py-6">
            <div className="text-2xl font-bold text-blue-600">{players.length}</div>
            <div className="text-sm text-gray-600">Total Players</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center py-6">
            <div className="text-2xl font-bold text-green-600">{assignedPlayers.length}</div>
            <div className="text-sm text-gray-600">Assigned</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center py-6">
            <div className="text-2xl font-bold text-orange-600">{unassignedPlayers.length}</div>
            <div className="text-sm text-gray-600">Unassigned</div>
          </CardContent>
        </Card>
      </div>

      {/* Unassigned Players */}
      {unassignedPlayers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>🔄 Unassigned Players ({unassignedPlayers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {unassignedPlayers.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPositionColor(player.position)}`}>
                      {player.position}
                    </span>
                    <div>
                      <div className="font-medium">{player.name} {player.surname}</div>
                      <div className="text-sm text-gray-600">{player.league}</div>
                    </div>
                  </div>
                  <select
                    onChange={(e) => onAssignPlayer(player.id, e.target.value || null)}
                    disabled={loading}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Assign to manager...</option>
                    {managers.filter(m => !m.isAdmin).map(manager => (
                      <option key={manager.id} value={manager.id}>
                        {manager.firstName} {manager.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assigned Players */}
      {assignedPlayers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>✅ Assigned Players ({assignedPlayers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {assignedPlayers.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPositionColor(player.position)}`}>
                      {player.position}
                    </span>
                    <div>
                      <div className="font-medium">{player.name} {player.surname}</div>
                      <div className="text-sm text-gray-600">{player.league}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">
                      Assigned to: <strong>{getManagerName(player.managerId!)}</strong>
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onAssignPlayer(player.id, null)}
                      disabled={loading}
                    >
                      Unassign
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {filteredPlayers.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-500">
              <div className="text-4xl mb-4">⚽</div>
              <p className="text-lg font-medium">No players found</p>
              <p className="text-sm mt-2">Try adjusting your filters or import some players first</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function SquadsPage() {
  const [managers, setManagers] = useState<User[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [assignLoading, setAssignLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([fetchManagers(), fetchPlayers()])
  }, [])

  async function fetchManagers() {
    try {
      const response = await fetch('/api/users')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch managers')
      }

      setManagers(data.users || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch managers')
    }
  }

  async function fetchPlayers() {
    try {
      const response = await fetch('/api/players')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch players')
      }

      setPlayers(data.players || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch players')
    } finally {
      setLoading(false)
    }
  }

  async function handleAssignPlayer(playerId: string, managerId: string | null) {
    try {
      setAssignLoading(true)

      const response = await fetch(`/api/players/${playerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ managerId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to assign player')
      }

      // Update local state
      setPlayers(prev => prev.map(player =>
        player.id === playerId ? { ...player, managerId: managerId || undefined } : player
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign player')
      setTimeout(() => setError(null), 5000)
    } finally {
      setAssignLoading(false)
    }
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Squad Assignment</h1>
            <p className="mt-1 text-gray-600">
              Assign players to managers for their fantasy squads
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => Promise.all([fetchManagers(), fetchPlayers()])} variant="secondary">
              Refresh
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* Squad Assignment Interface */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse h-32 bg-gray-200 rounded-lg" />
            ))}
          </div>
        ) : (
          <SquadAssignment
            managers={managers}
            players={players}
            onAssignPlayer={handleAssignPlayer}
            loading={assignLoading}
          />
        )}
      </div>
  )
}
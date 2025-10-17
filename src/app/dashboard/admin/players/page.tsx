'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { Player, PlayerWithManager, Position } from '@/types'

interface PlayersTableProps {
  players: PlayerWithManager[]
  loading: boolean
}

function PlayersTable({ players, loading }: PlayersTableProps) {
  const [selectedLeague, setSelectedLeague] = useState<string>('')
  const [selectedPosition, setSelectedPosition] = useState<Position | ''>('')
  const [selectedManager, setSelectedManager] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse h-16 bg-gray-200 rounded-lg" />
        ))}
      </div>
    )
  }

  const leagues = [...new Set(players.map(p => p.league))].sort()
  const positions: Position[] = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward']
  // Get unique managers by ID to avoid duplicates
  const uniqueManagersMap = new Map()
  players
    .filter(p => p.manager && p.manager_id)
    .forEach(p => {
      if (!uniqueManagersMap.has(p.manager_id)) {
        uniqueManagersMap.set(p.manager_id, {
          id: p.manager_id!,
          name: `${p.manager!.first_name || ''} ${p.manager!.last_name || ''}`.trim() || 'Unknown Manager'
        })
      }
    })
  const managers = Array.from(uniqueManagersMap.values()).sort((a, b) => a.name.localeCompare(b.name))

  const filteredPlayers = players.filter(player => {
    const matchesLeague = !selectedLeague || player.league === selectedLeague
    const matchesPosition = !selectedPosition || player.position === selectedPosition
    const matchesManager = !selectedManager || player.manager_id === selectedManager
    const matchesSearch = !searchTerm ||
      `${player.name} ${player.surname}`.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesLeague && matchesPosition && matchesManager && matchesSearch
  })

  const getPositionColor = (position: Position) => {
    switch (position) {
      case 'Goalkeeper': return 'bg-yellow-100 text-yellow-800'
      case 'Defender': return 'bg-blue-100 text-blue-800'
      case 'Midfielder': return 'bg-green-100 text-green-800'
      case 'Forward': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (players.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">
          <div className="text-4xl mb-4">⚽</div>
          <p className="text-lg font-medium">No players found</p>
          <p className="text-sm mt-2 mb-4">Import some players to get started</p>
          <Link href="/dashboard/admin/players/import">
            <Button>Import Players</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            Manager
          </label>
          <select
            value={selectedManager}
            onChange={(e) => setSelectedManager(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Managers</option>
            {managers.map(manager => (
              <option key={manager.id} value={manager.id}>{manager.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search
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

      {/* Players Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Player
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                League
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Position
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Manager
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Goals
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPlayers.map((player) => (
              <tr key={player.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">
                    {player.name} {player.surname}
                  </div>
                  <div className="text-sm text-gray-500">ID: {player.id.slice(0, 8)}...</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {player.league}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPositionColor(player.position)}`}>
                    {player.position}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {player.manager_id && player.manager ? (
                    <div>
                      <div className="font-medium text-green-600">
                        {`${player.manager.first_name || ''} ${player.manager.last_name || ''}`.trim() || 'Unknown Manager'}
                      </div>
                      <div className="text-xs text-gray-500">ID: {player.manager.id.slice(0, 8)}...</div>
                    </div>
                  ) : (
                    <span className="text-orange-600 font-medium">Unassigned</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {player.total_goals || 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredPlayers.length === 0 && players.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No players match your current filters</p>
          <p className="text-sm mt-1">Try adjusting your search criteria</p>
        </div>
      )}

      <div className="text-sm text-gray-600">
        Showing {filteredPlayers.length} of {players.length} players
      </div>
    </div>
  )
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<PlayerWithManager[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPlayers()
  }, [])

  async function fetchPlayers() {
    try {
      setLoading(true)
      const response = await fetch('/api/players')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch players')
      }

      setPlayers(data.players || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const assignedCount = players.filter(p => p.manager_id).length
  const unassignedCount = players.length - assignedCount

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Players</h1>
            <p className="mt-1 text-gray-600">
              Manage all players in your system
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={fetchPlayers} variant="secondary">
              Refresh
            </Button>
            <Link href="/dashboard/admin/players/import">
              <Button>Import Players</Button>
            </Link>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="text-center py-6">
              <div className="text-2xl font-bold text-blue-600">{players.length}</div>
              <div className="text-sm text-gray-600">Total Players</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center py-6">
              <div className="text-2xl font-bold text-green-600">{assignedCount}</div>
              <div className="text-sm text-gray-600">Assigned</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center py-6">
              <div className="text-2xl font-bold text-orange-600">{unassignedCount}</div>
              <div className="text-sm text-gray-600">Unassigned</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center py-6">
              <div className="text-2xl font-bold text-purple-600">
                {[...new Set(players.map(p => p.league))].length}
              </div>
              <div className="text-sm text-gray-600">Leagues</div>
            </CardContent>
          </Card>
        </div>

        {/* Players Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Players</CardTitle>
          </CardHeader>
          <CardContent>
            <PlayersTable players={players} loading={loading} />
          </CardContent>
        </Card>
      </div>
  )
}
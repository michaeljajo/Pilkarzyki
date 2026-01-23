'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import Link from 'next/link'
import { Edit2 } from 'lucide-react'

type Position = 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Forward'

interface Player {
  id: string
  name: string
  surname: string
  position: Position
  club: string
  football_league?: string
  manager?: {
    first_name: string
    last_name: string
  }
}

export default function LeaguePlayersPage() {
  const params = useParams()
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    surname: '',
    club: '',
    footballLeague: '',
    position: 'Forward' as Position
  })

  useEffect(() => {
    if (params.id) {
      fetchPlayers()
    }
  }, [params.id])

  async function fetchPlayers() {
    try {
      setLoading(true)
      const response = await fetch(`/api/leagues/${params.id}/players`)
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

  function handleEditClick(player: Player) {
    setEditingPlayer(player)
    setEditForm({
      name: player.name,
      surname: player.surname,
      club: player.club || '',
      footballLeague: player.football_league || '',
      position: player.position
    })
    setEditError(null)
    setIsEditModalOpen(true)
  }

  async function handleSaveEdit() {
    if (!editingPlayer) return

    try {
      setIsSaving(true)
      setEditError(null)

      const response = await fetch(`/api/players/${editingPlayer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update player')
      }

      // Success - close modal and refresh
      await fetchPlayers()
      setIsEditModalOpen(false)
      setEditingPlayer(null)
      setEditError(null)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  function handleCloseModal() {
    setIsEditModalOpen(false)
    setEditingPlayer(null)
    setEditError(null)
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Zawodnicy Ligi</h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base lg:text-lg text-gray-600">
            Przeglądaj i zarządzaj zawodnikami w tej lidze
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button onClick={fetchPlayers} variant="secondary" size="lg" className="w-full sm:w-auto">
            Odśwież
          </Button>
          <Link href={`/dashboard/admin/leagues/${params.id}/players/draft`} className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full">Transfery</Button>
          </Link>
          <Link href={`/dashboard/admin/leagues/${params.id}/players/import`} className="w-full sm:w-auto">
            <Button size="lg" className="w-full">Importuj Zawodników</Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Zawodnicy ({players.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {players.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Brak zawodników w tej lidze</p>
              <Link href={`/dashboard/admin/leagues/${params.id}/players/import`}>
                <Button className="mt-4">Importuj Zawodników</Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block sm:hidden space-y-3">
                {players.map((player) => (
                  <div key={player.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-semibold text-base text-gray-900">
                        {player.name} {player.surname}
                      </div>
                      <button
                        onClick={() => handleEditClick(player)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-colors"
                      >
                        <Edit2 size={14} />
                        Edytuj
                      </button>
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Klub:</span>
                        <span className="text-gray-900 font-medium">{player.club}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Liga:</span>
                        <span className="text-gray-900 font-medium">{player.football_league || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Pozycja:</span>
                        <span className="text-gray-900 font-medium">{player.position}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Menedżer:</span>
                        <span className="text-gray-900 font-medium">
                          {player.manager
                            ? `${player.manager.first_name} ${player.manager.last_name}`
                            : 'Nieprzypisany'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <div className="inline-block min-w-full align-middle">
                  <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Nazwisko
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Klub
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Liga
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Pozycja
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Menedżer
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Akcje
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {players.map((player) => (
                          <tr key={player.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {player.name} {player.surname}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {player.club}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {player.football_league || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {player.position}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {player.manager
                                ? `${player.manager.first_name} ${player.manager.last_name}`
                                : 'Nieprzypisany'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button
                                onClick={() => handleEditClick(player)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-colors"
                              >
                                <Edit2 size={16} />
                                Edytuj
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Player Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
        title="Edytuj Zawodnika"
        description="Zaktualizuj informacje o zawodniku"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={handleCloseModal} disabled={isSaving}>
              Anuluj
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? 'Zapisywanie...' : 'Zapisz Zmiany'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {editError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-700">{editError}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Imię
              </label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nazwisko
              </label>
              <input
                type="text"
                value={editForm.surname}
                onChange={(e) => setEditForm({ ...editForm, surname: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Klub
            </label>
            <input
              type="text"
              value={editForm.club}
              onChange={(e) => setEditForm({ ...editForm, club: e.target.value })}
              placeholder="np. Stade Rennais"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Liga
            </label>
            <input
              type="text"
              value={editForm.footballLeague}
              onChange={(e) => setEditForm({ ...editForm, footballLeague: e.target.value })}
              placeholder="np. Ligue 1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pozycja
            </label>
            <select
              value={editForm.position}
              onChange={(e) => setEditForm({ ...editForm, position: e.target.value as Position })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Goalkeeper">Bramkarz</option>
              <option value="Defender">Obrońca</option>
              <option value="Midfielder">Pomocnik</option>
              <option value="Forward">Napastnik</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { FilterCombo } from '@/components/ui/FilterCombo'
import Link from 'next/link'
import { Edit2 } from 'lucide-react'
import {
  splitFullName,
  positionLabel,
  POSITION_LABEL_PL,
  foldText,
} from '@/lib/draft-players'

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
    fullName: '',
    club: '',
    footballLeague: '',
    position: 'Forward' as Position
  })

  // Same filter set as the draft board: a ~5000-player pool is unusable without
  // it. Filtering happens client-side over the full list, so the counts in the
  // header always reflect the whole league, not a page of it.
  const [search, setSearch] = useState('')
  const [fLeague, setFLeague] = useState('')
  const [fClub, setFClub] = useState('')
  const [fPosition, setFPosition] = useState('')

  const distinct = useCallback(
    (selector: (p: Player) => string | null | undefined) => {
      const set = new Set<string>()
      players.forEach((p) => {
        const v = selector(p)
        if (v) set.add(v)
      })
      return Array.from(set).sort((a, b) => a.localeCompare(b, 'pl'))
    },
    [players]
  )

  const filteredPlayers = useMemo(() => {
    const q = foldText(search)
    return players.filter((p) => {
      if (q && !foldText(`${p.name} ${p.surname}`).includes(q)) return false
      if (fLeague && p.football_league !== fLeague) return false
      if (fClub && p.club !== fClub) return false
      if (fPosition && p.position !== fPosition) return false
      return true
    })
  }, [players, search, fLeague, fClub, fPosition])

  const hasFilters = Boolean(search || fLeague || fClub || fPosition)

  const fetchPlayers = useCallback(async () => {
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
  }, [params.id])

  useEffect(() => {
    if (params.id) {
      fetchPlayers()
    }
  }, [params.id, fetchPlayers])

  function handleEditClick(player: Player) {
    setEditingPlayer(player)
    setEditForm({
      fullName: `${player.name} ${player.surname}`.trim(),
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

      const { name, surname } = splitFullName(editForm.fullName)
      const response = await fetch(`/api/players/${editingPlayer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          surname,
          club: editForm.club,
          footballLeague: editForm.footballLeague,
          position: editForm.position
        })
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
          <h1 className="text-2xl font-bold text-gray-900">Zawodnicy Ligi</h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base lg:text-lg text-gray-600">
            Przeglądaj i zarządzaj zawodnikami w tej lidze
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button onClick={fetchPlayers} variant="secondary" size="lg" className="w-full sm:w-auto">
            Odśwież
          </Button>
          <Link href={`/leagues/${params.id}/manage/players/transfers`} className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full">Transfery</Button>
          </Link>
          <Link href={`/leagues/${params.id}/manage/players/import`} className="w-full sm:w-auto">
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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>
              Zawodnicy ({hasFilters ? `${filteredPlayers.length} z ${players.length}` : players.length})
            </CardTitle>
            {hasFilters && (
              <button
                onClick={() => {
                  setSearch('')
                  setFLeague('')
                  setFClub('')
                  setFPosition('')
                }}
                className="text-sm text-gray-600 hover:text-gray-900 underline"
              >
                Wyczyść filtry
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {players.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Brak zawodników w tej lidze</p>
              <Link href={`/leagues/${params.id}/manage/players/import`}>
                <Button className="mt-4">Importuj Zawodników</Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Same filter row as the draft board */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Szukaj zawodnika"
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md sm:col-span-2 lg:col-span-1"
                />
                <FilterCombo
                  label="Liga"
                  value={fLeague}
                  options={distinct((p) => p.football_league)}
                  onChange={setFLeague}
                />
                <FilterCombo
                  label="Klub"
                  value={fClub}
                  options={distinct((p) => p.club)}
                  onChange={setFClub}
                />
                <FilterCombo
                  label="Pozycja"
                  value={fPosition ? positionLabel(fPosition) : ''}
                  options={distinct((p) => p.position).map(positionLabel)}
                  onChange={(pl) => {
                    const en = Object.keys(POSITION_LABEL_PL).find((k) => POSITION_LABEL_PL[k] === pl) || ''
                    setFPosition(en)
                  }}
                />
              </div>

              {filteredPlayers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Brak zawodników spełniających kryteria
                </div>
              )}

              {/* Mobile Card View */}
              <div className="block sm:hidden space-y-3">
                {filteredPlayers.map((player) => (
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
                        <span className="text-gray-900 font-medium">{positionLabel(player.position)}</span>
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

              {/* Desktop Table View — same structure as the draft board:
                  scroll container with a sticky header, so a 5000-row pool
                  stays navigable instead of pushing the page height. */}
              {filteredPlayers.length > 0 && (
                <div className="hidden sm:block border border-gray-200 rounded-lg overflow-hidden">
                  <div className="max-h-[560px] overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr className="text-left text-gray-600">
                          <th className="px-3 py-2 font-medium">Imię i Nazwisko</th>
                          <th className="px-3 py-2 font-medium">Liga</th>
                          <th className="px-3 py-2 font-medium">Klub</th>
                          <th className="px-3 py-2 font-medium">Pozycja</th>
                          <th className="px-3 py-2 font-medium">Menedżer</th>
                          <th className="px-3 py-2 font-medium"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPlayers.map((player) => (
                          <tr key={player.id} className="border-t border-gray-100 hover:bg-gray-50">
                            <td className="px-3 py-2 font-medium text-gray-900">
                              {`${player.name} ${player.surname}`.trim()}
                            </td>
                            <td className="px-3 py-2">{player.football_league || '—'}</td>
                            <td className="px-3 py-2">{player.club || '—'}</td>
                            <td className="px-3 py-2">{positionLabel(player.position)}</td>
                            <td className="px-3 py-2">
                              {player.manager
                                ? `${player.manager.first_name} ${player.manager.last_name}`
                                : 'Nieprzypisany'}
                            </td>
                            <td className="px-3 py-2 text-right whitespace-nowrap">
                              <button
                                onClick={() => handleEditClick(player)}
                                title="Edytuj dane zawodnika"
                                className="inline-flex items-center gap-1 px-2 py-1 rounded border border-gray-300 text-gray-600 text-xs hover:bg-gray-50"
                              >
                                <Edit2 size={14} />
                                Edytuj
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Imię i Nazwisko
            </label>
            <input
              type="text"
              value={editForm.fullName}
              onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
              className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-400 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
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
              className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-400 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
              className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-400 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pozycja
            </label>
            <select
              value={editForm.position}
              onChange={(e) => setEditForm({ ...editForm, position: e.target.value as Position })}
              className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-400 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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

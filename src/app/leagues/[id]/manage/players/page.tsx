'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { FilterCombo } from '@/components/ui/FilterCombo'
import Link from 'next/link'
import { Edit2 } from 'lucide-react'
import { splitFullName } from '@/lib/draft-players'
import { positionFromLabel, positionLabel } from '@/lib/positions'
import { fold } from '@/utils/text'

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

const UNASSIGNED = 'Nieprzypisany'

// The league pool runs to several thousand players, so the list is rendered in
// chunks — filters narrow it down, this keeps the DOM small until they do.
const PAGE_SIZE = 100

function managerName(player: Player): string {
  if (!player.manager) return UNASSIGNED
  return `${player.manager.first_name} ${player.manager.last_name}`.trim() || UNASSIGNED
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

  // Filters (same set as the draft board, plus manager).
  const [search, setSearch] = useState('')
  const [fLeague, setFLeague] = useState('')
  const [fClub, setFClub] = useState('')
  const [fPosition, setFPosition] = useState('')
  const [fManager, setFManager] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  useEffect(() => {
    if (params.id) {
      fetchPlayers()
    }
  }, [params.id])

  const hasFilters = Boolean(search || fLeague || fClub || fPosition || fManager)

  function clearFilters() {
    setSearch('')
    setFLeague('')
    setFClub('')
    setFPosition('')
    setFManager('')
  }

  // Dropdown options, derived once per fetch — the pool is thousands of rows,
  // and stable arrays keep FilterCombo from re-filtering on every keystroke.
  const { leagueOptions, clubOptions, positionOptions, managerOptions } = useMemo(() => {
    const leagues = new Set<string>()
    const clubs = new Set<string>()
    const positions = new Set<string>()
    const managers = new Set<string>()
    let hasUnassigned = false

    players.forEach((p) => {
      if (p.football_league) leagues.add(p.football_league)
      if (p.club) clubs.add(p.club)
      if (p.position) positions.add(positionLabel(p.position))
      const name = managerName(p)
      if (name === UNASSIGNED) hasUnassigned = true
      else managers.add(name)
    })

    const sortPl = (set: Set<string>) => Array.from(set).sort((a, b) => a.localeCompare(b, 'pl'))
    const managerList = sortPl(managers)

    return {
      leagueOptions: sortPl(leagues),
      clubOptions: sortPl(clubs),
      positionOptions: sortPl(positions),
      managerOptions: hasUnassigned ? [UNASSIGNED, ...managerList] : managerList,
    }
  }, [players])

  const filteredPlayers = useMemo(() => {
    const q = fold(search.trim())
    return players.filter((p) => {
      if (q && !fold(`${p.name} ${p.surname}`).includes(q)) return false
      if (fLeague && p.football_league !== fLeague) return false
      if (fClub && p.club !== fClub) return false
      if (fPosition && p.position !== fPosition) return false
      if (fManager && managerName(p) !== fManager) return false
      return true
    })
  }, [players, search, fLeague, fClub, fPosition, fManager])

  // Restart paging whenever the result set changes, so a new search never opens
  // scrolled deep into the previous one.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [search, fLeague, fClub, fPosition, fManager])

  const visiblePlayers = useMemo(
    () => filteredPlayers.slice(0, visibleCount),
    [filteredPlayers, visibleCount]
  )

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
          <CardTitle>
            Zawodnicy ({hasFilters ? `${filteredPlayers.length} z ${players.length}` : players.length})
          </CardTitle>
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
              {/* Filters */}
              <div className="mb-4 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Szukaj zawodnika"
                    className="px-3 py-2 text-sm bg-white text-gray-900 border border-gray-300 rounded-md placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:col-span-2 lg:col-span-1"
                  />
                  <FilterCombo
                    label="Klub"
                    value={fClub}
                    options={clubOptions}
                    onChange={setFClub}
                  />
                  <FilterCombo
                    label="Liga"
                    value={fLeague}
                    options={leagueOptions}
                    onChange={setFLeague}
                  />
                  <FilterCombo
                    label="Pozycja"
                    value={fPosition ? positionLabel(fPosition) : ''}
                    options={positionOptions}
                    onChange={(label) => setFPosition(positionFromLabel(label))}
                  />
                  <FilterCombo
                    label="Menedżer"
                    value={fManager}
                    options={managerOptions}
                    onChange={setFManager}
                  />
                </div>
                {hasFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    Wyczyść filtry
                  </button>
                )}
              </div>

              {filteredPlayers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Brak zawodników spełniających kryteria</p>
                </div>
              ) : (
                <>
                  {/* Mobile Card View */}
                  <div className="block sm:hidden space-y-3">
                    {visiblePlayers.map((player) => (
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
                            <span className="text-gray-900 font-medium">{managerName(player)}</span>
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
                                Imię i Nazwisko
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
                            {visiblePlayers.map((player) => (
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
                                  {positionLabel(player.position)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {managerName(player)}
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

                  {/* Chunked rendering — the full pool is thousands of rows. */}
                  <div className="mt-4 flex flex-col items-center gap-2">
                    <p className="text-sm text-gray-500">
                      Wyświetlono {visiblePlayers.length} z {filteredPlayers.length}
                    </p>
                    {visiblePlayers.length < filteredPlayers.length && (
                      <Button
                        variant="secondary"
                        onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                      >
                        Pokaż więcej
                      </Button>
                    )}
                  </div>
                </>
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

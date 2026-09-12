'use client'

import { useCallback, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { ArrowRight, UserMinus, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { FilterCombo } from '@/components/ui/FilterCombo'
import { foldText, positionLabel } from '@/lib/draft-players'
import { managerLabel, type ManagerRef } from '@/lib/manager-label'

interface PoolPlayer {
  id: string
  name: string
  surname: string
  position: string
  club?: string | null
  football_league?: string | null
}

const fullName = (p: PoolPlayer) => `${p.name} ${p.surname}`.trim()

/** "Obrońca · Real Madrid · La Liga" — everything that distinguishes two players. */
function playerDetails(p: PoolPlayer): string {
  return [positionLabel(p.position), p.club, p.football_league].filter(Boolean).join(' · ')
}

/**
 * Replace one player in a manager's squad with a free agent.
 *
 * The case this exists for: a player is transferred out of the ten football
 * leagues the game is played with, so he can no longer score and his manager is
 * owed someone else. That is not a swap — there is no second manager — so it
 * gets its own tool: the outgoing player goes back to the pool and an unowned
 * player takes his place, atomically, via /replace-player.
 */
export default function PlayerReplacementPanel({
  leagueId,
  managers,
}: {
  leagueId: string
  managers: ManagerRef[]
}) {
  const [managerId, setManagerId] = useState('')
  const [squad, setSquad] = useState<PoolPlayer[]>([])
  const [squadLoading, setSquadLoading] = useState(false)
  const [playerOutId, setPlayerOutId] = useState('')

  const [freeAgents, setFreeAgents] = useState<PoolPlayer[]>([])
  const [freeAgentsLoading, setFreeAgentsLoading] = useState(false)
  const [playerInId, setPlayerInId] = useState('')

  const [search, setSearch] = useState('')
  const [fLeague, setFLeague] = useState('')
  const [fClub, setFClub] = useState('')
  const [fPosition, setFPosition] = useState('')

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const loadSquad = useCallback(
    async (id: string) => {
      setSquad([])
      setPlayerOutId('')
      if (!id) return
      setSquadLoading(true)
      try {
        const res = await fetch(`/api/manager/leagues/${leagueId}/squad?managerId=${id}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setSquad(data.players || [])
      } catch {
        toast.error('Nie udało się załadować składu menedżera')
      } finally {
        setSquadLoading(false)
      }
    },
    [leagueId]
  )

  const loadFreeAgents = useCallback(async () => {
    setFreeAgentsLoading(true)
    try {
      const res = await fetch(`/api/admin/leagues/${leagueId}/free-agents`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setFreeAgents(data.players || [])
    } catch {
      toast.error('Nie udało się załadować puli wolnych zawodników')
    } finally {
      setFreeAgentsLoading(false)
    }
  }, [leagueId])

  // The pool runs to thousands of rows, so it is fetched once the admin shows
  // real intent (a manager is chosen) rather than on every visit to the page.
  function onSelectManager(id: string) {
    setManagerId(id)
    loadSquad(id)
    if (id && freeAgents.length === 0 && !freeAgentsLoading) loadFreeAgents()
  }

  const distinct = useCallback(
    (selector: (p: PoolPlayer) => string | null | undefined) => {
      const set = new Set<string>()
      freeAgents.forEach((p) => {
        const v = selector(p)
        if (v) set.add(v)
      })
      return Array.from(set).sort((a, b) => a.localeCompare(b, 'pl'))
    },
    [freeAgents]
  )

  const filteredAgents = useMemo(() => {
    const q = foldText(search)
    return freeAgents.filter((p) => {
      if (q && !foldText(fullName(p)).includes(q)) return false
      if (fLeague && p.football_league !== fLeague) return false
      if (fClub && p.club !== fClub) return false
      if (fPosition && p.position !== fPosition) return false
      return true
    })
  }, [freeAgents, search, fLeague, fClub, fPosition])

  // Render a window, not the whole pool: thousands of rows in one list make the
  // page crawl, and an admin narrows down with the filters anyway.
  const VISIBLE = 60
  const visibleAgents = filteredAgents.slice(0, VISIBLE)

  const playerOut = squad.find((p) => p.id === playerOutId) || null
  const playerIn = freeAgents.find((p) => p.id === playerInId) || null
  const canSubmit = !!managerId && !!playerOut && !!playerIn && !submitting

  async function handleReplace() {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/leagues/${leagueId}/replace-player`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ managerId, playerOutId, playerInId }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Nie udało się wykonać zmiany')
        return
      }
      toast.success(data.message || 'Zmiana zakończona')
      setConfirmOpen(false)
      setPlayerInId('')
      setSearch('')
      // Both sides moved: the squad gained a player and the pool lost one.
      await Promise.all([loadSquad(managerId), loadFreeAgents()])
    } catch {
      toast.error('Błąd podczas zmiany zawodnika')
    } finally {
      setSubmitting(false)
    }
  }

  const selectClass =
    'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#29544D] disabled:bg-gray-100'

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-600">
        Gdy zawodnik odejdzie z lig, w które gramy, jego menedżer dostaje w zamian zawodnika z
        puli wolnych. Odchodzący wraca do puli, wchodzący trafia do składu — zmiana obowiązuje od
        najbliższej niezablokowanej kolejki, a dotychczasowe gole zostają przy poprzednich
        właścicielach.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Menedżer</label>
          <select
            value={managerId}
            onChange={(e) => onSelectManager(e.target.value)}
            className={selectClass}
          >
            <option value="">Wybierz menedżera...</option>
            {managers.map((m) => (
              <option key={m.databaseId} value={m.databaseId}>
                {managerLabel(m)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Zawodnik odchodzący
          </label>
          <select
            value={playerOutId}
            onChange={(e) => setPlayerOutId(e.target.value)}
            disabled={!managerId || squadLoading || squad.length === 0}
            className={selectClass}
          >
            <option value="">
              {!managerId
                ? 'Najpierw wybierz menedżera'
                : squadLoading
                  ? 'Wczytywanie składu...'
                  : squad.length === 0
                    ? 'Ten menedżer nie ma zawodników'
                    : 'Wybierz zawodnika...'}
            </option>
            {squad.map((p) => (
              <option key={p.id} value={p.id}>
                {fullName(p)} — {playerDetails(p)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Incoming player: a searchable pool, because a league holds thousands of
          free agents and a <select> over them is unusable. */}
      <div>
        <div className="flex items-baseline justify-between gap-3 mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Zawodnik wchodzący (wolni zawodnicy)
          </label>
          {freeAgents.length > 0 && (
            <span className="text-xs text-gray-500">
              {filteredAgents.length} z {freeAgents.length}
            </span>
          )}
        </div>

        {!managerId ? (
          <p className="text-sm text-gray-500 border border-dashed border-gray-300 rounded-md px-3 py-4">
            Najpierw wybierz menedżera.
          </p>
        ) : freeAgentsLoading ? (
          <p className="text-sm text-gray-500 border border-dashed border-gray-300 rounded-md px-3 py-4">
            Wczytywanie puli wolnych zawodników...
          </p>
        ) : freeAgents.length === 0 ? (
          <p className="text-sm text-gray-500 border border-dashed border-gray-300 rounded-md px-3 py-4">
            W tej lidze nie ma wolnych zawodników.
          </p>
        ) : (
          <div className="space-y-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Szukaj po nazwisku..."
              className={selectClass}
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
                options={Array.from(new Set(freeAgents.map((p) => p.position))).map(positionLabel)}
                onChange={(label) => {
                  const match = freeAgents.find((p) => positionLabel(p.position) === label)
                  setFPosition(match ? match.position : '')
                }}
              />
            </div>

            <div className="border border-gray-200 rounded-md max-h-72 overflow-auto divide-y divide-gray-100">
              {visibleAgents.map((p) => {
                const selected = p.id === playerInId
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlayerInId(selected ? '' : p.id)}
                    className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${
                      selected ? 'bg-[#29544D]/10' : ''
                    }`}
                  >
                    <div
                      className={`text-sm ${selected ? 'font-semibold text-[#29544D]' : 'text-gray-900'}`}
                    >
                      {fullName(p)}
                    </div>
                    <div className="text-xs text-gray-500">{playerDetails(p)}</div>
                  </button>
                )
              })}
              {filteredAgents.length === 0 && (
                <div className="px-3 py-4 text-sm text-gray-400">Brak wyników</div>
              )}
              {filteredAgents.length > VISIBLE && (
                <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50">
                  Pokazano {VISIBLE} z {filteredAgents.length} — zawęź wyszukiwanie.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {playerOut && playerIn && (
        <div className="flex flex-wrap items-center gap-3 rounded-md bg-gray-50 border border-gray-200 px-3 py-3 text-sm">
          <span className="flex items-center gap-2 text-red-700">
            <UserMinus size={16} />
            {fullName(playerOut)}
          </span>
          <ArrowRight size={16} className="text-gray-400" />
          <span className="flex items-center gap-2 text-[#29544D]">
            <UserPlus size={16} />
            {fullName(playerIn)}
          </span>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          onClick={() => setConfirmOpen(true)}
          disabled={!canSubmit}
          icon={<ArrowRight size={16} />}
        >
          Wykonaj zmianę
        </Button>
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleReplace}
        loading={submitting}
        variant="warning"
        title="Potwierdź zmianę zawodnika"
        confirmText="Wykonaj zmianę"
        message={
          playerOut && playerIn
            ? `${managerLabel(managers.find((m) => m.databaseId === managerId) || { databaseId: managerId })}: ` +
              `${fullName(playerOut)} wraca do puli, a do składu wchodzi ${fullName(playerIn)}. ` +
              'Zmiana obowiązuje od najbliższej niezablokowanej kolejki. Jeśli odchodzący zawodnik ' +
              'był w składzie domyślnym, menedżer będzie musiał ustawić go na nowo.'
            : ''
        }
      />
    </div>
  )
}

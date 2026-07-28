'use client'

import { ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { LeagueFlag } from '@/components/ui/LeagueFlag'

// Shared presentational board for the live/finished draft, matching the
// pre-season draft screen exactly. Used by the mid-season draft so the two look
// identical. (The pre-season DraftClient still renders its own copy for now.)

export interface BoardPlayer {
  id: string
  name: string
  surname: string
  club: string | null
  football_league: string | null
  position: string
}
export interface BoardManager {
  squadId: string
  managerId: string
  teamName: string | null
  firstName: string
  lastName: string
  email: string
}
export interface BoardPick {
  id: string
  squad_id: string
  manager_id: string
  player_id: string
  pick_number: number
}

const POSITION_PL: Record<string, string> = {
  Goalkeeper: 'Bramkarz',
  Defender: 'Obrońca',
  Midfielder: 'Pomocnik',
  Forward: 'Napastnik',
}
function positionLabel(pos: string): string {
  return POSITION_PL[pos] || pos
}
function fold(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
}
function managerName(m: BoardManager | undefined | null): string {
  if (!m) return '—'
  const full = [m.firstName, m.lastName].filter(Boolean).join(' ').trim()
  return m.teamName || full || m.email || 'Menedżer'
}

function FilterCombo({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const filtered = useMemo(() => {
    const q = fold(query)
    return options.filter((o) => !q || fold(o).includes(q)).slice(0, 100)
  }, [options, query])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:border-gray-400"
      >
        <span className={value ? 'text-gray-900' : 'text-gray-500'}>{value || label}</span>
        <span className="text-gray-400">▾</span>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-auto">
          <div className="p-2 sticky top-0 bg-white border-b border-gray-100">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Szukaj ${label.toLowerCase()}...`}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              onChange('')
              setOpen(false)
              setQuery('')
            }}
            className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
          >
            Wszystkie
          </button>
          {filtered.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => {
                onChange(o)
                setOpen(false)
                setQuery('')
              }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${o === value ? 'font-semibold text-[#29544D]' : 'text-gray-800'}`}
            >
              {o}
            </button>
          ))}
          {filtered.length === 0 && <div className="px-3 py-2 text-sm text-gray-400">Brak wyników</div>}
        </div>
      )}
    </div>
  )
}

function Roster({
  managers,
  picks,
  players,
  onClockSquadId,
  slotCount,
}: {
  managers: BoardManager[]
  picks: BoardPick[]
  players: BoardPlayer[]
  onClockSquadId: string | null
  slotCount: (squadId: string) => number
}) {
  const playersById = useMemo(() => {
    const map = new Map<string, BoardPlayer>()
    players.forEach((p) => map.set(p.id, p))
    return map
  }, [players])

  const picksBySquad = useMemo(() => {
    const map = new Map<string, BoardPick[]>()
    picks.forEach((p) => {
      const arr = map.get(p.squad_id) || []
      arr.push(p)
      map.set(p.squad_id, arr)
    })
    map.forEach((arr) => arr.sort((a, b) => a.pick_number - b.pick_number))
    return map
  }, [picks])

  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const toggle = (squadId: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(squadId)) next.delete(squadId)
      else next.add(squadId)
      return next
    })

  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">Składy</h2>
      <div className="space-y-3 max-h-[420px] overflow-auto">
        {managers.map((m) => {
          const mp = picksBySquad.get(m.squadId) || []
          const onClock = m.squadId === onClockSquadId
          const isOpen = expanded.has(m.squadId)
          return (
            <div
              key={m.squadId}
              className={`rounded-lg border p-3 ${onClock ? 'border-[#29544D] bg-[#29544D]/5' : 'border-gray-100'}`}
            >
              <button
                type="button"
                onClick={() => toggle(m.squadId)}
                className="w-full flex items-center justify-between gap-2 text-left"
              >
                <span className="flex items-center gap-1.5 font-medium text-gray-900">
                  <span className={`text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`}>▸</span>
                  {managerName(m)}
                </span>
                <span className="text-xs text-gray-500">
                  {mp.length}/{slotCount(m.squadId)}
                  {onClock && <span className="ml-1 text-[#29544D] font-semibold"> teraz wybiera</span>}
                </span>
              </button>
              {isOpen && mp.length === 0 && <p className="mt-2 text-xs text-gray-400">Brak wyborów.</p>}
              {isOpen && mp.length > 0 && (
                <ul className="mt-2 space-y-0.5">
                  {mp.map((pick) => {
                    const pl = playersById.get(pick.player_id)
                    return (
                      <li key={pick.id} className="text-xs text-gray-600 flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium text-gray-800">{pl ? `${pl.name} ${pl.surname}` : '—'}</span>
                        {pl?.club && <span className="text-gray-500">{pl.club}</span>}
                        {pl && <LeagueFlag league={pl.football_league} height={11} />}
                        {pl && <span className="text-gray-400">{positionLabel(pl.position)}</span>}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface DraftLiveBoardProps {
  /** e.g. "Runda 2" — shown next to who is on the clock. */
  roundLabel: string
  status: 'live' | 'finished'
  players: BoardPlayer[]
  /** Ids eligible for the pool table; omit to show all (pre-season style). */
  poolIds?: Set<string>
  picks: BoardPick[]
  managers: BoardManager[]
  onClockSquadId: string | null
  onClockManagerId: string | null
  isAdmin: boolean
  myTurn: boolean
  submitting: boolean
  onConfirmPick: (playerId: string) => void
  onAdminPick: (playerId: string) => void
  onSkip: () => void
  onUndo: () => void
  /** Roster denominator per squad (pre-season: squad size; mid-season: quota+picks). */
  slotCount: (squadId: string) => number
  /** Optional right-column content above the roster (e.g. chat). */
  sideTop?: ReactNode
  /** Admin: add a free-agent player to the pool live. Renders the button+modal when set. */
  onAddPlayer?: (form: { fullName: string; footballLeague: string; club: string; position: string }) => Promise<boolean>
  /** Admin: edit a player's details live (e.g. a last-minute transfer). Renders a row action when set. */
  onEditPlayer?: (
    playerId: string,
    form: { fullName: string; club: string; footballLeague: string; position: string }
  ) => Promise<boolean>
}

const POSITION_OPTIONS_PL = ['Bramkarz', 'Obrońca', 'Pomocnik', 'Napastnik']
const POSITION_EN_BY_PL: Record<string, string> = {
  Bramkarz: 'Goalkeeper',
  Obrońca: 'Defender',
  Pomocnik: 'Midfielder',
  Napastnik: 'Forward',
}

export function DraftLiveBoard({
  roundLabel,
  status,
  players,
  poolIds,
  picks,
  managers,
  onClockSquadId,
  onClockManagerId,
  isAdmin,
  myTurn,
  submitting,
  onConfirmPick,
  onAdminPick,
  onSkip,
  onUndo,
  slotCount,
  sideTop,
  onAddPlayer,
  onEditPlayer,
}: DraftLiveBoardProps) {
  const [search, setSearch] = useState('')
  const [fLeague, setFLeague] = useState('')
  const [fClub, setFClub] = useState('')
  const [fPosition, setFPosition] = useState('')
  const [pending, setPending] = useState<string | null>(null)

  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({ fullName: '', footballLeague: '', club: '', position: 'Napastnik' })
  const [addingPlayer, setAddingPlayer] = useState(false)

  const [editing, setEditing] = useState<BoardPlayer | null>(null)
  const [editForm, setEditForm] = useState({ fullName: '', club: '', footballLeague: '', position: 'Forward' })
  const [savingEdit, setSavingEdit] = useState(false)

  const canEdit = isAdmin && !!onEditPlayer
  const canAdd = isAdmin && !!onAddPlayer && status === 'live'

  const openEdit = (p: BoardPlayer) => {
    setEditForm({
      fullName: `${p.name} ${p.surname}`.trim(),
      club: p.club || '',
      footballLeague: p.football_league || '',
      position: p.position,
    })
    setEditing(p)
  }

  const submitAdd = async () => {
    if (!onAddPlayer) return
    setAddingPlayer(true)
    const ok = await onAddPlayer(addForm)
    setAddingPlayer(false)
    if (ok) {
      setShowAdd(false)
      setAddForm({ fullName: '', footballLeague: '', club: '', position: 'Napastnik' })
    }
  }

  const submitEdit = async () => {
    if (!onEditPlayer || !editing) return
    setSavingEdit(true)
    const ok = await onEditPlayer(editing.id, editForm)
    setSavingEdit(false)
    if (ok) setEditing(null)
  }

  const managersByManagerId = useMemo(() => {
    const map = new Map<string, BoardManager>()
    managers.forEach((m) => map.set(m.managerId, m))
    return map
  }, [managers])

  const pickByPlayer = useMemo(() => {
    const map = new Map<string, BoardPick>()
    picks.forEach((p) => map.set(p.player_id, p))
    return map
  }, [picks])

  const poolPlayers = useMemo(
    () => (poolIds ? players.filter((p) => poolIds.has(p.id)) : players),
    [players, poolIds]
  )

  const distinct = (selector: (p: BoardPlayer) => string | null) => {
    const set = new Set<string>()
    poolPlayers.forEach((p) => {
      const v = selector(p)
      if (v) set.add(v)
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pl'))
  }

  const filteredPlayers = useMemo(() => {
    const q = fold(search)
    return poolPlayers.filter((p) => {
      if (q && !fold(`${p.name} ${p.surname}`).includes(q)) return false
      if (fLeague && p.football_league !== fLeague) return false
      if (fClub && p.club !== fClub) return false
      if (fPosition && p.position !== fPosition) return false
      return true
    })
  }, [poolPlayers, search, fLeague, fClub, fPosition])

  const onClockManager = managersByManagerId.get(onClockManagerId || '')

  return (
    <div className="space-y-6">
      {status === 'live' && myTurn && (
        <div className="rounded-xl bg-[#29544D] text-white px-6 py-4 text-center text-xl font-bold shadow-lg animate-pulse">
          TWOJA KOLEJ!
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        {status === 'live' ? (
          <p className="text-gray-600">
            {roundLabel} · Teraz wybiera:{' '}
            <span className="font-semibold text-gray-900">{managerName(onClockManager)}</span>
          </p>
        ) : (
          <p className="text-gray-600">Draft zakończony</p>
        )}
        {canAdd && (
          <button
            onClick={() => setShowAdd(true)}
            className="text-sm whitespace-nowrap px-3 py-2 rounded-md bg-[#29544D] text-white hover:bg-[#1f423c]"
          >
            + Dodaj zawodnika
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: player pool */}
        <div className="lg:col-span-2 space-y-4">
          {isAdmin && status === 'live' && (
            <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <span className="text-sm font-medium text-amber-800 self-center mr-2">Panel administratora:</span>
              <button
                onClick={onSkip}
                disabled={submitting}
                className="text-sm whitespace-nowrap px-3 py-1.5 rounded-md bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
              >
                Pomiń kolejkę
              </button>
              <button
                onClick={onUndo}
                disabled={submitting || picks.length === 0}
                className="text-sm whitespace-nowrap px-3 py-1.5 rounded-md bg-gray-700 text-white hover:bg-gray-800 disabled:opacity-50"
              >
                Cofnij ostatni wybór
              </button>
              <span className="text-xs text-amber-700 self-center">
                Aby wybrać za nieobecnego menedżera, kliknij zawodnika i użyj „Wybierz za menedżera”.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Szukaj zawodnika"
              className="px-3 py-2 text-sm border border-gray-300 rounded-md sm:col-span-2 lg:col-span-1"
            />
            <FilterCombo label="Liga" value={fLeague} options={distinct((p) => p.football_league)} onChange={setFLeague} />
            <FilterCombo label="Klub" value={fClub} options={distinct((p) => p.club)} onChange={setFClub} />
            <FilterCombo
              label="Pozycja"
              value={fPosition ? positionLabel(fPosition) : ''}
              options={distinct((p) => p.position).map(positionLabel)}
              onChange={(pl) => {
                const en = Object.keys(POSITION_PL).find((k) => POSITION_PL[k] === pl) || ''
                setFPosition(en)
              }}
            />
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="max-h-[560px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr className="text-left text-gray-600">
                    <th className="px-3 py-2 font-medium">Imię i Nazwisko</th>
                    <th className="px-3 py-2 font-medium">Liga</th>
                    <th className="px-3 py-2 font-medium">Klub</th>
                    <th className="px-3 py-2 font-medium">Pozycja</th>
                    <th className="px-3 py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlayers.map((p) => {
                    const pick = pickByPlayer.get(p.id)
                    const picked = !!pick
                    const pickedBy = pick ? managersByManagerId.get(pick.manager_id) : undefined
                    const isPending = pending === p.id
                    const canPick = status === 'live' && !picked && (myTurn || isAdmin)
                    return (
                      <tr
                        key={p.id}
                        className={`border-t border-gray-100 ${
                          picked ? 'bg-gray-50 text-gray-400' : isPending ? 'bg-[#29544D]/5' : 'hover:bg-gray-50'
                        } ${canPick ? 'cursor-pointer' : ''}`}
                        onClick={() => {
                          if (!canPick) return
                          setPending(isPending ? null : p.id)
                        }}
                      >
                        <td className={`px-3 py-2 font-medium ${picked ? 'line-through' : ''}`}>{`${p.name} ${p.surname}`.trim()}</td>
                        <td className="px-3 py-2">{p.football_league || '—'}</td>
                        <td className="px-3 py-2">{p.club || '—'}</td>
                        <td className="px-3 py-2">{positionLabel(p.position)}</td>
                        <td className="px-3 py-2 text-right whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 justify-end">
                          {canEdit && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                openEdit(p)
                              }}
                              title="Edytuj dane zawodnika"
                              className="px-2 py-1 rounded border border-gray-300 text-gray-600 text-xs hover:bg-gray-50"
                            >
                              ✎
                            </button>
                          )}
                          {picked ? (
                            <span className="text-xs italic">Wybrany przez {managerName(pickedBy)}</span>
                          ) : isPending ? (
                            <span className="inline-flex gap-1" onClick={(e) => e.stopPropagation()}>
                              {myTurn && (
                                <button
                                  onClick={() => onConfirmPick(p.id)}
                                  disabled={submitting}
                                  title="Potwierdź"
                                  className="px-5 py-1 min-w-[56px] rounded bg-[#29544D] text-white hover:bg-[#1f423c] disabled:opacity-50"
                                >
                                  ✓
                                </button>
                              )}
                              {isAdmin && !myTurn && (
                                <button
                                  onClick={() => onAdminPick(p.id)}
                                  disabled={submitting}
                                  className="px-2 py-1 rounded bg-amber-600 text-white text-xs hover:bg-amber-700 disabled:opacity-50"
                                >
                                  Wybierz za {managerName(onClockManager)}
                                </button>
                              )}
                              <button
                                onClick={() => setPending(null)}
                                title="Anuluj"
                                className="px-5 py-1 min-w-[56px] rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                              >
                                ✕
                              </button>
                            </span>
                          ) : null}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                  {filteredPlayers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-gray-400">
                        Brak zawodników pasujących do filtrów.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: optional chat + roster */}
        <div className="space-y-6">
          {sideTop}
          <Roster
            managers={managers}
            picks={picks}
            players={players}
            onClockSquadId={onClockSquadId}
            slotCount={slotCount}
          />
        </div>
      </div>

      {/* Add player (admin) */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !addingPlayer && setShowAdd(false)}>
          <div className="bg-white rounded-xl w-full max-w-md p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900">Dodaj zawodnika</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Imię i Nazwisko</label>
              <input
                value={addForm.fullName}
                onChange={(e) => setAddForm({ ...addForm, fullName: e.target.value })}
                placeholder="Imię i nazwisko"
                className="w-full px-3 py-2 text-sm text-gray-900 bg-gray-50 border border-gray-400 rounded-md placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#29544D] focus:border-[#29544D]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Klub</label>
              <input
                value={addForm.club}
                onChange={(e) => setAddForm({ ...addForm, club: e.target.value })}
                placeholder="Klub"
                className="w-full px-3 py-2 text-sm text-gray-900 bg-gray-50 border border-gray-400 rounded-md placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#29544D] focus:border-[#29544D]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Liga</label>
              <input
                value={addForm.footballLeague}
                onChange={(e) => setAddForm({ ...addForm, footballLeague: e.target.value })}
                placeholder="Liga (opcjonalnie)"
                className="w-full px-3 py-2 text-sm text-gray-900 bg-gray-50 border border-gray-400 rounded-md placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#29544D] focus:border-[#29544D]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pozycja</label>
              <select
                value={addForm.position}
                onChange={(e) => setAddForm({ ...addForm, position: e.target.value })}
                className="w-full px-3 py-2 text-sm text-gray-900 bg-gray-50 border border-gray-400 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#29544D] focus:border-[#29544D]"
              >
                {POSITION_OPTIONS_PL.map((pl) => (
                  <option key={pl} value={pl}>{pl}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setShowAdd(false)} disabled={addingPlayer} className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">
                Anuluj
              </button>
              <button onClick={submitAdd} disabled={addingPlayer} className="px-4 py-2 text-sm rounded-md bg-[#29544D] text-white hover:bg-[#1f423c] disabled:opacity-50">
                {addingPlayer ? 'Dodawanie…' : 'Dodaj'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit player (admin) — live detail change */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !savingEdit && setEditing(null)}>
          <div className="bg-white rounded-xl w-full max-w-md p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900">Edytuj dane zawodnika</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Imię i Nazwisko</label>
              <input
                value={editForm.fullName}
                onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                placeholder="Imię i nazwisko"
                className="w-full px-3 py-2 text-sm text-gray-900 bg-gray-50 border border-gray-400 rounded-md placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#29544D] focus:border-[#29544D]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Klub</label>
              <input
                value={editForm.club}
                onChange={(e) => setEditForm({ ...editForm, club: e.target.value })}
                placeholder="Klub"
                className="w-full px-3 py-2 text-sm text-gray-900 bg-gray-50 border border-gray-400 rounded-md placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#29544D] focus:border-[#29544D]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Liga</label>
              <input
                value={editForm.footballLeague}
                onChange={(e) => setEditForm({ ...editForm, footballLeague: e.target.value })}
                placeholder="Liga (opcjonalnie)"
                className="w-full px-3 py-2 text-sm text-gray-900 bg-gray-50 border border-gray-400 rounded-md placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#29544D] focus:border-[#29544D]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pozycja</label>
              <select
                value={editForm.position}
                onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                className="w-full px-3 py-2 text-sm text-gray-900 bg-gray-50 border border-gray-400 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#29544D] focus:border-[#29544D]"
              >
                {POSITION_OPTIONS_PL.map((pl) => (
                  <option key={pl} value={POSITION_EN_BY_PL[pl]}>{pl}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setEditing(null)} disabled={savingEdit} className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">
                Anuluj
              </button>
              <button onClick={submitEdit} disabled={savingEdit} className="px-4 py-2 text-sm rounded-md bg-[#29544D] text-white hover:bg-[#1f423c] disabled:opacity-50">
                {savingEdit ? 'Zapisywanie…' : 'Zapisz'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

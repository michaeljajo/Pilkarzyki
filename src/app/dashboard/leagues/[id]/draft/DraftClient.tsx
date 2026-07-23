'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import toast from 'react-hot-toast'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { leagueFlag } from '@/utils/league-flag'

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface DraftRow {
  id: string
  league_id: string
  status: 'setup' | 'live' | 'finished'
  total_rounds: number
  squad_size: number
  round: number
  pick_order: string[]
  current_queue: string[]
}

interface ManagerRow {
  squadId: string
  managerId: string
  teamName: string | null
  firstName: string
  lastName: string
  email: string
}

interface PlayerRow {
  id: string
  name: string
  surname: string
  club: string | null
  football_league: string | null
  position: string
}

interface PickRow {
  id: string
  squad_id: string
  manager_id: string
  player_id: string
  round: number
  pick_number: number
}

interface Snapshot {
  draft: DraftRow | null
  league: { id: string; name: string; maxManagers: number }
  managers: ManagerRow[]
  players: PlayerRow[]
  picks: PickRow[]
  onTheClockSquadId: string | null
  onTheClockManagerId: string | null
  access: { isAdmin: boolean; isManager: boolean; mySquadId: string | null; myTurn: boolean }
}

interface ChatMessage {
  id: string
  body: string
  isAdmin: boolean
  createdAt: string
  userId: string | null
  senderName: string
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

const POSITION_PL: Record<string, string> = {
  Defender: 'Obrońca',
  Midfielder: 'Pomocnik',
  Forward: 'Napastnik',
}

function positionLabel(pos: string): string {
  return POSITION_PL[pos] || pos
}

// Diacritics-insensitive normalisation ("gorka" matches "Górka").
function fold(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

// leagueFlag is shared with the squad-picking UI (see utils/league-flag).

function managerName(m: ManagerRow | undefined | null): string {
  if (!m) return '—'
  const full = [m.firstName, m.lastName].filter(Boolean).join(' ').trim()
  return m.teamName || full || m.email || 'Menedżer'
}

// ----------------------------------------------------------------------------
// Turn sound (synthesised — no asset needed)
// ----------------------------------------------------------------------------

function playTurnChime() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    const notes = [660, 880]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const start = ctx.currentTime + i * 0.18
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(start)
      osc.stop(start + 0.18)
    })
    setTimeout(() => ctx.close().catch(() => {}), 800)
  } catch {
    // Audio unavailable — the banner/notification still cover the alert.
  }
}

// ----------------------------------------------------------------------------
// Combobox filter with type-to-filter (for 500+ options)
// ----------------------------------------------------------------------------

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
    return options.filter(o => !q || fold(o).includes(q)).slice(0, 100)
  }, [options, query])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
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
              onChange={e => setQuery(e.target.value)}
              placeholder={`Szukaj ${label.toLowerCase()}...`}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
          </div>
          <button
            type="button"
            onClick={() => { onChange(''); setOpen(false); setQuery('') }}
            className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
          >
            Wszystkie
          </button>
          {filtered.map(o => (
            <button
              key={o}
              type="button"
              onClick={() => { onChange(o); setOpen(false); setQuery('') }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${o === value ? 'font-semibold text-[#29544D]' : 'text-gray-800'}`}
            >
              {o}
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-400">Brak wyników</div>
          )}
        </div>
      )}
    </div>
  )
}

// ----------------------------------------------------------------------------
// Main component
// ----------------------------------------------------------------------------

export function DraftClient({ leagueId }: { leagueId: string }) {
  const [snap, setSnap] = useState<Snapshot | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [fLeague, setFLeague] = useState('')
  const [fClub, setFClub] = useState('')
  const [fPosition, setFPosition] = useState('')

  // Pick flow
  const [pendingPlayerId, setPendingPlayerId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Admin setup order (array of squadIds)
  const [order, setOrder] = useState<string[]>([])
  const [confirmStart, setConfirmStart] = useState(false)
  const [confirmSkip, setConfirmSkip] = useState(false)

  // Chat
  const [chatInput, setChatInput] = useState('')

  // Add-player (admin)
  const [showAddPlayer, setShowAddPlayer] = useState(false)
  const [addForm, setAddForm] = useState({ fullName: '', footballLeague: '', club: '', position: 'Napastnik' })
  const [addingPlayer, setAddingPlayer] = useState(false)

  // Notifications
  const [notifStatus, setNotifStatus] = useState<NotificationPermission | 'unsupported'>('unsupported')
  const prevMyTurn = useRef(false)

  const supabase = useMemo(
    () =>
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } }
      ),
    []
  )

  const fetchSnapshot = useCallback(async () => {
    try {
      const res = await fetch(`/api/leagues/${leagueId}/draft`, { cache: 'no-store' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error || 'Nie udało się wczytać draftu.')
        return
      }
      const data: Snapshot = await res.json()
      setSnap(data)
      setError(null)
    } catch {
      setError('Nie udało się wczytać draftu.')
    } finally {
      setLoading(false)
    }
  }, [leagueId])

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/leagues/${leagueId}/draft/messages`, { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } catch {
      // non-fatal
    }
  }, [leagueId])

  // Initial load
  useEffect(() => {
    fetchSnapshot()
    fetchMessages()
  }, [fetchSnapshot, fetchMessages])

  // Notifications permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifStatus(Notification.permission)
    }
  }, [])

  // Realtime subscriptions -> refetch on any change
  const draftId = snap?.draft?.id
  useEffect(() => {
    if (!draftId) return
    const channel = supabase
      .channel(`draft-${draftId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drafts', filter: `id=eq.${draftId}` }, () => {
        fetchSnapshot()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'draft_picks', filter: `draft_id=eq.${draftId}` }, () => {
        fetchSnapshot()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'draft_messages', filter: `draft_id=eq.${draftId}` }, () => {
        fetchMessages()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, draftId, fetchSnapshot, fetchMessages])

  // Initialise the admin order from the manager list once (setup phase).
  useEffect(() => {
    if (snap?.draft?.status === 'setup' && snap.managers.length > 0) {
      setOrder(prev => {
        const valid = prev.filter(sid => snap.managers.some(m => m.squadId === sid))
        if (valid.length === snap.managers.length) return valid
        return snap.managers.map(m => m.squadId)
      })
    }
  }, [snap?.draft?.status, snap?.managers])

  // Turn notification: fire when myTurn transitions false -> true.
  useEffect(() => {
    const myTurn = !!snap?.access.myTurn
    if (myTurn && !prevMyTurn.current) {
      playTurnChime()
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification('TWOJA KOLEJ!', { body: 'Wybierz zawodnika w drafcie.' })
        } catch {
          // ignore
        }
      }
    }
    prevMyTurn.current = myTurn
  }, [snap?.access.myTurn])

  const requestNotifications = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    const perm = await Notification.requestPermission()
    setNotifStatus(perm)
  }

  // Derived data ------------------------------------------------------------

  const managersBySquad = useMemo(() => {
    const map = new Map<string, ManagerRow>()
    snap?.managers.forEach(m => map.set(m.squadId, m))
    return map
  }, [snap?.managers])

  const managersByManagerId = useMemo(() => {
    const map = new Map<string, ManagerRow>()
    snap?.managers.forEach(m => map.set(m.managerId, m))
    return map
  }, [snap?.managers])

  const pickByPlayer = useMemo(() => {
    const map = new Map<string, PickRow>()
    snap?.picks.forEach(p => map.set(p.player_id, p))
    return map
  }, [snap?.picks])

  const distinct = useCallback(
    (selector: (p: PlayerRow) => string | null) => {
      const set = new Set<string>()
      snap?.players.forEach(p => {
        const v = selector(p)
        if (v) set.add(v)
      })
      return Array.from(set).sort((a, b) => a.localeCompare(b, 'pl'))
    },
    [snap?.players]
  )

  const filteredPlayers = useMemo(() => {
    if (!snap) return []
    const q = fold(search)
    return snap.players.filter(p => {
      if (q && !fold(`${p.name} ${p.surname}`).includes(q)) return false
      if (fLeague && p.football_league !== fLeague) return false
      if (fClub && p.club !== fClub) return false
      if (fPosition && p.position !== fPosition) return false
      return true
    })
  }, [snap, search, fLeague, fClub, fPosition])

  const onClockManager = snap ? managersByManagerId.get(snap.onTheClockManagerId || '') : undefined
  const status = snap?.draft?.status
  const isAdmin = !!snap?.access.isAdmin
  const myTurn = !!snap?.access.myTurn

  // Actions -----------------------------------------------------------------

  const doAction = async (
    path: string,
    body?: Record<string, unknown>,
    successMsg?: string
  ) => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/leagues/${leagueId}/draft/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body || {}),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || 'Operacja nie powiodła się.')
        return false
      }
      if (successMsg) toast.success(successMsg)
      setPendingPlayerId(null)
      await fetchSnapshot()
      return true
    } catch {
      toast.error('Błąd połączenia.')
      return false
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirmPick = () => {
    if (!pendingPlayerId) return
    doAction('pick', { playerId: pendingPlayerId })
  }
  const handleAdminPick = () => {
    if (!pendingPlayerId) return
    doAction('admin-pick', { playerId: pendingPlayerId })
  }
  const handleStart = async () => {
    setConfirmStart(false)
    await doAction('start', { order }, 'Draft rozpoczęty!')
  }
  const handleSkip = async () => {
    setConfirmSkip(false)
    await doAction('skip', {}, 'Pominięto kolejkę.')
  }
  const handleUndo = () => doAction('undo', {}, 'Cofnięto ostatni wybór.')

  const handleAddPlayer = async () => {
    if (!addForm.fullName.trim() || !addForm.club.trim()) {
      toast.error('Podaj imię i nazwisko oraz klub.')
      return
    }
    setAddingPlayer(true)
    try {
      const res = await fetch(`/api/leagues/${leagueId}/draft/add-player`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || 'Nie udało się dodać zawodnika.')
        return
      }
      toast.success('Dodano zawodnika.')
      setShowAddPlayer(false)
      setAddForm({ fullName: '', footballLeague: '', club: '', position: 'Napastnik' })
      await fetchSnapshot()
    } catch {
      toast.error('Błąd połączenia.')
    } finally {
      setAddingPlayer(false)
    }
  }

  const sendMessage = async () => {
    const text = chatInput.trim()
    if (!text) return
    setChatInput('')
    try {
      const res = await fetch(`/api/leagues/${leagueId}/draft/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Nie udało się wysłać wiadomości.')
      } else {
        fetchMessages()
      }
    } catch {
      toast.error('Nie udało się wysłać wiadomości.')
    }
  }

  const moveOrder = (index: number, dir: -1 | 1) => {
    setOrder(prev => {
      const next = [...prev]
      const target = index + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  // Render ------------------------------------------------------------------

  if (loading) {
    return <div className="py-16 text-center text-gray-500">Wczytywanie draftu…</div>
  }
  if (error) {
    return <div className="py-16 text-center text-red-600">{error}</div>
  }
  if (!snap || !snap.draft) {
    return <div className="py-16 text-center text-gray-500">Brak draftu dla tej ligi.</div>
  }

  return (
    <div className="space-y-6">
      {/* Turn banner */}
      {status === 'live' && myTurn && (
        <div className="rounded-xl bg-[#29544D] text-white px-6 py-4 text-center text-xl font-bold shadow-lg animate-pulse">
          TWOJA KOLEJ!
        </div>
      )}

      {/* Header / status */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Draft</h1>
          {status === 'setup' && <p className="text-gray-600">Oczekiwanie na rozpoczęcie draftu</p>}
          {status === 'live' && (
            <p className="text-gray-600">
              Runda {snap.draft.round} z {snap.draft.total_rounds} · Teraz wybiera:{' '}
              <span className="font-semibold text-gray-900">{managerName(onClockManager)}</span>
            </p>
          )}
          {status === 'finished' && <p className="text-gray-600">Draft zakończony</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Admin: add a player at any time (even mid-draft) */}
          {isAdmin && status !== 'finished' && (
            <button
              onClick={() => setShowAddPlayer(true)}
              className="text-sm whitespace-nowrap px-3 py-2 rounded-md bg-[#29544D] text-white hover:bg-[#1f423c]"
            >
              + Dodaj zawodnika
            </button>
          )}

          {/* Notification opt-in */}
          {status !== 'finished' && notifStatus !== 'granted' && notifStatus !== 'unsupported' && (
            <button
              onClick={requestNotifications}
              className="text-sm px-3 py-2 rounded-md border border-[#29544D] text-[#29544D] hover:bg-[#29544D]/5"
            >
              Włącz powiadomienia, aby wiedzieć, kiedy nadejdzie Twoja kolej
            </button>
          )}
        </div>
      </div>

      {/* FINISHED banner + proceed CTA */}
      {status === 'finished' && (
        <div className="rounded-xl border border-[#29544D]/30 bg-[#29544D]/5 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Draft zakończony</h2>
            <p className="text-sm text-gray-600">
              Składy zostały przypisane do menedżerów i są rozpoznawane przez aplikację.
              {isAdmin && ' Możesz teraz wygenerować terminarz i rozpocząć rozgrywki.'}
            </p>
          </div>
          {isAdmin && (
            <a
              href={`/dashboard/admin/leagues/${leagueId}`}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg font-medium hover:opacity-90"
              style={{ flexShrink: 0, whiteSpace: 'nowrap', backgroundColor: '#29544D', color: '#ffffff' }}
            >
              Przejdź do zarządzania ligą
            </a>
          )}
        </div>
      )}

      {/* SETUP (admin) */}
      {status === 'setup' && (
        <SetupPanel
          isAdmin={isAdmin}
          managers={snap.managers}
          order={order}
          managersBySquad={managersBySquad}
          onMove={moveOrder}
          onStart={() => setConfirmStart(true)}
          submitting={submitting}
        />
      )}

      {/* LIVE / FINISHED */}
      {(status === 'live' || status === 'finished') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: player pool */}
          <div className="lg:col-span-2 space-y-4">
            {/* Admin controls */}
            {isAdmin && status === 'live' && (
              <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <span className="text-sm font-medium text-amber-800 self-center mr-2">Panel administratora:</span>
                <button
                  onClick={() => setConfirmSkip(true)}
                  disabled={submitting}
                  className="text-sm whitespace-nowrap px-3 py-1.5 rounded-md bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  Pomiń kolejkę
                </button>
                <button
                  onClick={handleUndo}
                  disabled={submitting || snap.picks.length === 0}
                  className="text-sm whitespace-nowrap px-3 py-1.5 rounded-md bg-gray-700 text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  Cofnij ostatni wybór
                </button>
                <span className="text-xs text-amber-700 self-center">
                  Aby wybrać za nieobecnego menedżera, kliknij zawodnika i użyj „Wybierz za menedżera”.
                </span>
              </div>
            )}

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Szukaj zawodnika"
                className="px-3 py-2 text-sm border border-gray-300 rounded-md sm:col-span-2 lg:col-span-1"
              />
              <FilterCombo label="Liga" value={fLeague} options={distinct(p => p.football_league)} onChange={setFLeague} />
              <FilterCombo label="Klub" value={fClub} options={distinct(p => p.club)} onChange={setFClub} />
              <FilterCombo
                label="Pozycja"
                value={fPosition ? positionLabel(fPosition) : ''}
                options={distinct(p => p.position).map(positionLabel)}
                onChange={pl => {
                  const en = Object.keys(POSITION_PL).find(k => POSITION_PL[k] === pl) || ''
                  setFPosition(en)
                }}
              />
            </div>

            {/* Player table */}
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
                    {filteredPlayers.map(p => {
                      const pick = pickByPlayer.get(p.id)
                      const picked = !!pick
                      const pickedBy = pick ? managersByManagerId.get(pick.manager_id) : undefined
                      const isPending = pendingPlayerId === p.id
                      const canPick = status === 'live' && !picked && (myTurn || isAdmin)

                      return (
                        <tr
                          key={p.id}
                          className={`border-t border-gray-100 ${
                            picked ? 'bg-gray-50 text-gray-400' : isPending ? 'bg-[#29544D]/5' : 'hover:bg-gray-50'
                          } ${canPick ? 'cursor-pointer' : ''}`}
                          onClick={() => {
                            if (!canPick) return
                            setPendingPlayerId(isPending ? null : p.id)
                          }}
                        >
                          <td className={`px-3 py-2 font-medium ${picked ? 'line-through' : ''}`}>{`${p.name} ${p.surname}`.trim()}</td>
                          <td className="px-3 py-2">{p.football_league || '—'}</td>
                          <td className="px-3 py-2">{p.club || '—'}</td>
                          <td className="px-3 py-2">{positionLabel(p.position)}</td>
                          <td className="px-3 py-2 text-right whitespace-nowrap">
                            {picked ? (
                              <span className="text-xs italic">Wybrany przez {managerName(pickedBy)}</span>
                            ) : isPending ? (
                              <span className="inline-flex gap-1" onClick={e => e.stopPropagation()}>
                                {myTurn && (
                                  <button
                                    onClick={handleConfirmPick}
                                    disabled={submitting}
                                    title="Potwierdź"
                                    className="px-5 py-1 min-w-[56px] rounded bg-[#29544D] text-white hover:bg-[#1f423c] disabled:opacity-50"
                                  >
                                    ✓
                                  </button>
                                )}
                                {isAdmin && !myTurn && (
                                  <button
                                    onClick={handleAdminPick}
                                    disabled={submitting}
                                    className="px-2 py-1 rounded bg-amber-600 text-white text-xs hover:bg-amber-700 disabled:opacity-50"
                                  >
                                    Wybierz za {managerName(onClockManager)}
                                  </button>
                                )}
                                <button
                                  onClick={() => setPendingPlayerId(null)}
                                  title="Anuluj"
                                  className="px-5 py-1 min-w-[56px] rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                                >
                                  ✕
                                </button>
                              </span>
                            ) : null}
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

          {/* Right: chat + board */}
          <div className="space-y-6">
            <Chat
              messages={messages}
              value={chatInput}
              onChange={setChatInput}
              onSend={sendMessage}
            />
            <DraftBoard
              managers={snap.managers}
              picks={snap.picks}
              players={snap.players}
              onClockSquadId={snap.onTheClockSquadId}
              squadSize={snap.draft.squad_size}
            />
          </div>
        </div>
      )}

      {/* Confirmations */}
      <ConfirmModal
        isOpen={confirmStart}
        onClose={() => setConfirmStart(false)}
        onConfirm={handleStart}
        title="Rozpocząć draft?"
        message="Po rozpoczęciu kolejność draftu zostanie zablokowana i menedżerowie zaczną wybierać zawodników."
        confirmText="Rozpocznij draft"
        variant="info"
        loading={submitting}
      />
      <ConfirmModal
        isOpen={confirmSkip}
        onClose={() => setConfirmSkip(false)}
        onConfirm={handleSkip}
        title="Pominąć kolejkę?"
        message={`Menedżer ${managerName(onClockManager)} zostanie przeniesiony na koniec bieżącej rundy.`}
        confirmText="Pomiń kolejkę"
        variant="warning"
        loading={submitting}
      />

      {/* Add-player modal (admin) */}
      {showAddPlayer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => !addingPlayer && setShowAddPlayer(false)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Dodaj zawodnika</h3>
            <p className="text-sm text-gray-500 mb-4">
              Zawodnik zostanie dodany do puli i będzie od razu dostępny do wyboru.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imię i Nazwisko *</label>
                <input
                  value={addForm.fullName}
                  onChange={e => setAddForm(f => ({ ...f, fullName: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                  placeholder="np. Robert Lewandowski"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Klub *</label>
                  <input
                    value={addForm.club}
                    onChange={e => setAddForm(f => ({ ...f, club: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pozycja *</label>
                  <select
                    value={addForm.position}
                    onChange={e => setAddForm(f => ({ ...f, position: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white"
                  >
                    <option value="Obrońca">Obrońca</option>
                    <option value="Pomocnik">Pomocnik</option>
                    <option value="Napastnik">Napastnik</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Liga</label>
                <input
                  value={addForm.footballLeague}
                  onChange={e => setAddForm(f => ({ ...f, footballLeague: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowAddPlayer(false)}
                disabled={addingPlayer}
                className="px-4 py-2 text-sm rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
              >
                Anuluj
              </button>
              <button
                onClick={handleAddPlayer}
                disabled={addingPlayer}
                className="px-4 py-2 text-sm rounded-md bg-[#29544D] text-white hover:bg-[#1f423c] disabled:opacity-50"
              >
                {addingPlayer ? 'Dodawanie…' : 'Dodaj'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ----------------------------------------------------------------------------
// Setup panel
// ----------------------------------------------------------------------------

function SetupPanel({
  isAdmin,
  managers,
  order,
  managersBySquad,
  onMove,
  onStart,
  submitting,
}: {
  isAdmin: boolean
  managers: ManagerRow[]
  order: string[]
  managersBySquad: Map<string, ManagerRow>
  onMove: (index: number, dir: -1 | 1) => void
  onStart: () => void
  submitting: boolean
}) {
  if (!isAdmin) {
    return (
      <div className="rounded-xl border border-gray-200 p-8 text-center">
        <p className="text-gray-600">Oczekiwanie na rozpoczęcie draftu przez administratora.</p>
        <p className="text-sm text-gray-400 mt-2">{managers.length} menedżerów gotowych.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Kolejność draftu</h2>
      <p className="text-sm text-gray-500 mb-4">
        Ustaw kolejność, w jakiej menedżerowie będą wybierać (ta sama kolejność w każdej rundzie).
      </p>
      <ol className="space-y-2">
        {order.map((squadId, i) => {
          const m = managersBySquad.get(squadId)
          return (
            <li key={squadId} className="flex items-center gap-3 p-2 rounded-md border border-gray-100 bg-gray-50">
              <span className="w-6 text-center font-semibold text-gray-500">{i + 1}</span>
              <span className="flex-1 text-gray-900">{managerName(m)}</span>
              <button
                onClick={() => onMove(i, -1)}
                disabled={i === 0}
                className="px-2 py-1 rounded bg-white border border-gray-300 text-gray-600 disabled:opacity-30"
              >
                ↑
              </button>
              <button
                onClick={() => onMove(i, 1)}
                disabled={i === order.length - 1}
                className="px-2 py-1 rounded bg-white border border-gray-300 text-gray-600 disabled:opacity-30"
              >
                ↓
              </button>
            </li>
          )
        })}
      </ol>
      <button
        onClick={onStart}
        disabled={submitting || order.length < 2}
        className="mt-5 px-5 py-2.5 rounded-lg bg-[#29544D] text-white font-medium hover:bg-[#1f423c] disabled:opacity-50"
      >
        Rozpocznij draft
      </button>
    </div>
  )
}

// ----------------------------------------------------------------------------
// Draft board
// ----------------------------------------------------------------------------

function DraftBoard({
  managers,
  picks,
  players,
  onClockSquadId,
  squadSize,
}: {
  managers: ManagerRow[]
  picks: PickRow[]
  players: PlayerRow[]
  onClockSquadId: string | null
  squadSize: number
}) {
  const playersById = useMemo(() => {
    const map = new Map<string, PlayerRow>()
    players.forEach(p => map.set(p.id, p))
    return map
  }, [players])

  const picksBySquad = useMemo(() => {
    const map = new Map<string, PickRow[]>()
    picks.forEach(p => {
      const arr = map.get(p.squad_id) || []
      arr.push(p)
      map.set(p.squad_id, arr)
    })
    map.forEach(arr => arr.sort((a, b) => a.pick_number - b.pick_number))
    return map
  }, [picks])

  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const toggle = (squadId: string) =>
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(squadId)) next.delete(squadId)
      else next.add(squadId)
      return next
    })

  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">Składy</h2>
      <div className="space-y-3 max-h-[420px] overflow-auto">
        {managers.map(m => {
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
                  {mp.length}/{squadSize}
                  {onClock && (
                    <>
                      {' '}
                      <span className="ml-1 text-[#29544D] font-semibold">teraz wybiera</span>
                    </>
                  )}
                </span>
              </button>
              {isOpen && mp.length === 0 && (
                <p className="mt-2 text-xs text-gray-400">Brak wyborów.</p>
              )}
              {isOpen && mp.length > 0 && (
                <ul className="mt-2 space-y-0.5">
                  {mp.map(pick => {
                    const pl = playersById.get(pick.player_id)
                    return (
                      <li key={pick.id} className="text-xs text-gray-600 flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium text-gray-800">{pl ? `${pl.name} ${pl.surname}` : '—'}</span>
                        {pl?.club && <span className="text-gray-500">{pl.club}</span>}
                        {pl && leagueFlag(pl.football_league) && (
                          <span title={pl.football_league || ''}>{leagueFlag(pl.football_league)}</span>
                        )}
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

// ----------------------------------------------------------------------------
// Chat
// ----------------------------------------------------------------------------

function Chat({
  messages,
  value,
  onChange,
  onSend,
}: {
  messages: ChatMessage[]
  value: string
  onChange: (v: string) => void
  onSend: () => void
}) {
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="rounded-xl border border-gray-200 p-4 flex flex-col h-[360px]">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">Czat</h2>
      <div className="flex-1 overflow-auto space-y-2 pr-1">
        {messages.map(m => (
          <div key={m.id} className="text-sm">
            <span className={`font-medium ${m.isAdmin ? 'text-[#29544D]' : 'text-gray-900'}`}>{m.senderName}</span>
            {m.isAdmin && (
              <span className="ml-1 text-[10px] uppercase bg-[#29544D] text-white px-1.5 py-0.5 rounded">Admin</span>
            )}
            <span className="text-gray-400 text-xs ml-2">
              {new Date(m.createdAt).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <div className="text-gray-700">{m.body}</div>
          </div>
        ))}
        {messages.length === 0 && <p className="text-sm text-gray-400">Brak wiadomości.</p>}
        <div ref={endRef} />
      </div>
      <div className="mt-3 flex gap-2">
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') onSend()
          }}
          placeholder="Napisz wiadomość…"
          maxLength={500}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md"
          style={{ minWidth: 0 }}
        />
        <button
          onClick={onSend}
          className="px-5 py-2 text-sm rounded-md hover:opacity-90"
          style={{ flexShrink: 0, whiteSpace: 'nowrap', backgroundColor: '#29544D', color: '#ffffff' }}
        >
          Wyślij
        </button>
      </div>
    </div>
  )
}

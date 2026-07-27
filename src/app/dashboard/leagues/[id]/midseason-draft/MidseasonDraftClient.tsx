'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import toast from 'react-hot-toast'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { ArrowUp, ArrowDown, Check, Clock, Play, RotateCcw, SkipForward, Trophy } from 'lucide-react'

interface DraftRow {
  id: string
  league_id: string
  kind: string
  status: 'drops' | 'setup' | 'live' | 'finished'
  round: number
  pick_order: string[]
  current_queue: string[]
  pick_quotas: Record<string, number>
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
  manager_id: string | null
}
interface DropRow { id: string; squad_id: string; manager_id: string; player_id: string }
interface PickRow { id: string; squad_id: string; manager_id: string; player_id: string; round: number; pick_number: number }

interface Snapshot {
  draft: DraftRow | null
  league: { id: string; name: string; isActive: boolean }
  managers: ManagerRow[]
  players: PlayerRow[]
  drops: DropRow[]
  picks: PickRow[]
  onTheClockSquadId: string | null
  onTheClockManagerId: string | null
  access: { isAdmin: boolean; isManager: boolean; mySquadId: string | null; myTurn: boolean }
}

function managerName(m: ManagerRow | undefined): string {
  if (!m) return 'Menedżer'
  return m.teamName || `${m.firstName} ${m.lastName}`.trim() || m.email || 'Menedżer'
}

export default function MidseasonDraftClient({ leagueId }: { leagueId: string }) {
  const [snap, setSnap] = useState<Snapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [order, setOrder] = useState<string[]>([])
  const [selectedPoolPlayer, setSelectedPoolPlayer] = useState('')
  const [confirmClose, setConfirmClose] = useState(false)
  const [confirmStart, setConfirmStart] = useState(false)

  const supabase = useMemo(
    () =>
      createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        auth: { persistSession: false, autoRefreshToken: false },
      }),
    []
  )

  const fetchSnapshot = useCallback(async () => {
    try {
      const res = await fetch(`/api/leagues/${leagueId}/midseason-draft`, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Nie udało się wczytać draftu.')
        return
      }
      setSnap(data)
      setError(null)
    } catch {
      setError('Nie udało się wczytać draftu.')
    } finally {
      setLoading(false)
    }
  }, [leagueId])

  useEffect(() => {
    fetchSnapshot()
  }, [fetchSnapshot])

  // Realtime: any change to this league's draft / picks / drops → refetch.
  const draftId = snap?.draft?.id
  useEffect(() => {
    const channel = supabase
      .channel(`midseason-draft-${leagueId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drafts', filter: `league_id=eq.${leagueId}` }, () => fetchSnapshot())
    if (draftId) {
      channel
        .on('postgres_changes', { event: '*', schema: 'public', table: 'draft_picks', filter: `draft_id=eq.${draftId}` }, () => fetchSnapshot())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'draft_drops', filter: `draft_id=eq.${draftId}` }, () => fetchSnapshot())
    }
    channel.subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, leagueId, draftId, fetchSnapshot])

  // Keep the setup order seeded with the participant squads.
  const participants = useMemo(() => {
    const q = snap?.draft?.pick_quotas || {}
    return Object.entries(q).filter(([, n]) => (n as number) > 0).map(([sid]) => sid)
  }, [snap])

  useEffect(() => {
    if (snap?.draft?.status === 'setup') {
      setOrder((prev) => {
        const valid = prev.filter((sid) => participants.includes(sid))
        const missing = participants.filter((sid) => !prev.includes(sid))
        return [...valid, ...missing]
      })
    }
  }, [snap?.draft?.status, participants])

  // Dedicated drop toggle: does NOT flip the global busy flag (so other rows stay
  // interactive) and returns success so the row can show its own saved/failed cue.
  const toggleDrop = useCallback(
    async (playerId: string, wasDropped: boolean): Promise<boolean> => {
      try {
        const res = await fetch(`/api/leagues/${leagueId}/midseason-draft/drops`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId, action: wasDropped ? 'remove' : 'add' }),
        })
        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error || 'Nie udało się zapisać wyboru.')
          return false
        }
        await fetchSnapshot()
        return true
      } catch {
        toast.error('Błąd sieci — wybór nie został zapisany.')
        return false
      }
    },
    [leagueId, fetchSnapshot]
  )

  async function post(path: string, body?: unknown): Promise<boolean> {
    setBusy(true)
    try {
      const res = await fetch(`/api/leagues/${leagueId}/midseason-draft${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Operacja nie powiodła się.')
        return false
      }
      await fetchSnapshot()
      return true
    } catch {
      toast.error('Błąd sieci.')
      return false
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#29544D]" />
      </div>
    )
  }
  if (error && !snap) {
    return <div className="max-w-3xl mx-auto p-6 text-red-600">{error}</div>
  }
  if (!snap) return null

  const { draft, managers, players, drops, picks, access } = snap
  const status = draft?.status ?? null
  const myManagerId = managers.find((m) => m.squadId === access.mySquadId)?.managerId ?? null
  const pickedIds = new Set(picks.map((p) => p.player_id))

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Draft w trakcie sezonu</h1>
        <p className="text-sm text-gray-600 mt-1">{snap.league.name}</p>
      </div>

      {/* No draft / finished → admin can open a new one */}
      {(!draft || status === 'finished') && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          {status === 'finished' && (
            <div className="flex items-center gap-2 text-green-700">
              <Trophy size={20} />
              <span className="font-semibold">Poprzedni draft zakończony.</span>
            </div>
          )}
          {!draft && <p className="text-gray-600">Brak aktywnego draftu w trakcie sezonu.</p>}
          {access.isAdmin ? (
            <button
              onClick={() => post('/create')}
              disabled={busy}
              className="px-4 py-2 rounded-lg bg-[#29544D] text-white font-semibold hover:bg-[#1f3d37] disabled:opacity-50"
            >
              Rozpocznij nowy draft (okno zwolnień)
            </button>
          ) : (
            <p className="text-sm text-gray-500">Poczekaj, aż administrator rozpocznie draft.</p>
          )}
        </div>
      )}

      {/* DROPS phase */}
      {status === 'drops' && (
        <DropsPhase
          players={players}
          drops={drops}
          managers={managers}
          myManagerId={myManagerId}
          isManager={access.isManager}
          isAdmin={access.isAdmin}
          busy={busy}
          onToggle={toggleDrop}
          onCloseDrops={() => setConfirmClose(true)}
        />
      )}

      {/* SETUP phase (ordering) */}
      {status === 'setup' && (
        <SetupPhase
          order={order}
          managers={managers}
          quotas={draft!.pick_quotas}
          isAdmin={access.isAdmin}
          busy={busy}
          onMove={(idx, dir) => {
            setOrder((prev) => {
              const next = [...prev]
              const j = dir === 'up' ? idx - 1 : idx + 1
              if (j < 0 || j >= next.length) return prev
              ;[next[idx], next[j]] = [next[j], next[idx]]
              return next
            })
          }}
          onStart={() => setConfirmStart(true)}
        />
      )}

      {/* LIVE phase */}
      {status === 'live' && (
        <LivePhase
          snap={snap}
          players={players}
          pickedIds={pickedIds}
          selectedPoolPlayer={selectedPoolPlayer}
          setSelectedPoolPlayer={setSelectedPoolPlayer}
          busy={busy}
          onPick={(playerId) => post('/action', { action: 'pick', playerId })}
          onAdminPick={(playerId) => post('/action', { action: 'admin-pick', playerId })}
          onSkip={() => post('/action', { action: 'skip' })}
          onUndo={() => post('/action', { action: 'undo' })}
        />
      )}

      <ConfirmModal
        isOpen={confirmClose}
        onClose={() => setConfirmClose(false)}
        onConfirm={async () => {
          setConfirmClose(false)
          await post('/close-drops')
        }}
        title="Zamknij okno zwolnień"
        message="Zwolnieni zawodnicy trafią do puli, a każdy menedżer otrzyma tyle wyborów, ilu zawodników zwolnił. Tej operacji nie można cofnąć."
        confirmText="Zamknij okno"
        loading={busy}
      />
      <ConfirmModal
        isOpen={confirmStart}
        onClose={() => setConfirmStart(false)}
        onConfirm={async () => {
          setConfirmStart(false)
          await post('/start', { order })
        }}
        title="Rozpocznij draft"
        message="Draft ruszy w ustalonej kolejności. Menedżerowie będą wybierać zawodników z puli."
        confirmText="Rozpocznij"
        variant="info"
        loading={busy}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------

function playerLabel(p: PlayerRow) {
  const meta = [p.club, p.football_league].filter(Boolean).join(', ')
  return `${p.name} ${p.surname}${meta ? ` — ${meta}` : ''} (${p.position})`
}

function DropsPhase({
  players, drops, managers, myManagerId, isManager, isAdmin, busy, onToggle, onCloseDrops,
}: {
  players: PlayerRow[]
  drops: DropRow[]
  managers: ManagerRow[]
  myManagerId: string | null
  isManager: boolean
  isAdmin: boolean
  busy: boolean
  onToggle: (playerId: string, wasDropped: boolean) => Promise<boolean>
  onCloseDrops: () => void
}) {
  const serverMyDrops = new Set(drops.filter((d) => d.manager_id === myManagerId).map((d) => d.player_id))
  const mySquad = players.filter((p) => p.manager_id === myManagerId)
  const dropsByManager = new Map<string, number>()
  drops.forEach((d) => dropsByManager.set(d.manager_id, (dropsByManager.get(d.manager_id) || 0) + 1))

  // Optimistic overrides so a tick flips instantly; cleared once the server
  // snapshot (refetched inside onToggle) already reflects the change.
  const [override, setOverride] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState<Set<string>>(new Set())

  const isDropped = (id: string) => override[id] ?? serverMyDrops.has(id)
  const myDropCount = mySquad.filter((p) => isDropped(p.id)).length

  async function handleToggle(id: string) {
    const wasDropped = isDropped(id)
    setOverride((o) => ({ ...o, [id]: !wasDropped }))
    setSaving((s) => new Set(s).add(id))
    const ok = await onToggle(id, wasDropped)
    setSaving((s) => {
      const n = new Set(s)
      n.delete(id)
      return n
    })
    setOverride((o) => {
      const n = { ...o }
      delete n[id]
      return n
    })
    if (ok) toast.success(!wasDropped ? 'Zwolnienie zapisane' : 'Cofnięto zwolnienie')
  }

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        Okno zwolnień jest otwarte. Zaznacz zawodników, których chcesz zwolnić — otrzymasz tyle
        wyborów w draftcie, ilu zawodników zwolnisz.{' '}
        <strong>Wybory zapisują się automatycznie — nie ma przycisku zatwierdzania.</strong> Poczekaj,
        aż administrator zamknie okno zwolnień.
      </div>

      {isManager && myManagerId && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h2 className="font-semibold text-gray-900 mb-3">
            Twój skład — zwolnisz {myDropCount} {myDropCount === 1 ? 'zawodnika' : 'zawodników'}
          </h2>
          <div className="space-y-2">
            {mySquad.map((p) => {
              const dropped = isDropped(p.id)
              const isSaving = saving.has(p.id)
              return (
                <label
                  key={p.id}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer border ${
                    dropped ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={dropped}
                    disabled={isSaving}
                    onChange={() => handleToggle(p.id)}
                    className="w-4 h-4"
                  />
                  <span className={`text-sm flex-1 ${dropped ? 'text-red-800 line-through' : 'text-gray-800'}`}>
                    {playerLabel(p)}
                  </span>
                  {isSaving ? (
                    <span className="text-xs text-gray-400">Zapisywanie…</span>
                  ) : dropped ? (
                    <span className="text-xs text-red-600 inline-flex items-center gap-1">
                      <Check size={12} /> zwolniony
                    </span>
                  ) : null}
                </label>
              )
            })}
            {mySquad.length === 0 && <p className="text-sm text-gray-500">Brak zawodników w składzie.</p>}
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h2 className="font-semibold text-gray-900 mb-3">Postęp zwolnień</h2>
        <ul className="space-y-1 text-sm">
          {managers.map((m) => (
            <li key={m.squadId} className="flex justify-between">
              <span className="text-gray-700">{managerName(m)}</span>
              <span className="text-gray-500">{dropsByManager.get(m.managerId) || 0} zwolnień</span>
            </li>
          ))}
        </ul>
        {isAdmin && (
          <button
            onClick={onCloseDrops}
            disabled={busy || drops.length === 0}
            className="mt-4 px-4 py-2 rounded-lg bg-[#29544D] text-white font-semibold hover:bg-[#1f3d37] disabled:opacity-50"
          >
            Zamknij okno zwolnień
          </button>
        )}
      </div>
    </div>
  )
}

function SetupPhase({
  order, managers, quotas, isAdmin, busy, onMove, onStart,
}: {
  order: string[]
  managers: ManagerRow[]
  quotas: Record<string, number>
  isAdmin: boolean
  busy: boolean
  onMove: (idx: number, dir: 'up' | 'down') => void
  onStart: () => void
}) {
  const byId = new Map(managers.map((m) => [m.squadId, m]))
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
      <div>
        <h2 className="font-semibold text-gray-900">Kolejność draftu</h2>
        <p className="text-sm text-gray-600">
          Ułóż kolejność wybierania (domyślnie wg zwolnień; użyj strzałek dla dogrywek/remisów).
        </p>
      </div>
      <ol className="space-y-2">
        {order.map((sid, idx) => (
          <li key={sid} className="flex items-center justify-between gap-3 p-2 rounded-lg border border-gray-200">
            <span className="text-sm text-gray-800">
              <span className="font-semibold text-gray-500 mr-2">{idx + 1}.</span>
              {managerName(byId.get(sid))}
              <span className="text-gray-500"> — {quotas[sid] || 0} wyborów</span>
            </span>
            {isAdmin && (
              <div className="flex gap-1">
                <button onClick={() => onMove(idx, 'up')} disabled={busy || idx === 0} className="p-1.5 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50">
                  <ArrowUp size={14} />
                </button>
                <button onClick={() => onMove(idx, 'down')} disabled={busy || idx === order.length - 1} className="p-1.5 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50">
                  <ArrowDown size={14} />
                </button>
              </div>
            )}
          </li>
        ))}
      </ol>
      {isAdmin ? (
        <button
          onClick={onStart}
          disabled={busy || order.length < 2}
          className="px-4 py-2 rounded-lg bg-[#29544D] text-white font-semibold hover:bg-[#1f3d37] disabled:opacity-50 inline-flex items-center gap-2"
        >
          <Play size={16} /> Rozpocznij draft
        </button>
      ) : (
        <p className="text-sm text-gray-500">Poczekaj, aż administrator rozpocznie draft.</p>
      )}
    </div>
  )
}

function LivePhase({
  snap, players, pickedIds, selectedPoolPlayer, setSelectedPoolPlayer, busy, onPick, onAdminPick, onSkip, onUndo,
}: {
  snap: Snapshot
  players: PlayerRow[]
  pickedIds: Set<string>
  selectedPoolPlayer: string
  setSelectedPoolPlayer: (v: string) => void
  busy: boolean
  onPick: (playerId: string) => void
  onAdminPick: (playerId: string) => void
  onSkip: () => void
  onUndo: () => void
}) {
  const { draft, managers, picks, access, onTheClockSquadId } = snap
  const onClock = managers.find((m) => m.squadId === onTheClockSquadId)
  const pool = players.filter((p) => p.manager_id === null && !pickedIds.has(p.id))
  const quotas = draft?.pick_quotas || {}

  return (
    <div className="space-y-5">
      <div className={`rounded-xl p-4 border ${access.myTurn ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-white'}`}>
        <div className="flex items-center gap-2">
          <Clock size={18} className={access.myTurn ? 'text-green-600' : 'text-gray-500'} />
          <span className="font-semibold text-gray-900">
            Runda {draft?.round}. Na zegarze: {managerName(onClock)}
            {access.myTurn && ' — Twoja kolej!'}
          </span>
        </div>
      </div>

      {/* Pool */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h2 className="font-semibold text-gray-900 mb-3">Dostępni zawodnicy ({pool.length})</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
          {pool.map((p) => {
            const selected = selectedPoolPlayer === p.id
            const canPick = access.myTurn || access.isAdmin
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPoolPlayer(selected ? '' : p.id)}
                disabled={!canPick}
                className={`text-left p-2.5 rounded-lg border text-sm transition-colors ${
                  selected ? 'border-[#29544D] bg-[#29544D]/10' : 'border-gray-200 hover:border-gray-300'
                } ${!canPick ? 'opacity-60 cursor-default' : ''}`}
              >
                {playerLabel(p)}
              </button>
            )
          })}
          {pool.length === 0 && <p className="text-sm text-gray-500">Pula jest pusta.</p>}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {access.myTurn && (
            <button
              onClick={() => selectedPoolPlayer && onPick(selectedPoolPlayer)}
              disabled={busy || !selectedPoolPlayer}
              className="px-4 py-2 rounded-lg bg-[#29544D] text-white font-semibold hover:bg-[#1f3d37] disabled:opacity-50 inline-flex items-center gap-2"
            >
              <Check size={16} /> Wybierz zawodnika
            </button>
          )}
          {access.isAdmin && (
            <>
              <button
                onClick={() => selectedPoolPlayer && onAdminPick(selectedPoolPlayer)}
                disabled={busy || !selectedPoolPlayer}
                className="px-4 py-2 rounded-lg bg-navy-600 bg-[#061852] text-white font-semibold hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-2"
              >
                <Check size={16} /> Wybierz za menedżera
              </button>
              <button onClick={onSkip} disabled={busy} className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 inline-flex items-center gap-2">
                <SkipForward size={16} /> Pomiń
              </button>
              <button onClick={onUndo} disabled={busy} className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 inline-flex items-center gap-2">
                <RotateCcw size={16} /> Cofnij
              </button>
            </>
          )}
        </div>
      </div>

      {/* Remaining quotas + recent picks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Pozostałe wybory</h3>
          <ul className="space-y-1 text-sm">
            {managers
              .filter((m) => (quotas[m.squadId] || 0) >= 0 && m.squadId in quotas)
              .map((m) => (
                <li key={m.squadId} className="flex justify-between">
                  <span className="text-gray-700">{managerName(m)}</span>
                  <span className="text-gray-500">{quotas[m.squadId] || 0}</span>
                </li>
              ))}
          </ul>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Ostatnie wybory</h3>
          <ul className="space-y-1 text-sm">
            {[...picks].reverse().slice(0, 8).map((pick) => {
              const m = managers.find((mm) => mm.squadId === pick.squad_id)
              const pl = players.find((pp) => pp.id === pick.player_id)
              return (
                <li key={pick.id} className="flex justify-between">
                  <span className="text-gray-700">#{pick.pick_number} {managerName(m)}</span>
                  <span className="text-gray-500">{pl ? `${pl.name} ${pl.surname}` : '—'}</span>
                </li>
              )
            })}
            {picks.length === 0 && <li className="text-gray-500">Brak wyborów.</li>}
          </ul>
        </div>
      </div>
    </div>
  )
}

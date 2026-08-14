'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import toast from 'react-hot-toast'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { DraftLiveBoard } from '@/components/draft/DraftLiveBoard'
import { DraftChat, DraftChatMessage } from '@/components/draft/DraftChat'
import { DelegationPanel } from '@/components/draft/DelegationPanel'
import { type Delegation, resolveActingForSquadId } from '@/lib/draft-delegations'

// How often to re-check the draft when realtime has not pushed anything. Fast
// enough that a pick lands before the next manager is confused, cheap enough
// for a full room: ~16 clients on a diffed snapshot is a few requests a second.
const POLL_INTERVAL_MS = 4000

// Grace period before the "live connection down" notice is allowed to appear.
const REALTIME_GRACE_MS = 8000

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
  delegations: Delegation[]
  onTheClockSquadId: string | null
  onTheClockManagerId: string | null
  access: {
    isAdmin: boolean
    isManager: boolean
    mySquadId: string | null
    myUserId: string | null
    myTurn: boolean
  }
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

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
// Main component
// ----------------------------------------------------------------------------

export function DraftClient({ leagueId }: { leagueId: string }) {
  const [snap, setSnap] = useState<Snapshot | null>(null)
  const [messages, setMessages] = useState<DraftChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Pick flow
  const [submitting, setSubmitting] = useState(false)

  // Admin setup order (array of squadIds)
  const [order, setOrder] = useState<string[]>([])
  const [confirmStart, setConfirmStart] = useState(false)
  const [confirmSkip, setConfirmSkip] = useState(false)

  // Chat
  const [chatInput, setChatInput] = useState('')

  // Notifications
  const [notifStatus, setNotifStatus] = useState<NotificationPermission | 'unsupported'>('unsupported')
  const prevMyTurn = useRef(false)

  // Whether the realtime channel is actually open. Drives the live/refresh
  // indicator so a silent socket is visible on screen instead of looking like
  // a draft where nobody is picking.
  const [realtimeOk, setRealtimeOk] = useState(false)
  // The channel takes a moment to open, and a warning that appears on every
  // load and then vanishes is just noise. Only start telling the truth about
  // the socket once it has had a fair chance to connect.
  const [graceElapsed, setGraceElapsed] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setGraceElapsed(true), REALTIME_GRACE_MS)
    return () => clearTimeout(t)
  }, [])

  const supabase = useMemo(
    () =>
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } }
      ),
    []
  )

  // The snapshot is polled as well as pushed (see the polling effect below), so
  // it arrives far more often than it actually changes. Committing an
  // unchanged snapshot would hand DraftLiveBoard fresh array identities every
  // few seconds and re-render the whole board -- including the player pool --
  // for nothing. Compare first, set only on a real change.
  const snapSigRef = useRef('')
  const msgSigRef = useRef('')

  const fetchSnapshot = useCallback(async () => {
    try {
      const res = await fetch(`/api/leagues/${leagueId}/draft`, { cache: 'no-store' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error || 'Nie udało się wczytać draftu.')
        return
      }
      const data: Snapshot = await res.json()
      const sig = JSON.stringify(data)
      if (sig !== snapSigRef.current) {
        snapSigRef.current = sig
        setSnap(data)
      }
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
        const next = data.messages || []
        const sig = JSON.stringify(next)
        if (sig !== msgSigRef.current) {
          msgSigRef.current = sig
          setMessages(next)
        }
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
  const draftStatus = snap?.draft?.status
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'draft_delegations', filter: `draft_id=eq.${draftId}` }, () => {
        fetchSnapshot()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'draft_messages', filter: `draft_id=eq.${draftId}` }, () => {
        fetchMessages()
      })
      // subscribe() used to be called bare, which swallowed the reason a
      // channel never opened. The socket can fail for reasons the code cannot
      // see -- a proxy refusing the upgrade, a missing anon key in the
      // deployed env, a sleeping laptop dropping the connection -- and the
      // screen simply went quiet. Say so, and let the poll below carry it.
      .subscribe((status, err) => {
        setRealtimeOk(status === 'SUBSCRIBED')
        if (status !== 'SUBSCRIBED') {
          console.warn(`[draft] realtime channel ${status}`, err ?? '')
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, draftId, fetchSnapshot, fetchMessages])

  // Safety net. Realtime is the fast path, not the only path: whenever it is
  // down the draft has to keep moving anyway, so poll while the draft is open
  // and this tab is actually on screen. Snapshots are diffed before they are
  // committed, so a poll that finds nothing new costs one request and no
  // re-render. Hidden tabs are skipped and caught up on the way back, which
  // also covers a laptop waking from sleep with a dead socket.
  useEffect(() => {
    if (!draftId || draftStatus === 'finished') return

    const refetch = () => {
      if (document.visibilityState !== 'visible') return
      fetchSnapshot()
      fetchMessages()
    }
    const onWake = () => {
      if (document.visibilityState === 'visible') refetch()
    }

    const interval = setInterval(refetch, POLL_INTERVAL_MS)
    document.addEventListener('visibilitychange', onWake)
    window.addEventListener('focus', onWake)
    window.addEventListener('online', onWake)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onWake)
      window.removeEventListener('focus', onWake)
      window.removeEventListener('online', onWake)
    }
  }, [draftId, draftStatus, fetchSnapshot, fetchMessages])

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

  const onClockManager = snap ? managersByManagerId.get(snap.onTheClockManagerId || '') : undefined

  // Who picks after the current manager. The queue holds the remainder of the
  // current round; when it runs out the next round restarts from pick_order.
  // Past the final round there is no next pick, so show nothing rather than
  // wrapping around to the top of the order.
  const nextSquadId = useMemo(() => {
    const draft = snap?.draft
    if (!draft || draft.status !== 'live') return null
    const queue = draft.current_queue || []
    if (queue.length > 1) return queue[1]
    return draft.round < draft.total_rounds ? draft.pick_order?.[0] ?? null : null
  }, [snap?.draft])
  const status = snap?.draft?.status
  const isAdmin = !!snap?.access.isAdmin
  const myTurn = !!snap?.access.myTurn

  // The squad I am standing in for right now, if any (only while it is on the
  // clock). Authorisation is the RPC's job; this only drives the UI.
  const actingForSquadId =
    status === 'live'
      ? resolveActingForSquadId({
          delegations: snap?.delegations || [],
          onClockSquadId: snap?.onTheClockSquadId,
          myUserId: snap?.access.myUserId,
          mySquadId: snap?.access.mySquadId,
        })
      : null
  const actingForName = actingForSquadId
    ? managerName(managersBySquad.get(actingForSquadId))
    : ''

  // Fires when it becomes my move — my own turn, or the turn of a squad I am
  // standing in for.
  useEffect(() => {
    const mine = !!snap?.access.myTurn
    const myMove = mine || !!actingForName
    if (myMove && !prevMyTurn.current) {
      playTurnChime()
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(mine ? 'TWOJA KOLEJ!' : 'KOLEJ ZASTĘPSTWA!', {
            body: mine ? 'Wybierz zawodnika w drafcie.' : `Wybierz zawodnika za: ${actingForName}.`,
          })
        } catch {
          // ignore
        }
      }
    }
    prevMyTurn.current = myMove
  }, [snap?.access.myTurn, actingForName])

  const requestNotifications = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    const perm = await Notification.requestPermission()
    setNotifStatus(perm)
  }


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
      await fetchSnapshot()
      return true
    } catch {
      toast.error('Błąd połączenia.')
      return false
    } finally {
      setSubmitting(false)
    }
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

  const handleSetDelegate = async (squadId: string, delegateUserId: string | null) => {
    try {
      const res = await fetch(`/api/leagues/${leagueId}/draft-delegation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'preseason', squadId, delegateUserId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || 'Nie udało się zapisać zastępstwa.')
        return false
      }
      toast.success(delegateUserId ? 'Zastępca wyznaczony.' : 'Zastępstwo odwołane.')
      await fetchSnapshot()
      return true
    } catch {
      toast.error('Błąd połączenia.')
      return false
    }
  }

  // Add / edit handlers passed to the shared board (which owns the modals).
  const onAddPlayerBoard = async (form: {
    fullName: string
    footballLeague: string
    club: string
    position: string
  }): Promise<boolean> => {
    try {
      const res = await fetch(`/api/leagues/${leagueId}/draft/add-player`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || 'Nie udało się dodać zawodnika.')
        return false
      }
      toast.success('Dodano zawodnika.')
      await fetchSnapshot()
      return true
    } catch {
      toast.error('Błąd połączenia.')
      return false
    }
  }

  const onEditPlayerBoard = async (
    playerId: string,
    form: { fullName: string; club: string; footballLeague: string; position: string }
  ): Promise<boolean> => {
    try {
      const res = await fetch(`/api/leagues/${leagueId}/draft-edit-player`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, ...form }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || 'Nie udało się zapisać zmian.')
        return false
      }
      toast.success('Zapisano zmiany zawodnika.')
      await fetchSnapshot()
      return true
    } catch {
      toast.error('Błąd połączenia.')
      return false
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

  // Shared between the setup header and the board's action bar, so the opt-in
  // has exactly one definition wherever it happens to be shown.
  const notifyButton =
    status !== 'finished' && notifStatus !== 'granted' && notifStatus !== 'unsupported' ? (
      <button
        onClick={requestNotifications}
        title="Włącz powiadomienia, aby wiedzieć, kiedy nadejdzie Twoja kolej"
        className="text-sm whitespace-nowrap px-3 py-2 rounded-md border border-[#29544D] text-[#29544D] hover:bg-[#29544D]/5"
      >
        <span className="md:hidden">🔔</span>
        <span className="hidden md:inline">🔔 Włącz powiadomienia</span>
      </button>
    ) : null

  return (
    <div className="space-y-6">
      {/* The turn banner lives in DraftLiveBoard, not here. It used to be in
          both, so it rendered twice. The board's copy is the one to keep: it is
          sized for the phone layout and counted in the one-viewport height
          budget, whereas this one sat outside the board and pushed it down. */}

      {/* No page title while the board is up: the takeover header already reads
          "Draft — <liga>", and on a phone a second "Draft" heading plus its own
          button row cost ~100px off a screen the board sizes to exactly one
          viewport — enough to push the bottom tab bar out of sight. During
          setup there is no board yet, so the status line still needs a home. */}
      {status === 'setup' && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Draft</h1>
            <p className="text-gray-600">Oczekiwanie na rozpoczęcie draftu</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">{notifyButton}</div>
        </div>
      )}

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
              href={`/leagues/${leagueId}/manage`}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg font-medium hover:opacity-90"
              style={{ flexShrink: 0, whiteSpace: 'nowrap', backgroundColor: '#29544D', color: '#ffffff' }}
            >
              Przejdź do zarządzania ligą
            </a>
          )}
        </div>
      )}

      {/* Stand-ins are nominated before the draft starts, so the full card only
          appears during setup. Once live it survives as the admin's
          "Zarządzaj zastępstwami" button inside the board's action bar. */}
      {status === 'setup' && (
        <DelegationPanel
          managers={snap.managers}
          delegations={snap.delegations || []}
          mySquadId={snap.access.mySquadId}
          myUserId={snap.access.myUserId}
          isAdmin={isAdmin}
          onSetDelegate={handleSetDelegate}
        />
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

      {/* LIVE / FINISHED — shared board */}
      {(status === 'live' || status === 'finished') && (
        <>
        {/* Only ever rendered when the live socket is down, so a working draft
            looks exactly as it did before. */}
        {status === 'live' && !realtimeOk && graceElapsed && (
          <div className="mb-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Połączenie na żywo nieaktywne — odświeżam automatycznie co {POLL_INTERVAL_MS / 1000} s.
          </div>
        )}
        <DraftLiveBoard
          roundLabel={`Runda ${snap.draft.round} z ${snap.draft.total_rounds}`}
          status={status as 'live' | 'finished'}
          players={snap.players}
          picks={snap.picks}
          managers={snap.managers}
          onClockSquadId={snap.onTheClockSquadId}
          onClockManagerId={snap.onTheClockManagerId}
          nextSquadId={nextSquadId}
          isAdmin={isAdmin}
          myTurn={myTurn}
          delegations={snap.delegations || []}
          myUserId={snap.access.myUserId}
          mySquadId={snap.access.mySquadId}
          submitting={submitting}
          onConfirmPick={(playerId) => doAction('pick', { playerId })}
          onAdminPick={(playerId) => doAction('admin-pick', { playerId })}
          onSkip={() => setConfirmSkip(true)}
          onUndo={handleUndo}
          slotCount={() => snap.draft!.squad_size}
          onAddPlayer={onAddPlayerBoard}
          onEditPlayer={onEditPlayerBoard}
          actions={
            <>
              {notifyButton}
              {status === 'live' && (
                <DelegationPanel
                  managers={snap.managers}
                  delegations={snap.delegations || []}
                  mySquadId={snap.access.mySquadId}
                  myUserId={snap.access.myUserId}
                  isAdmin={isAdmin}
                  variant="adminOnly"
                  onSetDelegate={handleSetDelegate}
                />
              )}
            </>
          }
          sideTop={
            <DraftChat messages={messages} value={chatInput} onChange={setChatInput} onSend={sendMessage} />
          }
        />
        </>
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
                aria-label={`Przesuń ${managerName(m)} w górę`}
                className="px-2 py-1 rounded bg-white border border-gray-300 text-gray-600 disabled:opacity-30"
              >
                ↑
              </button>
              <button
                onClick={() => onMove(i, 1)}
                disabled={i === order.length - 1}
                aria-label={`Przesuń ${managerName(m)} w dół`}
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


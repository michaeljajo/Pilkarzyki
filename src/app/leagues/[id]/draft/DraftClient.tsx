'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import toast from 'react-hot-toast'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { DraftLiveBoard } from '@/components/draft/DraftLiveBoard'
import { DraftChat, DraftChatMessage } from '@/components/draft/DraftChat'

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
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Notification opt-in */}
          {status !== 'finished' && notifStatus !== 'granted' && notifStatus !== 'unsupported' && (
            <button
              onClick={requestNotifications}
              title="Włącz powiadomienia, aby wiedzieć, kiedy nadejdzie Twoja kolej"
              className="text-sm whitespace-nowrap px-3 py-2 rounded-md border border-[#29544D] text-[#29544D] hover:bg-[#29544D]/5"
            >
              🔔 Włącz powiadomienia
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
              href={`/leagues/${leagueId}/manage`}
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

      {/* LIVE / FINISHED — shared board */}
      {(status === 'live' || status === 'finished') && (
        <DraftLiveBoard
          roundLabel={`Runda ${snap.draft.round} z ${snap.draft.total_rounds}`}
          status={status as 'live' | 'finished'}
          players={snap.players}
          picks={snap.picks}
          managers={snap.managers}
          onClockSquadId={snap.onTheClockSquadId}
          onClockManagerId={snap.onTheClockManagerId}
          isAdmin={isAdmin}
          myTurn={myTurn}
          submitting={submitting}
          onConfirmPick={(playerId) => doAction('pick', { playerId })}
          onAdminPick={(playerId) => doAction('admin-pick', { playerId })}
          onSkip={() => setConfirmSkip(true)}
          onUndo={handleUndo}
          slotCount={() => snap.draft!.squad_size}
          onAddPlayer={onAddPlayerBoard}
          onEditPlayer={onEditPlayerBoard}
          sideTop={
            <DraftChat messages={messages} value={chatInput} onChange={setChatInput} onSend={sendMessage} />
          }
        />
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


'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import toast from 'react-hot-toast'
import { Check, Trophy } from 'lucide-react'
import { DraftLiveBoard } from '@/components/draft/DraftLiveBoard'

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

      {/* No draft / finished — admin opens & manages the draft from the admin panel */}
      {(!draft || status === 'finished') && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-2">
          {status === 'finished' && (
            <div className="flex items-center gap-2 text-green-700">
              <Trophy size={20} />
              <span className="font-semibold">Poprzedni draft zakończony.</span>
            </div>
          )}
          {!draft && <p className="text-gray-600">Brak aktywnego draftu w trakcie sezonu.</p>}
          <p className="text-sm text-gray-500">
            {access.isAdmin
              ? 'Rozpocznij i prowadź draft z panelu administratora: Zawodnicy → Transfery.'
              : 'Poczekaj, aż administrator rozpocznie draft.'}
          </p>
        </div>
      )}

      {/* DROPS phase — managers tick their releases here; the admin closes the
          window from the admin panel (Zawodnicy → Transfery). */}
      {status === 'drops' && (
        <DropsPhase
          players={players}
          drops={drops}
          managers={managers}
          myManagerId={myManagerId}
          isManager={access.isManager}
          onToggle={toggleDrop}
        />
      )}

      {/* SETUP phase — ordering happens in the admin panel. */}
      {status === 'setup' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-sm text-gray-600">
          Zwolnienia zamknięte. Administrator ustala kolejność draftu — za chwilę ruszy wybieranie.
        </div>
      )}

      {/* LIVE phase — shared board, identical to the pre-season draft */}
      {status === 'live' && draft && (
        <DraftLiveBoard
          roundLabel={`Runda ${draft.round}`}
          status="live"
          players={players}
          poolIds={new Set(players.filter((p) => p.manager_id === null || pickedIds.has(p.id)).map((p) => p.id))}
          picks={picks}
          managers={managers}
          onClockSquadId={snap.onTheClockSquadId}
          onClockManagerId={snap.onTheClockManagerId}
          isAdmin={access.isAdmin}
          myTurn={access.myTurn}
          submitting={busy}
          onConfirmPick={(playerId) => post('/action', { action: 'pick', playerId })}
          onAdminPick={(playerId) => post('/action', { action: 'admin-pick', playerId })}
          onSkip={() => post('/action', { action: 'skip' })}
          onUndo={() => post('/action', { action: 'undo' })}
          slotCount={(sid) => picks.filter((p) => p.squad_id === sid).length + (draft.pick_quotas[sid] || 0)}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------

function playerLabel(p: PlayerRow) {
  const meta = [p.club, p.football_league].filter(Boolean).join(', ')
  return `${p.name} ${p.surname}${meta ? ` — ${meta}` : ''} (${p.position})`
}

function DropsPhase({
  players, drops, managers, myManagerId, isManager, onToggle,
}: {
  players: PlayerRow[]
  drops: DropRow[]
  managers: ManagerRow[]
  myManagerId: string | null
  isManager: boolean
  onToggle: (playerId: string, wasDropped: boolean) => Promise<boolean>
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
      </div>
    </div>
  )
}

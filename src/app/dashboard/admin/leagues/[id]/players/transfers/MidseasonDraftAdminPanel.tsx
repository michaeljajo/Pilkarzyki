'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { ArrowUp, ArrowDown, Clock, Play, ExternalLink } from 'lucide-react'

interface DraftRow {
  id: string
  status: 'drops' | 'setup' | 'live' | 'finished'
  pick_quotas: Record<string, number>
}
interface ManagerRow { squadId: string; managerId: string; teamName: string | null; firstName: string; lastName: string; email: string }
interface DropRow { manager_id: string }

interface Snapshot {
  draft: DraftRow | null
  managers: ManagerRow[]
  drops: DropRow[]
}

const STATUS_LABEL: Record<string, string> = {
  drops: 'Okno zwolnień otwarte',
  setup: 'Ustalanie kolejności',
  live: 'Draft trwa',
  finished: 'Zakończony',
}

function managerName(m: ManagerRow | undefined): string {
  if (!m) return 'Menedżer'
  return m.teamName || `${m.firstName} ${m.lastName}`.trim() || m.email || 'Menedżer'
}

/**
 * Admin cockpit for the mid-season draft, shown on the Transfery page. Owns the
 * phase-control actions (open draft, close the drop window, set order + start)
 * so they live in the admin area — the shared draft screen is where managers tick
 * their drops and where the live draft is run.
 */
export default function MidseasonDraftAdminPanel({ leagueId }: { leagueId: string }) {
  const [snap, setSnap] = useState<Snapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [order, setOrder] = useState<string[]>([])
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
      if (res.ok) setSnap({ draft: data.draft, managers: data.managers, drops: data.drops })
    } catch {
      // non-fatal
    } finally {
      setLoading(false)
    }
  }, [leagueId])

  useEffect(() => {
    fetchSnapshot()
  }, [fetchSnapshot])

  // Keep drops progress + status live while the admin watches.
  useEffect(() => {
    const channel = supabase
      .channel(`midseason-admin-${leagueId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drafts', filter: `league_id=eq.${leagueId}` }, () => fetchSnapshot())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'draft_drops' }, () => fetchSnapshot())
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, leagueId, fetchSnapshot])

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

  async function post(path: string, body?: unknown) {
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
        return
      }
      await fetchSnapshot()
    } catch {
      toast.error('Błąd sieci.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Ładowanie…</p>
  }

  const draft = snap?.draft ?? null
  const status = draft?.status ?? null
  const managers = snap?.managers ?? []
  const dropsByManager = new Map<string, number>()
  ;(snap?.drops ?? []).forEach((d) => dropsByManager.set(d.manager_id, (dropsByManager.get(d.manager_id) || 0) + 1))
  const byId = new Map(managers.map((m) => [m.squadId, m]))
  const boardHref = `/dashboard/leagues/${leagueId}/midseason-draft`

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm">
        <Clock size={16} className="text-[#29544D]" />
        <span className="text-gray-700">
          Status:{' '}
          <span className="font-semibold text-gray-900">
            {status ? STATUS_LABEL[status] : 'Brak aktywnego draftu'}
          </span>
        </span>
      </div>

      {/* No draft / finished → open a new one */}
      {(!draft || status === 'finished') && (
        <Button onClick={() => post('/create')} loading={busy}>
          Rozpocznij nowy draft (okno zwolnień)
        </Button>
      )}

      {/* Drops window open → progress + close */}
      {status === 'drops' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Menedżerowie zwalniają zawodników na ekranie draftu. Zamknij okno, aby ustalić kolejność.
          </p>
          <ul className="text-sm space-y-1 max-w-sm">
            {managers.map((m) => (
              <li key={m.squadId} className="flex justify-between">
                <span className="text-gray-700">{managerName(m)}</span>
                <span className="text-gray-500">{dropsByManager.get(m.managerId) || 0} zwolnień</span>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <Button onClick={() => setConfirmClose(true)} disabled={busy || (snap?.drops.length ?? 0) === 0}>
              Zamknij okno zwolnień
            </Button>
            <Link href={boardHref}>
              <Button variant="outline" icon={<ExternalLink size={16} />}>Ekran draftu</Button>
            </Link>
          </div>
        </div>
      )}

      {/* Setup → order + start */}
      {status === 'setup' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Ułóż kolejność wybierania (użyj strzałek dla remisów), a następnie rozpocznij draft.
          </p>
          <ol className="space-y-2 max-w-md">
            {order.map((sid, idx) => (
              <li key={sid} className="flex items-center justify-between gap-3 p-2 rounded-lg border border-gray-200">
                <span className="text-sm text-gray-800">
                  <span className="font-semibold text-gray-500 mr-2">{idx + 1}.</span>
                  {managerName(byId.get(sid))}
                  <span className="text-gray-500"> — {draft?.pick_quotas[sid] || 0} wyborów</span>
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setOrder((prev) => { const n = [...prev]; if (idx > 0) { [n[idx - 1], n[idx]] = [n[idx], n[idx - 1]] } return n })}
                    disabled={busy || idx === 0}
                    className="p-1.5 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    onClick={() => setOrder((prev) => { const n = [...prev]; if (idx < n.length - 1) { [n[idx + 1], n[idx]] = [n[idx], n[idx + 1]] } return n })}
                    disabled={busy || idx === order.length - 1}
                    className="p-1.5 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ol>
          <Button onClick={() => setConfirmStart(true)} disabled={busy || order.length < 2} icon={<Play size={16} />}>
            Rozpocznij draft
          </Button>
        </div>
      )}

      {/* Live → run it on the shared board */}
      {status === 'live' && (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">Draft trwa. Prowadź go na ekranie draftu.</p>
          <Link href={boardHref}>
            <Button icon={<ExternalLink size={16} />}>Przejdź do ekranu draftu</Button>
          </Link>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmClose}
        onClose={() => setConfirmClose(false)}
        onConfirm={async () => { setConfirmClose(false); await post('/close-drops') }}
        title="Zamknij okno zwolnień"
        message="Zwolnieni zawodnicy trafią do puli, a każdy menedżer otrzyma tyle wyborów, ilu zawodników zwolnił. Tej operacji nie można cofnąć."
        confirmText="Zamknij okno"
        loading={busy}
      />
      <ConfirmModal
        isOpen={confirmStart}
        onClose={() => setConfirmStart(false)}
        onConfirm={async () => { setConfirmStart(false); await post('/start', { order }) }}
        title="Rozpocznij draft"
        message="Draft ruszy w ustalonej kolejności. Menedżerowie będą wybierać zawodników z puli na ekranie draftu."
        confirmText="Rozpocznij"
        variant="info"
        loading={busy}
      />
    </div>
  )
}

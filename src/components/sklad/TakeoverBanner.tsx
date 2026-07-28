'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ListOrdered, ArrowLeftRight } from 'lucide-react'

interface TakeoverBannerProps {
  leagueId: string
}

// Draft/transfer statuses that mean the window is open (not finished/absent).
const OPEN = new Set(['setup', 'live', 'active', 'drops', 'picking', 'in_progress'])

/**
 * Contextual entry points on Skład. The draft and the transfer window are
 * time-boxed takeovers with no permanent nav entry — when one is open, a banner
 * appears here linking into it.
 */
export function TakeoverBanner({ leagueId }: TakeoverBannerProps) {
  const [draftOpen, setDraftOpen] = useState(false)
  const [transfersOpen, setTransfersOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function check() {
      try {
        const [draftRes, midRes] = await Promise.all([
          fetch(`/api/leagues/${leagueId}/draft`, { cache: 'no-store' }),
          fetch(`/api/leagues/${leagueId}/midseason-draft`, { cache: 'no-store' }),
        ])
        const draft = draftRes.ok ? await draftRes.json() : null
        const mid = midRes.ok ? await midRes.json() : null
        if (cancelled) return
        setDraftOpen(!!draft?.draft?.status && OPEN.has(draft.draft.status))
        setTransfersOpen(!!mid?.draft?.status && OPEN.has(mid.draft.status))
      } catch {
        /* ignore — banners are best-effort */
      }
    }
    check()
    return () => {
      cancelled = true
    }
  }, [leagueId])

  if (!draftOpen && !transfersOpen) return null

  return (
    <div className="mb-4 flex flex-col gap-3">
      {draftOpen && (
        <Link
          href={`/leagues/${leagueId}/draft`}
          className="flex items-center gap-3 rounded-2xl border-2 border-[#29544D] bg-[#29544D]/5 p-4 transition-colors hover:bg-[#29544D]/10"
        >
          <ListOrdered className="shrink-0" style={{ color: '#29544D' }} />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900">Trwa draft</div>
            <div className="text-sm text-gray-600">Dołącz i wybierz zawodników.</div>
          </div>
          <ArrowRight className="shrink-0 text-[#29544D]" size={20} />
        </Link>
      )}
      {transfersOpen && (
        <Link
          href={`/leagues/${leagueId}/midseason-draft`}
          className="flex items-center gap-3 rounded-2xl border-2 border-[#B8A050] bg-[#DECF99]/15 p-4 transition-colors hover:bg-[#DECF99]/25"
        >
          <ArrowLeftRight className="shrink-0" style={{ color: '#B8A050' }} />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900">Okno transferowe otwarte</div>
            <div className="text-sm text-gray-600">Wprowadź zmiany w składzie.</div>
          </div>
          <ArrowRight className="shrink-0" size={20} style={{ color: '#B8A050' }} />
        </Link>
      )}
    </div>
  )
}

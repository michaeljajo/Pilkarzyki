'use client'

import { useState, useEffect, useMemo, use } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { ScheduleMatchCard } from '@/components/ScheduleMatchCard'

interface Manager {
  id: string
  first_name?: string
  last_name?: string
  email: string
  squad?: { team_name?: string }
}

interface ScheduleMatch {
  id: string
  type: 'league' | 'cup'
  gameweekNumber: number
  startDate: string
  endDate: string
  lockDate: string
  isCompleted: boolean
  homeManager: Manager | null
  awayManager: Manager | null
  homeTeamSource?: string
  awayTeamSource?: string
  homeScore?: number
  awayScore?: number
  stage?: string
  leg?: number
  groupName?: string
}

interface Group {
  key: string
  type: 'league' | 'cup'
  gameweekNumber: number
  stage?: string
  startDate: string
  endDate: string
  matches: ScheduleMatch[]
}

const STAGE_LABELS: Record<string, string> = {
  group_stage: 'Faza grupowa',
  round_of_32: '1/16 finału',
  round_of_16: '1/8 finału',
  quarter_final: 'Ćwierćfinał',
  semi_final: 'Półfinał',
  final: 'Finał',
}

function formatDateRange(startISO: string, endISO: string): string {
  const start = new Date(startISO)
  const end = new Date(endISO)
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' }
  const s = start.toLocaleDateString('pl-PL', opts)
  const e = end.toLocaleDateString('pl-PL', opts)
  if (s === e) return s
  return `${s} – ${e}`
}

interface SchedulePageProps {
  params: Promise<{ id: string }>
}

export default function SchedulePage({ params }: SchedulePageProps) {
  const { id: leagueId } = use(params)
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [matches, setMatches] = useState<ScheduleMatch[]>([])
  const [managers, setManagers] = useState<Manager[]>([])
  const [selectedManager, setSelectedManager] = useState<string>('')
  const [hidePast, setHidePast] = useState(false)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [autoExpandedKey, setAutoExpandedKey] = useState<string | null>(null)

  useEffect(() => {
    // Wait for Clerk to resolve: `user` is undefined while loading, so redirecting
    // on !user alone bounced every hard load of this page to /sign-in (and from
    // there, for a signed-in user, straight back out to the leagues list).
    if (isLoaded && !user) router.push('/sign-in')
  }, [isLoaded, user, router])

  useEffect(() => {
    if (!leagueId) return
    let cancelled = false
    async function fetchSchedule() {
      try {
        setLoading(true)
        const url = selectedManager
          ? `/api/leagues/${leagueId}/combined-schedule?managerId=${selectedManager}`
          : `/api/leagues/${leagueId}/combined-schedule`
        const res = await fetch(url)
        if (res.ok && !cancelled) {
          const data = await res.json()
          setMatches(data.matches || [])
          setManagers(data.managers || [])
        }
      } catch (err) {
        console.error('Failed to fetch schedule:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchSchedule()
    return () => {
      cancelled = true
    }
  }, [leagueId, selectedManager])

  const managerName = (m: Manager) =>
    m.squad?.team_name ||
    (m.first_name && m.last_name ? `${m.first_name} ${m.last_name}` : m.email.split('@')[0])

  // The current user's internal manager id (to mark their own fixtures).
  const myManagerId = useMemo(() => {
    const email = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress
    if (!email) return null
    const me = managers.find((m) => m.email?.toLowerCase() === email.toLowerCase())
    return me?.id ?? null
  }, [user, managers])

  // Group by competition + gameweek, then sort chronologically so league and cup
  // gameweeks interleave by date into one merged list.
  const groups = useMemo<Group[]>(() => {
    const map = new Map<string, Group>()
    for (const m of matches) {
      const key = `${m.type}-${m.gameweekNumber}`
      const g = map.get(key)
      if (!g) {
        map.set(key, {
          key,
          type: m.type,
          gameweekNumber: m.gameweekNumber,
          stage: m.stage,
          startDate: m.startDate,
          endDate: m.endDate,
          matches: [m],
        })
      } else {
        g.matches.push(m)
        if (new Date(m.startDate) < new Date(g.startDate)) g.startDate = m.startDate
        if (new Date(m.endDate) > new Date(g.endDate)) g.endDate = m.endDate
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    )
  }, [matches])

  // The current or next gameweek: the first group not fully in the past.
  const currentKey = useMemo(() => {
    const now = Date.now()
    const current = groups.find((g) => new Date(g.endDate).getTime() >= now)
    return current?.key ?? groups[groups.length - 1]?.key ?? null
  }, [groups])

  // Auto-expand the current group by default (once per current-key change),
  // while still honouring the user's manual toggles.
  useEffect(() => {
    if (currentKey && currentKey !== autoExpandedKey) {
      setExpanded((prev) => {
        const next = new Set(prev)
        next.add(currentKey)
        return next
      })
      setAutoExpandedKey(currentKey)
    }
  }, [currentKey, autoExpandedKey])

  const toggle = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const visibleGroups = hidePast
    ? groups.filter((g) => new Date(g.endDate).getTime() >= Date.now())
    : groups

  if (!user) return null

  return (
    // Narrow, centred column matching the Wyniki page: a fixture row is only
    // "name vs name" plus a date, so a wide container just flings the two names
    // to opposite edges with a void between them.
    <div className="mx-auto w-full max-w-3xl">

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
        <label htmlFor="manager-filter" className="sr-only">
          Filtruj według menedżera
        </label>
        <select
          id="manager-filter"
          value={selectedManager}
          onChange={(e) => setSelectedManager(e.target.value)}
          disabled={loading}
          className="w-full sm:w-auto sm:min-w-[220px] sm:max-w-[280px] min-h-[44px] rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:border-[#061852] focus:outline-none focus:ring-2 focus:ring-[#061852]/20 disabled:opacity-60"
        >
          <option value="">Wszyscy menedżerowie</option>
          {[...managers]
            .sort((a, b) => managerName(a).localeCompare(managerName(b)))
            .map((m) => (
              <option key={m.id} value={m.id}>
                {managerName(m)}
              </option>
            ))}
        </select>

        <label className="inline-flex items-center gap-2 cursor-pointer select-none min-h-[44px]">
          <input
            type="checkbox"
            checked={hidePast}
            onChange={(e) => setHidePast(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-[#061852] focus:ring-[#061852]"
          />
          <span className="text-sm text-gray-700">Ukryj przeszłe kolejki</span>
        </label>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#061852]" />
        </div>
      ) : visibleGroups.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-3xl mb-2">📅</div>
          <div className="text-sm">
            {hidePast ? 'Brak nadchodzących meczów' : 'Brak meczów w terminarzu'}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleGroups.map((g) => {
            const isOpen = expanded.has(g.key)
            const isCurrent = g.key === currentKey
            const heading =
              g.type === 'cup'
                ? STAGE_LABELS[g.stage ?? ''] || `Kolejka ${g.gameweekNumber}`
                : `Kolejka ${g.gameweekNumber}`
            // The header already prints "Kolejka N" (league weeks, and cup weeks
            // with no named stage), so the per-card gameweek badge just repeats it.
            const headerShowsGameweek = heading === `Kolejka ${g.gameweekNumber}`
            // If every fixture in this accordion is the same competition, the
            // header labels it with a chip and the cards drop their type badge.
            // In a mixed accordion, invert: no header chip, keep per-card badges.
            const homogeneous = g.matches.every((m) => m.type === g.type)
            return (
              <div key={g.key} className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggle(g.key)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {homogeneous && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide shrink-0"
                        style={
                          g.type === 'cup'
                            ? { backgroundColor: '#DECF99', color: '#29544D' }
                            : { backgroundColor: '#061852', color: '#fff' }
                        }
                      >
                        {g.type === 'cup' ? 'Puchar' : 'Liga'}
                      </span>
                    )}
                    <span className="font-semibold text-gray-900 truncate">{heading}</span>
                    {/* No "Teraz" pill — the current gameweek is the one already
                        expanded on load, so the badge only added noise. */}
                    <span className="text-sm text-gray-400 truncate">{formatDateRange(g.startDate, g.endDate)}</span>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isOpen && (
                  <div className="px-3 pb-3 space-y-3">
                    {g.matches.map((match) => {
                      const isMine =
                        !!myManagerId &&
                        (match.homeManager?.id === myManagerId || match.awayManager?.id === myManagerId)
                      return (
                        <ScheduleMatchCard
                          key={match.id}
                          match={match}
                          highlight={isMine}
                          hideTypeBadge={homogeneous}
                          hideGameweekBadge={headerShowsGameweek}
                        />
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

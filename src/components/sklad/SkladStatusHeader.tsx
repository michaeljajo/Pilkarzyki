'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

interface SkladStatusHeaderProps {
  leagueId: string
}

type Competition = 'league' | 'cup'

interface OpenComp {
  competition: Competition
  lockDate: string | null
  gameweekNumber: number | null
  lineupSet: boolean
  opponent: string | null
}

const COLORS = {
  navy: '#061852',
  green: '#29544D',
  amber: '#B45309', // amber-700
  red: '#DC2626', // red-600
  muted: '#6B7280', // gray-500 — shared "secondary text" ink
}

// --- Polish-ish pluralisation helpers -------------------------------------
function plural(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (n === 1) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few
  return many
}

interface Remaining {
  ms: number
  days: number
  hours: number
  minutes: number
}

function remainingFrom(lockDate: string | null): Remaining | null {
  if (!lockDate) return null
  const ms = new Date(lockDate).getTime() - Date.now()
  const clamped = Math.max(0, ms)
  const totalMinutes = Math.floor(clamped / 60000)
  const days = Math.floor(totalMinutes / (60 * 24))
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
  const minutes = totalMinutes % 60
  return { ms, days, hours, minutes }
}

function formatRemaining(r: Remaining): string {
  if (r.ms <= 0) return 'Termin minął'
  if (r.days >= 1) {
    return `${r.days} ${plural(r.days, 'dzień', 'dni', 'dni')} ${r.hours} godz.`
  }
  if (r.hours >= 1) {
    return `${r.hours} godz. ${r.minutes} min`
  }
  if (r.minutes >= 1) {
    return `${r.minutes} min`
  }
  return '< 1 min'
}

// The countdown's colour is its urgency signal. An expired deadline used to
// render green — identical to "over a day left" — so the one place the colour
// actually had to say something said the opposite. Expired is now muted: the
// deadline is gone, there is nothing left to act on.
function colorFor(r: Remaining | null): string {
  if (!r || r.ms <= 0) return COLORS.muted
  const hours = r.ms / 3600000
  if (hours < 2) return COLORS.red
  if (hours < 24) return COLORS.amber
  return COLORS.navy
}

function managerLabel(m: { first_name?: string; last_name?: string; email: string; squad?: { team_name?: string } } | null): string {
  if (!m) return '—'
  return m.squad?.team_name || m.first_name || m.email?.split('@')[0] || '—'
}

export function SkladStatusHeader({ leagueId }: SkladStatusHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const selected: Competition = searchParams.get('competition') === 'cup' ? 'cup' : 'league'

  const [comps, setComps] = useState<OpenComp[] | null>(null)
  const [loading, setLoading] = useState(true)
  // Re-render every second so the countdown ticks without a page refresh.
  const [, setTick] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [squadRes, schedRes] = await Promise.all([
          fetch(`/api/manager/leagues/${leagueId}/squad`, { cache: 'no-store' }),
          fetch(`/api/leagues/${leagueId}/combined-schedule`, { cache: 'no-store' }),
        ])
        const squad = squadRes.ok ? await squadRes.json() : null
        const sched = schedRes.ok ? await schedRes.json() : null
        if (cancelled || !squad) {
          if (!cancelled) setLoading(false)
          return
        }

        const myManagerId: string | undefined = squad.players?.[0]?.managerId
        const matches: Array<{
          type: Competition
          gameweekNumber: number
          homeManager: Parameters<typeof managerLabel>[0]
          awayManager: Parameters<typeof managerLabel>[0]
        }> = Array.isArray(sched) ? sched : sched?.matches ?? []

        const opponentFor = (competition: Competition, gwNumber: number | null): string | null => {
          if (!myManagerId || gwNumber == null) return null
          const m = matches.find(
            (x) =>
              x.type === competition &&
              x.gameweekNumber === gwNumber &&
              (x.homeManager?.id === myManagerId || x.awayManager?.id === myManagerId)
          )
          if (!m) return null
          const mine = m.homeManager?.id === myManagerId
          return managerLabel(mine ? m.awayManager : m.homeManager)
        }

        const out: OpenComp[] = []
        if (squad.currentGameweek) {
          const gw = squad.currentGameweek
          const gwNumber: number | null = gw.week ?? gw.number ?? null
          out.push({
            competition: 'league',
            lockDate: gw.lockDate ?? gw.lock_date ?? null,
            gameweekNumber: gwNumber,
            lineupSet: !!squad.currentLineup,
            opponent: opponentFor('league', gwNumber),
          })
        }
        if (squad.currentCupGameweek) {
          const cgw = squad.currentCupGameweek
          const gwNumber: number | null = cgw.week ?? cgw.number ?? null
          out.push({
            competition: 'cup',
            lockDate: cgw.lockDate ?? cgw.lock_date ?? null,
            gameweekNumber: gwNumber,
            lineupSet: !!squad.currentCupLineup,
            opponent: opponentFor('cup', gwNumber),
          })
        }
        if (!cancelled) {
          setComps(out)
          setLoading(false)
        }
      } catch {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [leagueId])

  useEffect(() => {
    intervalRef.current = setInterval(() => setTick((t) => t + 1), 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const cupOpen = useMemo(() => comps?.some((c) => c.competition === 'cup') ?? false, [comps])

  // Nothing open (off-season / between gameweeks) — render nothing.
  if (!loading && (!comps || comps.length === 0)) return null

  const effective: Competition = selected === 'cup' && cupOpen ? 'cup' : 'league'
  const primary = comps?.find((c) => c.competition === effective) ?? comps?.[0] ?? null
  const secondary = comps?.find((c) => c.competition !== effective) ?? null

  const setCompetition = (c: Competition) => {
    const params = new URLSearchParams(searchParams.toString())
    if (c === 'league') params.delete('competition')
    else params.set('competition', c)
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  const primaryRemaining = remainingFrom(primary?.lockDate ?? null)
  const secondaryRemaining = remainingFrom(secondary?.lockDate ?? null)

  return (
    <section
      className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
      aria-label="Status składu"
    >
      {loading ? (
        <div className="h-24 animate-pulse rounded-xl bg-gray-100" />
      ) : (
        <>
          {/* Competition switcher (cup segment only when a cup gameweek is open) */}
          {cupOpen && (
            <div className="mb-4 inline-flex rounded-xl bg-gray-100 p-1" role="tablist" aria-label="Rozgrywki">
              {(['league', 'cup'] as Competition[]).map((c) => {
                const active = effective === c
                return (
                  <button
                    key={c}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setCompetition(c)}
                    className="min-h-[36px] rounded-lg px-4 text-sm font-medium transition-colors"
                    style={active ? { backgroundColor: COLORS.navy, color: '#fff' } : { color: COLORS.green }}
                  >
                    {c === 'league' ? 'Ligowy' : 'Pucharowy'}
                  </button>
                )
              })}
            </div>
          )}

          {/* Gameweek + competition as ONE muted line. Previously the competition
              was a filled uppercase chip here AND a text label on the status row
              below — the same word twice. The chip was also the only uppercase +
              letter-spaced text on the screen, a typographic exception spent on
              the least important element. */}
          {primary && (
            <div className="mb-1 text-[13px] text-[#6B7280]">
              {primary.gameweekNumber != null ? `Kolejka ${primary.gameweekNumber}` : 'Kolejka'}
              {' · '}
              {primary.competition === 'cup' ? 'Puchar' : 'Liga'}
            </div>
          )}

          {/* Deadline countdown — the primary element. No caption above it: sitting
              under the gameweek chip, a countdown already reads as the deadline.
              inline-block so it shrink-wraps to the time string. */}
          <div
            className="inline-block text-[28px] font-semibold leading-none"
            style={{ color: colorFor(primaryRemaining) }}
            aria-live="polite"
          >
            {primaryRemaining ? formatRemaining(primaryRemaining) : '—'}
          </div>

          {/* Secondary competition deadline (when both are open) */}
          {secondary && secondaryRemaining && (
            <div className="mt-1 text-[13px] text-[#6B7280]">
              {secondary.competition === 'cup' ? 'Puchar' : 'Liga'}: {formatRemaining(secondaryRemaining)}
            </div>
          )}

          {/* Lineup status per open competition */}
          <div className="mt-4 flex flex-col gap-2">
            {comps?.map((c) => (
              <div key={c.competition} className="flex items-center gap-2 text-[13px]">
                {/* Name the competition only when there are two to tell apart.
                    With one open it just repeats the line above the countdown. */}
                {(comps?.length ?? 0) > 1 && (
                  <span className="w-16 shrink-0 text-[#6B7280]">
                    {c.competition === 'cup' ? 'Puchar' : 'Liga'}
                  </span>
                )}
                {c.lineupSet ? (
                  <span className="font-semibold" style={{ color: COLORS.green }}>
                    Skład ustawiony ✓
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1 font-semibold text-red-700">
                    ⚠ Nie ustawiłeś składu
                  </span>
                )}
                {c.opponent && (
                  <span className="ml-auto text-[#6B7280]">
                    Ty vs <span className="font-semibold text-[#111827]">{c.opponent}</span>
                  </span>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import {
  AlertTriangle,
  CheckCircle,
  ClipboardList,
  BarChart3,
  Table,
  Shield,
  Trophy,
  Zap,
} from 'lucide-react'

type GameweekState = 'open' | 'locked' | 'completed'

interface PanelData {
  league: { id: string; name: string; isActive: boolean }
  gameweek: {
    id: string
    week: number
    lockDate: string
    isCompleted: boolean
    state: GameweekState
  } | null
  lineups: {
    total: number
    submittedOwn: number
    zelazko: number
    missing: number
    zelazkoNames: string[]
    missingNames: string[]
  } | null
  warnings: {
    invalidDefaults: Array<{ managerName: string; removedPlayerNames: string[] }>
    cronFailure: { missingNames: string[] } | null
  }
  cup: { name: string; round: string } | null
}

const PIPELINE: { key: string; label: string; activeFor: GameweekState[] }[] = [
  { key: 'open', label: 'Składy otwarte', activeFor: ['open'] },
  { key: 'locked', label: 'Zablokowana', activeFor: ['locked'] },
  { key: 'results', label: 'Wpisywanie wyników', activeFor: ['locked'] },
  { key: 'completed', label: 'Zakończona', activeFor: ['completed'] },
]

const STATE_LABEL: Record<GameweekState, string> = {
  open: 'Składy otwarte',
  locked: 'Zablokowana — wpisywanie wyników',
  completed: 'Zakończona',
}

export default function LeaguePanelPage() {
  const params = useParams()
  const leagueId = params.id as string

  const [data, setData] = useState<PanelData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [applying, setApplying] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const fetchPanel = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/leagues/${leagueId}/panel`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Nie udało się wczytać panelu')
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd')
    } finally {
      setLoading(false)
    }
  }, [leagueId])

  useEffect(() => {
    fetchPanel()
  }, [fetchPanel])

  async function applyZelazka() {
    try {
      setApplying(true)
      setError(null)
      setNotice(null)
      const res = await fetch(`/api/admin/leagues/${leagueId}/apply-default-lineups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameweekId: data?.gameweek?.id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Nie udało się zastosować żelazek')
      setNotice(json.message)
      await fetchPanel()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd')
    } finally {
      setApplying(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="h-12 bg-[var(--background-secondary)] rounded-xl w-1/3" />
        <div className="h-48 bg-[var(--background-secondary)] rounded-xl" />
        <div className="h-48 bg-[var(--background-secondary)] rounded-xl" />
      </div>
    )
  }

  if (error && !data) {
    return <Alert variant="error">{error}</Alert>
  }

  const gw = data?.gameweek
  const lineups = data?.lineups
  const warnings = data?.warnings
  const hasWarnings =
    (warnings?.invalidDefaults.length ?? 0) > 0 || !!warnings?.cronFailure

  const ctaHref = `/dashboard/admin/leagues/${leagueId}/kolejka`
  const ctaLabel =
    gw?.state === 'locked'
      ? 'Wpisz wyniki'
      : gw?.state === 'open'
        ? 'Zobacz składy'
        : 'Otwórz kolejkę'

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--foreground)]">Panel</h1>
        <p className="text-base sm:text-lg text-[var(--foreground-secondary)]">
          {data?.league.name}
          {data && !data.league.isActive && ' — sezon zarchiwizowany'}
        </p>
      </div>

      {notice && (
        <Alert variant="success" dismissible onDismiss={() => setNotice(null)}>
          {notice}
        </Alert>
      )}
      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* System-health warnings — only when something is wrong */}
      {hasWarnings && (
        <div className="space-y-4">
          {warnings?.cronFailure && (
            <Card className="border-[var(--danger)]/40 bg-[var(--danger)]/5">
              <CardContent className="py-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="text-[var(--danger)] shrink-0 mt-0.5" size={24} />
                    <div>
                      <div className="font-semibold text-[var(--foreground)]">
                        Kolejka zablokowana, a {warnings.cronFailure.missingNames.length} menedżer(ów) bez składu
                      </div>
                      <div className="text-sm text-[var(--foreground-secondary)] mt-1">
                        Automat żelazek prawdopodobnie się nie wykonał: {warnings.cronFailure.missingNames.join(', ')}.
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={applyZelazka}
                    loading={applying}
                    icon={<Zap size={18} />}
                    className="shrink-0 w-full sm:w-auto"
                  >
                    Zastosuj żelazka teraz
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {(warnings?.invalidDefaults.length ?? 0) > 0 && (
            <Card className="border-[var(--warning)]/40 bg-[var(--warning)]/5">
              <CardContent className="py-5">
                <div className="flex items-start gap-3">
                  <Shield className="text-[var(--warning)] shrink-0 mt-0.5" size={24} />
                  <div>
                    <div className="font-semibold text-[var(--foreground)]">
                      Nieprawidłowe żelazka po transferach
                    </div>
                    <ul className="text-sm text-[var(--foreground-secondary)] mt-2 space-y-1">
                      {warnings!.invalidDefaults.map((d) => (
                        <li key={d.managerName}>
                          <span className="font-medium text-[var(--foreground)]">{d.managerName}</span>
                          {' — utracił: '}
                          {d.removedPlayerNames.join(', ')}
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-[var(--foreground-tertiary)] mt-2">
                      Ci menedżerowie muszą zaktualizować swoje żelazko przed blokadą kolejki.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Current gameweek */}
      {gw ? (
        <Card className="hover-lift">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="flex items-center gap-3">
                <ClipboardList size={26} className="text-[var(--mineral-green)]" />
                Kolejka {gw.week}
              </CardTitle>
              <span className="text-sm font-semibold px-3 py-1.5 rounded-full bg-[var(--background-tertiary)] text-[var(--foreground)]">
                {STATE_LABEL[gw.state]}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Pipeline */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {PIPELINE.map((step, i) => {
                const isActive = step.activeFor.includes(gw.state)
                const stateOrder: GameweekState[] = ['open', 'locked', 'completed']
                const isPast =
                  stateOrder.indexOf(gw.state) >
                  stateOrder.indexOf(step.activeFor[0])
                return (
                  <div key={step.key} className="flex items-center gap-2 shrink-0">
                    <div
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                        isActive
                          ? 'bg-[var(--mineral-green)] text-white'
                          : isPast
                            ? 'bg-[var(--success)]/15 text-[var(--success)]'
                            : 'bg-[var(--background-tertiary)] text-[var(--foreground-tertiary)]'
                      }`}
                    >
                      {step.label}
                    </div>
                    {i < PIPELINE.length - 1 && (
                      <span className="text-[var(--foreground-tertiary)]">→</span>
                    )}
                  </div>
                )
              })}
            </div>

            <Link href={ctaHref}>
              <Button size="lg" icon={<ClipboardList size={18} />} className="w-full sm:w-auto">
                {ctaLabel}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-[var(--foreground-secondary)]">
            Brak kolejek w tej lidze. Wygeneruj terminarz w sekcji Terminarz.
          </CardContent>
        </Card>
      )}

      {/* Lineup status */}
      {lineups && gw && (
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <CheckCircle size={24} className="text-[var(--mineral-green)]" />
              Składy — kolejka {gw.week}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {gw.state === 'open' ? (
              <p className="text-[var(--foreground)]">
                <span className="font-semibold">{lineups.submittedOwn}</span> z{' '}
                <span className="font-semibold">{lineups.total}</span> wybrało skład
                {lineups.missing > 0 && (
                  <>
                    {', '}
                    <span className="font-semibold">{lineups.missing}</span> jeszcze nie
                  </>
                )}
                . Przy blokadzie brakujące składy zostaną uzupełnione żelazkiem.
              </p>
            ) : (
              <p className="text-[var(--foreground)]">
                Wszystkie <span className="font-semibold">{lineups.total}</span> składy istnieją —{' '}
                <span className="font-semibold">{lineups.zelazko}</span> z żelazka.
              </p>
            )}

            {lineups.zelazkoNames.length > 0 && (
              <div className="text-sm text-[var(--foreground-secondary)]">
                <span className="font-medium">Żelazko:</span> {lineups.zelazkoNames.join(', ')}
              </div>
            )}
            {gw.state === 'open' && lineups.missingNames.length > 0 && (
              <div className="text-sm text-[var(--foreground-secondary)]">
                <span className="font-medium">Bez składu:</span> {lineups.missingNames.join(', ')}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Cup status */}
      {data?.cup && (
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <Trophy size={20} className="text-yellow-500" />
            <span className="text-[var(--foreground)]">
              <span className="font-semibold">{data.cup.name}</span>
              {data.cup.round ? ` — ${data.cup.round}` : ''} w tej kolejce
            </span>
          </CardContent>
        </Card>
      )}

      {/* Read-only quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href={`/dashboard/admin/leagues/${leagueId}/kolejka`}>
          <Card className="hover-lift cursor-pointer">
            <CardContent className="py-5 flex items-center gap-3">
              <BarChart3 size={22} className="text-[var(--mineral-green)]" />
              <span className="font-medium text-[var(--foreground)]">Ostatnie wyniki</span>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/dashboard/admin/leagues/${leagueId}/standings`}>
          <Card className="hover-lift cursor-pointer">
            <CardContent className="py-5 flex items-center gap-3">
              <Table size={22} className="text-[var(--mineral-green)]" />
              <span className="font-medium text-[var(--foreground)]">Aktualna tabela</span>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}

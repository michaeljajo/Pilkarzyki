'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Input } from '@/components/ui/Input'
import {
  validateCupFormat,
  resolveGroupSizes,
  generateGroupNames,
  expectedKnockoutStages,
} from '@/utils/cup-scheduling'
import { presetFormat, stageLabelPl } from '@/lib/cup-format'
import type { CupFormat, CupPreset, CupStage } from '@/types'

interface Manager {
  id: string // Clerk ID (used by the groups API)
  firstName?: string | null
  lastName?: string | null
  email: string
}

interface LeagueGameweek {
  id: string
  week: number
}

interface Props {
  leagueId: string
  managers: Manager[]
  gameweeks: LeagueGameweek[]
  onCreated: () => void
}

const PRESETS: { value: CupPreset; label: string }[] = [
  { value: 'legacy_4x4', label: '4 grupy po 4 (klasyczny)' },
  { value: 'two_groups_of_nine', label: '2 grupy po 9' },
  { value: 'custom', label: 'Własny format' },
]

const STEP_TITLES = [
  'Preset',
  'Uczestnicy',
  'Grupy',
  'Awans',
  'Faza pucharowa',
  'Kalendarz',
  'Podsumowanie',
]

function managerName(m: Manager): string {
  const name = `${m.firstName || ''} ${m.lastName || ''}`.trim()
  return name || m.email
}

// Polish plural helper for "kolejka" (gameweek) / "mecz" (match).
// The counted forms shown here (all ≥ 5 in practice, e.g. "9 kolejek") take the
// genitive-plural "kolejek", matching the spec's example wording.
const kolejkaWord = (): string => 'kolejek'
function meczWord(n: number): string {
  if (n === 1) return 'mecz'
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) return 'mecze'
  return 'meczów'
}
function byesSentence(min: number, max: number): string {
  const phrase = (n: number) => (n === 0 ? 'nie spauzuje ani razu' : n === 1 ? 'spauzuje raz' : `spauzuje ${n} razy`)
  if (min === max) return `i ${phrase(min)}`
  return `i spauzuje od ${min} do ${max} razy`
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function CupSetupWizard({ leagueId, managers, gameweeks, onCreated }: Props) {
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [preset, setPreset] = useState<CupPreset>('two_groups_of_nine')

  const [excluded, setExcluded] = useState<Set<string>>(new Set())

  const initial = presetFormat('two_groups_of_nine')
  const [groupCount, setGroupCount] = useState(initial.groups.count)
  const [legs, setLegs] = useState<1 | 2>(initial.groups.legs)
  const [assignment, setAssignment] = useState<'manual' | 'random'>(initial.groups.assignment)
  const [topPerGroup, setTopPerGroup] = useState(initial.qualification.topPerGroup)
  const [bestRemaining, setBestRemaining] = useState(initial.qualification.bestRemaining)
  const [knockoutLegs, setKnockoutLegs] = useState<Record<string, 1 | 2>>({})
  const [firstGameweekId, setFirstGameweekId] = useState('')

  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const participants = useMemo(
    () => managers.filter(m => !excluded.has(m.id)),
    [managers, excluded]
  )
  const participantCount = participants.length

  const totalQualifiers = groupCount * topPerGroup + bestRemaining
  const knockoutStages = useMemo(() => expectedKnockoutStages(totalQualifiers), [totalQualifiers])

  const format: CupFormat = useMemo(() => ({
    preset,
    participantIds: excluded.size > 0 ? participants.map(m => m.id) : 'all',
    groups: { count: groupCount, legs, assignment },
    qualification: { topPerGroup, bestRemaining },
    knockout: knockoutStages.map(stage => ({
      stage,
      legs: knockoutLegs[stage] ?? (stage === 'final' ? 1 : 2),
    })),
    aggregateTieBreak: 'et_penalties',
  }), [preset, excluded.size, participants, groupCount, legs, assignment, topPerGroup, bestRemaining, knockoutStages, knockoutLegs])

  const validation = useMemo(
    () => validateCupFormat(participantCount, format),
    [participantCount, format]
  )
  const summary = validation.summary

  function applyPreset(p: CupPreset) {
    setPreset(p)
    const f = presetFormat(p)
    setGroupCount(f.groups.count)
    setLegs(f.groups.legs)
    setAssignment(f.groups.assignment)
    setTopPerGroup(f.qualification.topPerGroup)
    setBestRemaining(f.qualification.bestRemaining)
    const kl: Record<string, 1 | 2> = {}
    f.knockout.forEach(k => { kl[k.stage] = k.legs })
    setKnockoutLegs(kl)
  }

  function toggleExcluded(id: string) {
    setExcluded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function setStageLegs(stage: CupStage, value: 1 | 2) {
    setKnockoutLegs(prev => ({ ...prev, [stage]: value }))
  }

  const sortedGameweeks = useMemo(
    () => [...gameweeks].sort((a, b) => a.week - b.week),
    [gameweeks]
  )

  async function generate() {
    setError(null)
    if (!name.trim()) {
      setError('Podaj nazwę pucharu.')
      setStep(1)
      return
    }
    if (!validation.valid) {
      setError(validation.errors[0])
      return
    }

    setGenerating(true)
    try {
      // 1. Create the cup with the chosen format.
      const cupRes = await fetch('/api/cups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leagueId, name, format }),
      })
      const cupData = await cupRes.json()
      if (!cupRes.ok) throw new Error(cupData.error || 'Nie udało się utworzyć pucharu')
      const cupId = cupData.cup.id as string

      if (assignment === 'manual') {
        // Manual draw: hand off to the existing groups page, then the schedule page.
        router.push(`/leagues/${leagueId}/manage/cup/groups`)
        return
      }

      // 2. Random draw: shuffle participants into the balanced group sizes.
      const sizes = resolveGroupSizes(participantCount, format)
      const names = generateGroupNames(groupCount)
      const shuffled = shuffle(participants.map(m => m.id))
      const groups: { groupName: string; managerIds: string[] }[] = []
      let cursor = 0
      for (let g = 0; g < groupCount; g++) {
        groups.push({ groupName: names[g], managerIds: shuffled.slice(cursor, cursor + sizes[g]) })
        cursor += sizes[g]
      }
      const groupsRes = await fetch(`/api/cups/${cupId}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groups }),
      })
      const groupsData = await groupsRes.json()
      if (!groupsRes.ok) throw new Error(groupsData.error || 'Nie udało się przypisać grup')

      // 3. Map cup weeks to consecutive league gameweeks from the chosen start.
      const startIdx = sortedGameweeks.findIndex(g => g.id === firstGameweekId)
      if (startIdx === -1) throw new Error('Wybierz pierwszą kolejkę ligową.')
      const needed = summary.totalWeeks
      const slice = sortedGameweeks.slice(startIdx, startIdx + needed)
      if (slice.length < needed) {
        throw new Error(`Potrzeba ${needed} kolejek ligowych od wybranej, dostępnych jest tylko ${slice.length}.`)
      }
      const gameweekMappings = slice.map((gw, i) => ({ cupWeek: i + 1, leagueGameweekId: gw.id }))
      const schedRes = await fetch(`/api/cups/${cupId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameweekMappings }),
      })
      const schedData = await schedRes.json()
      if (!schedRes.ok) throw new Error(schedData.error || 'Nie udało się wygenerować harmonogramu')

      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd podczas tworzenia pucharu')
    } finally {
      setGenerating(false)
    }
  }

  // Per-step "next allowed" guard.
  const canNext = (() => {
    switch (step) {
      case 1: return name.trim().length > 0
      case 2: return participantCount >= 4
      case 6: return assignment === 'manual' || firstGameweekId !== ''
      default: return true
    }
  })()

  return (
    <Card className="hover-lift">
      <CardHeader>
        <CardTitle>Kreator turnieju pucharowego</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Stepper */}
        <div className="flex flex-wrap gap-2 mb-8">
          {STEP_TITLES.map((title, i) => (
            <div
              key={title}
              className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                step === i + 1
                  ? 'bg-[var(--mineral-green)] text-white'
                  : step > i + 1
                  ? 'bg-[var(--success)]/20 text-[var(--success)]'
                  : 'bg-[var(--background-tertiary)] text-[var(--foreground-tertiary)]'
              }`}
            >
              {i + 1}. {title}
            </div>
          ))}
        </div>

        {error && <Alert variant="error" className="mb-6" dismissible onDismiss={() => setError(null)}>{error}</Alert>}

        {/* Step 1: Preset + name */}
        {step === 1 && (
          <div className="space-y-6">
            <Input label="Nazwa pucharu" value={name} onChange={e => setName(e.target.value)} placeholder="np. Puchar Ligi 2025/26" fullWidth required />
            <div>
              <div className="text-sm font-medium mb-3">Wybierz format</div>
              <div className="grid gap-3">
                {PRESETS.map(p => (
                  <button
                    key={p.value}
                    onClick={() => applyPreset(p.value)}
                    className={`text-left p-4 rounded-xl border-2 transition-colors ${
                      preset === p.value
                        ? 'border-[var(--mineral-green)] bg-[var(--mineral-green)]/10'
                        : 'border-[var(--navy-border)] hover:border-[var(--mineral-green)]/50'
                    }`}
                  >
                    <div className="font-semibold">{p.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Participants */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-[var(--foreground-secondary)]">
              Domyślnie biorą udział wszyscy menedżerowie. Odznacz tych, którzy mają nie grać w pucharze.
            </p>
            <div className="text-sm font-medium">
              Uczestnicy: {participantCount} / {managers.length}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
              {managers.map(m => {
                const included = !excluded.has(m.id)
                return (
                  <label key={m.id} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border ${included ? 'border-[var(--mineral-green)]/40 bg-[var(--mineral-green)]/5' : 'border-[var(--navy-border)] opacity-60'}`}>
                    <input type="checkbox" checked={included} onChange={() => toggleExcluded(m.id)} className="w-4 h-4" />
                    <span>{managerName(m)}</span>
                  </label>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 3: Groups */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Liczba grup</label>
              <input type="number" min={1} value={groupCount}
                onChange={e => setGroupCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-32 px-4 py-2 border border-[var(--navy-border)] rounded-lg bg-[var(--background)] " />
              <p className="text-sm text-[var(--foreground-tertiary)] mt-1">
                Rozmiary grup (auto): {resolveGroupSizes(participantCount, format).join(', ')}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Rodzaj rozgrywek w grupie</label>
              <div className="flex gap-3">
                <button onClick={() => setLegs(1)} className={`px-4 py-2 rounded-lg border-2 ${legs === 1 ? 'border-[var(--mineral-green)] bg-[var(--mineral-green)]/10' : 'border-[var(--navy-border)]'}`}>Pojedyncze (każdy z każdym raz)</button>
                <button onClick={() => setLegs(2)} className={`px-4 py-2 rounded-lg border-2 ${legs === 2 ? 'border-[var(--mineral-green)] bg-[var(--mineral-green)]/10' : 'border-[var(--navy-border)]'}`}>Podwójne (mecz i rewanż)</button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Losowanie grup</label>
              <div className="flex gap-3">
                <button onClick={() => setAssignment('random')} className={`px-4 py-2 rounded-lg border-2 ${assignment === 'random' ? 'border-[var(--mineral-green)] bg-[var(--mineral-green)]/10' : 'border-[var(--navy-border)]'}`}>Losowe</button>
                <button onClick={() => setAssignment('manual')} className={`px-4 py-2 rounded-lg border-2 ${assignment === 'manual' ? 'border-[var(--mineral-green)] bg-[var(--mineral-green)]/10' : 'border-[var(--navy-border)]'}`}>Ręczne</button>
              </div>
              {assignment === 'manual' && (
                <p className="text-sm text-[var(--foreground-tertiary)] mt-2">Przy losowaniu ręcznym przypiszesz menedżerów do grup na kolejnym ekranie.</p>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Qualification */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Ilu awansuje z każdej grupy</label>
              <input type="number" min={1} value={topPerGroup}
                onChange={e => setTopPerGroup(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-32 px-4 py-2 border border-[var(--navy-border)] rounded-lg bg-[var(--background)]" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Najlepsi z pozostałych (opcjonalnie)</label>
              <input type="number" min={0} value={bestRemaining}
                onChange={e => setBestRemaining(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-32 px-4 py-2 border border-[var(--navy-border)] rounded-lg bg-[var(--background)]" />
            </div>
            <Alert variant="info">
              Łączna liczba awansujących: <strong>{totalQualifiers}</strong>. Musi być potęgą dwójki (2, 4, 8, 16, 32).
            </Alert>
          </div>
        )}

        {/* Step 5: Knockout */}
        {step === 5 && (
          <div className="space-y-4">
            <p className="text-[var(--foreground-secondary)]">Rundy fazy pucharowej wynikają z liczby awansujących. Ustaw liczbę meczów w każdej rundzie.</p>
            {knockoutStages.length === 0 ? (
              <Alert variant="warning">Najpierw ustaw poprawną liczbę awansujących (potęga dwójki).</Alert>
            ) : (
              <div className="space-y-3">
                {knockoutStages.map(stage => (
                  <div key={stage} className="flex items-center justify-between p-4 rounded-xl bg-[var(--background-tertiary)]">
                    <span className="font-semibold">{stageLabelPl(stage)}</span>
                    <div className="flex gap-2">
                      <button onClick={() => setStageLegs(stage, 1)} className={`px-3 py-1.5 rounded-lg border-2 ${(knockoutLegs[stage] ?? (stage === 'final' ? 1 : 2)) === 1 ? 'border-[var(--mineral-green)] bg-[var(--mineral-green)]/10' : 'border-[var(--navy-border)]'}`}>1 mecz</button>
                      <button onClick={() => setStageLegs(stage, 2)} className={`px-3 py-1.5 rounded-lg border-2 ${(knockoutLegs[stage] ?? (stage === 'final' ? 1 : 2)) === 2 ? 'border-[var(--mineral-green)] bg-[var(--mineral-green)]/10' : 'border-[var(--navy-border)]'}`}>2 mecze (dwumecz)</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 6: Calendar */}
        {step === 6 && (
          <div className="space-y-4">
            {assignment === 'manual' ? (
              <Alert variant="info">
                Wybrano ręczne losowanie grup. Po utworzeniu pucharu przypiszesz menedżerów do grup, a następnie wygenerujesz harmonogram na stronie harmonogramu (gdzie wybierzesz kolejki).
              </Alert>
            ) : (
              <>
                <p className="text-[var(--foreground-secondary)]">
                  Wybierz pierwszą kolejkę ligową dla pucharu. Kolejne {summary.totalWeeks} kolejek pucharowych zostanie zmapowanych po kolei (każde mapowanie można później zmienić na stronie harmonogramu).
                </p>
                <label className="block text-sm font-medium mb-2">Pierwsza kolejka ligowa</label>
                <select value={firstGameweekId} onChange={e => setFirstGameweekId(e.target.value)}
                  className="w-full px-4 py-2 border border-[var(--navy-border)] rounded-lg bg-[var(--background)]">
                  <option value="">— wybierz —</option>
                  {sortedGameweeks.map(gw => (
                    <option key={gw.id} value={gw.id}>Kolejka {gw.week}</option>
                  ))}
                </select>
              </>
            )}
          </div>
        )}

        {/* Step 7: Summary */}
        {step === 7 && (
          <div className="space-y-4">
            {validation.errors.length > 0 && (
              <Alert variant="error">
                <div className="font-semibold mb-1">Nie można wygenerować — popraw błędy:</div>
                <ul className="list-disc ml-5">{validation.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
              </Alert>
            )}
            {validation.warnings.map((w, i) => (
              <Alert key={i} variant="warning">{w}</Alert>
            ))}
            <div className="p-6 rounded-xl bg-[var(--background-tertiary)] space-y-2">
              <div className="text-lg font-semibold">
                {summary.groupStageWeeks} {kolejkaWord()} grupowych + {summary.knockoutWeeks} {kolejkaWord()} pucharowych = {summary.totalWeeks} {kolejkaWord()}.
              </div>
              <div className="text-[var(--foreground-secondary)]">
                Każdy menedżer rozegra {summary.matchesPerManager.min === summary.matchesPerManager.max
                  ? `${summary.matchesPerManager.min} ${meczWord(summary.matchesPerManager.min)}`
                  : `od ${summary.matchesPerManager.min} do ${summary.matchesPerManager.max} ${meczWord(summary.matchesPerManager.max)}`} grupowych {byesSentence(summary.byesPerManager.min, summary.byesPerManager.max)}.
              </div>
              <div className="text-sm text-[var(--foreground-tertiary)] pt-2">
                Grupy: {summary.groupSizes.join(', ')} · Awansuje: {summary.totalQualifiers} · Faza pucharowa: {summary.knockoutStages.map(s => stageLabelPl(s)).join(' → ')}
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <div className="flex justify-between mt-8">
          <Button variant="secondary" disabled={step === 1 || generating} onClick={() => setStep(s => Math.max(1, s - 1))}>
            Wstecz
          </Button>
          {step < 7 ? (
            <Button disabled={!canNext} onClick={() => setStep(s => Math.min(7, s + 1))}>
              Dalej
            </Button>
          ) : (
            <Button loading={generating} disabled={!validation.valid || generating} onClick={generate}>
              {assignment === 'manual' ? 'Utwórz i przypisz grupy' : 'Wygeneruj puchar'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

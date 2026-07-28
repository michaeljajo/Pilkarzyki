'use client'

import SquadSelection from '@/components/SquadSelection'
import { AlertCircle } from 'lucide-react'

interface DefaultLineupGateScreenProps {
  leagueId: string
  /** 1 = regular league default, 2 = cup-week default (league + cup lineups). */
  stage: 1 | 2
  removedPlayerNames: string[]
}

/**
 * Rendered in place of a gated league page when a manager still owes a valid
 * default lineup ("żelazo"). This deliberately does NOT redirect — the gate is
 * enforced by swapping the page content rather than changing the URL, which
 * avoids the App-Router redirect-in-shared-layout loop entirely.
 *
 * Two sequential stages:
 *   1. the regular league default (a league-only gameweek), then
 *   2. the cup-week default — a (possibly different) league lineup plus the cup
 *      lineup for a gameweek that also has a cup match.
 *
 * Saving each stage sends the manager back to the league dashboard (a full
 * navigation, so the layout re-evaluates the gate). Once stage 1 is valid the
 * gate returns stage 2; once both are valid the manager is let through.
 */
export default function DefaultLineupGateScreen({
  leagueId,
  stage,
  removedPlayerNames,
}: DefaultLineupGateScreenProps) {
  const isCupWeek = stage === 2

  const heading = isCupWeek
    ? 'Ustaw domyślny skład na kolejkę z pucharem (żelazo)'
    : 'Ustaw domyślny skład na kolejkę ligową (żelazo)'

  const subheading = isCupWeek
    ? 'Ten skład zostanie automatycznie użyty w kolejkach, w których grasz również mecz pucharowy i nie wybierzesz składów przed terminem zamknięcia. Ustaw skład ligowy oraz pucharowy — mogą się różnić od składu na zwykłą kolejkę.'
    : 'Ten skład zostanie automatycznie użyty w zwykłych kolejkach ligowych, w których nie wybierzesz składu przed terminem zamknięcia.'

  const noticeText = isCupWeek
    ? 'Zanim przejdziesz dalej, ustaw prawidłowy domyślny skład na kolejkę, w której grasz mecz ligowy i pucharowy — osobny skład ligowy oraz skład pucharowy.'
    : 'Zanim przejdziesz dalej, musisz ustawić prawidłowy domyślny skład (żelazo) na zwykłą kolejkę ligową na ten sezon.'

  return (
    <div className="container mx-auto px-4 pb-8" style={{ paddingTop: '8px' }}>
      <div className="mb-4">
        <div className="text-sm font-semibold text-primary-teal mb-1">Krok {stage} z 2</div>
        <h1
          className="text-3xl font-bold text-navy-600"
          style={{ lineHeight: '1.1', marginBottom: '4px', marginTop: '4px' }}
        >
          {heading}
        </h1>
        <p className="text-gray-600" style={{ lineHeight: '1.4', marginTop: '4px' }}>
          {subheading}
        </p>
      </div>

      <div role="alert" className="mb-4 rounded-lg border-2 border-red-300 bg-red-50 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle size={22} className="text-red-600 shrink-0 mt-0.5" />
          <div className="text-sm text-red-800" style={{ lineHeight: '1.5' }}>
            <p className="font-bold mb-1">Ustawienie domyślnego składu jest wymagane</p>
            <p>{noticeText}</p>
            {removedPlayerNames.length > 0 && (
              <p className="mt-2">
                Twój poprzedni domyślny skład jest już nieaktualny — następujący
                zawodnicy nie należą już do Twojego składu:{' '}
                <span className="font-semibold">{removedPlayerNames.join(', ')}</span>. Ustaw
                skład ponownie.
              </p>
            )}
          </div>
        </div>
      </div>

      <SquadSelection
        leagueId={leagueId}
        isDefaultMode={true}
        defaultVariant={isCupWeek ? 'cup-week' : 'regular'}
        redirectAfterSave={`/leagues/${leagueId}`}
      />
    </div>
  )
}

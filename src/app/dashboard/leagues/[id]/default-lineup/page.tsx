'use client'

import { use, useEffect, useState } from 'react'
import SquadSelection from '@/components/SquadSelection'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

type Variant = 'regular' | 'cup-week'

/**
 * Voluntary default-lineup editor. Managers set their defaults here at any time.
 * When the league has a cup, two defaults are editable via tabs:
 *   - "Kolejka ligowa"      → the regular league default (league-only gameweeks)
 *   - "Kolejka z pucharem"  → the cup-week default (a possibly different league
 *                             lineup + the cup lineup, for gameweeks that also
 *                             have a cup match)
 *
 * The mandatory pre-season gate reuses SquadSelection the same way; this page is
 * the always-available entry point for editing.
 */
export default function DefaultLineupPage({ params }: Props) {
  const { id: leagueId } = use(params)
  const [variant, setVariant] = useState<Variant>('regular')
  const [hasCup, setHasCup] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/cups?leagueId=${leagueId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled) setHasCup(!!data?.cup)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [leagueId])

  return (
    <div className="container mx-auto px-4 pb-8" style={{ paddingTop: '8px' }}>
      <div className="mb-4">
        <Link
          href={`/dashboard/leagues/${leagueId}`}
          prefetch={false}
          className="text-primary-teal hover:underline inline-block"
          style={{ marginBottom: '4px', display: 'block' }}
        >
          ← Powrót do składu
        </Link>
        <h1
          className="text-3xl font-bold text-navy-600"
          style={{ lineHeight: '1.1', marginBottom: '4px', marginTop: '4px' }}
        >
          Domyślne składy (żelazo)
        </h1>
        <p className="text-gray-600" style={{ lineHeight: '1.4', marginTop: '4px' }}>
          Te składy zostaną automatycznie użyte w kolejkach, w których nie wybierzesz składu
          przed terminem zamknięcia.
        </p>
      </div>

      {hasCup && (
        <div className="mb-4 flex gap-2" role="tablist" aria-label="Wybór domyślnego składu">
          <button
            role="tab"
            aria-selected={variant === 'regular'}
            onClick={() => setVariant('regular')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              variant === 'regular'
                ? 'bg-[#29544D] text-white shadow'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Kolejka ligowa
          </button>
          <button
            role="tab"
            aria-selected={variant === 'cup-week'}
            onClick={() => setVariant('cup-week')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              variant === 'cup-week'
                ? 'bg-[#29544D] text-white shadow'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Kolejka z pucharem
          </button>
        </div>
      )}

      <p className="text-sm text-gray-500 mb-4">
        {variant === 'cup-week'
          ? 'Skład na kolejkę, w której grasz mecz ligowy i pucharowy — ustaw osobny skład ligowy oraz skład pucharowy.'
          : 'Skład na zwykłą kolejkę ligową (bez meczu pucharowego).'}
      </p>

      {/* key forces a fresh load of the selected variant's saved players */}
      <SquadSelection
        key={variant}
        leagueId={leagueId}
        isDefaultMode={true}
        defaultVariant={variant}
      />
    </div>
  )
}

'use client'

import { use } from 'react'
import SquadSelection from '@/components/SquadSelection'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

export default function DefaultLineupPage({ params }: Props) {
  const { id: leagueId } = use(params)

  return (
    <div className="container mx-auto px-4 pb-8" style={{ paddingTop: '8px' }}>
      {/* Header */}
      <div className="mb-4">
        <Link
          href={`/dashboard/leagues/${leagueId}`}
          className="text-primary-teal hover:underline inline-block"
          style={{ marginBottom: '4px', display: 'block' }}
        >
          ← Powrót do składu
        </Link>
        <h1 className="text-3xl font-bold text-navy-600" style={{ lineHeight: '1.1', marginBottom: '4px', marginTop: '4px' }}>
          Ustaw domyślny skład (żelazo)
        </h1>
        <p className="text-gray-600" style={{ lineHeight: '1.4', marginTop: '4px' }}>
          Ten skład zostanie automatycznie użyty w kolejkach, w których nie wybierzesz składu przed terminem zamknięcia.
        </p>
      </div>

      {/* Squad Selection in Default Mode */}
      <SquadSelection leagueId={leagueId} isDefaultMode={true} />
    </div>
  )
}

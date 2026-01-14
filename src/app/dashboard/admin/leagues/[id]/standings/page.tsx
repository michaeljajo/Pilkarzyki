'use client'

import { useParams } from 'next/navigation'
import LeagueTable from '@/components/LeagueTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Trophy } from 'lucide-react'
import { motion } from 'framer-motion'

export default function AdminStandingsPage() {
  const params = useParams()
  const leagueId = params.id as string

  return (
    <div className="space-y-6 sm:space-y-8 lg:space-y-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2 sm:gap-3"
      >
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--foreground)]">
          Tabela i Rozstrzyganie
        </h1>
        <p className="text-base sm:text-lg lg:text-xl text-[var(--foreground-secondary)]">
          Zarządzaj tabelą ligową, przeliczaj wyniki i rozstrzygaj remisy
        </p>
      </motion.div>

      {/* Instructions Card */}
      <Card className="hover-lift bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 sm:gap-3 text-blue-800 text-base sm:text-lg">
            💡 Jak używać
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 sm:space-y-3 text-blue-700 text-sm sm:text-base">
            <p>
              <strong>Przelicz:</strong> Automatycznie przelicza tabelę na podstawie wyników meczów
            </p>
            <p>
              <strong>Rozstrzyganie:</strong> Ręcznie ustaw kolejność drużyn w przypadku remisu (niższa wartość = wyższa pozycja)
            </p>
            <p className="text-xs sm:text-sm text-blue-600 mt-3 sm:mt-4">
              ⚠️ Ręczne rozstrzyganie powinno być używane tylko wtedy, gdy automatyczne kryteria (punkty, bilans bramek) nie wystarczają do rozstrzygnięcia równej pozycji drużyn.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* League Table with Admin Controls */}
      <div>
        <LeagueTable leagueId={leagueId} showAdminControls={true} />
      </div>
    </div>
  )
}

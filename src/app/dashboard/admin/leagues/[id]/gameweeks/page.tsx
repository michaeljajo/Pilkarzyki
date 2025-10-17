'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface Gameweek {
  id: string
  week: number
  start_date: string
  end_date: string
  lineup_lock_date: string
  is_completed: boolean
  is_locked: boolean
}

export default function LeagueGameweeksPage() {
  const params = useParams()
  const [gameweeks, setGameweeks] = useState<Gameweek[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (params.id) {
      fetchGameweeks()
    }
  }, [params.id])

  async function fetchGameweeks() {
    try {
      setLoading(true)
      const response = await fetch(`/api/leagues/${params.id}/gameweeks`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch gameweeks')
      }

      setGameweeks(data.gameweeks || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    )
  }

  return (
    <div className="space-y-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-5xl font-bold text-[var(--foreground)]">Kolejki Ligi</h1>
          <p className="mt-3 text-xl text-[var(--foreground-secondary)]">
            Zobacz i zarządzaj kolejkami tej ligi
          </p>
        </div>
        <Button onClick={fetchGameweeks} variant="secondary" size="lg">
          Odśwież
        </Button>
      </div>

      {error && (
        <div className="bg-[var(--danger)]/10 border border-[var(--danger)]/30 rounded-2xl p-6">
          <div className="text-base text-[var(--danger)]">{error}</div>
        </div>
      )}

      <Card className="hover-lift">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            Kolejki ({gameweeks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {gameweeks.length === 0 ? (
            <div className="text-center py-20 text-[var(--foreground-secondary)]">
              <p className="text-xl font-semibold mb-3">Nie utworzono jeszcze kolejek</p>
              <p className="text-base">Kolejki są tworzone podczas generowania harmonogramu</p>
            </div>
          ) : (
            <div className="space-y-5 -ml-2">
              {gameweeks.map((gameweek) => (
                <div
                  key={gameweek.id}
                  className="flex justify-between items-center p-6 pl-8 bg-[var(--background-tertiary)] rounded-2xl hover:bg-[var(--background-tertiary)]/90 transition-colors"
                >
                  <div>
                    <div className="font-semibold text-xl text-[var(--foreground)]">Kolejka {gameweek.week}</div>
                    <div className="text-base text-[var(--foreground-secondary)] mt-2">
                      {new Date(gameweek.start_date).toLocaleDateString()} -{' '}
                      {new Date(gameweek.end_date).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-[var(--foreground-tertiary)] mt-1">
                      Blokada Składu: {new Date(gameweek.lineup_lock_date).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <span
                      className={`px-4 py-2 text-sm font-semibold rounded-full ${
                        gameweek.is_completed
                          ? 'bg-[var(--success)]/20 text-[var(--success)]'
                          : gameweek.is_locked
                          ? 'bg-[var(--warning)]/20 text-[var(--warning)]'
                          : 'bg-[var(--info)]/20 text-[var(--info)]'
                      }`}
                    >
                      {gameweek.is_completed
                        ? 'Zakończona'
                        : gameweek.is_locked
                        ? 'Zablokowane'
                        : 'Otwarta'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

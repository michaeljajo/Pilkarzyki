'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Trophy, Calendar, CheckCircle, XCircle, Loader2, AlertCircle, ArrowRight, Plus, Settings } from 'lucide-react'
import { League } from '@/types'

interface LeagueListProps {
  isAdmin: boolean
}

export default function LeagueList({ isAdmin }: LeagueListProps) {
  const [leagues, setLeagues] = useState<League[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchLeagues() {
      try {
        const endpoint = isAdmin ? '/api/leagues' : '/api/manager/leagues'
        const response = await fetch(endpoint)

        if (!response.ok) {
          throw new Error('Failed to fetch leagues')
        }

        const data = await response.json()
        setLeagues(data.leagues || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchLeagues()
  }, [isAdmin])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 size={32} className="animate-spin text-[var(--mineral-green)]" />
        <p className="text-sm text-[var(--foreground-secondary)]">Loading leagues...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass rounded-xl p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-[var(--danger)]/20 flex items-center justify-center">
            <AlertCircle size={32} className="text-[var(--danger)]" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">Error loading leagues</h3>
        <p className="text-[var(--foreground-secondary)] mb-4">
          {error.includes('Failed to fetch leagues')
            ? 'Connection issue or no leagues assigned yet.'
            : 'Please try refreshing the page or contact support.'}
        </p>
        <Button
          onClick={() => window.location.reload()}
          variant="secondary"
          icon={<ArrowRight size={16} />}
          iconPosition="right"
        >
          Retry
        </Button>
      </div>
    )
  }

  if (leagues.length === 0) {
    return (
      <div className="glass rounded-xl p-12 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-[var(--mineral-green)]/20 flex items-center justify-center">
            <Trophy size={40} className="text-[var(--mineral-green)]" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-[var(--foreground)] mb-3">
          {isAdmin ? 'No leagues created yet' : 'No leagues assigned'}
        </h3>
        <p className="text-[var(--foreground-secondary)] mb-6 max-w-md mx-auto">
          {isAdmin
            ? 'Create your first league to get started with fantasy football management'
            : 'You haven\'t been assigned to any leagues yet or haven\'t created your own.'}
        </p>
        {!isAdmin && (
          <div className="text-sm text-[var(--foreground-tertiary)] mb-6 space-y-2">
            <p>You can create your own league or wait for administrators to add you to existing leagues.</p>
            <p>Once you have leagues, you&apos;ll be able to set your weekly lineups here.</p>
          </div>
        )}
        {isAdmin && (
          <Link href="/dashboard/admin/leagues/new">
            <Button size="lg" icon={<Plus size={20} />}>
              Create Your First League
            </Button>
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {leagues.map((league, index) => (
        <Card
          key={league.id}
          hover3d
          className="animate-fade-in-up"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <CardHeader>
            <div className="flex items-start justify-between mb-2">
              <div className="w-10 h-10 rounded-lg bg-[var(--mineral-green)]/20 flex items-center justify-center">
                <Trophy size={20} className="text-[var(--mineral-green)]" />
              </div>
              {league.isActive ? (
                <Badge variant="success" size="sm">
                  <CheckCircle size={12} className="mr-1" />
                  Active
                </Badge>
              ) : (
                <Badge variant="outline" size="sm">
                  <XCircle size={12} className="mr-1" />
                  Inactive
                </Badge>
              )}
            </div>
            <CardTitle className="text-xl">{league.name}</CardTitle>
            <CardDescription className="flex items-center gap-2 text-[var(--foreground-tertiary)]">
              <Calendar size={14} />
              Season {league.season} • GW {league.currentGameweek}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={
              isAdmin
                ? `/dashboard/admin/leagues/${league.id}`
                : `/dashboard/leagues/${league.id}`
            }>
              <Button
                size="sm"
                fullWidth
                icon={isAdmin ? <Settings size={16} /> : <ArrowRight size={16} />}
                iconPosition="right"
              >
                {isAdmin ? 'Manage League' : 'View League'}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
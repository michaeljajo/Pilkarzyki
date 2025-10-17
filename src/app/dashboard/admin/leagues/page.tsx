'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { League } from '@/types'

interface CreateLeagueModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (leagueData: LeagueFormData) => void
  loading: boolean
}

interface LeagueFormData {
  name: string
  season: string
}

function CreateLeagueModal({ isOpen, onClose, onSubmit, loading }: CreateLeagueModalProps) {
  const [formData, setFormData] = useState<LeagueFormData>({
    name: '',
    season: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1).toString().slice(-2)
  })



  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }


  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Utwórz Nową Ligę</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nazwa Ligi
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Premier League Fantasy"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sezon
            </label>
            <input
              type="text"
              required
              value={formData.season}
              onChange={(e) => setFormData(prev => ({ ...prev, season: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="2024-25"
            />
          </div>




          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              loading={loading}
              className="flex-1"
            >
              Utwórz Ligę
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface LeagueCardProps {
  league: League & { admin?: { first_name?: string; last_name?: string } }
}

function LeagueCard({ league }: LeagueCardProps) {
  return (
    <Card className="hover-lift">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{league.name}</CardTitle>
            <p className="text-base text-[var(--foreground-secondary)] mt-2">Sezon {league.season}</p>
          </div>
          <span
            className={`inline-flex px-3 py-1.5 text-sm font-semibold rounded-full ${
              league.isActive
                ? 'bg-[var(--success)]/20 text-[var(--success)]'
                : 'bg-[var(--foreground-tertiary)]/20 text-[var(--foreground-tertiary)]'
            }`}
          >
            {league.isActive ? 'Aktywna' : 'Nieaktywna'}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between text-base">
            <span className="text-[var(--foreground-secondary)]">Administrator:</span>
            <span className="text-[var(--foreground)]">
              {league.admin?.first_name} {league.admin?.last_name}
            </span>
          </div>
          <div className="flex justify-between text-base">
            <span className="text-[var(--foreground-secondary)]">Obecna Kolejka:</span>
            <span className="text-[var(--foreground)]">{league.currentGameweek}</span>
          </div>
          <div className="flex justify-between text-base">
            <span className="text-[var(--foreground-secondary)]">Utworzono:</span>
            <span className="text-[var(--foreground)]">{new Date(league.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Link href={`/dashboard/admin/leagues/${league.id}`} className="flex-1">
            <Button size="sm" variant="secondary" className="w-full">
              Szczegóły
            </Button>
          </Link>
          <Link href={`/dashboard/admin/leagues/${league.id}/settings`} className="flex-1">
            <Button size="sm" variant="ghost" className="w-full">
              Ustawienia
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

export default function LeaguesPage() {
  const [leagues, setLeagues] = useState<League[]>([])
  const [loading, setLoading] = useState(true)
  const [createLoading, setCreateLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLeagues()
  }, [])

  async function fetchLeagues() {
    try {
      setLoading(true)
      const response = await fetch('/api/leagues')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch leagues')
      }

      setLeagues(data.leagues || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateLeague(leagueData: LeagueFormData) {
    try {
      setCreateLoading(true)
      const response = await fetch('/api/leagues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leagueData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create league')
      }

      setLeagues(prev => [data.league, ...prev])
      setShowCreateModal(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create league')
      setTimeout(() => setError(null), 5000)
    } finally {
      setCreateLoading(false)
    }
  }

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-5xl font-bold text-[var(--foreground)]">Zarządzanie Ligami</h1>
          <p className="mt-3 text-xl text-[var(--foreground-secondary)]">
            Twórz i zarządzaj ligami fantasy football
          </p>
        </div>
        <div className="flex gap-4">
          <Button onClick={fetchLeagues} variant="secondary" size="lg">
            Odśwież
          </Button>
          <Button onClick={() => setShowCreateModal(true)} size="lg">
            Utwórz Ligę
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-[var(--danger)]/10 border border-[var(--danger)]/30 rounded-2xl p-6">
          <div className="text-base text-[var(--danger)]">{error}</div>
        </div>
      )}

      {/* Leagues Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse h-80 bg-[var(--background-secondary)] rounded-2xl" />
          ))}
        </div>
      ) : leagues.length === 0 ? (
        <Card className="hover-lift">
          <CardContent className="text-center py-20">
            <div className="text-[var(--foreground-secondary)]">
              <div className="text-6xl mb-6">🏆</div>
              <p className="text-2xl font-semibold mb-3">Nie znaleziono lig</p>
              <p className="text-base mt-2 mb-8">Utwórz swoją pierwszą ligę, aby rozpocząć</p>
              <Button onClick={() => setShowCreateModal(true)} size="lg">
                Utwórz Ligę
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {leagues.map((league) => (
            <LeagueCard key={league.id} league={league} />
          ))}
        </div>
      )}

      {/* Create League Modal */}
      <CreateLeagueModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateLeague}
        loading={createLoading}
      />
    </div>
  )
}
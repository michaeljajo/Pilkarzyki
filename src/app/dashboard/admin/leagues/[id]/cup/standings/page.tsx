'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { CupGroupTable } from '@/components/CupGroupTable'
import { Trophy, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'

interface Cup {
  id: string
  name: string
  stage: string
  league_id: string
}

interface Manager {
  id: string
  first_name?: string
  last_name?: string
  email: string
  squad?: { team_name?: string }
}

interface GroupStanding {
  id: string
  group_name: string
  manager_id: string
  played: number
  won: number
  drawn: number
  lost: number
  goals_for: number
  goals_against: number
  goal_difference: number
  points: number
  position: number
  qualified: boolean
  updated_at: string
  manager: Manager
  manualTiebreaker?: number | null
}

interface Group {
  group_name: string
  standings: GroupStanding[]
}

interface CupStandingsData {
  cup: Cup
  groups: Group[]
}

export default function AdminCupStandingsPage() {
  const params = useParams()
  const leagueId = params.id as string

  const [cupId, setCupId] = useState<string>('')
  const [cupStandingsData, setCupStandingsData] = useState<CupStandingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [recalculating, setRecalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchCupId()
  }, [leagueId])

  useEffect(() => {
    if (cupId) {
      fetchCupStandings()
    }
  }, [cupId])

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null)
        setSuccess(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, success])

  const fetchCupId = async () => {
    try {
      const cupResponse = await fetch(`/api/cups?leagueId=${leagueId}`)
      if (cupResponse.ok) {
        const cupListData = await cupResponse.json()
        if (cupListData.cup) {
          setCupId(cupListData.cup.id)
        } else {
          setError('Brak pucharu dla tej ligi')
          setLoading(false)
        }
      } else {
        setError('Nie udało się pobrać informacji o pucharze')
        setLoading(false)
      }
    } catch (err) {
      console.error('Failed to fetch cup:', err)
      setError('Błąd podczas pobierania danych pucharu')
      setLoading(false)
    }
  }

  const fetchCupStandings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const standingsResponse = await fetch(`/api/cups/${cupId}/group-standings`)
      if (standingsResponse.ok) {
        const standingsData = await standingsResponse.json()
        setCupStandingsData(standingsData)
      } else {
        const errorData = await standingsResponse.json().catch(() => ({}))
        setError(errorData.error || 'Nie udało się pobrać tabeli pucharu')
      }
    } catch (err) {
      console.error('Failed to fetch cup standings:', err)
      setError('Błąd podczas pobierania danych pucharu')
    } finally {
      setLoading(false)
    }
  }, [cupId])

  const recalculateStandings = async () => {
    if (!cupId) return

    try {
      setRecalculating(true)
      setError(null)

      const response = await fetch(`/api/cups/${cupId}/group-standings`, {
        method: 'POST'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Nie udało się przeliczyć tabeli')
      }

      const data = await response.json()
      setCupStandingsData(data)
      setSuccess('Tabela pucharu została przeliczona pomyślnie')
    } catch (err) {
      console.error('Error recalculating cup standings:', err)
      setError(err instanceof Error ? err.message : 'Nie udało się przeliczyć tabeli pucharu')
    } finally {
      setRecalculating(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="h-12 bg-[var(--background-secondary)] rounded-xl w-1/3"></div>
        <div className="h-64 bg-[var(--background-secondary)] rounded-xl"></div>
      </div>
    )
  }

  if (error && !cupStandingsData) {
    return (
      <div className="space-y-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-3 -mt-16"
        >
          <h1 className="text-5xl font-bold text-[var(--foreground)]">
            Tabela Pucharu
          </h1>
        </motion.div>

        <Alert variant="error">
          {error}
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-3 -mt-16"
      >
        <h1 className="text-5xl font-bold text-[var(--foreground)]">
          Tabela Pucharu
        </h1>
        <p className="text-xl text-[var(--foreground-secondary)]">
          Zarządzaj tabelami grupowymi, przeliczaj wyniki i rozstrzygaj remisy
        </p>
      </motion.div>

      {/* Messages */}
      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" dismissible onDismiss={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Instructions Card */}
      <Card className="hover-lift bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-amber-800">
            💡 Jak używać
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-amber-700">
            <p>
              <strong>Rozstrzyganie:</strong> Każda grupa ma przycisk "Rozstrzyganie" do ręcznego ustawiania kolejności drużyn w przypadku remisu
            </p>
            <p>
              <strong>Przelicz Wszystkie:</strong> Automatycznie przelicza tabele wszystkich grup na podstawie wyników meczów
            </p>
            <p className="text-sm text-amber-600 mt-4">
              ⚠️ Ręczne rozstrzyganie powinno być używane tylko wtedy, gdy automatyczne kryteria (punkty, bilans bramek) nie wystarczają do rozstrzygnięcia równej pozycji drużyn w grupie.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Cup Info & Recalculate */}
      {cupStandingsData && (
        <Card className="hover-lift">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-3">
                <Trophy size={28} className="text-amber-600" />
                {cupStandingsData.cup.name}
              </CardTitle>
              <Button
                onClick={recalculateStandings}
                loading={recalculating}
                disabled={recalculating}
                icon={<RefreshCw size={18} />}
                size="lg"
              >
                {recalculating ? 'Przeliczanie...' : 'Przelicz Wszystkie Grupy'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-[var(--background-tertiary)] rounded-xl">
                <div className="text-sm text-[var(--foreground-secondary)] mb-2">Etap Pucharu</div>
                <div className="text-2xl font-bold text-[var(--foreground)] capitalize">
                  {cupStandingsData.cup.stage.replace('_', ' ')}
                </div>
              </div>
              <div className="p-6 bg-[var(--background-tertiary)] rounded-xl">
                <div className="text-sm text-[var(--foreground-secondary)] mb-2">Liczba Grup</div>
                <div className="text-2xl font-bold text-[var(--foreground)]">
                  {cupStandingsData.groups.length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cup Group Tables */}
      {cupStandingsData && cupStandingsData.groups.length > 0 ? (
        <div>
          <CupGroupTable
            groups={cupStandingsData.groups}
            cupId={cupId}
            showAdminControls={true}
            onRefresh={() => {
              fetchCupStandings()
              recalculateStandings()
            }}
          />
        </div>
      ) : (
        <Card className="hover-lift">
          <CardContent>
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🏆</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Brak danych grupowych</h3>
              <p className="text-gray-600">
                Faza grupowa jeszcze się nie rozpoczęła lub nie zostały przypisane grupy.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

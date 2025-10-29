'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { Trophy, Plus, Trash2, Users, Calendar, Award, Edit3 } from 'lucide-react'
import { motion } from 'framer-motion'
import { CupWithLeague } from '@/types'

interface CupStats {
  totalManagers: number
  groupsAssigned: number
  totalGroups: number
  scheduleGenerated: boolean
  groupStageMatches: number
}

export default function CupOverviewPage() {
  const params = useParams()
  const router = useRouter()
  const [cup, setCup] = useState<CupWithLeague | null>(null)
  const [stats, setStats] = useState<CupStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [cupName, setCupName] = useState('')

  useEffect(() => {
    if (params.id) {
      fetchCupData()
    }
  }, [params.id])

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

  async function fetchCupData() {
    try {
      setLoading(true)

      // Fetch cup
      const cupResponse = await fetch(`/api/cups?leagueId=${params.id}`)
      const cupData = await cupResponse.json()

      if (cupResponse.ok && cupData.cup) {
        setCup(cupData.cup)
        await fetchCupStats(cupData.cup.id)
      } else {
        setCup(null)
        setStats(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cup data')
    } finally {
      setLoading(false)
    }
  }

  async function fetchCupStats(cupId: string) {
    try {
      // Fetch group assignments
      const groupsResponse = await fetch(`/api/cups/${cupId}/groups`)
      const groupsData = await groupsResponse.json()

      // Fetch schedule
      const scheduleResponse = await fetch(`/api/cups/${cupId}/schedule`)
      const scheduleData = await scheduleResponse.json()

      const groups = groupsData.groups || {}
      const groupNames = Object.keys(groups)
      const totalManagers = groupNames.reduce((sum, groupName) => sum + groups[groupName].length, 0)

      interface ScheduleGameweek {
        matches?: Array<{ stage: string }>
      }
      const schedule = scheduleData.schedule || []
      const groupStageMatches = schedule.reduce((sum: number, gw: ScheduleGameweek) =>
        sum + (gw.matches?.filter((m) => m.stage === 'group_stage').length || 0), 0
      )

      // Calculate expected number of groups (2 for 4-team cups, otherwise totalManagers / 4)
      const totalGroups = totalManagers === 4 ? 2 : totalManagers / 4

      setStats({
        totalManagers,
        groupsAssigned: groupNames.length,
        totalGroups,
        scheduleGenerated: schedule.length > 0,
        groupStageMatches
      })
    } catch (err) {
      console.error('Failed to fetch cup stats:', err)
    }
  }

  async function createCup() {
    if (!cupName.trim()) {
      setError('Cup name is required')
      return
    }

    try {
      setSaving(true)
      const response = await fetch('/api/cups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leagueId: params.id,
          name: cupName
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create cup')
      }

      setSuccess('Cup tournament created successfully!')
      setShowCreateModal(false)
      setCupName('')
      await fetchCupData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create cup')
    } finally {
      setSaving(false)
    }
  }

  async function deleteCup() {
    if (!cup || !confirm(`Are you sure you want to delete "${cup.name}"? This will delete all cup data including groups, matches, and lineups.`)) {
      return
    }

    try {
      setSaving(true)
      const response = await fetch(`/api/cups?cupId=${cup.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete cup')
      }

      setSuccess('Cup deleted successfully')
      await fetchCupData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete cup')
    } finally {
      setSaving(false)
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

  return (
    <div className="space-y-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-3"
      >
        <h1 className="text-5xl font-bold text-[var(--foreground)]">
          Turniej Pucharowy
        </h1>
        <p className="text-xl text-[var(--foreground-secondary)]">
          Zarządzaj pucharowymi rozgrywkami eliminacyjnymi równolegle z ligą
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

      {/* No Cup Created */}
      {!cup && (
        <Card className="hover-lift">
          <CardContent>
            <EmptyState
              icon={<Trophy size={56} />}
              title="Nie utworzono turnieju pucharowego"
              description="Utwórz turniej pucharowy, który będzie prowadzony równolegle z ligą. Wymaga dokładnie 4, 8, 16 lub 32 menedżerów."
              action={{
                label: 'Utwórz Turniej Pucharowy',
                onClick: () => setShowCreateModal(true),
                icon: <Plus size={18} />
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Cup Overview */}
      {cup && stats && (
        <>
          {/* Cup Info Card */}
          <Card className="hover-lift">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-3">
                  <Trophy size={28} className="text-[var(--mineral-green)]" />
                  {cup.name}
                </CardTitle>
                <Button
                  onClick={deleteCup}
                  disabled={saving}
                  variant="danger"
                  icon={<Trash2 size={18} />}
                  size="sm"
                >
                  Usuń Puchar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stage */}
                <div className="p-6 bg-[var(--background-tertiary)] rounded-xl">
                  <div className="text-sm text-[var(--foreground-secondary)] mb-2">Obecny Etap</div>
                  <div className="text-2xl font-bold text-[var(--foreground)] capitalize">
                    {cup.stage.replace('_', ' ')}
                  </div>
                </div>

                {/* Groups */}
                <div className="p-6 bg-[var(--background-tertiary)] rounded-xl">
                  <div className="text-sm text-[var(--foreground-secondary)] mb-2">Przypisane Grupy</div>
                  <div className="text-2xl font-bold text-[var(--foreground)]">
                    {stats.groupsAssigned} / {stats.totalGroups}
                  </div>
                </div>

                {/* Schedule */}
                <div className="p-6 bg-[var(--background-tertiary)] rounded-xl">
                  <div className="text-sm text-[var(--foreground-secondary)] mb-2">Status Harmonogramu</div>
                  <div className={`text-2xl font-bold ${stats.scheduleGenerated ? 'text-[var(--success)]' : 'text-[var(--warning)]'}`}>
                    {stats.scheduleGenerated ? 'Wygenerowano' : 'Nie wygenerowano'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Award size={28} className="text-[var(--mineral-green)]" />
                Kroki Konfiguracji
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Step 1: Assign Groups */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex justify-between items-center p-6 bg-[var(--background-tertiary)] rounded-xl hover:bg-[var(--background-tertiary)]/90 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      stats.groupsAssigned === stats.totalGroups
                        ? 'bg-[var(--success)]/20 text-[var(--success)]'
                        : 'bg-[var(--warning)]/20 text-[var(--warning)]'
                    }`}>
                      1
                    </div>
                    <div>
                      <div className="font-semibold text-lg">Przypisz Menedżerów do Grup</div>
                      <div className="text-sm text-[var(--foreground-secondary)]">
                        {stats.groupsAssigned === stats.totalGroups
                          ? 'Wszyscy menedżerowie przypisani do grup'
                          : `Przypisz ${stats.totalManagers} menedżerów do ${stats.totalGroups} grup po ${stats.totalManagers === 4 ? '2' : '4'}`
                        }
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => router.push(`/dashboard/admin/leagues/${params.id}/cup/groups`)}
                    variant={stats.groupsAssigned === stats.totalGroups ? 'secondary' : 'primary'}
                    icon={<Users size={18} />}
                  >
                    {stats.groupsAssigned === stats.totalGroups ? 'Zobacz Grupy' : 'Przypisz Grupy'}
                  </Button>
                </motion.div>

                {/* Step 2: Map Gameweeks */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex justify-between items-center p-6 bg-[var(--background-tertiary)] rounded-xl hover:bg-[var(--background-tertiary)]/90 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      stats.scheduleGenerated
                        ? 'bg-[var(--success)]/20 text-[var(--success)]'
                        : 'bg-[var(--navy-border)]/20 text-[var(--foreground-tertiary)]'
                    }`}>
                      2
                    </div>
                    <div>
                      <div className="font-semibold text-lg">Generuj Harmonogram Pucharu</div>
                      <div className="text-sm text-[var(--foreground-secondary)]">
                        {stats.scheduleGenerated
                          ? `${stats.groupStageMatches} meczów fazy grupowej zaplanowanych`
                          : 'Zmapuj kolejki pucharowe do kolejek ligi i wygeneruj mecze'
                        }
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => router.push(`/dashboard/admin/leagues/${params.id}/cup/schedule`)}
                    disabled={stats.groupsAssigned !== stats.totalGroups}
                    variant={stats.scheduleGenerated ? 'secondary' : 'primary'}
                    icon={<Calendar size={18} />}
                  >
                    {stats.scheduleGenerated ? 'Zobacz Harmonogram' : 'Generuj Harmonogram'}
                  </Button>
                </motion.div>

                {/* Step 3: Manage Cup Lineups */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex justify-between items-center p-6 bg-[var(--background-tertiary)] rounded-xl hover:bg-[var(--background-tertiary)]/90 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold bg-[var(--mineral-green)]/20 text-[var(--mineral-green)]">
                      3
                    </div>
                    <div>
                      <div className="font-semibold text-lg">Zarządzaj Składami Pucharowymi</div>
                      <div className="text-sm text-[var(--foreground-secondary)]">
                        Twórz i edytuj składy pucharowe dla menedżerów
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => router.push(`/dashboard/admin/leagues/${params.id}/cup-lineups`)}
                    disabled={!stats.scheduleGenerated}
                    variant="secondary"
                    icon={<Edit3 size={18} />}
                  >
                    Zarządzaj Składami
                  </Button>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Create Cup Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setCupName('')
        }}
        title="Utwórz Turniej Pucharowy"
        description="Utwórz pucharowe rozgrywki eliminacyjne dla swojej ligi"
        icon={<Trophy size={24} />}
        footer={
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setShowCreateModal(false)
                setCupName('')
              }}
              disabled={saving}
            >
              Anuluj
            </Button>
            <Button
              onClick={createCup}
              loading={saving}
              disabled={!cupName.trim()}
              icon={<Plus size={18} />}
            >
              Utwórz Puchar
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nazwa Pucharu"
            value={cupName}
            onChange={(e) => setCupName(e.target.value)}
            placeholder="np. Puchar Ligi 2024/25"
            fullWidth
            required
          />
          <Alert variant="info">
            <strong>Wymagania:</strong> Twoja liga musi mieć dokładnie 8, 16 lub 32 menedżerów, aby utworzyć turniej pucharowy.
          </Alert>
        </div>
      </Modal>
    </div>
  )
}

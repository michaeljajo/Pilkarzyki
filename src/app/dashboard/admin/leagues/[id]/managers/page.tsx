'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { User } from '@/types'
import { Users, RefreshCw, UserPlus, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'

export default function LeagueManagersPage() {
  const params = useParams()
  const leagueId = params.id as string
  const [managers, setManagers] = useState<User[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showAddManager, setShowAddManager] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')

  useEffect(() => {
    if (leagueId) {
      fetchData()
    }
  }, [leagueId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null)
        setSuccess(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, success])

  async function fetchData() {
    try {
      setLoading(true)
      const [managersRes, usersRes] = await Promise.all([
        fetch(`/api/leagues/${leagueId}/managers`),
        fetch(`/api/users`),
      ])
      const [managersData, usersData] = await Promise.all([managersRes.json(), usersRes.json()])

      if (!managersRes.ok) throw new Error(managersData.error || 'Nie udało się wczytać menedżerów')
      setManagers(managersData.managers || [])
      setAllUsers(usersRes.ok ? usersData.users || [] : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd')
    } finally {
      setLoading(false)
    }
  }

  async function addManager(userId: string) {
    try {
      setSaving(true)
      const response = await fetch(`/api/leagues/${leagueId}/managers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Nie udało się dodać menedżera')
      }
      await fetchData()
      setShowAddManager(false)
      setSelectedUserId('')
      setSuccess('Menedżer dodany pomyślnie.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się dodać menedżera')
    } finally {
      setSaving(false)
    }
  }

  async function removeManager(managerId: string, managerName: string) {
    if (!confirm(`Czy na pewno usunąć ${managerName} z tej ligi? Tej operacji nie można cofnąć.`)) {
      return
    }
    try {
      setSaving(true)
      setError(null)
      const response = await fetch(`/api/leagues/${leagueId}/managers`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ managerId }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Nie udało się usunąć menedżera')
      }
      setSuccess(`${managerName} został usunięty z ligi.`)
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się usunąć menedżera')
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

  const currentManagerIds = managers.map((m) => m.id)
  const filteredUsers = allUsers.filter((user) => !currentManagerIds.includes(user.id))

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 sm:space-y-8 lg:space-y-12"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--foreground)]">Menedżerowie Ligi</h1>
          <p className="mt-2 sm:mt-3 text-base sm:text-lg lg:text-xl text-[var(--foreground-secondary)]">
            Dodawaj, usuwaj i przeglądaj menedżerów tej ligi
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={fetchData} variant="secondary" icon={<RefreshCw size={18} />} size="lg" className="w-full sm:w-auto">
            Odśwież
          </Button>
          <Button onClick={() => setShowAddManager(true)} icon={<UserPlus size={18} />} size="lg" className="w-full sm:w-auto">
            Dodaj Menedżera
          </Button>
        </div>
      </div>

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

      <Card className="hover-lift">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Users size={28} className="text-[var(--mineral-green)]" />
            Menedżerowie ({managers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {managers.length === 0 ? (
            <EmptyState
              icon={<Users size={56} />}
              title="Brak menedżerów w tej lidze"
              description="Dodaj menedżerów, aby rozpocząć budowanie ligi"
              action={{
                label: 'Dodaj Pierwszego Menedżera',
                onClick: () => setShowAddManager(true),
                icon: <UserPlus size={18} />,
              }}
            />
          ) : (
            <div className="space-y-3 sm:space-y-5">
              {managers.map((manager, index) => {
                const label = manager.displayName || `${manager.firstName ?? ''} ${manager.lastName ?? ''}`.trim() || 'Użytkownik'
                return (
                <motion.div
                  key={manager.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 sm:p-6 bg-[var(--background-tertiary)] rounded-2xl hover:bg-[var(--background-tertiary)]/90 transition-colors group"
                >
                  <div className="flex items-center gap-3 sm:gap-5 w-full sm:w-auto">
                    <Avatar fallback={label} size="lg" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-base sm:text-lg text-[var(--foreground)] truncate">
                        {label}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <span className="text-sm sm:text-base text-[var(--foreground-tertiary)]">Menedżer #{index + 1}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[var(--danger)] hover:bg-[var(--danger)]/10 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                      onClick={() => removeManager(manager.id, label)}
                      disabled={saving}
                      icon={<Trash2 size={16} />}
                    >
                      Usuń
                    </Button>
                  </div>
                </motion.div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={showAddManager}
        onClose={() => {
          setShowAddManager(false)
          setSelectedUserId('')
        }}
        title="Dodaj Menedżera do Ligi"
        description="Wybierz użytkownika z listy, aby dodać go jako menedżera"
        icon={<UserPlus size={24} />}
        footer={
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowAddManager(false)
                setSelectedUserId('')
              }}
              disabled={saving}
              className="w-full sm:w-auto"
            >
              Anuluj
            </Button>
            <Button
              type="button"
              onClick={() => addManager(selectedUserId)}
              loading={saving}
              disabled={filteredUsers.length === 0 || !selectedUserId}
              icon={<UserPlus size={18} />}
              className="w-full sm:w-auto"
            >
              Dodaj Menedżera
            </Button>
          </div>
        }
      >
        {filteredUsers.length === 0 ? (
          <EmptyState
            icon={<Users size={32} />}
            title="Brak dostępnych użytkowników"
            description="Wszyscy zarejestrowani użytkownicy są już menedżerami w tej lidze"
          />
        ) : (
          <Select
            label="Wybierz Użytkownika"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            fullWidth
            required
          >
            <option value="">Wybierz użytkownika...</option>
            {filteredUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.displayName}
              </option>
            ))}
          </Select>
        )}
      </Modal>
    </motion.div>
  )
}

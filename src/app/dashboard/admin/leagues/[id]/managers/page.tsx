'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { Avatar } from '@/components/ui/Avatar'
import { User } from '@/types'
import { Users, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'

export default function LeagueManagersPage() {
  const params = useParams()
  const [managers, setManagers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (params.id) {
      fetchManagers()
    }
  }, [params.id])

  async function fetchManagers() {
    try {
      setLoading(true)
      const response = await fetch(`/api/leagues/${params.id}/managers`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch managers')
      }

      setManagers(data.managers || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleAdmin(userId: string, isAdmin: boolean) {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isAdmin }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user')
      }

      // Update local state
      setManagers(prev => prev.map(manager =>
        manager.id === userId ? { ...manager, isAdmin } : manager
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user')
      setTimeout(() => setError(null), 5000)
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 sm:space-y-8 lg:space-y-12"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--foreground)]">Menedżerowie Ligi</h1>
          <p className="mt-2 sm:mt-3 text-base sm:text-lg lg:text-xl text-[var(--foreground-secondary)]">
            Przeglądaj i zarządzaj menedżerami w tej lidze
          </p>
        </div>
        <Button onClick={fetchManagers} variant="secondary" icon={<RefreshCw size={18} />} size="lg" className="w-full sm:w-auto">
          Odśwież
        </Button>
      </div>

      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
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
              description="Menedżerowie pojawią się tutaj po dodaniu ich do ligi"
            />
          ) : (
            <div className="space-y-3 sm:space-y-5">
              {managers.map((manager, index) => (
                <motion.div
                  key={manager.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 sm:p-6 bg-[var(--background-tertiary)] rounded-2xl hover:bg-[var(--background-tertiary)]/90 transition-colors"
                >
                  <div className="flex items-center gap-3 sm:gap-5 w-full sm:w-auto">
                    <Avatar
                      fallback={`${manager.firstName} ${manager.lastName}`}
                      size="lg"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        <div className="font-semibold text-base sm:text-lg text-[var(--foreground)] truncate">
                          {manager.firstName} {manager.lastName}
                        </div>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full flex-shrink-0 ${
                            manager.isAdmin
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {manager.isAdmin ? 'Admin' : 'Menedżer'}
                        </span>
                      </div>
                      <div className="text-sm sm:text-base text-[var(--foreground-secondary)] mt-1 truncate">{manager.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                    <Button
                      variant={manager.isAdmin ? 'danger' : 'secondary'}
                      size="sm"
                      onClick={() => handleToggleAdmin(manager.id, !manager.isAdmin)}
                      className="w-full sm:w-auto"
                    >
                      {manager.isAdmin ? 'Usuń Admina' : 'Nadaj Admina'}
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

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
      className="space-y-12"
    >
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-5xl font-bold text-[var(--foreground)]">Menedżerowie Ligi</h1>
          <p className="mt-3 text-xl text-[var(--foreground-secondary)]">
            Przeglądaj i zarządzaj menedżerami w tej lidze
          </p>
        </div>
        <Button onClick={fetchManagers} variant="secondary" icon={<RefreshCw size={18} />} size="lg">
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
            <div className="space-y-5 -ml-2">
              {managers.map((manager, index) => (
                <motion.div
                  key={manager.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex justify-between items-center p-6 pl-8 bg-[var(--background-tertiary)] rounded-2xl hover:bg-[var(--background-tertiary)]/90 transition-colors"
                >
                  <div className="flex items-center gap-5">
                    <Avatar
                      fallback={`${manager.firstName} ${manager.lastName}`}
                      size="lg"
                    />
                    <div>
                      <div className="font-semibold text-lg text-[var(--foreground)]">
                        {manager.firstName} {manager.lastName}
                      </div>
                      <div className="text-base text-[var(--foreground-secondary)] mt-1">{manager.email}</div>
                    </div>
                  </div>
                  <span className="text-base text-[var(--foreground-tertiary)]">Menedżer #{index + 1}</span>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

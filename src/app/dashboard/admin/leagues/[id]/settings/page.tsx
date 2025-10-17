'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { League } from '@/types'

export default function LeagueSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const [league, setLeague] = useState<League | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    isActive: true
  })

  useEffect(() => {
    if (params.id) {
      fetchLeague(params.id as string)
    }
  }, [params.id])

  async function fetchLeague(id: string) {
    try {
      setLoading(true)
      const response = await fetch(`/api/leagues/${id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch league')
      }

      setLeague(data.league)
      setFormData({
        name: data.league.name,
        isActive: data.league.isActive
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!league) return

    try {
      setSaving(true)
      const response = await fetch(`/api/leagues/${league.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update league')
      }

      setLeague(data.league)
      // Show success message
      setError(null)
      alert('League settings updated successfully!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update league')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteLeague() {
    if (!league) return

    try {
      setDeleting(true)
      setError(null)
      const response = await fetch(`/api/leagues/${league.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete league')
      }

      // Close modal and redirect to admin dashboard
      setShowDeleteModal(false)
      alert('Liga została pomyślnie usunięta')
      router.push('/dashboard/admin')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete league')
      setShowDeleteModal(false)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    )
  }

  if (error && !league) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={() => router.back()}>
          Wróć
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ustawienia Ligi</h1>
            <p className="mt-1 text-gray-600">{league?.name}</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => router.back()} variant="secondary">
              Anuluj
            </Button>
            <Button onClick={handleSave} loading={saving}>
              Zapisz Zmiany
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* Settings Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Podstawowe Ustawienia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nazwa Ligi
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Wprowadź nazwę ligi"
                />
              </div>


              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Liga jest aktywna</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Nieaktywne ligi nie będą wyświetlane na listach publicznych
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informacje o Lidze</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">ID Ligi:</span>
                <span className="font-mono text-sm">{league?.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Sezon:</span>
                <span>{league?.season}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Aktualna Kolejka:</span>
                <span>{league?.currentGameweek}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Utworzona:</span>
                <span>{league?.createdAt ? new Date(league.createdAt).toLocaleDateString() : 'N/A'}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Danger Zone */}
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Strefa Zagrożenia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">Usuń Ligę</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Po usunięciu ligi nie ma odwrotu. Proszę być pewnym.
                </p>
                <Button
                  variant="secondary"
                  className="mt-3 bg-red-50 text-red-700 hover:bg-red-100"
                  onClick={() => setShowDeleteModal(true)}
                >
                  Usuń Ligę
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteLeague}
          title="Usuń Ligę"
          message={`Czy na pewno chcesz usunąć ligę "${league?.name}"? Wszystkie dane związane z ligą, w tym menadżerowie, zawodnicy, mecze i wyniki zostaną trwale usunięte. Ta operacja jest nieodwracalna.`}
          confirmText="Usuń Ligę"
          cancelText="Anuluj"
          loading={deleting}
          variant="danger"
        />
      </div>
  )
}
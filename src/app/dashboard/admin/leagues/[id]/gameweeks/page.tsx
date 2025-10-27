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
  lock_date: string
  is_completed: boolean
  is_locked: boolean
}

interface EditingGameweek {
  id: string
  start_date: string
  end_date: string
  lock_date: string
  is_completed: boolean
  is_locked: boolean
}

export default function LeagueGameweeksPage() {
  const params = useParams()
  const [gameweeks, setGameweeks] = useState<Gameweek[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingGameweek, setEditingGameweek] = useState<EditingGameweek | null>(null)
  const [saving, setSaving] = useState(false)

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

  function startEditing(gameweek: Gameweek) {
    setEditingId(gameweek.id)
    setEditingGameweek({
      id: gameweek.id,
      start_date: gameweek.start_date,
      end_date: gameweek.end_date,
      lock_date: gameweek.lock_date,
      is_completed: gameweek.is_completed,
      is_locked: gameweek.is_locked
    })
  }

  function cancelEditing() {
    setEditingId(null)
    setEditingGameweek(null)
  }

  async function saveGameweek() {
    if (!editingGameweek) return

    try {
      setSaving(true)
      setError(null)

      const response = await fetch(`/api/leagues/${params.id}/gameweeks/${editingGameweek.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          start_date: editingGameweek.start_date,
          end_date: editingGameweek.end_date,
          lock_date: editingGameweek.start_date, // Lock date = start date
          is_completed: editingGameweek.is_completed,
          is_locked: editingGameweek.is_locked
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update gameweek')
      }

      // Update the gameweeks list
      setGameweeks(gameweeks.map(gw =>
        gw.id === editingGameweek.id ? data.gameweek : gw
      ))

      cancelEditing()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  function updateEditingField(field: keyof EditingGameweek, value: string | boolean) {
    if (editingGameweek) {
      setEditingGameweek({
        ...editingGameweek,
        [field]: value
      })
    }
  }

  function formatDateForInput(dateString: string): string {
    if (!dateString) return ''
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  function formatTimeForInput(dateString: string): string {
    if (!dateString) return ''
    const date = new Date(dateString)
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  }

  function combineDateTime(date: string, time: string): string {
    if (!date) return ''
    if (!time) time = '00:00'

    // Parse the time to get hours and minutes
    const [hours, minutes] = time.split(':')

    // Create a Date object from the date string at midnight local time
    const dateObj = new Date(date + 'T00:00:00')

    // Set the hours and minutes in local time
    dateObj.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0)

    // Return ISO string with timezone offset to preserve local time
    // This ensures the database stores the exact time the admin intends
    return dateObj.toISOString()
  }

  function updateEditingDateTime(field: 'start_date' | 'end_date', type: 'date' | 'time', value: string) {
    if (!editingGameweek) return

    const currentValue = editingGameweek[field]
    const currentDate = formatDateForInput(currentValue)
    const currentTime = formatTimeForInput(currentValue)

    const newDate = type === 'date' ? value : currentDate
    const newTime = type === 'time' ? value : currentTime

    const combined = combineDateTime(newDate, newTime)

    setEditingGameweek({
      ...editingGameweek,
      [field]: combined,
      lock_date: field === 'start_date' ? combined : editingGameweek.lock_date
    })
  }

  function getStatusLabel(gameweek: Gameweek): string {
    if (gameweek.is_completed) return 'Zakończona'
    if (gameweek.is_locked) return 'Zablokowana'
    return 'Otwarta'
  }

  function getNextStatus(gameweek: Gameweek): { is_locked: boolean; is_completed: boolean; label: string } {
    if (!gameweek.is_locked && !gameweek.is_completed) {
      return { is_locked: true, is_completed: false, label: 'Zablokuj' }
    }
    if (gameweek.is_locked && !gameweek.is_completed) {
      return { is_locked: false, is_completed: true, label: 'Zakończ' }
    }
    return { is_locked: false, is_completed: false, label: 'Otwórz ponownie' }
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
              {gameweeks.map((gameweek) => {
                const isEditing = editingId === gameweek.id
                const nextStatus = getNextStatus(gameweek)

                return (
                  <div
                    key={gameweek.id}
                    className="p-6 pl-8 bg-[var(--background-tertiary)] rounded-2xl hover:bg-[var(--background-tertiary)]/90 transition-colors"
                  >
                    {isEditing && editingGameweek ? (
                      // Edit Mode
                      <div className="space-y-4">
                        <div className="font-semibold text-xl text-[var(--foreground)]">
                          Edytuj Kolejkę {gameweek.week}
                        </div>

                        <div className="space-y-4">
                          {/* Start Date and Time */}
                          <div>
                            <label className="block text-sm font-medium text-[var(--foreground-secondary)] mb-2">
                              Data rozpoczęcia (i blokada składu)
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                              <input
                                type="date"
                                value={formatDateForInput(editingGameweek.start_date)}
                                onChange={(e) => updateEditingDateTime('start_date', 'date', e.target.value)}
                                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                              />
                              <input
                                type="time"
                                value={formatTimeForInput(editingGameweek.start_date)}
                                onChange={(e) => updateEditingDateTime('start_date', 'time', e.target.value)}
                                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                              />
                            </div>
                          </div>

                          {/* End Date and Time */}
                          <div>
                            <label className="block text-sm font-medium text-[var(--foreground-secondary)] mb-2">
                              Data zakończenia
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                              <input
                                type="date"
                                value={formatDateForInput(editingGameweek.end_date)}
                                onChange={(e) => updateEditingDateTime('end_date', 'date', e.target.value)}
                                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                              />
                              <input
                                type="time"
                                value={formatTimeForInput(editingGameweek.end_date)}
                                onChange={(e) => updateEditingDateTime('end_date', 'time', e.target.value)}
                                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              id={`locked-${gameweek.id}`}
                              checked={editingGameweek.is_locked}
                              onChange={(e) => updateEditingField('is_locked', e.target.checked)}
                              className="w-5 h-5 rounded border-[var(--border)] text-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]"
                            />
                            <label htmlFor={`locked-${gameweek.id}`} className="text-sm font-medium text-[var(--foreground)]">
                              Zablokowana
                            </label>
                          </div>

                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              id={`completed-${gameweek.id}`}
                              checked={editingGameweek.is_completed}
                              onChange={(e) => updateEditingField('is_completed', e.target.checked)}
                              className="w-5 h-5 rounded border-[var(--border)] text-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]"
                            />
                            <label htmlFor={`completed-${gameweek.id}`} className="text-sm font-medium text-[var(--foreground)]">
                              Zakończona
                            </label>
                          </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                          <Button
                            onClick={saveGameweek}
                            loading={saving}
                            size="sm"
                          >
                            Zapisz
                          </Button>
                          <Button
                            onClick={cancelEditing}
                            variant="secondary"
                            size="sm"
                            disabled={saving}
                          >
                            Anuluj
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // Display Mode
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-xl text-[var(--foreground)]">Kolejka {gameweek.week}</div>
                          <div className="text-base text-[var(--foreground-secondary)] mt-2">
                            {new Date(gameweek.start_date).toLocaleDateString()} -{' '}
                            {new Date(gameweek.end_date).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-[var(--foreground-tertiary)] mt-1">
                            Blokada Składu: {new Date(gameweek.lock_date).toLocaleString()}
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
                            {getStatusLabel(gameweek)}
                          </span>
                          <Button
                            onClick={() => startEditing(gameweek)}
                            variant="secondary"
                            size="sm"
                          >
                            Edytuj
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

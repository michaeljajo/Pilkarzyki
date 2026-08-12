'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DashboardNav } from '@/components/DashboardNav'
import { APP_CONTAINER, APP_CONTENT_Y } from '@/components/layout/appContainer'
import toast from 'react-hot-toast'

export default function CreateLeaguePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    season: '',
    maxManagers: '18'
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/leagues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          season: formData.season,
          maxManagers: Number(formData.maxManagers),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Liga została utworzona pomyślnie!')
        // Redirect to the new league's admin page
        router.push(`/leagues/${data.league.id}/manage`)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Nie udało się utworzyć ligi')
      }
    } catch {
      toast.error('Nie udało się utworzyć ligi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav title="Utwórz Ligę" />

      <main className={`${APP_CONTAINER} ${APP_CONTENT_Y}`}>
        {/* The form is a single column of short fields — capping it keeps the
            inputs at a readable length instead of stretching to the full
            1280px container, and `mx-auto` centres that column now that the
            page is nothing but the form.

            Explicit width, not `max-w-2xl`: design-tokens.css overrides
            --container-sm..2xl with breakpoint widths, so in this project
            `max-w-2xl` resolves to 1536px rather than 42rem. */}
        <div className="mx-auto max-w-[42rem]">
          <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-gray-200 bg-white p-5 space-y-5"
          >
            <Input
              type="text"
              id="name"
              name="name"
              label="Nazwa Ligi"
              required
              fullWidth
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Wprowadź nazwę ligi"
              maxLength={100}
              helper="Wybierz unikalną nazwę dla swojej ligi"
            />

            <Input
              type="text"
              id="season"
              name="season"
              label="Sezon"
              fullWidth
              value={formData.season}
              onChange={handleInputChange}
              placeholder="np. 2024-25"
              maxLength={20}
              helper="Pozostaw puste, aby automatycznie użyć bieżącego sezonu"
            />

            <Input
              type="number"
              id="maxManagers"
              name="maxManagers"
              label="Liczba menedżerów"
              required
              fullWidth
              min={2}
              max={32}
              value={formData.maxManagers}
              onChange={handleInputChange}
              placeholder="18"
              helper="Maksymalna liczba menedżerów (drużyn) w lidze."
            />

            {/* Anuluj is outline, not a second filled button: two solid buttons
                side by side gave the cancel path the same weight as the action
                the page exists for. Order matches the app's other forms
                (secondary left, primary right). */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
              <Link href="/leagues" className="sm:w-auto">
                <Button type="button" variant="outline" fullWidth className="sm:w-auto">
                  Anuluj
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                disabled={loading || !formData.name.trim()}
                fullWidth
                className="sm:w-auto"
              >
                Utwórz Ligę
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/Button'
import { Trophy, Info, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import Image from 'next/image'

export default function CreateLeaguePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    season: ''
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
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Liga została utworzona pomyślnie!')
        // Redirect to the new league's admin page
        router.push(`/dashboard/admin/leagues/${data.league.id}`)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Nie udało się utworzyć ligi')
      }
    } catch (error) {
      toast.error('Nie udało się utworzyć ligi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="bg-white sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto" style={{ paddingLeft: '48px', paddingRight: '48px' }}>
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="hover:opacity-80 transition-opacity">
                <Image
                  src="/pilkarzyki-logo.png"
                  alt="Pilkarzyki"
                  width={200}
                  height={50}
                  priority
                />
              </Link>
              <span className="text-gray-400">/</span>
              <span className="text-gray-600">Utwórz Ligę</span>
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto" style={{ paddingLeft: '48px', paddingRight: '48px', paddingTop: '64px', paddingBottom: '96px' }}>
        <div className="animate-fade-in-up">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center text-[var(--foreground-secondary)] hover:text-[var(--mineral-green)] transition-colors mb-4"
            >
              <ArrowLeft size={16} className="mr-2" />
              Wróć do Panelu
            </Link>
            <h1 className="text-4xl font-bold text-[var(--foreground)] mb-3">
              Utwórz Nową Ligę
            </h1>
            <p className="text-lg text-[var(--foreground-secondary)]">
              Stwórz własną ligę fantasy football i zostań jej administratorem
            </p>
          </div>

          {/* Info Card */}
          <div className="glass rounded-xl p-6 mb-8 border border-[var(--mineral-green)]/30">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 rounded-lg bg-[var(--mineral-green)]/20 flex items-center justify-center flex-shrink-0">
                <Info size={20} className="text-[var(--mineral-green)]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                  Co będzie dalej?
                </h3>
                <p className="text-[var(--foreground-secondary)] mb-3">
                  Po utworzeniu ligi będziesz mógł:
                </p>
                <ul className="space-y-2 text-[var(--foreground-secondary)]">
                  <li className="flex items-start">
                    <span className="text-[var(--mineral-green)] mr-2">•</span>
                    <span>Importować zawodników i przypisywać ich do menedżerów</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[var(--mineral-green)] mr-2">•</span>
                    <span>Generować kolejki i harmonogramy meczów</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[var(--mineral-green)] mr-2">•</span>
                    <span>Zarządzać wynikami i śledzić tabelę</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[var(--mineral-green)] mr-2">•</span>
                    <span>Mieć pełną kontrolę administracyjną nad ligą</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="glass rounded-xl p-8 space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                Nazwa Ligi <span className="text-[var(--danger)]">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-[var(--background-secondary)] border border-[var(--navy-border)] rounded-lg text-[var(--foreground)] placeholder-[var(--foreground-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--mineral-green)] focus:border-transparent transition-all"
                placeholder="Wprowadź nazwę ligi"
                maxLength={100}
              />
              <p className="text-xs text-[var(--foreground-tertiary)] mt-2">
                Wybierz unikalną nazwę dla swojej ligi
              </p>
            </div>

            <div>
              <label htmlFor="season" className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                Sezon
              </label>
              <input
                type="text"
                id="season"
                name="season"
                value={formData.season}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-[var(--background-secondary)] border border-[var(--navy-border)] rounded-lg text-[var(--foreground)] placeholder-[var(--foreground-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--mineral-green)] focus:border-transparent transition-all"
                placeholder="np. 2024-25 (pozostaw puste aby wygenerować automatycznie)"
                maxLength={20}
              />
              <p className="text-xs text-[var(--foreground-tertiary)] mt-2">
                Pozostaw puste, aby automatycznie użyć bieżącego sezonu
              </p>
            </div>

            <div className="flex gap-4 pt-6">
              <Link href="/dashboard" className="flex-1">
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  className="w-full"
                >
                  Anuluj
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                disabled={loading || !formData.name.trim()}
                className="flex-1"
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
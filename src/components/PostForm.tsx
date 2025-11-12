'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Send } from 'lucide-react'

interface PostFormProps {
  leagueId: string
  onPostCreated: () => void
}

export function PostForm({ leagueId, onPostCreated }: PostFormProps) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      setError('Proszę wpisać treść wiadomości')
      return
    }

    if (content.length > 5000) {
      setError('Wiadomość jest zbyt długa (max 5000 znaków)')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/leagues/${leagueId}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: content.trim() }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create post')
      }

      setContent('')
      onPostCreated()
    } catch (err) {
      console.error('Error creating post:', err)
      setError(err instanceof Error ? err.message : 'Nie udało się dodać wiadomości')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <div style={{ padding: '24px' }}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Napisz coś..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#29544D] focus:border-transparent resize-none"
            rows={4}
            disabled={isSubmitting}
          />
          {error && (
            <p className="text-red-600 text-sm mt-2">{error}</p>
          )}
          <div className="flex justify-between items-center mt-3">
            <p className="text-sm text-gray-500">
              {content.length}/5000 znaków
            </p>
            <Button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              icon={<Send size={16} />}
            >
              {isSubmitting ? 'Wysyłanie...' : 'Wyślij'}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  )
}

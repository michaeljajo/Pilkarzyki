'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function LeaguePlayersImportPage() {
  const params = useParams()
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      setError('Please select a file')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('leagueId', params.id as string)

      const response = await fetch('/api/admin/players/import', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import players')
      }

      setSuccess(`Successfully imported ${data.count} players`)
      setFile(null)

      // Redirect back to players page after 2 seconds
      setTimeout(() => {
        router.push(`/dashboard/admin/leagues/${params.id}/players`)
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Importuj Zawodników</h1>
        <p className="mt-1 text-gray-600">
          Prześlij plik Excel, aby zaimportować zawodników do tej ligi
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="text-sm text-green-700">{success}</div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Prześlij plik Excel</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wybierz plik Excel
              </label>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-indigo-50 file:text-indigo-700
                  hover:file:bg-indigo-100"
              />
              {file && (
                <p className="mt-2 text-sm text-gray-600">
                  Wybrano: {file.name}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
              >
                Anuluj
              </Button>
              <Button type="submit" loading={loading} disabled={!file}>
                Importuj Zawodników
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Wymagania formatu Excel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <p className="text-gray-700">
              Twój plik Excel powinien zawierać następujące kolumny:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li><strong>Nazwisko</strong>: Pełne nazwisko zawodnika</li>
              <li><strong>Pozycja</strong>: Bramkarz, Obrońca, Pomocnik lub Napastnik</li>
              <li><strong>Menedżer</strong>: Adres e-mail menedżera (musi być zarejestrowany)</li>
            </ul>
            <p className="text-gray-700 mt-4">
              Przykład:
            </p>
            <div className="bg-gray-50 p-3 rounded font-mono text-xs">
              <div className="grid grid-cols-3 gap-4 font-semibold mb-1">
                <div>Nazwisko</div>
                <div>Pozycja</div>
                <div>Menedżer</div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>John Doe</div>
                <div>Forward</div>
                <div>manager@example.com</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

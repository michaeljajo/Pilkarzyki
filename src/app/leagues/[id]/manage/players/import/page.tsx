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
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError(null)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      setDownloading(true)
      const response = await fetch('/api/admin/players/import')

      if (!response.ok) {
        throw new Error('Failed to download template')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'player-import-template.xlsx'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download template')
    } finally {
      setDownloading(false)
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

      // A timed-out or crashed request can return an empty / non-JSON body.
      // Parsing that directly surfaces a cryptic browser error ("The string
      // did not match the expected pattern"), so handle it explicitly.
      const raw = await response.text()
      let data: {
        error?: string
        result?: { imported?: number; skipped?: number; replaced?: number }
      } = {}

      if (raw) {
        try {
          data = JSON.parse(raw)
        } catch {
          throw new Error(
            `Serwer zwrócił nieprawidłową odpowiedź (HTTP ${response.status}). Spróbuj ponownie.`
          )
        }
      } else if (!response.ok) {
        throw new Error(
          `Import nie powiódł się (HTTP ${response.status}) — brak odpowiedzi serwera. Plik mógł być zbyt duży lub przekroczono limit czasu.`
        )
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import players')
      }

      const imported = data.result?.imported ?? 0
      const skipped = data.result?.skipped ?? 0
      const replaced = data.result?.replaced ?? 0
      setSuccess(
        `Zaimportowano ${imported} zawodników` +
        `${replaced ? `, zastępując poprzednią pulę (${replaced})` : ''}` +
        `${skipped ? `, pominięto ${skipped}` : ''}.`
      )
      setFile(null)

      // Redirect back to players page after 2 seconds
      setTimeout(() => {
        router.push(`/leagues/${params.id}/manage/players`)
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

      <div>
        <Button
          onClick={handleDownloadTemplate}
          loading={downloading}
          variant="secondary"
        >
          Pobierz szablon Excel
        </Button>
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
              <li><strong>Imię i Nazwisko</strong>: Pełne imię i nazwisko zawodnika</li>
              <li><strong>Liga</strong> (opcjonalne): Liga (np. Premier League, La Liga)</li>
              <li><strong>Klub</strong>: Nazwa klubu zawodnika</li>
              <li><strong>Pozycja</strong>: Obrońca, Pomocnik lub Napastnik</li>
            </ul>
            <p className="text-gray-500 text-xs mt-2">
              Uwaga: Zawodnicy trafiają do puli tej ligi jako nieprzypisani — menedżerowie
              wybierają ich podczas draftu. Bramkarze nie są obsługiwani.
            </p>
            <p className="text-gray-500 text-xs">
              Import <strong>zastępuje całą pulę</strong> tej ligi — wszyscy dotychczasowi
              nieprzypisani zawodnicy zostaną usunięci i wstawieni na nowo z pliku. Jest to
              możliwe wyłącznie przed rozpoczęciem draftu; po starcie draftu import zostanie
              odrzucony.
            </p>
            <p className="text-gray-500 text-xs">
              Zawodnicy o tym samym imieniu i nazwisku są zachowywani — plik może zawierać
              np. dwóch różnych zawodników &bdquo;Vitinha&rdquo;, a każdy wiersz tworzy
              osobnego zawodnika. Kolumna Klub pozwala ich rozróżnić podczas draftu.
            </p>
            <p className="text-gray-700 mt-4">
              Przykład:
            </p>
            <div className="bg-gray-50 p-3 rounded font-mono text-xs overflow-x-auto">
              <div className="grid grid-cols-4 gap-4 font-semibold mb-1 min-w-[420px]">
                <div>Imię i Nazwisko</div>
                <div>Liga</div>
                <div>Klub</div>
                <div>Pozycja</div>
              </div>
              <div className="grid grid-cols-4 gap-4 min-w-[420px]">
                <div>Lionel Messi</div>
                <div>MLS</div>
                <div>Inter Miami</div>
                <div>Napastnik</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

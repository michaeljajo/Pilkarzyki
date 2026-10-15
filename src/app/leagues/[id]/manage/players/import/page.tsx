'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

type ImportMode = 'insert' | 'update'

export default function LeaguePlayersImportPage() {
  const params = useParams()
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [mode, setMode] = useState<ImportMode>('insert')
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
      formData.append('mode', mode)

      const response = await fetch('/api/admin/players/import', {
        method: 'POST',
        body: formData,
      })

      // A platform-level failure (function timeout, gateway error) returns an
      // HTML page, not JSON. Parsing that blindly threw a SyntaxError whose
      // browser wording ("The string did not match the expected pattern")
      // told the admin nothing about what actually went wrong.
      const body = await response.text()
      let data: {
        error?: string
        result?: { imported?: number; updated?: number; unchanged?: number; skipped?: number }
      }
      try {
        data = JSON.parse(body)
      } catch {
        throw new Error(
          `Serwer zwrócił nieoczekiwaną odpowiedź (HTTP ${response.status}). ` +
          'Jeśli plik jest duży, import mógł przekroczyć limit czasu — ' +
          'sprawdź listę zawodników przed ponowną próbą.'
        )
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import players')
      }

      const skipped = data.result?.skipped ?? 0
      if (mode === 'update') {
        const updated = data.result?.updated ?? 0
        const unchanged = data.result?.unchanged ?? 0
        setSuccess(
          `Zaktualizowano ${updated} zawodników` +
          `${unchanged ? `, bez zmian ${unchanged}` : ''}` +
          `${skipped ? `, pominięto ${skipped}` : ''}.`
        )
      } else {
        const imported = data.result?.imported ?? 0
        setSuccess(`Zaimportowano ${imported} zawodników${skipped ? `, pominięto ${skipped}` : ''}.`)
      }
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
            <fieldset>
              <legend className="block text-sm font-medium text-gray-700 mb-2">
                Co zrobić z pliku
              </legend>
              <div className="space-y-2">
                {([
                  {
                    value: 'insert' as const,
                    label: 'Dodaj nowych zawodników',
                    hint: 'Wstawia zawodników spoza puli jako nieprzypisanych. Istniejący są pomijani.',
                  },
                  {
                    value: 'update' as const,
                    label: 'Zaktualizuj kluby (okno transferowe)',
                    hint: 'Zmienia tylko klub i ligę zawodników już w puli. Nie rusza przypisania do menedżera, goli ani składów.',
                  },
                ]).map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex gap-3 rounded-md border p-3 cursor-pointer ${
                      mode === opt.value
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="mode"
                      value={opt.value}
                      checked={mode === opt.value}
                      onChange={() => setMode(opt.value)}
                      className="mt-1"
                    />
                    <span>
                      <span className="block text-sm font-medium text-gray-900">{opt.label}</span>
                      <span className="block text-xs text-gray-600">{opt.hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

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
                {mode === 'update' ? 'Zaktualizuj Kluby' : 'Importuj Zawodników'}
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
              W trybie <strong>aktualizacji klubów</strong> kolumna Pozycja nie jest
              wymagana ani zapisywana — liczą się Imię i Nazwisko (do dopasowania) oraz
              Klub i Liga (do zapisania). Zawodnicy spoza puli i powtarzające się
              nazwiska są pomijane i wypisane w podsumowaniu.
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

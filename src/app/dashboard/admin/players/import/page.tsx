'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface League {
  id: string
  name: string
  season: string
}

interface ImportResult {
  success: boolean
  imported: number
  skipped: number
  errors: string[]
  details: {
    players: Record<string, unknown>[]
    squads: Record<string, unknown>[]
  }
}

export default function PlayerImportPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [leagueId, setLeagueId] = useState('')
  const [leagues, setLeagues] = useState<League[]>([])
  const [importing, setImporting] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [loadingLeagues, setLoadingLeagues] = useState(true)

  useEffect(() => {
    fetchLeagues()
  }, [])

  const fetchLeagues = async () => {
    try {
      setLoadingLeagues(true)
      const response = await fetch('/api/leagues')
      if (response.ok) {
        const data = await response.json()
        setLeagues(data.leagues || [])
      } else {
        setError('Failed to load leagues')
      }
    } catch (err) {
      setError('Failed to load leagues')
    } finally {
      setLoadingLeagues(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          droppedFile.name.endsWith('.xlsx')) {
        setFile(droppedFile)
        setError(null)
      } else {
        setError('Please upload an Excel file (.xlsx)')
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          selectedFile.name.endsWith('.xlsx')) {
        setFile(selectedFile)
        setError(null)
      } else {
        setError('Please upload an Excel file (.xlsx)')
      }
    }
  }

  const handleImport = async () => {
    if (!file || !leagueId) {
      setError('Please select a file and choose a league')
      return
    }

    try {
      setImporting(true)
      setError(null)
      setResult(null)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('leagueId', leagueId)

      const response = await fetch('/api/admin/players/import', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Import failed')
      }

      setResult(data.result)
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      setDownloading(true)
      const response = await fetch('/api/admin/players/import', {
        method: 'GET',
      })

      if (!response.ok) {
        throw new Error('Failed to download template')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = 'player-import-template.xlsx'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Import Players</h1>
          <p className="mt-1 text-gray-600">Upload Excel file to assign players to managers</p>
        </div>
        <Button onClick={() => router.back()} variant="secondary">
          Back
        </Button>
      </div>

      {/* Template Download */}
      <Card>
        <CardHeader>
          <CardTitle>1. Download Template</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Download the Excel template with the required columns and example data.
          </p>
          <Button onClick={handleDownloadTemplate} loading={downloading}>
            Download Template
          </Button>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle>2. Upload Players File</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              League
            </label>
            <select
              value={leagueId}
              onChange={(e) => setLeagueId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={loadingLeagues}
            >
              <option value="">{loadingLeagues ? 'Loading leagues...' : 'Select League'}</option>
              {leagues.map((league) => (
                <option key={league.id} value={league.id}>
                  {league.name} ({league.season})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Excel File
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {file ? (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-900">{file.name}</div>
                  <div className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setFile(null)
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ''
                      }
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-gray-600">
                    Drop your Excel file here, or{' '}
                    <button
                      type="button"
                      className="text-indigo-600 hover:text-indigo-500 font-medium"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      browse
                    </button>
                  </div>
                  <div className="text-xs text-gray-500">
                    Supports .xlsx files only
                  </div>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          <Button
            onClick={handleImport}
            loading={importing}
            disabled={!file || !leagueId}
            className="w-full"
          >
            Import Players
          </Button>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card>
          <CardContent className="pt-6">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Import Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{result.imported}</div>
                <div className="text-sm text-gray-600">Imported</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{result.skipped}</div>
                <div className="text-sm text-gray-600">Skipped</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{result.errors.length}</div>
                <div className="text-sm text-gray-600">Errors</div>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Errors:</h4>
                <div className="bg-red-50 border border-red-200 rounded-md p-4 max-h-40 overflow-y-auto">
                  <ul className="text-sm text-red-700 space-y-1">
                    {result.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {result.details.players.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Imported Players ({result.details.players.length}):
                </h4>
                <div className="bg-green-50 border border-green-200 rounded-md p-4 max-h-40 overflow-y-auto">
                  <ul className="text-sm text-green-700 space-y-1">
                    {result.details.players.map((player, index) => (
                      <li key={index}>
                        • {String(player.name)} {String(player.surname)} - {String(player.position)} ({String(player.league)})
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {result.details.squads.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Created Squads ({result.details.squads.length}):
                </h4>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="text-sm text-blue-700">
                    {result.details.squads.length} new squad(s) created for managers
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
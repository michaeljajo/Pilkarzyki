'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ImportStats {
  gameweeks: number
  leagueMatches: number
  cupGroups: number
  cupGameweeks: number
  cupMatches: number
  lineups: number
  cupLineups: number
  results: number
}

interface ImportResult {
  success: boolean
  imported: ImportStats
  errors: string[]
  warnings: string[]
}

export default function MigrationPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [leagueId, setLeagueId] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/admin/migration/template')

      if (!response.ok) {
        throw new Error('Failed to download template')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'migration-template.xlsx'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download template')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setResult(null)
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (!file || !leagueId.trim()) {
      setError('Please select a file and enter a league ID')
      return
    }

    setIsUploading(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('leagueId', leagueId.trim())

      const response = await fetch('/api/admin/migration/import', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Import failed')
      }

      setResult(data.result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Data Migration</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Import historical league and cup data from Excel
        </p>
      </div>

      {/* Download Template */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Step 1: Download Template</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Download the Excel template with example data to understand the format.
        </p>
        <button
          onClick={handleDownloadTemplate}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
        >
          Download Template
        </button>
      </div>

      {/* Upload Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Step 2: Upload Migration File</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="leagueId" className="block text-sm font-medium mb-2">
              League ID *
            </label>
            <input
              type="text"
              id="leagueId"
              value={leagueId}
              onChange={(e) => setLeagueId(e.target.value)}
              placeholder="Enter league UUID"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isUploading}
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              The UUID of the league you want to import data into
            </p>
          </div>

          <div>
            <label htmlFor="file" className="block text-sm font-medium mb-2">
              Excel File *
            </label>
            <input
              type="file"
              id="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-300"
              disabled={isUploading}
            />
            {file && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Selected: {file.name}
              </p>
            )}
          </div>

          <button
            onClick={handleUpload}
            disabled={isUploading || !file || !leagueId.trim()}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {isUploading ? 'Uploading...' : 'Start Import'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <h3 className="text-red-800 dark:text-red-300 font-semibold mb-2">Error</h3>
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <span className={result.success ? 'text-green-600' : 'text-yellow-600'}>
              {result.success ? '✓ ' : '⚠ '}
            </span>
            Import {result.success ? 'Completed' : 'Completed with Issues'}
          </h2>

          {/* Import Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{result.imported.gameweeks}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Gameweeks</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{result.imported.leagueMatches}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">League Matches</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{result.imported.cupMatches}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Cup Matches</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{result.imported.lineups}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Lineups</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{result.imported.cupLineups}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Cup Lineups</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{result.imported.results}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Results</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{result.imported.cupGroups}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Cup Groups</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{result.imported.cupGameweeks}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Cup Gameweeks</div>
            </div>
          </div>

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <div className="mb-4">
              <h3 className="text-yellow-800 dark:text-yellow-300 font-semibold mb-2">
                Warnings ({result.warnings.length})
              </h3>
              <ul className="list-disc list-inside space-y-1">
                {result.warnings.map((warning, index) => (
                  <li key={index} className="text-yellow-700 dark:text-yellow-400 text-sm">
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Errors */}
          {result.errors.length > 0 && (
            <div className="mb-4">
              <h3 className="text-red-800 dark:text-red-300 font-semibold mb-2">
                Errors ({result.errors.length})
              </h3>
              <div className="max-h-64 overflow-y-auto">
                <ul className="list-disc list-inside space-y-1">
                  {result.errors.map((error, index) => (
                    <li key={index} className="text-red-700 dark:text-red-400 text-sm">
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Success Actions */}
          {result.success && result.errors.length === 0 && (
            <div className="mt-6 flex gap-4">
              <button
                onClick={() => router.push('/dashboard/admin')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                Go to Admin Dashboard
              </button>
              <button
                onClick={() => {
                  setFile(null)
                  setLeagueId('')
                  setResult(null)
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                Import Another
              </button>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3 text-blue-900 dark:text-blue-100">
          Important Notes
        </h3>
        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <li>• All players must be imported first using the regular player import</li>
          <li>• Manager emails in the Excel file must match existing Clerk users</li>
          <li>• Player names must match exactly (first name + surname)</li>
          <li>• Dates can be in Excel date format or YYYY-MM-DD</li>
          <li>• Leave player/goal columns empty for future matches</li>
          <li>• Knockout matches without managers will be skipped (create via draw tool later)</li>
          <li>• The import process will automatically calculate match scores from player goals</li>
        </ul>
      </div>
    </div>
  )
}

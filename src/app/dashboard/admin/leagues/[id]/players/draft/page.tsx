'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface DraftResult {
  transferred: number
  created: number
  unchanged: number
  unassigned: number
  errors: string[]
  details: {
    transfers: Array<{
      playerName: string
      fromManager: string
      toManager: string
    }>
    newPlayers: Array<{
      playerName: string
      manager: string
    }>
    unassignedPlayers: Array<{
      playerName: string
      fromManager: string
    }>
  }
}

export default function DraftUploadPage() {
  const params = useParams()
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [effectiveDate, setEffectiveDate] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<DraftResult | null>(null)

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
      a.download = 'draft-template.xlsx'
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
      setResult(null)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('leagueId', params.id as string)
      if (effectiveDate) {
        formData.append('effectiveDate', effectiveDate)
      }

      const response = await fetch('/api/admin/players/draft', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process draft')
      }

      setResult(data.result)
      setFile(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mid-Season Draft Upload</h1>
        <p className="mt-1 text-gray-600">
          Upload an Excel file to process player transfers and reassignments from the mid-season draft
        </p>
      </div>

      {/* Important Notice */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-yellow-800">Important:</h3>
              <ul className="mt-2 text-sm text-yellow-700 space-y-1 list-disc list-inside">
                <li>Historical results will NOT be affected - past goals remain with the original managers</li>
                <li>Transfers become effective from the date you specify (defaults to next gameweek)</li>
                <li>You cannot backdate transfers into locked or completed gameweeks</li>
                <li>Players can be reassigned between managers or become unassigned</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Template Download */}
      <Card>
        <CardHeader>
          <CardTitle>1. Download Template</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Download the Excel template to prepare your draft data. The template includes all required columns.
          </p>
          <Button
            onClick={handleDownloadTemplate}
            disabled={downloading}
            variant="outline"
          >
            {downloading ? 'Downloading...' : 'Download Template'}
          </Button>
        </CardContent>
      </Card>

      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle>2. Upload Draft Results</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="effectiveDate" className="block text-sm font-medium text-gray-700 mb-2">
                Effective Date (Optional)
              </label>
              <input
                type="date"
                id="effectiveDate"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                If not specified, transfers will take effect from the start of the next gameweek
              </p>
            </div>

            <div>
              <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
                Excel File
              </label>
              <input
                type="file"
                id="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {file && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {file.name}
                </p>
              )}
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !file}
              className="w-full"
            >
              {loading ? 'Processing...' : 'Process Draft'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card className={result.errors.length > 0 ? 'border-yellow-200' : 'border-green-200'}>
          <CardHeader>
            <CardTitle className={result.errors.length > 0 ? 'text-yellow-800' : 'text-green-800'}>
              Draft Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Transferred</p>
                <p className="text-2xl font-bold text-blue-600">{result.transferred}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">New Players</p>
                <p className="text-2xl font-bold text-green-600">{result.created}</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-gray-600">Unassigned</p>
                <p className="text-2xl font-bold text-orange-600">{result.unassigned}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Unchanged</p>
                <p className="text-2xl font-bold text-gray-600">{result.unchanged}</p>
              </div>
            </div>

            {/* Transfers */}
            {result.details.transfers.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Player Transfers</h3>
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Player</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">From</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">To</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {result.details.transfers.map((transfer, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2 text-sm text-gray-900">{transfer.playerName}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">{transfer.fromManager}</td>
                          <td className="px-4 py-2 text-sm text-gray-900 font-medium">{transfer.toManager}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* New Players */}
            {result.details.newPlayers.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">New Players Added</h3>
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Player</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Manager</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {result.details.newPlayers.map((player, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2 text-sm text-gray-900">{player.playerName}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{player.manager}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Unassigned Players */}
            {result.details.unassignedPlayers.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-orange-700 mb-2">Players Removed from Squads</h3>
                <div className="max-h-48 overflow-y-auto border border-orange-200 rounded-md bg-orange-50">
                  <table className="min-w-full divide-y divide-orange-200">
                    <thead className="bg-orange-100 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-orange-700 uppercase">Player</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-orange-700 uppercase">Previous Manager</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-orange-100">
                      {result.details.unassignedPlayers.map((player, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2 text-sm text-gray-900">{player.playerName}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">{player.fromManager}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Errors */}
            {result.errors.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-red-700 mb-2">Errors ({result.errors.length})</h3>
                <div className="max-h-48 overflow-y-auto bg-red-50 border border-red-200 rounded-md p-3">
                  <ul className="space-y-1 text-sm text-red-700">
                    {result.errors.map((error, idx) => (
                      <li key={idx}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {result.errors.length === 0 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-green-800 font-medium">
                    ✅ Draft processed successfully!
                  </p>
                  <Link href={`/dashboard/admin/leagues/${params.id}/players`}>
                    <Button size="sm">Back to Players</Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

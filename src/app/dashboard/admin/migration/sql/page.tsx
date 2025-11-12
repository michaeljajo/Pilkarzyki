'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

interface MigrationFile {
  filename: string
  size: number
  modified: string
}

export default function SQLMigrationPage() {
  const [files, setFiles] = useState<MigrationFile[]>([])
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState<string | null>(null)

  useEffect(() => {
    loadFiles()
  }, [])

  const loadFiles = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/migration/sql')

      if (!response.ok) {
        throw new Error('Failed to load migration files')
      }

      const data = await response.json()
      setFiles(data.files)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load files')
    } finally {
      setLoading(false)
    }
  }

  const applyMigration = async (filename: string) => {
    if (!confirm(`Are you sure you want to apply migration: ${filename}?\n\nThis action cannot be undone.`)) {
      return
    }

    try {
      setApplying(filename)
      const response = await fetch('/api/admin/migration/sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ filename })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to apply migration')
      }

      toast.success(`Migration applied successfully: ${filename}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to apply migration')
    } finally {
      setApplying(null)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">SQL Migrations</h1>
        <p className="text-gray-600">
          Apply SQL migration files from the migrations folder to the database.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading migration files...</div>
        </div>
      ) : files.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800 mb-2">No SQL migration files found</p>
          <p className="text-yellow-600 text-sm">
            Place .sql files in the <code className="bg-yellow-100 px-2 py-1 rounded">migrations/</code> folder
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm">
              <strong>Warning:</strong> SQL migrations are applied directly to the database and cannot be undone.
              Make sure to backup your database before applying migrations.
            </p>
          </div>

          {files.map((file) => (
            <div
              key={file.filename}
              className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">{file.filename}</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Size: {(file.size / 1024).toFixed(2)} KB</p>
                    <p>Modified: {new Date(file.modified).toLocaleString()}</p>
                  </div>
                </div>
                <button
                  onClick={() => applyMigration(file.filename)}
                  disabled={applying !== null}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    applying === file.filename
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {applying === file.filename ? 'Applying...' : 'Apply Migration'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-3">How to use:</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Place your .sql migration files in the <code className="bg-gray-200 px-2 py-1 rounded">migrations/</code> folder</li>
          <li>Refresh this page to see the new files</li>
          <li>Click "Apply Migration" to execute the SQL statements</li>
          <li>Check the console or database to verify the migration was successful</li>
        </ol>
      </div>
    </div>
  )
}

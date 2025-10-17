'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'

export default function SetupAdminPage() {
  const { user } = useUser()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSetAdmin = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/set-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('✅ Admin status set successfully! Please refresh the page.')
      } else {
        setMessage(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      setMessage('❌ Failed to set admin status')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please sign in first</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Setup Admin Access</h1>
        <p className="text-gray-600 mb-6">
          Click the button below to grant admin privileges to your account.
        </p>

        <div className="mb-4">
          <p><strong>User:</strong> {user.emailAddresses[0]?.emailAddress}</p>
          <p><strong>Current Admin Status:</strong> {user.publicMetadata?.isAdmin ? '✅ Admin' : '❌ Not Admin'}</p>
        </div>

        <button
          onClick={handleSetAdmin}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Setting Admin...' : 'Set as Admin'}
        </button>

        {message && (
          <div className="mt-4 p-3 rounded bg-gray-100">
            {message}
          </div>
        )}

        {user.publicMetadata?.isAdmin === true && (
          <div className="mt-4">
            <a
              href="/dashboard/admin"
              className="block text-center bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
            >
              Go to Admin Dashboard
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
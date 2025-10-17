'use client'

import { useState, useEffect } from 'react'

export default function TestGameweeksPage() {
  const [gameweeks, setGameweeks] = useState([])
  const [leagues, setLeagues] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const testFetchGameweeks = async () => {
    setLoading(true)
    setMessage('Testing gameweeks API...')

    try {
      console.log('Fetching from /api/gameweeks')
      const response = await fetch('/api/gameweeks')
      console.log('Response:', response.status, response.ok)

      if (response.ok) {
        const data = await response.json()
        console.log('Data:', data)
        setGameweeks(data.gameweeks || [])
        setMessage(`✅ Success! Found ${data.gameweeks?.length || 0} gameweeks`)
      } else {
        const errorData = await response.json()
        console.error('Error:', errorData)
        setMessage(`❌ Error: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Fetch failed:', error)
      setMessage(`❌ Fetch failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testFetchLeagues = async () => {
    setLoading(true)
    setMessage('Testing leagues API...')

    try {
      console.log('Fetching from /api/leagues')
      const response = await fetch('/api/leagues')
      console.log('Response:', response.status, response.ok)

      if (response.ok) {
        const data = await response.json()
        console.log('Data:', data)
        setLeagues(data.leagues || [])
        setMessage(`✅ Success! Found ${data.leagues?.length || 0} leagues`)
      } else {
        const errorData = await response.json()
        console.error('Error:', errorData)
        setMessage(`❌ Error: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Fetch failed:', error)
      setMessage(`❌ Fetch failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testSetAdmin = async () => {
    setLoading(true)
    setMessage('Setting admin status...')

    try {
      const response = await fetch('/api/admin/set-admin', { method: 'POST' })
      console.log('Set admin response:', response.status, response.ok)

      if (response.ok) {
        const data = await response.json()
        console.log('Admin set data:', data)
        setMessage('✅ Admin status set successfully! Refresh the page.')
      } else {
        const errorData = await response.json()
        console.error('Error:', errorData)
        setMessage(`❌ Error: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Fetch failed:', error)
      setMessage(`❌ Fetch failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Gameweeks API Test Page</h1>

      <div className="space-y-4 mb-8">
        <button
          onClick={testSetAdmin}
          disabled={loading}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
        >
          1. Set Admin Status
        </button>

        <button
          onClick={testFetchLeagues}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          2. Test Leagues API
        </button>

        <button
          onClick={testFetchGameweeks}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          3. Test Gameweeks API
        </button>
      </div>

      {message && (
        <div className="mb-6 p-4 bg-gray-100 rounded">
          <p>{message}</p>
        </div>
      )}

      {loading && (
        <div className="mb-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-3">Leagues ({leagues.length})</h2>
          <div className="space-y-2">
            {leagues.map((league) => (
              <div key={league.id} className="p-2 bg-green-50 rounded">
                {league.name} ({league.season})
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">Gameweeks ({gameweeks.length})</h2>
          <div className="space-y-2">
            {gameweeks.map((gameweek) => (
              <div key={gameweek.id} className="p-2 bg-blue-50 rounded">
                Week {gameweek.week} - {gameweek.leagues?.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
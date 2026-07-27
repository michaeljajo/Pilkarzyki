'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ArrowLeftRight, ArrowRight, FileSpreadsheet, Clock } from 'lucide-react'

interface Manager {
  databaseId: string
  firstName?: string
  lastName?: string
  email?: string
}

interface SquadPlayer {
  id: string
  name: string
  surname: string
  position: string
}

function managerLabel(m: Manager): string {
  const full = `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim()
  return full || m.email || 'Menedżer'
}

/**
 * Transfery — the admin home for mid-season roster changes. Currently hosts the
 * manager-to-manager swap tool (a rare exchange of one player between two
 * managers, via the atomic admin_swap_players RPC). The live mid-season draft
 * will be added here in a later increment; the spreadsheet bulk tool remains
 * available as a fallback path.
 */
export default function TransfersPage() {
  const params = useParams()
  const leagueId = params.id as string

  const [managers, setManagers] = useState<Manager[]>([])
  const [mgrA, setMgrA] = useState('')
  const [mgrB, setMgrB] = useState('')
  const [squadA, setSquadA] = useState<SquadPlayer[]>([])
  const [squadB, setSquadB] = useState<SquadPlayer[]>([])
  const [playerA, setPlayerA] = useState('')
  const [playerB, setPlayerB] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch(`/api/leagues/${leagueId}/managers`)
      .then((r) => (r.ok ? r.json() : { managers: [] }))
      .then((d) => setManagers(d.managers || []))
      .catch(() => setManagers([]))
  }, [leagueId])

  const loadSquad = useCallback(
    async (managerId: string, side: 'A' | 'B') => {
      const setSquad = side === 'A' ? setSquadA : setSquadB
      const setPlayer = side === 'A' ? setPlayerA : setPlayerB
      setSquad([])
      setPlayer('')
      if (!managerId) return
      try {
        const res = await fetch(`/api/manager/leagues/${leagueId}/squad?managerId=${managerId}`)
        const data = await res.json()
        if (res.ok) setSquad(data.players || [])
      } catch {
        toast.error('Nie udało się załadować składu menedżera')
      }
    },
    [leagueId]
  )

  function onSelectManager(side: 'A' | 'B', value: string) {
    if (side === 'A') setMgrA(value)
    else setMgrB(value)
    loadSquad(value, side)
  }

  async function handleSwap() {
    if (!playerA || !playerB) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/leagues/${leagueId}/swap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerAId: playerA, playerBId: playerB }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Nie udało się wykonać wymiany')
        return
      }
      toast.success(data.message || 'Wymiana zakończona')
      // Reload both squads to reflect the new ownership and clear the picks.
      await Promise.all([loadSquad(mgrA, 'A'), loadSquad(mgrB, 'B')])
    } catch {
      toast.error('Błąd podczas wymiany zawodników')
    } finally {
      setSubmitting(false)
    }
  }

  const sameManager = !!mgrA && mgrA === mgrB
  const canSwap = !!playerA && !!playerB && !sameManager && !submitting

  const playerName = (p: SquadPlayer) => `${p.name} ${p.surname}`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Transfery</h1>
          <p className="mt-1 text-sm sm:text-base text-gray-600">
            Wymiana zawodników między menedżerami oraz draft w trakcie sezonu.
          </p>
        </div>
        <Link href={`/dashboard/admin/leagues/${leagueId}/players`}>
          <Button variant="secondary">Powrót do zawodników</Button>
        </Link>
      </div>

      {/* Manager-to-manager swap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight size={20} className="text-[#29544D]" />
            Wymiana między menedżerami
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-gray-600">
            Wymień jednego zawodnika między dwoma menedżerami. Zmiana wchodzi w życie od
            najbliższej niezablokowanej kolejki, a historia (dotychczasowe gole) pozostaje
            przypisana do poprzednich właścicieli.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end">
            {/* Side A */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Menedżer A</label>
                <select
                  value={mgrA}
                  onChange={(e) => onSelectManager('A', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#29544D]"
                >
                  <option value="">Wybierz menedżera...</option>
                  {managers.map((m) => (
                    <option key={m.databaseId} value={m.databaseId}>
                      {managerLabel(m)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zawodnik A</label>
                <select
                  value={playerA}
                  onChange={(e) => setPlayerA(e.target.value)}
                  disabled={!mgrA || squadA.length === 0}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#29544D] disabled:bg-gray-100"
                >
                  <option value="">{mgrA ? 'Wybierz zawodnika...' : 'Najpierw wybierz menedżera'}</option>
                  {squadA.map((p) => (
                    <option key={p.id} value={p.id}>
                      {playerName(p)} ({p.position})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="hidden md:flex items-center justify-center pb-2 text-gray-400">
              <ArrowLeftRight size={24} />
            </div>

            {/* Side B */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Menedżer B</label>
                <select
                  value={mgrB}
                  onChange={(e) => onSelectManager('B', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#29544D]"
                >
                  <option value="">Wybierz menedżera...</option>
                  {managers.map((m) => (
                    <option key={m.databaseId} value={m.databaseId}>
                      {managerLabel(m)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zawodnik B</label>
                <select
                  value={playerB}
                  onChange={(e) => setPlayerB(e.target.value)}
                  disabled={!mgrB || squadB.length === 0}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#29544D] disabled:bg-gray-100"
                >
                  <option value="">{mgrB ? 'Wybierz zawodnika...' : 'Najpierw wybierz menedżera'}</option>
                  {squadB.map((p) => (
                    <option key={p.id} value={p.id}>
                      {playerName(p)} ({p.position})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {sameManager && (
            <p className="text-sm text-red-600">Wybierz dwóch różnych menedżerów.</p>
          )}

          <div className="flex justify-end">
            <Button onClick={handleSwap} loading={submitting} disabled={!canSwap} icon={<ArrowRight size={16} />}>
              Wykonaj wymianę
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mid-season draft */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock size={20} className="text-[#29544D]" />
            Draft w trakcie sezonu
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm text-gray-600">
            Menedżerowie zwalniają zawodników, a następnie wybierają nowych w kolejności ustalonej
            przez administratora. Otwórz i prowadź draft na dedykowanym ekranie.
          </p>
          <Link href={`/dashboard/leagues/${leagueId}/midseason-draft`}>
            <Button>Otwórz draft</Button>
          </Link>
        </CardContent>
      </Card>

      {/* Bulk fallback */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet size={20} className="text-[#29544D]" />
            Masowa zmiana przypisań (arkusz)
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm text-gray-600">
            Zaawansowane narzędzie do masowej zmiany przypisań zawodników na podstawie arkusza.
          </p>
          <Link href={`/dashboard/admin/leagues/${leagueId}/players/draft`}>
            <Button variant="outline">Otwórz narzędzie arkusza</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

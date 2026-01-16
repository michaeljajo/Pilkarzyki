'use client'

import { useState, useMemo } from 'react'
import { TopScorer, Position } from '@/types'

interface TopScorersTableProps {
  topScorers: TopScorer[]
  competitionType: 'league' | 'cup'
}

export function TopScorersTable({
  topScorers,
  competitionType,
}: TopScorersTableProps) {
  const [positionFilter, setPositionFilter] = useState<string>('all')
  const [managerFilter, setManagerFilter] = useState<string>('all')

  // Get unique managers for filter dropdown
  const uniqueManagers = useMemo(() => {
    const managers = new Map<string, string>()
    topScorers.forEach((scorer) => {
      if (scorer.managerId) {
        managers.set(scorer.managerId, scorer.managerName)
      }
    })
    return Array.from(managers.entries()).sort((a, b) =>
      a[1].localeCompare(b[1])
    )
  }, [topScorers])

  // Filter top scorers based on selected filters
  const filteredScorers = useMemo(() => {
    let filtered = [...topScorers]

    if (positionFilter !== 'all') {
      filtered = filtered.filter((scorer) => scorer.position === positionFilter)
    }

    if (managerFilter !== 'all') {
      filtered = filtered.filter((scorer) => scorer.managerId === managerFilter)
    }

    return filtered
  }, [topScorers, positionFilter, managerFilter])

  const positionColors: Record<Position, string> = {
    Goalkeeper: 'bg-yellow-100 text-yellow-800',
    Defender: 'bg-blue-100 text-blue-800',
    Midfielder: 'bg-green-100 text-green-800',
    Forward: 'bg-red-100 text-red-800',
  }

  const positionLabels: Record<Position, string> = {
    Goalkeeper: 'Bramkarz',
    Defender: 'Obrońca',
    Midfielder: 'Pomocnik',
    Forward: 'Napastnik',
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Position Filter */}
          <div>
            <label
              htmlFor="position-filter"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Pozycja
            </label>
            <select
              id="position-filter"
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#061852] focus:border-transparent"
            >
              <option value="all">Wszystkie pozycje</option>
              <option value="Goalkeeper">Bramkarz</option>
              <option value="Defender">Obrońca</option>
              <option value="Midfielder">Pomocnik</option>
              <option value="Forward">Napastnik</option>
            </select>
          </div>

          {/* Manager Filter */}
          <div>
            <label
              htmlFor="manager-filter"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Manager
            </label>
            <select
              id="manager-filter"
              value={managerFilter}
              onChange={(e) => setManagerFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#061852] focus:border-transparent"
            >
              <option value="all">Wszyscy managerowie</option>
              {uniqueManagers.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active filters indicator */}
        {(positionFilter !== 'all' || managerFilter !== 'all') && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-gray-600">Aktywne filtry:</span>
            {positionFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                Pozycja: {positionFilter}
                <button
                  onClick={() => setPositionFilter('all')}
                  className="hover:text-gray-900"
                  aria-label="Usuń filtr pozycji"
                >
                  ×
                </button>
              </span>
            )}
            {managerFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                Manager:{' '}
                {uniqueManagers.find(([id]) => id === managerFilter)?.[1]}
                <button
                  onClick={() => setManagerFilter('all')}
                  className="hover:text-gray-900"
                  aria-label="Usuń filtr managera"
                >
                  ×
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setPositionFilter('all')
                setManagerFilter('all')
              }}
              className="text-xs text-[#061852] hover:underline"
            >
              Wyczyść wszystkie
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      {filteredScorers.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="text-gray-400 text-4xl mb-3">⚽</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Brak danych
          </h3>
          <p className="text-gray-600">
            {topScorers.length === 0
              ? competitionType === 'cup'
                ? 'Nikt jeszcze nie strzelił gola w pucharze'
                : 'Nikt jeszcze nie strzelił gola w lidze'
              : 'Brak zawodników pasujących do wybranych filtrów'}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-lg border border-gray-200">
            <div className="overflow-x-auto px-4">
              <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                    #
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                    Nazwisko
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bramki
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pozycja
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Manager
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredScorers.map((scorer, index) => (
                  <tr
                    key={`${scorer.playerId}-${scorer.managerId}`}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                      {index + 1}
                    </td>
                    <td className="px-2 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {scorer.playerName} {scorer.playerSurname}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-medium text-gray-900">
                        {scorer.totalGoals}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {positionLabels[scorer.position]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {scorer.managerName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filteredScorers.map((scorer, index) => (
              <div
                key={`${scorer.playerId}-${scorer.managerId}`}
                className="bg-white rounded-lg border border-gray-200 p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-900 font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-base font-semibold text-gray-900">
                        {scorer.playerName} {scorer.playerSurname}
                      </div>
                      <div className="text-sm text-gray-600">
                        {scorer.managerName}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {scorer.totalGoals}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {positionLabels[scorer.position]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

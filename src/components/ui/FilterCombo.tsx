'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { fold } from '@/utils/text'

// Searchable single-select dropdown used to filter long player lists (draft
// board, admin player list). Shows a type-ahead box over the option list so a
// few thousand clubs/leagues stay navigable.

export function FilterCombo({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const filtered = useMemo(() => {
    const q = fold(query)
    return options.filter((o) => !q || fold(o).includes(q)).slice(0, 100)
  }, [options, query])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:border-gray-400"
      >
        <span className={value ? 'text-gray-900' : 'text-gray-500'}>{value || label}</span>
        <span className="text-gray-400">▾</span>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-auto">
          <div className="p-2 sticky top-0 bg-white border-b border-gray-100">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Szukaj ${label.toLowerCase()}...`}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              onChange('')
              setOpen(false)
              setQuery('')
            }}
            className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
          >
            Wszystkie
          </button>
          {filtered.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => {
                onChange(o)
                setOpen(false)
                setQuery('')
              }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${o === value ? 'font-semibold text-[#29544D]' : 'text-gray-800'}`}
            >
              {o}
            </button>
          ))}
          {filtered.length === 0 && <div className="px-3 py-2 text-sm text-gray-400">Brak wyników</div>}
        </div>
      )}
    </div>
  )
}

export default FilterCombo

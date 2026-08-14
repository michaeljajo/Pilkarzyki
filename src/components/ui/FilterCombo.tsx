'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { foldText } from '@/lib/draft-players'

/**
 * Searchable single-select filter. Extracted from the draft board so the admin
 * player list filters and looks identical -- a ~5000-row pool is unusable
 * without it, and two copies would drift.
 */
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
    const q = foldText(query)
    return options.filter((o) => !q || foldText(o).includes(q)).slice(0, 100)
  }, [options, query])

  return (
    <div ref={ref} className="relative">
      {/* The control keeps one fixed height whatever is selected. A long value
          ("FC Bayern Munchen") used to wrap onto a second line and grow the box,
          so the filter row changed height as you used it and the fields next to
          it no longer lined up. The value truncates instead, with the full text
          in the tooltip. */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={value || label}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:border-gray-400"
      >
        <span className={`min-w-0 truncate text-left ${value ? 'text-gray-900' : 'text-gray-500'}`}>
          {value || label}
        </span>
        <span className="shrink-0 text-gray-400">▾</span>
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

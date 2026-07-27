'use client'

import { useEffect, useRef } from 'react'

export interface DraftChatMessage {
  id: string
  body: string
  isAdmin: boolean
  createdAt: string
  userId: string | null
  senderName: string
}

/**
 * Draft-night chat panel. Shared by the pre-season and mid-season draft boards
 * so both look and behave identically.
 */
export function DraftChat({
  messages,
  value,
  onChange,
  onSend,
}: {
  messages: DraftChatMessage[]
  value: string
  onChange: (v: string) => void
  onSend: () => void
}) {
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="rounded-xl border border-gray-200 p-4 flex flex-col h-[360px]">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">Czat</h2>
      <div className="flex-1 overflow-auto space-y-2 pr-1">
        {messages.map((m) => (
          <div key={m.id} className="text-sm">
            <span className={`font-medium ${m.isAdmin ? 'text-[#29544D]' : 'text-gray-900'}`}>{m.senderName}</span>
            {m.isAdmin && (
              <span className="ml-1 text-[10px] uppercase bg-[#29544D] text-white px-1.5 py-0.5 rounded">Admin</span>
            )}
            <span className="text-gray-400 text-xs ml-2">
              {new Date(m.createdAt).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <div className="text-gray-700">{m.body}</div>
          </div>
        ))}
        {messages.length === 0 && <p className="text-sm text-gray-400">Brak wiadomości.</p>}
        <div ref={endRef} />
      </div>
      <div className="mt-3 flex gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSend()
          }}
          placeholder="Napisz wiadomość…"
          maxLength={500}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md"
          style={{ minWidth: 0 }}
        />
        <button
          onClick={onSend}
          className="px-5 py-2 text-sm rounded-md hover:opacity-90"
          style={{ flexShrink: 0, whiteSpace: 'nowrap', backgroundColor: '#29544D', color: '#ffffff' }}
        >
          Wyślij
        </button>
      </div>
    </div>
  )
}

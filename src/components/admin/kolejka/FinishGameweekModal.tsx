'use client'

import { AlertTriangle, CheckCircle2, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface FinishGameweekModalProps {
  week: number
  /** Player/lineup labels still missing a result; empty means ready to finish. */
  missing: string[]
  finishing: boolean
  onConfirm: () => void
  onClose: () => void
}

/**
 * Confirmation for "Zakończ kolejkę". Refuses with a clear missing-list when any
 * starting player still lacks a recorded result; otherwise confirms the finish
 * (which saves results, recalculates standings and advances the league).
 */
export function FinishGameweekModal({ week, missing, finishing, onConfirm, onClose }: FinishGameweekModalProps) {
  const blocked = missing.length > 0

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Zakończ kolejkę {week}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {blocked ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-lg border-2 border-red-300 bg-red-50 p-4">
                <AlertTriangle size={22} className="text-red-600 shrink-0 mt-0.5" />
                <div className="text-sm text-red-800">
                  <p className="font-bold mb-1">Nie można jeszcze zakończyć kolejki</p>
                  <p>
                    Najpierw uzupełnij wyniki (zaznacz „rozegrał mecz”) dla wszystkich zawodników.
                    Brakuje wpisów dla:
                  </p>
                </div>
              </div>
              <ul className="text-sm text-gray-700 space-y-1 list-disc pl-6">
                {missing.map((label, i) => (
                  <li key={i}>{label}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-lg border-2 border-green-300 bg-green-50 p-4">
              <CheckCircle2 size={22} className="text-green-600 shrink-0 mt-0.5" />
              <div className="text-sm text-green-800">
                <p className="font-bold mb-1">Wszystkie wyniki wpisane</p>
                <p>
                  Zakończenie kolejki zapisze wyniki, przeliczy tabelę i przełączy ligę na następną
                  kolejkę. Tej operacji nie można cofnąć.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={finishing}>
            {blocked ? 'Zamknij' : 'Anuluj'}
          </Button>
          {!blocked && (
            <Button onClick={onConfirm} loading={finishing} icon={<CheckCircle2 size={16} />}>
              Zakończ kolejkę
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

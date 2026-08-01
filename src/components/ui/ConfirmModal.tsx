'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { AlertTriangle } from 'lucide-react'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  loading?: boolean
  variant?: 'danger' | 'warning' | 'info'
  /**
   * When set, the confirm button stays disabled until the user types this exact
   * phrase (e.g. the league name). Use for irreversible, high-blast-radius
   * actions — deleting a league, wiping a schedule, resetting a draft.
   */
  requireConfirmationText?: string
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Potwierdź',
  cancelText = 'Anuluj',
  loading = false,
  variant = 'danger',
  requireConfirmationText,
}: ConfirmModalProps) {
  const [typed, setTyped] = useState('')

  // Clear the typed phrase whenever the modal opens or closes.
  //
  // React's "adjusting state when a prop changes" pattern rather than an
  // effect: setting state synchronously in an effect renders the stale value
  // first and then immediately re-renders. Setting it during render lets React
  // discard the in-progress render and retry with the cleared value, so the
  // previous phrase is never shown.
  const [wasOpen, setWasOpen] = useState(isOpen)
  if (wasOpen !== isOpen) {
    setWasOpen(isOpen)
    if (!isOpen) setTyped('')
  }

  const confirmationMet =
    !requireConfirmationText || typed.trim() === requireConfirmationText.trim()

  const handleConfirm = () => {
    if (!confirmationMet) return
    onConfirm()
  }

  const variantStyles = {
    danger: {
      iconColor: 'text-red-600',
      buttonClass: 'bg-red-600 hover:bg-red-700 text-white',
    },
    warning: {
      iconColor: 'text-yellow-600',
      buttonClass: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    },
    info: {
      iconColor: 'text-blue-600',
      buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
  }

  const style = variantStyles[variant]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      closeOnOverlayClick={!loading}
      showCloseButton={!loading}
    >
      <div className="flex flex-col items-center text-center space-y-4">
        <div className={`w-12 h-12 rounded-full bg-red-50 flex items-center justify-center ${style.iconColor}`}>
          <AlertTriangle size={24} />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{message}</p>
        </div>

        {requireConfirmationText && (
          <div className="w-full text-left space-y-1.5">
            <label className="block text-sm text-gray-600">
              Aby potwierdzić, wpisz{' '}
              <span className="font-semibold text-gray-900">{requireConfirmationText}</span>:
            </label>
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              disabled={loading}
              autoFocus
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100"
              placeholder={requireConfirmationText}
            />
          </div>
        )}

        <div className="flex gap-3 w-full pt-2">
          <Button
            onClick={onClose}
            variant="secondary"
            disabled={loading}
            className="flex-1"
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            loading={loading}
            disabled={!confirmationMet}
            className={`flex-1 ${style.buttonClass}`}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

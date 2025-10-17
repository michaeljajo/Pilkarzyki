'use client'

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
}: ConfirmModalProps) {
  const handleConfirm = () => {
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
            className={`flex-1 ${style.buttonClass}`}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

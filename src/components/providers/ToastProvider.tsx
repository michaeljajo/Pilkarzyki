'use client'

import { Toaster } from 'react-hot-toast'

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'var(--midnight-navy)',
          color: 'var(--off-white)',
          border: '1px solid var(--navy-border)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-4)',
          boxShadow: 'var(--shadow-xl)',
          backdropFilter: 'blur(var(--blur-lg))',
        },
        success: {
          iconTheme: {
            primary: '#10B981',
            secondary: '#ffffff',
          },
          style: {
            background: '#10B981',
            border: '1px solid #059669',
            color: '#ffffff',
            fontWeight: '500',
          },
        },
        error: {
          iconTheme: {
            primary: 'var(--danger)',
            secondary: 'var(--off-white)',
          },
          style: {
            border: '1px solid var(--danger)',
          },
        },
        loading: {
          iconTheme: {
            primary: 'var(--mineral-green)',
            secondary: 'var(--off-white)',
          },
        },
      }}
    />
  )
}
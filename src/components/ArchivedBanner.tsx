import { Archive } from 'lucide-react'

interface ArchivedBannerProps {
  season?: string | null
}

export function ArchivedBanner({ season }: ArchivedBannerProps) {
  return (
    <div
      role="status"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 20px',
        backgroundColor: '#f3f4f6',
        border: '1px solid #d1d5db',
        borderRadius: '12px',
        color: '#374151',
        marginBottom: '24px',
      }}
    >
      <Archive size={20} style={{ flexShrink: 0, color: '#6b7280' }} />
      <div>
        <p style={{ margin: 0, fontWeight: 600, fontSize: '14px' }}>
          Sezon zarchiwizowany — tylko do odczytu
        </p>
        <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
          {season
            ? `Sezon ${season} został zakończony. Możesz przeglądać wyniki, tabelę, strzelców i puchar, ale wszystkie zmiany są zablokowane.`
            : 'Ten sezon został zakończony. Możesz przeglądać wyniki, tabelę, strzelców i puchar, ale wszystkie zmiany są zablokowane.'}
        </p>
      </div>
    </div>
  )
}

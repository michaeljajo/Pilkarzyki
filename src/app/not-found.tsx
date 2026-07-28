import Link from 'next/link'
import Image from 'next/image'

// Polish, styled 404 replacing the raw Next.js default. Standalone (no league
// context is available at the global boundary), with a clear route back.
export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <Image
          src="/pilkarzyki-logo.png"
          alt="Piłkarzyki"
          width={180}
          height={45}
          priority
          className="mx-auto mb-8 opacity-90"
        />
        <p className="text-6xl font-extrabold" style={{ color: '#061852' }}>
          404
        </p>
        <h1 className="mt-4 text-xl font-semibold text-gray-900">Nie znaleziono strony</h1>
        <p className="mt-2 text-gray-600">
          Strona, której szukasz, nie istnieje lub została przeniesiona.
        </p>
        <Link
          href="/leagues"
          className="mt-8 inline-flex items-center justify-center min-h-[44px] px-6 rounded-xl text-sm font-medium text-white transition-colors"
          style={{ backgroundColor: '#061852' }}
        >
          Wróć do moich lig
        </Link>
      </div>
    </div>
  )
}

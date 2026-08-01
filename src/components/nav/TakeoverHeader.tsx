import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'
import { APP_CONTAINER } from '@/components/layout/appContainer'

// Header for takeover routes (draft, mid-season draft, transfers), which render
// outside AppShell and so used to hand-roll their own bar. Each copy drifted:
// a 1100px container instead of the shared one, a 120x30 logo instead of
// 140x35, and a gray-900 base-size title instead of the navy text-sm the shell
// uses — so crossing into a draft visibly shifted the left edge and restyled
// the title. This mirrors AppShell's first header row exactly; only the
// right-hand control differs, because a takeover offers one explicit exit
// rather than the avatar menu.

const COLLEGIATE_NAVY = '#061852'

export function TakeoverHeader({
  title,
  backHref,
  backLabel,
}: {
  /** e.g. "Draft — test 26". Shown where AppShell shows the league name. */
  title: string
  backHref: string
  backLabel: string
}) {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className={`${APP_CONTAINER} h-16 flex items-center justify-between gap-3`}>
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/leagues"
            className="shrink-0 hover:opacity-80 transition-opacity"
            aria-label="Piłkarzyki — moje ligi"
          >
            {/* Intrinsic size stays 140x35 for the aspect ratio; the rendered
                height steps down on a phone so the logo, the title and the exit
                still fit on one 390px row. */}
            <Image
              src="/pilkarzyki-logo.png"
              alt="Piłkarzyki"
              width={140}
              height={35}
              priority
              className="h-7 w-auto sm:h-[35px]"
            />
          </Link>
          <span className="truncate text-sm font-semibold" style={{ color: COLLEGIATE_NAVY }}>
            {title}
          </span>
        </div>
        <Link
          href={backHref}
          aria-label={backLabel}
          className="inline-flex items-center gap-1.5 shrink-0 min-h-[44px] px-3 rounded-xl text-sm font-medium text-[#29544D] hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={18} />
          {/* Label is redundant next to a back arrow when space is scarce. */}
          <span className="hidden sm:inline">{backLabel}</span>
        </Link>
      </div>
    </header>
  )
}

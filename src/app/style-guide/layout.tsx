import { notFound } from 'next/navigation'

/**
 * The style guide is a living design reference for development only. It is not
 * linked from anywhere in the app and should not be reachable in production, so
 * this server-component layout 404s the whole subtree outside development.
 *
 * The page is still compiled into the build — this gates reachability, not
 * bundle size.
 */
export default function StyleGuideLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (process.env.NODE_ENV === 'production') {
    notFound()
  }

  return <>{children}</>
}

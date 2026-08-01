/**
 * Minimal logger.
 *
 * Two problems this solves:
 *
 * 1. Debug chatter reached Vercel's production log stream on every request.
 *    `debug` is a no-op outside development.
 * 2. Some of that chatter included personal identifiers (Clerk user ids,
 *    email-derived names). Vercel logs are retained and searchable, so
 *    identifiers do not belong in them. Log what happened and the ids you
 *    need to correlate — league, gameweek, cup — not who did it.
 *
 * `error` and `warn` always emit: if something failed in production, that is
 * exactly when you need to see it.
 */

const isDev = process.env.NODE_ENV !== 'production'

export const logger = {
  /** Development-only. Stripped from production output. */
  debug(...args: unknown[]): void {
    if (isDev) console.log(...args)
  },

  /** Recoverable problem worth surfacing in production. */
  warn(...args: unknown[]): void {
    console.warn(...args)
  },

  /** Genuine failure. Always emitted. */
  error(...args: unknown[]): void {
    console.error(...args)
  },
}

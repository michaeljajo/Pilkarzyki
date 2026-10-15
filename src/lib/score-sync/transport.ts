import { Impit } from 'impit'

/**
 * HTTP access to SofaScore's (unofficial) JSON API.
 *
 * SofaScore rejects ordinary server-side clients (Node fetch, curl) with a 403
 * based on the TLS fingerprint, so requests go through `impit`, which mimics a
 * real browser's handshake. Only the www host with a Firefox fingerprint gets
 * through; api.sofascore.com and the Chrome fingerprint are challenged.
 */

export const SOFASCORE_BASE_URL = 'https://www.sofascore.com/api/v1'

export class SofascoreHttpError extends Error {
  constructor(
    readonly path: string,
    readonly status: number,
    readonly body: string
  ) {
    super(`SofaScore ${status} for ${path}: ${body.slice(0, 120)}`)
    this.name = 'SofascoreHttpError'
  }
}

export interface SofascoreTransport {
  /** GET `path` (relative to /api/v1, e.g. `/event/123/incidents`) and parse JSON. */
  getJson<T>(path: string): Promise<T>
}

export function createImpitTransport(): SofascoreTransport {
  const impit = new Impit({ browser: 'firefox' })

  return {
    async getJson<T>(path: string): Promise<T> {
      const response = await impit.fetch(`${SOFASCORE_BASE_URL}${path}`, {
        headers: { Accept: '*/*', Referer: 'https://www.sofascore.com/' },
      })
      const body = await response.text()
      if (response.status !== 200) {
        throw new SofascoreHttpError(path, response.status, body)
      }
      return JSON.parse(body) as T
    },
  }
}

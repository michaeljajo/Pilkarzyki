import { supabaseAdmin } from '@/lib/supabase'

// PostgREST caps a single response at 1000 rows (Supabase's default
// `db-max-rows`). Leagues now hold several thousand players, so any query that
// needs the full pool must page through the result set explicitly — otherwise
// the extra players are silently dropped.
const PAGE_SIZE = 1000

/**
 * Fetches every player row belonging to a league, in pages of 1000.
 *
 * `columns` is a PostgREST select string, so callers can pick their own shape
 * (including embedded relations such as the manager join).
 * Rows are ordered by `orderColumn` with `id` as a tie-breaker — a stable total
 * order is required, otherwise ties can shift between pages and cause rows to
 * be repeated or skipped.
 */
export async function fetchAllPlayersInLeague<T = Record<string, unknown>>(
  leagueName: string,
  columns: string,
  orderColumn: 'name' | 'surname' = 'surname'
): Promise<T[]> {
  const rows: T[] = []

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabaseAdmin
      .from('players')
      .select(columns)
      .eq('league', leagueName)
      .order(orderColumn, { ascending: true })
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)

    if (error) throw error

    const page = (data || []) as T[]
    rows.push(...page)
    if (page.length < PAGE_SIZE) break
  }

  return rows
}

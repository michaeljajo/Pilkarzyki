/**
 * PostgREST caps every select at 1000 rows (Supabase's `max-rows`), and it does
 * so silently — you get 1000 rows and no error, no flag, nothing to distinguish
 * "there were exactly 1000" from "there were 5000". A full draft pool is ~5000
 * players, so any unpaged select over `players` quietly loses most of it.
 *
 * Wrap such a select in `fetchAllRows` and it pages until the source runs dry.
 */

const PAGE_SIZE = 1000

/** Shape of an awaited PostgREST query — matches Supabase's builder result. */
interface QueryResult<T> {
  data: T[] | null
  error: { message: string } | null
}

/**
 * Runs `buildPage` over successive ranges and concatenates the results.
 *
 * The callback must apply `.range(from, to)` to an otherwise complete query,
 * and that query MUST have a total order (add a tiebreaker such as `id` when
 * the sort column is not unique) — rows are otherwise free to move between
 * pages, which both duplicates and drops them.
 *
 *   const players = await fetchAllRows((from, to) =>
 *     supabaseAdmin
 *       .from('players')
 *       .select('id, surname')
 *       .eq('league_id', leagueId)
 *       .order('surname')
 *       .order('id')
 *       .range(from, to)
 *   )
 *
 * Throws on the first page error, so callers keep their existing try/catch.
 */
export async function fetchAllRows<T>(
  buildPage: (from: number, to: number) => PromiseLike<QueryResult<T>>,
  pageSize: number = PAGE_SIZE
): Promise<T[]> {
  const rows: T[] = []

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await buildPage(from, from + pageSize - 1)
    if (error) throw new Error(error.message)

    rows.push(...(data ?? []))
    // A short page means we reached the end.
    if (!data || data.length < pageSize) break
  }

  return rows
}

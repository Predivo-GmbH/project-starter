/**
 * Fetch EVERY row from a PostgREST list query, past Supabase's default 1000-row cap.
 *
 * A plain `.select('*')` silently returns at most 1000 rows (the `db-max-rows` default),
 * so any reduce/count/sum over the result under-reports once a table exceeds 1000 rows — a
 * silent data-loss / wrong-total bug (this is the exact class the v11 Gate I data-volume
 * test catches; it recurred across BoatBuddy/SignalScore/BackOffice in the 2026-08-02 sweep).
 *
 * Use this for ANY list whose result feeds a total/count/aggregate. Pass a builder that
 * applies `.range(from, to)` to a fresh filtered/ordered query; it pages until a short
 * (<1000) chunk signals the end. Do NOT use it for intentional top-N displays (keep `.limit`).
 */
const PAGE = 1000

export async function fetchAllRows<T>(
  build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const all: T[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build(from, from + PAGE - 1)
    if (error) throw new Error(error.message)
    const chunk = data ?? []
    all.push(...chunk)
    if (chunk.length < PAGE) break
  }
  return all
}

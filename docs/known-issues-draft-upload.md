# Known Issues — Mid-Season Draft Upload

Two known defects in the mid-season draft upload path, found on 2026-08-14 while
fixing the row-cap bugs in the same file. **Both are parked, not fixed.** They
were deliberately left alone: the fix for each changes behaviour rather than
restoring it, and neither should be attempted close to a live draft.

Everything here concerns **`src/app/api/admin/players/draft/route.ts`** — the
Excel upload that reassigns squads for a mid-season draft. Nothing below affects
the pre-season draft board, the live pick flow, or delegations.

Fixed in the same pass and *not* an open issue: both selects in this file were
capped at 1000 rows. See commit `183bb42`.

---

## Issue 1 — Player identity here disagrees with the importer

### What

This route matches uploaded rows against existing players by **name only**:

```ts
const existingPlayersMap = new Map(
  existingPlayers?.map(p => [`${p.name}|${p.surname}`, p]) || []
)
```

The player importer (`src/app/api/admin/players/import/route.ts`) uses
**name plus club**, changed deliberately in commit `ba2c467`
("treat club as part of a player's identity when de-duplicating"):

```ts
const dedupeKey = (name: string, surname: string, club: string) =>
  `${name.toLowerCase()}|${surname.toLowerCase()}|${club.toLowerCase()}`
```

So two real players who share a name are **one** player to the draft upload and
**two** to the importer.

### Why it matters

A pool of ~5000 players drawn from many European leagues will contain shared
names. When it does, the draft upload matches an uploaded row to whichever
namesake it happens to hold, and can:

- record a transfer against the wrong player, moving a player nobody touched;
- leave the intended player untouched, so the squad is silently wrong;
- interact with Issue 2 below, leaving a run half-applied.

This is data corruption that reports success. It does not throw.

### Why it is parked

Aligning the key with the importer is a one-line change, but it **changes which
player an upload resolves to**. Any past upload that matched a namesake would
resolve differently on the next run, so the fix must be paired with a look at
what the existing data actually contains. That is a deliberate migration, not a
drive-by fix.

### If you fix it

1. First find out whether the ambiguity is real, per league:
   ```sql
   SELECT name, surname, COUNT(*), array_agg(DISTINCT club)
   FROM players
   WHERE league_id = '<league>'
   GROUP BY name, surname
   HAVING COUNT(*) > 1
   ORDER BY COUNT(*) DESC;
   ```
   If that returns nothing for the leagues you upload to, the fix is safe and
   purely preventative.
2. Reuse the importer's `dedupeKey` rather than writing a second one — two
   definitions of player identity is what caused this.
3. Note that the unassignment sweep further down the same file also keys on
   `` `${player.name}|${player.surname}` `` against `playersInFile`. Both must
   change together, or an upload will transfer under one identity and unassign
   under another.

---

## Issue 2 — The upload is not transactional

### What

The route walks the uploaded rows in a loop, and for each one creates transfer
records, updates `squad_players`, and writes to `players` — then runs a second
loop that unassigns everyone missing from the file. Errors are pushed onto
`result.errors` and the loop continues:

```ts
} catch (error) {
  result.errors.push(`Row ${rowNum}: Unexpected error - ...`)
}
```

There is no surrounding transaction and no rollback.

### Why it matters

A failure partway through leaves the league **half-migrated**: some players
moved, some not, some unassigned, with no record of where it stopped beyond the
error list in the response. Re-running is not obviously safe, because the
successful half is already applied.

The exposure grew when the row caps were fixed. The upload previously operated
on an arbitrary 1000-row subset; it now processes the full ~5000, so there is
correspondingly more to leave half-done.

### Why it is parked

The fix is real work, not a patch. Options, roughly in order of effort:

- **Preferred:** move the whole apply step into a Postgres function, the way
  `draft_make_pick` and friends already work (`022`, `026`). The upload would
  parse and validate in the route, then hand one payload to one function that
  commits or raises. This matches the existing draft architecture.
- **Cheaper:** a dry-run/apply split — validate every row and report what would
  happen, then apply only on confirmation. Does not give atomicity, but stops
  most half-applied runs, since the common failure is bad input.
- **Cheapest:** record a run id on every write so a failed run can be identified
  and reversed. Adds a column and a manual recovery path.

### Interim mitigation

Until it is fixed, **take a database snapshot before any mid-season upload.**
Supabase's dashboard backup is enough. That converts a half-applied run from a
manual reconstruction into a restore.

---

## Related, already fixed

Context for anyone reading this later — these were the same class of bug and are
resolved:

| Issue | Commit |
|---|---|
| Draft pool truncated at 1000 (board, mid-season board, squad export) | `835063f` |
| Transfer detection and the unassignment sweep truncated at 1000 | `183bb42` |
| Admin player list truncated at 1000 | `3e56638` |
| Player import re-inserted everyone past row 1000 | `75ca8a6` |

The shared pager introduced for these is `src/lib/fetch-all-rows.ts`. Any new
`select` over `players` should use it — PostgREST caps every select at 1000 rows
and gives no signal that it did.

# Piłkarzyki — navigation restructure

Paste this into Claude Code at the repo root. Work through it **one phase at a time, one PR per phase.** Do not start a phase until the previous one is merged and I've confirmed it works.

---

## Context

Next.js App Router + Clerk + Supabase, deployed on Vercel. Polish-language fantasy football app. ~16 active users in one real league.

The app currently has **four unrelated navigation patterns**:

| Area | Current nav |
|---|---|
| `/dashboard` (Moje Ligi) | none |
| `/dashboard/leagues/[id]` | 3×4 grid of 11 identical icon tiles |
| Player pages (squad, standings, schedule) | horizontal top nav |
| `/dashboard/admin/leagues/[id]/*` | left sidebar, with a "Powrót do gry" escape link |

Users never build a stable mental model. `Terminarz` and `Ustawienia` each appear in two places meaning different things. `Puchar` exists in the admin sidebar but has **no player-facing entry point at all** — managers cannot see the cup.

We are replacing all four with one navigation system.

---

## Target information architecture

Five persistent tabs. Bottom tab bar on mobile (`< 768px`), horizontal top nav on desktop. Same component, same order, same labels at both breakpoints.

| Tab | Icon | Contains |
|---|---|---|
| **Skład** | shirt | Landing screen. Deadline countdown, lineup status, next fixture, pitch + player pickers. League/cup switcher. |
| **Liga** | trophy | Tabela · Wyniki · Składy · Strzelcy |
| **Puchar** | award | Drabinka · Wyniki pucharowe |
| **Terminarz** | calendar | All fixtures, both competitions merged chronologically |
| **Więcej** | dots | Ustawienia · Zmień ligę · Wyloguj · **Zarządzaj ligą** (admins only) |

**Draft** and **Transfery** are *not* tabs. They are time-boxed full-screen takeovers — see Phase 5.

### Key decisions and why

- **Skład is the default landing route**, not a menu. It's what managers come to do every week. Loading `/leagues/[id]` redirects there.
- **Terminarz stays top-level and merged**, not nested inside Liga and Puchar. Fixtures already carry a competition chip (`liga`), so this is mostly a rendering change. "When do I next play" is one question, not two.
- **Liga and Puchar hold only competition-specific views** — a table vs a bracket, and their respective results.
- **Admin is a contextual mode**, not a separate app. Same shell, same tabs, entered from Więcej. See Phase 6.

---

## Route map

Restructure freely, but ship the redirect table — external links and bookmarks must not 404.

### New routes

```
/leagues                              league picker
/leagues/new                          create league
/leagues/[id]                         → redirect to /leagues/[id]/squad

/leagues/[id]/squad                   Skład (DEFAULT LANDING)
    ?competition=league|cup           competition switcher, default league

/leagues/[id]/league                  → redirect to /leagues/[id]/league/table
/leagues/[id]/league/table            Tabela
/leagues/[id]/league/results          Wyniki
/leagues/[id]/league/lineups          Składy
/leagues/[id]/league/scorers          Strzelcy

/leagues/[id]/cup                     → redirect to /leagues/[id]/cup/bracket
/leagues/[id]/cup/bracket             Drabinka
/leagues/[id]/cup/results             Wyniki pucharowe

/leagues/[id]/fixtures                Terminarz (merged, both competitions)
/leagues/[id]/more                    Więcej

/leagues/[id]/draft                   takeover, active window only
/leagues/[id]/transfers               takeover, open window only

/leagues/[id]/manage                  → redirect to /leagues/[id]/manage/managers
/leagues/[id]/manage/managers
/leagues/[id]/manage/players
/leagues/[id]/manage/players/import
/leagues/[id]/manage/gameweeks
/leagues/[id]/manage/results
/leagues/[id]/manage/cup
/leagues/[id]/manage/settings
```

### Redirects (permanent, 308)

```
/dashboard                                        → /leagues
/dashboard/create-league                          → /leagues/new
/dashboard/leagues/[id]                           → /leagues/[id]/squad
/dashboard/leagues/[id]/squad                     → /leagues/[id]/squad
/dashboard/leagues/[id]/standings                 → /leagues/[id]/league/table
/dashboard/leagues/[id]/schedule                  → /leagues/[id]/fixtures
/dashboard/leagues/[id]/draft                     → /leagues/[id]/draft
/dashboard/admin/leagues/[id]                     → /leagues/[id]/manage/managers
/dashboard/admin/leagues/[id]/managers            → /leagues/[id]/manage/managers
/dashboard/admin/leagues/[id]/players             → /leagues/[id]/manage/players
/dashboard/admin/leagues/[id]/players/import      → /leagues/[id]/manage/players/import
/dashboard/admin/leagues/[id]/gameweeks           → /leagues/[id]/manage/gameweeks
/dashboard/admin/leagues/[id]/kolejka             → /leagues/[id]/manage/results
/dashboard/admin/leagues/[id]/cup                 → /leagues/[id]/manage/cup
/dashboard/admin/leagues/[id]/settings            → /leagues/[id]/manage/settings
```

Audit the repo for any player-facing routes I haven't listed (wyniki, strzelcy, składy, transfery, tablica) and fold them into the map above following the same pattern. **Tablica is unused — remove it entirely, including its route, components and nav entries.**

---

## Phase 0 — Safety net

**Do this before writing a single line of code.** There are ~16 real users on production. Nothing in this document should reach them until every phase is verified.

1. **Confirm the working tree is clean.** Run `git status`. If anything is uncommitted or untracked, stop and ask me what to do with it — do not commit or stash on my behalf.

2. **Tag the current production state** so we can get back to it instantly:
   ```
   git tag pre-nav-restructure
   git push origin pre-nav-restructure
   ```
   Tell me the commit SHA this points at, and write it at the top of your notes.

3. **Create the integration branch** off the current production branch:
   ```
   git checkout -b nav-restructure
   git push -u origin nav-restructure
   ```

4. **Branch per phase off `nav-restructure`**, never off main:
   ```
   nav-restructure
     ├── nav/phase-1-routes
     ├── nav/phase-2-shell
     ├── nav/phase-3-squad
     ├── nav/phase-4-competitions
     ├── nav/phase-5-takeovers
     └── nav/phase-6-admin
   ```
   Each phase opens a PR into `nav-restructure`, not into main.

5. **Confirm Vercel is building preview deployments** for `nav-restructure`. Give me the preview URL. All my testing happens there — production stays on the current code throughout.

6. **Never push to main or the production branch.** When all six phases are merged into `nav-restructure` and I've confirmed the preview works, I will decide when to merge to production. Do not do it yourself, and do not ask to.

**Rollback plan.** If anything reaches production and breaks, `git reset --hard pre-nav-restructure` restores the current state. Confirm to me that this tag exists and is pushed before starting Phase 1.

**No database migrations are expected.** This work is routing, layout and API route-guard changes. If any phase appears to need a schema change, **stop and ask me first** — do not run a migration against the production database.

**Acceptance criteria**

- `pre-nav-restructure` tag exists on the remote and points at current production.
- `nav-restructure` branch exists on the remote with a working Vercel preview URL.
- Production is untouched and still serving the current code.

---

## Phase 1 — Route restructure and redirects

Plumbing only. **No visual changes.** Every page should look exactly as it does now, just at a new URL.

1. Move route directories per the map above.
2. Add the redirect table to `next.config.js` (or middleware if the params need runtime logic).
3. Update every internal `<Link href>` and `router.push` to the new paths. Grep for `/dashboard/` — there should be zero hardcoded occurrences left outside the redirect config.
4. Delete the Tablica route and its components.

**Acceptance criteria**

- Every old URL in the redirect table lands on the correct new URL with a 308.
- No internal link produces a redirect hop — internal links point at final URLs.
- `grep -r "/dashboard/leagues\|/dashboard/admin" app/ components/` returns nothing outside redirect config.
- No visual regressions. Screenshot each page before and after and diff them.

---

## Phase 2 — App shell and tab bar

Replace all four navigation patterns with one shell.

**Build `<AppShell>`** wrapping every route under `/leagues/[id]`:

- **Header** (sticky, `position: sticky; top: 0`): logo → league name (tappable, opens league switcher) → user menu. The current header scrolls away; it must not.
- **Tab bar**: bottom-fixed on `< 768px` with `env(safe-area-inset-bottom)` padding; horizontal, directly under the header on `≥ 768px`. One component, breakpoint-switched styling.
- **Content area**: `max-width: 1100px; margin: 0 auto`. The current pages are left-aligned in a 1600px viewport leaving ~700px dead space.

**Tab behaviour**

- Active tab: filled pill background, accent text. Inactive: muted text, no background.
- Tab stays active for all nested routes — `/leagues/[id]/league/scorers` keeps **Liga** highlighted.
- Tab bar hidden on takeover routes (`/draft`, `/transfers`).
- **Puchar tab renders only if the league has a cup configured.** Check this server-side; don't render then hide.

**Also in this phase**

- **Fix scroll restoration.** Navigating between routes currently preserves scroll position, so you land mid-page with the `<h1>` clipped. Reset to top on route change unless it's a back navigation.
- **Replace the 404 page.** Currently the raw Next.js default: English, unstyled, no navigation. Build a Polish 404 inside `AppShell` with a link back to Skład.
- Delete the tile-grid page component and the admin sidebar component.

**Acceptance criteria**

- One nav component renders on every authenticated route. No page defines its own nav.
- Tab bar is thumb-reachable on a 375px viewport and does not overlap iOS home indicator.
- Header remains visible when scrolled to the bottom of a 30-gameweek fixture list.
- Deep-linking to `/leagues/[id]/league/scorers` highlights Liga.
- Navigating from a scrolled-down page lands at scroll position 0.

---

## Phase 3 — Skład as the landing screen

The biggest single UX win. Currently `/leagues/[id]` shows 11 tiles and zero information — no deadline, no fixture, no lineup status.

**Skład gets a status header above the pitch**, in this order:

1. **Deadline countdown** — live-ticking (`4 dni 6 godz.`, then `18 godz. 42 min` under a day, then `42 min` under an hour). This is the most important element on the screen; size it accordingly. Amber under 24h, red under 2h.
2. **Lineup status** — "Skład ustawiony ✓" or "Nie ustawiłeś składu" as a prominent warning. Show this for **both competitions** if both have an open gameweek.
3. **Next fixture** — `Ty vs haras`, with the gameweek number and competition chip.

**Competition switcher**

The league and cup take separate lineups (`Skład Ligowy` already exists as a title). Add a segmented control at the top of Skład: `Ligowy | Pucharowy`, bound to `?competition=`. The cup segment appears only when a cup gameweek is open.

Each competition has its own deadline. When both are open, the header shows the **nearer** deadline prominently and the other as a secondary line.

**Do not touch the lineup picking mechanism.** Desktop uses drag-and-drop of player jerseys onto the pitch; mobile uses the `Wybierz zawodnika` selects. Both work and are deliberate. This phase adds the status header and competition switcher *above* the pitch and changes nothing about how players are placed on it.

**Acceptance criteria**

- `/leagues/[id]` redirects to `/leagues/[id]/squad`.
- Countdown ticks without a page refresh and switches colour at the 24h and 2h thresholds.
- A manager with no lineup set sees an unmissable warning above the fold on a 375px viewport.
- Desktop drag-and-drop and mobile selects both behave exactly as they did before this phase.
- Switching competition preserves unsaved changes or warns before discarding.

---

## Phase 4 — Liga, Puchar and merged Terminarz

**Liga and Puchar** get a secondary nav (segmented control or underlined tabs) directly under the tab bar:

- Liga: `Tabela · Wyniki · Składy · Strzelcy`
- Puchar: `Drabinka · Wyniki`

This is the *only* second-level nav in the app. It must look clearly subordinate to the tab bar — smaller, no filled pill, underline for active.

**Terminarz** merges both competitions into one chronological list:

- Each fixture row carries a competition chip (`liga` / `puchar`) — the chip component already exists.
- **Label gameweeks by number, not date.** Currently the player schedule headers show `27 lipca 2026` while the admin shows `Kolejka 1` and the fixture card says `27 lip - 2 sie` with a deadline of `1 sie`. Three framings of one gameweek, two of which are wrong. Use `Kolejka N` as the heading with the match date range as a subtitle, derived from one source of truth shared with the admin screens.
- The current or next gameweek is **expanded by default**; past ones collapsed.
- Mark the current user's own fixtures visually.
- Keep the existing manager filter, but restyle the native `<select>`.

**Acceptance criteria**

- A cup fixture and a league fixture in the same week appear in one list, correctly ordered, correctly chipped.
- Gameweek numbering and dates match exactly between `/fixtures` and `/manage/gameweeks`. Write a test asserting this.
- Landing on Terminarz shows the next gameweek's fixtures without any clicks.
- Secondary nav is visually subordinate to the tab bar at both breakpoints.

---

## Phase 5 — Draft and Transfery as takeovers

Both are live features, but neither is a permanent destination — Draft runs once a season, Transfery only when the window is open.

- Both render **full-screen without the tab bar**, with a single explicit exit (`✕ Zamknij` or `← Wróć do składu`).
- Entry points are **contextual**: when a draft is active or a transfer window is open, a prominent banner appears at the top of Skład linking into it. No permanent nav entry.
- Attempting to visit either route outside its window redirects to Skład with an explanatory toast.

**Fix these known Draft bugs in this phase:**

1. **The page has no layout container on desktop.** The `<h1>`, manager list and `Rozpocznij draft` button sit flush at `x=0`, with the button partially off-screen. Every other page has a content container; this one lost it.
2. **The `Rozpocząć draft?` confirmation modal renders at roughly 30% opacity** — grey on grey, barely legible. Looks like a fade-in transition that never completes.
3. **Investigate a renderer freeze.** After loading `/draft`, the browser tab stopped painting entirely and *stayed* frozen after navigating to another route. The DOM remained readable; only rendering was wedged. Audit `useEffect` cleanup on this page — an uncleaned `setInterval`, animation loop, or Supabase realtime subscription is the likely cause.
4. **Draft order ↑/↓ buttons have no accessible name** — only an arrow glyph. Add `aria-label` naming the manager being moved.

**Acceptance criteria**

- Draft page respects the same content container as every other page.
- Confirmation modal is fully opaque and legible.
- Navigating away from `/draft` and back 20 times does not degrade rendering performance.
- Visiting `/draft` with no active draft redirects with an explanation.

---

## Phase 6 — Admin as contextual mode

Admin stops being a separate app with its own sidebar.

- `/leagues/[id]/manage/*` renders inside the **same `AppShell`** — same header, same tab bar. **Więcej** stays highlighted while in admin.
- Entry: a `Zarządzaj ligą` item in Więcej, visible only to league admins.
- A persistent banner sits directly under the header on all `/manage/*` routes: `Tryb administratora` plus a `Zakończ` link back to Skład. This replaces the current "Powrót do gry" sidebar link.
- Admin sections become a secondary nav using the same component as Liga/Puchar: `Menedżerowie · Zawodnicy · Terminarz · Wyniki · Puchar · Ustawienia`.

**Guard the routes properly.** Currently the UI grants league-admin access but `POST /api/admin/players/import` returns 403 `"Admin access required"` — the endpoint checks a *global* admin role while the rest of the admin area checks league ownership. Move these endpoints under `/api/leagues/[id]/...` and check league ownership consistently. **A user who creates a league must be able to administer it fully.** This is currently the app's most severe bug: no player import means no draft, no lineups, no results, no table.

**Acceptance criteria**

- A non-global-admin user who creates a league can import players, generate a schedule and enter results end to end.
- `/manage/*` routes 404 or redirect for non-admins — never render then hide.
- Admin banner is visible on every `/manage/*` route.
- No separate admin layout component remains in the codebase.

---

## Rules that apply to every phase

- **One PR per phase, all into `nav-restructure`.** Never into main. Do not begin the next phase until I confirm the previous one works on the preview URL.
- **All UI strings in Polish.** Fix any English leaking through as you touch each area — the 403 message, the 404 page, and the browser tab title (`Pilkarzyki - Modern Fantasy Football`).
- **Use `menedżer` consistently**, never `manager` — the fixture filter currently says `Wszyscy managerowie`.
- **Cancel and secondary buttons must be ghost/text style**, never filled. Currently `Anuluj` is a solid navy button sitting next to greyed-out primaries on almost every form, and `Odśwież` is the loudest element on several pages.
- **Every interactive element needs an accessible name.** Form labels must be associated with inputs via `htmlFor`/`id` — accessible names currently fall back to placeholder text throughout.
- **Minimum touch target 44×44px** on mobile.
- Before each phase, take screenshots of the affected pages at 375px and 1440px. After, take them again and confirm nothing regressed outside the intended change.
- If any instruction here conflicts with something you find in the code, **stop and ask** rather than guessing.

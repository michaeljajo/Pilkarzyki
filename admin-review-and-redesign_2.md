# Pilkarzyki — Admin Review & Redesign Proposal

*Based on repo state as of commit 448f179 (2026-07-23).*

---

## Part 1: What's wrong today

### 1.1 You have two admin panels, and one of them is a ghost

There are two parallel admin worlds in the code:

- **Per-league admin**: `/dashboard/admin/leagues/[id]/...` — this is the real one, with 18 pages (overview, standings, managers, players, gameweeks, lineups, cup, results, settings…).
- **Global admin**: `/dashboard/admin/results`, `/admin/gameweeks`, `/admin/players`, `/admin/squads`, `/admin/table`, `/admin/users`, `/admin/migration`, `/admin/schedule-generator` — mostly leftovers from before the app supported multiple leagues.

The old global pages are largely orphaned: the component that used to link to them (`AdminLayout.tsx`, with its Users/Players/Squads/Gameweeks/Table menu) is no longer used anywhere except a backup file. But the pages still exist, still work, and one of them — global "Wyniki" — is *still linked in the current top nav*. That's a 537-line copy of the 1,175-line per-league results page. Two pages doing the same job means every bug gets fixed twice (or once, in the wrong one), and an admin can land on a results screen that isn't scoped to the league they think they're editing.

**In plain terms:** your app has an abandoned wing that's still wired to the electricity. It confuses you, it confuses Claude Code when you ask for changes, and it doubles the surface for bugs.

### 1.2 The navigation has three competing brains

Right now the admin experience is stitched from three navigation systems:

1. **Top nav** that morphs depending on context — "global admin mode" shows Ligi / Wyniki / Powrót; "league mode" shows the *player-facing* menu (Skład, Liga, Puchar, Terminarz, Strzelcy) plus an "Admin" button that jumps straight to Results.
2. **Left sidebar** with 9 league-admin items (Przegląd, Tabela, Menedżerowie, Zawodnicy, Kolejki, Składy, Puchar, Wyniki, Ustawienia).
3. **Hub pages with buttons** — the Cup page is a card grid linking to 5 sub-pages; the Overview page has its own buttons to Cup, Excel export, schedule generation.

"Powrót" (back) appears in three places and goes to three different destinations. `/dashboard/admin` itself is just a redirect to the league list. There is no consistent answer to "where am I, and how do I get back?"

### 1.3 The admin is organized by *data*, not by *what you actually do*

The sidebar mirrors database tables: Managers, Players, Gameweeks, Lineups, Results, Settings. But your real life as an admin has three very different rhythms:

- **Once per season:** create league, import players, add managers, run draft, generate schedule, set up cup.
- **Every week:** check who submitted lineups, chase the ones who didn't, enter goals after the weekend, mark the gameweek complete.
- **Rarely:** fix a date, transfer a player, rename the league, archive the season.

The current UI treats all of these as equal siblings. The thing you do 30 times a season (weekly results) sits next to the thing you do once (player import) and the thing you should almost never touch (delete league). Worse, the one-time and dangerous stuff is *more* prominent: the Overview page — the first thing you see — is a dumping ground of rename-league, cup link, Excel export, manager management, and **schedule generate/delete buttons side by side**. Deleting the schedule mid-season is one misclick away from your landing page.

### 1.4 No status, no guidance — you have to keep the workflow in your head

Nothing in the admin tells you: *"Gameweek 12 is locked. 13 of 16 managers submitted lineups. Results not yet entered. Next step: enter goals."* You have to remember the sequence yourself and navigate to the right page at the right time. The weekly state of a gameweek is a natural pipeline:

`Upcoming → Lineups open → Locked → Results entry → Completed`

…but in the app, "completed" is a **dropdown you manually flip** inside the results page, with no check that all goals were actually entered. Forget to flip it, or flip it too early, and standings are wrong.

### 1.5 The results page is a monolith

`leagues/[id]/results/page.tsx` is 1,175 lines handling league results, cup results, extra time, and penalties in one screen. Functionally it's your most important page; structurally it's the hardest to change safely. It also means cup results have two entry points (Results page *and* the Cup section), which adds to the "where do I do this?" confusion.

### 1.6 Duplication and inconsistency in the details

- Manager management exists **twice**: on the Overview page and on the dedicated Menedżerowie page.
- Cup pages live under `/cup/...` except `cup-lineups`, which sits outside the cup folder for no user-visible reason.
- Language is mixed mid-screen: "Save All Results" next to "Zapisz wynik", "Week 12 (Completed)", "Redirecting to leagues...". Pick Polish and use it everywhere.
- The button labeled **"Transfery"** leads to a page whose folder is called `draft`. Label, route, and purpose should agree.
- Repo hygiene: `node_modules 2`, `package-lock 2.json`, `package-lock 3.json`, `page-backup.tsx` and ~35 status/progress `.md` files are committed to the repo. Harmless to users, but noise that confuses both you and Claude Code.

---

## Part 2: The redesign

### Guiding principle

**One admin, organized by rhythm, with a dashboard that tells you what to do next.** The admin should feel like a checklist that knows what week it is — not a filing cabinet.

### 2.0 What mandated default lineups change (implemented)

Default lineups (żelazko) are now mandatory for every manager, and a cron applies them automatically at lock. This shifts the admin's weekly job in three ways:

1. **"Missing lineup" stops being an admin problem.** By lock time every manager has a lineup — either their own pick or their żelazko. The admin no longer fills in lineups for absentees; the old AdminLineupsManager "create lineup for manager" role is obsolete. What remains is a *correction* role: fixing an obvious mistake after lock, which should be rare and logged.
2. **The thing worth monitoring moves upstream.** The failure mode is no longer "blank lineup" but "broken default": a transfer removed a player from someone's żelazko, or the cron didn't run. Admin visibility should target those two, before they matter — not the symptom afterwards.
3. **"Zakończ kolejkę" validation gets simpler.** Lineup completeness is guaranteed by the system, so completing a gameweek only needs to validate one thing: goals entered for every starting player. One check instead of two.

The Panel and Kolejka designs below assume this.

### 2.1 Kill the global admin

Delete the global pages (`/admin/results`, `/admin/gameweeks`, `/admin/players`, `/admin/squads`, `/admin/table`, `/admin/users`) and the unused `AdminLayout.tsx`. Keep `/admin/migration` only if you still use it, and hide it behind a direct URL rather than any menu. Entering admin goes: if you administer one league → straight into that league's admin; if more than one → a simple league picker. Nothing else lives at the global level.

### 2.2 New structure: three zones

**Zone 1 — Panel (admin home, the new landing page).**
Replaces today's Overview dumping ground. One screen answering "what's the state of my league and what's my next action":

- **Current gameweek card** with the pipeline state (Nadchodząca → Składy otwarte → Zablokowana → Wpisywanie wyników → Zakończona) and one primary button that matches the state — e.g. when locked: "Wpisz wyniki".
- **Lineup status**: before lock — "13/16 wybrało skład, 3 zagra żelazkiem" with names, so you can nudge people on WhatsApp if you want to (informational, not a fire alarm — nobody will be blank either way). After lock — confirmation that all 16 lineups exist, with żelazko ones marked.
- **System health warnings** (only shown when something is wrong): a manager's default lineup became invalid after a transfer; or the gameweek is locked but someone still has no lineup — which can only mean the cron failed, so surface it loudly with a "Zastosuj żelazka teraz" button that triggers the same logic manually.
- **Cup status line** if a cup round runs this week.
- Small links to recent results and current table — read-only, no edit buttons here.

**Zone 2 — Kolejka (the weekly flow, your workhorse).**
One guided page per gameweek, replacing today's Results + admin Lineups pages as separate destinations:

- Gameweek selector defaulting to the active one.
- Tab 1 **Składy**: read-only review of everyone's lineup for that week, żelazko-applied ones visually marked (the existing underline). A small "Popraw" (correct) action per manager for genuine mistakes — an exception tool, not a workflow step. The old AdminLineupsManager "create lineup" flow is retired.
- Tab 2 **Wyniki Ligi**: goal entry per match, as today, but with a progress indicator ("goals entered for 14/16 players").
- Tab 3 **Wyniki Pucharu** (only when a cup round exists that week): cup goals, ET, penalties.
- **"Zakończ kolejkę"** as an explicit, prominent action that *validates first*: refuses (with a clear list of what's missing) if any starting player has no goals entry. Lineup completeness needs no check — the mandate guarantees it. Completing recalculates standings. Replaces the silent dropdown.

This turns your 30-times-a-season chore into: open Kolejka → tabs left to right → big green button.

**Zone 3 — Konfiguracja (setup & maintenance, visually secondary).**
A collapsed/secondary sidebar group for everything you touch rarely:

- **Menedżerowie** (the *only* place to add/remove managers — remove it from the old Overview).
- **Zawodnicy** — with Import and Transfery as sub-actions here.
- **Terminarz i kolejki** — merge today's "Kolejki" (edit dates) and schedule generation into one page: calendar setup, generate schedule (button disabled once a schedule exists), edit individual gameweek dates. Deleting a schedule requires typing the league name.
- **Puchar** — cup creation, group draw, cup schedule, knockout draw (setup only; weekly cup results live in Kolejka). Fold `cup-lineups` in here as a sub-page, or better, into Kolejka's cup tab.
- **Ustawienia** — league name, Excel export, season archive, and a danger zone (delete league) at the very bottom with type-to-confirm.

### 2.3 New sidebar (7 items instead of 9 + hidden hubs)

```
Panel
Kolejka
─ Konfiguracja ─
Menedżerowie
Zawodnicy
Terminarz
Puchar
Ustawienia
─
Powrót do gry
```

One "Powrót" with one meaning. The top nav in admin mode stays minimal: logo, league name badge, user menu — no morphing player-menu hybrid.

### 2.4 Cross-cutting rules

- **Polish everywhere** in the UI. One pass over all admin strings.
- **Destructive actions** (delete schedule, delete league, reset draft): red, at the bottom of their page, type-to-confirm. Never on a landing page.
- **State drives buttons**: don't show "Generuj terminarz" when one exists; don't allow "Zakończ kolejkę" before goals are complete; grey out result entry for unlocked gameweeks.
- **Every page states its scope**: league name always visible in the header, so a multi-league future stays safe.

---

## Part 3: Migration order (what to do first)

Sequenced so each step is independently shippable and low-risk for your 16 live users:

0. ~~**Default lineup mandate**~~ — **done.** Deployed and live; the steps below build on it.
1. **Cleanup (no visible change):** delete orphaned global pages, `AdminLayout.tsx`, backup files, stray `node_modules 2` / duplicate lockfiles; remove the global "Wyniki" link from the top nav. Lowest risk, biggest clarity gain for future Claude Code sessions.
2. **New sidebar + Konfiguracja grouping:** pure navigation change, all existing pages keep working underneath.
3. **Panel (admin home):** new read-only dashboard replacing Overview as landing page, including the żelazko/lineup status card and the two system-health warnings (invalid defaults, cron failure + manual "Zastosuj żelazka" fallback); move manager management fully to Menedżerowie; move export/rename to Ustawienia.
4. **Kolejka flow:** merge lineup review + results + cup results into the tabbed gameweek page; retire the old admin lineup-creation flow, keep a per-manager "Popraw" correction; add validated "Zakończ kolejkę". This is the biggest piece — do it last, after 1–3 have simplified the terrain.
5. **Polish-language pass + guardrails** on destructive actions.

---

## Open questions (answer before building)

1. **Multi-league:** do you realistically run more than one league at a time? If it's always one, the league picker can disappear entirely and admin becomes even flatter.
2. **"Transfery" page:** is `/players/draft` used for the live draft, mid-season transfers, or both? Its final home in Konfiguracja depends on that.
3. **Migration page:** still needed, or a relic from a past data move?
4. **Post-lock corrections:** the mandate removed the need for admin lineup *creation*; what remains is corrections. Should "Popraw" work only between lock and gameweek completion, or also allow reopening a completed gameweek (which would need to recalculate results and standings)? The first is much simpler and probably enough.

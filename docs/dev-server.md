# Dev server

```bash
npm run dev
```

Runs `scripts/auto-cleanup.js` (frees port 3000, clears stale `.next` lock and
build state) and then `next dev --turbo` on http://localhost:3000.

## History

This file used to describe a "V2 5-layer defence system" — a process manager
with a PID registry, an atomic lock manager, a health monitor that restarted the
server on memory growth or CPU spikes, a live dashboard, and a macOS launchd
watchdog. That machinery existed to work around dev-server instability on older
Next.js versions.

It was removed in the August 2026 cleanup. Next 16 with Turbopack does not
exhibit the failure it was built for, and auto-restart-on-memory-growth is the
kind of behaviour that turns a simple problem into a confusing one. What
remains is a pre-flight cleanup and a manual escape hatch, which covers the
failure that actually happens: a wedged port 3000.

## When the server misbehaves

Escalate in this order:

```bash
npm run kill:dev
```

Kills whatever holds port 3000. Fixes `EADDRINUSE`.

```bash
npm run kill:all
```

Broader kill: Next processes, ports, caches and lock files.

```bash
npm run dev:emergency
```

Last resort. Kills Node processes, frees ports, resets `.dev-server` state.
`npm run dev:force` does this and then starts the server.

```bash
npm run clean
```

Emergency cleanup plus `rm -rf node_modules/.cache`.

## Do not build while dev is running

`npm run build` and a running `npm run dev` both write `.next`. Running the
build (or deleting `.next`) while the dev server is live wedges it, and the
symptom — a server that responds but serves stale or broken output — looks
like an application bug. Stop the dev server first.

## iCloud

The project currently lives inside iCloud Drive. That is the source of the
`node_modules 2` symlink, `.nosync` suffixes and `... (1).xlsx` conflict copies
that the cleanup removed. iCloud and `node_modules` interact badly: phantom file
changes, slow builds, duplicate files. Moving the checkout to a non-synced
location (e.g. `~/Developer`) removes a whole class of confusing failures.

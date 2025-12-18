# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Commands

- Setup
  - Use Node from `.nvmrc` / `.node-version` (engines: Node 25.2.1).
  - Install deps: `npm install` (CI/build uses `npm ci`).
- Local dev server
  - Start: `npm run dev` (alias of `node server.js`).
  - Open: http://localhost:3000 (configurable via `PORT`, default 3000).
- Build assets
  - `npm run build` (copies `index.html`, `about.html`, `styles.css`, `script-api.js`, `microsoftoutlook.svg` into `public/`).
- Production start
  - `npm start` (runs `node server.js`).
- Linting/formatting
  - Not configured.
- Tests
  - Not configured. `npm test` intentionally exits with an error; single-test runs are not available.
- Deploy (Render.com)
  - See `render.yaml`. Build: `npm ci`; Start: `node server.js`; Health check: `/api/health`.

## High-level architecture

- Runtime and packaging
  - ESM project (`"type": "module"`). Primary entry is `server.js`; `index.js` imports `./server.js` as a deployment fallback.
  - Key deps: `express` (HTTP/API), `@mikkelscheike/email-provider-links` (email provider detection), `simple-icons` (SVG icons). `esbuild` is present as a devDependency but not used in scripts.

- Server (Express) — `server.js`
  - Static files: `app.use(express.static(__dirname))` serves repository-root assets (e.g., `index.html`, `styles.css`, `script-api.js`).
  - API endpoints
    - `POST /api/detect-provider` — calls `getEmailProvider(email, timeout)` from `@mikkelscheike/email-provider-links`, measures detection time, and returns the library result plus a `_meta` block `{ detectionTime, timestamp, libraryVersion }`.
    - `GET /api/icon/:iconName` — returns SVGs. Uses a custom `microsoftoutlook.svg` when iconName is `outlook`/`microsoft`; otherwise maps common names to `simple-icons`. Optional `?color=RRGGBB`. Responses are cached (`Cache-Control: public, max-age=86400`).
    - `GET /api/health` — simple health probe used by Render.
  - Page route: `GET /` sends `index.html`.
  - Port: `PORT` env var or `3000`.

- Frontend (no framework)
  - Document — `index.html`: signup form UI, loads `styles.css` and `script-api.js`.
  - Behavior — `script-api.js`:
    - Reads the email input and calls `POST /api/detect-provider`.
    - Renders provider details (including detection method and timing) and provides an “Open inbox” button using the returned `loginUrl` when available.
    - Fetches provider icons via `GET /api/icon/:iconName` with emoji fallbacks.
    - Handles loading/disabled button states and toggles a “raw response” block.
  - Styling — `styles.css`: layout and component styles for the demo UI.

- Build and deploy
  - Build step copies selected assets to `public/` for static hosting scenarios; the Express server serves directly from the repo root in dev/production.
  - Render configuration in `render.yaml` defines environment, commands, and health check.

## Important project files

- `package.json` — scripts, dependencies, Node engine.
- `server.js` — Express app and API.
- `index.html`, `styles.css`, `script-api.js` — demo UI.
- `render.yaml` — Render.com service config.
- `microsoftoutlook.svg` — custom Outlook icon used by the icon API.

## Notes for agents

- There is no lint/test tooling configured. If you introduce linting or tests, update `package.json` scripts and this file accordingly.
- The server serves static files from the repository root; if you change asset locations, adjust `express.static(...)` and the build script.
- The icon endpoint relies on a name mapping; add to `iconMap` in `server.js` when supporting new providers.

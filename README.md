# Don’t Break the Chain

A one-screen browser game: infer the hidden pattern, choose the next term before the clock runs out, and build the longest chain you can. All gameplay and the personal best stay in the browser; there is no game API or account.

## Run locally

```bash
npm install
npm run dev -- --hostname 0.0.0.0
```

Open `http://localhost:3000`. Use touch or a pointer to choose a tile, or press **A–D**. A wrong answer or timeout ends the run. The best chain is saved at `dbc.bestChain.v1` in localStorage, with an in-memory fallback if storage is blocked.

## Checks

```bash
npm test
npm run typecheck
npm run lint
npm run build
npx playwright install chromium
npm run test:e2e
```

The browser tests expect the dev server at `http://localhost:3000` (or set `BASE_URL`). They exercise desktop and 375px mobile flows, keyboard input, replay, best-score persistence, timeout, and horizontal overflow.

## Deployment and tuning

`npm run build` writes a **static export** to `out/`. Serve that folder over HTTPS; no Next.js server, API routes, or database are needed. The five time limits are `12/10/8/6/4` seconds, and the family rotates after every three correct answers. Those defaults and the curated higher-tier puzzles should be reviewed with players before launch, especially color/size cues and advanced distractors.

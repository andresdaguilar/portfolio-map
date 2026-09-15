<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## This project

A playable 2.5D portfolio in the visual language of *Inside* (Playdead).
`/` is the game; `/cv` is a static, no-JavaScript fallback with the same content.

### Rules

- **All visitor-facing copy lives in `src/content/`.** The game and `/cv` are two
  renderers over one typed content layer. Nothing under `src/game/` may hardcode
  a company name, a date, or a sentence of prose.
- **The simulation is pure.** `src/game/player/body.ts` and
  `src/game/core/collision.ts` have no DOM or three.js dependency, which is why
  they can be tested directly. Keep it that way.
- **Hot state is not React state.** `input`, `player` and the camera are plain
  module objects read every frame; routing them through React would re-render
  the tree at simulation rate.
- **Every ladder needs a hatch** in any floor it passes through, or the climber
  jams silently at `floorY - playerHeight`. `findLadderTraps()` in
  `src/game/world/validate.ts` checks this; run it against every new zone.

### Commands

```bash
npm run dev     # port 3100 — 3000 is usually taken by another project
npm test        # vitest: physics, level validation, camera framing
npm run build
```

### Look

The counter-intuitive part: the **background is the lightest thing on screen**
and everything near the camera is nearly black. Silhouettes only read against
lit haze. `DEPTH.haze` sits far enough back that linear fog has consumed it
entirely, so it renders as flat fog colour — that plane is the light source of
every composition. Moving it closer, or darkening `PALETTE.haze`, collapses the
frame to black on black.

# AGENTS.md

## Cursor Cloud specific instructions

This is a **Next.js 16 (App Router)** wedding invitation single-page web app using TypeScript, styled-components, Tailwind CSS, and Framer Motion. No database, no Docker, no monorepo.

### Quick reference

| Action | Command |
|---|---|
| Install deps | `npm install` |
| Dev server | `npm run dev` (Turbopack, port 3000) |
| Build | `npm run build` |
| Type check | `npx tsc --noEmit` |

### Linting

`npm run lint` runs ESLint with flat config (`eslint.config.mjs`). `npx tsc --noEmit` runs the TypeScript type checker.

### Environment variables

All external API keys (AMAP, Naver Map, Slack webhook) are **optional**. The app runs fully without them; only the embedded map and Slack RSVP notifications will be absent. See the README for full details on `.env.local` keys.

### Configuration

All wedding content (text, images, dates, venue, accounts) is configured in `src/config/wedding-config.ts`. No separate CMS or database.

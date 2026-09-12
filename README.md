# ChaosGachaPlus

A community-driven, web-based expansion of [**Chaos Gacha**](https://github.com/Bronzdeck/ChaosGacha) by **Bronzdeck** — a weighted random-rarity gacha for writing prompts, character builds and story ideas, covering abilities, items, familiars, traits and skills.

The original Chaos Gacha is a Python/Tkinter desktop app. ChaosGachaPlus keeps its rarity/weighting logic and all of its original content, and rebuilds it as a responsive web app (desktop, tablet, mobile) with a layer of tools for actually using it to write stories: Stories, Characters, Tickets, pull history, an item inventory, and a personal customization layer on top of the shared entry pool.

This project is free, open source, and non-commercial. It exists purely to expand on an idea we like.

## Credit

All original gacha content (abilities, items, familiars, traits, skills and their rarities/descriptions) and the core rarity-weighting algorithm were created by **Bronzdeck** for the original [Chaos Gacha](https://github.com/Bronzdeck/ChaosGacha) ([Patreon](https://patreon.com/BronzDeck)). ChaosGachaPlus is an unofficial, derivative work, shared under the same license with Bronzdeck's blessing to modify and redistribute. Please support the original if you can.

## Status

Early work in progress. Currently implemented:

- Monorepo scaffold (React/TypeScript frontend, Node/TypeScript/Fastify backend, PostgreSQL via Prisma).
- Account system (email/password).
- The original roll algorithm, tier system, and `gachafiles/*.txt` content, ported to TypeScript and covered by unit tests.

Not built yet: Stories/Characters/Tickets, the pull flow (reroll, advantage pulls, batch rolls), item inventory, per-user pool customization, and history views. See open issues/PRs for progress.

## Project structure

```
apps/
  web/               React + TypeScript frontend (Vite)
  api/                Node + TypeScript backend (Fastify + Prisma)
packages/
  shared/             Shared types and the ported gacha engine (pure, unit-tested)
data/
  gachafiles/         Original gacha content (source of truth, seeded into the database)
```

## Getting started

Requirements: Node.js 20+, npm, and a PostgreSQL database (a free [Neon](https://neon.tech) project works well for development).

```bash
npm install
```

Copy the env templates and fill in your own values:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

At minimum, set `DATABASE_URL` in `apps/api/.env` to your PostgreSQL connection string, and generate a random `JWT_SECRET`.

Set up the database and seed it with the original gacha content:

```bash
cd apps/api
npx prisma migrate dev
npm run seed
```

Run both apps in development (from the repo root, in separate terminals):

```bash
npm run dev:api
npm run dev:web
```

The web app runs at `http://localhost:5173` and proxies API calls to the backend at `http://localhost:4000`.

### Tests

```bash
npm run test --workspace packages/shared
```

## License

GPL-3.0, same as the original Chaos Gacha. See [LICENSE](LICENSE).

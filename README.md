# ChaosGachaPlus

A community-driven, web-based expansion of [**Chaos Gacha**](https://github.com/Bronzdeck/ChaosGacha) by **Bronzdeck** — a weighted random-rarity gacha for writing prompts, character builds and story ideas, covering abilities, items, familiars, traits and skills.

The original Chaos Gacha is a Python/Tkinter desktop app. ChaosGachaPlus keeps its rarity/weighting logic and all of its original content, and rebuilds it as a responsive web app (desktop, tablet, mobile) with a layer of tools for actually using it to write stories: Stories, Characters, Tickets, pull history, an item inventory, and a personal customization layer on top of the shared entry pool.

This project is free, open source, and non-commercial. It exists purely to expand on an idea we like.

## Credit

All original gacha content (abilities, items, familiars, traits, skills and their rarities/descriptions) and the core rarity-weighting algorithm were created by **Bronzdeck** for the original [Chaos Gacha](https://github.com/Bronzdeck/ChaosGacha) ([Patreon](https://patreon.com/BronzDeck)). ChaosGachaPlus is an unofficial, derivative work, shared under the same license. Please support the original if you can.

## Status

Core feature set is implemented:

- Account system (email/password), Stories, Characters and Tickets (feat earned, category, rarity preset or custom range, advantage flag).
- The original roll algorithm, tier system, and `gachafiles/*.txt` content, ported to TypeScript and covered by unit tests.
- A propose -> reroll -> commit pull flow: rolling a ticket previews a result (or two, for an advantage ticket, letting you pick one) that isn't saved to history until you confirm it - so a roll that would derail your story can just be rerolled instead. Multiple tickets can be rolled and confirmed together in one batch.
- An item inventory: item-category pulls are automatically added to the character's inventory, and items can be sent to another character in the same Story.
- A private, per-account entry customization layer: exclude official entries from your pool, override an official entry's name/rarity/description for yourself, or add wholly custom entries - scoped to your whole account or to a single Story.
- A history log (per Character and per Story) recording tickets earned, pulls, item transfers, and entry customizations.

Not built yet: content filters (PG mode / classic familiars / no scifi, present in the original app), and further UI polish. See open issues/PRs for progress.

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

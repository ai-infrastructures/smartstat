# SmartStat AI

White-label indoor navigation app for hospitals.

End users (patients, visitors, couriers) search for a department or room inside a hospital and are guided turn-by-turn from their current location to the destination using a 2D map (with optional voice guidance and wheelchair-accessible routing).

## Status

🚧 V0 — Project bootstrap. See `/docs` for product strategy and scope.

## Repository structure

```
.
├── apps/
│   ├── mobile/      # React Native + Expo (end-user app + scanner role)
│   └── admin/       # Next.js admin dashboard (hospital staff)
├── packages/
│   └── shared/      # Shared TypeScript types and Supabase client
├── tenants/         # Per-tenant build configs for white-label apps
├── supabase/        # SQL migrations
├── docs/            # Master plan, V1 scope, risk analysis, HIPAA
├── package.json     # Root workspace
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── README.md
```

## White-label model

SmartStat AI ships two flavors of the mobile app from a single codebase:

1. **Directory build** — generic "SmartStat AI" app with a hospital
   selector. Used for demos, internal testing, and aggregator scenarios.
   Build with `SMARTSTAT_TENANT_SLUG` unset.

2. **Tenant-locked build** — fully branded app dedicated to a single
   client. Skips the hospital list and opens straight into that client's
   experience. Built with `SMARTSTAT_TENANT_SLUG=<slug>`, which picks
   up the matching `tenants/<slug>/config.json`.

The backend, database schema, and admin dashboard are **identical** across
both modes. Multi-tenancy is enforced at the row level by Postgres RLS.

See [`tenants/README.md`](tenants/README.md) for how to onboard a new
client and produce their branded build.

## Prerequisites

- Node.js ≥ 20
- pnpm ≥ 11
- Git
- Expo Go app (iOS/Android) for mobile testing

## Quick start

```bash
# Install dependencies
pnpm install

# Run admin dashboard (web) → http://localhost:3000
pnpm dev:admin

# Run mobile app — directory mode (hospital selector)
pnpm dev:mobile

# Run mobile app — tenant-locked preview for a specific client
pnpm --filter @smartstat/mobile start:demo       # Demo Hospital
pnpm --filter @smartstat/mobile start:memorial   # Memorial Hospital

# Build a tenant's branded TestFlight / Internal Testing binary
pnpm --filter @smartstat/mobile build:memorial:preview
```

## Docs

- [`docs/MASTER_PLAN.md`](docs/MASTER_PLAN.md) — full master plan
- [`docs/V1_SCOPE.md`](docs/V1_SCOPE.md) — V1 scope (frozen)
- [`docs/RISK_ANALYSIS.md`](docs/RISK_ANALYSIS.md) — risk analysis + solutions + HIPAA
- [`docs/QUESTIONS_TO_START.md`](docs/QUESTIONS_TO_START.md) — open questions

## License

Proprietary. © SmartStat AI.

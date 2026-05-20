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
├── docs/            # Master plan, V1 scope, risk analysis, HIPAA
├── package.json     # Root workspace
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── README.md
```

## Prerequisites

- Node.js ≥ 20
- pnpm ≥ 11
- Git
- Expo Go app (iOS/Android) for mobile testing

## Quick start

```bash
# Install dependencies
pnpm install

# Run admin dashboard (web)
pnpm dev:admin

# Run mobile app (Expo)
pnpm dev:mobile
```

## Docs

- [`docs/MASTER_PLAN.md`](docs/MASTER_PLAN.md) — full master plan
- [`docs/V1_SCOPE.md`](docs/V1_SCOPE.md) — V1 scope (frozen)
- [`docs/RISK_ANALYSIS.md`](docs/RISK_ANALYSIS.md) — risk analysis + solutions + HIPAA
- [`docs/QUESTIONS_TO_START.md`](docs/QUESTIONS_TO_START.md) — open questions

## License

Proprietary. © SmartStat AI.

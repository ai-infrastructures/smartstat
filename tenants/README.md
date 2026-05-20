# SmartStat AI — Per-tenant build configs

Each subfolder here represents a client (hospital) that has commissioned a
**dedicated branded mobile app** from the same codebase.

When the mobile app is built with `SMARTSTAT_TENANT_SLUG=<slug>`, the
config in `tenants/<slug>/config.json` is injected into Expo's app config
at build time. The resulting binary:

- Has its own name, icon, splash, bundle identifier (iOS) and package name (Android)
- Skips the hospital selector at launch and opens directly on its tenant
- Carries the tenant id baked in (no runtime hospital picking)
- Uses its own brand colors throughout

The **same codebase** also produces a **directory build** when
`SMARTSTAT_TENANT_SLUG` is unset or set to `directory`. That build:

- Is the generic "SmartStat AI" app
- Shows the hospital selector list (any tenant the user can see)
- Useful for demos and internal testing

## Adding a new tenant

1. Copy `_template/` to `<your-slug>/`:
   ```bash
   cp -r tenants/_template tenants/memorial-hospital
   ```
2. Edit `tenants/<your-slug>/config.json`:
   - `slug` — must match the folder name and the row in `public.tenants.slug`
   - `tenantId` — the UUID from the `tenants` table
   - `appName` — what users see on their home screen and in the App Store
   - `bundleId` — must be globally unique, owned by SmartStat AI's Apple account
   - `androidPackage` — must be globally unique
   - `primaryColor` / `secondaryColor` — should match the row in the `tenants` table
3. Replace icon and splash in `tenants/<your-slug>/assets/`
4. Add a matching profile to `apps/mobile/eas.json`
5. Build:
   ```bash
   cd apps/mobile
   SMARTSTAT_TENANT_SLUG=<your-slug> eas build --profile <your-slug>-preview --platform ios
   SMARTSTAT_TENANT_SLUG=<your-slug> eas build --profile <your-slug>-preview --platform android
   ```

## File layout

```
tenants/
├── README.md             ← this file
├── _template/            ← starting point for new clients
│   ├── config.json
│   └── assets/
│       ├── icon.png      (1024×1024, no transparency)
│       ├── splash.png    (1284×2778, centered logo)
│       └── adaptive-icon.png  (1024×1024, safe zone 660px center)
├── demo-hospital/        ← demo tenant matching the seed data
└── memorial-hospital/    ← example real client
```

# SmartStat AI — V1 Scope (Frozen)

**Version:** 1.0
**Date:** 2026-05-20
**Status:** Frozen scope. Any change requires written change request and impact assessment.

---

## 1. Product Definition

SmartStat AI is a **white-label indoor navigation mobile app** for hospitals. End users (patients, visitors, couriers) search for a department, room, or service inside a hospital and are guided turn-by-turn from their current location to the destination using a 2D map.

The product ships as **three coordinated surfaces**:

1. **End-user mobile app** (iOS + Android, React Native + Expo) — what patients use.
2. **Scanner mobile app** (same codebase, role-gated) — used by hospital staff or SmartStat operators to capture floor maps via LiDAR (Polycam external app) and upload them.
3. **Admin web dashboard** (Next.js on Vercel) — used by hospital admin to manage POIs, branding, users, and analytics.

---

## 2. Target Market

- **Geography:** USA primary launch. HIPAA-compliant from day one.
- **Vertical:** Hospitals only in V1. Other verticals (hotels, malls, schools, airports) are post-V1.
- **Customer size:** medium hospitals (50–500 beds), private preferred for faster sales cycle.

---

## 3. V1 Features — IN SCOPE

### End-user app
- **Onboarding (3 screens max, skippable)**: welcome, permissions explanation, ready
- **Hospital selector** at app start (one app, multiple hospitals selectable)
- **Guest mode** (default, no account needed)
- **Optional minimal account creation** (email + password only) — hospitals can request user registration for tracking; no PHI stored
- **POI search** — fuzzy text search across all POI categories (department, clinic, room, counter, elevator, restroom, emergency exit, pharmacy)
- **Search synonyms** — admin-configurable (e.g., "ER" = "Emergency Room" = "Emergency Department")
- **Indoor positioning via QR + ARKit/ARCore** dead-reckoning, target accuracy 4–6 meters
- **2D map navigation** — top-down floor view with user dot, animated path overlay, turn-by-turn cues
- **Multi-floor support** — automatic floor switching (e.g., ground floor → elevator → 3rd floor)
- **Voice guidance (TTS)** — native iOS/Android text-to-speech, toggleable
- **Wheelchair-accessible routing** — toggle to avoid stairs, prefer elevators/ramps
- **Offline mode** — selected hospital's maps downloaded for offline use
- **Push notifications** — appointment reminders, navigation prompts (hospital-initiated, opt-in)
- **English only** (V1)

### Scanner role (same app, role-gated)
- Role-protected login (scanner operator credentials)
- Workflow: select hospital → select floor → import .glb/.obj from Polycam → upload → mark calibration QR positions → submit for admin review
- QR code generator (the app generates printable A5 sheets with unique anchor QRs for each calibration point)

### Admin web dashboard (Next.js on Vercel)
- Hospital admin login
- **Multi-tenant isolation** — each hospital sees only their own data
- **Building & floor management** — add building, add floors, view scan status
- **POI editor (V1 = drag & drop)** — place POIs on 2D floor plan, assign category, name, accessibility flags, opening hours
- **Branding configuration** — logo upload, primary/secondary colors, app display name, splash image
- **User management** — invite admin users for the hospital, role assignment
- **Basic analytics** — most-searched POIs, peak hours, average navigation duration (all aggregated/anonymized)
- **Audit log viewer** — admin actions log (required for HIPAA)

### Backend
- REST API (Node.js + Fastify) — abstracted, NOT direct client-to-Supabase
- **Postgres database** (Supabase Team for production with BAA, Supabase Pro for dev/staging)
- **File storage** — Cloudflare R2 for non-PHI assets (map meshes, branding images); AWS S3 with BAA for any PHI (likely none in V1)
- **Authentication** — Supabase Auth with JWT, MFA optional for admin
- **Encryption** — TLS 1.3 in transit, AES-256 at rest
- **Audit logging** — all admin write operations, 7-year retention
- **Daily encrypted backups** — automatic

### Distribution
- **iOS:** TestFlight build, ready for App Store submission post-pilot validation
- **Android:** Google Play Internal Testing track, APK available for sideload
- **No public store launch in V1** — per Matt's preference

### Compliance & Legal
- **HIPAA-compliant infrastructure** from day one (production environment)
- **BAA template** ready for hospital contracts
- **Privacy policy + ToS** drafted by US healthcare attorney
- **Notice of Privacy Practices** displayed in app
- **GDPR-ready** (for future EU expansion)
- **Accessibility:** WCAG 2.1 AA baseline, large fonts, high contrast mode, VoiceOver/TalkBack tested

---

## 4. V1 Features — OUT OF SCOPE (deferred to V1.5 / V2)

| Feature | Reason | Target version |
|---|---|---|
| AR overlay navigation (camera + arrows) | Stabilize 2D first | V1.5 |
| 3D map exploration | Performance + scope | V1.5 |
| Additional languages (IT, ES, FR, DE) | EN sufficient for USA launch | V1.5 |
| BLE beacon support (1–3m accuracy) | Hardware cost; QR+AR sufficient | V2 |
| Public store launch | Per Matt | V2 |
| Other verticals (hotels, malls, schools, airports) | Focus on hospitals | Post-V1 |
| POI editor with layers, schedules, advanced rules | V1 uses simple drag&drop | V2 |
| MatBot integration / voice assistant | Out of scope V1 confirmed | TBD |
| Blockchain map anchoring | Marketing dream, no technical need | TBD |
| Robot/drone integration | Visionary, no V1 requirement | TBD |
| Appointment integration with hospital systems (EHR) | Massive HIPAA scope expansion | V2+ |
| Patient health profile | Massive HIPAA scope expansion | Never (out of mission) |

---

## 5. Capacity Assumptions (Pilot Hospital)

- **1 hospital** as pilot tenant
- **Up to 10 floors** per building (worst case: 2 underground + ground + 7 above)
- **Up to 200 POIs** per floor
- **Up to 5,000 concurrent users** per hospital
- **Map size:** target ≤ 10 MB per floor after compression (mesh decimation + Draco)
- **Search latency:** < 200 ms p95
- **App launch time:** < 3 seconds cold start

---

## 6. Success Metrics — V1 GA Definition

V1 is considered successful when ALL of these are achieved:

- ✅ Mobile app installable via TestFlight (iOS) and Google Play Internal (Android)
- ✅ Admin dashboard deployed to Vercel and accessible at smartstat.app (or smartstat.vercel.app)
- ✅ At least 1 pilot hospital fully onboarded with complete map (≥1 floor) and ≥20 POIs
- ✅ ≥ 10 real end users complete navigation A→B with ≥ 90% success rate (arrive at correct destination)
- ✅ Average positioning accuracy ≤ 6 meters in test routes
- ✅ Crash-free session rate > 99% (Sentry monitored)
- ✅ HIPAA BAA signed with pilot hospital
- ✅ Privacy policy + ToS published and accepted in app
- ✅ Average floor scan + POI setup time ≤ 2 hours by a single trained operator
- ✅ Voice guidance functional in English
- ✅ Wheelchair-accessible routing tested and functional
- ✅ Offline mode tested (full navigation with airplane mode after map download)

---

## 7. Timeline (16 weeks total)

| Phase | Weeks | Key milestone |
|---|---|---|
| Sprint 0 — Setup & risk de-risking | W1 | Repo, accounts, AR + QR prototype on 1 small floor |
| Phase A — PoC end-to-end | W2–W4 | Demo 1 to Matt: end user navigates A→B on test floor |
| Phase B — Multi-tenant + admin | W5–W7 | Hospital tenant, admin dashboard, branding configurable |
| Phase C — Production features | W8–W10 | Voice, wheelchair, offline, push, search synonyms — Demo 2 to Matt |
| Phase D — HIPAA + distribution | W11–W12 | HIPAA infra migration, audit logs, TestFlight build, privacy policy |
| Phase E — Pilot hospital | W13–W14 | Real pilot deployment, scan all floors, real users test |
| Phase F — Hardening | W15–W16 | Bug fixes, performance, V1 GA |

---

## 8. Roles (current confirmed team)

- **Product owner / strategist:** Stefano (Fluence)
- **Development & technical execution:** Claude + Stefano oversight
- **Matt:** business owner of SmartStat AI, customer-facing, hospital relationships
- **Marketing/landing:** Guglielmo (Fluence), starting W6

---

## 9. Tech Stack — Confirmed

| Layer | Choice |
|---|---|
| Mobile | React Native + Expo SDK 51+ |
| Mobile build & distribution | EAS Build, TestFlight, Google Play Internal |
| 3D / map rendering (2D top-down V1) | react-native-skia or react-native-svg (V1, lightweight) |
| Pathfinding | ngraph.path (A*) |
| AR (V1.5+) | @viro-community/react-viro |
| LiDAR capture | External: Polycam app (free tier + Pro for export formats) |
| Admin web | Next.js 14 + Tailwind + shadcn/ui |
| Backend API | Node.js 20 + Fastify (typed with TypeScript) |
| Database | Postgres 16 (Supabase Pro dev, Supabase Team prod with BAA) |
| File storage | Cloudflare R2 (non-PHI assets); AWS S3 with BAA (if any PHI) |
| Auth | Supabase Auth (email/password) + JWT |
| Push notifications | Expo Notifications + APNs/FCM |
| TTS / voice | Native iOS AVSpeechSynthesizer + Android TextToSpeech |
| Error tracking | Sentry (Business plan + BAA addon for production) |
| Analytics | PostHog self-hosted (no PII / no PHI) |
| Repo & CI | GitHub + GitHub Actions |
| Web hosting | Vercel (admin dashboard + landing) |
| Secrets vault | 1Password Teams |
| Project mgmt | TaskCreate/TaskList in this workspace + Notion mirror for Matt |

---

## 10. Change Management

Any change to this document requires:

1. Written change request (description, motivation)
2. Impact assessment (timeline, cost, scope shifts)
3. Sign-off from Stefano (and Matt for material changes)
4. Document version bump

Out-of-scope V1 work is automatically deferred unless promoted via the above process.

---

**Frozen by:** Stefano
**Frozen on:** 2026-05-20

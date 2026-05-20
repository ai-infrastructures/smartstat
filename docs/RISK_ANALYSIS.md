# SmartStat AI — Risk Analysis & Solutions

**Version:** 2.0 (updated with solutions)
**Date:** 2026-05-20
**Scope:** every possible problem mapped, with a concrete solution for each.

> **Project language note:** project documents going forward are in English (USA launch). Previous Italian content preserved below as v1 reference; new solution sections in English.

---

## 0. CONFIDENCE STATEMENT

**Can SmartStat AI V1 be built and delivered? YES — with high confidence.**

The technology is mature, the building blocks all exist, and we have concrete, tested solutions for every red-flag risk identified in v1. The two areas requiring active attention from day one are:

1. **Indoor positioning accuracy** — solved by QR-anchored AR (see §1.1 solution)
2. **HIPAA compliance for USA launch** — solved by guest-first architecture + HIPAA-eligible hosting (see §10 new chapter)

The "we cannot do it" scenarios are NOT technical — they are operational (team disappears like G, scope creeps uncontrolled, budget runs out). Those are managed by process, contracts, and discipline.

---

## SOLUTIONS — TOP 10 RISKS

### S1. Indoor positioning insufficiently precise (🔴)

**Layered solution stack, V1 target accuracy: 4–6 meters**

1. **Visual QR fiducial markers** — printed A5 stickers placed at fixed coordinates throughout the building (entrance, near elevators, every ~25m along main corridors, at intersections). Each QR encodes a unique anchor ID. Scanning a QR resets the position to a known exact point. Cost per hospital: ~$50 in printing.
2. **ARKit/ARCore visual-inertial odometry** — between QR checkpoints, the phone's camera + IMU track relative motion. Reliable for ~30–60 seconds before drift accumulates.
3. **ARWorldMap persistence (iOS)** — pre-computed visual map of the floor; phone relocates by recognizing visual features even without QR. Stored per floor, downloaded on demand.
4. **Step counter dead-reckoning fallback** — pedometer + magnetometer continue rough tracking even if AR loses tracking.
5. **Honest UX** — confidence indicator (green/yellow/red) visible to user. When red: "Scan the nearest QR to recalibrate."
6. **V2 upgrade path** — BLE beacons ($8–15/each, ~30 per floor) for premium tier achieving 1–3m accuracy without QR.

**Verification:** prototype this stack first in W1–W3 on a small office floor before scaling.

### S2. "G episode" replay — developer disappears (🔴)

**Anti-bus-factor process from day one**

- **Two-person rule:** every component touched by at least 2 people. No single owner of critical code.
- **Daily commits to shared repo** — visible in GitHub. No "I have it locally."
- **Mandatory code review** before merging anything to `main`.
- **Architecture Decision Records (ADRs)** — every non-trivial choice documented in `/docs/adr/` with rationale.
- **Notion workspace** with: runbook, glossary, infra credentials index (not secrets — pointers), decision log.
- **1Password Teams vault** shared — every credential, API key, account login backed up.
- **Weekly Loom knowledge transfer** — recorded explanations of what was built, available forever.
- **Github org owned by Matt (Smartstat AI)** — even if Fluence walks, Matt has the code.

### S3. Budget — user said "don't worry" (covered by Matt) (🔴 → resolved)

User-managed. No action required from technical side. Track scope creep separately via S9.

### S4. Matt's low trust threshold after MatBot (🔴)

**Proactive communication regime**

- **Weekly Loom video update** every Friday, 5 minutes max, showing concrete progress.
- **Live demos at W4 (PoC) and W10 (MVP)** — these are the trust-rebuilding moments. They must impress.
- **Async-first decisions:** we propose A/B/C with our recommendation, Matt picks. No "what should we do?" open questions.
- **Transparent issue reporting** — we surface problems before they explode. Matt's pet peeve is hidden problems (G blamed equipment, blamed tokens, lied).
- **Underpromise + overdeliver** — never quote a timeline we haven't already privately exceeded.
- **48h response SLA** — if Matt is silent for 48h on a decision, we proceed with our default; documented in Notion.

### S5. GDPR + HIPAA compliance (🔴)

**Privacy-by-design architecture (see also §10 dedicated chapter)**

- **Default guest mode** — no PII collected, no PHI possible.
- **Optional login = bare minimum data** — email, hashed password, role. NO health profile, NO appointment data.
- **Search queries decoupled from identity** — even when logged in, search analytics are aggregated/anonymized at write time (not "user X searched cardiology", but "+1 search for cardiology at hospital Y at hour Z").
- **Encryption at rest** (Postgres TDE) **and in transit** (TLS 1.3 everywhere).
- **HIPAA-eligible hosting from day one for production** — Supabase Team ($599/mo with BAA) or AWS HIPAA-eligible stack.
- **BAA template** ready to sign with each hospital before deployment.
- **GDPR DPA template** ready for EU expansion.
- **Audit logs** for every admin action (who changed which POI when).
- **Data residency** — US data stays in US regions; EU data in EU regions.
- **Right to erasure** API endpoint built-in.
- **Privacy policy + ToS** drafted by a US healthcare law attorney before launch (budget ~$2–4k).

### S6. UX for stressed/elderly users (🔴)

- **Large default fonts** — minimum 16pt body, 20pt for navigation cues, all scalable via OS settings.
- **Voice guidance (TTS) — included in V1** as user confirmed. Native iOS AVSpeechSynthesizer + Android TextToSpeech. No external API cost.
- **High-contrast mode toggle** + system-level dark mode support.
- **3-screen onboarding maximum**, skippable, with single primary action per screen.
- **Big touch targets** — minimum 44pt per Apple HIG, 48dp per Material.
- **Test with real elderly users** in pilot hospital before public launch.
- **No requirement to read maps** — voice + visual arrow + textual instruction ("In 10 meters, turn right at the Pharmacy sign") presented together.

### S7. Established competitors (Pointr, Mappedin, Situm, Apple/Google Indoor Maps) (🔴)

**Differentiation strategy**

- **Price point:** target medium/small hospitals (50–500 beds) — too small for enterprise vendors, underserved.
- **Speed of deployment:** LiDAR self-service via Polycam → setup in hours, not months (vs Mappedin's pro-services model).
- **Vertical depth:** purpose-built for healthcare workflows (search "Cardiology", "Emergency", "Radiology" with medical-aware synonyms).
- **White-label simplicity:** drop in logo + colors + map, deploy. No SDK integration headaches.
- **Wheelchair-first routing** included by default (V1 — confirmed).
- **HIPAA-compliant from day one** — most competitors aren't, this is a wedge in USA hospital sales.
- **DO NOT pitch "no one has done this"** — false and damages credibility. Pitch: "Existing solutions are expensive and slow to deploy. We're fast, affordable, healthcare-native."

### S8. Long hospital sales cycle (6–18 months) (🟠)

- **Free pilot strategy** — first 1–2 hospitals get a deeply discounted or free pilot in exchange for case study + testimonial.
- **Target private hospitals first** — faster decision, fewer procurement layers.
- **Parallel verticals** — once V1 stable, parallel pitch to non-healthcare verticals (no HIPAA, faster cycle): hotels, malls, airports. Generates cash while hospital deals close.
- **Land-and-expand within hospital networks** — one hospital → demo to whole hospital group.

### S9. Scope creep (🟠)

- **V1 scope frozen in a signed document** (see `V1_SCOPE.md`).
- **Change request process:** any addition requires (a) impact assessment, (b) timeline/cost quote, (c) Matt's written sign-off.
- **"Out of V1 scope" public list** in Notion — visible to everyone.
- **Roadmap discipline:** "yes, in V1.5/V2" is a valid answer.

### S10. Scanner onboarding is complex for non-technical hospital staff (🟠)

- **Turnkey first setup** — for the pilot and first 5 customers, SmartStat sends our own trained operator on-site (paid in setup fee).
- **Polycam tutorial sequence** — 4 video lessons (5 min each), embedded in scanner app.
- **Server-side QC pipeline** — automatic quality checks on uploaded scans (mesh density, coverage, hole detection). Bad scans rejected with feedback.
- **Admin web editor with guided wizard** — step-by-step POI placement: "place the entrance", "place elevators", "place restrooms", etc.
- **Phone support during first scan** — 30-minute scheduled video call for first-time scanners.

---

## 10. NEW: HIPAA & USA LAUNCH STRATEGY

(Triggered by user decision: launch in USA, HIPAA compliance required)

### 10.1 What is HIPAA actually requiring of us?

HIPAA applies to **Business Associates** (us, when contracted by Covered Entities = hospitals) handling **Protected Health Information (PHI)**.

**PHI definition (relevant to us):** any individually identifiable information that reveals or implies health condition. Examples:
- "User Mario Rossi is at Oncology department" → PHI (location implies condition)
- "Anonymous user searched 'cardiology'" → NOT PHI (no identity link)
- "User Mario Rossi has an account" + "appointment data" → PHI

### 10.2 Architecture decision — avoid PHI handling where possible

**Default V1 architecture:**
- Guest mode primary, no account needed to navigate
- Optional account = email + name + password only, NO appointment data, NO medical context
- Search queries logged anonymously and aggregated (no user_id linkage)
- Location traces stored only on-device, never uploaded
- Hospital admin dashboard: only stores building data + POI + branding (none of which is PHI)

**Result:** if we don't store PHI, we minimize HIPAA scope drastically. We still sign BAAs with hospitals (they require it), but our actual compliance burden is much lower.

### 10.3 HIPAA-eligible infrastructure

| Component | Choice | HIPAA-eligible? | Cost |
|---|---|---|---|
| Auth + DB (V0) | Supabase Pro | ❌ No BAA | $25/mo — for dev/staging only |
| Auth + DB (production) | Supabase Team | ✅ BAA on Team plan | $599/mo |
| Auth + DB (alt production) | AWS RDS Postgres | ✅ With BAA | ~$50–200/mo at scale |
| File storage (production) | AWS S3 with BAA | ✅ | Pay per GB |
| File storage (alt) | Cloudflare R2 | ⚠️ No BAA currently | Not for PHI; OK for non-PHI assets like map meshes |
| Mobile push (production) | AWS SNS with BAA, or APNS direct | ✅ | Low cost |
| Email transactional | Postmark with BAA, or AWS SES | ✅ | Low |
| Error tracking | Sentry with BAA (Business plan + addon) | ✅ | $80/mo + |
| Analytics | PostHog self-hosted (no PII) | ✅ if no PHI sent | Free (own infra) |

**Recommended production stack:** AWS HIPAA-eligible services (RDS Postgres + S3 + SNS) or Supabase Team. AWS gives more flexibility long-term; Supabase Team is faster to set up.

### 10.4 Required documents and processes

- **BAA template** for hospital contracts (drafted by attorney)
- **Notice of Privacy Practices** (Matt will need this in app)
- **Security Risk Assessment** annually
- **Incident response plan** documented
- **Employee training records** (anyone with PHI access trained)
- **Access logs** for all admin operations, 6+ years retention
- **Encryption verification** — TLS in transit, AES-256 at rest

### 10.5 Cost impact of HIPAA

Compared to non-HIPAA original plan:
- +$500–700/month infra (Supabase Team or AWS)
- +$3–5k one-shot legal (BAA template + privacy policy + risk assessment)
- +1–2 weeks engineering for audit logging + encryption verification
- +Annual security review ~$2–4k

Total HIPAA-related premium for V1: **~$8–12k one-shot + $600–800/month ongoing.**

---



---

## STRUTTURA

I problemi sono raggruppati in 8 aree:

1. Tecnici-core (posizionamento, AR, LiDAR)
2. Tecnici-infrastrutturali
3. Prodotto / UX
4. Business / Mercato
5. Legali / Compliance
6. Operativi / Team
7. Finanziari
8. Relazionali (con Matt, eredità MatBot)

Ogni problema ha: **gravità** (🔴 critico / 🟠 alto / 🟡 medio / 🟢 basso), **probabilità**, **impatto se accade**, **mitigazione**.

---

## 1. PROBLEMI TECNICI CORE

### 1.1 🔴 Indoor positioning insufficientemente preciso

- **Probabilità:** ALTA. È il problema #1 di tutta l'industria indoor navigation.
- **Impatto:** se l'utente vede la sua posizione "saltare" o sbagliare di 10m, l'app è inutile. Game over.
- **Cause:** GPS non funziona dentro edifici; ARKit/ARCore accumulano drift dopo 30–60 secondi di cammino; senza beacon hardware o Wi-Fi RTT non c'è ground truth.
- **Mitigazione:**
  - QR di calibrazione **densi** (ogni 20–30m, vicino svincoli, ascensori, ingressi reparto)
  - Visual relocalization (ARKit ARWorldMap salvato per piano)
  - Fallback "perso? scansiona il QR più vicino"
  - Test pilota su 1 piano vero PRIMA di vendere
  - Se non basta: BLE beacons opzionali per ospedali "premium tier"

### 1.2 🟠 LiDAR iPhone non abbastanza preciso per spazi grandi

- **Probabilità:** MEDIA. LiDAR iPhone è ottimo per stanze fino a ~5m, peggiora oltre.
- **Impatto:** corridoi lunghi 30m+ vengono scansionati male, planimetria sbagliata.
- **Mitigazione:**
  - Tecnica corretta: scansionare per segmenti sovrapposti, non in un solo passaggio
  - Polycam Pro fa lo stitching automatico
  - Per spazi enormi (atri di ospedali grandi): uso iPad Pro 12.9 (LiDAR migliore)
  - Per ospedali enormi (>10.000 mq): valutare scanner professionali (NavVis VLX, Leica BLK2GO) noleggiati al cliente premium

### 1.3 🟠 Drift AR durante navigazione

- **Probabilità:** ALTA su sessioni lunghe (>5 minuti di cammino).
- **Impatto:** la freccia indica direzione sbagliata, utente si perde.
- **Mitigazione:**
  - Re-localization periodica su QR fisici
  - Sensor fusion: gyroscope + magnetometer + step counter
  - UX honest: mostrare sempre "ultima calibrazione: 30 secondi fa" con colore (verde→giallo→rosso)

### 1.4 🟡 Performance rendering 3D su iPhone vecchi

- **Probabilità:** MEDIA su iPhone 11/12.
- **Impatto:** crash o lag, recensioni negative.
- **Mitigazione:**
  - Target dichiarato: iPhone 12+ / Android equivalente
  - LOD aggressivo, mesh decimation lato server
  - Fallback automatico a vista 2D top-down se device debole
  - Stress test su device più vecchio prima del lancio

### 1.5 🟡 Battery drain (AR + camera + GPS = batteria a secco)

- **Probabilità:** ALTA.
- **Impatto:** utente arriva all'appuntamento col telefono morto.
- **Mitigazione:**
  - Modalità "energy saver": disattiva AR, solo 2D + bussola
  - Avviso "navigazione richiede ~15% batteria, attiva risparmio?" all'avvio
  - Limitare framerate AR a 30fps (non 60)

### 1.6 🟡 Mappe 3D pesanti = download lento

- **Probabilità:** ALTA per piani complessi.
- **Impatto:** utente abbandona prima del download.
- **Mitigazione:**
  - Compressione draco per .glb (riduce 80%+)
  - CDN edge (Cloudflare R2 + cache)
  - Progressive loading: prima 2D, poi 3D opzionale
  - Mappa pre-caricabile via QR fuori dall'edificio

---

## 2. PROBLEMI TECNICI INFRASTRUTTURALI

### 2.1 🟠 Lock-in Supabase quando si scala

- **Probabilità:** MEDIA. Supabase è ottimo fino a un certo punto.
- **Impatto:** riscrittura quando si migra a self-hosted.
- **Mitigazione:**
  - Repository pattern fin dall'inizio: il client NON parla mai direttamente a Supabase, parla a un nostro API layer
  - Migrazione = swap del DB sotto, client invariato
  - Già pianificato nel master plan (Fase 1.5)

### 2.2 🟡 Costi storage esplodono se molti ospedali

- **Probabilità:** MEDIA a lungo termine.
- **Impatto:** mappa 3D di un piano = 50–200 MB. 100 ospedali × 5 piani × 100 MB = 50 GB. Gestibile, ma con accessi frequenti l'egress è la voce critica.
- **Mitigazione:**
  - Cloudflare R2 (zero egress fee) > AWS S3
  - Mesh decimation aggressivo per mobile (target <10 MB per piano)
  - Cache aggressiva client-side

### 2.3 🟡 Single point of failure su VPS Hetzner

- **Probabilità:** BASSA (Hetzner ha 99.9% uptime).
- **Impatto:** se cade, app inutilizzabile.
- **Mitigazione:**
  - V1.5+: 2 nodi + load balancer Hetzner (€5/mese)
  - Backup automatici Postgres giornalieri su S3
  - Modalità offline dell'app copre cadute brevi (utente già dentro ospedale ha mappa locale)

### 2.4 🟡 Migrazioni Postgres rischiose in produzione

- **Probabilità:** MEDIA (succede sempre, prima o poi).
- **Impatto:** downtime, perdita dati.
- **Mitigazione:**
  - Migrazioni versionate (Prisma migrate o Knex)
  - Sempre con rollback testato
  - Staging environment identico a prod

---

## 3. PROBLEMI PRODOTTO / UX

### 3.1 🔴 Utente medio in ospedale è stressato/anziano/in difficoltà

- **Probabilità:** CERTA. È il contesto d'uso.
- **Impatto:** se l'UX non è banale, l'app non viene usata.
- **Mitigazione:**
  - Font grandi di default
  - Voice guidance (TTS) opzionale ma raccomandata
  - Modalità "alto contrasto" e "ipovedente"
  - Onboarding di 3 schermate max, skippabile
  - Test usability con persone over 60 prima del lancio

### 3.2 🟠 Permessi richiesti spaventano (camera, fotocamera, posizione, AR)

- **Probabilità:** ALTA.
- **Impatto:** utente nega permessi e l'app non funziona.
- **Mitigazione:**
  - Pre-prompt spiegativo PRIMA del system prompt iOS/Android
  - Permessi richiesti just-in-time (camera solo quando attiva AR)
  - Modalità degraded "solo 2D" se utente nega AR

### 3.3 🟠 Onboarding scanner è complicato per personale non tecnico

- **Probabilità:** ALTA. Stiamo chiedendo a uno staff di scansionare un piano.
- **Impatto:** mappe pessime, esperienza utente pessima.
- **Mitigazione:**
  - Servizio chiavi in mano: SmartStat manda un operatore proprio per primo setup
  - Video tutorial integrato
  - QC pipeline lato server: rifiuta scan sotto soglia qualità
  - Editor POI desktop (Next.js dashboard) molto user-friendly

### 3.4 🟡 Multilingua mal gestita (i18n) genera bug

- **Probabilità:** MEDIA.
- **Impatto:** stringhe non tradotte, layout rotti.
- **Mitigazione:**
  - i18next dall'inizio, mai stringhe hardcoded
  - Pseudo-locale in dev (`fr-CA` di test che raddoppia le stringhe) per scoprire layout fragili

### 3.5 🟡 Ricerca POI con typo non funziona

- **Probabilità:** ALTA ("cardiologia" vs "cardio").
- **Impatto:** utente non trova il reparto.
- **Mitigazione:**
  - Ricerca fuzzy (Fuse.js client-side è sufficiente)
  - Sinonimi configurabili dall'admin ("pediatria" = "pediatrico")

### 3.6 🟡 Accessibilità wheelchair non considerata

- **Probabilità:** ALTA se rimandata.
- **Impatto:** percorso include scale, utente non può seguirlo.
- **Mitigazione:**
  - Tag `accessible: true/false` su ogni edge del grafo
  - Toggle "evita scale" nelle settings
  - Inserire in V1.5 a meno che pilot ospedale lo richieda subito

---

## 4. PROBLEMI BUSINESS / MERCATO

### 4.1 🔴 Concorrenti già consolidati (Pointr, Mappedin, Situm, Apple/Google Indoor Maps)

- **Probabilità:** CERTA, sono già lì.
- **Impatto:** sales cycle lungo, prezzo schiacciato.
- **Mitigazione:**
  - Differenziazione chiara: prezzo ospedali medi/piccoli + LiDAR self-service + verticale sanitario + white-label rapido
  - Non andare a vendere a ospedali enterprise top-tier in V1
  - Focus geografico Europa (i big sono più forti in USA)
  - **Va detto a Matt subito che la narrativa "nessuno l'ha fatto" è falsa**

### 4.2 🟠 Sales cycle ospedaliero è LUNGO (6–18 mesi)

- **Probabilità:** ALTA.
- **Impatto:** primo cash-in molto dopo del previsto.
- **Mitigazione:**
  - Pilot a costo ridotto (anche gratis) per case study
  - Targeting ospedali privati (decisione più rapida) prima dei pubblici
  - Estensione veloce a verticali con sales cycle più breve (hotel, mall) appena V1 stabile

### 4.3 🟠 Matt non ha realmente clienti pronti

- **Probabilità:** MEDIA. Lui dice di sì ma è da verificare.
- **Impatto:** sviluppiamo prodotto senza pilot reale = nessun feedback vero.
- **Mitigazione:**
  - Richiedere nome dell'ospedale pilota e contatto **prima** del kickoff
  - Pilot identificato entro W4 o si rivede tutto

### 4.4 🟡 Pricing al cliente non chiaro

- **Probabilità:** ALTA.
- **Impatto:** vendite improvvisate, sottoprezzo.
- **Mitigazione:**
  - Definire listino V1 (3 tier: Starter / Pro / Enterprise) entro W8
  - Calcolatore costi-per-ospedale interno

### 4.5 🟡 "White-label" promesso ma sottostimato

- **Probabilità:** ALTA.
- **Impatto:** ogni cliente vuole feature custom = code-fork hell.
- **Mitigazione:**
  - White-label V1 = SOLO logo + colori + nome. Niente feature custom per tenant.
  - Feature flags per upgrade futuri, mai branch per cliente
  - Contrattualizzare: "personalizzazioni oltre branding = quotate a parte"

---

## 5. PROBLEMI LEGALI / COMPLIANCE

### 5.1 🔴 GDPR e tracking posizione utente

- **Probabilità:** CERTA da gestire.
- **Impatto:** multe fino al 4% fatturato, blocco operativo in EU.
- **Mitigazione:**
  - Privacy by design: nessun dato di posizione salvato lato server senza consenso esplicito
  - Analytics anonimizzate (aggregate, no PII)
  - DPA con ogni ospedale cliente (data processor agreement)
  - Cookie/tracking consent screen all'avvio
  - Privacy policy redatta da avvocato EU (non template generato)
  - Audit GDPR formale prima del lancio commerciale

### 5.2 🟠 Mappa interna ospedale = dato sensibile in alcuni paesi

- **Probabilità:** MEDIA. Sicurezza ospedaliera potrebbe contestare ("mostriamo dove sono le rianimazioni a chiunque").
- **Impatto:** ospedale rifiuta scansione o richiede approvazioni interne lunghe.
- **Mitigazione:**
  - Possibilità di nascondere POI sensibili (uffici riservati, server room)
  - Mappa accessibile solo dentro l'app (no export pubblico)
  - Contratto include clausola NDA e responsabilità sicurezza in capo all'ospedale

### 5.3 🟠 IP ownership e contratto Smartstat AI ↔ Fluence

- **Probabilità:** ALTA che sia poco chiaro.
- **Impatto:** dispute future su chi possiede cosa.
- **Mitigazione:**
  - Contratto chiaro: codice = Matt/Smartstat AI, infrastruttura = gestita da Fluence
  - Repo Git di proprietà di Matt, Fluence accede come collaborator
  - Account Apple/Google/Supabase/Hetzner aperti a nome Smartstat AI da subito
  - Escrow del codice opzionale (per rassicurare Matt dopo trauma MatBot)

### 5.4 🟡 ToS app store (Apple/Google) e requisiti

- **Probabilità:** MEDIA.
- **Impatto:** rifiuto submission, ritardo lancio.
- **Mitigazione:**
  - Privacy nutrition label (Apple) compilata correttamente
  - Data Safety form (Google) compilato
  - No feature ingannevoli, no permessi richiesti che non si usano
  - Beta testing interno via TestFlight evita molti problemi (non serve review full)

### 5.5 🟡 Accessibility legal requirements (EU EAA 2025)

- **Probabilità:** ALTA per il 2025+ in EU.
- **Impatto:** non conformità = problemi legali in EU dal giugno 2025.
- **Mitigazione:**
  - WCAG 2.1 AA come baseline
  - Audit accessibilità prima del lancio commerciale
  - Screen reader compatibility testata

---

## 6. PROBLEMI OPERATIVI / TEAM

### 6.1 🔴 Replay del caso "G" (dev che sparisce)

- **Probabilità:** MEDIA. È già successo.
- **Impatto:** stesso disastro di MatBot.
- **Mitigazione:**
  - **Mai un solo dev sa tutto**: minimo 2 persone allineate su ogni componente
  - Daily commit obbligatorio, code review obbligatoria
  - Documentazione tecnica scritta in Notion in tempo reale (no "ce l'ho in testa")
  - Knowledge transfer settimanale registrato (Loom)
  - Backup di tutti gli account/credenziali in vault condiviso (1Password Teams)

### 6.2 🟠 Conoscenza sparpagliata, no single source of truth

- **Probabilità:** ALTA se non strutturato.
- **Impatto:** decisioni perse, requisiti dimenticati.
- **Mitigazione:**
  - Notion workspace SmartStat con: master plan, decisioni log, glossario, runbook
  - Ogni call con Matt → riassunto scritto entro 24h
  - Architecture Decision Records (ADR) per ogni scelta tecnica importante

### 6.3 🟠 Team composition incerta

- **Probabilità:** ALTA.
- **Impatto:** stime sbagliate.
- **Mitigazione:**
  - Definire ORA: chi è il tech lead, chi i dev, chi designer, chi PM
  - Confermare disponibilità minimo 16 settimane continuative

### 6.4 🟡 Velocity Fluence non testata su RN+Expo a questo scale

- **Probabilità:** MEDIA.
- **Impatto:** ritardi.
- **Mitigazione:**
  - Sprint zero (W1) usato per validare stack su componente critico (LiDAR import + viewer)
  - Buffer 20% nelle stime
  - Milestone settimanali con demo (intercetta deviazioni presto)

### 6.5 🟡 Matt è in viaggio costante, decisioni lente

- **Probabilità:** CERTA (è in aeroporto in ogni call).
- **Impatto:** blocchi su decisioni di prodotto.
- **Mitigazione:**
  - Loom asincrono per demo settimanali
  - Decisioni pre-impostate: noi proponiamo opzione A/B/C, Matt sceglie
  - Mandato chiaro: senza risposta in 48h, procediamo con default proposto

---

## 7. PROBLEMI FINANZIARI

### 7.1 🔴 Budget rimanente MatBot insufficiente per SmartStat completo

- **Probabilità:** CERTA secondo i numeri della call.
- **Impatto:** rischio replay scenario MatBot — soldi finiti a metà strada.
- **Mitigazione:**
  - Analisi numerica trasparente da presentare a Matt
  - Scopo V1 ridotto fino a stare nel budget reale
  - Eventuale negoziazione: parte cash + parte equity / revenue share

### 7.2 🟠 Scope creep durante lo sviluppo

- **Probabilità:** ALTA (Matt ha già menzionato MatBot integrato, voice, ecc.).
- **Impatto:** ritardo + budget overrun.
- **Mitigazione:**
  - Scope V1 congelato per iscritto
  - Change request formali con quotazione
  - "Out of scope V1" lista pubblica nel Notion

### 7.3 🟡 Costi infra crescono più del previsto

- **Probabilità:** MEDIA.
- **Impatto:** margini ridotti.
- **Mitigazione:**
  - Monitoring costi mensile (alarm Hetzner / Supabase / Cloudflare)
  - Architettura efficiente: cache aggressiva, mesh ottimizzate

### 7.4 🟡 Revenue ritardata = cash flow Matt sotto pressione

- **Probabilità:** ALTA (sales cycle ospedale lungo).
- **Impatto:** Matt potrebbe pressare a ridurre qualità per accelerare.
- **Mitigazione:**
  - Espettative chiare: primo cash da nuovo pilot non prima di W14–16
  - Strategia parallela: pitch a hotel/mall che hanno cycle più breve

---

## 8. PROBLEMI RELAZIONALI / EREDITÀ MATBOT

### 8.1 🔴 Matt è "scottato" da MatBot, soglia di fiducia bassa

- **Probabilità:** CERTA. È visibile in trascrizione.
- **Impatto:** ogni ritardo o problema sarà amplificato emotivamente.
- **Mitigazione:**
  - Comunicazione settimanale **proattiva** (no silenzio)
  - Demo concrete e frequenti (W4, W10 minimo)
  - Trasparenza totale: anche su problemi, prima che esplodano
  - **Mai promettere quello che non si può mantenere**: meglio sottopromettere

### 8.2 🟠 MatBot in limbo: che si fa?

- **Probabilità:** CERTA.
- **Impatto:** lavoro non finito = debito tecnico e relazionale.
- **Mitigazione:**
  - Decisione scritta: MatBot in pausa fino a M+4 (dopo lancio SmartStat V1)
  - Codice MatBot archiviato in repo separato, dev assegnati interamente a SmartStat
  - Conversazione esplicita con Matt: "facciamo SmartStat per primo, MatBot torna in roadmap a settembre/ottobre"

### 8.3 🟠 Aspettative Matt vs realtà tecnica

- **Probabilità:** ALTA. Lui dice "i dev devono farlo nel sonno". Non è vero.
- **Impatto:** delusione, conflitto.
- **Mitigazione:**
  - Master plan + risk analysis presentati esplicitamente a Matt nella prossima call
  - Demo W4 deve impressionare per ricalibrare fiducia
  - Educazione gentile: spiegare perché certe cose richiedono tempo

### 8.4 🟡 Marketing team (Guglielmo) si aspetta di iniziare in parallelo

- **Probabilità:** ALTA, già nella call.
- **Impatto:** marketing parte senza prodotto pronto = spreco effort.
- **Mitigazione:**
  - Marketing parte da W6 con landing page generica + branding
  - Demo video pubblico solo dopo W10
  - Lead generation parte da W12

### 8.5 🟡 Matt potrebbe portare nuovi requisiti improvvisi

- **Probabilità:** ALTA (l'ha già fatto: da MatBot a SmartStat in 1 settimana).
- **Impatto:** pivot, perdita lavoro fatto.
- **Mitigazione:**
  - Change management process: ogni nuovo input → valutazione impatto → quotazione
  - Roadmap visibile e firmata
  - "Sì, ma a W17" come risposta legittima

---

## 9. SUMMARY: TOP 10 PROBLEMI DA TENERE D'OCCHIO

| # | Problema | Categoria | Gravità |
|---|---|---|---|
| 1 | Indoor positioning poco preciso | Tecnico | 🔴 |
| 2 | Replay caso "G" (dev che sparisce) | Operativo | 🔴 |
| 3 | Budget MatBot residuo insufficiente | Finanziario | 🔴 |
| 4 | Matt scottato → soglia fiducia bassa | Relazionale | 🔴 |
| 5 | GDPR + tracking posizione | Legale | 🔴 |
| 6 | UX per utenti stressati/anziani | Prodotto | 🔴 |
| 7 | Concorrenti consolidati (Pointr, ecc.) | Business | 🔴 |
| 8 | Sales cycle ospedaliero lungo | Business | 🟠 |
| 9 | Scope creep | Finanziario | 🟠 |
| 10 | Onboarding scanner complicato | Prodotto | 🟠 |

I rischi rossi sono quelli su cui ho bisogno di confronto con te e con Matt **prima di partire** col codice.

---

**FINE RISK ANALYSIS v1.0**

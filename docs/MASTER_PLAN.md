# SmartStat AI — Master Plan

**Versione:** 1.0
**Data:** 2026-05-20
**Cliente:** Matt Taylor
**Owner del progetto:** Fluence (Stefano Puggioni)
**Target V1:** Navigazione indoor ospedali (white-label)
**Mercato post-V1:** Hotel, centri commerciali, scuole, aeroporti, edifici uffici

---

## 0. SINTESI ESECUTIVA (TL;DR)

SmartStat AI è una **app mobile nativa di indoor navigation** che permette a un utente (paziente, visitatore, corriere medico) di trovare in tempo reale un punto specifico all'interno di un edificio (es. ospedale) — reparto, ambulatorio, farmacia, bagno, ascensore — partendo da una mappa 2D/3D pre-scansionata via LiDAR da un operatore autorizzato.

**Modello di business:** white-label B2B (vendita a ospedali / strutture). Il cliente paga setup (scansione + onboarding) + canone ricorrente (hosting mappa + aggiornamenti + accesso utenti).

**Stack V1 deciso da Matt:**
- React Native + Expo (iOS TestFlight + Android Internal Testing)
- Owner del codice = Smartstat AI (Matt)
- No web app, no PWA in V1
- No blockchain in V1 (eventuale anchoring in V2)

**Stack backend proposto:**
- Fase 0 (MVP / demo): Supabase (auth + DB + storage + edge functions)
- Fase 1+ (produzione): VPS dedicata (Hetzner / Contabo) con PostgreSQL + S3-compatible storage + container Docker

**Timeline realistica:**
- Demo / proof-of-concept navigabile: **3–4 settimane**
- V1 production-ready (TestFlight + Play Internal): **10–12 settimane**
- V1.1 multi-tenant + dashboard admin ospedale: **+4 settimane**

**Budget stimato V1 (tutto incluso, dev + infra primi 6 mesi):** vedi sezione 4.

---

## 1. STUDIO DI FATTIBILITÀ & VELOCITÀ

### 1.1 Fattibilità tecnica

| Componente | Fattibilità | Note |
|---|---|---|
| Scansione LiDAR via iPhone/iPad | ✅ ALTA | Polycam, Scaniverse, RoomPlan (Apple) sono SDK/app maturi. Output: .usdz, .obj, .ply, .glb |
| Estrazione planimetria 2D da scan 3D | ✅ ALTA | Tool come Polycam esportano già floorplan 2D. In alternativa: pipeline custom con Open3D / RoomPlan API |
| Rendering 3D in React Native | ⚠️ MEDIA | three.js via react-three-fiber funziona, ma performance su modelli pesanti = critica. Serve ottimizzazione mesh + LOD |
| Pathfinding indoor (A* / Dijkstra) | ✅ ALTA | Algoritmi standard. Necessario costruire **navigation graph** dalla mappa (nodi = punti d'interesse + corridoi, archi = percorsi percorribili) |
| Posizionamento indoor utente (no GPS) | ⚠️ MEDIA-BASSA | È la **vera sfida**. GPS non funziona dentro edifici. Opzioni: (a) AR + visual markers (QR all'ingresso per calibrazione), (b) ARKit/ARCore con visual-inertial odometry, (c) BLE beacons (richiede hardware), (d) Wi-Fi RTT. Per V1 raccomando combo QR-checkpoint + ARKit/ARCore dead-reckoning |
| Accuratezza "3 metri" promessa a Matt | ⚠️ MEDIA | Realistica solo con AR + calibrazione QR ricorrente (ogni 20–30m). Senza beacon hardware è il massimo ottenibile |
| White-label multi-tenant | ✅ ALTA | Standard pattern: tenant_id su ogni tabella, branding config per cliente |
| Offline mode (mappa scaricata) | ✅ ALTA | Mappa + grafo locale su device, sync incrementale |
| GDPR / dati sanitari | ✅ ALTA | Non gestiamo dati medici. La mappa di un ospedale **non è dato sanitario**. Audit a parte su tracciamento posizione utente (anonimizzazione richiesta) |

**Verdetto fattibilità complessivo: ALTA per V1, con un caveat tecnico serio sull'indoor positioning.** Quella è la parte che, se sbagliata, fa fallire l'esperienza utente. Va prototipata per prima.

### 1.2 Velocità — perché 2 settimane non bastano

Matt ha chiesto inizialmente 2 settimane. Il dev team ha già risposto correttamente: **2 settimane = demo, non prodotto**. Dettaglio del perché:

- LiDAR → mesh → planimetria → grafo navigabile è una **pipeline a 4 stadi**, non un click
- iOS TestFlight richiede Apple Developer account (review 24–48h), provisioning, certificati, build firmati
- Google Play Internal Testing richiede account dev ($25), bundle firmato, privacy policy
- Multi-tenant + auth + dashboard admin (per inserire i POI sulla mappa) sono lavoro vero
- Testing in un ospedale reale è obbligatorio prima di vendere (Matt l'ha detto: third-party testing è non negoziabile)

**Bottom line:** rifiutare le 2 settimane è la cosa giusta. Promettere 12 settimane vere è meglio che mancare 2.

### 1.3 Rischi principali

| Rischio | Impatto | Mitigazione |
|---|---|---|
| Indoor positioning non abbastanza preciso | 🔴 CRITICO | Prototipare per primo. Combo QR + ARKit. Se non funziona, aggiungere BLE beacons (costo hardware per ospedale) |
| Performance rendering 3D su iPhone vecchi | 🟡 MEDIO | Fallback mappa 2D top-down. LOD aggressivo. Limitare iPhone target a 12+ |
| Ospedale rifiuta scansione (privacy / sicurezza) | 🟡 MEDIO | Pacchetto legale: NDA, certificazione "no people / no equipment data captured" |
| Costo Apple Developer + Google Play | 🟢 BASSO | $99/anno + $25 una tantum. Trascurabile |
| Lock-in Supabase se cresce traffico | 🟡 MEDIO | Architettura disaccoppiata (repository pattern) per migrare a VPS senza riscrivere il client |
| Mappa diventa obsoleta (riorganizzazioni reparti) | 🟡 MEDIO | Contratto di manutenzione + rescan trimestrale incluso nel canone |
| Concorrenti: Google Indoor Maps, Apple Indoor Maps, Mapwize (acquisita da Mappedin), Pointr | 🟠 ALTO-STRATEGICO | Differenziazione: white-label rapido + LiDAR self-service + verticale ospedaliero |

### 1.4 Realtà del mercato (cosa Matt non sta considerando)

- **Google Indoor Maps** e **Apple Indoor Maps** esistono da anni. Coprono ~15.000 edifici (aeroporti, mall, qualche ospedale grande). Sono gratis per il consumatore.
- **Pointr, Mappedin, Situm, Mapwize** sono player consolidati B2B con clienti enterprise.
- **L'opportunità reale** non è "nessuno l'ha fatto" (Matt sbaglia su questo). L'opportunità è: **gli ospedali medi/piccoli non sono coperti**, e i player enterprise sono cari e lenti. SmartStat AI può vincere su: prezzo, velocità di setup (LiDAR self-service in giornata), white-label semplice.
- **Questo va detto a Matt prima di partire**, per allineare aspettative. La narrativa "nessuno l'ha mai fatto" è falsa e ti scotta in vendita.

---

## 2. MASTER PLAN — FASI E DELIVERABLE

### Fase 0 — PROOF OF CONCEPT (Settimane 1–4)

**Obiettivo:** dimostrare a Matt che la pipeline funziona end-to-end su UN ospedale reale o simulato.

**Deliverable:**
- App React Native + Expo (iOS + Android) installabile via Expo Go o build dev
- Pipeline manuale: scan LiDAR di un piano (anche un ufficio) → upload → visualizzazione 2D navigabile
- Navigazione punto A → punto B su grafo statico
- Tracciamento posizione utente via AR (ARKit/ARCore) + un QR di calibrazione
- Backend Supabase: auth, storage mappe, tabella POI
- 1 utente test, 1 mappa test

**Cosa NON c'è ancora:** multi-tenant, dashboard admin, branding, store submission.

**Stack:**
- Frontend: Expo SDK 51+, React Native 0.74+
- AR: `expo-three` + `viro-react` o `@viro-community/react-viro` (alternativa: `mind-ar-js` ma è web)
- 3D: `three.js` via `react-three-fiber`
- LiDAR scan: Polycam (esterno) → export .glb / .obj
- Backend: Supabase (auth + Postgres + storage)
- Pathfinding: libreria JS `pathfinding` o `ngraph.path`

### Fase 1 — MVP PRODUCTION-READY (Settimane 5–12)

**Obiettivo:** versione caricabile su TestFlight + Google Play Internal Testing, vendibile al primo ospedale pilota.

**Deliverable funzionali:**
1. **Onboarding scanner** (app separata o sezione protetta nell'app principale)
   - Login operatore autorizzato
   - Workflow guidato: scan piano → upload → editor POI (tagga "Cardiologia", "Bagno", "Ascensore 2", ecc.) → pubblicazione mappa
2. **App utente finale**
   - Selezione struttura (ospedale)
   - Login opzionale (no obbligo per V1, accesso anche guest)
   - Ricerca testuale POI ("dermatologia", "bagno", "uscita emergenza")
   - Selezione punto di partenza (QR all'ingresso o pin manuale)
   - Calcolo percorso + visualizzazione 2D
   - Navigazione turn-by-turn con frecce AR sovrapposte (modalità AR opzionale)
   - Modalità offline: mappa scaricata
3. **Dashboard admin web (semplice)**
   - Login per admin ospedale
   - Lista mappe del proprio tenant
   - Editor POI base (drag & drop, etichette, accessibilità)
   - Statistiche basiche (ricerche più frequenti, percorsi più richiesti)
4. **Multi-tenant**
   - Ogni ospedale = tenant separato
   - Branding configurabile: logo, colori primari, nome app visualizzato
5. **Pacchetto distribuzione**
   - Apple Developer account configurato
   - Google Play Console configurato
   - Privacy policy + Terms of service generici
   - Build TestFlight + Internal Testing
   - Crash reporting (Sentry)
6. **Testing**
   - Test E2E in un ospedale reale pilota (Matt deve trovarlo — è nei suoi contatti)
   - 5 percorsi tipo testati con 5 utenti diversi
   - Misurazione accuratezza posizionamento

### Fase 1.5 — HARDENING & SCALA (Settimane 13–16)

- Migrazione da Supabase a VPS Hetzner/Contabo (se traffico lo richiede)
- CDN per mappe (Cloudflare R2 o Bunny.net)
- Multi-lingua: EN, IT, ES, FR, DE (5 lingue è il minimo per Europa)
- Accessibilità: percorsi wheelchair-friendly (evita scale)
- Notifiche push (es. "il tuo appuntamento è tra 10 minuti, ti guido al reparto")
- Analytics avanzate per admin (heatmap percorsi, tempi medi)

### Fase 2 — SCALA & VERTICALI ADIACENTI (Q4 2026+)

- Estensione white-label: hotel, mall, scuole, aeroporti (lavoro di go-to-market, non tecnico)
- Integrazione MatBot come voice assistant in-app ("dimmi dove andare")
- Versione web/PWA per desktop dell'admin
- API pubblica per integratori
- Eventuale anchoring blockchain delle mappe (V2 "trust layer", marketing più che tecnico)
- App-store pubblico (non più solo internal/TestFlight)

---

## 3. ARCHITETTURA TECNICA

### 3.1 Architettura logica

```
┌─────────────────────────────────────────────────────────┐
│                   CLIENT (React Native)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐ │
│  │ User App     │  │ Scanner App  │  │ Admin Web     │ │
│  │ (RN + Expo)  │  │ (RN + Expo)  │  │ (Next.js)     │ │
│  └──────┬───────┘  └──────┬───────┘  └───────┬───────┘ │
└─────────┼─────────────────┼──────────────────┼─────────┘
          │                 │                  │
          └─────────────────┼──────────────────┘
                            │ HTTPS / JSON
          ┌─────────────────▼──────────────────┐
          │       API Gateway (REST + WS)      │
          │       Node.js / Fastify            │
          └─────────────────┬──────────────────┘
                            │
       ┌────────────────────┼────────────────────┐
       │                    │                    │
┌──────▼──────┐    ┌────────▼────────┐   ┌──────▼──────┐
│ PostgreSQL  │    │ Object Storage  │   │ Redis Cache │
│ (tenants,   │    │ (.glb mesh,     │   │ (sessioni,  │
│  POI, users)│    │  .json grafo,   │   │  search)    │
│             │    │  thumbnails)    │   │             │
└─────────────┘    └─────────────────┘   └─────────────┘
```

### 3.2 Modello dati core (semplificato)

```
tenants (id, name, branding_json, plan, created_at)
buildings (id, tenant_id, name, address, geo_lat, geo_lng)
floors (id, building_id, level, name, mesh_url, floorplan_2d_url)
pois (id, floor_id, name, category, x, y, z, accessibility_tags)
nav_nodes (id, floor_id, x, y, z, type) -- nodi del grafo
nav_edges (id, from_node, to_node, distance, accessible) -- archi
qr_calibration_points (id, floor_id, code, x, y, z)
users (id, email, tenant_id NULL = guest, role)
search_events (id, user_id, query, result_poi, timestamp) -- analytics
```

### 3.3 Pipeline scansione → mappa navigabile

1. Operatore scansiona piano con Polycam (app esterna)
2. Esporta .glb (mesh 3D) + planimetria 2D PNG
3. Upload da app Scanner → API → Object Storage
4. Editor POI: l'operatore piazza pin sulla mappa 2D (drag & drop)
5. Sistema auto-genera grafo di navigazione (corridoi → spine, POI → nodi terminali)
   - V1: generazione semi-manuale (operatore disegna i corridoi)
   - V2: auto-detection corridoi via computer vision sulla planimetria
6. Validazione: operatore "cammina" virtualmente alcuni percorsi
7. Pubblicazione → mappa disponibile a utenti finali del tenant

### 3.4 Indoor positioning (la parte critica)

**Approccio V1 raccomandato — combinato:**

1. **QR code di calibrazione all'ingresso e in punti chiave** (ogni 20–30m, vicino ascensori e svincoli)
   - L'utente scansiona il QR → app sa esattamente dove si trova
2. **Tra un QR e il successivo:** ARKit (iOS) / ARCore (Android) usano visual-inertial odometry
   - Funziona bene per 30–60 secondi prima di accumulare drift
3. **Fallback:** se l'utente è perso, popup "scansiona il QR più vicino"

**Perché NON usare beacon BLE in V1:** richiedono hardware fisico installato (~5–15€/beacon × 50–100 beacon/ospedale = costo + manutenzione). Buono per V2 enterprise.

**Perché NON usare Wi-Fi RTT in V1:** richiede AP compatibili (FTM, IEEE 802.11mc), pochi ospedali ce l'hanno.

### 3.5 Stack tecnologico definitivo proposto

| Layer | Tech | Perché |
|---|---|---|
| Mobile | React Native + Expo SDK 51+ | Richiesta esplicita Matt |
| Navigation | React Navigation 6 | Standard |
| State | Zustand o Redux Toolkit | Zustand è più leggero |
| 3D rendering | react-three-fiber + three.js | Più maturo in RN |
| AR | `@viro-community/react-viro` o `expo-camera` + custom | Viro è il più completo per RN |
| LiDAR scan | App esterna Polycam (gratis) → import .glb | Non serve reinventare |
| Pathfinding | `ngraph.path` | A* veloce, npm |
| Admin web | Next.js 14 + shadcn/ui + Tailwind | Stack moderno, riusabile |
| Backend | Node.js 20 + Fastify (o NestJS) | Fastify per velocità, NestJS per struttura |
| DB | PostgreSQL 16 (via Supabase in V0, self-hosted in V1+) | Standard |
| Storage | Supabase Storage (V0) → Cloudflare R2 / Backblaze B2 (V1+) | R2 = zero egress fees |
| Auth | Supabase Auth (V0) → Clerk o Auth0 o custom JWT (V1+) | |
| CI/CD mobile | EAS Build (Expo) | Builds gestiti, firmati, OTA updates |
| CI/CD backend | GitHub Actions + Docker → Hetzner | |
| Monitoring | Sentry (errori) + Posthog (analytics utente) | Free tier generoso |
| Server (V1+) | Hetzner CX22 (€4.5/mese) o CPX21 (€8/mese) | Migliore €/performance d'Europa |

---

## 4. ANALISI COSTI

### 4.1 Costi di sviluppo (one-shot V1)

Stima realistica basata su 1 dev senior + 1 dev mid + 0.3 designer + 0.2 PM.

| Fase | Settimane | Costo dev (range mercato EU) | Costo dev (interno Fluence, ottimizzato) |
|---|---|---|---|
| Fase 0 – PoC | 4 | €12k–€20k | €6k–€10k |
| Fase 1 – MVP | 8 | €28k–€45k | €14k–€22k |
| Fase 1.5 – Hardening | 4 | €12k–€18k | €6k–€10k |
| **Totale V1** | **16** | **€52k–€83k** | **€26k–€42k** |

**Nota Matt:** la cifra "$40k+" già spesa con MatBot non basta a coprire V1 di SmartStat come progetto nuovo + finire MatBot. Va affrontata onestamente questa conversazione.

### 4.2 Costi infrastruttura (ricorrenti mensili)

**V0 — Supabase (PoC, 0–100 utenti):**
- Supabase Pro: $25/mese
- Cloudflare R2 (se backup mappe): ~$1/mese
- Domini + SSL: ~$2/mese
- **Totale: ~$28/mese**

**V1 — Misto (lancio, 100–5.000 utenti):**
- Supabase Pro: $25/mese
- Cloudflare R2: $5/mese (storage mappe)
- Sentry team plan: $26/mese
- PostHog free tier: $0
- EAS Build: $19/mese (Production tier)
- Apple Developer: $99/anno = €8/mese
- Google Play: $25 una tantum
- **Totale: ~$85/mese (~€80)**

**V1.5+ — Self-hosted (scala, 5k+ utenti):**
- Hetzner CX22 (4 vCPU, 8GB RAM) × 2 nodi: €9/mese
- Hetzner Cloud Load Balancer: €5/mese
- Hetzner Volume 100GB: €4/mese
- Backup S3 (Backblaze B2): ~€5/mese
- Cloudflare R2 (CDN mappe): €15/mese
- Sentry: $26/mese
- Mailgun/Resend (email transazionali): $10/mese
- **Totale: ~€75–90/mese fino a 50k utenti attivi**

### 4.3 Costi accessori / setup

| Voce | Costo | Frequenza |
|---|---|---|
| Apple Developer Program | $99 | Annuale |
| Google Play Console | $25 | Una tantum |
| Dominio smartstat.ai o simile | ~€15 | Annuale |
| Certificato SSL | €0 (Let's Encrypt) | – |
| Logo + brand identity (se non già fatto) | €500–2.000 | Una tantum |
| Privacy policy + ToS legali (avvocato EU) | €500–1.500 | Una tantum |
| Audit GDPR semplice | €1.000–3.000 | Una tantum |
| iPad/iPhone 16 di test (LiDAR) | €900–1.200 | Una tantum |

### 4.4 Costi per ospedale cliente (lato Matt)

Da prezzare nell'offerta al cliente:

- Setup iniziale (scansione + caricamento POI + training): **€2.000–€5.000 una tantum**
- Canone mensile (hosting mappa + utenti illimitati + supporto): **€200–€800/mese** a seconda della dimensione
- Rescan trimestrale (se contrattato): **€500–€1.500/trimestre**

Con 10 ospedali medi a €400/mese → €4.000 MRR → €48k ARR. Break-even sviluppo entro 12 mesi se vendite vanno.

---

## 5. STRUMENTI E SERVIZI CONSIGLIATI (con motivazione)

### 5.1 Sviluppo

- **Expo + EAS Build** — gestione build/sign/distribuzione automatizzata, OTA updates senza ripassare per gli store. Imprescindibile con la richiesta di Matt (RN + Expo).
- **Polycam** (app iOS/Android, gratis con limitazioni; Pro $19/mese) — scansione LiDAR consumer-grade, export .glb / .obj / .ply / floorplan PDF. Già pronta, niente da sviluppare.
- **Apple RoomPlan API** (alternativa nativa, iOS 16+) — se vogliamo build di scansione integrata invece di Polycam. Più lavoro ma più controllo.
- **Viro React** o **expo-three + custom AR** — per AR overlay delle frecce di navigazione.

### 5.2 Backend & Infra

- **Supabase** — perfetto per V0–V1. Postgres + auth + storage + edge functions in un pacchetto. Migrabile.
- **Hetzner Cloud** — miglior rapporto €/performance in Europa, datacenter EU = ok per GDPR.
- **Cloudflare R2** — storage object S3-compatible con **zero egress fees** (le mappe vengono scaricate spesso, l'egress su AWS S3 ti uccide).
- **Resend** o **Postmark** — email transazionali (verifica account, magic link), molto meglio di SES per dev experience.

### 5.3 Sicurezza & Compliance

- **Sentry** — error tracking, indispensabile in produzione.
- **PostHog** (self-hosted o cloud) — product analytics + session replay, GDPR-friendly.
- **Auth0** o **Clerk** — se vogliamo auth più avanzato di Supabase (SSO ospedali enterprise in V2).

### 5.4 Design & UX

- **Figma** — design dell'app + dashboard admin.
- **Framer** o **Webflow** — landing page marketing iniziale (Guglielmo è già il referente, ha già fatto lavoro analogo secondo la trascrizione).
- **Lottie** — animazioni leggere in-app (es. frecce direzionali animate).

### 5.5 Project management

- **Linear** o **GitHub Projects** — issue tracking dev team.
- **Notion** — documentazione tecnica condivisa con Matt.
- **Loom** — demo video settimanali a Matt (lui è in giro, gli serve sintesi visiva).

---

## 6. ROADMAP TIMELINE (cronologica)

```
W1  ━━ Kickoff, setup repo, Apple/Google account, Supabase project
W2  ━━ Pipeline scan Polycam → upload → viewer 2D base
W3  ━━ Editor POI manuale + grafo statico + pathfinding
W4  ━━ ★ DEMO 1 a Matt — utente cammina su mappa, da A a B
W5  ━━ Integrazione ARKit/ARCore + QR calibrazione
W6  ━━ Auth + multi-tenant base + scanner app
W7  ━━ Dashboard admin web (Next.js)
W8  ━━ Branding white-label + ricerca POI fuzzy
W9  ━━ Offline mode + crash reporting
W10 ━━ ★ DEMO 2 a Matt — flusso end-to-end completo
W11 ━━ TestFlight + Play Internal Testing setup, privacy policy, ToS
W12 ━━ ★ Pilot ospedale 1 — testing reale con utenti veri
W13 ━━ Hardening: bug fix da pilot, performance, accessibilità
W14 ━━ Multilingua (5 lingue), notifiche push base
W15 ━━ Migrazione (se serve) a Hetzner, CDN R2
W16 ━━ ★ V1 GA — vendibile a ospedale #2, #3, #4
```

---

## 7. DOMANDE APERTE / DECISIONI DA PRENDERE CON MATT

1. **Ospedale pilota:** chi è? Matt ha menzionato contatti con corrieri medici e ospedali — serve nome + introduzione formale entro W4.
2. **Budget V1:** i $40k+ già spesi su MatBot coprono parzialmente. Va chiarito se SmartStat si finanzia con quello che rimane o con nuovo capitale (Matt nella call dice di no a nuovi assegni, ma le cifre non quadrano).
3. **MatBot:** abbandono temporaneo o parallelo? La call suggerisce "pausa". Va messo per iscritto.
4. **Brand:** "SmartStat" è già pronto come naming? Logo? Dominio (.ai, .app, .health)?
5. **Pricing per ospedale:** Matt vuole definire listino o lasciamo alla call commerciale per il pilot?
6. **Lingua app pilot:** EN o IT? Se primo ospedale è italiano → IT prioritario.
7. **Accessibilità wheelchair:** in V1 o V1.5? Suggerisco V1.5 per non rallentare.
8. **Owner accounts:** Apple/Google Developer aperti a nome Smartstat AI LLC (di Matt) o Fluence per ora? Matt vuole ownership → meglio aprire a suo nome subito.

---

## 8. SUCCESS METRICS V1

Definiamo cosa significa "V1 ha avuto successo" per evitare ambiguità con Matt:

- ✅ App installabile da TestFlight e Google Play Internal
- ✅ Almeno 1 ospedale pilot con mappa completa di 1 piano e 20+ POI
- ✅ 10+ utenti reali testano percorso A→B con successo (90%+ success rate)
- ✅ Posizionamento accurato entro 5 metri (target 3m è stretch goal V1.5)
- ✅ Multi-tenant testato con 2+ tenant fittizi
- ✅ Dashboard admin operativa (admin ospedale può aggiungere/modificare POI senza dev)
- ✅ Crash-free rate > 99% (Sentry)
- ✅ Tempo medio di scansione + setup di 1 piano < 2 ore (operatore singolo)

---

## 9. PROSSIMI PASSI IMMEDIATI (questa settimana)

1. Validare questo master plan con Stefano interno
2. Presentarlo a Matt nella prossima call (lui aveva chiesto piano + analisi costi)
3. Decisione go/no-go sul budget
4. Se GO: setup repo, account, Apple/Google, kickoff W1 lunedì successivo
5. Aprire un canale di comunicazione strutturato con Matt (Loom settimanali + Notion log)

---

**FINE MASTER PLAN v1.0**

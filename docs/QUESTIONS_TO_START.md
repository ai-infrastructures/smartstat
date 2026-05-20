# SmartStat AI — Domande necessarie per partire

**Data:** 2026-05-20
**Scopo:** sbloccare tutte le decisioni mancanti prima di scrivere una sola riga di codice.

Le domande sono in 6 gruppi: **Business**, **Budget**, **Team**, **Brand & Account**, **Prodotto**, **Processo**. Ogni gruppo va chiuso prima di andare avanti.

---

## A. BUSINESS & MATT

A1. **Ospedale pilota:** Matt ha nominato un ospedale specifico? Esiste un contatto formale (nome + email referente)? In quale paese si trova?

A2. **Mandato chiaro su SmartStat vs MatBot:** Matt ha confermato per iscritto che SmartStat è priorità 1 e MatBot va in pausa fino a (data X)? Se no, va richiesto.

A3. **Cliente finale del pilota:** è un ospedale che paga o un test gratuito per case study? Quanto è disposto a pagare?

A4. **Geografia di lancio V1:** Italia? UE? USA? Cambia priorità lingua, GDPR/HIPAA, e norme accessibilità.

A5. **Verticali futuri confermati:** white-label per hotel/mall/scuole/aeroporti è davvero la roadmap, o focus 100% sanitario per 12 mesi?

---

## B. BUDGET & CONTRATTO

B1. **Budget disponibile reale per SmartStat V1:** quanto rimane veramente dei $40k+ MatBot? Quanto di quello è destinabile a SmartStat (vs riserva MatBot)?

B2. **Matt mette ulteriore capitale?** Lui ha detto "no" in call, ma il budget residuo non basta per V1 completo. Va negoziato: scope ridotto, equity, revenue share, o aggiunta cash?

B3. **Forma contrattuale Fluence ↔ Matt:** è confermato che il vecchio contratto MatBot copre anche SmartStat? O serve nuovo contratto / addendum?

B4. **IP ownership:** confermato che il codice è 100% di Smartstat AI (entità di Matt)? Fluence ha diritto di riuso pattern/architettura su altri progetti?

B5. **Modalità di pagamento:** milestone-based (50% kickoff, 30% W8, 20% V1 GA) o mensile?

B6. **Penali / SLA:** ci sono penali se sforiamo timeline? Garanzie post-lancio (bug fix gratuiti per N giorni)?

---

## C. TEAM

C1. **Tech lead SmartStat:** chi è la persona di Fluence assegnata come tech lead? È disponibile per 16 settimane continue?

C2. **Dev team:** quanti dev full-time? Quali skill (RN nativo, three.js, AR, backend)?

C3. **Designer:** chi disegna app + dashboard admin? Disponibilità?

C4. **PM / coordinamento Matt:** chi gestisce la relazione con Matt giornaliera? (Aljaž?)

C5. **Backup per ogni ruolo:** chi conosce il codice oltre al tech lead? (Anti-G policy)

C6. **Marketing:** Guglielmo parte in parallelo (W6+) o solo dopo lancio?

---

## D. BRAND & ACCOUNT

D1. **Naming definitivo:** "SmartStat AI"? "Smartstat"? Conferma capitalization e dominio.

D2. **Dominio:** smartstat.ai? smartstat.app? smartstat.health? Già registrato?

D3. **Logo e brand identity:** esistono già? O li facciamo (Guglielmo)?

D4. **Account Apple Developer:** a nome di chi va aperto? Smartstat AI LLC ha già un'entità legale registrata? In che paese?

D5. **Account Google Play Console:** stessa domanda.

D6. **Account Supabase / Hetzner / Cloudflare:** intestati a Matt (Smartstat AI) o gestiti da Fluence? Raccomandato: intestati a Matt, accesso condiviso.

D7. **Vault credenziali:** 1Password Teams condiviso o altro? Chi paga?

D8. **Email aziendale:** Matt ha @smartstat.ai? O usiamo personali?

---

## E. PRODOTTO V1 — DECISIONI CHIAVE

E1. **Lingua app V1:** EN only? IT only? Multilingua (EN+IT)? (Dipende da pilota.)

E2. **Modalità AR in V1:** obbligatoria all'avvio, o opzionale con fallback 2D? Raccomando opzionale.

E3. **Login utente finale:** richiesto, ottimale (guest + login), o solo guest? Raccomando: solo guest in V1 (zero attrito).

E4. **Notifiche push V1:** sì o V1.5? Raccomando V1.5.

E5. **Voice guidance (TTS) V1:** sì o V1.5? Raccomando V1 (accessibilità + UX).

E6. **Accessibilità wheelchair V1:** sì o V1.5? Dipende dal pilota.

E7. **Editor POI in dashboard admin:** quanto sofisticato? Drag&drop semplice (V1) o editor avanzato con livelli/layer (V2)?

E8. **Numero piani per ospedale pilota:** 1, 2, 5, 10? Cambia stime.

E9. **Apple/Google submission:** TestFlight + Play Internal sufficienti per V1 (come da Matt) o vogliamo subito public store?

E10. **Branding white-label V1:** solo logo+colori, o anche nome app dinamico per cliente?

---

## F. PROCESSO & COMUNICAZIONE

F1. **Frequenza demo a Matt:** ogni 2 settimane in call? Loom asincrono ogni venerdì? Mix?

F2. **Tool comunicazione:** Slack? WhatsApp? Email? (Matt è in viaggio, serve qualcosa di veloce)

F3. **Tool project management:** Linear / Jira / Notion / GitHub Projects?

F4. **Documentazione tech:** Notion workspace dedicato SmartStat?

F5. **Repo Git:** dove? Account di chi? Privato (ovvio) ma chi paga il piano GitHub/GitLab?

F6. **Change request process:** chi approva nuovi requisiti? Matt direttamente o passa da Stefano?

F7. **Decisioni asincrone:** quanto tempo Matt ha per rispondere prima che procediamo con default? 24h? 48h? 72h?

---

## G. DOMANDE TECNICHE DA CONFERMARE CON MATT

G1. **Indoor positioning con QR code:** Matt è ok ad avere QR fisici stampati nei punti chiave dell'ospedale? È una scelta UX critica.

G2. **Accuratezza target:** "3 metri" come da Matt è stretch goal V1.5, non V1. V1 realistico è 5–7 metri. Confermato?

G3. **Scanner LiDAR:** Matt è ok con uso di app esterna (Polycam) per scansione iniziale, o vuole scanner integrato custom? Raccomando Polycam in V1, custom in V2.

G4. **Backend self-hosted:** Matt ok con Supabase per V0/V1, migrazione Hetzner in V1.5? O vuole self-hosted da subito?

G5. **Robot/drone future:** quella roadmap visionaria nella call (W2+) la teniamo come visione marketing ma non roadmap tecnica, ok?

G6. **MatBot integration:** confermato che non c'è integrazione MatBot in SmartStat V1?

---

## H. CHECKLIST FINALE "PRONTI A PARTIRE"

Possiamo iniziare lo sprint 0 SOLO quando:

- [ ] Sezione A risposta (business chiaro)
- [ ] Sezione B risposta (budget chiaro, contratto firmato/firmando)
- [ ] Sezione C risposta (team allocato)
- [ ] Sezione D risposta (account aperti / in apertura)
- [ ] Sezione E risposta (scope V1 congelato per iscritto)
- [ ] Sezione F risposta (processo definito)
- [ ] Sezione G risposta (conferme tecniche da Matt)
- [ ] Master plan + risk analysis presentati a Matt e approvati
- [ ] Ospedale pilota identificato e contattato

---

**FINE QUESTIONS v1.0**

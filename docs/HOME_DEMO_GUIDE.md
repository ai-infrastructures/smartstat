# SmartStat AI — Home demo step-by-step (per Stefano)

Test pilota usando casa tua come "ospedale di prova". Tempo stimato: **45–60 minuti** la prima volta. La seconda volta ne basta 15.

---

## Cosa ti serve prima di iniziare

- Un iPhone con LiDAR (iPhone 12 Pro o superiore, oppure iPad Pro 2020+)
- App **Polycam** installata (gratis con limitazioni, **Polycam Pro** per esportare la planimetria PDF — €18/mese, prima settimana gratis)
- Stampante per stampare 3 QR codes A5
- Nastro adesivo
- Il PC dove gira l'admin (`localhost:3000`)
- Expo Go sul telefono

---

## Step 1 — Scansione 3D della casa (~15 min)

1. Apri **Polycam** sull'iPhone
2. Tap su **+ Capture** → seleziona **LiDAR**
3. Inizia dalla porta d'ingresso. Tieni il telefono ad altezza vita.
4. Cammina lentamente per **ogni stanza**. Polycam in cima ti dice se la copertura è buona.
5. Includi: ingresso, corridoio, soggiorno, cucina, camere, bagno
6. **Tap "Done"** quando hai finito → Polycam processa (~2-5 min)
7. **Esporta come GLB**:
   - Tap sul modello processato → Share → Export → **GLB**
   - Salva su Files (iCloud Drive o local)
8. **Esporta come PDF (richiede Polycam Pro)**:
   - Stesso menu → **Floor Plan PDF**
   - Salva su Files

**Se non hai Polycam Pro:** salta lo step "PDF". L'auto-generate di L2 ti tirerà fuori comunque una piantina dal GLB.

---

## Step 2 — Crea il tenant "Casa Stefano" nell'admin

1. PC → http://localhost:3000
2. Sidebar → **Tenants** → bottone **+ New tenant**
3. Compila:
   - **Hospital name:** Casa Stefano *(useremo "hospital" come nome ma è generico)*
   - **Slug:** `casa-stefano`
   - **App display name:** Casa Stefano Map
   - **Primary color:** un colore che ti piace, es. `#7C3AED`
4. Click **Create tenant** → atterri sulla detail page

---

## Step 3 — Crea building "Appartamento" + floor "Piano terra"

Dalla tenant detail → click **+ New building** (o sidebar → Buildings → + New):

- **Tenant:** Casa Stefano (preselezionato)
- **Building name:** Appartamento
- Indirizzo: il tuo, ma per il demo non importa
- Click **Create building**

Poi sidebar → **Floors** → **+ New floor**:

- **Building:** Appartamento
- **Level:** 0
- **Display name:** Piano terra
- **Width / height (m):** metti **20 × 15** come stima. **L2 ricalcolerà i valori veri** dopo l'auto-generate.
- Click **Create floor**

---

## Step 4 — Upload mesh + piantina dallo scanner mobile

1. Apri Expo Go sul telefono → connetti all'app
2. Vai su **Casa Stefano** → tab **Info** → **Sign in (staff only)**
3. Inserisci la tua email → arriva il magic link → tap → loggato
4. Torna su Info → ora vedi "Open scanner workspace" → tap
5. Lista dei piani → tap su **"Piano terra"**
6. **Step 1 — Pick mesh file** → seleziona il `.glb` di Polycam → upload (~30 sec)
7. **Step 2 — Pick floor plan** → seleziona il PDF/PNG di Polycam → upload
   - Se non l'hai, salta questo step

Vedrai "Uploaded · replace" verde su entrambi.

---

## Step 5 — Genera la mappa con L2 (auto)

1. PC → sidebar → Floors → click su "Piano terra"
2. In alto vedi tre/quattro bottoni:
   - 🟪 **Auto-generate plan** ← clicca questo
   - ✎ Edit · 🖨 QR codes · Publish toggle
3. Aspetta 5–15 secondi (vedi spinner)
4. Quando completa, vedi sotto al bottone: `1247 edges · 12.3 × 9.7 m` *(numeri di esempio)*
5. La mappa adesso mostra il **disegno delle pareti** della tua casa
6. Le dimensioni del bbox sono state aggiornate ai valori reali

---

## Step 6 — Etichetta le stanze

Nel Floor Editor (la pagina del piano), in alto trovi 4 modalità:

```
👁 View    ＋ Add    ✎ Edit    ╱ Edges
```

1. Click **＋ Add** → submode **● POI**
2. Click sulla mappa **sopra la stanza** che vuoi etichettare (es. centro del soggiorno)
3. A destra si apre un form:
   - **Display name:** Soggiorno
   - **Category:** room (o department se preferisci)
   - **Keywords:** soggiorno, sala, salotto, living room
   - **Wheelchair accessible:** ✓
   - Click **Create POI**
4. Ripeti per ogni stanza: Cucina, Camera da letto, Bagno, Ingresso, Studio, ecc.

**Tip:** L'auto-connect collega ogni nuovo POI ai vicini entro 20m. Se la rete è troppo sparsa (es. stanze separate da pareti), passa in modalità **╱ Edges** e collega manualmente i POI che dovrebbero essere accessibili (es. corridoio → soggiorno).

---

## Step 7 — Decidi come localizzarti

Per casa hai 2 opzioni:

### Opzione A (CONSIGLIATA per casa) — Tap-to-locate, niente QR fisici

Non installi nulla in casa. Quando apri l'app e vai sul tenant "Casa Stefano",
in alto vedi 2 pulsanti: **"Tap on map"** e **"Scan a QR"**.

Tap su **"Tap on map"** → si apre una piantina con i POI delle stanze →
tocca dove sei → conferma "I am here" → posizione settata.

Da quel punto, pedometro + bussola tracciano i tuoi movimenti.
Zero adesivi. Zero hardware.

### Opzione B — QR fisici (utile per ospedali, opzionale a casa)

Solo se vuoi provare anche questo flusso:

1. Floor Editor → modalità **＋ Add** → submode **⬛ QR anchor**
2. Click vicino alla porta d'ingresso, al corridoio, in zona giorno
3. Header floor → click **🖨 QR codes** → **🖨 Print all** → stampa → attacca

A casa, l'opzione A è meglio. L'opzione B serve quando uno scenario richiede
self-service di tanti utenti diversi (es. ospedale).

---

## Step 8 — Pubblica il piano

Torna su `/floors/[id]`. In alto a destra c'è il toggle blu **Publish floor**. Click.

Ora il piano è visibile agli utenti finali della mobile app.

---

## Step 9 — Test sul telefono

1. Apri Expo Go (o se vuoi l'esperienza brandizzata: `pnpm --filter @smartstat/mobile start:demo` con il tenant casa-stefano configurato in `tenants/`)
2. **Logout** se eri loggato come staff (tab Info → Sign out)
3. Lista ospedali → tap **Casa Stefano**
4. Vai vicino a uno dei QR appiccicati → tab **Scan** → inquadra il QR
5. Pin verde compare: "You are here · SS-xxxxx"
6. Tab **Search** → digita "camera" → tap su **Camera da letto**
7. Si apre la schermata Directions con:
   - Pin verde dove sei tu
   - Linea blu del percorso A*
   - Lista step a destra
   - Voce TTS che legge le istruzioni
8. Cammina verso la camera. Il pin verde **si muove con te** (PHASE 2, pedometro+bussola)
9. Se cammini lontano dall'ultimo QR vedi banner arancio "Position uncertain · tap to scan a QR" → tap → scansiona un QR vicino → ricalibrato

---

## Limiti onesti del demo casa

| Cosa | Si | Note |
|---|---|---|
| Mappa autogenerata | ✅ | Le pareti escono pulite se la scansione Polycam è buona |
| Etichettatura stanze | ✅ | Tu clicchi, dai un nome, fatto |
| "Dove vuoi andare?" | ✅ | Search → tap |
| Percorso 2D | ✅ | Con A* + voce |
| Posizione precisa al QR | ✅ | <1m |
| Posizione tra QR | ⚠️ | Pedometro + bussola: ok per ~25 passi, dopo bisogna rescan |
| Posizione su 4 piani | ❌ | Devi scansionare ogni piano separato + creare floor separati |
| Funziona offline | ✅ | Tab Info → Download maps for offline use |
| Notifiche push | ✅ | Se ti loggi, admin può mandarti push da `/tenants/<id>` |

---

## Problemi tipici e soluzioni

**"Auto-generate plan" dà errore "No walls detected":**
- La scansione Polycam ha pochi triangoli sopra altezza 0.9m. Rifare la scansione tenendo il telefono ad altezza vita, non per terra.

**Pin non si muove quando cammino:**
- Manca la permission Motion & Fitness (iOS) / Activity Recognition (Android)
- Vai in Impostazioni → SmartStat → abilita
- O senza permessi: scansiona QR ogni 10 passi

**Voce TTS muta:**
- Il telefono è in mute. Disattiva il silenzioso (l'iPhone in particolare blocca anche TTS in silenzioso).

**Il percorso non passa dove vorresti:**
- Aggiungi waypoint manuali in modalità ＋ Add → ◆ Waypoint sui corridoi
- O usa modalità ╱ Edges per disegnare la connessione esatta

---

## Quando hai fatto il demo casa

Si ottiene una validation chiara di:
1. Pipeline end-to-end: scan → upload → mappa → etichetta → cerca → naviga → arrivi
2. Esperienza utente reale (non un'astrazione)
3. Bug e UX issues prima di mostrare a Matt
4. Tempi reali di setup (ti farà capire quanto velocemente si può onboardare un ospedale)

Quando il demo casa va liscio, abbiamo il "video demo" che vendiamo al primo pilota ospedaliero.

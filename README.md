# Handle Litt - Norsk Handleliste-app

**Versjon:** 2.2 (januar 2026)
**Plattform:** Firebase Hosting + Firestore
**URL:** https://handle-litt.web.app

---

## 📋 Innholdsfortegnelse

1. [Oversikt](#oversikt)
2. [Arkitektur](#arkitektur)
3. [Filstruktur](#filstruktur)
4. [Database-struktur (Firestore)](#database-struktur-firestore)
5. [Autentisering](#autentisering)
6. [Viktige funksjoner](#viktige-funksjoner)
7. [Admin-panel](#admin-panel)
8. [Deployment](#deployment)
9. [Maintenance Scripts](#maintenance-scripts)
10. [Tekniske detaljer](#tekniske-detaljer)
11. [Feilsøking](#feilsøking)

---

## Oversikt

**Handle Litt er primært en smart handleliste-app som parser og organiserer rotete handlelister.**

### Hovedformål

Appens kjerneoppgave er å ta imot ustrukturerte handlelister (f.eks. "melk bacon epler ost brød" limt inn fra SMS/WhatsApp) og automatisk:

1. **Parse varer** - Gjenkjenne individuelle varer fra fri tekst
2. **Kategorisere** - Plassere hver vare i riktig butikk-kategori (Meieri, Kjøtt, Frukt, etc.)
3. **Sortere** - Organisere listen etter standard rekkefølge på avdelingene i butikken

**Målet:** En bruker kan lime inn eller skrive en kaotisk liste, og få den automatisk transformert til en logisk handlerute gjennom butikken.

### Tilleggsfunksjoner

- Lage og administrere flere handlelister samtidig
- Dele lister i sanntid med andre brukere via delekoder
- Søke i en omfattende varedatabase (~500+ varer)
- Foreslå nye varer til godkjenning
- To-språklig støtte (norsk/engelsk)

**Unikt ved Handle Litt:**
- **Butikk-optimert sortering** - Kategorier følger fysisk butikk-layout (Frukt & Grønt først → Urter & Krydder → Kjøtt & Fisk → Meieri → Brød → etc.)
- **Smart parsing** - Varer med spesifisering (f.eks. "bacon 2 pk", "melk 500g") håndteres intelligent
- **Fri-tekst input** - Ingen stive skjemaer, bare skriv eller lim inn
- **Live synkronisering** - Sanntidsoppdateringer mellom brukere uten forsinkelse
- **Cross-platform** - Fungerer både på mobil og desktop

---

## Arkitektur

### Frontend
- **Single Page Application (SPA)** - Alt i én HTML-fil (`index.html`)
- Vanilla JavaScript (ingen frameworks)
- CSS med Apple-inspirert designsystem (San Francisco font, glassmorphism)
- Firebase SDK (compat version 10.7.1)

### Backend
- **Firebase Firestore** - NoSQL database for sanntidsdata
- **Firebase Authentication** - Anonym auth for brukere, Google Sign-in for admin
- **Firebase Hosting** - CDN med automatisk HTTPS

### Dataflyt
```
Bruker → index.html → Firebase Auth (anonym) → Firestore → Sanntidsoppdateringer
                                                    ↓
Admin → admin.html → Google Sign-in → Firestore (read/write all)
```

---

## Filstruktur

### Hovedfiler

**index.html** (302KB)
- Hele appen: HTML, CSS, JavaScript
- ~7000 linjer kode
- Inneholder hardkodet DATABASE med alle varer (fallback hvis Firestore feiler)
- Key sections:
  - Linjer 1-600: HTML structure
  - Linjer 600-1900: CSS styling
  - Linjer 1900-7000: JavaScript logic

**admin.html** (84KB)
- Admin-panel for godkjenning av forslag
- Google Sign-in med email whitelist
- CRUD operasjoner på varer/kategorier
- Statistikk og duplikat-sjekk

**firebase.json**
- Hosting-konfigurasjon
- Rewrites for SPA routing
- Headers for caching

**firestore.rules**
- Sikkerhet: Alle kan lese varer/kategorier
- Kun autentiserte kan skrive
- Admin-operasjoner krever auth

### Scripts (Node.js)

**sync-new-items.js**
- Synkroniserer nye varer fra DATABASE (i index.html) til Firestore
- Legger IKKE til duplikater
- Sjekker engelsk navn fra DATABASE_EN

**remove-duplicates.js**
- Fjerner duplikate varer fra Firestore
- Beholder første versjon av hver vare
- Bruker normalisert sammenligning (lowercase + trim)

**update-item-categories.js**
- Oppdaterer kategorier for eksisterende varer
- Bruker DATABASE som "source of truth"
- Nyttig når varer havner i feil kategori

### Grafikk

**Grafikk/handlelitt-fav-icon.png**
- App-ikon (512x512)
- Brukes for favicon, apple-touch-icon, PWA manifest

---

## Database-struktur (Firestore)

### Collections

#### 1. `globalItems`
Alle godkjente varer i databasen.

```javascript
{
  name_no: "melk",           // Norsk navn (lowercase)
  name_en: "milk",           // Engelsk navn (lowercase)
  category: "Meieri & Kjøl", // Kategori
  approved: true,            // Godkjent av admin
  createdAt: Timestamp,
  createdBy: "uid",
  approvedBy: "uid",         // Admin UID
  usageCount: 0              // (optional) Antall ganger brukt
}
```

**Indekser:**
- `approved` + `category` (for filtrering)
- `name_no` + `category` (duplikat-sjekk)

#### 2. `globalCategories`
Kategorier i fast rekkefølge (butikk-layout).

```javascript
{
  name_no: "Frukt & Grønt",
  name_en: "Fruit & Vegetables",
  emoji: "🍎",
  order: 1,                  // Sorteringsrekkefølge
  approved: true,
  createdAt: Timestamp
}
```

**Kategorier (fast rekkefølge):**
1. Frukt & Grønt
2. Urter & Krydder
3. Kjøtt & Fisk
4. Pålegg
5. Meieri & Kjøl
6. Brød & Bakervarer
7. Tørrvarelager & Hermetikk
8. Fryste varer
9. Drikke
10. Snacks
11. Baby
12. Rengjøring & Husholdning
13. Diverse
14. Laktosefri/Glutenfri
15. ... (flere)

#### 3. `pendingApprovals`
Forslag fra brukere som venter på godkjenning.

```javascript
{
  type: "item" | "category",
  status: "pending" | "approved" | "rejected",
  submittedBy: "uid",
  submittedAt: Timestamp,
  reviewedAt: Timestamp,     // null hvis pending
  reviewedBy: "uid",         // Admin UID
  data: {
    name_no: "ny vare",
    name_en: "new item",     // optional
    category: "Diverse",
    emoji: "📦"              // kun for categories
  }
}
```

**Indekser:**
- `status` + `submittedAt` (for admin-visning)

#### 4. `sharedLists`
Delte handlelister for sanntidssamarbeid.

```javascript
{
  name: "Handleliste 1",
  ownerId: "uid",            // Listesjef
  shareCode: "baguette",     // 8-tegns matvare-kode
  isActive: true,            // Kan koble til?
  participants: [
    {
      userId: "uid",
      nickname: "Listesjef" | "Navn",
      joinedAt: Timestamp
    }
  ],
  items: [
    {
      id: "uuid",
      name: "melk",
      category: "Meieri & Kjøl",
      checked: false,
      note: "2 liter",       // optional
      addedAt: Timestamp,
      addedBy: "uid",
      checkedBy: "uid"       // optional
    }
  ],
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Indekser:**
- `shareCode` + `isActive` (for joining)
- `participants.userId` (for finding user's lists)

#### 5. `metadata`
System-metadata for cache-invalidering.

```javascript
{
  databaseVersion: 42,       // Inkrementeres ved endringer
  lastUpdated: Timestamp,
  totalItems: 500
}
```

---

## Autentisering

### Vanlige brukere (index.html)

**Firebase Anonymous Authentication**
- Automatisk pålogging ved første besøk: `auth.signInAnonymously()`
- Bruker får en persistent UID (lagres i browser)
- Ingen registrering, ingen email/passord
- **Ulempe:** Ved bytte av enhet/browser mister bruker tilgang til delte lister

**Hvorfor anonym auth?**
- Firestore krever autentisering for write-operasjoner
- Enkel brukeropplevelse - ingen pålogging
- Nok for use case (handlelister)

### Admin (admin.html)

**Google Sign-in med email whitelist**

```javascript
const ALLOWED_ADMIN_EMAILS = [
    'haugejohnsen@gmail.com'
];
```

- Kun godkjente emails får tilgang
- Sjekk både i frontend og Firestore rules
- Admin logger inn via Google-popup
- Persistent session (Firebase håndterer)

**Setup Google Sign-in:**
1. Firebase Console → Authentication → Sign-in providers
2. Aktiver "Google"
3. Velg support email
4. Lagre

---

## Viktige funksjoner

### 1. Multi-list management

**Datastruktur (localStorage + Firestore):**

```javascript
lists = {
  'local-1': {
    id: 'local-1',
    name: 'Handleliste 1',
    items: [...],
    createdAt: ISO-string,
    sharedListId: null,      // Firestore ID hvis delt
    lastModified: ISO-string
  },
  'local-2': { ... }
}
```

**Key functions:**
- `setActiveList(listId)` - Bytter aktiv liste
- `createNewList()` - Lager ny lokal liste
- `deleteList(listId)` - Sletter liste (sjekker om delt først)
- `renderTabs()` - Viser tabs for alle lister

**Spesialregel:**
- Tom `local-1` vises IKKE i tabs (default-liste)
- Delte lister vises ALLTID, også når tomme (grønn indikator)

### 2. Sanntids list-sharing

**Flow for å dele liste:**

1. Listesjef trykker "Del liste"
2. System genererer 8-tegns matvare-kode (f.eks. "baguette")
3. Liste lagres i Firestore `sharedLists` collection
4. Listesjef får delekode + direktelink
5. Deltaker bruker kode i "Koble til liste"-modal
6. Deltaker får egen lokal kopi koblet til Firestore

**Key functions:**
- `shareCurrentList()` - Deler aktiv liste (kun listesjef)
- `joinSharedList(shareCode, nickname)` - Kobler til delt liste
- `setupSharedListListener(firestoreId, localId)` - Live updates
- `leaveCollaborateList()` - Melder seg ut

**Live synkronisering:**
```javascript
db.collection('sharedLists').doc(firestoreId).onSnapshot(snapshot => {
    // Oppdater lokal liste med Firestore-data
    lists[localListId].items = snapshot.data().items;
    renderList();
});
```

**Konfliktløsning:**
- "Last write wins" - Firestore håndterer
- Optimistic updates - Lokal endring først, deretter Firestore
- Ingen merge-konflikter (strukturerte varer)

### 3. Smart item search

**Søkealgoritme:**

```javascript
function searchItems(query) {
    const normalized = normalizeText(query); // lowercase, trim, fjern special chars

    // Prioritet:
    // 1. Eksakt match på start
    // 2. Ord-start match
    // 3. Inneholder match
    // 4. Fuzzy match (aksenter, varianter)

    // Søker i både name_no og name_en
}
```

**Spesialfunksjoner:**
- **Quantity extraction:** "melk 2" → "melk" + note "2"
- **Duplicate detection:** Varsler hvis vare allerede finnes på liste
- **Custom items:** Varer ikke i database kan legges til likevel
- **Learned variants:** Husker brukertilpassede navn (localStorage)

**Key functions:**
- `renderSearchResults(query)` - Viser søkeresultater
- `addItemToList(name, category, note)` - Legger til vare
- `normalizeText(text)` - Normaliserer for sammenligning

### 4. Auto-categorization

Når bruker legger til ny vare via søk:

1. **Finnes i database?** → Kategori hentes automatisk
2. **Custom vare?** → Bruker velger kategori fra dropdown
3. **Forslag sendt?** → Vare lagres i `pendingApprovals` for admin

**Category dropdown (dynamic):**
- Henter kategorier fra Firestore eller hardkodet CATEGORIES array
- Sorteres etter `order`-felt
- Viser emoji + navn

### 5. Vare-highlighting

Når vare legges til, flasher den grønn:

```css
.item.highlight {
    animation: itemHighlight 2s ease-out;
}

@keyframes itemHighlight {
    0%, 100% { background: rgba(255,255,255,0.9); }
    10% { background: rgba(52, 199, 89, 0.3); }
}
```

**Scroll-behavior:**
- Nylig lagt til vare scrolles til hvis utenfor viewport
- Bruker `scrollIntoView({ behavior: 'smooth', block: 'center' })`
- Sjekker sticky footer-høyde for korrekt posisjonering

### 6. Item notes/specifications

Brukere kan legge til notater på varer (f.eks. "2 pk", "500g"):

**UI:**
- Klikk på vare → Modal med note-felt
- Lagres per vare-instans (ikke globalt)
- Vises under varenavn i liste

**Smart parsing:**
```javascript
// "melk 2 liter" → name: "melk", note: "2 liter"
// "bacon 4pk" → name: "bacon", note: "4pk"
```

---

## Multiplayer-spillmodus (Spillelitt)

**Ny i versjon 2.1 (januar 2026) - Oppdatert 30. januar 2026**

Handlelitt har en spillfunksjon som gjør handleturen til en konkurranse mellom deltakere på en delt liste. I spillmodus bytter logoen til "Spillelitt".

### Aktivering

Spillknappen (🎮) vises i hamburgermenyen når:
- Listen har minst 6 varer
- Listen er delt med andre
- Du er Listesjef
- Minst 2 deltakere er koblet til

### Spilleregler

1. **Varebasert fordeling** - Varer fordeles jevnt mellom spillere, uavhengig av kategori
2. **Konkurransevarer** - Varer som ikke går opp (f.eks. 9 varer på 2 spillere → 4+4+1) blir konkurransevarer som alle kan ta
3. **Poenggiving**:
   - Egne varer: **10 poeng**
   - Stjålne varer / konkurransevarer: **15 poeng**
4. **Låsing** - Du kan ikke huke av andres varer eller konkurransevarer før du har fullført dine egne
5. **Vinner** - Den med høyest poengsum vinner. Ved likt avgjøres det på tid

### Eksempel fordeling

**9 varer, 2 spillere:**
- Spiller A: 4 varer (spredt i butikken)
- Spiller B: 4 varer (spredt i butikken)
- Konkurransevarer: 1 vare (først til mølla!)

**27 varer, 5 spillere:**
- Hver spiller: 5 varer
- Konkurransevarer: 2 varer

### Listevisning i spillmodus

Listen vises i tre seksjoner:
1. **Dine varer** - Grønn bakgrunn, viser "X igjen"
2. **Konkurransevarer** - Oransje bakgrunn, "Først til mølla!" når låst opp
3. **Andre spillere** - "Stjel!" når du er ferdig med dine

Hver vare viser kategori-tag (f.eks. "Meieri") så du vet hvor i butikken den er.

### Poengtavle

Viser for hver spiller:
- Navn
- Antall varer fanget
- Poengsum

### Fair Start

- Alle spillere må trykke "HANDLE!" før spillet starter
- Knappen blir mørkere grønn og viser "KLAR!" når trykket
- Viser "Venter på andre spillere... X/Y"

### Gjenopptakelse

Spillet kan gjenopptas etter refresh/reload - du kommer automatisk tilbake til spillmodus hvis et aktivt spill pågår.

### Teknisk implementasjon

**Firestore gameSession-struktur:**
```javascript
sharedLists/{listId}: {
    gameSession: {
        status: "waiting" | "active" | "finished",
        startTime: timestamp,
        createdBy: oderId,
        playersReady: { [oderId]: timestamp },
        players: {
            [oderId]: {
                name: "Spillernavn",
                color: "#FF6B6B",
                score: 0,
                assignedItems: [itemId, ...],
                finishedOwnItems: boolean,
                finishedAt: timestamp | null
            }
        },
        itemAssignments: { [itemId]: oderId | null },  // null = konkurransevare
        completedItems: {
            [itemId]: {
                completedBy: oderId,
                timestamp: number,
                pointsAwarded: 10 | 15
            }
        }
    }
}
```

**Nøkkelfunksjoner:**
- `startGame()` - Starter spill, fordeler varer round-robin, setter konkurransevarer
- `markPlayerReady()` - Markerer spiller som klar via Firestore-transaksjon
- `toggleGameItem()` - Håndterer avhuking med poengberegning og låsesjekk
- `renderGameList()` - Viser "Mine varer først"-layout med tre seksjoner
- `handleGameSessionUpdate()` - Synkroniserer spillstatus og gjenopptar ved reload

**UI-komponenter:**
- Spillelitt-logo (byttes automatisk i spillmodus)
- Spilleregler-popup med grønn HANDLE!-knapp
- Poengtavle med spillerfarger og vare-teller
- Tre listeseeksjoner med fargekoding
- Kategori-tags på hver vare

---

## Admin-panel

**URL:** https://handle-litt.web.app/admin.html

### Funksjoner

#### 1. Godkjenning av forslag

**Pending approvals section:**
- Viser alle `pendingApprovals` med status "pending"
- Admin kan:
  - Velge kategori (dropdown)
  - Redigere engelsk navn
  - Godkjenne → Legges til i `globalItems`
  - Avslå → Status endres til "rejected"

**Key functions:**
- `renderPendingApprovals(docs)` - Viser forslag
- `approveItem(approvalId, type)` - Godkjenner
- `rejectItem(approvalId)` - Avslår

#### 2. Manuell vare-registrering

**"Legg til ny vare" section:**
- Felt: Varenavn (norsk), Varenavn (engelsk), Kategori
- Enter-navigering: Norsk → Engelsk → Kategori → Legg til
- Sjekker duplikater før lagring
- Inkrementerer `databaseVersion` i metadata

**Key function:**
- `addNewItem()` - Legger til ny godkjent vare direkte

#### 3. Vare-/kategori-oversikt

**Tabs:**
- **Varer:** Liste over alle godkjente varer (sortert etter kategori)
- **Kategorier:** Liste over kategorier med order-nummer

**Filter:**
- Søk på varenavn
- Filtrer etter kategori
- Sorter alfabetisk/etter kategori

#### 4. Duplikat-sjekk

**"Duplikater"-knapp:**
- Finner varer med identisk `name_no` + `category`
- Viser liste med duplikater
- Kan slette direkte fra admin-panel

**Algoritme:**
```javascript
// Grupperer etter name_no + category
// Hvis flere enn 1 → duplikat
```

#### 5. Database-eksport

**"Eksporter DB"-knapp:**
- Henter alle varer fra Firestore
- Genererer JavaScript-objekt formatert som DATABASE
- Kopieres til utklippstavle
- Kan limes inn i index.html som fallback

---

## Deployment

### Første gang

```bash
# 1. Installer Firebase CLI
npm install -g firebase-tools

# 2. Logg inn
firebase login

# 3. Initialiser (allerede gjort)
firebase init

# 4. Deploy
firebase deploy
```

### Vanlig deployment

```bash
cd "/Users/hallvarbuggejohnsen/SynologyDrive/kodegreier/Handle Litt/Handle Litt Firebase"

# Deploy hele prosjektet
firebase deploy

# Kun hosting
firebase deploy --only hosting

# Kun Firestore rules
firebase deploy --only firestore:rules
```

**Deployerte filer:**
- index.html
- admin.html
- firebase.json (config)
- Alle assets (PNG, fonts, etc.)

**Ikke deployed:**
- Node.js scripts (*.js)
- Service account key
- Backup-filer

### Firestore rules deployment

**VIKTIG:** Firestore rules må deployes separat!

```bash
firebase deploy --only firestore:rules
```

**Test rules:**
- Firebase Console → Firestore → Rules → Simulator

---

## Maintenance Scripts

### 1. sync-new-items.js

**Hensikt:** Synkroniser nye varer fra index.html til Firestore

**Kjøring:**
```bash
node sync-new-items.js
```

**Hva den gjør:**
1. Leser DATABASE + DATABASE_EN fra index.html (regex parsing)
2. Henter eksisterende varer fra Firestore
3. Finner varer som mangler (normalisert sammenligning)
4. Legger til NYE varer med både norsk og engelsk navn
5. Oppdaterer IKKE eksisterende varer
6. Inkrementerer databaseVersion

**Output:**
```
🔄 Synkroniserer nye varer fra DATABASE til Firestore...

1️⃣ Leser DATABASE fra index.html...
   ✅ Lastet 500 varer fra DATABASE

2️⃣ Henter eksisterende varer fra Firestore...
   ✅ Fant 480 eksisterende varer i Firestore

3️⃣ Sjekker hvilke varer som mangler...
   🆕 Fant 20 nye varer som skal legges til

4️⃣ Legger til nye varer i Firestore...
   20/20 lagt til...

✅ FERDIG!
➕ 20 nye varer lagt til
📊 Totalt 500 varer i Firestore nå
```

### 2. remove-duplicates.js

**Hensikt:** Fjern duplikate varer fra Firestore

**Kjøring:**
```bash
node remove-duplicates.js
```

**Hva den gjør:**
1. Henter alle varer fra `globalItems`
2. Grupperer etter normalisert `name_no`
3. Finner duplikater (flere varer med samme navn)
4. Viser liste med duplikater
5. Spør om bekreftelse
6. Sletter alle duplikater UNNTATT første

**Output:**
```
🔄 Fjerner duplikate varer fra Firestore...

1️⃣ Henter alle varer fra Firestore...
   ✅ Lastet 500 varer

2️⃣ Finner duplikater...
   ⚠️ Fant 10 duplikate varenavn

3️⃣ Duplikate varer:
   📦 "melk" (3 kopier)
   📦 "bacon" (2 kopier)

⚠️ Dette vil slette 12 duplikater.
Trykk Enter for å fortsette...

4️⃣ Sletter duplikater...

✅ FERDIG!
🗑️ 12 duplikater fjernet
📊 488 unike varer gjenstår
```

### 3. update-item-categories.js

**Hensikt:** Oppdater kategorier for eksisterende varer

**Kjøring:**
```bash
node update-item-categories.js
```

**Hva den gjør:**
1. Leser DATABASE fra index.html (source of truth)
2. Henter eksisterende varer fra Firestore
3. Sammenligner kategorier
4. Oppdaterer varer som har feil kategori
5. Setter `updatedAt` timestamp

**Bruk:**
- Når varer havner i feil kategori
- Når kategorier endres/reorganiseres
- Etter manuell redigering av DATABASE

---

## Tekniske detaljer

### State management

**Global state (index.html):**

```javascript
// Multi-list state
let lists = {};              // Alle lister (localStorage)
let activeListId = 'local-1'; // Aktiv liste
let shoppingList = [];       // Peker til lists[activeListId].items

// Cache
let globalItemsCache = {};   // Varer fra Firestore/DATABASE
let globalCategoriesCache = []; // Kategorier
let customItems = {};        // Brukertilpassede varer
let learnedVariants = {};    // Husket varianter

// UI state
let lastAddedItemId = null;  // For highlighting
let lastAddedCategory = null; // (ikke lenger brukt for sortering)
let currentLanguage = 'no';  // 'no' eller 'en'
let isJoiningSharedList = false; // Skjul varedatabase-melding

// Firestore listeners
let sharedListListeners = {}; // {'local-1': unsubscribeFn}
let collaborateModalListener = null;
```

**Persistence:**
- `lists` → localStorage ('shoppingLists')
- `customItems` → localStorage ('customItems')
- `learnedVariants` → localStorage ('learnedVariants')
- `globalItemsCache` → localStorage ('globalItemsCache') - 24h TTL
- `activeListId` → localStorage ('activeListId')
- `userNickname` → localStorage ('userNickname')

### Cache strategy

**Varedatabase (globalItemsCache):**

1. **Første load:**
   - Sjekk localStorage cache
   - Hvis eldre enn 24h eller ingen: Fetch fra Firestore
   - Lagre i localStorage med timestamp

2. **Version checking:**
   - Hent `databaseVersion` fra Firestore `metadata` collection
   - Sammenlign med lokal versjon
   - Hvis ulik: Invalider cache, re-fetch

3. **Fallback:**
   - Hvis Firestore feiler: Bruk hardkodet DATABASE i index.html
   - Aldri tom database

**Key functions:**
- `loadGlobalCache()` - Laster/oppdaterer cache
- `refreshItemDatabase()` - Manuell oppdatering (tvinger re-fetch)

### Firestore optimizations

**Batch operations:**
```javascript
const batch = db.batch();
// Max 500 operations per batch

for (const item of items) {
    const docRef = db.collection('globalItems').doc();
    batch.set(docRef, item);

    if (++batchCount === 500) {
        await batch.commit();
        batchCount = 0;
    }
}

if (batchCount > 0) await batch.commit();
```

**Snapshot listeners:**
- Unsubscribe når komponent unmounter
- Lagre unsubscribe-funksjoner i `sharedListListeners`
- Clean up ved logout/close

**Offline persistence:**
```javascript
db.enablePersistence({ synchronizeTabs: true })
    .catch(err => {
        console.warn('Offline persistence failed:', err);
    });
```

### URL handling

**Deep linking for list sharing:**

```javascript
// URL: https://handle-litt.web.app/?join=baguette

function checkUrlJoin() {
    const urlParams = new URLSearchParams(window.location.search);
    const shareCode = urlParams.get('join');

    if (shareCode) {
        // Vis join-modal automatisk
        showJoinListModal();
        document.getElementById('joinCodeInput').value = shareCode;
    }
}
```

**URL cleanup:**
```javascript
// Fjern ?join= parameter etter bruk
window.history.replaceState({}, document.title, window.location.pathname);
```

### Responsive design

**Breakpoints:**
```css
/* Desktop */
@media (min-width: 769px) { ... }

/* Mobile */
@media (max-width: 768px) {
    /* Stack categories vertically */
    /* Hide certain UI elements */
    /* Adjust font sizes */
}
```

**Touch interactions:**
- Long-press for list rename (500ms)
- Swipe actions på varer (TODO)
- Tap-to-check varer

### Performance

**Optimizations:**
- Virtual scrolling for lange lister (TODO)
- Debounced search (300ms)
- Lazy-load images (TODO)
- Service Worker for offline (TODO)

**Bundle size:**
- index.html: 302KB (gzip: ~60KB)
- admin.html: 84KB (gzip: ~20KB)
- Firebase SDK: ~200KB (CDN)

---

## Feilsøking

### Problem: Varer dukker ikke opp i søk

**Løsning:**
1. Sjekk om varen finnes i Firestore: Firebase Console → Firestore → `globalItems`
2. Sjekk `approved` field = `true`
3. Tøm cache: localStorage → Clear Site Data
4. Refresh side

**Alternativt:**
- Kjør `sync-new-items.js` for å legge til varer fra DATABASE
- Legg til manuelt via admin-panel

### Problem: Delt liste synkroniserer ikke

**Løsning:**
1. Sjekk network tab i DevTools - ser du Firestore requests?
2. Sjekk Console for errors
3. Verifiser Firestore rules er deployet:
   ```bash
   firebase deploy --only firestore:rules
   ```
4. Sjekk at `isActive` = `true` på listen i Firestore
5. Sjekk at bruker er i `participants` array

**Debug:**
```javascript
// Se alle active listeners
console.log(sharedListListeners);

// Se Firestore data
db.collection('sharedLists').doc(firestoreId).get()
    .then(doc => console.log(doc.data()));
```

### Problem: Admin-panel viser "not authenticated"

**Løsning:**
1. Aktiver Google Sign-in i Firebase Console:
   - Authentication → Sign-in providers → Google → Enable
2. Sjekk at email er i `ALLOWED_ADMIN_EMAILS` whitelist (admin.html linje 814)
3. Logg ut og inn igjen
4. Sjekk Console for auth errors

### Problem: "Database oppdatert"-melding vises for ofte

**Løsning:**
- Dette skjer når `databaseVersion` endres i Firestore
- Normal oppførsel etter admin legger til varer
- Unngå ved å ikke kjøre scripts unødvendig

### Problem: Duplikate varer i database

**Løsning:**
```bash
node remove-duplicates.js
```

### Problem: Varer har feil kategori

**Løsning:**
1. Rediger DATABASE i index.html (flytt vare til riktig kategori)
2. Kjør:
   ```bash
   node update-item-categories.js
   ```

### Problem: Firestore quota exceeded

**Symptomer:**
- "Quota exceeded" errors i Console
- Ingen writes fungerer

**Løsning:**
1. Firebase Console → Firestore → Usage
2. Sjekk read/write counts
3. Identifiser loops/problematisk kode
4. Vent til neste dag (gratis tier reset)
5. **Eller:** Oppgrader til Blaze plan

**Forebygging:**
- Bruk `.limit()` på queries
- Cache data i localStorage
- Unsubscribe listeners når ikke i bruk

---

## Fremtidige forbedringer

### Høy prioritet
- [ ] Service Worker for offline støtte
- [ ] Push notifications for liste-endringer
- [ ] Bedre feilhåndtering ved nettverksproblemer
- [ ] Undo/redo for sletting av varer

### Middels prioritet
- [ ] Swipe-to-delete på varer (mobil)
- [ ] Virtual scrolling for store lister
- [ ] Eksporter liste som PDF/email
- [ ] Favoritt-lister
- [ ] Varekurv-estimat (prisberegning)

### Lav prioritet
- [ ] Mørk modus
- [ ] Flere språk (tysk, spansk)
- [ ] Oppskrifts-integrasjon
- [ ] Butikk-integrasjon (tilbudsvarsling)

---

## Kontakt og support

**Utvikler:** Hallvar Hauge Johnsen
**Email:** haugejohnsen@gmail.com
**Firebase Project:** handle-litt
**GitHub:** (TBD)

---

## Lisens

Proprietary - Alle rettigheter forbeholdt.

---

**Sist oppdatert:** 30. januar 2026
**Versjon:** 2.2.0 (varebasert spillmodus med konkurransevarer)

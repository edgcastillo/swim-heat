# SwimHeat PWA — Tech Stack & Development Plan

## Why PWA over Native iOS (for MVP)

| | PWA | Native iOS |
|---|---|---|
| Build time | Days | Weeks |
| Requires Xcode / Mac | No | Yes |
| Works on Android too | ✓ | ✗ |
| Share with families | Send a URL | TestFlight or App Store |
| App Store approval | Not needed | Required |
| OCR accuracy | Good | Excellent |
| OCR speed (mobile) | 5–15 sec | 1–3 sec |
| Offline support | ✓ (with service worker) | ✓ |
| Roster persistence | localStorage / IndexedDB | SQLite |

**Bottom line:** PWA gets you a working, shareable app in a fraction of
the time. If it gains traction, the native iOS version can be built later
using the same parser logic.

---

## Tech Stack

### Core framework — React + Vite

```
React 18          UI components and state
Vite              Dev server and build tool (fast, no config overhead)
```

React is the right call here over plain HTML/JS — the confirm-matches
screen (candidate cards with radio selections) and results view (grouped
lists) benefit from component-based state management. Vite makes setup
take minutes instead of hours.

**Not recommended for this app:** Next.js (overkill, server-side
rendering not needed), Vue (fine but smaller community = fewer OCR
examples to reference).

### OCR — Tesseract.js v5

```
tesseract.js v5   WebAssembly port of Tesseract, runs 100% in browser
```

<https://github.com/naptha/tesseract.js>

Runs entirely client-side via WebAssembly — no server, no internet
connection needed at the pool. Returns both text and bounding box
coordinates per word, which is exactly what the column-splitter needs.

**Performance note:** On a modern iPhone expect 5–10 seconds for a
heat sheet image. This is the main tradeoff vs. Apple Vision. Mitigate
by showing a step-by-step progress indicator so it doesn't feel frozen.

**Key config (mirrors the Swift plan):**
```js
const worker = await createWorker('eng', 1, {
  // OEM 1 = LSTM neural net only (more accurate than legacy)
  // PSM 6 = assume uniform block of text
});
// IMPORTANT: disable dictionary correction — it mangles swimmer names
await worker.setParameters({
  tessedit_pageseg_mode: '6',
  // No language model correction — same as usesLanguageCorrection=false in Vision
  tessedit_char_whitelist: '',
});
```

Tesseract.js also returns `hocr` (HTML) output which includes bounding
boxes — use these for column splitting instead of re-implementing it.

### Storage — IndexedDB via Dexie.js

```
Dexie.js v3       Friendly wrapper around IndexedDB
```

<https://dexie.org>

`localStorage` is limited to ~5MB and stores only strings.
IndexedDB supports structured data and much larger storage — right for
storing a roster plus scan history. Dexie makes the IndexedDB API
readable and async/await-friendly.

**Why not localStorage?** It's synchronous (blocks the UI thread) and
fragile on iOS Safari — the OS can clear it when storage is low with
no warning to the user.

```js
// db.js
import Dexie from 'dexie';

export const db = new Dexie('SwimHeatDB');
db.version(1).stores({
  swimmers: '++id, firstName, lastName, createdAt',
  // future: scanHistory, confirmedMatches
});
```

### Fuzzy matching — fuse.js

```
fuse.js v7        Lightweight fuzzy search, no dependencies
```

<https://www.fusejs.io>

Does the same job as `rapidfuzz` in the Python prototype. Scores each
sheet name against the roster and returns ranked candidates. Runs
instantly in the browser.

```js
import Fuse from 'fuse.js';

const fuse = new Fuse(roster, {
  keys: ['fullName'],      // search against "First Last"
  includeScore: true,
  threshold: 0.5,          // 0 = exact, 1 = match anything
  ignoreLocation: true,
  useExtendedSearch: false,
});
```

Note: Fuse scores are inverted vs. rapidfuzz (0.0 = perfect match,
1.0 = no match). Convert: `similarity = Math.round((1 - score) * 100)`

### PWA shell — Vite PWA plugin

```
vite-plugin-pwa   Generates service worker + manifest automatically
```

<https://vite-pwa-org.netlify.app>

Handles:
- Service worker generation (offline support)
- Web app manifest (icon, name, theme color)
- "Add to Home Screen" prompt on iOS and Android
- Asset caching strategy

### Styling — Tailwind CSS

```
Tailwind CSS v3   Utility-first CSS, no custom stylesheet needed
```

Fastest way to build a clean mobile UI without writing CSS from scratch.
Works well with the component structure we need.

### Image preprocessing — browser-image-resizer or Canvas API

Before feeding to Tesseract, preprocess the image:
- Resize to max 2400px wide (Tesseract doesn't need iPhone full-res 12MP)
- Convert to grayscale
- Boost contrast

All doable with the standard Canvas API — no extra library needed.

---

## Project Structure

```
swimheat-pwa/
├── public/
│   ├── manifest.json          PWA manifest (name, icons, theme)
│   └── icons/                 App icons (192px, 512px)
├── src/
│   ├── main.jsx               React entry point
│   ├── App.jsx                Router + global layout
│   ├── db.js                  Dexie database setup
│   │
│   ├── engine/
│   │   ├── ocr.js             Tesseract.js wrapper
│   │   ├── columnSplitter.js  Splits hOCR bounding boxes L/R
│   │   ├── hyTekParser.js     Regex parser (same logic as Python)
│   │   └── fuzzyMatcher.js    Fuse.js candidate scoring
│   │
│   └── views/
│       ├── RosterView.jsx     List + add/delete swimmers
│       ├── ScanView.jsx       Camera / upload + progress
│       ├── ConfirmView.jsx    Candidate picker cards
│       └── ResultsView.jsx    Events grouped by swimmer
│
├── vite.config.js             Vite + PWA plugin config
├── tailwind.config.js
└── package.json
```

---

## Screen Flow

```
RosterView  ──► ScanView  ──► ConfirmView  ──► ResultsView
    ▲                                              │
    └──────────────── "Scan again" ────────────────┘
```

### RosterView
- List of saved swimmers (from IndexedDB)
- Add form: First name + Last name fields
- Swipe/tap to delete
- "Scan Heat Sheet" button → ScanView

### ScanView
- Two buttons: Take Photo | Upload from Gallery
- Uses `<input type="file" accept="image/*" capture="environment">`
  for camera on mobile
- Shows step-by-step progress as OCR runs:
  ```
  [✓] Image loaded
  [✓] Preprocessing...
  [⟳] Reading text... (Tesseract running)
  [ ] Parsing events...
  [ ] Matching swimmers...
  ```
- On complete → ConfirmView

### ConfirmView
- One card per sheet name that produced candidates
- Each card shows:
  - Sheet name as printed: e.g. `"Castillo, Amelia M"`
  - Normalised: `"Amelia Castillo"`
  - Radio list of roster candidates sorted by:
    1. Last name exact match first
    2. Then by similarity score descending
  - Score shown as percentage
  - "None of these" option
- "Confirm all" button at bottom
- Pre-selects 100% last-name matches but keeps them visible for review

### ResultsView
- Grouped by swimmer, sorted by event number
- Each event row:
  ```
  #5  100m Backstroke
  Girls 12 & Under  ·  Heat 4/5  ·  Lane 5  ·  Seed 1:44.75
  Starts at 09:44 AM
  ```
- "Not found on sheet" placeholder for swimmers with no matches
- Share button → Web Share API (`navigator.share`) to send as text
- "Scan another" button

---

## OCR Pipeline (JavaScript)

### Step 1 — Image capture and preprocessing

```js
// ocr.js
async function preprocessImage(file) {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');

  // Cap at 2400px wide — enough for Tesseract, avoids huge processing time
  const maxWidth = 2400;
  const scale = Math.min(1, maxWidth / bitmap.width);
  canvas.width  = bitmap.width  * scale;
  canvas.height = bitmap.height * scale;

  const ctx = canvas.getContext('2d');

  // Auto-rotate: if height > width, image is portrait — rotate 90°
  if (bitmap.height > bitmap.width) {
    canvas.width  = bitmap.height * scale;
    canvas.height = bitmap.width  * scale;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(bitmap, -bitmap.width * scale / 2, -bitmap.height * scale / 2,
                  bitmap.width * scale, bitmap.height * scale);
  } else {
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  }

  // Grayscale + contrast boost via pixel manipulation
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const gray = 0.299 * imageData.data[i] +
                 0.587 * imageData.data[i+1] +
                 0.114 * imageData.data[i+2];
    // Simple contrast stretch
    const contrast = Math.min(255, Math.max(0, (gray - 128) * 1.4 + 128));
    imageData.data[i] = imageData.data[i+1] = imageData.data[i+2] = contrast;
  }
  ctx.putImageData(imageData, 0, 0);

  return canvas;
}
```

### Step 2 — Tesseract OCR with bounding boxes

```js
async function runOCR(canvas, onProgress) {
  const worker = await Tesseract.createWorker('eng', 1, {
    logger: m => {
      if (m.status === 'recognizing text') onProgress(m.progress);
    }
  });

  // Get hOCR output — includes word-level bounding boxes
  const { data } = await worker.recognize(canvas, {}, { hocr: true });
  await worker.terminate();

  // Also return plain text words with bboxes
  return data.words.map(w => ({
    text:  w.text,
    normX: w.bbox.x0 / canvas.width,   // 0.0–1.0
    normY: w.bbox.y0 / canvas.height,  // 0.0–1.0, top-left origin
    conf:  w.confidence,
  }));
}
```

### Step 3 — Column splitting

```js
// columnSplitter.js
export function splitColumns(words) {
  // Filter low-confidence noise
  const clean = words.filter(w => w.conf > 20 && w.text.trim().length > 0);

  // Bucket by x position
  const left  = clean.filter(w => w.normX < 0.50);
  const right = clean.filter(w => w.normX >= 0.50);

  return {
    left:  reconstructLines(left),
    right: reconstructLines(right),
  };
}

function reconstructLines(words) {
  // Group words within 0.5% of image height into same line
  const lineMap = {};
  for (const w of words) {
    const bucket = Math.round(w.normY * 200);
    if (!lineMap[bucket]) lineMap[bucket] = [];
    lineMap[bucket].push(w);
  }
  return Object.keys(lineMap)
    .sort((a, b) => a - b)
    .map(y => lineMap[y].sort((a, b) => a.normX - b.normX)
                         .map(w => w.text).join(' '));
}
```

### Step 4 — HyTek parser

Same regex patterns as the Python prototype, translated to JS:

```js
// hyTekParser.js
const EVENT_RE  = /^#(\d+)\s+(Girls|Boys|Mixed)\s+([\w\s&]+?)\s+(\d{2,4})\s+(?:LC|SC|LCM|SCY|SCM)?\s*(?:Meter|Yard)?\s*(.+)/i;
const HEAT_RE   = /Heat\s+(\d+)\s*[oO0Zz]f\s*(\d+)(?:.*?Starts?\s+at\s+([\d:]+\s*(?:AM|PM)))?/i;
const SWIMMER_RE = /^(\d)\s+([A-Z][A-Za-z'\-]+(?:\s+[A-Z][A-Za-z'\-]*)*,\s*[A-Z][A-Za-z'\-]+(?:\s+[A-Z])?)\s+(\d{1,2})\s+([A-Z]{2,8}-[A-Z]{2,4})\s*(NT|DQ|[\d]+:[\d.]+|[\d]+\.[\d]+)?/;

function splitMergedLines(lines) {
  return lines.flatMap(line => {
    // Split mid-line event headers and heat headers into separate lines
    return line
      .replace(/\s+(#\d+\s+(?:Girls|Boys|Mixed))/gi, '\n$1')
      .replace(/\s+(Heat\s+\d+\s*[oO0]f)/gi, '\n$1')
      .split('\n');
  });
}

export function parseColumn(lines) {
  const events = [];
  let curEvent = null, curHeat = null;

  for (const raw of splitMergedLines(lines)) {
    const line = raw.trim();
    if (!line || line.length < 4) continue;

    let m = line.match(EVENT_RE);
    if (m) {
      curEvent = { eventNumber: +m[1], gender: m[2], ageGroup: m[3].trim(),
                   distance: m[4], stroke: m[5].trim().replace(/[.,:]$/, ''),
                   heats: [] };
      events.push(curEvent); curHeat = null; continue;
    }
    m = line.match(HEAT_RE);
    if (m && curEvent) {
      curHeat = { heatNumber: +m[1], ofHeats: +m[2],
                  startTime: m[3] ?? null, swimmers: [] };
      curEvent.heats.push(curHeat); continue;
    }
    m = line.match(SWIMMER_RE);
    if (m && curHeat) {
      curHeat.swimmers.push({ lane: +m[1], nameRaw: m[2].trim(),
        age: +m[3], team: m[4], seedTime: m[5] ?? 'NT' });
    }
  }
  return events;
}
```

### Step 5 — Fuzzy matching with Fuse.js

```js
// fuzzyMatcher.js
import Fuse from 'fuse.js';

function normalizeName(raw) {
  // "O'Donnell, Amelia M" → "Amelia O'Donnell"
  if (!raw.includes(',')) return raw;
  const [last, rest] = raw.split(',');
  const first = rest.trim().split(' ')[0];
  return `${first} ${last.trim()}`;
}

function lastNameOf(raw) {
  return raw.includes(',')
    ? raw.split(',')[0].trim().toLowerCase()
    : raw.split(' ').pop().toLowerCase();
}

export function getCandidates(nameRaw, roster, threshold = 45) {
  const normalized = normalizeName(nameRaw);
  const sheetLast  = lastNameOf(nameRaw);

  const fuse = new Fuse(roster, {
    keys: ['fullName'],
    includeScore: true,
    threshold: 0.6,       // cast wide net, filter below
    ignoreLocation: true,
  });

  return fuse.search(normalized)
    .map(r => ({
      swimmer:       r.item,
      score:         Math.round((1 - r.score) * 100),
      lastNameMatch: r.item.lastName.toLowerCase() === sheetLast,
    }))
    .filter(c => {
      // Show if: high score OR last name matches with decent score
      return c.score >= 75 || (c.lastNameMatch && c.score >= threshold);
    })
    .sort((a, b) => (b.lastNameMatch - a.lastNameMatch) || (b.score - a.score));
}
```

---

## IndexedDB Schema (Dexie)

```js
// db.js
import Dexie from 'dexie';

export const db = new Dexie('SwimHeatDB');

db.version(1).stores({
  // Primary key is auto-incremented (++)
  // Indexed fields listed after primary key
  swimmers: '++id, lastName, createdAt',
});

// Helper: get full name for fuzzy matching
db.swimmers.hook('reading', obj => {
  obj.fullName = `${obj.firstName} ${obj.lastName}`;
  return obj;
});
```

Usage:
```js
// Add swimmer
await db.swimmers.add({ firstName: 'Amelia', lastName: 'Castillo',
                        createdAt: new Date() });

// Get all for roster
const roster = await db.swimmers.orderBy('lastName').toArray();

// Delete
await db.swimmers.delete(id);
```

---

## PWA Config (vite.config.js)

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'SwimHeat',
        short_name: 'SwimHeat',
        description: 'Scan heat sheets, find your swimmer\'s events',
        theme_color: '#0F6E56',
        background_color: '#ffffff',
        display: 'standalone',         // full-screen, no browser chrome
        orientation: 'portrait',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        // Cache Tesseract WASM and language files so OCR works offline
        globPatterns: ['**/*.{js,css,html,wasm,traineddata}'],
        runtimeCaching: [{
          urlPattern: /tesseract/,
          handler: 'CacheFirst',
          options: { cacheName: 'tesseract-cache', expiration: { maxAgeSeconds: 60 * 60 * 24 * 30 } },
        }],
      },
    }),
  ],
});
```

---

## Package.json dependencies

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.26.0",
    "tesseract.js": "^5.1.0",
    "dexie": "^3.2.7",
    "fuse.js": "^7.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^5.4.0",
    "vite-plugin-pwa": "^0.20.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

Total production bundle (excluding Tesseract WASM ~10MB downloaded once
and cached): approximately 200–300KB.

---

## iOS-specific Considerations

### "Add to Home Screen"
On iOS, users must manually add the PWA via Safari's share sheet.
Show a one-time banner on first visit:
> "For the best experience, tap Share → Add to Home Screen"

Once installed, the app runs full-screen with no browser chrome,
looks and feels like a native app.

### Storage persistence on iOS
Safari can evict IndexedDB storage when the device is low on space.
Mitigate by:
1. Requesting persistent storage: `navigator.storage.persist()`
   (Safari 15.4+ supports this)
2. Adding a simple "Export roster" button that copies names as text
   so the parent can restore easily if needed

### Camera access
Use `capture="environment"` on the file input to open the rear camera
directly on mobile:
```html
<input type="file" accept="image/*" capture="environment" />
```
Also allow file upload for pulling from the photo library:
```html
<input type="file" accept="image/*" />
```
Show both options side by side.

### Offline at the pool

Pool venues have notoriously bad cell signal. The app must work with
**zero internet connection** after the first load. This requires three
things to all work together:

**What the service worker caches automatically (via Workbox):**
- All JS, CSS, HTML bundles — the app shell
- Tesseract WASM binary (`tesseract-core.wasm`)
- Everything in the `public/` folder including icons

**The gap: Tesseract language file**
`eng.traineddata` (~10MB) is fetched at runtime from the Tesseract CDN
the first time OCR runs. If the user opens the app for the first time
at the pool with no signal, this download fails and OCR is broken.

**The fix: pre-warm the Tesseract worker on app load**

In `App.jsx`, silently initialise a Tesseract worker in the background
as soon as the app loads. This forces the language file to download and
cache while the parent is still on WiFi (at home, in the car, etc.)
before they get to the pool:

```js
// src/engine/warmup.js
import { createWorker } from 'tesseract.js'

let warmed = false

export async function warmupTesseract() {
  if (warmed) return
  try {
    // Download + cache eng.traineddata silently in background
    const worker = await createWorker('eng', 1)
    await worker.terminate()
    warmed = true
    console.log('Tesseract ready for offline use')
  } catch (e) {
    // No internet — will retry next time app opens with connection
    console.warn('Tesseract warmup skipped (offline):', e.message)
  }
}
```

Call it in `App.jsx` with a small delay so it doesn't compete with
the initial render:

```jsx
// App.jsx
import { warmupTesseract } from './engine/warmup'

useEffect(() => {
  purgeExpiredSessions()
  // Warm up after 3 seconds — app is loaded, user is idle
  const timer = setTimeout(warmupTesseract, 3000)
  return () => clearTimeout(timer)
}, [])
```

**Updated Workbox config to cache Tesseract CDN assets:**

```js
// vite.config.js — workbox section
workbox: {
  globPatterns: ['**/*.{js,css,html,wasm,traineddata}'],
  runtimeCaching: [
    {
      // Cache Tesseract WASM and language data from CDN
      urlPattern: ({ url }) =>
        url.hostname.includes('jsdelivr') ||
        url.hostname.includes('unpkg') ||
        url.pathname.includes('tesseract'),
      handler: 'CacheFirst',
      options: {
        cacheName: 'tesseract-assets',
        expiration: {
          maxAgeSeconds: 60 * 60 * 24 * 90, // 90 days
          maxEntries: 10,
        },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
  ],
},
```

**"Install to use offline" banner**

Show a one-time banner on first visit explaining the offline setup:

```
┌─────────────────────────────────────────┐
│ 📶 Works offline at the pool            │
│ Open once on WiFi before the meet to    │
│ download the scanner (~10MB).           │
│                          [Got it]       │
└─────────────────────────────────────────┘
```

Store the dismissed state in localStorage so it only shows once:
```js
const shown = localStorage.getItem('offline-banner-dismissed')
```

**Full offline capability checklist:**

| Feature | Offline? | Notes |
|---|---|---|
| View saved swimmers | ✓ | IndexedDB, always local |
| Add / delete swimmers | ✓ | IndexedDB, always local |
| Camera / photo upload | ✓ | Device hardware, no network |
| Image preprocessing | ✓ | Canvas API, no network |
| Tesseract OCR | ✓ after warmup | Needs one WiFi session first |
| HyTek parsing | ✓ | Pure JS, no network |
| Fuzzy matching | ✓ | Fuse.js, no network |
| View today's results | ✓ | IndexedDB, always local |
| Share results | ✓ | Web Share API, local |
| App shell / UI | ✓ | Cached by service worker |

**The one honest limitation:** if a user installs the app and goes
directly to the pool without opening it on WiFi first, Tesseract won't
load. Show a clear error message in that case:

```js
// In ProcessingView, catch the Tesseract load failure:
try {
  const words = await runOCR(canvas, onProgress)
  // ...
} catch (err) {
  if (!navigator.onLine) {
    setError(
      'Scanner needs to download once on WiFi first. ' +
      'Connect to WiFi and reopen the app to set it up.'
    )
  } else {
    setError('Scan failed — please try again.')
  }
}
```

---

## Build Order

### Phase 1 — Scaffold and roster (Day 1–2)
1. `npm create vite@latest swimheat-pwa -- --template react`
2. Install dependencies
3. Set up Tailwind
4. Set up Dexie — create `db.js`
5. Build `RosterView` — list, add form, delete
6. Test IndexedDB persistence in Safari on iPhone

### Phase 2 — OCR engine (Day 2–4)
1. Build `ocr.js` — Tesseract worker setup, image preprocessing
2. Build `columnSplitter.js` — bounding box column separation
3. Build `hyTekParser.js` — regex patterns
4. Build `fuzzyMatcher.js` — Fuse.js candidate scoring
5. **Test in isolation with the real heat sheet photo**
   (use a simple HTML test harness, no UI yet)
6. Validate output matches Python prototype results

### Phase 3 — Scan + confirm UI (Day 4–6)
1. Build `ScanView` — file input, image preview, progress steps
2. Wire OCR pipeline into ScanView
3. Build `ConfirmView` — candidate cards, radio selection, confirm button
4. Build `ResultsView` — grouped event list, share button

### Phase 4 — PWA shell (Day 6–7)
1. Add `vite-plugin-pwa`
2. Create icons and manifest
3. Test service worker caching
4. Test offline at pool (airplane mode)
5. Test "Add to Home Screen" on iPhone

---

## Hosting — GitHub Pages + Custom Domain

**Total cost: ~$10–20/year (domain only). Everything else is free.**

### Why GitHub Pages over Vercel or Netlify

GitHub Pages is completely free with no usage limits for public repos.
Combined with a custom domain it gives you a professional URL with zero
ongoing platform cost. The only expense is the domain registration.

### Recommended domain registrar

**Cloudflare Registrar** (https://cloudflare.com/products/registrar)
— sells domains at wholesale cost with no markup. Includes free DNS
management and SSL. Cheapest option long-term.

### Recommended domains

| Domain | Cost/yr |
|---|---|
| `swimheat.app` | ~$15–20 |
| `swimheat.dev` | ~$12–15 |
| `swimheat.com` | ~$10–15 |

### `vite.config.js` base setting

With a custom domain at the root, set `base: '/'`.
Without a custom domain (using `yourusername.github.io/swimheat-pwa/`),
set `base: '/swimheat-pwa/'`.

### GitHub Actions auto-deploy workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm install
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

Every push to `main` triggers a build and deploy automatically.

### DNS records (add at your registrar)

```
Type    Name    Value
A       @       185.199.108.153
A       @       185.199.109.153
A       @       185.199.110.153
A       @       185.199.111.153
CNAME   www     yourusername.github.io
```

Then in GitHub repo → Settings → Pages → Custom domain → enter your
domain → Save → check "Enforce HTTPS".

GitHub provisions the SSL certificate automatically via Let's Encrypt.

### Cost summary

| Item | Cost |
|---|---|
| Domain | ~$10–20/year |
| GitHub Pages hosting | Free |
| SSL certificate | Free |
| CI/CD auto-deploy | Free |
| **Total** | **~$10–20/year** |

---

## What's Different vs. the iOS Plan

The parsing logic is identical — same regex patterns, same column-
splitting strategy, same candidate threshold rules. The differences are:

| iOS (Swift) | PWA (JavaScript) |
|---|---|
| `VNRecognizeTextRequest` | `Tesseract.js` |
| `usesLanguageCorrection = false` | No equivalent — use PSM 6, no whitelist |
| GRDB + SQLite | Dexie + IndexedDB |
| `fuzz.token_sort_ratio` (rapidfuzz) | Fuse.js `includeScore` |
| Apple Vision bounding boxes | Tesseract.js `word.bbox` |
| SwiftUI views | React + Tailwind components |

The `hyTekParser.js` and `fuzzyMatcher.js` files can be ported almost
line-for-line from the Python prototype. The regex patterns are identical.

---

## Scan Session Storage & 48-Hour Auto-Purge

Scan results are temporary — they exist for the day of the meet and are
automatically cleared 48 hours after scanning. The swimmer roster is
permanent and never purged.

### Updated Dexie schema

```js
// db.js
import Dexie from 'dexie';

export const db = new Dexie('SwimHeatDB');

db.version(1).stores({
  swimmers: '++id, lastName, createdAt',
  sessions: '++id, scannedAt',              // one per scan
  events:   '++id, sessionId, scannedAt',   // tied to a session
});
```

### Purge logic — runs on every app open

```js
// purge.js
const EXPIRY_MS = 48 * 60 * 60 * 1000; // 48 hours

export async function purgeExpiredSessions() {
  const cutoff = new Date(Date.now() - EXPIRY_MS);
  const expired = await db.sessions
    .where('scannedAt').below(cutoff).toArray();
  const expiredIds = expired.map(s => s.id);
  if (expiredIds.length === 0) return;
  await db.events.where('sessionId').anyOf(expiredIds).delete();
  await db.sessions.where('id').anyOf(expiredIds).delete();
}
```

### Wire into App.jsx

```jsx
import { useEffect } from 'react';
import { purgeExpiredSessions } from './purge';

export default function App() {
  useEffect(() => {
    purgeExpiredSessions(); // silent, runs once on every app open
  }, []);
}
```

### Saving a scan session

```js
const sessionId = await db.sessions.add({ scannedAt: new Date() });
for (const event of confirmedEvents) {
  await db.events.add({ ...event, sessionId, scannedAt: new Date() });
}
```

### Loading today's results

```js
// Purge already removed anything older than 48hrs
const sessions = await db.sessions.orderBy('scannedAt').reverse().toArray();
const latest   = sessions[0] ?? null;
const events   = latest
  ? await db.events.where('sessionId').equals(latest.id).toArray()
  : [];
```

### UX note
Show a subtle label on the Results screen:
> *"Today's scan · Auto-clears after 48 hrs"*

---

## Component State Shapes

Explicit data shapes so Claude Code doesn't have to guess.

### Swimmer (from IndexedDB)
```js
{
  id:        1,
  firstName: 'Amelia',
  lastName:  'Castillo',
  fullName:  'Amelia Castillo',  // derived via Dexie hook
  createdAt: Date,
}
```

### ParsedEvent (output of hyTekParser.js)
```js
{
  eventNumber: 5,
  gender:      'Girls',
  ageGroup:    '12&Under',
  distance:    '100',
  stroke:      'Backstroke',
  heats: [
    {
      heatNumber: 4,
      ofHeats:    5,
      startTime:  '09:44 AM',   // null if not parsed
      swimmers: [
        {
          lane:     5,
          nameRaw:  'Castillo, Amelia M',
          age:      11,
          team:     'KCY-NE',
          seedTime: '1:44.75',  // 'NT' if no seed time
        }
      ]
    }
  ]
}
```

### MatchCandidate (output of fuzzyMatcher.js)
```js
{
  swimmer:       { id: 1, firstName: 'Amelia', lastName: 'Castillo' },
  score:         100,       // 0–100, higher = better
  lastNameMatch: true,
}
```

### SheetMatch (one per unique sheet name — drives ConfirmView)
```js
{
  nameRaw:     'Castillo, Amelia M',
  normalized:  'Amelia Castillo',
  candidates:  [ MatchCandidate ],  // sorted: lastNameMatch first, then score
  appearances: [
    {
      eventNumber: 5,
      eventName:   '100m Backstroke',
      gender:      'Girls',
      ageGroup:    '12&Under',
      heat:        4,
      ofHeats:     5,
      startTime:   '09:44 AM',
      lane:        5,
      seedTime:    '1:44.75',
    }
  ],
  confirmed: null,  // set to Swimmer object or 'none' after parent confirms
}
```

### ConfirmedResult (saved to IndexedDB events table)
```js
{
  sessionId:   1,
  scannedAt:   Date,
  swimmerId:   1,
  firstName:   'Amelia',
  lastName:    'Castillo',
  eventNumber: 5,
  eventName:   '100m Backstroke',
  gender:      'Girls',
  ageGroup:    '12&Under',
  heat:        4,
  ofHeats:     5,
  startTime:   '09:44 AM',
  lane:        5,
  seedTime:    '1:44.75',
  nameOnSheet: 'Castillo, Amelia M',
}
```

---

## Out of Scope for MVP

- Time logging and personal best tracking
- Meet calendar and history
- Share extension / Gmail integration
- PDF import (add later — use pdf.js to rasterize pages, then OCR each)
- Multi-meet session management
- Any backend or server — 100% client-side

---

## How to Start a Claude Code Session

Paste this at the start of your Claude Code session:

```
I'm building a PWA called SwimHeat. I have a plan document that describes
the full tech stack, file structure, data shapes, and build order.

Please read SwimHeat_PWA_Plan.md in full before writing any code.

Then start with Phase 1:
- Scaffold the Vite + React project
- Install all dependencies listed in the package.json section of the plan
- Set up Tailwind CSS
- Create src/db.js with the Dexie schema exactly as specified
- Create src/purge.js with the 48-hour auto-purge logic
- Wire purgeExpiredSessions() into App.jsx

Then build RosterView:
- Mobile-friendly list of saved swimmers from IndexedDB
- Add form with first name + last name fields
- Swipe or tap to delete a swimmer
- "Scan Heat Sheet" button at the bottom (navigation only, no scanner yet)
- Tailwind styling, clean and minimal

Do not build the scanner or OCR pipeline yet.
Get the roster working end-to-end with real IndexedDB persistence first,
then stop and confirm before moving to Phase 2.
```

# SwimHeat — Learning-First Development Plan

This plan is designed for a developer who knows how to code but is new
to React and the web stack. Each milestone is small enough to complete
in a few hours, teaches one concept at a time, and produces something
real and working before moving on.

When you get stuck: paste the milestone and what you've tried into
Claude Code. Ask for the next step, not the whole solution.

---

## How to use this plan

- Work one milestone at a time
- Don't move on until the current milestone works end-to-end
- Commit to git after every milestone — forces you to think in units
- Keep a notes file (`NOTES.md`) of things that surprised you
- If stuck for more than 30 minutes: ask Claude Code for a hint on
  the specific problem, not "build this for me"

---

## What you'll learn by building SwimHeat

| Milestone | Concept learned |
|---|---|
| 1–2 | Vite, React basics, JSX, components |
| 3 | React state, forms, controlled inputs |
| 4 | IndexedDB with Dexie, async/await |
| 5 | React Router, multi-screen navigation |
| 6 | File input, Canvas API, image manipulation |
| 7 | WebAssembly in the browser (Tesseract.js) |
| 8 | Regex, text parsing, data transformation |
| 9 | Fuzzy string matching, algorithm thinking |
| 10 | Complex UI state, multi-step flows |
| 11 | Service workers, PWA, offline support |
| 12 | Vercel deployment, production build |

---

## Prerequisites (before milestone 1)

Install these once and they're done:

```bash
node --version    # need v18 or newer
npm --version     # comes with node
git --version     # for version control
```

If Node is missing: https://nodejs.org (download the LTS version)

Tools to have open:
- VS Code (or any editor you prefer)
- Chrome DevTools — F12, keep the Console tab visible while coding
- MDN Web Docs (https://developer.mozilla.org) — your reference for
  anything JavaScript or browser API related

---

## Milestone 1 — Scaffold the project

**Goal:** Get a React app running in the browser.
**Time:** 30–45 minutes
**You'll learn:** Vite, what JSX looks like, how React renders

```bash
npm create vite@latest swimheat-pwa -- --template react
cd swimheat-pwa
npm install
npm run dev
```

Open http://localhost:5173 — you should see the Vite + React starter page.

### What to do:
1. Open `src/App.jsx` — delete everything inside and replace with:
   ```jsx
   export default function App() {
     return <h1>SwimHeat</h1>
   }
   ```
2. Save — the browser updates instantly (this is HMR, hot module reload)
3. Open `src/main.jsx` — understand what it does (renders App into the DOM)
4. Delete `src/App.css` and `src/index.css` — you won't need them

### Done when:
Browser shows "SwimHeat" and you understand why.

### Commit:
```bash
git init
git add .
git commit -m "milestone 1: scaffold"
```

---

## Milestone 2 — Install dependencies and set up Tailwind

**Goal:** All packages installed, Tailwind working.
**Time:** 30–45 minutes
**You'll learn:** npm, package.json, Tailwind utility classes

```bash
npm install react-router-dom tesseract.js dexie fuse.js
npm install -D tailwindcss postcss autoprefixer vite-plugin-pwa
npx tailwindcss init -p
```

Configure Tailwind in `tailwind.config.js`:
```js
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: { extend: {} },
  plugins: [],
}
```

Add to `src/index.css` (create it):
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Import it in `src/main.jsx`:
```js
import './index.css'
```

Test it works — update App.jsx:
```jsx
export default function App() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-medium text-green-800">SwimHeat</h1>
      <p className="text-gray-500 mt-1">Swim meet companion</p>
    </div>
  )
}
```

### Done when:
"SwimHeat" appears in dark green with gray subtitle.

### What to explore:
- Try changing `text-2xl` to `text-4xl` — see what happens
- Try `text-green-500` vs `text-green-800` — understand the scale
- MDN: "CSS box model" if flexbox/spacing feels unfamiliar

### Commit:
```bash
git commit -am "milestone 2: tailwind + dependencies"
```

---

## Milestone 3 — Build the design system constants

**Goal:** Define the colors and shared styles used throughout the app.
**Time:** 20–30 minutes
**You'll learn:** JS modules, exporting constants, thinking in design tokens

Create `src/design.js`:
```js
// SwimHeat design tokens
// Teal is the only accent color — used for primary actions and confirmed states

export const colors = {
  tealDark:   '#0F6E56',   // primary buttons, lane badges, start times
  tealMid:    '#1D9E75',   // icons, active nav, last-name match tags
  tealLight:  '#E1F5EE',   // avatar backgrounds (teal), tag backgrounds
  tealText:   '#085041',   // text on teal light backgrounds

  blueLight:  '#E6F1FB',   // avatar background (blue)
  blueText:   '#0C447C',

  amberLight: '#FAEEDA',   // avatar background (amber)
  amberText:  '#633806',
}

// Assign a color to a swimmer based on their index in the roster
export const avatarColors = [
  { bg: colors.tealLight,  text: colors.tealText  },
  { bg: colors.blueLight,  text: colors.blueText  },
  { bg: colors.amberLight, text: colors.amberText },
  // Cycles back for 4th swimmer onward
]

export function getAvatarColor(index) {
  return avatarColors[index % avatarColors.length]
}

// Get initials from first + last name
export function getInitials(firstName, lastName) {
  return `${firstName[0]}${lastName[0]}`.toUpperCase()
}
```

### Done when:
You can import and use `getInitials('Amelia', 'Castillo')` → `'AC'`

### Commit:
```bash
git commit -am "milestone 3: design tokens"
```

---

## Milestone 4 — Build the RosterView (UI only, no database yet)

**Goal:** A working roster screen with hardcoded data and add/delete UI.
**Time:** 2–3 hours
**You'll learn:** React state (useState), list rendering, forms, events

Create `src/views/RosterView.jsx`:

Work through these steps in order:

**Step 4a — Static list**
Render a hardcoded list of swimmers. Don't use state yet.
```jsx
const swimmers = [
  { id: 1, firstName: 'Amelia', lastName: 'Castillo' },
  { id: 2, firstName: 'Emilia', lastName: 'Delsignore' },
]
```
Get the layout matching the design — avatar circle with initials,
name, delete icon. Use Tailwind classes.

**Step 4b — Add useState**
Move the array into `useState`. Understand why React needs this
instead of a plain variable.

**Step 4c — Delete**
Wire up the trash icon to remove a swimmer from state.
```jsx
function handleDelete(id) {
  setSwimmers(prev => prev.filter(s => s.id !== id))
}
```

**Step 4d — Add form**
Add first name + last name inputs and a save button.
Use a separate piece of state for the form fields.
On save: add to the swimmers array, clear the form.

**Step 4e — Validation**
Don't allow saving if either field is empty.
Show a subtle error message if they try.

**Step 4f — Scan button**
Add the teal "Scan heat sheet" button at the bottom.
It doesn't navigate anywhere yet — just console.log for now.

### Things to look up:
- "React useState hook" — MDN or React docs
- "React controlled components" — how form inputs work in React
- "Array filter in JavaScript" — for delete
- "React key prop" — why lists need a key

### Done when:
You can add and delete swimmers, the UI matches the design mockup,
and the scan button exists.

### Commit:
```bash
git commit -am "milestone 4: roster UI with state"
```

---

## Milestone 5 — Wire up IndexedDB with Dexie

**Goal:** Swimmers persist across page reloads.
**Time:** 1.5–2 hours
**You'll learn:** IndexedDB, async/await, useEffect, database concepts

Create `src/db.js`:
```js
import Dexie from 'dexie'

export const db = new Dexie('SwimHeatDB')

db.version(1).stores({
  swimmers: '++id, lastName, createdAt',
  sessions: '++id, scannedAt',
  events:   '++id, sessionId, scannedAt',
})
```

Create `src/purge.js`:
```js
import { db } from './db'

const EXPIRY_MS = 48 * 60 * 60 * 1000

export async function purgeExpiredSessions() {
  const cutoff = new Date(Date.now() - EXPIRY_MS)
  const expired = await db.sessions
    .where('scannedAt').below(cutoff).toArray()
  const ids = expired.map(s => s.id)
  if (ids.length === 0) return
  await db.events.where('sessionId').anyOf(ids).delete()
  await db.sessions.where('id').anyOf(ids).delete()
}
```

Update `RosterView.jsx` to:
- Load swimmers from IndexedDB on mount (useEffect)
- Save new swimmers to IndexedDB instead of just state
- Delete from IndexedDB on remove

```jsx
useEffect(() => {
  db.swimmers.orderBy('lastName').toArray().then(setSwimmers)
}, [])

async function handleAdd() {
  const id = await db.swimmers.add({
    firstName, lastName, createdAt: new Date()
  })
  setSwimmers(prev => [...prev, { id, firstName, lastName }])
}

async function handleDelete(id) {
  await db.swimmers.delete(id)
  setSwimmers(prev => prev.filter(s => s.id !== id))
}
```

### Things to look up:
- "React useEffect hook" — when and why to use it
- "JavaScript async/await" — how to handle promises
- Dexie docs: https://dexie.org/docs/Tutorial/React

### Done when:
Add a swimmer, refresh the page — it's still there.
Delete a swimmer, refresh — it's gone.

### Commit:
```bash
git commit -am "milestone 5: indexeddb persistence"
```

---

## Milestone 6 — Add React Router and navigation skeleton

**Goal:** Multiple screens, each at their own route.
**Time:** 1–1.5 hours
**You'll learn:** Client-side routing, URL-based navigation, layout components

Update `src/main.jsx`:
```jsx
import { BrowserRouter } from 'react-router-dom'
// wrap <App /> in <BrowserRouter>
```

Update `src/App.jsx`:
```jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import RosterView    from './views/RosterView'
import ScanView      from './views/ScanView'
import ProcessingView from './views/ProcessingView'
import ConfirmView   from './views/ConfirmView'
import ResultsView   from './views/ResultsView'

export default function App() {
  return (
    <div className="max-w-sm mx-auto min-h-screen">
      <Routes>
        <Route path="/"           element={<Navigate to="/roster" />} />
        <Route path="/roster"     element={<RosterView />} />
        <Route path="/scan"       element={<ScanView />} />
        <Route path="/processing" element={<ProcessingView />} />
        <Route path="/confirm"    element={<ConfirmView />} />
        <Route path="/results"    element={<ResultsView />} />
      </Routes>
    </div>
  )
}
```

Create stub components for each view (just an `<h1>` with the screen
name for now). Wire up the navigation:
- Roster "Scan heat sheet" button → `/scan`
- Bottom nav tabs → correct routes
- Back buttons → correct routes

Use `useNavigate()` hook for programmatic navigation.

### Done when:
Tapping "Scan heat sheet" takes you to the scan screen.
Back button returns you to roster.
Bottom nav works on every screen.

### Commit:
```bash
git commit -am "milestone 6: routing and navigation"
```

---

## Milestone 7 — Build the ScanView UI

**Goal:** Camera/upload options with the tips panel.
**Time:** 1–1.5 hours
**You'll learn:** File input API, reading files in the browser, state flow

Build `src/views/ScanView.jsx`:

**Step 7a — Two option buttons (camera + upload)**
```jsx
<input
  ref={cameraRef}
  type="file"
  accept="image/*"
  capture="environment"
  className="hidden"
  onChange={handleFileSelect}
/>
<input
  ref={uploadRef}
  type="file"
  accept="image/*"
  className="hidden"
  onChange={handleFileSelect}
/>
```
Two visible buttons that trigger the hidden inputs via `.click()`

**Step 7b — Image preview**
When a file is selected, show a preview using `URL.createObjectURL(file)`

**Step 7c — Proceed button**
A "Read this sheet" button that appears once an image is selected.
Navigates to `/processing` and passes the file somehow.

**Passing the file between screens:**
Files can't go in a URL. Options:
- Store in React state at the App level (prop drilling — simplest)
- Use React Context (cleaner — worth learning)
- Store the image as a blob URL in sessionStorage (pragmatic)

Recommended: try prop drilling first to understand the problem,
then refactor to Context. This teaches you *why* Context exists.

**Step 7d — Tips panel**
The four tips from the design: lighting, distance, angle, one page.

### Done when:
You can select a photo, see a preview, and tap a button to proceed.

### Commit:
```bash
git commit -am "milestone 7: scan view"
```

---

## Milestone 8 — Image preprocessing

**Goal:** Prepare the image for Tesseract before OCR runs.
**Time:** 1.5–2 hours
**You'll learn:** Canvas API, pixel manipulation, image transforms

Create `src/engine/ocr.js`:

Work through each step:

**Step 8a — Load the image onto a canvas**
```js
export async function preprocessImage(file) {
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  const ctx    = canvas.getContext('2d')
  // start with just drawing at original size
  canvas.width  = bitmap.width
  canvas.height = bitmap.height
  ctx.drawImage(bitmap, 0, 0)
  return canvas
}
```

**Step 8b — Cap at 2400px wide**
Add the scale calculation. Understand why: full iPhone photos are
4032px wide, Tesseract doesn't need that resolution and it's slow.

**Step 8c — Auto-rotate**
If `bitmap.height > bitmap.width` the photo is portrait — the heat
sheet is landscape, so rotate 90 degrees.
```js
ctx.translate(canvas.width / 2, canvas.height / 2)
ctx.rotate(Math.PI / 2)
ctx.drawImage(bitmap, ...)
```
This is fiddly — draw it on paper first to get the math right.

**Step 8d — Grayscale + contrast boost**
```js
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
for (let i = 0; i < imageData.data.length; i += 4) {
  const gray = 0.299 * imageData.data[i] +
               0.587 * imageData.data[i + 1] +
               0.114 * imageData.data[i + 2]
  const contrast = Math.min(255, Math.max(0, (gray - 128) * 1.4 + 128))
  imageData.data[i] = imageData.data[i+1] = imageData.data[i+2] = contrast
}
ctx.putImageData(imageData, 0, 0)
```

**Step 8e — Test it**
Add a temporary `<img>` to the DOM using `canvas.toDataURL()` to see
what the preprocessed image looks like before OCR.

### Things to look up:
- "Canvas API MDN" — drawImage, getImageData, putImageData
- "Image grayscale formula" — why those three weights (Luma formula)
- "Canvas rotate transform" — the translate-rotate-translate pattern

### Done when:
`preprocessImage(file)` returns a canvas that's grayscale, capped at
2400px, and correctly oriented.

### Commit:
```bash
git commit -am "milestone 8: image preprocessing"
```

---

## Milestone 9 — Run Tesseract OCR

**Goal:** Extract raw text with bounding boxes from the preprocessed image.
**Time:** 2–3 hours
**You'll learn:** WebAssembly libraries, workers, async progress callbacks

Add to `src/engine/ocr.js`:

```js
import { createWorker } from 'tesseract.js'

export async function runOCR(canvas, onProgress) {
  const worker = await createWorker('eng', 1, {
    logger: m => {
      if (m.status === 'recognizing text') {
        onProgress(Math.round(m.progress * 100))
      }
    }
  })

  const { data } = await worker.recognize(canvas)
  await worker.terminate()

  // Return words with normalized bounding box coordinates
  return data.words
    .filter(w => w.confidence > 20 && w.text.trim())
    .map(w => ({
      text:  w.text,
      normX: w.bbox.x0 / canvas.width,
      normY: w.bbox.y0 / canvas.height,
      conf:  w.confidence,
    }))
}
```

**Wire into ProcessingView:**
- Call `preprocessImage` then `runOCR`
- Update the step list as each stage completes
- Pass `onProgress` to update a progress bar or percentage

**Important:** Tesseract downloads `eng.traineddata` (~10MB) on first
run. Show a message like "Downloading language model (first time only)"
if it's loading. The logger `m.status` will be `'loading tesseract core'`
and `'loading language traineddata'` during this phase.

**Test it:**
`console.log(words)` and look at the output in DevTools. You should
see an array of word objects with text and coordinates.

### Things to look up:
- Tesseract.js docs: https://github.com/naptha/tesseract.js
- "Web Workers JavaScript" — Tesseract runs in a worker to avoid
  blocking the UI thread
- "WebAssembly MDN" — what WASM is and why it enables this

### Done when:
The processing screen shows progress, Tesseract runs, and you can see
raw word objects in the console.

### Commit:
```bash
git commit -am "milestone 9: tesseract OCR"
```

---

## Milestone 10 — Column splitting

**Goal:** Separate left and right column words using bounding box X.
**Time:** 1–1.5 hours
**You'll learn:** Array methods, sorting, grouping by proximity

Create `src/engine/columnSplitter.js`:

```js
export function splitColumns(words) {
  const left  = words.filter(w => w.normX < 0.50)
  const right  = words.filter(w => w.normX >= 0.50)
  return {
    left:  reconstructLines(left),
    right: reconstructLines(right),
  }
}

function reconstructLines(words) {
  // Group words that share approximately the same Y position
  const buckets = {}
  for (const w of words) {
    const key = Math.round(w.normY * 200)  // 200 buckets across height
    if (!buckets[key]) buckets[key] = []
    buckets[key].push(w)
  }
  // Sort buckets by Y (top to bottom), words within by X (left to right)
  return Object.keys(buckets)
    .map(Number).sort((a, b) => a - b)
    .map(key =>
      buckets[key]
        .sort((a, b) => a.normX - b.normX)
        .map(w => w.text)
        .join(' ')
    )
}
```

**Test it:**
Log `left` and `right` line arrays to the console. You should see
recognisable HyTek lines in each column separately.

### Things to learn:
- Why 0.50 as the midpoint — what happens if the sheet isn't centered?
  (Add a small tolerance if you spot issues: try 0.48)
- What `Math.round(y * 200)` does — discretises continuous Y values
  into 200 buckets to group nearby words into lines

### Done when:
Left column lines contain events starting with `#1`, `#2`, `#3`.
Right column contains the other events.

### Commit:
```bash
git commit -am "milestone 10: column splitting"
```

---

## Milestone 11 — HyTek parser

**Goal:** Turn raw lines into structured event/heat/swimmer objects.
**Time:** 2–3 hours (regex is fiddly — budget time)
**You'll learn:** Regular expressions, state machines, data transformation

Create `src/engine/hyTekParser.js`.

This is the most algorithmically interesting part of the project.
Work through the Python prototype logic and translate it line by line.

The regex patterns (same as Python, JS syntax):
```js
const EVENT_RE = /^#(\d+)\s+(Girls|Boys|Mixed)\s+([\w\s&]+?)\s+(\d{2,4})\s+(?:LC|SC|LCM|SCY|SCM)?\s*(?:Meter|Yard)?\s*(.+)/i

const HEAT_RE = /Heat\s+(\d+)\s*[oO0Zz]f\s*(\d+)(?:.*?Starts?\s+at\s+([\d:]+\s*(?:AM|PM)))?/i

const SWIMMER_RE = /^(\d)\s+([A-Z][A-Za-z'\-]+(?:\s+[A-Z][A-Za-z'\-]*)*,\s*[A-Z][A-Za-z'\-]+(?:\s+[A-Z])?)\s+(\d{1,2})\s+([A-Z]{2,8}-[A-Z]{2,4})\s*(NT|DQ|[\d]+:[\d.]+|[\d]+\.[\d]+)?/
```

The state machine pattern:
```js
export function parseColumn(lines) {
  const events = []
  let curEvent = null
  let curHeat  = null

  for (const raw of splitMergedLines(lines)) {
    const line = clean(raw)
    if (!line) continue

    // Test each regex in order
    // If EVENT_RE matches → new event, reset heat
    // If HEAT_RE matches → new heat within current event
    // If SWIMMER_RE matches → add swimmer to current heat
  }

  return events
}
```

**Step by step:**
1. Get the `clean()` and `splitMergedLines()` functions working first
2. Get event header parsing working — log each match
3. Add heat parsing
4. Add swimmer row parsing
5. Log the full `events` array — compare to the Python prototype output

### What to study:
- "JavaScript regular expressions MDN" — groups, flags, test vs match
- "Finite state machine" concept — that's what this parser is
- Test regex patterns at https://regex101.com — paste a line and see
  which groups match

### Done when:
`parseColumn(leftLines)` returns an array of event objects that matches
the structure defined in the PWA plan's state shapes section.

### Commit:
```bash
git commit -am "milestone 11: hytek parser"
```

---

## Milestone 12 — Fuzzy name matching

**Goal:** Score each sheet name against the roster and return candidates.
**Time:** 1.5–2 hours
**You'll learn:** Fuzzy search, algorithm scoring, data transformation

Create `src/engine/fuzzyMatcher.js`:

**Step 12a — Name normalisation**
```js
export function normalizeName(raw) {
  if (!raw.includes(',')) return raw
  const [last, rest] = raw.split(',')
  const first = rest.trim().split(' ')[0]
  return `${first} ${last.trim()}`
}
```

Test: `normalizeName("Castillo, Amelia M")` → `"Amelia Castillo"`

**Step 12b — Last name extraction**
```js
export function lastNameOf(raw) {
  return raw.includes(',')
    ? raw.split(',')[0].trim().toLowerCase()
    : raw.split(' ').pop().toLowerCase()
}
```

**Step 12c — Fuse.js integration**
```js
import Fuse from 'fuse.js'

export function getCandidates(nameRaw, roster) {
  const normalized = normalizeName(nameRaw)
  const sheetLast  = lastNameOf(nameRaw)

  const fuse = new Fuse(roster, {
    keys: ['fullName'],
    includeScore: true,
    threshold: 0.6,
    ignoreLocation: true,
  })

  return fuse.search(normalized)
    .map(r => ({
      swimmer:       r.item,
      score:         Math.round((1 - r.score) * 100),
      lastNameMatch: r.item.lastName.toLowerCase() === sheetLast,
    }))
    .filter(c => c.score >= 75 || (c.lastNameMatch && c.score >= 45))
    .sort((a, b) => (b.lastNameMatch - a.lastNameMatch) || (b.score - a.score))
}
```

**Step 12d — Build the SheetMatch array**
Walk all events/heats/swimmers, collect unique `nameRaw` values, run
`getCandidates` for each one. Return an array of `SheetMatch` objects
as defined in the PWA plan.

### Things to explore:
- What happens if you change `threshold: 0.6`? Try 0.4 and 0.8
- Why does Fuse score 0.0 = perfect but we display 100%? (Inverted)
- What does `token_sort_ratio` do differently than simple string match?

### Done when:
`getCandidates("Castillo, Amelia M", roster)` returns Amelia Castillo
at 100% as the first candidate with `lastNameMatch: true`.

### Commit:
```bash
git commit -am "milestone 12: fuzzy matcher"
```

---

## Milestone 13 — Wire the full pipeline

**Goal:** Scan → process → produce SheetMatch array ready for ConfirmView.
**Time:** 1.5–2 hours
**You'll learn:** Async state flow, passing data between screens

In `ProcessingView.jsx`, wire the full pipeline:
```
preprocessImage(file)
  → runOCR(canvas, onProgress)
    → splitColumns(words)
      → parseColumn(leftLines) + parseColumn(rightLines)
        → getCandidates(nameRaw, roster) for each unique swimmer
          → navigate to /confirm with SheetMatch array
```

**Passing data to ConfirmView:**
Use React Context or a simple state manager at the App level.
Create `src/context/ScanContext.jsx`:
```jsx
import { createContext, useContext, useState } from 'react'

const ScanContext = createContext(null)

export function ScanProvider({ children }) {
  const [matches, setMatches] = useState([])
  return (
    <ScanContext.Provider value={{ matches, setMatches }}>
      {children}
    </ScanContext.Provider>
  )
}

export const useScan = () => useContext(ScanContext)
```

Wrap `<App>` in `<ScanProvider>`. Set matches in ProcessingView,
read them in ConfirmView.

### Done when:
Processing a real heat sheet photo produces a `matches` array in
ConfirmView with the correct candidates per name.

### Commit:
```bash
git commit -am "milestone 13: full OCR pipeline"
```

---

## Milestone 14 — Build ConfirmView

**Goal:** Parent taps to confirm which roster swimmer matches each sheet name.
**Time:** 2–2.5 hours
**You'll learn:** Complex UI state, radio-style selection, conditional rendering

Build `src/views/ConfirmView.jsx`:

- Read `matches` from ScanContext
- One card per match (sheet name that produced candidates)
- Pre-select the first candidate (highest score / last name match)
- Tapping a candidate row selects it (deselects others in that card)
- "None of these" deselects all candidates
- "Confirm & see events" button: only enabled when all cards have a
  selection (including "none of these" as a valid selection)
- On confirm: build `ConfirmedResult` array from selected candidates
  + their appearances, save to IndexedDB, navigate to `/results`

**The selection state:**
```js
// Map from nameRaw → selected roster swimmer id, or 'none'
const [selections, setSelections] = useState(() =>
  Object.fromEntries(
    matches.map(m => [
      m.nameRaw,
      m.candidates[0]?.swimmer.id ?? 'none'  // pre-select best candidate
    ])
  )
)
```

### Done when:
You can confirm matches and the ResultsView shows the correct events
for each confirmed swimmer.

### Commit:
```bash
git commit -am "milestone 14: confirm view"
```

---

## Milestone 15 — Build ResultsView

**Goal:** Clean event list grouped by swimmer, with share button.
**Time:** 1.5–2 hours
**You'll learn:** Data grouping, Web Share API, conditional rendering

Build `src/views/ResultsView.jsx`:

- Load confirmed events from IndexedDB (latest session)
- Group by swimmer: `Object.groupBy(events, e => e.swimmerId)` or
  use a reduce if groupBy isn't available yet
- For each swimmer in the roster:
  - Show their events if found
  - Show "Not found on this sheet" if none confirmed
- Lane number as a teal badge (most important at-a-glance info)
- Start time in teal text
- "Today's scan · Auto-clears after 48 hrs" timestamp line
- Share button using Web Share API:
  ```js
  await navigator.share({
    title: 'SwimHeat — Today\'s events',
    text:  buildShareText(events),
  })
  ```

**Edge case: no scan yet**
If no session exists in IndexedDB (fresh install), show an empty state:
"No scan yet — tap Scan to read a heat sheet"

### Done when:
Results screen matches the design mockup, share button works on mobile
(Web Share API is mobile only — just hide/disable on desktop).

### Commit:
```bash
git commit -am "milestone 15: results view"
```

---

## Milestone 16 — PWA setup and full offline support

**Goal:** App installs to home screen and works completely offline at
the pool — including the scanner.
**Time:** 2–3 hours
**You'll learn:** Service workers, Workbox caching, PWA manifest,
offline-first architecture

Pool venues have terrible cell signal. Every feature must work with
zero internet after the first load on WiFi. This milestone makes
that happen.

---

### Step 16a — PWA manifest and icons

Create app icons:
- Use https://favicon.io or any image editor
- Need 192×192 and 512×512 PNG files
- Save to `public/icons/icon-192.png` and `public/icons/icon-512.png`

Update `vite.config.js` with the full VitePWA config from the
PWA plan, including the Workbox runtime caching rules that cache
Tesseract's CDN assets.

---

### Step 16b — Pre-warm Tesseract on app load

This is the most important offline fix. Tesseract downloads its
language file (`eng.traineddata`, ~10MB) from a CDN the first time
OCR runs. If a parent opens the app for the first time at the pool
with no signal, that download fails and scanning is broken.

The solution: silently download and cache it in the background when
the app first loads, while the parent is still on WiFi.

Create `src/engine/warmup.js`:

```js
import { createWorker } from 'tesseract.js'

let warmed = false

export async function warmupTesseract() {
  if (warmed) return
  try {
    const worker = await createWorker('eng', 1)
    await worker.terminate()
    warmed = true
  } catch (e) {
    // No internet yet — silently skip, retry next open
    console.warn('Tesseract warmup skipped:', e.message)
  }
}
```

Add to `App.jsx` — fire after 3 seconds so it doesn't compete with
the initial render:

```jsx
useEffect(() => {
  purgeExpiredSessions()
  const timer = setTimeout(warmupTesseract, 3000)
  return () => clearTimeout(timer)
}, [])
```

---

### Step 16c — "Works offline" first-visit banner

Show this banner once on first visit, then never again:

```
Works offline at the pool
Open once on WiFi before the meet to
download the scanner (~10MB).        [Got it]
```

```jsx
// src/components/OfflineBanner.jsx
import { useState } from 'react'

export default function OfflineBanner() {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('offline-ready') === 'true'
  )

  if (dismissed) return null

  function dismiss() {
    localStorage.setItem('offline-ready', 'true')
    setDismissed(true)
  }

  return (
    <div className="mx-4 mt-3 p-3 bg-green-50 border border-green-200
                    rounded-xl flex items-start gap-3">
      <i className="ti ti-wifi text-green-700 mt-0.5" aria-hidden="true" />
      <div className="flex-1">
        <p className="text-sm font-medium text-green-900">
          Works offline at the pool
        </p>
        <p className="text-xs text-green-700 mt-0.5">
          Open once on WiFi before the meet to download the scanner (~10MB).
        </p>
      </div>
      <button onClick={dismiss}
              className="text-xs text-green-700 font-medium whitespace-nowrap">
        Got it
      </button>
    </div>
  )
}
```

Show it at the top of `RosterView`.

---

### Step 16d — Graceful offline error in ProcessingView

If Tesseract fails because it hasn't been warmed up yet, show a
helpful message instead of a generic error:

```js
try {
  const words = await runOCR(canvas, onProgress)
} catch (err) {
  if (!navigator.onLine) {
    setError(
      'The scanner needs to download once on WiFi first. ' +
      'Connect to WiFi, open the app, and wait a few seconds — ' +
      'then you can scan offline.'
    )
  } else {
    setError('Scan failed — please try again or retake the photo.')
  }
}
```

---

### Step 16e — Build and test offline

```bash
npm run build
npm run preview   # production build locally (service worker active)
```

**Offline test checklist (do this before milestone 17):**

- [ ] Open app on WiFi — banner appears
- [ ] Wait 5 seconds — Tesseract warms up silently in background
- [ ] Dismiss banner
- [ ] Turn on airplane mode
- [ ] Reload page — app loads from service worker cache
- [ ] Add a swimmer — works (IndexedDB)
- [ ] Tap Scan, select a photo — reaches processing screen
- [ ] OCR runs successfully — Tesseract was cached
- [ ] Confirm and see results — works
- [ ] Share results — works (Web Share API)

If OCR fails in airplane mode: the warmup didn't complete before
you disconnected. Reconnect to WiFi, reopen the app, wait 10 seconds,
then try airplane mode again.

---

### What each feature needs offline

| Feature | Works offline? | Why |
|---|---|---|
| View roster | ✓ always | IndexedDB |
| Add / delete swimmers | ✓ always | IndexedDB |
| Camera / photo upload | ✓ always | Device hardware |
| Image preprocessing | ✓ always | Canvas API |
| Tesseract OCR | ✓ after warmup | Cached WASM + language file |
| HyTek parsing | ✓ always | Pure JS |
| Fuzzy matching | ✓ always | Fuse.js bundled |
| View results | ✓ always | IndexedDB |
| Share results | ✓ always | Web Share API |

---

### Things to look up:
- "Service worker lifecycle MDN" — install, activate, fetch events
- "Workbox CacheFirst strategy" — serves from cache, updates in background
- "navigator.onLine MDN" — detect network status in JS
- "PWA offline cookbook" — Jake Archibald's definitive guide

### Commit:
```bash
git commit -am "milestone 16: PWA + full offline support"
```

---

## Milestone 17 — Deploy to GitHub Pages

**Goal:** Live URL on your own domain, $0 hosting, auto-deploys on every push.
**Time:** 1–1.5 hours
**You'll learn:** GitHub Actions, CI/CD, DNS, custom domains, SSL

Total ongoing cost: **one domain, ~$10–20/year**. Everything else is free.

---

### Step 17a — Choose and buy a domain

**Recommended registrars (cheapest to most expensive):**

| Registrar | Price/yr | Notes |
|---|---|---|
| Cloudflare Registrar | ~$9–10 | Wholesale cost, no markup, best long-term value |
| Namecheap | ~$10–12 | Simple, no upsell pressure |
| Google Domains (now Squarespace) | ~$12–15 | Easy UI, slightly pricier |

**Recommended TLDs for SwimHeat:**

| Domain | Cost/yr | Notes |
|---|---|---|
| `swimheat.app` | ~$15–20 | Perfect fit, enforces HTTPS |
| `swimheat.dev` | ~$12–15 | Clean, dev-friendly |
| `swimheat.com` | ~$10–15 | Most recognisable |

**Recommendation:** Register at Cloudflare — they sell domains at
wholesale cost with no markup and include free DNS management, DDoS
protection, and analytics. You'll never find cheaper.

Check availability at https://www.cloudflare.com/products/registrar/

---

### Step 17b — Configure `vite.config.js` for your domain

Since your app will live at the root of your custom domain (not a
subfolder), set `base` to `/`:

```js
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/',   // root — correct for a custom domain
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
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,wasm,traineddata}'],
        runtimeCaching: [{
          urlPattern: /tesseract/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'tesseract-cache',
            expiration: { maxAgeSeconds: 60 * 60 * 24 * 30 },
          },
        }],
      },
    }),
  ],
})
```

---

### Step 17c — Set up GitHub Actions for automatic deployment

Create this file exactly at `.github/workflows/deploy.yml`:

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
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm install

      - name: Build
        run: npm run build

      - name: Deploy to gh-pages branch
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

**What this does:** every time you push to `main`, GitHub runs this
workflow automatically — installs dependencies, builds the project,
and pushes the `dist/` folder to a `gh-pages` branch. No manual steps.

---

### Step 17d — Enable GitHub Pages in your repo settings

1. Push your code (including the workflow file) to GitHub
2. Go to your repo → **Settings** → **Pages**
3. Under "Source" → select **Deploy from a branch**
4. Branch: `gh-pages` / folder: `/ (root)` → **Save**

GitHub will give you a URL like `https://yourusername.github.io/swimheat-pwa/`
— this works immediately but you'll replace it with your custom domain next.

---

### Step 17e — Add DNS records at your registrar

In your domain registrar's DNS settings, add these records:

```
Type    Name    Value                   Notes
A       @       185.199.108.153         GitHub Pages IP
A       @       185.199.109.153         GitHub Pages IP
A       @       185.199.110.153         GitHub Pages IP
A       @       185.199.111.153         GitHub Pages IP
CNAME   www     yourusername.github.io  Redirects www → your site
```

If using Cloudflare DNS, set the proxy status to **DNS only** (grey
cloud, not orange) for the A records — GitHub Pages handles SSL itself.

---

### Step 17f — Add your custom domain to GitHub Pages

1. Go to your repo → **Settings** → **Pages**
2. Under "Custom domain" → type your domain (e.g. `swimheat.app`) → **Save**
3. GitHub automatically creates a `CNAME` file in your repo — commit it
4. Check **Enforce HTTPS** — GitHub provisions a free SSL certificate
   via Let's Encrypt automatically

**DNS propagation** takes anywhere from a few minutes (Cloudflare) to
48 hours (other registrars). You can check progress at
https://dnschecker.org — search your domain and watch the A records
appear globally.

---

### Step 17g — Verify everything works

Once DNS propagates:

```
https://swimheat.app          → your app, full-screen PWA
https://www.swimheat.app      → redirects to above
http://swimheat.app           → redirects to HTTPS automatically
```

**Full test checklist:**
- [ ] Open `https://swimheat.app` in Safari on iPhone
- [ ] Add a swimmer — persists on reload
- [ ] Tap "Scan heat sheet" → scan flow works
- [ ] Share → Add to Home Screen → opens full-screen
- [ ] Turn on airplane mode → app still loads and OCR still runs
- [ ] Push a small change to `main` → GitHub Action redeploys
      automatically (check the Actions tab in your repo)

### Commit:
```bash
git add .github/workflows/deploy.yml
git commit -m "milestone 17: github pages + custom domain"
git push
```

Watch the **Actions** tab in your GitHub repo — you'll see the
workflow run in real time. Green checkmark = deployed.

🎉 SwimHeat is live at your own domain, costs ~$10–20/year, and
auto-deploys every time you push to main.

---

### Cost summary

| Item | Cost |
|---|---|
| Domain (~swimheat.app) | ~$15–20/year |
| GitHub (repo + Actions + Pages) | Free |
| Hosting | Free |
| SSL certificate | Free (Let's Encrypt via GitHub) |
| CI/CD (auto-deploy) | Free |
| **Total** | **~$15–20/year** |

---

## When to ask Claude Code for help

**Good uses:**
- "I'm stuck on [specific thing] in milestone X. Here's what I've tried: [code]. What am I missing?"
- "My regex isn't matching this line: [example]. Here's my pattern: [regex]. What's wrong?"
- "I got this error: [error message]. Here's the relevant code: [snippet]. What does it mean?"
- "I finished milestone X and it works. Can you review this file and tell me if anything looks off?"
- "I want to understand [concept] better. Can you explain it with a simple example?"

**Avoid:**
- "Build milestone X for me"
- "Write the whole parser"
- Pasting a milestone and asking for the completed code

The goal is understanding, not output.

---

## What comes after the MVP

Once all 17 milestones are done and deployed, these are natural next
features to tackle as your skills grow:

**Beginner next steps:**
- Edit a swimmer's name (introduces forms in edit mode)
- Multiple photos per scan (array of files, merge parsed results)
- Better empty states and loading skeletons

**Intermediate next steps:**
- Time logging — log official times after each race
  (introduces more complex Dexie queries)
- Personal best tracking (introduces derived data + comparisons)
- Results filtering by swimmer

**Advanced next steps:**
- PDF import using pdf.js (render PDF pages to canvas, then OCR)
- Gmail share extension
- Migrate to native iOS using the same parser logic

---

## Reference files

Keep these open while building:

| File | Purpose |
|---|---|
| `SwimHeat_PWA_Plan.md` | Full tech spec and data shapes |
| `SwimHeat_MVP_Plan.md` | Original iOS plan (parser logic reference) |
| `parser.py` | Proven Python prototype — reference for JS translation |
| `SwimHeat_Full_Plan.md` | Original product plan and feature decisions |

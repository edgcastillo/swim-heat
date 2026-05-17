# SwimHeat

A Progressive Web App for swim meet parents. Scan a heat sheet, select your swimmers, and instantly see every event they're in — heat number, lane, seed time, and estimated start time — all in one place.

Works fully offline at the pool after the first load.

## What it does

1. **Roster** — save the swimmers you want to track
2. **Scan** — photograph one or more pages of a heat sheet
3. **Confirm** — review OCR matches and confirm which names are your swimmers
4. **Results** — see all events grouped by swimmer, sorted by event number

## Tech stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- Tesseract.js — client-side OCR via WebAssembly (no server needed)
- Dexie — IndexedDB wrapper for local roster and session storage
- Fuse.js — fuzzy name matching between OCR output and saved roster
- React Router — client-side navigation
- vite-plugin-pwa — service worker and offline support

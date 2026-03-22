# islamicatlas.org — Session 23 Prompt

## Project
**Islamic Dynasties Atlas** v6.5.0 — React/Vite/Leaflet/D3 interactive historical atlas  
**Repo**: `github.com/alicetinkaya76/islamic-civilization-atlas`  
**Live**: `islamicatlas.org`

## What Was Done (Session 22 → v6.5.0)

### 1. Dark/Light Theme System
- Full RGB CSS variable architecture in `src/styles/theme.css`
- Variables: `--bg-rgb`, `--gold-rgb`, etc. with alpha shortcuts (`--gold-10`, `--gold-25`)
- `data-theme="dark|light"` on `<html>`, inline FOUC-prevention script in `index.html`
- `ThemeToggle.jsx` component with animated switch, localStorage persistence
- Integrated in header (desktop) and slide-in menu (mobile)
- 50+ `[data-theme="light"]` selectors covering ALL panels in `session22.css`

### 2. Brill EI-1 Panel (#ei1 tab)
New full panel mirroring DIA architecture:
- **Data**: `ei1_lite.json` (7,568 entries), `ei1_works.json` (450 works), `ei1_relations.json` (195 xrefs)
- **Components** in `src/components/ei1/`:
  - `Ei1View.jsx` — main orchestrator, lazy analytics
  - `Ei1Sidebar.jsx` — virtual-scrolled list, search, field/type/century/confidence filters, bio-only toggle
  - `Ei1IdCard.jsx` — detail card: type badge, dates, fields, madhab, dynasty, EI¹ author, confidence meter, works, cross-refs
  - `Ei1StatsPanel.jsx` — 4 summary cards, century chart, type breakdown, top fields, top authors
  - `Ei1Analytics.jsx` — 5 canvas charts (century/fields/volumes/authors/types)
  - `ei1Constants.js` — field colors, normalization, utility functions
- **Styles**: `src/styles/ei1.css` (500+ lines, full responsive)
- **i18n**: Full TR/EN/AR (28 keys per language)
- **Routing**: Tab in header, BottomTabBar secondary, hash `#ei1`, swipe order

### 3. Mobile Polish
- Glass-morphism bottom tab bar with active indicator dot
- Haptic-feel press states (scale 0.97)
- Glass blur on slide-in menu and bottom sheet
- Safe-area-inset padding for notched phones
- `prefers-reduced-motion` support
- Theme-aware range sliders, checkboxes, scrollbars

## File Inventory (new/modified)

### New Files
```
src/styles/theme.css                    — Dark/Light RGB variable system
src/styles/ei1.css                      — EI-1 panel styles (500+ lines)
src/styles/session22.css                — Light theme overrides + mobile polish
src/components/shared/ThemeToggle.jsx   — Theme toggle component
src/components/ei1/Ei1View.jsx          — Main EI-1 view
src/components/ei1/Ei1Sidebar.jsx       — Sidebar with virtual list
src/components/ei1/Ei1IdCard.jsx        — Detail card
src/components/ei1/Ei1StatsPanel.jsx    — Stats dashboard
src/components/ei1/Ei1Analytics.jsx     — Canvas charts
src/components/ei1/ei1Constants.js      — Colors, normalizer, utilities
public/data/ei1_lite.json              — 7,568 entries (1.4MB)
public/data/ei1_works.json             — 450 works
public/data/ei1_relations.json         — 195 cross-references
```

### Modified Files
```
index.html           — data-theme="dark" default + FOUC script
src/main.jsx         — theme.css, ei1.css, session22.css imports
src/App.jsx          — ThemeToggle import, Ei1View lazy import, ei1 tab + routing
src/data/i18n.js     — ei1 in tabs{} + full ei1{} section (TR/EN/AR)
src/components/shared/BottomTabBar.jsx — EI-1 in SECONDARY_TABS
CHANGELOG.md         — v6.5.0 entry
package.json         — version 6.5.0
```

## Possible Session 23 Tasks

### A. EI-1 Enrichment
1. **EI-1 Map view**: Geocode birth/death places → Leaflet cluster map (like DiaMap)
2. **EI-1 Network**: Build teacher-student or cross-reference network (like DiaNetwork with D3 force)
3. **EI-1 ↔ DIA cross-reference**: Match EI-1 headwords to DIA scholars (fuzzy matching pipeline)
4. **EI-1 ↔ al-A'lâm cross-reference**: Match to Zirikli entries

### B. Header & Navigation Redesign (PRIORITY)
1. **Sophisticated header**: Current header is overcrowded with 10+ tabs + toggle + lang buttons. Redesign with grouped navigation, collapsible tab groups, or mega-menu pattern
2. **Language toggle visibility**: TR/EN/AR buttons pushed off-screen by EI-1 tab + ThemeToggle. Need to either integrate into a compact dropdown or ensure visibility
3. **Theme-aware Leaflet tiles**: Switch map basemap between dark/light tile layers on theme change
4. **Light theme fine-tuning**: Map tiles, D3 force graphs, Leaflet popups, admin panel

### C. Mobile Deep Polish
1. Pull-to-refresh gesture
2. Haptic feedback via Vibration API
3. PWA splash screen with theme colors
4. Offline-first data caching strategy

### D. DİA Session 17 Tasks (from earlier plan)
1. DİA teacher-student network tab (#dia with 10,506 edges)
2. Prompt saved to outputs from prior session

## Hotfixes Applied (v6.5.0.1)
- **base.css**: Removed hardcoded `:root` color vars that were overriding theme.css
- **Ei1IdCard.jsx**: Moved `useMemo` hooks above conditional `if (!bio)` return — fixes React error #310
- **DiaIdCard.jsx**: Same hooks-before-return fix
- **AlamIdCard.jsx**: Same hooks-before-return fix

## Architecture Notes
- **Theme system**: All colors via `rgb(var(--xxx-rgb))` pattern — use `rgba(var(--xxx-rgb), alpha)` for transparency
- **EI-1 data format**: Matches DIA lite pattern (`id`, `t`, `ds`, `bc/dc/bh/dh`, `fl`, `is` etc.)
- **Lazy loading**: All heavy panels use `React.lazy()` + `Suspense`
- **Virtual scrolling**: Both DIA and EI-1 sidebars use custom virtual list for 7K+ items
- **i18n**: All EI-1 strings in `t.ei1` object (same pattern as `t.dia`)

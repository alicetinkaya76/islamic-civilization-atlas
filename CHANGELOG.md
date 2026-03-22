# Changelog

All notable changes to the Islamic Dynasties Atlas are documented in this file.

## [6.5.3.0] - 2026-03-22 — Session 26

### Fixed
- **Header Duplication (CRITICAL)**: Desktop header items were appearing twice because `header-right` (mobile drawer) remained visible. Root cause: CSS child selectors (`.header-right > .export-btn`) failed on wrapped elements (`.export-wrap > .export-btn`). Fix: single rule `header-right { display: none !important }` at `min-width: 769px`.

### Removed
- **CSV/Export Button**: Removed `ExportButton` from both `header-utils` (desktop) and `header-right` (mobile drawer). Import removed from `App.jsx`. Component file retained for potential future use.

### Added
- **Enriched About Modal**: Complete rewrite of `AboutModal.jsx` with project statistics grid (186 dynasties, 13,940 al-Aʿlām, 8,528 DİA, 7,568 EI-1, 12,954 Muʿjam), detailed data sources table, author cards with ORCID links for both Gökalp and Çetinkaya, institutional affiliations (Selçuk Üniversitesi, Kapsül Teknoloji), technology stack tags, version badge, GitHub link, CC BY-NC 4.0 license bar. New `about.css` with responsive layout (3-col stats → mobile stack). Light/dark theme support.
- **Quiz: Timer System**: 15-second countdown per question with animated progress bar. Timer turns red + pulses at ≤5 seconds. Auto-timeout with "Time's up!" feedback. Speed bonus scoring: +3 pts (≥13s), +2 pts (≥10s), +1 pt (base).
- **Quiz: Streak Counter**: Live streak indicator (🔥) appears at ≥2 consecutive correct answers with bounce animation. Max streak tracked and displayed in results.
- **Quiz: Category Selection**: 5 categories in menu — Mixed (🎲), Dynasty (🏛), Battles (⚔️), Scholars (📚), Geography (🌍). Each filters question generators to relevant subset.
- **Quiz: Enhanced Results**: Score breakdown with points + max streak. Wrong answers review section (top 3 missed questions with correct answers). Share button copies formatted score text to clipboard.
- **Quiz: Score Persistence**: High scores saved to localStorage (top 10).
- **Dashboard: Data Sources Comparison**: New full-width card with 4 source cards (al-Aʿlām, DİA, EI-1, Muʿjam) showing entry counts, descriptions, century scope, click-to-navigate.
- **Dashboard: Changelog Card**: Recent 3 versions with bullet points, version badges.

### Changed
- **Map Legend Redesign**: Repositioned from bottom-right to bottom-left. Increased font size (11→13px), swatch size (14→16px). Added count badges per entity type. Semi-transparent backdrop with blur. Improved toggle icon (🗺 collapsed, ✕ expanded). Light theme support. Mobile-optimized width (200px).
- `session23.css`: Replaced 10-line desktop hiding rules with single `header-right { display: none !important }`.
- `quiz.css`: Added ~120 lines for timer, streak, categories, review, timeout styles.
- `dashboard.css`: Added ~90 lines for source cards grid and changelog.
- `legend.css`: Full rewrite with improved spacing, backdrop blur, count badges.
- `package.json`: Version → 6.5.3.0.

## [6.5.2.1] - 2026-03-22 — Session 25

### Added
- **DİA Network: Ego-Network Mode**: Toggle "Ego Ağı" checkbox, select a scholar → only their 1-hop or 2-hop neighborhood is shown. Ego badge shows scholar name + node count. Labels auto-show for small ego graphs (<60 nodes).
- **DİA Network: Community Detection**: Label propagation algorithm detects communities in real-time. New "Topluluk" color option with 12 distinguishable colors. Tooltip shows community ID on hover.
- **DİA Network: Geographic Layout**: New "Coğrafi" view mode pins geo-located scholars (60% coverage, 2,081 of 3,463 nodes) to lat/lon coordinates. Un-geolocated nodes drift to center. Faint grid lines for orientation. Drag disabled in geo mode to preserve positions.
- **DİA Sankey Diagram**: New 🔀 "Akış" subView — field-to-field teacher→student flow visualization. D3 SVG Sankey with bezier paths, hover highlights, tooltip showing flow counts. Min-flow threshold slider. 150 unique field pairs, dominated by fıkıh→fıkıh (1,015), hadis→fıkıh (387), fıkıh→hadis (378).
- **DiaSankey.jsx**: Custom Sankey layout (no d3-sankey dependency). Source/target node bars, bezier link paths, theme-aware rendering.

### Changed
- `DiaNetwork.jsx`: Major rewrite — added `detectCommunities()` (label propagation), `getEgoNeighbors()` (N-hop BFS), geo layout mode with coordinate pinning. New props: `geoData`. New state: `egoMode`, `egoHops`, `colorBy: 'community'`, `viewMode: 'geo'`.
- `DiaView.jsx`: Added `DiaSankey` lazy import. 5 subViews: Liste/Harita/Ağ/Akış/Analitik. Passes `geoData` prop to DiaNetwork.
- `dia.css`: Added ego badge, checks-row, sankey container/controls/SVG styles with light theme overrides (~25 lines).
- `package.json`: Version → 6.5.2.1.

## [6.5.2.0] - 2026-03-22 — Session 24

### Added
- **EI-1 Map View**: Geocoded 474 birth/death place entries (427 unique scholars) from Brill EI-1 biographies. Leaflet cluster map with field-colored markers, theme-aware tiles, fly-to-selected, tooltips with place names. `Ei1Map.jsx` component following DiaMap pattern.
- **EI-1 Network View**: D3 force-directed graph with 4,864 edges across 1,095 nodes. Three edge types: Same Author (4,418 — Brill contributors like Cl. Huart, W. Barthold connecting their articles), Same Place (378 — geographic co-location of scholars), Cross-Reference/Teacher-Student (68 — resolved from headword fuzzy matching). `Ei1Network.jsx` with canvas rendering, drag, zoom, tooltip, theme-aware colors.
- **ei1_geo.json**: 474 geocoded entries with coordinates, place source (bp/dp), and place name. Comprehensive gazetteer covering ~390 historical Islamic places with Brill romanization variants.
- **Enhanced ei1_relations.json**: Rebuilt from 195 sparse cross-refs to 4,864 unique edges. Fuzzy-matched 69 xrefs (from 10 resolved), generated author-network and geo-co-location edges.
- **EI-1 Network CSS**: Full dark/light theme styling for controls, canvas, tooltip, legend, mobile responsive with collapsible controls panel.
- **EI-1 Map CSS**: Dark/light theme map styling, zoom controls, info badge, cluster/marker/tooltip styles.

### Changed
- `Ei1View.jsx`: Added Map (🗺) and Network (🕸) subView buttons. Lazy-loads `Ei1Map` and `Ei1Network`. Loads `ei1_geo.json` via `useAsyncData`. Mobile toggle updated for new view icons.
- `ei1.css`: Added ~100 lines for map container, markers, clusters, tooltips, network controls, canvas, legend, with light theme overrides and mobile breakpoints.
- `package.json`: Version → 6.5.2.0.

## [6.5.1.0] - 2026-03-22 — Session 23

### Added
- **Header Redesign (B1)**: Replaced overcrowded 10-tab flat header with grouped dropdown navigation. Two dropdown menus: "📚 Sources" (al-Aʿlām, DİA, EI-1, Mu'cem) and "📊 Analysis" (Timeline, Causality, Scholars, Battles). Map & Dashboard remain as direct tabs. Hover-to-open with click fallback. Preloads data on hover.
- **Language Dropdown (B2)**: Replaced 3 inline language buttons (TR/EN/AR) with compact dropdown showing current flag + code. Saves horizontal space in header.
- **NavDropdown & LangDropdown**: Reusable dropdown components with outside-click-to-close, hover timing, and keyboard-accessible `role="menu"`.
- **Header Utilities Cluster**: Quiz, Glossary, Progress, Export, About, ThemeToggle, Language, and Admin compacted into icon-button row (`header-utils`).
- **Theme-aware Leaflet tiles (B3)**: CartoDB `dark_all` ↔ `light_all` tile layer swap on theme change via `themechange` CustomEvent. `tileUrlLight` added to `MAP_CONFIG`.
- **Light theme: Leaflet popups (B4)**: Full popup restyling for light mode (`.p-title`, `.p-k`, `.p-v`, `.p-narr`, `.p-ruler-row`, `.p-vis` etc.)
- **Light theme: D3 Force Graph (B4)**: DiaNetwork canvas render now reads `data-theme` and adjusts link colors, arrow fills, node strokes, and label colors for light mode. Listens for `themechange` to re-render.
- **Light theme: Admin panel (B4)**: `.admin-panel`, `.admin-sidebar`, `.admin-card`, `.admin-input`, `.admin-table` all styled for light theme.
- **Light theme: Map controls (B4)**: `.map-panel`, range sliders, checkboxes, selects, Leaflet zoom controls, attribution.
- **Light theme: All panels (B4)**: Dashboard, Footer, Alam/Yaqut/DIA/EI-1 sidebars+cards, Battle, Timeline, Causal, Search bar, Quiz, Modals, BottomSheet, Stats panels.
- **session23.css**: 300+ lines of light theme overrides and header redesign styles.

### Changed
- `ThemeToggle.jsx`: Now dispatches `CustomEvent('themechange')` with `{ detail: { theme } }`.
- `layers.js`: `MAP_CONFIG` now includes `tileUrlLight` for CartoDB light tiles.
- `MapView.jsx`: Initializes tile layer based on current theme; swaps on `themechange` via `tileLayer.setUrl()`.
- `DiaNetwork.jsx`: Canvas render checks `data-theme` attribute for all hardcoded colors.
- `App.jsx`: Desktop header refactored with `NavDropdown` + `LangDropdown` + `header-utils`. Old flat tabs preserved in hamburger drawer for mobile/tablet.
- `main.jsx`: Added `session23.css` import.
- `package.json`: Version → 6.5.1.0.

## [6.5.0] - 2026-03-21

### Added
- **Dark/Light Theme System**: Full RGB CSS variable architecture (`--bg-rgb`, `--gold-rgb` etc.) with Tailwind-compatible alpha shortcuts. `data-theme="dark|light"` on `<html>`. Inline script in `index.html` prevents FOUC.
- **ThemeToggle Component**: Animated toggle switch with moon/sun icons, localStorage persistence, smooth 350ms cross-fade via `.theme-transitioning` class. Compact mode for mobile menu.
- **Brill EI-1 Panel** (`#ei1` tab): Full Encyclopaedia of Islam First Edition panel mirroring DIA architecture:
  - `Ei1View` — main orchestrator with lazy-loaded analytics
  - `Ei1Sidebar` — virtual-scrolled list (7,568 entries), search, field/type/century/confidence filters, bio-only toggle
  - `Ei1IdCard` — detail card with article type badge, dates, fields, madhab, dynasty/region, EI¹ author, confidence meter, works, cross-references
  - `Ei1StatsPanel` — 4 summary cards, century distribution mini-chart, article type breakdown, top fields, top EI¹ authors
  - `Ei1Analytics` — 5 interactive canvas charts (century, fields, volumes, authors, types) with theme-aware colors
  - `ei1Constants.js` — field colors, normalization, century calculation
- **EI-1 Data Files**: `ei1_lite.json` (7,568 entries, 1.4MB), `ei1_works.json` (306 scholars, 450 works), `ei1_relations.json` (195 cross-references)
- **i18n**: Full TR/EN/AR translations for EI-1 panel (28 keys per language)
- **Mobile Tab Bar**: EI-1 added to secondary tabs in BottomTabBar

### Changed
- **Light theme compatibility**: 50+ `[data-theme="light"]` selectors covering DIA, Alam, Yaqut, Dashboard, Timeline, Quiz, Causal, Scholars, Battles, Map sidebar, SearchBar, Footer, Modals, Landing
- **Bottom Tab Bar polish**: Glass-morphism backdrop, active indicator dot animation, refined press feedback
- **Mobile UX**: Haptic-feel `scale(0.97)` press states, glass blur on slide-in menu and bottom sheet, safe-area-inset padding for notched phones, `prefers-reduced-motion` support
- **Theme-aware inputs**: Custom range slider and checkbox styling using `var(--gold)`, scrollbar colors via CSS variables
- Package version → 6.5.0

### Technical
- `theme.css` — 200+ lines: dark/light palettes with RGB triplets, alpha shortcuts, composed vars
- `session22.css` — 300+ lines: light theme overrides for all panels, polished mobile interactions
- `ei1.css` — 500+ lines: full responsive panel styles with mobile breakpoints
- 6 new JSX components + 1 JS constants module in `src/components/ei1/`
- `ThemeToggle.jsx` in `src/components/shared/`
- 3 new JSON data files in `public/data/`
- No new dependencies

## [6.4.0] - 2026-03-18

### Added
- **Map Filter Bottom Sheet** (GÖREV 3B): Map filter panel opens as a draggable bottom sheet on mobile instead of a left-drawer sidebar; FAB (floating action button) on map for triggering
- **FilterPanel 2-column grid**: Layer toggles displayed in 2-column grid inside bottom sheet for easier touch access
- **Skeleton Loader** (GÖREV 5D): New `SkeletonLoader` component with shimmer animation in 4 variants (list, card, chart, map); replaces spinner-only LazyLoader in AlamView and YaqutView
- **Swipe Tab Navigation** (GÖREV 7): Horizontal swipe gesture on main content area to navigate between tabs on mobile; `useSwipeGesture` hook with configurable threshold and vertical drift limit
- **Collapsible IdCard sections** (GÖREV 4): AlamIdCard relations/works/places and YaqutIdCard events/persons/cross-refs now have toggle buttons to expand/collapse, reducing scroll length on mobile

### Changed
- **Alam Analytics mobile** (GÖREV 4): Horizontal scroll for analytics sub-tabs, single-column layout, sidebar hidden on mobile
- **Yaqut Analytics mobile** (GÖREV 4): Same horizontal scroll tabs pattern, single-column analytics
- **Yaqut Globe disabled on mobile** (GÖREV 8): 3D globe view (Three.js) disabled on ≤768px with visual indicator; forces flat map for performance
- **Alam/Yaqut IdCard touch targets**: Close buttons 40px, section toggles 44px min-height
- **D3 chart optimization** (GÖREV 8): SVG max-height 280px on mobile, reduced stroke/node sizes for force graphs
- **Popup close button** (GÖREV 3C): Enlarged to 36px on mobile for easier dismissal
- Package version → 6.4.0

### Technical
- `useSwipeGesture.js` — new hook: touch event-based horizontal swipe detection with threshold/maxVertical config
- `SkeletonLoader.jsx` — new component: 4 variant skeleton placeholders with CSS shimmer animation
- `BottomSheet` reused in MapView for filter panel
- `FilterPanel.jsx` — new `inBottomSheet` prop for adaptive rendering
- `mobile.css` — ~250 lines added (total ~950 lines)
- No new dependencies

## [6.3.0] - 2026-03-18

### Added
- **Bottom Tab Bar** (GÖREV 1): Fixed bottom navigation for mobile (≤768px) with 4 primary tabs (Harita, Pano, A'lâm, DİA) + "More" menu; replaces hamburger drawer on phones
- **Reusable BottomSheet** component: Drag-to-dismiss, ESC close, backdrop blur, body scroll lock, safe-area support
- **DİA Network mobile controls** (GÖREV 2C): Collapsible settings panel with toggle button on mobile
- **DİA IdCard collapsible works** (GÖREV 2F): Works list toggleable on mobile to reduce scroll length
- **AboutModal external trigger**: Can now be opened programmatically from Bottom Tab Bar "More" sheet

### Changed
- **DİA header** (GÖREV 2A): Compact layout on mobile — stats hidden, subtitle hidden, title smaller
- **DİA subView toggle** (GÖREV 2B): Horizontal scroll pills with snap on mobile
- **DİA sidebar/filters** (GÖREV 2E): Full-width overlay on mobile, larger touch targets for chips
- **DİA relations** (GÖREV 2F): Horizontal scroll for teacher/student/contemporary chips
- **DİA analytics** (GÖREV 2D): Single-column grid on mobile, 200px minimum chart height
- **Alam/Yaqut mobile** (GÖREV 4): Consistent compact headers, horizontal scroll toggles, full-width sidebars
- **Map mobile** (GÖREV 3): Larger sidebar toggle (40px), thicker range slider (10px), bigger play button (48px), 90vw popup width
- **Touch targets** (GÖREV 5A): All interactive elements ≥36-44px on touch devices (chips, buttons, selects, close buttons)
- **Scroll behavior** (GÖREV 5B): `overscroll-behavior: contain` on all scrollable panels
- **Font minimums** (GÖREV 5C): Body text ≥11-14px on mobile (was 8-10px in places)
- **Landscape mode** (GÖREV 5E): Side-by-side layout for DIA/Alam at landscape orientation
- **Footer**: Hidden on mobile (bottom tab bar occupies that space)
- **Hamburger menu**: Replaced by bottom tab bar on ≤768px
- Package version → 6.3.0

### Technical
- New files: `BottomSheet.jsx`, `BottomTabBar.jsx`
- Modified: `App.jsx`, `DiaView.jsx`, `DiaNetwork.jsx`, `DiaIdCard.jsx`, `AboutModal.jsx`, `mobile.css`, `dia.css`
- All changes scoped to `@media` queries — desktop experience unchanged
- Safe-area (notch) support on all bottom-anchored elements

## [6.2.0] - 2026-03-18

### Added
- **DİA Map View**: Leaflet map with 3,803 geocoded scholars (44.6% coverage) from 200+ historical Islamic cities; grid-based clustering, importance-scaled markers, field/madhhab color coding, fly-to on selection
- **Improved Cross-Reference**: 759 → 1,400 el-A'lâm ↔ DİA matches using 3-phase matching (slug + exact name + Levenshtein >0.80 with ±3yr)
- **dia_geo.json**: 222 KB geocoding data from comprehensive Islamic historical gazetteer (200+ cities)

### Changed
- DiaView: 4 sub-views (List → Map → Network → Analytics)
- Package version → 6.2.0

## [6.1.0] - 2026-03-18

### Added
- **DİA Scholar Tab (#dia)**: 8,528 biographies from TDV İslam Ansiklopedisi with search, filtering, virtual scroll
- **Teacher-Student Network**: Canvas-based D3 force graph with 8,127 T-S + 3,390 contemporary edges
- **DİA Analytics**: 6 D3 charts (century, field, madhhab, importance, heatmap, centrality)
- **DİA Biography Card**: Works (44,611), travel chains (4,241 scholars), relations, DİA link
- **el-A'lâm ↔ DİA Cross-Reference**: Bidirectional navigation between tabs
- **5 Data Files**: dia_lite.json, dia_relations.json, dia_works.json, dia_travel.json, dia_alam_xref.json
- **3-Language Support**: Full TR/EN/AR localization

## [6.0.0] - 2026-03-18

### Added
- **Yâkût Geocoding**: Coverage improved from 9.3% to 88.6% (10,262 new coordinates via Claude API enrichment pipeline)
- **15 Trade Routes**: 170 historical waypoints added to all routes
- **20 Waqf Records**: 9 dynasties, 786–1670 CE (Emevî through Osmanlı)
- **HeatmapLayer**: Canvas-based zoom-adaptive density visualization for all geocoded entities
- **YearExplorer**: "What Happened This Year?" 10-category browser panel
- **ScholarMigrationMap**: Animated migration paths for 88 scholars with birth/education/death cities
- **5 New Guided Tours** (10 total): Andalusia Golden Age, Mongol Storm Extended, Islam in India, Islam in Africa, Science & Philosophy
- **Deep Link Support**: Entity-level URLs — `#dynasty/42`, `#scholar/10`, `#year/1258`, `#battle/15`, `#city/3`, `#waqf/7`
- **SEO Meta Tags**: Dynamic `document.title`, Open Graph, and Twitter Card support per page/entity
- **Admin Panel — Waqfs**: Full CRUD for waqfs collection (28 fields) with schema, sidebar entry, and dashboard stats
- **Admin Panel — Route Waypoint Health**: CoordinateHealth dashboard shows waypoint coverage stats for trade routes
- **Scholars**: `birthplace`, `education_cities` fields for 88 scholars (migration data)
- **el-A'lâm Cross-References**: 54K enriched cross-reference entries (alam_xrefs.json)

### Changed
- `geo_confidence` field added to all Yâkût records (high/medium/low/manual)
- Admin `COLLECTION_ORDER` updated: waqfs added between madrasas and analytics
- `parseHash()` extended to support `#entity_type/id` deep link format
- MapView accepts `entityRoute` prop for deep link flyTo + popup
- Package version: 5.3.1.0 → 6.0.0
- CITATION.cff updated with expanded abstract and keywords

### Fixed
- **Critical**: 8 `.textt.` syntax errors across AlamAdvanced.jsx, AlamAnalytics.jsx, YaqutAdvanced.jsx, YaqutAnalytics.jsx causing `TypeError: Cannot read properties of undefined (reading 'alam'/'yaqut')` crashes on #alam and #yaqut pages
- **YaqutErrorBoundary**: Null-safe access to `T[lang].yaqut` preventing cascading error boundary crashes
- Optional chaining added to all D3 axis label `.text()` calls for resilience

## [5.4.1.6] - 2026-03-17
### Added
- Yâkût DİA cross-reference scraper integration
- el-A'lâm advanced analytics: CrossRefNetwork, TimeMachine, WorkProfessionScatter, CenturyComparison

## [5.3.1.0] - 2026-03-16
### Added
- Waqf data layer (20 records)
- ScholarMigrationMap component
- HeatmapLayer component

## [5.2.0.0] - 2026-03-14
### Added
- YearExplorer component
- Yâkût enrichment pipeline v2

## [5.0.0.0] - 2026-03-11
### Added
- Yâkût al-Hamawi Mu'jam integration (12,954 entries)
- Admin Panel v2 with full CRUD
- Landing page

## [4.5.0] - 2026-03-05
### Added
- el-A'lâm integration (13,940 biographies)
- Three.js 3D globe visualization
- Isnad chains layer
- Quiz mode

## [4.0.0] - 2026-02-28
### Added
- Madrasas layer (100 records)
- Diplomacy data (80 records)
- Causal links view (200 links)
- 5 guided tours

## [3.0.0] - 2026-02-20
### Added
- Scholar network (450 scholars)
- Battle analysis (100 battles)
- D3 force-directed causality graph
- Multilingual support (TR/EN/AR)

## [2.0.0] - 2026-02-10
### Added
- Timeline panel
- Dashboard analytics
- 186 dynasties with full metadata

## [1.0.0] - 2026-01-28
### Added
- Initial release: interactive map with Bosworth dynasty data
- Leaflet map with era-based filtering
- Basic search functionality

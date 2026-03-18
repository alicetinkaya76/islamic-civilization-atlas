# Changelog

All notable changes to the Islamic Dynasties Atlas are documented in this file.

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

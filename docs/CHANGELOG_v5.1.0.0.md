# Islamic Dynasties Atlas — v5.1.0.0 Changelog

**Release date:** 2026-03-15  
**Commit message:** `feat: 3-language infrastructure (TR/EN/AR) with RTL support`  
**Tag:** `v5.1.0.0`

## Summary

Complete language infrastructure refactor from binary (TR/EN) to trilingual (TR/EN/AR) system.
Arabic content fields are empty and ready for population; Arabic UI strings are fully translated.

## Changes

### New Files
- `src/data/i18n-utils.js` — Language helper functions: `n()`, `f()`, `hn()`, `dn()`, `isRTL()`
- `src/styles/rtl.css` — Comprehensive RTL layout overrides (~180 rules)

### Data Layer
- **`db.json`** — 6,812 new fields added (`_ar` for all entities, missing `_en` filled)
- **`i18n.js`** — Full Arabic UI block (~200 translated strings)
- **`tours.js`** — `title_ar`, `desc_ar`, `text_ar` added to all 6 tours and 37 stops
- **`era_info.js`** — `ar` key added to label, description, keyDevelopments, scholars
- **`glossary.js`** — `term_ar`, `def_ar` added to all 52 terms
- **`scholar_meta.js`** — `disc_ar`, `city_ar`, `works_ar` added to all 49 scholars
- **`battle_meta.js`** — 6 `_ar` fields added to all 61 battles
- **`isnad_chains.js`** — `name_ar`, `desc_ar`, `grade_ar`, `school_ar` added to all 10 chains
- **`config/eras.js`** — ERA_BANDS and eraName() support Arabic

### Component Layer (39 files modified)
- ~343 of 354 binary ternary patterns converted to trilingual
- 11 remaining are legitimate edge cases (alam pt/pe, DISC_EN lookup) with correct EN fallback for AR
- All `const isTr = lang === 'tr'` declarations eliminated
- `useEntityLookup.js` — `n()` and `lf()` now support 3-language fallback chains

### UI/UX
- **Lang switch:** 3-button switcher (🇹🇷 TR / 🇬🇧 EN / 🇸🇦 AR) with active state
- **Root element:** `dir="rtl"` and `lang="ar"` set dynamically when Arabic selected
- **Arabic fonts:** Noto Sans Arabic + Amiri loaded via Google Fonts
- **RTL CSS:** All directional properties mirrored for Arabic layout

### What's NOT Changed (by design)
- `public/alam_detail.json` (7.3MB) — untouched
- `public/yaqut_detail.json` (13MB) — untouched
- `public/yaqut_graph.json` — untouched
- `src/data/scholar_identity.js` (426KB) — untouched (separate session)
- All CSV source files — untouched

## Acceptance Criteria Status

- [x] `i18n-utils.js` created with all helpers
- [x] `i18n.js` AR block added (all sections translated)
- [x] `db.json` — all entities have `_ar` fields + missing `_en` filled
- [x] All helper data files have AR fields
- [x] `config/eras.js` trilingual
- [x] 39 component files refactored
- [x] Lang switch is 3-button
- [x] `dir="rtl" lang="ar"` active when AR selected
- [x] `rtl.css` created
- [x] Arabic web fonts loading
- [x] **Build successful:** `npm run build` passes with 0 errors
- [x] **No regression expected:** TR/EN paths unchanged, AR falls back to EN→TR

## Next Session
Admin Panel (Oturum 2) — Arabic content entry interface

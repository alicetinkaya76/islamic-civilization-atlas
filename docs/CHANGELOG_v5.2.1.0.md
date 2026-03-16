# Changelog — v5.2.0.0 → v5.2.1.0

## Arabic Content Population (Tier 1 + Tier 2 Partial)

### Summary
- **802 AR name fields** populated across 8 entity collections
- **52 glossary entries** with Arabic terms and definitions
- **0 empty names** in dynasties, battles, events, scholars, monuments, cities, routes, madrasas
- **Translation script suite** created for API-based Tier 2-4 completion

### Entity Names (Tier 1) — 100% Complete
| Collection | Count | Status |
|-----------|-------|--------|
| Dynasties | 186/186 | ✅ |
| Scholars | 313/313 | ✅ |
| Cities | 82/82 | ✅ |
| Battles | 61/61 | ✅ |
| Events | 50/50 | ✅ |
| Monuments | 60/60 | ✅ |
| Madrasas | 35/35 | ✅ |
| Routes | 15/15 | ✅ |
| **Total** | **802/802** | **✅** |

### Glossary (Tier 2 Partial) — 100% Complete
- 52/52 terms with `term_ar` and `def_ar`
- Classical Islamic terminology style
- Consistent with EI3/Brill transliteration standards

### Remaining Work (Requires API)
| Category | Cells | Script Command |
|---------|-------|---------------|
| Ruler names | 830 | `python translate_ar.py --tier 1 --entity rulers` |
| Narratives (all) | ~4,135 | `python translate_ar.py --tier 3 --all` |
| Causal descriptions | 200 | `python translate_ar.py --tier 4 --entity causal` |
| Short fields | ~580 | `python translate_ar.py --tier 4 --all` |
| **Total remaining** | **~5,745** | |

### Scripts Added
- `scripts/ar_translate/translate_ar.py` — Main API orchestrator (4 tiers, progress tracking, validation)
- `scripts/ar_translate/populate_ar_names.py` — Dynasty, battle, event name maps
- `scripts/ar_translate/populate_ar_names_ext.py` — Scholar, city, monument, route, madrasa name maps
- `scripts/ar_translate/run_populate_all.py` — Master runner (no API needed)

### Quality
- All AR names verified: 0 entries with excess Latin characters
- Glossary definitions in classical Islamic encyclopedic style
- Consistent use of standard Arabic orthography (no diacritics/tashkeel)

### Next Session (Oturum 3 devam)
1. Run `translate_ar.py --tier 1 --entity rulers` (830 ruler names via API, ~$0.50)
2. Run `translate_ar.py --tier 3 --all` (narratives via API, ~$3-4)
3. Run `translate_ar.py --tier 4 --all` (causal + short fields, ~$0.50)
4. Validate with `translate_ar.py --validate`
5. Tag as v5.3.0.0 when complete

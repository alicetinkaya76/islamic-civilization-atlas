# Zenodo Upload Metadata — v2.0.0 / Zenodo Yükleme Meta Verisi

## ADIM 1 — Zenodo'da Yeni Sürüm Oluştur

**Eğer v1.0 zaten yayınlandıysa:**
1. https://zenodo.org → "My Uploads" → mevcut kayda git
2. "New version" butonuna tıkla
3. DOI otomatik olarak güncellenir (concept DOI aynı kalır)

**Eğer ilk kez yüklüyorsan:**
1. https://zenodo.org → ORCID ile giriş yap
2. "New Upload" → "Get a DOI now!"
3. DOI'yi not al → README.md ve CITATION.cff'teki placeholder'ları güncelle

## ADIM 2 — Upload Formunu Doldur

### Resource Type
`Dataset`

### Title
```
Islamic Civilization Atlas Dataset: Bosworth's Islamic Dynasties Database (632–1924 CE) — v2.0 Pedagogical Enrichment
```

### Description
```
English:
A comprehensive structured dataset of 186 Islamic dynasties (632–1924 CE) based on C.E. Bosworth's "The New Islamic Dynasties" (Edinburgh University Press, 2004).

v2.0 — Pedagogical Enrichment Release (March 2026):
• 12 interlinked CSV tables (was 11) — new: causal_links.csv (200 cause-and-effect connections)
• All 8 entity types enriched with bilingual narrative fields (TR/EN)
• Dynasty table expanded from 44 to 52 columns: historical narrative, key contribution, rise/fall reasons, contextual before/after
• Battle table: narrative + long-term impact + tactical notes
• Scholar table: influence chains (e.g. Aristotle → al-Kindi → al-Farabi → Ibn Sina → Aquinas) + patronage relations
• Monument table: architectural details + visitor notes
• City table: civilization layers + fun facts
• Trade route table: economic impact + anecdotes
• Causality network: 200 links across 24 link types connecting dynasties, battles, events, scholars, monuments
• Interactive web application with 3 views: Map (enriched popups), Timeline (causal arrows), Causality Network (force-directed graph)

Total: 12 CSV tables, ~2,900 records, ~300 columns, 100% bilingual (TR/EN), fully geolocated.

Türkçe:
C.E. Bosworth'un "The New Islamic Dynasties" (Edinburgh University Press, 2004) referans eserine dayalı, 186 İslam hanedanını (632–1924) kapsayan kapsamlı yapılandırılmış veri seti.

v2.0 — Pedagojik Zenginleştirme Sürümü (Mart 2026):
• 12 ilişkili CSV tablosu (önceki: 11) — yeni: causal_links.csv (200 neden-sonuç bağlantısı)
• 8 varlık tipi iki dilli anlatı alanlarıyla zenginleştirildi (TR/EN)
• Hanedan tablosu 44'ten 52 sütuna genişledi: tarihsel anlatı, temel miras, yükseliş/çöküş nedenleri, bağlam
• Nedensellik ağı: 24 bağlantı tipiyle 200 link
• 3 görünümlü interaktif web uygulaması: Harita, Zaman Çizelgesi (nedensellik okları), Nedensellik Ağı
```

### Version
`2.0.0`

### Publication Date
`2026-03-01`

### Authors
```
1. Çetinkaya, Ali — Selçuk University — ORCID: 0000-0002-7747-6854
2. Gökalp, Hüseyin — Selçuk University
```

### Keywords
```
islamic history, digital humanities, bosworth, islamic dynasties,
historical GIS, data visualization, ottoman, caliphate, seljuq,
abbasid, islamic civilization, historical atlas, bilingual dataset,
pedagogical enrichment, causality network, narrative history
```

### License
`Creative Commons Attribution Share Alike 4.0 International`

### Related Identifiers
```
Type: URL
Relation: Is supplemented by
Identifier: https://github.com/alicetinkaya76/islamic-civilization-atlas
```

### References
```
Bosworth, C.E. (2004). The New Islamic Dynasties: A Chronological and Genealogical Manual. Edinburgh University Press. ISBN: 0-7486-2137-7.
```

## ADIM 3 — Dosyaları Yükle

Zenodo'ya iki dosya yükle:

1. **`atlas-v4-data.zip`** (415KB) — 13 CSV + DATA_DICTIONARY.md
2. **`islamic-civilization-atlas-v4.zip`** (617KB) — Tam proje kaynak kodu

## ADIM 4 — Yayınla

"Publish" butonuna tıkla. DOI aktif olacak.

## ADIM 5 — DOI Güncelle

Zenodo'dan aldığın gerçek DOI numarasını şu dosyalarda güncelle:
- `README.md` — badge ve referans linklerinde `18818238` yerine gerçek numara
- `CITATION.cff` — `doi` alanında

---

## v1.0 → v2.0 CHANGELOG

### Yeni Dosya
- `causal_links.csv` — 200 satır × 8 sütun nedensellik ağı

### Genişletilen Tablolar
| Tablo | v1.0 | v2.0 | Eklenen |
|---|---|---|---|
| all_dynasties_enriched | 44 sütun | 52 sütun | +8 (narrative, key_contribution, rise/fall, context) |
| battles | 16 | 23 | +7 (narrative, impact, tactic, causal refs) |
| events | 12 | 19 | +7 (narrative, significance, related refs) |
| scholars | 17 | 24 | +7 (narrative, legacy, influence chain, patron) |
| monuments | 17 | 24 | +7 (narrative, architectural, visitor note, refs) |
| trade_routes | 18 | 22 | +4 (narrative, economic, anecdote) |
| diplomacy | 10 | 14 | +4 (narrative, significance, outcome) |
| major_cities | 10 | 14 | +4 (narrative, layers, fun fact) |

### Yeni Uygulama Özellikleri
- Zengin pedagojik popup'lar (anlatı + bağlam + nedensellik)
- CausalView sekmesi (D3 force-directed graph, 200 bağlantı)
- Nedensellik okları (Timeline'da hanedan→hanedan)
- Ziyaretçi notları, etki zincirleri, anekdotlar

# CHANGELOG — v5.3.4.0

**Tarih:** 16 Mart 2026  
**Commit mesajı:** `feat: i18n Phase 3 — data layer components`

---

## Özet

Faz 3 kapsamında 19 bileşendeki **162 hardcoded UI string** `t.xxx` referanslarına dönüştürüldü. `i18n.js`'teki 4 mevcut namespace genişletildi (alam, yaqut, scholars, dashboard) ve toplam **138 yeni key** eklendi. Key sayısı 444 → 582/dil.

## i18n.js Değişiklikleri

| Namespace | Eski Key | Yeni Key | Toplam | Açıklama |
|---|---|---|---|---|
| `alam` | 56 | +57 | 113 | Advanced (network, time machine, century comparison, work-profession correlation), StatsPanel (live stats, gender, works, madhab), IdCard (peers, places, teachers/students), Analytics (works production), View tabs |
| `yaqut` | 43 | +56 | 99 | Advanced (geo cluster, place graph, person-place), StatsPanel (entries, types, countries, events), Analytics (charts, DIA coverage, scatter), IdCard (original text, quran ref), View tabs, Map (flat/globe/heatmap), Globe hint, Error/retry |
| `scholars` | 46 | +19 | 65 | Grade, layer, chains, narrations, isnad info, zoom hint, DIA source, clear/reset |
| `dashboard` | 11 | +1 | 12 | unknown |

## Değişen Dosyalar (19)

### alam/ (7 dosya)
- **AlamAdvanced.jsx** — 32 replacement: network, time machine, century comparison, work correlation, all descriptions
- **AlamStatsPanel.jsx** — 21 replacement: live stats, data profile, gender, works, madhab, century curve
- **AlamIdCard.jsx** — 8 replacement: peers, places, teachers, students, click-to-person
- **AlamView.jsx** — 7 replacement: tab labels (compare, correlation, ref network, list, charts, detail, time machine)
- **AlamAnalytics.jsx** — 5 replacement: works production title, most prolific, total works, avg works
- **AlamSidebar.jsx** — 1 replacement: filters title
- **AlamMap.jsx** — 1 replacement: heatmap label

### yaqut/ (8 dosya)
- **YaqutStatsPanel.jsx** — 13 replacement: all stat labels
- **YaqutAnalytics.jsx** — 15 replacement: chart titles, DIA coverage, scatter labels
- **YaqutAdvanced.jsx** — 12 replacement: geo cluster, place graph, person-place, descriptions
- **YaqutView.jsx** — 8 replacement: tab labels, error boundary
- **YaqutMap.jsx** — 6 replacement: flat map, globe, heatmap
- **YaqutIdCard.jsx** — 5 replacement: original text, quran ref, view in al-Aʿlām
- **YaqutSidebar.jsx** — 1 replacement: filters title
- **YaqutGlobe.jsx** — 1 replacement: globe hint

### scholars/ (3 dosya)
- **ScholarView.jsx** — 8 replacement: isnad chains, isnad info, member chains, DIA source, clear
- **ScholarTimeline.jsx** — 8 replacement: teachers, students, works, scholars, zoom hint, reset
- **ScholarNetwork.jsx** — 6 replacement: grade, layer, chains, narrations, no results

### dashboard/ (1 dosya)
- **Dashboard.jsx** — 10 replacement: all entity labels via t.layers.xxx, unknown, alam bio

## Kasıtlı Olarak Inline Kalan Pattern'ler (~15)

1. **AlamIdCard REL_TYPES** (7 kayıt) — Renk + TR/EN objeleri birlikte tanımlandığı için data structure olarak kaldı
2. **YaqutIdCard STATUS_MAP** (3 kayıt) — Renk + durum objeleri
3. **YaqutSidebar STATUS_LABELS** (3 kayıt) — Aynı pattern
4. **YaqutAnalytics CHART_DESCRIPTIONS** (8 kayıt) — Uzun açıklama metinleri, lang suffix pattern ile erişilen obje
5. **ScholarView lang suffix selector** (1 kayıt) — `{ tr: '_tr', en: '_en' }[lang]` dinamik field suffix

Bu pattern'ler Faz 3.5'te `i18n.js`'e taşınabilir veya olduğu gibi kalabilir.

## Test Kontrol Listesi

- [ ] `lang='tr'` → Tüm 19 bileşen mevcut Türkçe görünüm koruyor mu?
- [ ] `lang='en'` → İngilizce mi?
- [ ] `lang='ar'` → Arapça + RTL mi?
- [ ] AlamAdvanced: Network, Time Machine, Century Comparison doğru dilde mi?
- [ ] AlamStatsPanel: Canlı İstatistik, Veri Profili doğru mu?
- [ ] YaqutStatsPanel: Giriş, Coğrafi Tip, Harf Dağılımı doğru mu?
- [ ] YaqutAdvanced: Treemap, Place Graph açıklamaları doğru mu?
- [ ] ScholarNetwork: Derece, Tabaka, Zincirler doğru mu?
- [ ] Dashboard: Tüm entity etiketleri doğru dilde mi?

## 3 Faz Toplam Özet

| Faz | Versiyon | Bileşen | Replace | Key Artışı |
|---|---|---|---|---|
| Faz 1 | v5.3.3.0 | 6 | 38 | 315 → 380 |
| Faz 2 | v5.3.3.1 | 9 | 65 | 380 → 444 |
| Faz 3 | v5.3.4.0 | 19 | 162 | 444 → 582 |
| **Toplam** | | **34** | **~265** | **+267 key** |

340 hardcoded Türkçe string'den **~265 tanesi** i18n referanslarına dönüştürüldü. Kalan ~75: quiz soru template'leri (~14), kasıtlı data structure tanımları (~15), zaten `t.xxx` kullanan ama `f()` helper ile erişilen badge/EXPORTS tanımları (~46).

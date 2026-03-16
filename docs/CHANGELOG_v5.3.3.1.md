# CHANGELOG — v5.3.3.1

**Tarih:** 16 Mart 2026  
**Commit mesajı:** `feat: i18n Phase 2 — shared components`

---

## Özet

Faz 2 kapsamında 9 bileşendeki **~65 hardcoded UI string** `t.xxx` referanslarına dönüştürüldü. `i18n.js`'e 9 yeni namespace ve toplam **~64 yeni key** (TR/EN/AR × her key) eklendi. Toplam key sayısı 380 → 444/dil.

## Yeni i18n Namespace'ler

| Namespace | Key | Açıklama |
|---|---|---|
| `glossary` | 6 | btn, title, placeholder, searchLabel, noResults, terms |
| `progress` | 9 | title, total, badges, newBadge, reset, resetConfirm, discoveries, needed, progressLabel |
| `export` | 1 | title |
| `tour` | 7 | title, subtitle, stops, back, previous, next, complete |
| `cite` | 3 | title, copy, copied |
| `causal` | 5 | links, linkList, noResults, searchPlaceholder, more |
| `era` | 3 | keyDev, scholars, showOnMap |
| `legend` | 5 | title, sects, entities, importance, other |
| `quiz` | 25 | title, subtitle, start, next, finish, playAgain, close, qOf, score, correct, wrong, correctAnswer, difficulty, easy/medium/hard + descs, yourScore, res0/3/5/7/9 |

## Değişen Dosyalar

### `src/data/i18n.js`
- 9 yeni namespace TR/EN/AR olarak eklendi (380 → 444 key/dil)

### `src/components/shared/GlossaryModal.jsx`
- 8 inline `{{ tr: …}[lang]}` → `t.glossary.xxx`
- `import T` eklendi

### `src/components/shared/ProgressTracker.jsx`
- Inline kategori dizisi → `t.layers.xxx` lookup objesi
- 8 inline string → `t.progress.xxx`
- BadgeToast → `t.progress.newBadge`
- Badge `f()` pattern korundu (badge verileri hâlâ `_tr/_en` suffix kullanıyor)

### `src/components/shared/ExportButton.jsx`
- `f(exp, 'label', lang)` → `t.layers.xxx` lookup
- 2 inline → `t.export.title`

### `src/components/shared/TourMode.jsx`
- 8 inline string → `t.tour.xxx`
- Tour seçim + aktif tur ekranları tamamı

### `src/components/shared/CitationBox.jsx`
- Inline `label` objesi kaldırıldı → `t.cite.xxx`

### `src/components/causal/CausalView.jsx`
- 6 inline string → `t.causal.xxx`
- D3 no-results text dahil

### `src/components/timeline/EraCard.jsx`
- 4 inline string → `T[lang].era.xxx` ve `T[lang].about.close`

### `src/components/shared/MapLegend.jsx`
- 30 satırlık LABELS objesi kaldırıldı
- `t.layers/rel/imp/legend` kullanılıyor

### `src/components/QuizMode.jsx`
- 22 satırlık inline `t` useMemo → `T[lang].quiz`
- `getScoreTitle()` → `T[lang].quiz.resN`
- NOT: Soru template'leri (10 tür) dinamik interpolasyon nedeniyle inline kaldı — Faz 3'te ele alınabilir

## Test Kontrol Listesi

- [ ] `lang='tr'` → Tüm Faz 2 bileşenler mevcut Türkçe görünüm koruyor mu?
- [ ] `lang='en'` → Tümü İngilizce mi?
- [ ] `lang='ar'` → Tümü Arapça + RTL mi?
- [ ] Glossary: açılıp arama çalışıyor mu?
- [ ] ProgressTracker: badge/kategori etiketleri doğru dilde mi?
- [ ] ExportButton: CSV dropdown etiketleri doğru mu?
- [ ] TourMode: tur seçimi + navigasyon doğru dilde mi?
- [ ] CitationBox: başlık ve kopyala butonu çalışıyor mu?
- [ ] CausalView: filtre/search/link list doğru mu?
- [ ] EraCard: gelişmeler/âlimler/haritada göster doğru mu?
- [ ] MapLegend: lejant başlıkları ve etiketler doğru mu?
- [ ] QuizMode: menü/oynama/sonuç ekranı doğru dilde mi?

## Kalan İş

- **Faz 3** (v5.3.4.0): alam/, yaqut/, scholars/, Dashboard → ~167 string
- QuizMode soru template'leri (opsiyonel Faz 3.5)

# CHANGELOG — v5.3.3.0

**Tarih:** 16 Mart 2026  
**Commit mesajı:** `feat: i18n Phase 1 — user-facing screens`

---

## Özet

340 hardcoded Türkçe string'den **Faz 1'deki 38 string** `t.xxx` referanslarına dönüştürüldü. 6 bileşen güncellendi, `i18n.js`'e 4 yeni namespace (search, map, onb, about genişletme) ve toplam **~70 yeni key** (TR/EN/AR × her key) eklendi.

## Değişen Dosyalar

### `src/data/i18n.js`
- **TR/EN/AR** → `landing.alamBio`, `landing.langToggle` eklendi
- **TR/EN/AR** → `search` namespace: `placeholder`, `random`, `among`, `results`, `recentTitle`, `clear`, `ariaSearch`
- **TR/EN/AR** → `map` namespace: `back10`, `fwd10`, `enterYear`, `slider`, `tours`, `tourLabel`
- **TR/EN/AR** → `onb` namespace: `mapDesc`, `timelineDesc`, `scholarNet`, `scholarDesc`, `battleDesc`, `quizDesc`, `start`, `next`, `back`, `dismiss`, `skip`
- **TR/EN/AR** → `about` genişletildi: `desc1`, `desc2`, `desc3`, `dataDesc`, `showGuide`, `showLanding`, `gokalp`, `cetinkaya`, `univ`, `country`
- AR `about` artık gerçek Arapça çeviriler içeriyor (eskiden EN fallback'ti)

### `src/components/landing/LandingPage.jsx`
- `import T` eklendi, `t = T[lang]` oluşturuldu
- `n(s, lang)` → `s.label` (statik stats dizisi `t.landing.xxx` kullanır)
- Tüm `{{ tr: …, en: … }[lang]}` → `t.title`, `t.landing.subtitle`, `t.landing.explore`, `t.landing.langToggle`
- `n()` import'u kaldırıldı (artık gerekli değil)

### `src/components/shared/SearchBar.jsx`
- `import T` eklendi
- `TYPE_LABEL` → `getTypeLabels(t)` fonksiyona dönüştürüldü
- `CATEGORIES` → `labelKey` bazlı yapıya geçirildi, `f(cat, 'label', lang)` kaldırıldı
- 8 inline `{{ tr: …}[lang]}` → `t.search.xxx` referansları
- `aria-label`'lar dahil tümü i18n'e alındı

### `src/components/shared/Onboarding.jsx`
- `STEPS` dizisi → `getSteps(t)` fonksiyona dönüştürüldü
- `f(current, 'title/text', lang)` → `current.title` / `current.text`
- 5 inline string → `t.onb.start/next/back/dismiss/skip`
- `import { f }` kaldırıldı, `import T` eklendi

### `src/components/shared/AboutModal.jsx`
- 42 satırlık `_c` inline sözlük kaldırıldı
- `import T` eklendi, `t = T[lang]` kullanılıyor
- `content.body.map(…)` → 3 ayrı `<p>{t.about.descN}</p>`
- 4 inline `{{ tr: …}[lang]}` → `t.about.gokalp/cetinkaya/showGuide/showLanding`

### `src/components/shared/Footer.jsx`
- `import T` eklendi
- 3 inline `{{ tr: …}[lang]}` → `t.about.univ`, `t.about.country`, `t.footer.cite`

### `src/components/map/MapView.jsx`
- 4 `aria-label` inline string → `t.map.back10/enterYear/fwd10/slider`
- 2 tour button string → `t.map.tours/tourLabel`

## Test Kontrol Listesi

- [ ] `lang='tr'` → Mevcut Türkçe görünüm korunuyor mu?
- [ ] `lang='en'` → Tüm Faz 1 ekranlar İngilizce mi?
- [ ] `lang='ar'` → Tüm Faz 1 ekranlar Arapça mı? RTL düzgün mü?
- [ ] LandingPage istatistikleri doğru etiketlerle mi gösteriliyor?
- [ ] SearchBar placeholder, chips, recent header doğru dilde mi?
- [ ] Onboarding adımları doğru çevirilerle mi geliyor?
- [ ] AboutModal açılıyor mu, yazar bilgileri doğru mu?
- [ ] Footer üniversite ve ülke doğru dilde mi?
- [ ] MapView tbar aria-label'ları doğru mu?

## Kalan İş

- **Faz 2** (v5.3.3.1): GlossaryModal, ProgressTracker, ExportButton, TourMode, CitationBox, CausalView, EraCard, MapLegend, QuizMode → ~58 string
- **Faz 3** (v5.3.4.0): alam/, yaqut/, scholars/, Dashboard → ~167 string

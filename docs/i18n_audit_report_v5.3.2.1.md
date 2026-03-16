# i18n Bileşen Entegrasyon Denetim Raporu
# islamicatlas.org — v5.3.2.1
# Tarih: 16 Mart 2026

---

## Özet

69 kaynak dosya tarandı. **340 hardcoded string** tespit edildi (admin bileşenleri hariç).

Mevcut pattern: `App.jsx` → `T[lang]` objesi → bileşenlere `lang` prop olarak geçer. Bileşenler `lang` prop'unu alır ve `{lang === 'tr' ? '...' : lang === 'en' ? '...' : '...'}` ile inline çeviri yapar veya doğrudan Türkçe string kullanır.

### Sorun Kategorileri

| Kategori | Adet | Açıklama |
|----------|------|----------|
| TURK_STR | ~280 | Hardcoded Türkçe string (i18n dışı) |
| JSX_TEXT | ~40 | JSX içinde doğrudan metin |
| PROP | ~20 | title/placeholder/aria-label'da hardcoded |

---

## Kritik Dosyalar (Yüksek Öncelik)

### 1. LandingPage.jsx (4 string)
- L83: `'Müslüman Hanedanlar Atlası'` → `t.title`
- L86: `'632–1924 · Bosworth Veri Tabanı'` → `t.sub`
- L90: `'Keşfet'` → `t.enter || yeni i18n key`
- L59: `'Hükümdar'` → `t.layers.rulers`

### 2. SearchBar.jsx (5 string)
- L339: `'Hanedan, savaş, âlim, şehir ara…'` → `t.search.placeholder`
- L344-345: `'Rastgele keşfet'` → `t.search.random`
- L403: `'kayıt arasında'` → `t.search.among`
- L202, L213: `'Hükümdar'` → `t.layers.rulers`

### 3. Onboarding.jsx (10 string)
- L6-18: Tüm tur açıklamaları hardcoded Türkçe
- L62: `'Başla!'` → `t.onboarding.start`
- L63: `'İleri →'` → `t.onboarding.next`
- L70: `'Tekrar gösterme'` → `t.onboarding.dismiss`

### 4. AboutModal.jsx (12 string)
- L7, L47: `'Hakkında'` → `t.about.title`
- L9-11: Proje açıklamaları → `t.about.desc1/desc2/desc3`
- L14: `'Veri Kaynağı'` → `t.about.source`
- L76: `'Rehberi Tekrar Göster'` → `t.about.showGuide`
- L81: `'Giriş Sayfasını Tekrar Göster'` → `t.about.showLanding`

### 5. Footer.jsx (3 string)
- L22: `'Türkiye'`, `'Üniversitesi'` → inline trilingual
- L30: `'Atıf Yap'` → `t.cite`

---

## Orta Öncelik Dosyalar

### 6. shared/GlossaryModal.jsx (6 string)
- L58, L65, L71: `'Sözlük'` / `'İslam Tarihi Sözlüğü'`
- L84: Placeholder text
- L103: `'Sonuç bulunamadı.'`

### 7. shared/ProgressTracker.jsx (20 string)
- L11-39: Tüm rozet isimleri ve açıklamaları Türkçe
- L145: `'🧭 Keşif İlerlemesi'`
- L197: `'Tüm ilerleme sıfırlansın mı?'`
- L201: `'🔄 Sıfırla'`

### 8. shared/ExportButton.jsx (4 string)
- L42: `'Savaşlar'`, L51: `'Anıtlar'`, L60: `'Şehirler'`
- L109-110: `'CSV İndir'`

### 9. shared/TourMode.jsx (3 string)
- L52: `'Bir tur seçerek İslam tarihini keşfedin'`
- L96: `'Önceki'`
- L109: `'Tur tamamlandı!'`

### 10. shared/CitationBox.jsx (2 string)
- L30: `'Bu projeyi atıf yapın'` / `'Kopyalandı!'`

### 11. map/MapView.jsx (4 string)
- L112: `'-10 yıl'` (prop), L119: `'Yıl gir'`, L121: `'+10 yıl'`
- L126: `'Zaman kaydırıcısı'`

### 12. causal/CausalView.jsx (4 string)
- L67: `'Sonuç bulunamadı'`
- L125, L150, L175: `'Bağlantı'` / `'Bağlantı Listesi'`

### 13. timeline/EraCard.jsx (3 string)
- L62: `'Anahtar Gelişmeler'`
- L77: `'Öne Çıkan Âlimler'`
- L93: `'Haritada Göster'`

---

## Düşük Öncelik (Veri Katmanı / Analitik)

### 14. alam/ dizini (~80 string)
AlamAdvanced, AlamAnalytics, AlamStatsPanel, AlamSidebar, AlamIdCard:
- Meslek isimleri: `'Fıkıh Âlimi'`, `'Tarihçi'`, `'Mutasavvıf'` vb.
- İstatistik etiketleri: `'Canlı İstatistik'`, `'Mezhep Dağılımı'` vb.
- Açıklama metinleri (tooltip): 10+ uzun Türkçe paragraf

### 15. yaqut/ dizini (~60 string)
YaqutAnalytics, YaqutStatsPanel, YaqutSidebar, YaqutAdvanced, YaqutIdCard, YaqutMap:
- Filtre etiketleri: `'Coğrafi Tip'`, `'Tarihî Dönem'` vb.
- İstatistik: `'DİA Bağlantılı'`, `'Harf Dağılımı'` vb.
- Tooltip açıklamaları: 10+ uzun Türkçe paragraf

### 16. scholars/ dizini (~25 string)
ScholarNetwork, ScholarTimeline, ScholarView:
- Disiplin isimleri: `'Coğrafya & Seyahat'`, `'Kıraat'` vb.
- Tarihî dönem etiketleri: `'Râşidîn'`, `'Selçuklu'`, `'Osmanlı'`
- İsnad zinciri etiketleri

### 17. QuizMode.jsx (~12 string)
- Sonuç mesajları: `'Tarih Üstadı!'`, `'İyi Deneme!'` vb.
- UI etiketleri: `'Bilgi Yarışması'`, `'Sonuçları Gör'` vb.

### 18. dashboard/Dashboard.jsx (2 string)
- L145: `'Hükümdar'`
- L245: `'müslüman'`

---

## Önerilen Refactoring Stratejisi

### Faz 1 — Yüksek Öncelik (i18n.js'e key ekleme + bileşen güncelleme)
Hedef: LandingPage, SearchBar, Onboarding, AboutModal, Footer
Tahmini süre: ~2 saat
Etki: Kullanıcının ilk gördüğü ekranlar trilingual olur

### Faz 2 — Orta Öncelik (shared/ bileşenleri)
Hedef: GlossaryModal, ProgressTracker, ExportButton, TourMode, CitationBox, MapView, CausalView, EraCard
Tahmini süre: ~3 saat

### Faz 3 — Düşük Öncelik (veri katmanı bileşenleri)
Hedef: alam/, yaqut/, scholars/, QuizMode, Dashboard
Tahmini süre: ~5 saat
Not: Bu bileşenler yoğun veri içerir ve tooltip metinleri uzundur

### Yeni i18n Key Önerisi (Faz 1)

```javascript
// i18n.js'e eklenecek anahtarlar
enter: { tr: 'Keşfet', en: 'Explore', ar: 'استكشف' },
search: {
  placeholder: { tr: 'Hanedan, savaş, âlim, şehir ara…', en: 'Search dynasty, battle, scholar, city…', ar: 'ابحث عن سلالة، معركة، عالم، مدينة…' },
  random: { tr: 'Rastgele keşfet', en: 'Random discovery', ar: 'اكتشاف عشوائي' },
  among: { tr: 'kayıt arasında', en: 'records among', ar: 'سجل من بين' },
},
about: {
  title: { tr: 'Hakkında', en: 'About', ar: 'حول' },
  source: { tr: 'Veri Kaynağı', en: 'Data Source', ar: 'مصدر البيانات' },
  showGuide: { tr: 'Rehberi Tekrar Göster', en: 'Show Guide Again', ar: 'إظهار الدليل مجددًا' },
  showLanding: { tr: 'Giriş Sayfasını Göster', en: 'Show Landing Page', ar: 'إظهار صفحة الدخول' },
},
onboarding: {
  start: { tr: 'Başla!', en: 'Start!', ar: 'ابدأ!' },
  next: { tr: 'İleri →', en: 'Next →', ar: 'التالي ←' },
  dismiss: { tr: 'Tekrar gösterme', en: "Don't show again", ar: 'لا تظهر مجددًا' },
},
cite: { tr: 'Atıf Yap', en: 'Cite', ar: 'استشهد' },
```

---

## Sonuç

340 hardcoded string, 3 faz halinde refactoring ile çözülebilir. Faz 1 (kullanıcı-görünür ekranlar) en yüksek önceliklidir ve ~20 yeni i18n key gerektirir.

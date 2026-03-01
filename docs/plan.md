# Bosworth "The New Islamic Dynasties" — Kapsamlı İslam Medeniyeti Atlası

## Proje Durumu: FAZA 1 ✅ FAZA 2 ✅ FAZA 3 ✅ FAZA 4 ✅ FAZA 5.1-5.4 ✅ FAZA 5.6-5.8 ✅ → FAZA 5.5+ DEVAM

---

## TAMAMLANAN FAZLAR

### Faza 1 ✅ — Veri Üretimi (Şubat 2026)
11 CSV tablosu: 186 hanedan, 830 hükümdar, 101 ilişki, 50 savaş, 50 olay, 49 âlim, 40 mimari eser, 15 ticaret yolu, 30 diplomasi, 69 şehir, 186 analitik skor.

### Faza 2 ✅ — Veri Doğrulama & Zenginleştirme (Şubat 2026)
Coğrafi koordinatlar, bbox, analitik skorlar, iki dilli (TR/EN) tüm alanlar.

### Faza 3 ✅ — Vizüalizasyon / Showcase (Şubat 2026)
- **Harita:** Leaflet + ESRI Shaded Relief + 7 katman + 5 filtre + zaman kaydırıcısı (622–1924)
- **Timeline:** D3.js horizontal bars + savaş/olay/âlim overlay
- **Tema:** Ottoman Manuscript × Dark Cartography (Amiri + Outfit)
- **Bilingual:** TR/EN toggle
- **Yayın:** GitHub + Zenodo DOI (10.5281/zenodo.18818238)

### Faza 4 ✅ — Pedagojik Zenginleştirme (1 Mart 2026)

#### 4.1 ✅ — Savaş + Olay CSV Zenginleştirmesi
- battles_v4.csv: 16→23 sütun (+narrative, impact, tactic, causal refs)
- events_v4.csv: 12→19 sütun (+narrative, significance, related refs)

#### 4.2 ✅ — Âlim + Eser + Ticaret + Diplomasi + Şehir Zenginleştirmesi
- scholars_v4.csv: 17→24 sütun (+narrative, legacy, influence chain, patron)
- monuments_v4.csv: 17→24 sütun (+narrative, architectural, visitor note, refs)
- trade_routes_v4.csv: 18→22 sütun (+narrative, economic, anecdote)
- diplomacy_v4.csv: 10→14 sütun (+narrative, significance, outcome)
- major_cities_v4.csv: 10→14 sütun (+narrative, layers, fun fact)

#### 4.3 ✅ — Hanedan Zenginleştirmesi (1-93)
- dynasties_1_93_v4.csv: 93 satır × 52 sütun

#### 4.4 ✅ — Hanedan Zenginleştirmesi (94-186) + Birleştirme
- all_dynasties_enriched_v4.csv: 186 satır × 52 sütun

#### 4.5 ✅ — Nedensellik Ağı
- causal_links.csv: 200 satır × 8 sütun, 24 bağlantı tipi

#### 4.6 ✅ — Kod Güncellemesi (React/Vite)
- MapView.jsx: Zengin pedagojik popup'lar
- TimelineView.jsx: Nedensellik okları + anlatı tooltip
- CausalView.jsx: YENİ — D3 force-directed graph
- db.json: 168KB→680KB

#### 4.7 ✅ — Test & Final Build (QA: 0 hata, 0 uyarı)

#### 4.8 ✅ — Yayın
- Zenodo v2.0, GitHub v2.0.0, Vercel canlı, GA4 + GSC aktif

---

## DOSYA ENVANTERİ (v2.0 Güncel)

| # | Dosya | Satır | Sütun | Durum |
|---|---|---|---|---|
| 1 | `all_dynasties_enriched.csv` | 186 | 52 | ✅ v4 |
| 2 | `all_rulers_merged.csv` | 830 | 38 | ✅ |
| 3 | `dynasty_relations.csv` | 101 | 6 | ✅ |
| 4 | `battles.csv` | 50 | 23 | ✅ v4 |
| 5 | `events.csv` | 50 | 19 | ✅ v4 |
| 6 | `scholars.csv` | 49 | 24 | ✅ v4 |
| 7 | `monuments.csv` | 40 | 24 | ✅ v4 |
| 8 | `trade_routes.csv` | 15 | 22 | ✅ v4 |
| 9 | `diplomacy.csv` | 30 | 14 | ✅ v4 |
| 10 | `major_cities.csv` | 69 | 14 | ✅ v4 |
| 11 | `dynasty_analytics.csv` | 186 | 16 | ✅ |
| 12 | `causal_links.csv` | 200 | 8 | ✅ |

**Toplam:** 12 tablo, ~2.900 kayıt, ~300 sütun, %100 iki dilli (TR/EN)

---

## FAZA 5: OLGUNLAŞTIRMA & AKADEMİK YAYGIN ETKİ 🔴

### 5.1 ✅ — Akademik Kimlik & Footer (1 Mart 2026)
**Hüseyin Hoca talebi (1 Mart 2026)**
- Web sitesine footer ekleme: yazarlar + kurum + logo
  - "Dr. Hüseyin Gökalp & Dr. Ali Çetinkaya — Selçuk Üniversitesi"
  - ORCID linkleri
  - Zenodo DOI badge
- **Kolay atıf kutusu (Citation Box):**
  - APA formatı — kopyala-yapıştır butonu
  - BibTeX formatı — kopyala-yapıştır butonu
  - Chicago formatı
- Web sitesi footer'ında "Bu projeyi atıf yapın / Cite this project" bölümü
- **İsim değişikliği değerlendirmesi:** "Islamic Civilization Atlas" → "Islamic Dynasties Atlas" olabilir
  - Hüseyin Hoca'nın kararı bekleniyor
  - Değişirse: README, CITATION.cff, Zenodo, site title, i18n güncellenmeli

### 5.2 ✅ — TR/EN Çeviri Tam Denetimi (1 Mart 2026)
- ✅ Tüm popup alanları lf() ile lang-dependent yapıldı
- ✅ lf() fallback: EN yoksa TR gösterilir
- ✅ 990 eksik EN alan tespit edildi → docs/translation_audit.md
- ⏳ Eksik EN çevirilerin içerik olarak tamamlanması (ayrı seans)
- Tüm CSV'lerde TR/EN çeviri tutarlılığı kontrolü
  - narrative_tr / narrative_en eşleşmeleri
  - key_contribution_tr / key_contribution_en eşleşmeleri
  - Boş EN alanlarının tespiti ve tamamlanması
- i18n.js'de eksik çeviri anahtarı kontrolü
- Popup'larda lang toggle yapınca tüm alanların doğru geçişi
- CausalView'da TR/EN geçişlerinin kontrolü
- Türkçe özel karakter tutarlılığı (â, î, û, ş, ç, ğ, ı, ö, ü)

### 5.3 ✅ — Modüler Refactoring (1 Mart 2026)
**Proje büyüyecek — modüler altyapı şart**
- **Bileşen ayrıştırma:**
  - MapView.jsx (376 satır) → MapView + PopupFactory + LayerManager + FilterPanel
  - TimelineView.jsx (289 satır) → TimelineView + TimelineBars + CausalArrows + EventOverlay
  - CausalView.jsx (247 satır) → CausalView + CausalGraph + CausalFilters + CausalList
- **Veri katmanı ayrıştırma:**
  - db.json (680KB tek dosya) → lazy loading / code splitting
  - Veri erişim hook'ları: useEntityLookup, useCausalLinks, useAnalytics
  - Entity resolver: ID → isim/koordinat çözümleme merkezi fonksiyon
- **Popup sistemi:**
  - PopupFactory: entity tipine göre popup şablonu seçimi
  - PopupNarrative, PopupCausal, PopupVisitor bileşenleri
  - Popup veri hazırlama fonksiyonları (buildDynastyPopup, buildBattlePopup vs.)
- **Stil ayrıştırma:**
  - atlas.css (529 satır) → base.css + map.css + timeline.css + causal.css + popup.css
- **Konfigürasyon:**
  - constants.js → config/colors.js + config/eras.js + config/layers.js
- **Klasör yapısı hedefi:**
  ```
  src/
  ├── components/
  │   ├── map/        (MapView, LayerManager, FilterPanel)
  │   ├── timeline/   (TimelineView, CausalArrows)
  │   ├── causal/     (CausalView, CausalGraph)
  │   ├── shared/     (PopupFactory, SearchBar, Footer, CitationBox)
  │   └── layout/     (Header, TabBar)
  ├── hooks/          (useEntityLookup, useCausalLinks, useFilters)
  ├── data/           (db.json, i18n.js)
  ├── config/         (colors, eras, layers)
  └── styles/         (base, map, timeline, causal, popup)
  ```

### 5.4 ✅ — SEO & Erişilebilirlik (1 Mart 2026)
- ✅ Open Graph meta tags (og:title, og:description, og:image 1200×630)
- ✅ Twitter Card meta tags
- ✅ Schema.org/JSON-LD structured data (WebApplication)
- ✅ Meta description (TR/EN), keywords, canonical URL
- ✅ robots.txt + sitemap.xml
- ✅ Favicon (SVG) + PWA icons (192, 512, apple-touch) + manifest.json
- ✅ theme-color meta tag
- ✅ noscript fallback
- ✅ font preconnect hints
- ✅ Code splitting: vendor/leaflet/d3 ayrı chunk'lar
- ✅ Skip-to-content link
- ✅ ARIA landmarks (banner, navigation, main, complementary)
- ✅ ARIA roles: tablist/tab, aria-selected, aria-label
- ✅ focus-visible outline styles
- ✅ Time slider aria-valuemin/max/now
- Open Graph meta tags (sosyal medya paylaşım kartları)
- Sitemap.xml + robots.txt
- Favicon + PWA manifest
- Meta description (TR/EN)
- Lighthouse performans optimizasyonu (lazy loading, code splitting)
- Erişilebilirlik (ARIA labels, keyboard navigation)

### 5.5 — Arama & Keşif
- Global arama çubuğu: hanedan, savaş, âlim, şehir, eser adıyla arama
- Otomatik tamamlama (autocomplete)
- Arama sonuçlarında haritada zoom + popup açma
- "Rastgele keşfet" butonu

### 5.6 ✅ — Hükümdar Katmanı / Ruler Layer (1 Mart 2026)
- ✅ 830 hükümdar db.json'a eklendi (900KB)
- ✅ Harita: rulers katmanı (varsayılan kapalı, toggle ile açılır)
  - Hüküm süresine göre renk/opasite: aktif=parlak, geçmiş=soluk
  - Tooltip: isim, popup: tam ad, unvan, hüküm, rol, selef/halef, veraset, ölüm
- ✅ Dynasty popup'ta genişletilebilir hükümdar listesi (expand/collapse)
  - ★ kurucu, ◆ son hükümdar, † öldürülen işaretleri
- ✅ Timeline: hükümdar tick mark'ları (👑 toggle)
  - Hanedan bar'ı üzerinde hüküm başlangıç çizgileri
  - Hover: isim, süre, rol bilgisi
- ✅ i18n: ruler, rulers, reign, successor, predecessor, founder, lastRuler, deathNatural, deathKilled, successionType
- 830 hükümdarı harita + timeline'a entegre
- Hükümdar popup: hüküm süresi, önemli olayları, halefi/selefi
- Dynasty popup'ta hükümdar listesi (genişletilebilir panel)

### 5.7 ✅ — Hikaye Modu / Guided Tours (1 Mart 2026)
- ✅ 5 adet küratörlü tur (her biri 7-8 durak):
  1. 🛤 İpek Yolu'nun Hikâyesi (8 durak: Bağdat → Semerkant → Horasan → Hint Okyanusu → Baharat → Sahra → Moğol Barışı → Portekiz)
  2. 🏇 Moğol Fırtınası (7 durak: Cengiz Han → Hârezm → Bağdat → Ayn Câlût → İlhanlılar → Timur → Bâbürlüler)
  3. 📚 İslam'ın Altın Çağı (8 durak: Beytü'l-Hikme → Hârizmî → İbn Sînâ → İbnü'l-Heysem → Kurtuba → Gazâlî → el-Ezher → İbn Rüşd)
  4. 🌙 Osmanlı'nın Yükselişi (7 durak: Söğüt → Bursa → Edirne → Kosova → Ankara → İstanbul Fethi → Kanuni)
  5. 🕌 İslam Mimarisinin Şaheserleri (7 durak: Mescid-i Nebevî → Kubbetü's-Sahra → Kurtuba → Sâmarrâ → Alhambra → Selimiye → Tâc Mahal)
- ✅ Harita: flyTo animasyonlu geçiş + yıl senkronizasyonu
- ✅ Auto-play modu (6 sn/durak)
- ✅ İlerleme göstergesi (dot'lar)
- ✅ Tam iki dilli (TR/EN) anlatı metinleri
- ✅ Responsive tasarım
- Önceden tasarlanmış turlar: "İpek Yolu'nun Hikayesi", "Haçlı Seferleri", "Moğol Etkisi"
- Adım adım animasyonlu anlatı
- Her turda 10-15 durak, otomatik harita/timeline senkronizasyonu

### 5.8 ✅ — Mobil Uyumluluk (1 Mart 2026)
- ✅ Hamburger menü (tablet/telefon): sağdan slide-in nav panel
- ✅ Sidebar toggle: harita filtre paneli sol taraftan slide-in (mobilde varsayılan gizli)
- ✅ 4 breakpoint: 768px (tablet), 600px (telefon), 400px (küçük telefon), landscape
- ✅ Touch-friendly popup'lar: büyük kapatma butonu, scroll, max-height sınırı
- ✅ Touch hedef büyütme: tablar, butonlar, sliderlar (hover:none + pointer:coarse)
- ✅ Compact header: telefonda alt başlık gizlenir, logo küçülür
- ✅ Responsive tour paneli ve tur seçim grid'i
- ✅ Timeline yatay scroll (webkit-overflow-scrolling: touch)
- ✅ Causal view dikey stack (mobilde)
- ✅ PWA: service worker (cache-first assets, network-first HTML)
- ✅ iOS PWA: apple-mobile-web-app-capable, status-bar-style
- ✅ Mobile backdrop (menü açıkken arka plan karartma)
- Responsive sidebar (hamburger menu)
- Touch-friendly popup'lar
- PWA: offline erişim + ana ekrana ekleme

### 5.9 — Karşılaştırma Modu
- İki hanedan yan yana karşılaştırma paneli
- Radar chart: power index, süre, toprak, bilim katkısı

### 5.10 — Veri Dışa Aktarma & API
- CSV/JSON indirme butonu
- Citation generator (BibTeX, APA, Chicago)
- Embed widget (iframe)

### 5.11 — Akademik Yaygın Etki
- Türkçe makale: Türkiye'deki dergi (Hüseyin Hoca'nın İslam tarihçileri ağı)
- BRAIS 2025 konferans bildirisi
- TALLIP / DHQ dergisine İngilizce makale
- Eğitim kurumlarına tanıtım (İlahiyat fakülteleri, tarih bölümleri)
- İslam Tarihçileri WhatsApp grubunda duyuru

---

## ÖNCELİK MATRİSİ

| Adım | Etki | Efor | Öncelik | Seans |
|---|---|---|---|---|
| 5.1 Akademik Kimlik & Footer | Çok Yüksek | Düşük | ⭐⭐⭐ | Sonraki seans |
| 5.2 TR/EN Çeviri Denetimi | Yüksek | Orta | ⭐⭐⭐ | Sonraki seans |
| 5.3 Modüler Refactoring | Yüksek | Yüksek | ⭐⭐⭐ | Sonraki seans |
| 5.4 SEO & Erişilebilirlik | Yüksek | Düşük | ⭐⭐ | Yakında |
| 5.5 Arama & Keşif | Yüksek | Orta | ⭐⭐ | Yakında |
| 5.8 Mobil Uyumluluk | Yüksek | Orta | ⭐⭐ | Yakında |
| 5.7 Hikaye Modu | Çok Yüksek | Yüksek | ⭐⭐ | Yakında |
| 5.6 Hükümdar Katmanı | Yüksek | Yüksek | ⭐ | Sonra |
| 5.11 Akademik Yaygın Etki | Çok Yüksek | Orta | ⭐⭐ | Paralel |
| 5.9 Karşılaştırma Modu | Orta | Orta | ⭐ | Sonra |
| 5.10 Veri Dışa Aktarma & API | Orta | Orta | ⭐ | Sonra |

---

## SONRAKİ SEANS PLANI (Faza 5.1 + 5.2 + 5.3)

### Hedef: Akademik Kimlik + Çeviri Denetimi + Modüler Refactoring

**Giriş dosyası:** `islamic-civilization-atlas-v4.zip` (mevcut proje)

**Seans akışı:**
1. Footer bileşeni: yazarlar, kurum, ORCID, DOI, citation box (APA/BibTeX kopyala-yapıştır)
2. TR/EN denetimi: tüm CSV ve popup geçişleri
3. Modüler refactoring: bileşen ayrıştırma + hook'lar + klasör yapısı
4. Build + test + push

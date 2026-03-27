# DarpIslam Feature — Entegrasyon Kılavuzu
## islamicatlas.org v7.x — İslam Darphaneleri Paneli

### 📁 Dosya Yapısı

Bu zip'i proje kökünde açın. Aşağıdaki dosyalar eklenecektir:

```
public/data/
  darpislam_lite.json          ← Harita/sidebar için hafif veri (1.2MB)
  darpislam_detail_0.json      ← Detay chunk'ları (on-demand yüklenir)
  darpislam_detail_1.json
  darpislam_detail_2.json
  darpislam_detail_3.json
  darpislam_detail_4.json
  darpislam_detail_5.json
  darpislam_detail_6.json

src/components/darpislam/
  DarpView.jsx                 ← Ana panel bileşeni
  DarpSidebar.jsx              ← Arama, filtre, darphane listesi
  DarpMap.jsx                  ← Leaflet harita katmanı
  DarpIdCard.jsx               ← Detay kartı (emissions, hanedanlar, Yâkût)
  DarpStatsPanel.jsx           ← Özet istatistikler
  DarpAnalytics.jsx            ← Grafikler ve analizler (lazy loaded)

src/styles/
  darpislam.css                ← Tüm stiller
```

---

### 🔧 Entegrasyon Adımları

#### 1. App.jsx — Lazy import ekle

`App.jsx` dosyasının üst kısmına ekleyin (diğer lazy import'ların yanına):

```jsx
const DarpView = lazy(() => import('./components/darpislam/DarpView'));
```

#### 2. App.jsx — Tab/Route ekle

Mevcut tab tanımlarına (muhtemelen bir tabs array veya nav JSX) ekleyin:

```jsx
// Tab tanımında
{ id: 'darpislam', label: lang === 'tr' ? 'Darphaneler' : 'Mints', icon: '🪙' }
```

Ve render bölümünde (diğer view case'lerinin yanına):

```jsx
{activeTab === 'darpislam' && (
  <Suspense fallback={<SkeletonLoader type="map" />}>
    <DarpView lang={lang} isMobile={isMobile} />
  </Suspense>
)}
```

#### 3. i18n.js — Çeviri anahtarları ekle

`src/data/i18n.js` dosyasına ekleyin:

```js
// DarpIslam translations
darpislam_title: { tr: 'İslam Darphaneleri', en: 'Islamic Mints' },
darpislam_subtitle: { tr: 'İslam Medeniyeti Darphane ve Sikke Külliyatı', en: 'Islamic Civilization Mint & Coinage Corpus' },
darpislam_tab: { tr: 'Darphaneler', en: 'Mints' },
darpislam_emissions: { tr: 'Darbiyat', en: 'Emissions' },
darpislam_dynasties: { tr: 'Hanedanlar', en: 'Dynasties' },
darpislam_metals: { tr: 'Metaller', en: 'Metals' },
darpislam_sources: { tr: 'Kaynaklar', en: 'Sources' },
darpislam_nearby_battles: { tr: 'Yakın Savaşlar', en: 'Nearby Battles' },
darpislam_gold: { tr: 'Altın/Dinar', en: 'Gold/Dinar' },
darpislam_silver: { tr: 'Gümüş/Dirhem', en: 'Silver/Dirham' },
darpislam_copper: { tr: 'Bakır/Fels', en: 'Copper/Fals' },
darpislam_search: { tr: 'Darphane ara…', en: 'Search mints…' },
darpislam_all_regions: { tr: 'Tüm Bölgeler', en: 'All Regions' },
darpislam_all_dynasties: { tr: 'Tüm Hanedanlar', en: 'All Dynasties' },
darpislam_period: { tr: 'Dönem', en: 'Period' },
darpislam_confidence: { tr: 'Güvenilirlik', en: 'Confidence' },
darpislam_quality: { tr: 'Kalite Skoru', en: 'Quality Score' },
```

#### 4. config/layers.js — Katman kaydı (opsiyonel)

Layer sisteminiz varsa:

```js
{
  id: 'darpislam',
  name: { tr: 'Darphaneler', en: 'Mints' },
  icon: '🪙',
  category: 'reference',
  description: {
    tr: '3,458 İslam darphanesi — Hamburg/Diler, Nomisma, al-Ṯurayyā',
    en: '3,458 Islamic mints — Hamburg/Diler, Nomisma, al-Ṯurayyā'
  }
}
```

---

### 📊 Veri İstatistikleri

| Metrik | Değer |
|--------|-------|
| Toplam darphane | 3,458 |
| Geocoded | 3,381 (%97.8) |
| Toplam darbiyat | 10,733 |
| Hükümdar kapsama | %72.8 |
| Yâkût eşleşme | 411 |
| Yakın savaş | 61 |
| Hanedan sayısı | ~165 |
| Hükümdar sayısı | ~3,878 |
| Lite dosya boyutu | 1.2 MB |
| Detay chunk'ları | 7 × ~500-850 KB |

### 🎨 Tasarım Notları

- Renk paleti: `#d4a574` (altın/ana), `#c17767` (bakır/vurgu), `#8b6914` (hanedan)
- Yâkût panelindeki sidebar/idcard/analytics yapısı birebir korunmuştur
- Dark mode desteği CSS variable'ları ile sağlanmıştır
- Mobile responsive: sidebar drawer + tam ekran idcard
- Detay verileri (emissions, Yâkût açıklama, savaşlar) lazy-load olarak chunk'lardan çekilir
- D3.js grafikleri: timeline, region bars, metal pie, dynasty ranking

### 🔖 Versiyon

Bu özellik `v7.0.0.0` (Session 33) olarak etiketlenebilir.

**Git workflow:**
```bash
git checkout -b feature/darpislam-panel
# Dosyaları yerleştirin
git add .
git commit -m "feat(darpislam): add Islamic Mints panel with 3,458 mints, emissions, analytics"
# App.jsx entegrasyonunu yapın
git commit -m "feat(darpislam): integrate into App.jsx tabs and i18n"
git push origin feature/darpislam-panel
# PR → merge → tag v7.0.0.0
```

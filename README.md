# 🕌 Islamic Civilization Atlas

**Bosworth İslam Hanedanları İnteraktif Tarihî Atlası**
*Interactive Historical Atlas of Bosworth's Islamic Dynasties*

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![D3.js](https://img.shields.io/badge/D3.js-7.8-F9A03C?logo=d3.js&logoColor=white)](https://d3js.org/)
[![License: CC BY-SA 4.0](https://img.shields.io/badge/License-CC%20BY--SA%204.0-lightgrey.svg)](LICENSE)
[![DOI](https://img.shields.io/badge/DOI-10.5281%2Fzenodo.18818238-blue)](https://doi.org/10.5281/zenodo.18818238)

[🇹🇷 Türkçe](#-türkçe) · [🇬🇧 English](#-english) · [🚀 Demo](#-canlı-demo--live-demo) · [📊 Dataset](#-veri-seti--dataset)

---

## 📌 Hakkında / About

> 🇹🇷 Bu proje, C.E. Bosworth'un *The New Islamic Dynasties* (Edinburgh University Press, 2004) referans eserine dayalı olarak **186 İslam hanedanını** (632–1924 CE) interaktif harita ve zaman çizelgesi üzerinde görselleştiren bir dijital beşerî bilimler platformudur.
>
> 🇬🇧 This project is a digital humanities platform that visualizes **186 Islamic dynasties** (632–1924 CE) on an interactive map and timeline, based on C.E. Bosworth's *The New Islamic Dynasties* (Edinburgh University Press, 2004).

**Referans Eser / Reference Work:** Bosworth, C.E. (2004). *The New Islamic Dynasties: A Chronological and Genealogical Manual*. Edinburgh University Press.

---

## 🚀 Canlı Demo / Live Demo

👉 **[islamic-civilization-atlas.vercel.app](https://islamic-civilization-atlas.vercel.app)**

---

## 🇹🇷 Türkçe

### Ne Bu?

Bosworth'un İslam Hanedanları veri tabanının **kapsamlı dijital dönüşümü**: 186 hanedan, 830 hükümdar, 50 savaş, 50 olay, 49 âlim, 40 mimari eser, 15 ticaret yolu — tamamı coğrafi koordinatlarla, iki dilli (TR/EN) açıklamalarla ve analitik skorlarla zenginleştirilmiş olarak.

### Özellikler

🗺 **İnteraktif Harita** — ESRI gerçek topoğrafya (dağlar, çöller, nehirler) üzerinde 7 katman: hanedanlar, savaşlar, olaylar, âlimler, mimari eserler, şehirler, ticaret yolları

⏱ **Zaman Kaydırıcısı** — 622–1924 CE arası animasyonlu tarihî yolculuk; hanedanların yükselişi ve çöküşünü canlı izleyin

📅 **Kronolojik Zaman Çizelgesi** — D3.js ile hanedanların paralel varoluşu, savaşlar, olaylar ve âlim yaşam çizgileri

🔍 **5 Filtre** — Mezhep (Sünnî/Şiî/Hâricî), etnik köken, yönetim biçimi, dönem, coğrafi bölge

📊 **Analitik Skorlar** — Güç endeksi (power index), istikrar oranı, kültürel üretkenlik gibi 13 analitik metrik

🌐 **İki Dilli** — Türkçe (tam) | İngilizce (tam)

🎨 **Ottoman Manuscript Teması** — Osmanlı el yazması estetiği × karanlık kartografi

### Veri Seti İçeriği

| Tablo | Kayıt | Açıklama |
|---|---|---|
| `all_dynasties_enriched.csv` | 186 | Ana hanedan tablosu (52 sütun, v4 pedagojik alanlar) |
| `all_rulers_merged.csv` | 830 | Hükümdarlar (38 sütun) |
| `battles.csv` | 50 | Savaşlar (23 sütun, anlatı+etki+taktik) |
| `events.csv` | 50 | Önemli olaylar (19 sütun, anlatı+bağlantılar) |
| `scholars.csv` | 49 | Âlimler, şairler, bilginler (24 sütun, etki zinciri+himaye) |
| `monuments.csv` | 40 | Mimari eserler, 35'i UNESCO (24 sütun, ziyaretçi notu) |
| `trade_routes.csv` | 15 | Ticaret yolları, waypoint'lerle (22 sütun, anekdot) |
| `dynasty_relations.csv` | 101 | Hanedan ilişkileri (6 sütun) |
| `diplomacy.csv` | 30 | Diplomatik ilişkiler (14 sütun, anlatı+önem) |
| `major_cities.csv` | 69 | 20 büyük şehir × dönem (14 sütun, medeniyet katmanları) |
| `dynasty_analytics.csv` | 186 | Analitik skorlar (16 sütun) |
| `causal_links.csv` | 200 | Nedensellik ağı (8 sütun, 24 bağlantı tipi) |

### Kurulum

```bash
git clone https://github.com/alicetinkaya76/islamic-civilization-atlas.git
cd islamic-civilization-atlas
npm install
npm run dev
```

Tarayıcıda `http://localhost:3000` açılır.

### Alıntılama

```bibtex
@dataset{gokalp_cetinkaya_2026,
  author       = {Gökalp, Hüseyin and Çetinkaya, Ali},
  title        = {{Islamic Civilization Atlas: Interactive Historical 
                   Atlas of Bosworth's Islamic Dynasties}},
  year         = 2026,
  publisher    = {Zenodo},
  doi          = {10.5281/zenodo.18818238},
  url          = {https://doi.org/10.5281/zenodo.18818238}
}
```

---

## 🇬🇧 English

### What Is This?

A **comprehensive digital transformation** of Bosworth's Islamic Dynasties database: 186 dynasties, 830 rulers, 50 battles, 50 events, 49 scholars, 40 monuments, 15 trade routes — all enriched with geographic coordinates, bilingual (TR/EN) descriptions, and analytical scores.

### Features

🗺 **Interactive Map** — 7 layers on ESRI real topography (mountains, deserts, rivers): dynasties, battles, events, scholars, monuments, cities, trade routes

⏱ **Time Slider** — Animated historical journey 622–1924 CE; watch dynasties rise and fall in real time

📅 **Chronological Timeline** — D3.js visualization of parallel dynasty existence, battles, events, and scholar lifespans

🔍 **5 Filters** — Religion (Sunni/Shia/Kharijite), ethnic origin, government type, period, geographic zone

📊 **Analytical Scores** — 13 metrics including power index, stability ratio, cultural productivity

🌐 **Bilingual** — Turkish (complete) | English (complete)

🎨 **Ottoman Manuscript Theme** — Ottoman manuscript aesthetics × dark cartography

### Dataset Contents

| Table | Records | Description |
|---|---|---|
| `all_dynasties_enriched.csv` | 186 | Main dynasty table (52 columns, v4 pedagogical fields) |
| `all_rulers_merged.csv` | 830 | Rulers (38 columns) |
| `battles.csv` | 50 | Battles (23 columns, narrative+impact+tactics) |
| `events.csv` | 50 | Major events (19 columns, narrative+links) |
| `scholars.csv` | 49 | Scholars, poets, scientists (24 columns, influence chain+patronage) |
| `monuments.csv` | 40 | Monuments, 35 UNESCO sites (24 columns, visitor notes) |
| `trade_routes.csv` | 15 | Trade routes with waypoints (22 columns, anecdotes) |
| `dynasty_relations.csv` | 101 | Dynasty relations (6 columns) |
| `diplomacy.csv` | 30 | Diplomatic relations (14 columns, narrative+significance) |
| `major_cities.csv` | 69 | 20 major cities × period (14 columns, civilization layers) |
| `dynasty_analytics.csv` | 186 | Analytical scores (16 columns) |
| `causal_links.csv` | 200 | Causality network (8 columns, 24 link types) |

### Getting Started

```bash
git clone https://github.com/alicetinkaya76/islamic-civilization-atlas.git
cd islamic-civilization-atlas
npm install
npm run dev
```

Opens `http://localhost:3000` in your browser.

### Citation

```bibtex
@dataset{gokalp_cetinkaya_2026,
  author       = {Gökalp, Hüseyin and Çetinkaya, Ali},
  title        = {{Islamic Civilization Atlas: Interactive Historical 
                   Atlas of Bosworth's Islamic Dynasties}},
  year         = 2026,
  publisher    = {Zenodo},
  doi          = {10.5281/zenodo.18818238},
  url          = {https://doi.org/10.5281/zenodo.18818238}
}
```

---

## 📐 Mimari / Architecture

```
islamic-civilization-atlas/
├── data/                          # 📊 Kaynak veri setleri / Source datasets
│   ├── all_dynasties_enriched.csv # 186 hanedan (52 sütun)
│   ├── causal_links.csv          # 200 nedensellik bağlantısı
│   ├── all_rulers_merged.csv      # 830 hükümdar
│   ├── battles.csv                # 50 savaş
│   ├── events.csv                 # 50 olay
│   ├── scholars.csv               # 49 âlim
│   ├── monuments.csv              # 40 mimari eser
│   ├── trade_routes.csv           # 15 ticaret yolu
│   ├── dynasty_relations.csv      # 101 ilişki
│   ├── diplomacy.csv              # 30 diplomatik ilişki
│   ├── major_cities.csv           # 69 şehir verisi
│   └── dynasty_analytics.csv      # 186 analitik skor
├── docs/                          # 📖 Belgeler / Documentation
│   └── plan.md                    # Proje planı ve veri sözlüğü
├── src/                           # ⚛️ React uygulaması
│   ├── App.jsx                    # Ana uygulama (tab + dil)
│   ├── main.jsx                   # React mount
│   ├── components/
│   │   ├── MapView.jsx            # Leaflet harita + 7 katman
│   │   └── TimelineView.jsx       # D3.js zaman çizelgesi
│   ├── data/
│   │   ├── db.json                # Derlenmiş veri (161 KB)
│   │   ├── constants.js           # Renk paletleri, yardımcılar
│   │   └── i18n.js                # TR/EN çeviri sözlüğü
│   └── styles/
│       └── atlas.css              # Ottoman manuscript teması
├── CITATION.cff                   # Alıntılama meta verisi
├── LICENSE                        # CC BY-SA 4.0
├── package.json                   # Vite + React bağımlılıkları
└── vite.config.js                 # Build yapılandırması
```

---

## 📊 Veri Seti / Dataset

Veri seti Zenodo üzerinde bağımsız olarak da yayınlanmıştır:

**DOI:** [10.5281/zenodo.18818238](https://doi.org/10.5281/zenodo.18818238)

The dataset is also published independently on Zenodo:

**DOI:** [10.5281/zenodo.18818238](https://doi.org/10.5281/zenodo.18818238)

### Top 5 Güç Endeksi / Top 5 Power Index

| Hanedan / Dynasty | Güç / Power | Süre / Duration | Hükümdar / Rulers |
|---|---|---|---|
| Abbâsîler / Abbasids | 86 | 508 yıl | 37 |
| Memlûkler / Mamluks | 76 | 267 yıl | 49 |
| Selçuklular / Seljuqs | 75 | 157 yıl | 18 |
| Osmanlılar / Ottomans | 64 | 623 yıl | 36 |
| Delhi Sultanlığı / Delhi Sultanate | 58 | 320 yıl | 34 |

---

## 🤝 Katkıda Bulunma / Contributing

Katkılarınızı bekliyoruz! / Contributions are welcome!

- 📊 Veri düzeltmeleri / Data corrections
- 🌐 Çeviri iyileştirmeleri / Translation improvements
- 🐛 Bug düzeltmeleri / Bug fixes
- 📝 İçerik zenginleştirme / Content enrichment

```bash
git checkout -b feature/your-feature
git commit -m "feat: add your feature"
git push origin feature/your-feature
# Pull Request açın / Open a Pull Request
```

---

## 👥 Yazarlar / Authors

| | |
|---|---|
| **Dr. Hüseyin Gökalp** | Selçuk Üniversitesi, İlahiyat Fakültesi, İslam Tarihi Bölümü |
| | Selçuk University, Faculty of Theology, Dept. of Islamic History |
| | 📧 huseyin.gokalp@selcuk.edu.tr |
| **Dr. Ali Çetinkaya** | Selçuk Üniversitesi, Teknoloji Fakültesi, Bilgisayar Mühendisliği Bölümü |
| | Selçuk University, Faculty of Technology, Dept. of Computer Engineering |
| | 📧 ali.cetinkaya@selcuk.edu.tr · ORCID: [0000-0002-7747-6854](https://orcid.org/0000-0002-7747-6854) |

---

## 📄 Lisans / License

Bu çalışma [Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)](LICENSE) lisansı altındadır.

This work is licensed under [Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)](LICENSE).

Kaynak veri seti C.E. Bosworth'un referans eserine dayalıdır: Bosworth, C.E. (2004). *The New Islamic Dynasties*. Edinburgh University Press.

---

## 🙏 Referanslar / References

- Bosworth, C.E. (2004). *The New Islamic Dynasties: A Chronological and Genealogical Manual*. Edinburgh University Press.
- [Leaflet.js](https://leafletjs.com/) — İnteraktif harita kütüphanesi
- [D3.js](https://d3js.org/) — Veri görselleştirme kütüphanesi
- [ESRI World Shaded Relief](https://www.arcgis.com/) — Kartografik harita karoları

---

**Islamic Civilization Atlas** — *1300 yıllık İslam medeniyetini bir haritada keşfedin.*

*Explore 1300 years of Islamic civilization on one map.*

⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın! / Star this repo if you find it useful!

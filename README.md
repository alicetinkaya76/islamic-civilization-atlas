# Müslüman Hanedanlar Atlası / Islamic Dynasties Atlas

[![Version](https://img.shields.io/badge/version-6.0.0-gold)]()
[![License](https://img.shields.io/badge/license-CC--BY--SA--4.0-green)]()
[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.18824469.svg)](https://doi.org/10.5281/zenodo.18824469)

Bosworth'un İslam hanedanları veritabanı, ez-Ziriklî'nin el-A'lâm ansiklopedisi ve Yâkût el-Hamevî'nin Mu'cem el-Büldân eserinin interaktif görselleştirmesi.

**186 hanedan · 830 hükümdar · 450 âlim · 13.940 biyografi · 12.954 coğrafi kayıt · 632–1924 CE · Türkçe/İngilizce/Arapça**

🌐 **Canlı:** [islamicatlas.org](https://islamicatlas.org)

## Özellikler (v6.0.0)

| Panel | İçerik |
|-------|--------|
| 🗺 Harita | 186 hanedan, 100 savaş, 450 âlim, 120 anıt, 80 şehir, 15 ticaret yolu (170 waypoint), 100 medrese, 20 vakıf |
| 📊 Pano | Hanedan güç indeksleri, coğrafi dağılım, dönem karşılaştırmaları |
| 📅 Zaman Çizelgesi | 632–1924 kronoloji, era bandları, hoca-öğrenci bağları |
| 🔗 Nedensellik | 200 neden-sonuç bağlantısı, D3 force-directed ağ |
| 🎓 Âlimler | 450 âlim, göç animasyonları, disiplin zaman çizelgesi |
| ⚔ Savaşlar | 100 savaş haritası, komutan bilgileri, taktik analizler |
| 📖 el-A'lâm | 13.940 biyografi — harita, analitik, referans ağı, zaman makinesi |
| 🌍 Mu'cem | 12.954 coğrafi kayıt — %88.6 geocoded, DİA çapraz referans |

### Yeni Bileşenler (v5.0–v6.0)
- **HeatmapLayer**: Canvas tabanlı zoom-adaptive yoğunluk haritası
- **YearExplorer**: "Bu Yıl Ne Oldu?" 10-kategori tarayıcı
- **ScholarMigrationMap**: 88 âlimin doğum→eğitim→vefat göç animasyonu
- **Waqf Katmanı**: 20 vakıf kaydı (9 hanedan, 786–1670)
- **Deep Link**: `#dynasty/42`, `#scholar/10`, `#year/1258` URL desteği
- **SEO Meta**: Open Graph + Twitter Card dinamik etiketler
- **10 Rehberli Tur**: İpek Yolu, Moğol Fırtınası, Altın Çağ, Osmanlı, Mimari, Endülüs, Hindistan, Afrika, Bilim, Moğol (Genişletilmiş)
- **Admin Panel**: Tam CRUD — 14 koleksiyon + yardımcı veri modülleri

## Veri Kaynakları
- C.E. Bosworth, *The New Islamic Dynasties* (Edinburgh University Press, 1996)
- Hayruddîn ez-Ziriklî, *el-A'lâm* (15. baskı, 8 cilt)
- Yâkût el-Hamevî, *Mu'cemü'l-Büldân* (6 cilt)
- TDV İslam Ansiklopedisi (DİA) — çapraz referans

## Teknoloji
React 18 · Vite · Leaflet · D3.js · Three.js · Vercel

## Kurulum
```bash
npm install && npm run dev
```

## Atıf
```bibtex
@software{cetinkaya2026atlas,
  author = {Çetinkaya, Ali},
  title  = {Müslüman Hanedanlar Atlası / Islamic Dynasties Atlas},
  year   = {2026},
  doi    = {10.5281/zenodo.18824469},
  url    = {https://github.com/alicetinkaya76/islamic-civilization-atlas}
}
```

## Lisans
CC BY-SA 4.0 — Ali Çetinkaya, Selçuk University
ORCID: [0000-0002-7747-6854](https://orcid.org/0000-0002-7747-6854)

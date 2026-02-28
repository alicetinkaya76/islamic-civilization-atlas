# Zenodo Upload Metadata / Zenodo Yükleme Meta Verisi

## ADIM 1 — Zenodo'da DOI Rezerve Et / Reserve DOI on Zenodo

1. https://zenodo.org adresine ORCID ile giriş yap
2. "New Upload" → "Get a DOI now!" butonuna tıkla
3. DOI'yi not al (10.5281/zenodo.18818238 formatında)
4. Bu DOI'yi aşağıdaki yerlerde güncelle:
   - README.md (3 yerde)
   - CITATION.cff (doi alanı)

## ADIM 2 — Zenodo Upload Formunu Doldur

### Resource Type
`Dataset`

### Title
```
Islamic Civilization Atlas Dataset: Bosworth's Islamic Dynasties Database (632–1924 CE)
```

### Description (düz metin — kopyala yapıştır)
```
English:
A comprehensive structured dataset of 186 Islamic dynasties (632–1924 CE) based on C.E. Bosworth's "The New Islamic Dynasties" (Edinburgh University Press, 2004). The dataset includes 11 interlinked CSV tables covering dynasties, rulers, battles, events, scholars, monuments, trade routes, diplomatic relations, major cities, and analytical scores. All entries are bilingual (Turkish/English) and geolocated with coordinates.

Türkçe:
C.E. Bosworth'un "The New Islamic Dynasties" (Edinburgh University Press, 2004) referans eserine dayalı, 186 İslam hanedanını (632–1924) kapsayan kapsamlı yapılandırılmış veri seti. 11 birbiriyle ilişkili CSV tablosu: hanedanlar, hükümdarlar, savaşlar, olaylar, âlimler, mimari eserler, ticaret yolları, diplomatik ilişkiler, büyük şehirler ve analitik skorlar. Tüm kayıtlar iki dilli (TR/EN) ve coğrafi koordinatlarla zenginleştirilmiş.

Contents:
- all_dynasties_enriched.csv — 186 dynasties (44 columns)
- all_rulers_merged.csv — 830 rulers (38 columns)
- battles.csv — 50 battles (16 columns)
- events.csv — 50 major events (12 columns)
- scholars.csv — 49 scholars (17 columns)
- monuments.csv — 40 monuments, 35 UNESCO (17 columns)
- trade_routes.csv — 15 trade routes (18 columns)
- dynasty_relations.csv — 101 dynasty relations (6 columns)
- diplomacy.csv — 30 diplomatic relations (10 columns)
- major_cities.csv — 69 city records (10 columns)
- dynasty_analytics.csv — 186 analytical scores (16 columns)
```

### Authors (ORCID link ile)
```
1. Çetinkaya, Ali — Selçuk University — ORCID: 0000-0002-7747-6854
2. Gökalp, Hüseyin — Selçuk University
```

### Publication Date
`2026-02-28`

### Keywords
```
islamic history, digital humanities, bosworth, islamic dynasties, 
historical GIS, data visualization, ottoman, caliphate, seljuq, 
abbasid, islamic civilization, historical atlas, bilingual dataset
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

### Subjects / Communities
- Digital Humanities
- History
- Islamic Studies

## ADIM 3 — Dosyaları Yükle

Zenodo'ya `islamic-civilization-atlas-dataset-v1.0.zip` dosyasını yükle.
Bu zip içinde sadece CSV dosyaları ve data_dictionary.md bulunur.

## ADIM 4 — Yayınla

"Publish" butonuna tıkla. DOI aktif olacak.

## ADIM 5 — GitHub'ı Güncelle

README.md ve CITATION.cff'deki `18818238` placeholder'larını gerçek Zenodo DOI numarası ile değiştir.

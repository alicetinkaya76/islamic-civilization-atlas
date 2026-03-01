# Islamic Dynasties Atlas — v4.0.0 Master Plan

## Vizyon: HistoryMaps + Chronas + Omniatlas Seviyesinde Sofistikasyon

**Referans projeler:**
- **HistoryMaps.com** — 3D Mapbox terrain, story-driven anlatı, sinematik kamera, 58 dil
- **Chronas.org** — 50M veri noktası, Wikipedia entegrasyonu, animasyonlu sınırlar
- **Omniatlas.com** — BBC kalitesinde haritalar, temiz kartografi, detaylı sınırlar
- **Timemaps.com** — Eğitim odaklı, cause-effect vurgusu, müfredat uyumlu

**Bizim farkımız:** Bu projelerin hiçbiri sadece İslam medeniyetine odaklanmıyor.
Biz Bosworth'un akademik veritabanına dayanan, İslam tarihi öğrencileri için
tasarlanmış tek kapsamlı dijital atlas olacağız.

---

## SEANS PLANI: v4.0.0

### ⏱ Tahmini süre: 1 uzun seans (tüm adımlar sıralı)

---

## ADIM 1: İSİM DEĞİŞİKLİĞİ (10 dk)

**"İslam Medeniyeti Atlası" → "İslam Hanedanları Atlası / Islamic Dynasties Atlas"**

Dosyalar: index.html, i18n.js, manifest.json, CITATION.cff, README.md,
AboutModal.jsx, CitationBox.jsx, Footer.jsx

---

## ADIM 2: HARİTA GÖRSEL DEVRİMİ (90 dk) ⭐⭐⭐

Bu en kritik adım. HistoryMaps'in Mapbox Dark + terrain efektinden ilham alarak,
Leaflet üzerinde yapılabilecek en sofistike görsel deneyimi oluşturacağız.

### 2.1 — Koyu Harita Altlığı (Dramatic Dark Cartography)

Mevcut ESRI Shaded Relief çok açık → entity'ler kayboluyor.

**Çözüm: Çift katmanlı koyu altlık**
```
Altlık 1: CartoDB Dark Matter (veya ESRI Dark Gray)
Altlık 2: Stamen Terrain Lines (hafif opacity ile)
→ Koyu zemin + fiziksel coğrafya hissiyatı
```

Bu değişiklik tek başına haritayı dramatik şekilde iyileştirecek.

### 2.2 — Hanedan Toprak Gösterimi (Animated Borders)

Mevcut: Soluk, düz dikdörtgenler → neredeyse görünmez.

**Çözüm:**
- Opacity: Kritik 0.35→0.45, Yüksek 0.25→0.35
- Border: Kritik weight 4, glow efekti (CSS box-shadow)
- **Hanedan adı etiketi**: Rectangle merkezinde, zoom>5 ise göster
- **Pulse animasyonu**: Aktif (yıl aralığında) hanedanlar hafif nabız atar
- **Gradient fill**: Tek renk yerine radial gradient (merkezden kenara solma)

### 2.3 — Sofistike İkon Sistemi (2-3x büyük, tematik SVG)

Mevcut: Küçücük geometrik şekiller (8-14px) → ayırt edilemiyor.

**Yeni ikonlar (tümü custom SVG, 20-28px):**

| Entity | Eski | Yeni İkon | Boyut | Detay |
|---|---|---|---|---|
| Savaş | 8px üçgen | ⚔ Çapraz kılıç | 22px | Kırmızı, beyaz kenar, gölge |
| Olay | 12px kare | 📜 Parşömen | 20px | Mavi, kıvrımlı kenar |
| Âlim | 4px daire | 📖 Açık kitap | 18px | Yeşil, altın kenar |
| Eser | 14px üçgen | 🕌 Cami silueti | 24px | Altın, minare detayı |
| Şehir | 5px daire | 🏛 Bina cephesi | 18px | Turuncu, pencere detayı |
| Hanedan merkez | 6px daire | ☪ Hilal yıldız | 14px | Hanedan rengi, halo |
| Hükümdar | 5px daire | 👑 Taç | 16px | Mor, altın detay |

**Her ikon için 3 varyant:** aktif (parlak), geçmiş (soluk), gelecek (çok soluk)

### 2.4 — Ticaret Yolları Devrimi

Mevcut: İnce, soluk çizgiler → göremiyorsun.

**Çözüm:**
- Kalınlık: 5-7px (aktif dönem), 2-3px (pasif)
- **Animated dash**: Hareket eden kesikli çizgi (ticaret akışı hissi)
- **Gradient renk**: Başlangıçtan bitişe renk geçişi
- **Kara vs Deniz ayrımı**: Kara = düz çizgi, Deniz = dalgalı (sine wave SVG)
- **Ok işaretleri**: Yol boyunca küçük ok uçları (yön göstergesi)
- **Tooltip**: Yol üzerine hover → isim + dönem + taşınan mallar

### 2.5 — Renk Lejantı (MapLegend.jsx)

HistoryMaps ve Omniatlas'ta her zaman görünür bir lejant var.

**Konum:** Harita sağ alt köşe (toggle ile küçültülebilir)

**İçerik:**
```
┌─ Lejant ──────────────────┐
│ MEZHEPler                  │
│  ● Sünnî  ● Şiî  ● Hâricî│
│                            │
│ VARLIKLAR                  │
│  ⚔ Savaş  📜 Olay         │
│  📖 Âlim  🕌 Eser          │
│  🏛 Şehir  🛤 Ticaret      │
│                            │
│ ÖNEM                       │
│  ██ Kritik ██ Yüksek       │
│  ░░ Normal ░░ Düşük        │
└────────────────────────────┘
```

### 2.6 — Zoom-Responsive Akıllı Gösterim

HistoryMaps'in en güzel özelliklerinden biri: zoom seviyesine göre detay.

```
Zoom 3-4: Sadece Kritik hanedanlar + büyük savaşlar (isim etiketsiz)
Zoom 5-6: Tüm hanedanlar + savaşlar + eserler (Kritik etiketli)
Zoom 7-8: Tüm entity'ler + etiketler + ticaret yolları
Zoom 9+:  Tam detay + şehir isimleri + âlim isimleri
```

**Cluster**: Aynı bölgedeki marker'lar zoom-out'ta cluster'a dönüşür (sayı badge)

### 2.7 — Harita Etkileşim İyileştirmeleri

- **Hover efekti**: Marker üzerine gelince büyüme animasyonu (scale 1.3x)
- **Seçili entity**: Tıklanınca etrafında parlayan halka
- **Bağlantı çizgileri**: Popup açıkken ilişkili entity'lere noktalı çizgi
- **Mini-map**: Sol alt köşede küçük dünya haritası (mevcut viewport göstergesi)

---

## ADIM 3: ZAMAN KAYDIRICI YENİDEN TASARIMI (30 dk)

Mevcut time slider sade ama Chronas/HistoryMaps seviyesinde değil.

### 3.1 — "Bu Yılda Ne Oldu?" Paneli (YearInfoPanel.jsx)

Zaman kaydırıcısının hemen üstünde, otomatik güncellenen bilgi şeridi:

```
┌──────────────────────────────────────────────────────┐
│ 📅 900 CE                                             │
│ ⏤⏤⏤⏤⏤⏤⏤⏤⏤⏤⏤⏤⏤⏤⏤⏤⏤⏤⏤⏤⏤⏤⏤⏤ │
│ 👑 Aktif: Abbâsîler, Sâmânîler, Fâtımîler (+12)     │
│ ⚔ Son savaş: Talas (751)  ▸ Sonraki: ...             │
│ 📖 Yaşayan âlim: el-Kindî, Râzî                      │
│ 🕌 Yeni eser: Sâmarrâ Melviyesi (851)                │
└──────────────────────────────────────────────────────┘
```

- Yıl değişince 200ms debounce ile güncellenir
- Maksimum 4 satır, compact
- Her satır tıklanabilir → ilgili entity'ye flyTo

### 3.2 — Dönem Bantları (Era Strips)

Zaman kaydırıcısının altında renkli dönem bantları:
```
|--Dört Halife--|---Emevîler---|-----Abbâsî Altın Çağı-----|--Selçuklu--|--Moğol--|--Osmanlı--|
  632-661         661-750         750-1055                    1038-1194   1206-1370  1300-1922
```

- Renk kodlu, tıklanınca dönem bilgi kartı açılır
- Aktif dönem vurgulu (parlak)

---

## ADIM 4: PEDAGOJİK ÖZELLİKLER (60 dk) ⭐⭐⭐

### 4.1 — Dönem Bilgi Kartları (EraCard.jsx)

Timemaps.com'dan ilham. Bir döneme tıklanınca veya zaman kaydırıcıyla o döneme
gelindiğinde gösterilen zengin bilgi kartı:

```
┌─ Abbâsî Altın Çağı (750–1055) ──────────┐
│                                            │
│  Bağdat, dünya ilim merkeziydi.            │
│  Beytü'l-Hikme'de Yunan, Hint ve Fars     │
│  eserleri Arapçaya çevrildi. Cebir,       │
│  optik, tıp ve astronomi bu dönemde       │
│  zirveye ulaştı.                          │
│                                            │
│  🔑 Anahtar gelişmeler:                   │
│  · Beytü'l-Hikme (830)                    │
│  · Cebir ilminin doğuşu (Hârizmî)        │
│  · Hint rakamlarının benimsenmesi          │
│                                            │
│  📖 Öne çıkan âlimler:                    │
│  el-Hârizmî · İbn Sînâ · İbnü'l-Heysem   │
│                                            │
│  🗺 İlgili tur: İslam'ın Altın Çağı →    │
└────────────────────────────────────────────┘
```

8-10 dönem için hazır içerik:
1. Hz. Muhammed Dönemi (610-632)
2. Dört Halife (632-661)
3. Emevî Halifeliği (661-750)
4. Abbâsî Altın Çağı (750-1055)
5. Selçuklu Dünyası (1038-1194)
6. Haçlı Seferleri Dönemi (1096-1291)
7. Moğol İstilâsı ve Sonrası (1206-1405)
8. Osmanlı Yükselişi (1300-1566)
9. Üç Büyük İmparatorluk (1500-1700) — Osmanlı, Safevî, Bâbürlü
10. Modern Dönem (1700-1924)

### 4.2 — Quiz / Bilgi Testi Modu (QuizMode.jsx)

HistoryMaps'te yok ama eğitim odaklı bir atlas için oyun değiştirici.

**DB'den otomatik soru üretimi:**
```javascript
// Soru tipleri:
1. "Bu hanedan hangi yüzyılda kuruldu?" (4 şık — tarih)
2. "Bu savaşın galibi kim?" (4 şık — taraf)
3. "Bu âlim hangi alanda çalıştı?" (4 şık — alan)
4. "Bu eser nerede bulunur?" (haritada tıkla — coğrafya)
5. "Hangisi daha önce kuruldu?" (2 hanedan karşılaştırma — kronoloji)
6. "Bu olayın önemi nedir?" (4 şık — anlam)
```

**Akış:**
1. "🎓 Quiz" butonu → 10 soruluk tur başlar
2. Her soru: 4 şık + 15 saniye süre + haritada ipucu
3. Doğru → yeşil flash + haritada flyTo + kısa bilgi
4. Yanlış → kırmızı flash + doğru cevap gösterilir
5. Son: "Skor: 7/10 — Tarih Meraklısı! 🏅"

**Zorluk seviyeleri:**
- 🟢 Kolay: Büyük hanedanlar, ünlü savaşlar
- 🟡 Orta: Orta ölçekli hanedanlar, âlimler
- 🔴 Zor: Küçük beylikler, detay sorular

### 4.3 — Terimler Sözlüğü (glossary.js + GlossaryModal.jsx)

**~50 İslam tarihi terimi:**
Halife, Sultan, Emîr, Atabey, Vezir, Kadı, Divan, İkta, Vakıf,
Medrese, Ribat, Kervansaray, Dârülhadis, Bîmâristan, Cizye, Haraç,
Fetva, Şeriat, Fıkıh, Hadis, Tefsir, Tasavvuf, Tarikat, Tekke/Zaviye,
Gazve, Cihad, Ümmet, Hilafet, Beylik, Sancak, Eyalet, Vilayet,
Tımar, Devşirme, Kapıkulu, Yeniçeri, Sipahi, Ulema, Müderris,
Mushaf, Hutbe, Minber, Mihrab, Kubbe, Minare, İwan, Mukarnas...

**Entegrasyon:**
- Popup'larda geçen terimlere otomatik altı çizili link
- Tıklanınca mini-tooltip açıklama (TR + EN)
- Header'da "📖 Sözlük" butonu → tam sözlük modal

### 4.4 — İlerleme Takibi (ProgressTracker.jsx)

Timemaps'in "course tracking" özelliğinden ilham.

**localStorage'da takip:**
```
- Keşfedilen hanedanlar: 23/186 (%12)
- Keşfedilen savaşlar: 8/50 (%16)
- Keşfedilen âlimler: 5/49 (%10)
- Tamamlanan turlar: 1/5 (%20)
- Quiz en yüksek skor: 7/10
```

**Rozet sistemi:**
- 🏅 İlk Adım — İlk popup'ı aç
- ⚔ Savaş Meraklısı — 10 savaş keşfet
- 📚 Bilge — 10 âlim keşfet
- 🗺 Gezgin — 3 tur tamamla
- 👑 Tarihçi — 50 hanedan keşfet
- 🏆 Uzman — 100 entity keşfet

**Gösterim:** Header'da küçük ilerleme ikonu + tıklanınca detay panel

---

## ADIM 5: ARAMA & KEŞİF (30 dk)

### 5.1 — Global Arama Çubuğu (SearchBar.jsx)

Header'da, dil butonunun yanında.

**Özellikler:**
- Debounced fuzzy search (300ms)
- Türkçe karakter toleransı: ı↔i, ş↔s, ç↔c, ğ↔g, ö↔o, ü↔u
- Tüm entity tipleri: hanedan, savaş, olay, âlim, eser, şehir, hükümdar
- Her sonuçta: ikon + isim + tip + tarih
- Seçimde: haritada flyTo + popup açma
- Maksimum 8 sonuç dropdown

```
┌─ 🔍 ibn sina ─────────────────────┐
│ 📖 İbn Sînâ (Avicenna) · Âlim · 980-1037  │
│ 🕌 İbn Sînâ Türbesi · Eser · Hamedan       │
│ 👑 ... (ilgili hükümdarlar)                 │
└─────────────────────────────────────────────┘
```

### 5.2 — Rastgele Keşfet Butonu

"🎲" butonu → rastgele entity seç → flyTo + popup aç
Her tıklamada farklı entity tipi (round-robin)

---

## DOSYA YAPISI (v4.0.0 hedef)

### Yeni dosyalar:
```
src/components/shared/MapLegend.jsx        — Renk lejantı
src/components/shared/YearInfoPanel.jsx    — "Bu yılda ne oldu?"
src/components/shared/EraCard.jsx          — Dönem bilgi kartları
src/components/shared/QuizMode.jsx         — Bilgi testi
src/components/shared/GlossaryModal.jsx    — Terimler sözlüğü
src/components/shared/ProgressTracker.jsx  — İlerleme + rozetler
src/components/shared/SearchBar.jsx        — Global arama
src/data/glossary.js                       — 50 terim verisi
src/data/era_info.js                       — 10 dönem açıklaması
src/styles/legend.css                      — Lejant
src/styles/pedagogy.css                    — Quiz, sözlük, ilerleme
src/styles/search.css                      — Arama çubuğu
```

### Güncellenen dosyalar:
```
index.html                          — İsim + meta
src/data/i18n.js                    — İsim + 30+ yeni UI key
src/App.jsx                         — SearchBar, ProgressTracker entegrasyonu
src/components/map/MapView.jsx      — Legend, YearInfo, zoom handler, dark tile
src/components/map/LayerManager.js  — Yeni SVG ikonlar, büyük boyut, cluster
src/config/layers.js                — Dark tile URL
src/config/colors.js                — Güçlendirilmiş opacity
src/styles/map.css                  — Glow, pulse, hover efektleri
public/manifest.json                — İsim
CITATION.cff                        — İsim
README.md                           — İsim + v4 özellikleri
```

---

## ÖNCELİK MATRİSİ

| # | Görev | Etki | Efor | Seans İçi |
|---|---|---|---|---|
| 1 | İsim değişikliği | Yüksek | Düşük | ✅ İlk |
| 2 | Koyu harita altlığı | ÇOK YÜKSEK | Düşük | ✅ Hemen |
| 3 | Marker boyut + ikon devrimi | ÇOK YÜKSEK | Yüksek | ✅ Ana iş |
| 4 | Ticaret yolları güçlendirme | Yüksek | Orta | ✅ |
| 5 | Renk lejantı | Yüksek | Düşük | ✅ |
| 6 | YearInfoPanel | Yüksek | Orta | ✅ |
| 7 | Dönem bilgi kartları | Yüksek | Orta | ✅ |
| 8 | Quiz modu | ÇOK YÜKSEK | Yüksek | ✅ |
| 9 | Terimler sözlüğü | Yüksek | Orta | ✅ |
| 10 | Arama çubuğu | Yüksek | Orta | ✅ |
| 11 | İlerleme takibi | Orta | Orta | ✅ Efor kalırsa |
| 12 | Zoom-responsive | Orta | Orta | ✅ Efor kalırsa |

---

## SÜRÜM GEÇMİŞİ

| Sürüm | Tarih | Açıklama |
|---|---|---|
| v1.0.0 | 28 Şubat 2026 | İlk yayın: harita + timeline |
| v2.0.0 | 1 Mart 2026 | Pedagojik zenginleştirme, nedensellik ağı |
| v3.0.0 | 1 Mart 2026 | Modüler mimari, 830 hükümdar, 5 tur, mobil PWA |
| **v4.0.0** | **Sonraki** | **İsim, görsel devrim, quiz, sözlük, arama** |

---

## GELECEKTEKİ FAZLAR (v4.0.0 sonrası)

### v4.1.0 — İçerik
- 990 eksik EN çeviri tamamlama
- 5 yeni rehberli tur (Haçlı, Endülüs, Afrika, Hint Okyanusu, Bilim Yolculuğu)

### v5.0.0 — Gelişmiş Özellikler
- Karşılaştırma modu (radar chart)
- Veri dışa aktarma (CSV/JSON/PDF)
- Embed widget (iframe)
- 3D Terrain (Mapbox GL JS'ye geçiş — uzun vadeli)

### v6.0.0 — Veri Genişletme
- Savaşlar 50→100, Âlimler 49→100, Eserler 40→80, Şehirler 69→120
- Hükümdar biyografileri
- Medeniyetler arası karşılaştırma (Bizans, Çin, Avrupa)

### Paralel — Akademik Yaygın Etki
- TALLIP/DHQ makale
- BRAIS 2025 bildiri
- Zenodo v4.0
- Eğitim kurumlarına tanıtım

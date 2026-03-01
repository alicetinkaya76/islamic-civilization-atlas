# SONRAKI SEANS PROMPT'U

Aşağıdaki prompt'u yeni bir Claude sohbetinde, proje zip'i ve plan.md ile birlikte yapıştır.

---

## Yüklenecek dosyalar:
1. `islamic-civilization-atlas-v5-phase5.8.zip` (mevcut proje)
2. `plan.md` (bu güncel plan)

---

## Yapıştırılacak prompt:

```
Bu proje "Islamic Dynasties Atlas" — Bosworth'un İslam hanedanları veritabanının 
interaktif görselleştirmesi. React/Vite + Leaflet + D3. v3.0.0 yayında, v4.0.0 
yapılacak.

Detaylı plan docs/plan.md dosyasında. ÖNCE PLAN.MD'Yİ OKU, sonra sırasıyla uygula.

Bu seansta yapılacak 5 büyük görev:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. İSİM DEĞİŞİKLİĞİ
   "İslam Medeniyeti Atlası" → "İslam Hanedanları Atlası / Islamic Dynasties Atlas"
   Güncelle: index.html, i18n.js, manifest.json, CITATION.cff, README.md,
   AboutModal, CitationBox, Footer

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2. HARİTA GÖRSEL DEVRİMİ (en kritik — harita şu an çok sönük ve okunaksız)
   
   a) Koyu harita tile'ı: CartoDB Dark Matter veya ESRI Dark Gray 
      (açık zemin → entity'ler kayboluyor, koyu zemin şart)
   
   b) Sofistike SVG ikonlar: Tüm marker'ları 2-3x büyüt
      Savaş→22px kılıç, Olay→20px parşömen, Âlim→18px kitap, 
      Eser→24px cami silueti, Şehir→18px bina, Hükümdar→16px taç
   
   c) Hanedan rectangle: opacity artır, border kalınlaştır, 
      merkeze isim etiketi koy (zoom>5), pulse animasyonu
   
   d) Ticaret yolları: weight 5-7, animated dash, ok yönü, 
      kara/deniz ayrımı
   
   e) Renk lejantı (MapLegend.jsx): sağ alt köşede, mezhep renkleri + 
      entity ikonları + önem dereceleri
   
   f) Zoom-responsive: düşük zoom'da sadece büyükler, yüksek zoom'da 
      tüm detay + etiketler
   
   g) Hover efektleri: marker büyüme, seçili halka, bağlantı çizgileri

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3. ZAMAN KAYDIRICI İYİLEŞTİRME
   
   a) "Bu Yılda Ne Oldu?" paneli (YearInfoPanel.jsx):
      Slider üstünde 4 satır bilgi — aktif hanedanlar, son savaş, 
      yaşayan âlimler, yeni eserler
   
   b) Dönem bilgi kartları (EraCard.jsx):
      10 dönem için zengin açıklama kartları (tıklanınca açılır)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

4. PEDAGOJİK ÖZELLİKLER (İslam tarihi öğrencileri için)
   
   a) Quiz modu (QuizMode.jsx): 
      DB'den otomatik soru üretimi, 10 soruluk turlar, 
      doğru/yanlış + flyTo, skor + zorluk seviyeleri
   
   b) Terimler sözlüğü (glossary.js + GlossaryModal.jsx):
      ~50 İslam tarihi terimi (Halife, Sultan, Medrese, Vakıf...), 
      popup'larda otomatik link, mini-tooltip
   
   c) İlerleme takibi (ProgressTracker.jsx):
      localStorage, keşif sayacı, rozet sistemi 
      (🏅 İlk Adım, ⚔ Savaş Meraklısı, 📚 Bilge, 🏆 Uzman)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

5. ARAMA & KEŞİF
   
   a) Global arama çubuğu (SearchBar.jsx):
      Header'da, fuzzy search, Türkçe karakter toleransı, 
      tüm entity tipleri, flyTo + popup açma
   
   b) Rastgele keşfet butonu: 🎲 tıkla → rastgele entity → flyTo

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

İlham kaynakları: HistoryMaps.com (3D terrain, sinematik), 
Chronas.org (50M data point, animasyonlu sınırlar), 
Omniatlas.com (BBC kalitesi kartografi)

Build hedefi: 0 hata, 0 uyarı.
Sıra: İsim → Tile → İkonlar → Lejant → YearInfo → Quiz → Sözlük → Arama → Build
```

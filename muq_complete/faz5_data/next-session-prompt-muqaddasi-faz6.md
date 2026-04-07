# Makdisî Katmanı — Faz 5 Tamamlandı / Faz 6 Planlama

## Faz 5 Sonuçları

| Metrik | Faz 4 | Faz 5 | Δ |
|--------|-------|-------|---|
| Koordinat kapsamı | 2,031/2,052 (%99.0) | 2,049/2,049 (**%99.9**) | +18 (3 junk elendi) |
| Tam güzergâh | 1,420/1,427 (%99.5) | 1,424/1,427 (**%99.8**) | +4 |
| GeoJSON segment | 1,420 | 1,424 | +4 |
| Junk entry (c/v/م) | — | 3 flagged | yeni |
| Marhala tipizasyonu | — | 0 light/heavy bulundu | araştırıldı |
| MuqaddasiLayer.jsx | — | ✅ oluşturuldu | yeni |
| Dashboard v5 | — | ✅ Voronoi+bee-swarm+confidence | yeni |

### Faz 5 Çözülen 18 Yer (certainty: estimated, coord_source: faz5_manual_estimate)
| Yer | İklim | Koordinat | Gerekçe |
|-----|-------|-----------|---------|
| تاويلت ابى مغول تامزيت | المغرب | 30.50, -6.00 | Berber/Amazigh, Draa-Tafilalet |
| تاويلت لغوا | المغرب | 30.30, -6.20 | Berber/Amazigh, Sous-Draa |
| ترار زراخ | إقليم المشرق | 39.00, 66.00 | Transoxiana corridor |
| ترك نيشان | إقليم المشرق | 39.50, 66.50 | Turkic settlement, Transoxiana |
| جمونس الصابون | المغرب | 35.00, 2.00 | Central Algeria |
| حبك ذو قرطم | جزيرة العرب | 14.50, 44.00 | Yemeni highland |
| حصن الخوابي | الشام | 34.82, 36.12 | Fortress near Safita |
| حصن السودان | جزيرة العرب | 15.00, 43.50 | Tihama/Yemen |
| دات العشر | جزيرة العرب | 24.70, 45.70 | Near al-Yamama (route neighbor at 24.93,46.01) |
| ده نوجيكت | إقليم المشرق | 37.00, 60.00 | Persian "dih", Khurasan |
| ربنجان قطوانة | الجبال | 34.50, 49.00 | Western Iran |
| رم الأكراد | أقور | 36.50, 40.00 | Kurdish upper Jazira |
| رم شهريار | العراق | 33.50, 44.50 | Sawad region |
| سوق إبراهيم | العراق | 33.00, 44.00 | Central Iraq market |
| سوق الكتامي | المغرب | 36.50, 3.00 | Kutama Berber tribal market |
| لاه وكره | فارس | 29.80, 52.50 | Fars, between Sarvestan route |
| مرسى الحجامين | المغرب | 35.80, -0.50 | Mediterranean coast port |
| موضع بغراخاقان | إقليم المشرق | 40.30, 64.60 | 6 marhala from Barskhan al-Aʿla |

## Faz 5 Dosyaları
| Dosya | Açıklama |
|-------|----------|
| `muqaddasi_atlas_layer_v5.0.json` | Ana veri (~1.7 MB) |
| `muqaddasi_frontend_data_v5.json` | Frontend kompakt (2,049 yer) |
| `muqaddasi_routes_v5.geojson` | 1,424 GeoJSON segment |
| `dashboard_data_v5.json` | İklim istatistik + centroid |
| `MuqaddasiLayer.jsx` | React bileşeni (Leaflet, filter panel) |

## Faz 6'da Yapılacaklar

### A) Açıklama Zenginleştirme (Öncelikli)
- 878/2,049 yerin açıklaması var — kalan ~1,171 yere orijinal metninden çıkarma
- OpenITI mARkdown dosyasından (`0390Muqaddasi.AhsanTaqasim.MSG20230908-ara1.mARkdown`) LLM ile toplu açıklama
- İklim düzeyinde genel tasvir paragrafları (Makdisî'nin metin içi betimlemeleri)
- AR → TR/EN çeviri

### B) Koordinat Doğrulaması
- Faz 4'teki bazı coord_source: faz3_match/faz4_resolve değerleri şüpheli (örn. سرمسه → Sicilya 37.97,13.70)
- Tüm uncertain/estimated yerler için iqlim-centroid sapma kontrolü
- Outlier tespiti: iqlim centroidinden >500km sapan yerler → manuel inceleme

### C) islamicatlas.org Tam Entegrasyon
- MuqaddasiLayer.jsx → repo'ya yerleştirme
- Katman menüsüne ekleme (İbn Battuta, Evliya Çelebi, Salibiyyat yanına)
- Frontend data dosyalarını `shared/` dizinine kopyalama
- Mevcut component pattern test

### D) Marhala Derinleştirme
- مرحلة خفيفة / ثقيلة ayrımı ham metinden yeniden tarama (Faz 5'te 0 bulundu — muhtemelen raw string'de değil, bağlam cümlesinde)
- OpenITI metninden regex ile marhala bağlam çıkarma

### E) Akademik Çıktı
- Veri seti makalesi (JOCCH / DH Quarterly hedef)
- Pipeline açıklaması: OpenITI → gazetteer matching → fuzzy → manual
- Karşılaştırma: Ṯurayyā gazetteer coverage vs bu pipeline
- Görselleştirme: confidence heatmap, iqlim network

## Teknik Notlar
- Faz 5'te `estimated` certainty kodu eklendi (frontend'de `e`)
- 3 junk entry (`c`, `v`, `م`) `junk_entry` olarak işaretlendi, frontend'den çıkarıldı
- Marhala tipizasyonu yapıldı ama ham raw string'lerde خفيفة/ثقيلة kelimesi bulunamadı
- MuqaddasiLayer.jsx Leaflet + react-leaflet pattern kullanıyor (IbnBattutaLayer uyumlu)
- Dashboard D3 + Chart.js ile iqlim bubble map, stacked bar, horizontal bar içeriyor

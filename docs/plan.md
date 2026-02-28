# Bosworth "The New Islamic Dynasties" — Kapsamlı İslam Medeniyeti Atlası

## Proje Durumu: FAZA 1 ✅ FAZA 2 ✅ FAZA 3 ✅ → FAZA 4 BAŞLAYACAK

---

## TAMAMLANAN FAZLAR

### Faza 1 ✅ — Veri Üretimi
11 CSV tablosu: 186 hanedan, 830 hükümdar, 101 ilişki, 50 savaş, 50 olay, 49 âlim, 40 mimari eser, 15 ticaret yolu, 30 diplomasi, 69 şehir, 186 analitik skor.

### Faza 2 ✅ — Veri Doğrulama & Zenginleştirme
Coğrafi koordinatlar, bbox, analitik skorlar, iki dilli (TR/EN) tüm alanlar.

### Faza 3 ✅ — Vizüalizasyon (Showcase)
- **Harita:** Leaflet + ESRI Shaded Relief (kartografik gerçek) + 7 katman + 5 filtre + zaman kaydırıcısı (622–1924)
- **Timeline:** D3.js horizontal bars + savaş/olay/âlim overlay
- **Tema:** Ottoman Manuscript × Dark Cartography (Amiri + Outfit)
- **Bilingual:** TR/EN toggle
- **Çıktılar:** `islamic_civ_atlas.html` (198 KB standalone) + `islamic-civilization-atlas.zip` (React/Vite projesi)

---

## FAZA 4: PEDAGOJİK ZENGİNLEŞTİRME 🔴

### Problem Tespiti

Mevcut atlas **veri görselleştirmesi** olarak çalışıyor ama **öğretici/pedagojik** değil:

| Sorun | Mevcut Durum | Hedef |
|---|---|---|
| Hanedan popup'ları | Kuru veri listesi (isim, tarih, başkent) | "Neden önemli?" bağlamı + 2-3 cümle tarihi anlam |
| Savaş popup'ları | Tarih + sonuç (tek cümle) | Stratejik bağlam + uzun vadeli etki + neden dönüm noktası |
| Âlim popup'ları | İsim + alan + eser | Katkıları neden devrimci? Hangi ortamda yetiştiler? Etki zinciri |
| Olay popup'ları | Kısa açıklama (1 cümle) | Nedensellik: ne oldu → neden oldu → ne değiştirdi |
| Timeline | Çubuklar yan yana | Nedensellik okları: Moğol istilası → hanedanların çöküşü → yeni güçler |
| Ticaret yolları | Animasyonlu çizgi | Hangi kültürel transferler oldu? Ekonomik etki neydi? |
| Genel | Her katman izole | Katmanlar arası bağlantılar: bu âlim bu hanedanın himayesinde, bu savaş bu olaya yol açtı |

### Yeni Veri Sütunları (CSV Zenginleştirmesi)

#### A) `all_dynasties_enriched.csv` — YENİ SÜTUNLAR
```
narrative_tr          — 3-5 cümle: Bu hanedan neden önemli? Ne değiştirdi? (TR)
narrative_en          — Aynısı İngilizce
key_contribution_tr   — Tek cümle: En önemli mirası (TR)
key_contribution_en   — Aynısı İngilizce
rise_reason_tr        — Neden yükseldi? (1-2 cümle)
fall_reason_tr        — Neden yıkıldı? (1-2 cümle)
context_before_tr     — Kuruluş öncesi ortam: "X hanedanı zayıflayınca..."
context_after_tr      — Yıkılış sonrası: "Toprakları Y ve Z arasında paylaşıldı..."
```

#### B) `battles.csv` — YENİ SÜTUNLAR
```
narrative_tr          — 3-5 cümle: Stratejik bağlam + neden önemli
narrative_en
long_term_impact_tr   — Uzun vadeli etki (1-2 cümle)
long_term_impact_en
tactical_note_tr      — Askeri taktik notu (1 cümle)
causes_event_id       — Bu savaş hangi olaya yol açtı? (FK → events)
caused_by_event_id    — Hangi olay bu savaşa yol açtı? (FK → events)
```

#### C) `events.csv` — YENİ SÜTUNLAR
```
narrative_tr          — 3-5 cümle: Nedensellik zinciri
narrative_en
significance_detail_tr — Neden dönüm noktası?
causes_event_id       — Nedensellik: bu olay → şuna yol açtı
caused_by_event_id    — Nedensellik: şu olay → buna yol açtı
related_battle_ids    — İlişkili savaşlar (virgülle ayrılmış)
related_scholar_ids   — İlişkili âlimler
```

#### D) `scholars.csv` — YENİ SÜTUNLAR
```
narrative_tr          — 3-5 cümle: Katkıları neden devrimci?
narrative_en
contribution_tr       — Ana katkı (2-3 cümle)
contribution_en
intellectual_context_tr — Entelektüel ortam: "Beytü'l-Hikme'de çalıştı..."
influence_chain_tr    — Etki zinciri: "Aristoteles → Kindî → Fârâbî → İbn Sînâ"
patron_relation_tr    — Hamisiyle ilişki: "Me'mûn'un himayesinde..."
```

#### E) `trade_routes.csv` — YENİ SÜTUNLAR
```
narrative_tr          — 3-5 cümle: Bu yol neden önemliydi?
narrative_en
cultural_transfer_tr  — Kültürel transfer: "Kâğıt teknolojisi, astronomi bilgisi..."
economic_impact_tr    — Ekonomik etki
decline_reason_tr     — Neden geriledi?
```

#### F) `monuments.csv` — YENİ SÜTUNLAR
```
narrative_tr          — 3-5 cümle: Mimari önemi + tarihi bağlam
narrative_en
architectural_innovation_tr — Mimari yenilik neydi?
patron_story_tr       — Kim neden yaptırdı?
```

#### G) YENİ TABLO: `causal_links.csv`
```
id, source_type, source_id, target_type, target_id, link_type, description_tr, description_en
```
**link_type değerleri:** caused, enabled, preceded, motivated, funded, inspired
**source/target_type:** dynasty, battle, event, scholar, monument, route

Bu tablo timeline'daki nedensellik oklarını ve popup'lardaki "ilişkili" bölümünü besler.

---

## DOSYA ENVANTERİ (Güncel)

| # | Dosya | Satır | Durum |
|---|---|---|---|
| 1 | `all_dynasties_enriched.csv` | 186 | ⬆ +8 sütun eklenecek |
| 2 | `all_rulers_merged.csv` | 830 | ✅ değişmeyecek |
| 3 | `dynasty_relations.csv` | 101 | ✅ değişmeyecek |
| 4 | `battles.csv` | 50 | ⬆ +7 sütun eklenecek |
| 5 | `events.csv` | 50 | ⬆ +6 sütun eklenecek |
| 6 | `scholars.csv` | 49 | ⬆ +6 sütun eklenecek |
| 7 | `monuments.csv` | 40 | ⬆ +4 sütun eklenecek |
| 8 | `trade_routes.csv` | 15 | ⬆ +4 sütun eklenecek |
| 9 | `diplomacy.csv` | 30 | ✅ değişmeyecek |
| 10 | `major_cities.csv` | 69 | ✅ değişmeyecek |
| 11 | `dynasty_analytics.csv` | 186 | ✅ değişmeyecek |
| 12 | **`causal_links.csv`** | ~150-200 | 🆕 YENİ TABLO |

---

## ÇALIŞMA PLANI

### Adım 4.1 — Veri Zenginleştirme (CSV'ler) 🔴
**Giriş:** Mevcut 6 CSV (zenginleştirilecek olanlar) + plan.md + prompt
**Çıkış:** Güncellenmiş 6 CSV + 1 yeni CSV (causal_links)

| Seans | CSV | İş | Tahmini Alan |
|---|---|---|---|
| 4.1.1 | `battles.csv` + `events.csv` | Narrative + nedensellik | ~650 alan |
| 4.1.2 | `scholars.csv` + `monuments.csv` | Narrative + katkı + bağlam | ~454 alan |
| 4.1.3 | `all_dynasties_enriched.csv` (1-93) | Narrative + rise/fall (ilk yarı) | ~744 alan |
| 4.1.4 | `all_dynasties_enriched.csv` (94-186) | Narrative + rise/fall (ikinci yarı) | ~744 alan |
| 4.1.5 | `trade_routes.csv` + `causal_links.csv` | Route narrative + tüm nedensellik | ~260 + ~200 alan |

### Adım 4.2 — Kod Güncellemesi (React) 🟡
Pedagojik popup'lar + nedensellik okları + cross-referencing

### Adım 4.3 — Test & Polish 🟢
Final build + showcase

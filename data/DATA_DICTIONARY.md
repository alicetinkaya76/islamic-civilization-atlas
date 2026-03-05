# Data Dictionary / Veri Sözlüğü

## Islamic Civilization Atlas Dataset v1.0

Based on: Bosworth, C.E. (2004). *The New Islamic Dynasties*. Edinburgh University Press.

---

## 1. all_dynasties_enriched.csv (186 rows × 44 columns)

| Column | Type | Description (EN) | Açıklama (TR) |
|---|---|---|---|
| dynasty_id | int | Unique identifier | Benzersiz tanımlayıcı |
| dynasty_name_tr | str | Dynasty name in Turkish | Hanedan adı (Türkçe) |
| dynasty_name_ar | str | Dynasty name in Arabic | Hanedan adı (Arapça) |
| dynasty_name_en | str | Dynasty name in English | Hanedan adı (İngilizce) |
| parent_tribe_or_clan | str | Parent tribe/clan | Ana kabile/klan |
| ethnic_origin | str | Ethnic origin | Etnik köken |
| region_primary | str | Primary region | Ana bölge |
| regions_all | str | All regions | Tüm bölgeler |
| capital_city | str | Capital city | Başkent |
| date_start_hijri | int | Start date (Hijri) | Başlangıç (Hicrî) |
| date_end_hijri | int | End date (Hijri) | Bitiş (Hicrî) |
| date_start_ce | int | Start date (CE) | Başlangıç (Miladi) |
| date_end_ce | int | End date (CE) | Bitiş (Miladi) |
| sub_branch | str | Sub-branch info | Alt kol bilgisi |
| allied_dynasties | str | Allied dynasties | Müttefik hanedanlar |
| rival_dynasties | str | Rival dynasties | Rakip hanedanlar |
| predecessor | str | Predecessor dynasty | Önceki hanedan |
| successor | str | Successor dynasty | Sonraki hanedan |
| end_cause | str | Cause of dynasty end | Yıkılış nedeni |
| migration_conquest_notes | str | Migration/conquest notes | Göç/fetih notları |
| chapter | str | Bosworth chapter reference | Bosworth bölüm referansı |
| notes | str | Additional notes | Ek notlar |
| ethnic_tags | str | Ethnic tags | Etnik etiketler |
| government_type | str | Government type | Yönetim biçimi |
| religious_orientation | str | Religious orientation | Dinî yönelim |
| importance_level | str | Importance: Kritik/Yüksek/Normal/Düşük | Önem seviyesi |
| capital_lat | float | Capital latitude | Başkent enlemi |
| capital_lon | float | Capital longitude | Başkent boylamı |
| duration_years_approx | int | Approximate duration (years) | Yaklaşık süre (yıl) |
| century_start | int | Starting century | Başlangıç yüzyılı |
| century_end | int | Ending century | Bitiş yüzyılı |
| geographic_zone | str | Geographic zone | Coğrafi bölge |
| region_center_lat | float | Region center latitude | Bölge merkez enlemi |
| region_center_lon | float | Region center longitude | Bölge merkez boylamı |
| region_bbox_n | float | Bounding box north | Sınır kutusu kuzey |
| region_bbox_s | float | Bounding box south | Sınır kutusu güney |
| region_bbox_e | float | Bounding box east | Sınır kutusu doğu |
| region_bbox_w | float | Bounding box west | Sınır kutusu batı |
| governance_detail | str | Governance details | Yönetim detayları |
| religious_detail | str | Religious details | Dinî detaylar |
| military_system | str | Military system | Askerî sistem |
| economic_base | str | Economic base | Ekonomik temel |
| cultural_tags | str | Cultural tags | Kültürel etiketler |
| historical_period | str | Historical period | Tarihi dönem |

## 2. all_rulers_merged.csv (830 rows × 38 columns)

Primary ruler database with regnal dates, succession type, death cause, and dynastic affiliation.

## 3. battles.csv (50 rows × 16 columns)

| Column | Type | Description |
|---|---|---|
| battle_id | int | Unique identifier |
| name_tr / name_en | str | Battle name (TR/EN) |
| date_ce / date_hijri | int | Date (CE / Hijri) |
| lat / lon | float | Coordinates |
| location_tr | str | Location name |
| dynasty_id_1 / role_1 | str | First party |
| dynasty_id_2_or_enemy / role_2 | str | Second party |
| battle_type | str | Battle type |
| significance | str | Kritik/Yüksek/Normal/Düşük |
| result_summary | str | Result summary |
| related_ruler_ids | str | Related ruler IDs |

## 4. events.csv (50 rows × 12 columns)

Major historical events with category, significance, and descriptions.

## 5. scholars.csv (49 rows × 17 columns)

Scholars, poets, scientists with birth/death dates, fields, major works, and patron dynasties.

## 6. monuments.csv (40 rows × 17 columns)

Architectural monuments with UNESCO status, type, and patron information.

## 7. trade_routes.csv (15 rows × 18 columns)

Trade routes with waypoint coordinates, goods traded, and active periods.

## 8. dynasty_relations.csv (101 rows × 6 columns)

Inter-dynasty relationships: vassal, allied, successor, rival.

## 9. diplomacy.csv (30 rows × 10 columns)

Diplomatic events between dynasties.

## 10. major_cities.csv (69 rows × 10 columns)

Population and role data for 20 major cities across multiple time periods.

## 11. dynasty_analytics.csv (186 rows × 16 columns)

| Column | Description |
|---|---|
| duration_years | Dynasty lifespan |
| ruler_count | Number of rulers |
| avg_reign_years | Average reign duration |
| stability_ratio | Natural death ratio (stability indicator) |
| violent_death_count | Rulers who died violently |
| continuity_ratio | Father-to-son succession ratio |
| battle_count | Number of battles |
| battle_win_ratio | Battle win ratio |
| scholar_count | Patronized scholar count |
| cultural_productivity | Cultural output (scholars/century) |
| territory_approx_10k_km2 | Approximate territory size |
| power_index | Composite power index (0–100) |
| lifecycle | Lifecycle category |

---

## Data Relationships / Veri İlişkileri

```
all_dynasties_enriched (186)
  ├── dynasty_id → all_rulers_merged (830)
  ├── dynasty_id → dynasty_relations (101)
  ├── dynasty_id → battles (50)
  ├── dynasty_id → events (50)
  ├── dynasty_id → scholars (49)
  ├── dynasty_id → monuments (40)
  ├── dynasty_id → trade_routes (15) [multi-valued]
  ├── dynasty_id → diplomacy (30)
  ├── dynasty_id → major_cities (69)
  └── dynasty_id → dynasty_analytics (186) [1:1]
```

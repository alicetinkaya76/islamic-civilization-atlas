# islamicatlas.org — i18n Refactoring Faz 2
# Sonraki Oturum Başlangıç Prompt'u
# Tarih: 16 Mart 2026
# Mevcut: v5.3.3.0 (Faz 1 tamamlandı)
# Hedef: v5.3.3.1

---

## Bağlam

Faz 1 tamamlandı (v5.3.3.0). 6 kullanıcı-görünür bileşende 38 hardcoded string `t.xxx` referanslarına dönüştürüldü. i18n.js'e 4 yeni namespace eklendi (search, map, onb, about genişletme). Detay: `docs/CHANGELOG_v5.3.3.0.md`

### Uygulanan Pattern
- Her bileşende `import T from '../../data/i18n';` + `const t = T[lang];`
- `{{ tr: …, en: … }[lang]}` → `t.xxx`
- `f(obj, 'label', lang)` → `t.xxx` (mümkünse)
- CATEGORIES/TYPE_LABEL gibi sabit diziler → `getXxx(t)` fonksiyonuna dönüştürme
- aria-label'lar dahil tümü i18n'e alınıyor

---

## Görev — Faz 2: Shared Bileşenler (58 string)

### Hedef dosyalar:

#### 1. `src/components/shared/GlossaryModal.jsx` (~6 string)
'Sözlük', 'İslam Tarihi Sözlüğü', placeholder, 'Sonuç bulunamadı.'

#### 2. `src/components/shared/ProgressTracker.jsx` (~20 string)
Tüm rozet isimleri ve açıklamaları, '🧭 Keşif İlerlemesi', 'Sıfırla'

#### 3. `src/components/shared/ExportButton.jsx` (~4 string)
'Savaşlar', 'Anıtlar', 'Şehirler', 'CSV İndir'

#### 4. `src/components/shared/TourMode.jsx` (~3 string)
'Bir tur seçerek İslam tarihini keşfedin', 'Önceki', 'Tur tamamlandı!'

#### 5. `src/components/shared/CitationBox.jsx` (~2 string)
'Bu projeyi atıf yapın', 'Kopyalandı!'

#### 6. `src/components/causal/CausalView.jsx` (~4 string)
'Sonuç bulunamadı', 'Bağlantı', 'Bağlantı Listesi'

#### 7. `src/components/timeline/EraCard.jsx` (~3 string)
'Anahtar Gelişmeler', 'Öne Çıkan Âlimler', 'Haritada Göster'

#### 8. `src/components/shared/MapLegend.jsx` (~4 string)
'Varlık Tipleri', 'Hükümdar', 'Düşük', 'Yüksek'

#### 9. `src/components/QuizMode.jsx` (~12 string)
'Bilgi Yarışması', 'Sonuçları Gör', 'Doğru!', 'Yanlış!', sonuç mesajları

---

## Strateji

1. Her dosyayı oku, hardcoded string'leri tespit et
2. i18n.js'e gerekli key'leri TR/EN/AR olarak ekle
3. Bileşenleri güncelle (Faz 1 pattern'ini takip et)
4. Syntax check
5. Test kontrol listesi

## Commit
Faz 2 tamamlandığında → v5.3.3.1 (feat: i18n Phase 2 — shared components)

# TR/EN Çeviri Denetim Raporu (5.2)
Tarih: 2026-03-01

## dynasties: 697 eksik EN alan
  - rise_en: 186/186 kayıtta eksik
  - fall_en: 183/186 kayıtta eksik
  - ctx_b_en: 164/186 kayıtta eksik
  - ctx_a_en: 164/186 kayıtta eksik
## battles: 50 eksik EN alan
  - tactic_en: 50/50 kayıtta eksik
## events: 50 eksik EN alan
  - sig_en: 50/50 kayıtta eksik
## scholars: 98 eksik EN alan
  - chain_en: 49/49 kayıtta eksik
  - patron_en: 49/49 kayıtta eksik
## monuments: 80 eksik EN alan
  - visitor_en: 40/40 kayıtta eksik
  - arch_en: 40/40 kayıtta eksik
## cities: 0 eksik EN alan
## routes: 15 eksik EN alan
  - econ_en: 15/15 kayıtta eksik

## Özet
Toplam eksik EN alan: 990
Not: narr_en ve key_en alanları tamamlandı (Faza 4). Eksik alanlar rise_en, fall_en, ctx_b_en, ctx_a_en, tactic_en, sig_en, arch_en, visitor_en, econ_en, chain_en, patron_en.

## Kod Düzeltmeleri (Tamamlandı)
- PopupFactory.js: lf() fonksiyonu ile tüm alanlar lang-dependent
- lf() fallback: EN yoksa TR gösterilir
- MapView hardcoded _tr referansları kaldırıldı
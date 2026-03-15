/**
 * Dil yardımcı fonksiyonları — tüm bileşenlerde kullanılacak
 * v5.1.0.0 — Üç dilli altyapı (TR/EN/AR)
 *
 * n(obj, lang)        → bare field: obj.tr / obj.en / obj.ar
 * f(obj, field, lang) → suffix field: obj.field_tr / obj.field_en / obj.field_ar
 * isRTL(lang)         → lang === 'ar'
 * hn(obj, lang)       → alam/yaqut heading: h=ar, ht=tr, he=en
 * dn(obj, lang)       → alam/yaqut description: dt=tr, de=en
 */

/** Bare name field: obj.tr / obj.en / obj.ar with fallback chain */
export function n(obj, lang) {
  if (!obj) return '';
  return obj[lang] || obj.en || obj.tr || '';
}

/** Suffix field: obj.field_tr / obj.field_en / obj.field_ar with fallback */
export function f(obj, field, lang) {
  if (!obj) return '';
  return obj[`${field}_${lang}`] || obj[`${field}_en`] || obj[`${field}_tr`] || '';
}

/** RTL check */
export function isRTL(lang) {
  return lang === 'ar';
}

/** Alam/Yaqut heading: h=ar original, ht=tr, he=en */
export function hn(obj, lang) {
  if (!obj) return '';
  if (lang === 'ar') return obj.h || obj.he || obj.ht || '';
  if (lang === 'tr') return obj.ht || obj.he || obj.h || '';
  return obj.he || obj.ht || obj.h || '';
}

/** Alam/Yaqut description: dt=tr, de=en (no ar yet) */
export function dn(obj, lang) {
  if (!obj) return '';
  if (lang === 'tr') return obj.dt || obj.de || '';
  if (lang === 'en') return obj.de || obj.dt || '';
  return obj.de || obj.dt || '';
}

/* ═══ Era Definitions — TR/EN/AR ═══ */

export const ERA_BANDS = [
  [622,  661,  '#1a2a1a', { tr: 'Râşidîn',  en: 'Rashidun',  ar: 'الراشدون' }],
  [661,  750,  '#2a2a1a', { tr: 'Emevî',    en: 'Umayyad',   ar: 'الأمويون' }],
  [750,  1055, '#1a1a2a', { tr: 'Abbâsî',   en: 'Abbasid',   ar: 'العباسيون' }],
  [1055, 1299, '#2a1a1a', { tr: 'Selçuklu', en: 'Seljuq',    ar: 'السلاجقة' }],
  [1299, 1922, '#2a1a0a', { tr: 'Osmanlı',  en: 'Ottoman',   ar: 'العثمانيون' }],
  [1922, 1924, '#1a1a1a', { tr: 'Modern',   en: 'Modern',    ar: 'الحديث' }],
];

export function eraName(yr, lang) {
  const eras = [
    [661,  { tr: 'Râşidîn',           en: 'Rashidun',        ar: 'الراشدون' }],
    [750,  { tr: 'Emevî',             en: 'Umayyad',         ar: 'الأمويون' }],
    [945,  { tr: 'Erken Abbâsî',      en: 'Early Abbasid',   ar: 'العباسيون الأوائل' }],
    [1055, { tr: 'Büveyhî/Fâtımî',    en: 'Buyid/Fatimid',   ar: 'البويهيون/الفاطميون' }],
    [1258, { tr: 'Selçuklu/Haçlı',    en: 'Seljuq/Crusader', ar: 'السلاجقة/الصليبيون' }],
    [1370, { tr: 'Moğol',             en: 'Mongol',          ar: 'المغول' }],
    [1500, { tr: 'Timurlu',           en: 'Timurid',         ar: 'التيموريون' }],
    [1800, { tr: 'Erken Modern',      en: 'Early Modern',    ar: 'العصر الحديث المبكر' }],
    [9999, { tr: 'Modern',            en: 'Modern',          ar: 'الحديث' }],
  ];
  for (const [threshold, label] of eras) {
    if (yr < threshold) return label[lang] || label.en || label.tr;
  }
  return eras[eras.length - 1][1][lang] || 'Modern';
}

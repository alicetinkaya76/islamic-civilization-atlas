/* ═══ Era Definitions ═══ */

export const ERA_BANDS = [
  [622, 661, '#1a2a1a', { tr: 'Râşidîn', en: 'Rashidun' }],
  [661, 750, '#2a2a1a', { tr: 'Emevî', en: 'Umayyad' }],
  [750, 1055, '#1a1a2a', { tr: 'Abbâsî', en: 'Abbasid' }],
  [1055, 1258, '#2a1a1a', { tr: 'Selçuklu', en: 'Seljuq' }],
  [1258, 1500, '#1a2a2a', { tr: 'Moğol/Timurlu', en: 'Mongol/Timurid' }],
  [1500, 1800, '#2a1a2a', { tr: 'Erken Modern', en: 'Early Modern' }],
  [1800, 1924, '#1a1a1a', { tr: 'Modern', en: 'Modern' }],
];

export function eraName(yr, lang) {
  const eras = lang === 'tr'
    ? [661,'Râşidîn',750,'Emevî',945,'Erken Abbâsî',1055,'Büveyhî/Fâtımî',1258,'Selçuklu/Haçlı',1370,'Moğol',1500,'Timurlu',1800,'Erken Modern',9999,'Modern']
    : [661,'Rashidun',750,'Umayyad',945,'Early Abbasid',1055,'Buyid/Fatimid',1258,'Seljuq/Crusader',1370,'Mongol',1500,'Timurid',1800,'Early Modern',9999,'Modern'];
  for (let i = 0; i < eras.length; i += 2) { if (yr < eras[i]) return eras[i + 1]; }
  return eras[eras.length - 1];
}

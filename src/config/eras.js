/* ═══ Era Definitions ═══ */

export const ERA_BANDS = [
  [622,  661,  '#1a2a1a', { tr: 'Râşidîn',  en: 'Rashidun'  }],
  [661,  750,  '#2a2a1a', { tr: 'Emevî',    en: 'Umayyad'   }],
  [750,  1055, '#1a1a2a', { tr: 'Abbâsî',   en: 'Abbasid'   }],
  [1055, 1299, '#2a1a1a', { tr: 'Selçuklu', en: 'Seljuq'    }],
  [1299, 1922, '#2a1a0a', { tr: 'Osmanlı',  en: 'Ottoman'   }],
  [1922, 1924, '#1a1a1a', { tr: 'Modern',   en: 'Modern'    }],
];

export function eraName(yr, lang) {
  const eras = lang === 'tr'
    ? [661,'Râşidîn', 750,'Emevî', 1055,'Abbâsî', 1299,'Selçuklu', 1922,'Osmanlı', 9999,'Modern']
    : [661,'Rashidun', 750,'Umayyad', 1055,'Abbasid', 1299,'Seljuq', 1922,'Ottoman', 9999,'Modern'];
  for (let i = 0; i < eras.length; i += 2) {
    if (yr < eras[i]) return eras[i + 1];
  }
  return eras[eras.length - 1];
}

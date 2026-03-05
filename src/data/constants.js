export const REL_C = {
  'Sünnî': '#4ade80', 'Şiî': '#f87171', 'Hâricî': '#fb923c', '': '#64748b'
};

export const ZONE_C = {
  'Arap Yarımadası': '#f59e0b', 'Mısır/Şam': '#a78bfa',
  'Kuzey Afrika': '#22d3ee', 'Batı İslam (İspanya/Mağrib)': '#f472b6',
  'Irak/Cezîre': '#fb923c', 'Doğu İran/Mâverâünnehir': '#2dd4bf',
  'Selçuklu Dünyası': '#f87171', 'Anadolu': '#fb7185',
  'Güney Asya': '#4ade80', 'Güneydoğu Asya': '#a3e635',
  'Kafkasya/Batı İran': '#c084fc', 'Moğol/Tatar Dünyası': '#94a3b8',
  'Doğu/Batı Afrika': '#fbbf24'
};

export const IMP_OP = {
  'Kritik': 0.5, 'Yüksek': 0.35, 'Normal': 0.22, 'Düşük': 0.12
};

export const LYR_COL = {
  dynasties: '#c9a84c', battles: '#dc2626', events: '#60a5fa',
  scholars: '#34d399', monuments: '#fbbf24', cities: '#f97316', routes: '#c9a84c'
};

export function eraName(yr, lang) {
  const eras = lang === 'tr'
    ? [661,'Râşidîn',750,'Emevî',945,'Erken Abbâsî',1055,'Büveyhî/Fâtımî',1258,'Selçuklu/Haçlı',1370,'Moğol',1500,'Timurlu',1800,'Erken Modern',9999,'Modern']
    : [661,'Rashidun',750,'Umayyad',945,'Early Abbasid',1055,'Buyid/Fatimid',1258,'Seljuq/Crusader',1370,'Mongol',1500,'Timurid',1800,'Early Modern',9999,'Modern'];
  for (let i = 0; i < eras.length; i += 2) { if (yr < eras[i]) return eras[i + 1]; }
  return eras[eras.length - 1];
}

export const n = (o, lang) => lang === 'tr' ? o.tr : o.en;

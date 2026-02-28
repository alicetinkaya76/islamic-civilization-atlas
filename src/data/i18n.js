const T = {
  tr: {
    title: 'İslam Medeniyeti Atlası',
    sub: 'Bosworth Veri Tabanı • 186 Hanedan • 632–1924',
    tabs: { map: '🗺 Harita', timeline: '📅 Zaman Çizelgesi' },
    layers: {
      dynasties: 'Hanedanlar', battles: 'Savaşlar', events: 'Olaylar',
      scholars: 'Âlimler', monuments: 'Mimari Eserler', cities: 'Şehirler',
      routes: 'Ticaret Yolları'
    },
    filters: {
      religion: 'Mezhep', ethnic: 'Etnik Köken', government: 'Yönetim',
      period: 'Dönem', zone: 'Bölge', all: 'Tümü'
    },
    rel: { 'Sünnî': 'Sünnî', 'Şiî': 'Şiî', 'Hâricî': 'Hâricî' },
    gov: {
      'Hilafet': 'Hilafet', 'Sultanlık': 'Sultanlık', 'Emirlik': 'Emirlik',
      'Beylik': 'Beylik', 'Hanlık': 'Hanlık', 'Şahlık': 'Şahlık',
      'Atabeglik': 'Atabeglik', 'İmamet': 'İmamet',
      'Hanedan/Beylik': 'Hanedan/Beylik',
      'Sultanlık|Emirlik': 'Sultanlık/Emirlik',
      'Sultanlık|Şahlık': 'Sultanlık/Şahlık',
      'Hanlık|Beylik': 'Hanlık/Beylik'
    },
    imp: { 'Kritik': 'Kritik', 'Yüksek': 'Yüksek', 'Normal': 'Normal', 'Düşük': 'Düşük' },
    m: {
      year: 'Yıl', capital: 'Başkent', dynasty: 'Hanedan', battle: 'Savaş',
      event: 'Olay', scholar: 'Âlim', monument: 'Eser', city: 'Şehir',
      result: 'Sonuç', significance: 'Önem', field: 'Alan', work: 'Eser',
      type: 'Tür', pop: 'Nüfus', role: 'Rol', goods: 'Ticari Mallar',
      period: 'Dönem', route: 'Ticaret Yolu', born: 'Doğum', died: 'Ölüm',
      start: 'Başlangıç', end: 'Bitiş', religion: 'Mezhep', ethnic: 'Etnik',
      govType: 'Yönetim', active: 'aktif hanedan', zone: 'Bölge'
    },
    tl: {
      title: 'Kronolojik Zaman Çizelgesi', colorBy: 'Renklendirme',
      byRel: 'Mezhep', byZone: 'Bölge', battles: 'Savaşlar',
      events: 'Olaylar', scholars: 'Âlimler',
      zoomIn: 'Yakınlaştır', zoomOut: 'Uzaklaştır'
    },
    play: 'Oynat', pause: 'Durdur',
  },
  en: {
    title: 'Islamic Civilization Atlas',
    sub: 'Bosworth Database • 186 Dynasties • 632–1924',
    tabs: { map: '🗺 Map', timeline: '📅 Timeline' },
    layers: {
      dynasties: 'Dynasties', battles: 'Battles', events: 'Events',
      scholars: 'Scholars', monuments: 'Monuments', cities: 'Cities',
      routes: 'Trade Routes'
    },
    filters: {
      religion: 'Religion', ethnic: 'Ethnic Origin', government: 'Government',
      period: 'Period', zone: 'Zone', all: 'All'
    },
    rel: { 'Sünnî': 'Sunni', 'Şiî': 'Shia', 'Hâricî': 'Kharijite' },
    gov: {
      'Hilafet': 'Caliphate', 'Sultanlık': 'Sultanate', 'Emirlik': 'Emirate',
      'Beylik': 'Beylik', 'Hanlık': 'Khanate', 'Şahlık': 'Shahdom',
      'Atabeglik': 'Atabegate', 'İmamet': 'Imamate',
      'Hanedan/Beylik': 'Dynasty/Beylik',
      'Sultanlık|Emirlik': 'Sultanate/Emirate',
      'Sultanlık|Şahlık': 'Sultanate/Shahdom',
      'Hanlık|Beylik': 'Khanate/Beylik'
    },
    imp: { 'Kritik': 'Critical', 'Yüksek': 'High', 'Normal': 'Normal', 'Düşük': 'Low' },
    m: {
      year: 'Year', capital: 'Capital', dynasty: 'Dynasty', battle: 'Battle',
      event: 'Event', scholar: 'Scholar', monument: 'Monument', city: 'City',
      result: 'Result', significance: 'Significance', field: 'Field', work: 'Work',
      type: 'Type', pop: 'Population', role: 'Role', goods: 'Trade Goods',
      period: 'Period', route: 'Trade Route', born: 'Born', died: 'Died',
      start: 'Start', end: 'End', religion: 'Religion', ethnic: 'Ethnic',
      govType: 'Government', active: 'active dynasties', zone: 'Zone'
    },
    tl: {
      title: 'Chronological Timeline', colorBy: 'Color By',
      byRel: 'Religion', byZone: 'Zone', battles: 'Battles',
      events: 'Events', scholars: 'Scholars',
      zoomIn: 'Zoom In', zoomOut: 'Zoom Out'
    },
    play: 'Play', pause: 'Pause',
  }
};

export default T;

const T = {
  tr: {
    title: 'İslam Hanedanları Atlası',
    sub: 'Bosworth Veri Tabanı • 186 Hanedan • 632–1924',
    tabs: { map: '🗺 Harita', timeline: '📅 Zaman Çizelgesi', links: '🔗 Nedensellik' },
    layers: {
      dynasties: 'Hanedanlar', battles: 'Savaşlar', events: 'Olaylar',
      scholars: 'Âlimler', monuments: 'Mimari Eserler', cities: 'Şehirler',
      routes: 'Ticaret Yolları', rulers: 'Hükümdarlar'
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
      govType: 'Yönetim', active: 'aktif hanedan', zone: 'Bölge',
      narrative: 'Tarihsel Anlatı', keyContrib: 'Temel Miras',
      rise: 'Yükseliş', fall: 'Çöküş', context: 'Bağlam',
      impact: 'Uzun Vadeli Etki', tactic: 'Taktik Not',
      legacy: 'Miras', chain: 'Etki Zinciri', patron: 'Himaye',
      arch: 'Mimari Detay', visitor: 'Ziyaretçi Notu',
      funFact: 'İlginç Bilgi', anecdote: 'Anekdot',
      before: 'Öncesi', after: 'Sonrası',
      ruler: 'Hükümdar', rulers: 'Hükümdarlar', reign: 'Hüküm', successor: 'Halef',
      predecessor: 'Selef', founder: 'Kurucu', lastRuler: 'Son Hükümdar',
      deathNatural: 'Doğal ölüm', deathKilled: 'Öldürüldü', successionType: 'Veraset',
    },
    tl: {
      title: 'Kronolojik Zaman Çizelgesi', colorBy: 'Renklendirme',
      byRel: 'Mezhep', byZone: 'Bölge', battles: 'Savaşlar',
      events: 'Olaylar', scholars: 'Âlimler',
      zoomIn: 'Yakınlaştır', zoomOut: 'Uzaklaştır'
    },
    lk: {
      title: 'Nedensellik Ağı', subtitle: '200 bağlantı ile İslam tarihinin neden-sonuç haritası',
      source: 'Kaynak', target: 'Hedef', linkType: 'Bağlantı Türü',
      all: 'Tümü', filterEntity: 'Varlık Tipi',
      types: {
        succession: 'Haleflik', conquest: 'Fetih', division: 'Bölünme',
        patronage: 'Himaye', cultural: 'Kültürel', expansion: 'Genişleme',
        foundation: 'Kuruluş', influence: 'Etki', rivalry: 'Rekabet',
        alliance: 'İttifak', decline: 'Gerileme', crisis: 'Kriz',
        collapse: 'Çöküş', trigger: 'Tetikleme', defeat: 'Yenilgi',
        reform: 'Reform', creation: 'Yaratım', economic: 'Ekonomik',
        diplomatic: 'Diplomatik', control: 'Kontrol', context: 'Bağlam',
        coup: 'Darbe', delegation: 'Yetkilendirme', flight: 'Göç'
      },
      entities: {
        dynasty: 'Hanedan', battle: 'Savaş', event: 'Olay',
        scholar: 'Âlim', monument: 'Eser', trade_route: 'Ticaret Yolu',
        diplomacy: 'Diplomasi'
      }
    },
    play: 'Oynat', pause: 'Durdur',
    footer: {
      cite: 'Atıf Yap', citeTitle: 'Bu projeyi atıf yapın',
      copy: 'Kopyala', copied: 'Kopyalandı!',
    },
    about: {
      btn: 'Hakkında', title: 'Hakkında', close: 'Kapat',
      authors: 'Yazarlar', data: 'Veri Kaynağı',
      license: 'Lisans: CC BY-SA 4.0',
    },
  },
  en: {
    title: 'Islamic Dynasties Atlas',
    sub: 'Bosworth Database • 186 Dynasties • 632–1924',
    tabs: { map: '🗺 Map', timeline: '📅 Timeline', links: '🔗 Causality' },
    layers: {
      dynasties: 'Dynasties', battles: 'Battles', events: 'Events',
      scholars: 'Scholars', monuments: 'Monuments', cities: 'Cities',
      routes: 'Trade Routes', rulers: 'Rulers'
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
      govType: 'Government', active: 'active dynasties', zone: 'Zone',
      narrative: 'Historical Narrative', keyContrib: 'Key Legacy',
      rise: 'Rise', fall: 'Fall', context: 'Context',
      impact: 'Long-term Impact', tactic: 'Tactical Note',
      legacy: 'Legacy', chain: 'Influence Chain', patron: 'Patronage',
      arch: 'Architectural Detail', visitor: 'Visitor Note',
      funFact: 'Fun Fact', anecdote: 'Anecdote',
      before: 'Before', after: 'After',
      ruler: 'Ruler', rulers: 'Rulers', reign: 'Reign', successor: 'Successor',
      predecessor: 'Predecessor', founder: 'Founder', lastRuler: 'Last Ruler',
      deathNatural: 'Natural death', deathKilled: 'Killed/Assassinated', successionType: 'Succession',
    },
    tl: {
      title: 'Chronological Timeline', colorBy: 'Color By',
      byRel: 'Religion', byZone: 'Zone', battles: 'Battles',
      events: 'Events', scholars: 'Scholars',
      zoomIn: 'Zoom In', zoomOut: 'Zoom Out'
    },
    lk: {
      title: 'Causality Network', subtitle: 'Cause-and-effect map of Islamic history with 200 links',
      source: 'Source', target: 'Target', linkType: 'Link Type',
      all: 'All', filterEntity: 'Entity Type',
      types: {
        succession: 'Succession', conquest: 'Conquest', division: 'Division',
        patronage: 'Patronage', cultural: 'Cultural', expansion: 'Expansion',
        foundation: 'Foundation', influence: 'Influence', rivalry: 'Rivalry',
        alliance: 'Alliance', decline: 'Decline', crisis: 'Crisis',
        collapse: 'Collapse', trigger: 'Trigger', defeat: 'Defeat',
        reform: 'Reform', creation: 'Creation', economic: 'Economic',
        diplomatic: 'Diplomatic', control: 'Control', context: 'Context',
        coup: 'Coup', delegation: 'Delegation', flight: 'Flight'
      },
      entities: {
        dynasty: 'Dynasty', battle: 'Battle', event: 'Event',
        scholar: 'Scholar', monument: 'Monument', trade_route: 'Trade Route',
        diplomacy: 'Diplomacy'
      }
    },
    play: 'Play', pause: 'Pause',
    footer: {
      cite: 'Cite', citeTitle: 'Cite this project',
      copy: 'Copy', copied: 'Copied!',
    },
    about: {
      btn: 'About', title: 'About', close: 'Close',
      authors: 'Authors', data: 'Data Source',
      license: 'License: CC BY-SA 4.0',
    },
  }
};

export default T;

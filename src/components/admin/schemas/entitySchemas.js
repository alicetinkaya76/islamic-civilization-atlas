/**
 * Entity Schema Definitions for Admin Panel
 * v5.2.0.0 — All db.json collections + auxiliary data
 *
 * fieldType: text, number, textarea, richtext, select, multi-select,
 *            boolean, coords, color, readonly, ref, ref-multi,
 *            array-coords, waypoints, array-text, trilingual
 */

export const SCHEMAS = {

  dynasties: {
    label: { tr: 'Hanedanlar', en: 'Dynasties', ar: 'الأسر الحاكمة' },
    icon: '👑',
    listColumns: ['id', 'tr', 'en', 'start', 'end', 'zone', 'imp'],
    fields: [
      { key: 'id',       type: 'readonly',  label: 'ID' },
      { key: 'tr',       type: 'text',      label: 'İsim (TR)',     lang: 'tr', required: true },
      { key: 'en',       type: 'text',      label: 'Name (EN)',     lang: 'en', required: true },
      { key: 'ar',       type: 'text',      label: 'الاسم (AR)',    lang: 'ar', rtl: true },
      { key: 'start',    type: 'number',    label: 'Başlangıç (CE)', required: true },
      { key: 'end',      type: 'number',    label: 'Bitiş (CE)',     required: true },
      { key: 'lat',      type: 'number',    label: 'Enlem',  step: 0.01 },
      { key: 'lon',      type: 'number',    label: 'Boylam', step: 0.01 },
      { key: 'eth',      type: 'text',      label: 'Etnik Köken' },
      { key: 'gov',      type: 'select',    label: 'Yönetim Tipi',
        options: ['Hilafet','Sultanlık','Emirlik','Beylik','Hanlık','Şahlık','Atabeglik','İmamet','Hanedan/Beylik','Sultanlık|Emirlik','Sultanlık|Şahlık','Hanlık|Beylik'] },
      { key: 'rel',      type: 'select',    label: 'Mezhep',
        options: ['Sünnî','Şiî','Hâricî'] },
      { key: 'imp',      type: 'select',    label: 'Önem',
        options: ['Kritik','Yüksek','Normal','Düşük'] },
      { key: 'zone',     type: 'select',    label: 'Coğrafi Bölge',
        options: ['Arap Yarımadası','Mısır/Şam','Kuzey Afrika','Batı İslam (İspanya/Mağrib)','Irak/Cezîre','Doğu İran/Mâverâünnehir','Selçuklu Dünyası','Anadolu','Güney Asya','Güneydoğu Asya','Kafkasya/Batı İran','Moğol/Tatar Dünyası','Doğu/Batı Afrika'] },
      { key: 'period',   type: 'select',    label: 'Tarihsel Dönem',
        options: ['Râşidîn','Emevî','Erken Abbâsî','Geç Abbâsî','Selçuklu Çağı','Haçlı/Moğol','Moğol','Moğol Sonrası','Timurlu','Erken Modern','Modern','Sömürge'] },
      { key: 'cap',      type: 'text',      label: 'Başkent' },
      { key: 'narr',     type: 'richtext',  label: 'Tarihsel Anlatı', trilingual: true },
      { key: 'key',      type: 'textarea',  label: 'Temel Katkı',     trilingual: true },
      { key: 'rise',     type: 'textarea',  label: 'Yükseliş Nedeni', trilingual: true },
      { key: 'fall',     type: 'textarea',  label: 'Çöküş Nedeni',    trilingual: true },
      { key: 'ctx_b',    type: 'textarea',  label: 'Öncesi Bağlam',   trilingual: true },
      { key: 'ctx_a',    type: 'textarea',  label: 'Sonrası Bağlam',  trilingual: true },
    ]
  },

  battles: {
    label: { tr: 'Savaşlar', en: 'Battles', ar: 'المعارك' },
    icon: '⚔',
    listColumns: ['id', 'tr', 'en', 'yr', 'sig'],
    fields: [
      { key: 'id',       type: 'readonly',  label: 'ID' },
      { key: 'tr',       type: 'text',      label: 'İsim (TR)',   lang: 'tr', required: true },
      { key: 'en',       type: 'text',      label: 'Name (EN)',   lang: 'en', required: true },
      { key: 'ar',       type: 'text',      label: 'الاسم (AR)',  lang: 'ar', rtl: true },
      { key: 'yr',       type: 'number',    label: 'Yıl (CE)',    required: true },
      { key: 'lat',      type: 'number',    label: 'Enlem',       step: 0.01 },
      { key: 'lon',      type: 'number',    label: 'Boylam',      step: 0.01 },
      { key: 'sig',      type: 'select',    label: 'Önem',
        options: ['Kritik','Yüksek','Normal'] },
      { key: 'res',      type: 'text',      label: 'Sonuç' },
      { key: 'rel_dyn',  type: 'ref-multi', label: 'İlgili Hanedanlar', refCollection: 'dynasties' },
      { key: 'caused_by_e', type: 'ref',    label: 'Tetikleyen Olay',   refCollection: 'events', nullable: true },
      { key: 'narr',     type: 'richtext',  label: 'Anlatı',          trilingual: true },
      { key: 'impact',   type: 'textarea',  label: 'Uzun Vadeli Etki', trilingual: true },
      { key: 'tactic',   type: 'textarea',  label: 'Taktik Not',       trilingual: true },
      { key: 'forces_m', type: 'text',      label: 'Müslüman Kuvvetler', trilingual: true },
      { key: 'forces_o', type: 'text',      label: 'Karşı Kuvvetler',    trilingual: true },
      { key: 'casualties', type: 'text',    label: 'Kayıplar',           trilingual: true },
      { key: 'terrain',  type: 'text',      label: 'Arazi',              trilingual: true },
    ]
  },

  events: {
    label: { tr: 'Olaylar', en: 'Events', ar: 'الأحداث' },
    icon: '📜',
    listColumns: ['id', 'tr', 'en', 'yr', 'cat', 'sig'],
    fields: [
      { key: 'id',       type: 'readonly',  label: 'ID' },
      { key: 'tr',       type: 'text',      label: 'İsim (TR)',   lang: 'tr', required: true },
      { key: 'en',       type: 'text',      label: 'Name (EN)',   lang: 'en', required: true },
      { key: 'ar',       type: 'text',      label: 'الاسم (AR)',  lang: 'ar', rtl: true },
      { key: 'yr',       type: 'number',    label: 'Yıl (CE)',    required: true },
      { key: 'lat',      type: 'number',    label: 'Enlem',       step: 0.01 },
      { key: 'lon',      type: 'number',    label: 'Boylam',      step: 0.01 },
      { key: 'cat',      type: 'select',    label: 'Kategori',
        options: ['Siyasi','Dini','Kültürel','Ekonomik','Bilimsel','Hukuki','Mimari','Felaket'] },
      { key: 'sig',      type: 'select',    label: 'Önem',
        options: ['Kritik','Yüksek','Normal','Düşük'] },
      { key: 'desc',     type: 'textarea',  label: 'Açıklama' },
      { key: 'causes_e', type: 'ref',       label: 'Tetikleyen Olay', refCollection: 'events', nullable: true },
      { key: 'rel_bat',  type: 'ref-multi', label: 'İlgili Savaşlar', refCollection: 'battles' },
      { key: 'narr',     type: 'richtext',  label: 'Anlatı',     trilingual: true },
    ]
  },

  scholars: {
    label: { tr: 'Âlimler', en: 'Scholars', ar: 'العلماء' },
    icon: '📚',
    listColumns: ['id', 'tr', 'en', 'b', 'd'],
    fields: [
      { key: 'id',       type: 'readonly',  label: 'ID' },
      { key: 'tr',       type: 'text',      label: 'İsim (TR)',   lang: 'tr', required: true },
      { key: 'en',       type: 'text',      label: 'Name (EN)',   lang: 'en', required: true },
      { key: 'ar',       type: 'text',      label: 'الاسم (AR)',  lang: 'ar', rtl: true },
      { key: 'b',        type: 'number',    label: 'Doğum (CE)' },
      { key: 'd',        type: 'number',    label: 'Ölüm (CE)' },
      { key: 'lat',      type: 'number',    label: 'Enlem',       step: 0.01 },
      { key: 'lon',      type: 'number',    label: 'Boylam',      step: 0.01 },
      { key: 'patron_d', type: 'ref',       label: 'Hami Hanedan', refCollection: 'dynasties', nullable: true },
      { key: 'tabaqa',   type: 'text',      label: 'Tabaka',       trilingual: true },
      { key: 'rawi_rank', type: 'text',     label: 'Râvi Derecesi', trilingual: true },
      { key: 'rawi_tag', type: 'text',      label: 'Râvi Etiketi' },
      { key: 'hadith_count', type: 'number', label: 'Hadis Sayısı' },
      { key: 'city',     type: 'text',      label: 'Şehir',       trilingual: true },
      { key: 'disc',     type: 'text',      label: 'İlim Dalı',   trilingual: true },
      { key: 'narr',     type: 'richtext',  label: 'Anlatı',      trilingual: true },
      { key: 'chain',    type: 'textarea',  label: 'Etki Zinciri', trilingual: true },
      { key: 'patron',   type: 'textarea',  label: 'Himaye İlişkisi', trilingual: true },
    ]
  },

  monuments: {
    label: { tr: 'Mimari Eserler', en: 'Monuments', ar: 'المعالم المعمارية' },
    icon: '🕌',
    listColumns: ['id', 'tr', 'en', 'yr'],
    fields: [
      { key: 'id',       type: 'readonly',  label: 'ID' },
      { key: 'tr',       type: 'text',      label: 'İsim (TR)',   lang: 'tr', required: true },
      { key: 'en',       type: 'text',      label: 'Name (EN)',   lang: 'en', required: true },
      { key: 'ar',       type: 'text',      label: 'الاسم (AR)',  lang: 'ar', rtl: true },
      { key: 'yr',       type: 'number',    label: 'Yapım Yılı (CE)' },
      { key: 'lat',      type: 'number',    label: 'Enlem',       step: 0.01 },
      { key: 'lon',      type: 'number',    label: 'Boylam',      step: 0.01 },
      { key: 'dyn',      type: 'ref',       label: 'Hanedan',     refCollection: 'dynasties', nullable: true },
      { key: 'unesco',    type: 'boolean',   label: 'UNESCO' },
      { key: 'type',     type: 'text',      label: 'Tür',         trilingual: true },
      { key: 'city',     type: 'text',      label: 'Şehir',       trilingual: true },
      { key: 'narr',     type: 'richtext',  label: 'Anlatı',      trilingual: true },
      { key: 'arch',     type: 'textarea',  label: 'Mimari Detay', trilingual: true },
      { key: 'visitor',  type: 'textarea',  label: 'Ziyaretçi Notu', trilingual: true },
      { key: 'builder',  type: 'text',      label: 'İnşa Eden',    trilingual: true },
      { key: 'style',    type: 'text',      label: 'Mimari Stil',   trilingual: true },
      { key: 'status',   type: 'text',      label: 'Mevcut Durum',  trilingual: true },
    ]
  },

  cities: {
    label: { tr: 'Şehirler', en: 'Cities', ar: 'المدن' },
    icon: '🏙',
    listColumns: ['id', 'tr', 'en', 'modern_country'],
    fields: [
      { key: 'id',       type: 'readonly',  label: 'ID' },
      { key: 'tr',       type: 'text',      label: 'İsim (TR)',   lang: 'tr', required: true },
      { key: 'en',       type: 'text',      label: 'Name (EN)',   lang: 'en', required: true },
      { key: 'ar',       type: 'text',      label: 'الاسم (AR)',  lang: 'ar', rtl: true },
      { key: 'lat',      type: 'number',    label: 'Enlem',       step: 0.01 },
      { key: 'lon',      type: 'number',    label: 'Boylam',      step: 0.01 },
      { key: 'pop',      type: 'number',    label: 'Nüfus Tahmini' },
      { key: 'peak_pop', type: 'text',      label: 'Zirve Nüfusu' },
      { key: 'modern_country', type: 'text', label: 'Modern Ülke' },
      { key: 'key_monuments', type: 'ref-multi', label: 'Önemli Eserler', refCollection: 'monuments' },
      { key: 'key_scholars',  type: 'ref-multi', label: 'Önemli Âlimler', refCollection: 'scholars' },
      { key: 'key_battles',   type: 'ref-multi', label: 'Önemli Savaşlar', refCollection: 'battles' },
      { key: 'role',     type: 'text',      label: 'Rol',         trilingual: true },
      { key: 'narr',     type: 'richtext',  label: 'Anlatı',      trilingual: true },
      { key: 'founded',  type: 'text',      label: 'Kuruluş',     trilingual: true },
    ]
  },

  routes: {
    label: { tr: 'Ticaret Yolları', en: 'Trade Routes', ar: 'طرق التجارة' },
    icon: '🛤',
    listColumns: ['id', 'tr', 'en'],
    fields: [
      { key: 'id',       type: 'readonly',  label: 'ID' },
      { key: 'tr',       type: 'text',      label: 'İsim (TR)',   lang: 'tr', required: true },
      { key: 'en',       type: 'text',      label: 'Name (EN)',   lang: 'en', required: true },
      { key: 'ar',       type: 'text',      label: 'الاسم (AR)',  lang: 'ar', rtl: true },
      { key: 'ps',       type: 'text',      label: 'Başlangıç' },
      { key: 'pe',       type: 'text',      label: 'Bitiş' },
      { key: 'wp',       type: 'waypoints',    label: 'Güzergah Noktaları' },
      { key: 'type',     type: 'text',      label: 'Tür',         trilingual: true },
      { key: 'goods',    type: 'text',      label: 'Ticari Mallar', trilingual: true },
      { key: 'narr',     type: 'richtext',  label: 'Anlatı',      trilingual: true },
      { key: 'econ',     type: 'textarea',  label: 'Ekonomik Etki', trilingual: true },
    ]
  },

  rulers: {
    label: { tr: 'Hükümdarlar', en: 'Rulers', ar: 'الحكام' },
    icon: '🤴',
    listColumns: ['id', 'n', 'did', 'rs', 're'],
    fields: [
      { key: 'id',       type: 'readonly',  label: 'ID' },
      { key: 'did',      type: 'ref',       label: 'Hanedan',     refCollection: 'dynasties', required: true },
      { key: 'n',        type: 'text',      label: 'Kısa İsim',   required: true },
      { key: 'fn',       type: 'text',      label: 'Tam İsim' },
      { key: 'ar',       type: 'text',      label: 'الاسم (AR)',  rtl: true },
      { key: 'role',     type: 'text',      label: 'Unvan' },
      { key: 'title',    type: 'text',      label: 'Lakap' },
      { key: 'rs',       type: 'number',    label: 'Hüküm Başlangıcı (CE)' },
      { key: 're',       type: 'number',    label: 'Hüküm Sonu (CE)' },
      { key: 'dur',      type: 'number',    label: 'Süre (yıl)' },
      { key: 'lat',      type: 'number',    label: 'Enlem',       step: 0.01 },
      { key: 'lon',      type: 'number',    label: 'Boylam',      step: 0.01 },
      { key: 'pred',     type: 'text',      label: 'Selef',       nullable: true },
      { key: 'succ',     type: 'text',      label: 'Halef',       nullable: true },
      { key: 'dt',       type: 'select',    label: 'Ölüm Tipi',
        options: ['Doğal','Öldürüldü','Savaşta','Zehirlenme','İdam','Bilinmiyor'] },
      { key: 'fnd',      type: 'boolean',   label: 'Kurucu mu?' },
      { key: 'lst',      type: 'boolean',   label: 'Son Hükümdar mı?' },
      { key: 'ord',      type: 'number',    label: 'Sıra No' },
      { key: 'suc_t',    type: 'text',      label: 'Veraset Tipi' },
    ]
  },

  madrasas: {
    label: { tr: 'Medreseler', en: 'Madrasas', ar: 'المدارس' },
    icon: '🏫',
    listColumns: ['id', 'tr', 'en', 'founded'],
    fields: [
      { key: 'id',       type: 'readonly',  label: 'ID' },
      { key: 'tr',       type: 'text',      label: 'İsim (TR)',   lang: 'tr', required: true },
      { key: 'en',       type: 'text',      label: 'Name (EN)',   lang: 'en', required: true },
      { key: 'ar',       type: 'text',      label: 'الاسم (AR)',  lang: 'ar', rtl: true },
      { key: 'lat',      type: 'number',    label: 'Enlem',       step: 0.01 },
      { key: 'lon',      type: 'number',    label: 'Boylam',      step: 0.01 },
      { key: 'founded',  type: 'number',    label: 'Kuruluş (CE)' },
      { key: 'closed',   type: 'number',    label: 'Kapanış (CE)' },
      { key: 'scholars', type: 'ref-multi', label: 'Âlimler',     refCollection: 'scholars' },
      { key: 'type',     type: 'text',      label: 'Tür',         trilingual: true },
      { key: 'city',     type: 'text',      label: 'Şehir',       trilingual: true },
      { key: 'founder',  type: 'text',      label: 'Kurucu',      trilingual: true },
      { key: 'dynasty',  type: 'text',      label: 'Hanedan',     trilingual: true },
      { key: 'desc',     type: 'richtext',  label: 'Açıklama',    trilingual: true },
      { key: 'fields',   type: 'text',      label: 'Öğretim Alanları', trilingual: true },
      { key: 'status',   type: 'text',      label: 'Mevcut Durum', trilingual: true },
    ]
  },

  analytics: {
    label: { tr: 'Analitik', en: 'Analytics', ar: 'التحليلات' },
    icon: '📊',
    listColumns: ['id', 'pi', 'dur'],
    fields: [
      { key: 'id',  type: 'ref',    label: 'Hanedan', refCollection: 'dynasties' },
      { key: 'pi',  type: 'number', label: 'Güç İndeksi', step: 0.01 },
      { key: 'dur', type: 'number', label: 'Süre (yıl)' },
    ]
  },

  relations: {
    label: { tr: 'Hanedan İlişkileri', en: 'Dynasty Relations', ar: 'علاقات الأسر' },
    icon: '🔗',
    listColumns: ['d1', 'd2', 'type'],
    noId: true,
    fields: [
      { key: 'd1',     type: 'ref',    label: 'Hanedan 1', refCollection: 'dynasties', required: true },
      { key: 'd2',     type: 'ref',    label: 'Hanedan 2', refCollection: 'dynasties', required: true },
      { key: 'type',   type: 'select', label: 'İlişki Tipi',
        options: ['selef','vasal','rakip','dal/kol'] },
      { key: 'period', type: 'text',   label: 'Dönem' },
    ]
  },

  diplomacy: {
    label: { tr: 'Diplomasi', en: 'Diplomacy', ar: 'الدبلوماسية' },
    icon: '🤝',
    listColumns: ['did', 'ptr', 'pen', 'per'],
    noId: true,
    fields: [
      { key: 'did', type: 'ref',      label: 'Hanedan', refCollection: 'dynasties' },
      { key: 'ptr', type: 'text',     label: 'Partner (TR)' },
      { key: 'pen', type: 'text',     label: 'Partner (EN)' },
      { key: 'per', type: 'text',     label: 'Dönem' },
      { key: 'narr', type: 'richtext', label: 'Anlatı', trilingual: true },
    ]
  },

  causal: {
    label: { tr: 'Nedensellik Bağları', en: 'Causal Links', ar: 'الروابط السببية' },
    icon: '🔀',
    listColumns: ['id', 'st', 'si', 'tt', 'ti', 'lt'],
    fields: [
      { key: 'id',  type: 'readonly', label: 'ID' },
      { key: 'st',  type: 'select',   label: 'Kaynak Tipi',
        options: ['dynasty','battle','event','scholar','monument','trade_route','diplomacy'] },
      { key: 'si',  type: 'number',   label: 'Kaynak ID' },
      { key: 'tt',  type: 'select',   label: 'Hedef Tipi',
        options: ['dynasty','battle','event','scholar','monument','trade_route','diplomacy'] },
      { key: 'ti',  type: 'number',   label: 'Hedef ID' },
      { key: 'lt',  type: 'select',   label: 'Bağlantı Tipi',
        options: ['succession','conquest','division','patronage','cultural','expansion','foundation','influence','rivalry','alliance','decline','crisis','collapse','trigger','defeat','reform','creation','economic','diplomatic','control','context','coup','delegation','flight'] },
      { key: 'dtr', type: 'text',     label: 'Açıklama (TR)' },
      { key: 'den', type: 'text',     label: 'Description (EN)' },
      { key: 'dar', type: 'text',     label: 'الوصف (AR)', rtl: true },
    ]
  },

  waqfs: {
    label: { tr: 'Vakıflar', en: 'Waqfs', ar: 'الأوقاف' },
    icon: '🕌',
    listColumns: ['id', 'tr', 'en', 'yr', 'dyn'],
    fields: [
      { key: 'id',          type: 'readonly',  label: 'ID' },
      { key: 'tr',          type: 'text',      label: 'İsim (TR)',          lang: 'tr', required: true },
      { key: 'en',          type: 'text',      label: 'Name (EN)',          lang: 'en', required: true },
      { key: 'ar',          type: 'text',      label: 'الاسم (AR)',         lang: 'ar', rtl: true },
      { key: 'yr',          type: 'number',    label: 'Kuruluş Yılı (CE)', required: true },
      { key: 'lat',         type: 'number',    label: 'Enlem',              step: 0.01 },
      { key: 'lon',         type: 'number',    label: 'Boylam',             step: 0.01 },
      { key: 'dyn',         type: 'ref',       label: 'Hanedan',            refCollection: 'dynasties', nullable: true },
      { key: 'founder',     type: 'text',      label: 'Kurucu',             trilingual: true },
      { key: 'type',        type: 'text',      label: 'Tür',                trilingual: true },
      { key: 'beneficiary', type: 'text',      label: 'Faydalananlar',      trilingual: true },
      { key: 'city',        type: 'text',      label: 'Şehir',              trilingual: true },
      { key: 'endowment',   type: 'textarea',  label: 'Vakfiye',            trilingual: true },
      { key: 'status',      type: 'text',      label: 'Durum',              trilingual: true },
      { key: 'narr',        type: 'richtext',  label: 'Anlatı',             trilingual: true },
    ]
  },
};

/** Collection order for sidebar */
export const COLLECTION_ORDER = [
  'dynasties', 'battles', 'events', 'scholars', 'monuments',
  'cities', 'routes', 'rulers', 'madrasas', 'waqfs', 'analytics',
  'relations', 'diplomacy', 'causal'
];

/** Auxiliary data modules (non-db.json) */
export const AUX_MODULES = [
  { key: 'i18n',          label: { tr: 'UI Metinleri', en: 'UI Texts', ar: 'نصوص الواجهة' }, icon: '🌐' },
  { key: 'tours',         label: { tr: 'Turlar', en: 'Tours', ar: 'الجولات' }, icon: '🛤' },
  { key: 'eraInfo',       label: { tr: 'Dönem Kartları', en: 'Era Cards', ar: 'بطاقات العصور' }, icon: '📅' },
  { key: 'glossary',      label: { tr: 'Sözlük', en: 'Glossary', ar: 'المصطلحات' }, icon: '📖' },
  { key: 'scholarLinks',  label: { tr: 'Âlim Bağlantıları', en: 'Scholar Links', ar: 'روابط العلماء' }, icon: '🔗' },
  { key: 'isnadChains',   label: { tr: 'İsnâd Zincirleri', en: 'Isnad Chains', ar: 'سلاسل الإسناد' }, icon: '⛓' },
  { key: 'battleMeta',    label: { tr: 'Savaş Detayları', en: 'Battle Details', ar: 'تفاصيل المعارك' }, icon: '🗡' },
  { key: 'scholarMeta',   label: { tr: 'Âlim Detayları', en: 'Scholar Details', ar: 'تفاصيل العلماء' }, icon: '🎓' },
  { key: 'constants',     label: { tr: 'Renk/Ayarlar', en: 'Colors/Settings', ar: 'الألوان/الإعدادات' }, icon: '🎨' },
];

/* ═══ Muqaddasi Layer Constants ═══ */

export const IQLIM_COLORS = {
  'إقليم المشرق': '#e6194b',
  'جزيرة العرب': '#f58231',
  'فارس': '#ffe119',
  'المغرب': '#3cb44b',
  'الشام': '#42d4f4',
  'الرحاب': '#4363d8',
  'أقور': '#911eb4',
  'العراق': '#f032e6',
  'الديلم': '#a9a9a9',
  'الجبال': '#9a6324',
  'خوزستان': '#800000',
  'السند': '#469990',
  'مصر': '#dcbeff',
  'كرمان': '#aaffc3',
};

export const IQLIM_LABELS = {
  'إقليم المشرق': { tr: 'Meşrik', en: 'al-Mashriq' },
  'جزيرة العرب': { tr: 'Arap Yarımadası', en: 'Arabian Peninsula' },
  'فارس': { tr: 'Fars', en: 'Fārs' },
  'المغرب': { tr: 'Mağrib', en: 'al-Maghrib' },
  'الشام': { tr: 'Şam', en: 'al-Shām' },
  'الرحاب': { tr: 'Rihâb', en: 'al-Riḥāb' },
  'أقور': { tr: 'Akur', en: 'Aqūr' },
  'العراق': { tr: 'Irak', en: 'Iraq' },
  'الديلم': { tr: 'Deylem', en: 'al-Daylam' },
  'الجبال': { tr: 'Cibâl', en: 'al-Jibāl' },
  'خوزستان': { tr: 'Hûzistan', en: 'Khūzistān' },
  'السند': { tr: 'Sind', en: 'al-Sind' },
  'مصر': { tr: 'Mısır', en: 'Egypt' },
  'كرمان': { tr: 'Kirman', en: 'Kirmān' },
};

export const CERT_OPACITY = {
  certain: 1.0, exact: 1.0, modern_known: 1.0,
  approximate: 0.7, country: 0.7, region: 0.7,
  uncertain: 0.45, inferred: 0.45,
  estimated: 0.35,
};

export const CERT_RADIUS = {
  certain: 5, exact: 5, modern_known: 5,
  approximate: 4, country: 4, region: 4,
  uncertain: 3.5, inferred: 3.5,
  estimated: 3,
};

export const DEFAULT_COLOR = '#808080';

export const normalize = (s) =>
  (s || '').toLowerCase()
    .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
    .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/â/g, 'a').replace(/î/g, 'i').replace(/û/g, 'u')
    .replace(/[āáà]/g, 'a').replace(/[ūú]/g, 'u').replace(/[īíì]/g, 'i')
    .replace(/[ḥḫ]/g, 'h').replace(/ṣ/g, 's').replace(/ṭ/g, 't')
    .replace(/ḍ/g, 'd').replace(/ẓ/g, 'z').replace(/ʿ|ʾ|'/g, '')
    .replace(/[\u0610-\u065f\u0670]/g, '')
    .replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/أ|إ|آ/g, 'ا');

export const MUQ_T = {
  tr: {
    title: 'Ahsenü\'t-Tekâsim',
    sub: 'Makdisî (ö. 390/1000) — 2.049 Yerleşim · 1.427 Güzergâh · 14 İklim',
    loading: 'Makdisî verileri yükleniyor…',
    totalPlaces: 'yerleşim', routes: 'güzergâh', aqualim: 'iklim',
    geocoded: 'konumlu',
    search: 'Yer ara…',
    entries: 'yer',
    noEntries: 'Bu filtre ile eşleşen yer bulunamadı.',
    noSelection: 'Detay için bir yere tıklayın',
    source: "Kaynak: el-Makdisî, Ahsenü't-Tekâsîm fî Ma'rifeti'l-Ekâlîm (thk. De Goeje, BGA III)",
    allIqlim: 'Tüm İklimler',
    allCert: 'Tüm Güven',
    certainty: 'Güven',
    certain: 'Kesin', approximate: 'Yaklaşık', uncertain: 'Belirsiz', estimated: 'Tahmini',
    coordinates: 'Koordinat',
    coordSource: 'Kaynak',
    iqlim: 'İklim',
    description: 'Açıklama',
    showRoutes: 'Güzergâhları göster',
    routeInfo: 'Güzergâh bilgisi',
    distance: 'Mesafe',
    marhala: 'merhale',
    listView: 'Liste',
    mapView: 'Harita',
    km: 'km',
  },
  en: {
    title: 'Aḥsan al-Taqāsīm',
    sub: 'al-Muqaddasī (d. 390/1000) — 2,049 Places · 1,427 Routes · 14 Iqlīm',
    loading: 'Loading Muqaddasī data…',
    totalPlaces: 'places', routes: 'routes', aqualim: 'iqlīm',
    geocoded: 'geocoded',
    search: 'Search places…',
    entries: 'places',
    noEntries: 'No places match this filter.',
    noSelection: 'Click a place for details',
    source: "Source: al-Muqaddasī, Aḥsan al-Taqāsīm fī Maʿrifat al-Aqālīm (ed. De Goeje, BGA III)",
    allIqlim: 'All Iqlīm',
    allCert: 'All Confidence',
    certainty: 'Confidence',
    certain: 'Certain', approximate: 'Approximate', uncertain: 'Uncertain', estimated: 'Estimated',
    coordinates: 'Coordinates',
    coordSource: 'Source',
    iqlim: 'Iqlīm',
    description: 'Description',
    showRoutes: 'Show routes',
    routeInfo: 'Route info',
    distance: 'Distance',
    marhala: 'marhala',
    listView: 'List',
    mapView: 'Map',
    km: 'km',
  },
  ar: {
    title: 'أحسن التقاسيم في معرفة الأقاليم',
    sub: 'المقدسي (ت. ٣٩٠هـ) — ٢٬٠٤٩ موضعًا · ١٬٤٢٧ طريقًا · ١٤ إقليمًا',
    loading: 'جارٍ تحميل بيانات المقدسي…',
    totalPlaces: 'موضع', routes: 'طريق', aqualim: 'إقليم',
    search: 'ابحث عن موضع…',
    entries: 'موضع',
    noSelection: 'اضغط على موضع لعرض التفاصيل',
    source: 'المصدر: المقدسي، أحسن التقاسيم في معرفة الأقاليم (تحقيق دي خويه)',
    allIqlim: 'كل الأقاليم',
    iqlim: 'الإقليم',
  },
};

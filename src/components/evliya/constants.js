/**
 * constants.js — Shared constants for Evliya Çelebi layer
 * Single source of truth: categories, xref layers, i18n labels
 */

// ── Category Icons ──
export const CAT_ICONS = {
  şehir: '🏙️', kasaba: '🏘️', köy: '🏡', kale: '🏰', cami: '🕌',
  mescit: '🕌', medrese: '📚', hamam: '🛁', han: '🏨', bedesten: '🏪',
  çeşme: '⛲', köprü: '🌉', türbe: '⚰️', tekke: '🕯️', saray: '🏛️',
  kilise: '⛪', liman: '⚓', ada: '🏝️', dağ: '⛰️', nehir: '🌊',
  göl: '💧', bilinmeyen: '📍',
};

// ── Category Labels (3-lang) ──
export const CAT_LABELS = {
  tr: {
    şehir: 'Şehir', kasaba: 'Kasaba', köy: 'Köy', kale: 'Kale', cami: 'Cami',
    mescit: 'Mescit', medrese: 'Medrese', hamam: 'Hamam', han: 'Han', bedesten: 'Bedesten',
    çeşme: 'Çeşme', köprü: 'Köprü', türbe: 'Türbe', tekke: 'Tekke', saray: 'Saray',
    kilise: 'Kilise', liman: 'Liman', ada: 'Ada', dağ: 'Dağ', nehir: 'Nehir',
    göl: 'Göl', bilinmeyen: 'Diğer',
  },
  en: {
    şehir: 'City', kasaba: 'Town', köy: 'Village', kale: 'Castle', cami: 'Mosque',
    mescit: 'Small Mosque', medrese: 'Madrasa', hamam: 'Bath', han: 'Caravanserai',
    bedesten: 'Market', çeşme: 'Fountain', köprü: 'Bridge', türbe: 'Shrine',
    tekke: 'Lodge', saray: 'Palace', kilise: 'Church', liman: 'Port', ada: 'Island',
    dağ: 'Mountain', nehir: 'River', göl: 'Lake', bilinmeyen: 'Other',
  },
  ar: {
    şehir: 'مدينة', kasaba: 'بلدة', köy: 'قرية', kale: 'قلعة', cami: 'جامع',
    mescit: 'مسجد', medrese: 'مدرسة', hamam: 'حمّام', han: 'خان', bedesten: 'سوق',
    çeşme: 'سبيل', köprü: 'جسر', türbe: 'ضريح', tekke: 'تكية', saray: 'قصر',
    kilise: 'كنيسة', liman: 'ميناء', ada: 'جزيرة', dağ: 'جبل', nehir: 'نهر',
    göl: 'بحيرة', bilinmeyen: 'أخرى',
  },
};

// ── Cross-Reference Labels ──
export const XREF_LABELS = {
  thurayya: 'al-Ṯurayyā',
  yaqut: 'Yâkût el-Hamevî',
  ibn_battuta: 'İbn Battûta',
  le_strange: 'Le Strange',
  maqrizi: 'Makrîzî',
  dia: 'TDV DİA',
  atlas_city: 'Atlas Şehir',
  atlas_monument: 'Atlas Anıt',
  atlas_madrasa: 'Atlas Medrese',
  atlas_battle: 'Atlas Savaş',
  atlas_scholar: 'Atlas Âlim',
};

export const XREF_ICONS = {
  thurayya: '🌟', yaqut: '📖', ibn_battuta: '🐫', le_strange: '🗺️',
  maqrizi: '🏛️', dia: '📚', atlas_city: '🏙️', atlas_monument: '🕌',
  atlas_madrasa: '🎓', atlas_battle: '⚔️', atlas_scholar: '👳',
};

export const XREF_COLORS = {
  thurayya: '#FFD700', yaqut: '#4ECDC4', ibn_battuta: '#E63946',
  le_strange: '#457B9D', maqrizi: '#F4A261', dia: '#2A9D8F',
  atlas_city: '#6A4C93', atlas_monument: '#BC6C25', atlas_madrasa: '#1D3557',
  atlas_battle: '#D4A373', atlas_scholar: '#264653',
};

// ── UI Labels (3-lang) ──
export const UI_LABELS = {
  tr: {
    search: 'Yer ara... (Osmanlıca / modern)',
    voyages: 'Seyahatler',
    categories: 'Kategoriler',
    xrefLayers: 'Çapraz Referanslar',
    all: 'Tümü',
    showing: 'gösterilen',
    of: ' / ',
    dashboard: 'İstatistikler',
    clearFilters: 'Filtreleri temizle',
    title: 'Evliyâ Çelebi Seyahatnâme — İstatistikler',
    back: '← Haritaya dön',
    totalStops: 'Toplam Durak',
    totalVoyages: 'Seyahat',
    totalCategories: 'Kategori',
    xrefCoverage: 'Çapraz Ref Kapsam',
    voyageStats: 'Seyahat İstatistikleri',
    categoryBreakdown: 'Kategori Dağılımı',
    xrefBreakdown: 'Çapraz Referans Dağılımı',
    topXrefPlaces: 'En Zengin Çapraz Referans Noktaları',
    stops: 'durak',
    xrefs: 'referans',
    total: 'Toplam',
    readMore: 'Devamını oku',
    readLess: 'Kısalt',
    crossRefs: 'Çapraz Referanslar',
    originalName: 'Orijinal adı:',
    ibnBattutaVisited: 'İbn Battûta da burayı ziyaret etti',
    loading: 'Evliyâ Çelebi Seyahatnâme yükleniyor...',
    loadError: 'Veri yüklenemedi',
    retry: 'Tekrar dene',
  },
  en: {
    search: 'Search places...',
    voyages: 'Voyages',
    categories: 'Categories',
    xrefLayers: 'Cross-References',
    all: 'All',
    showing: 'showing',
    of: ' / ',
    dashboard: 'Dashboard',
    clearFilters: 'Clear filters',
    title: 'Evliya Çelebi Seyahatname — Statistics',
    back: '← Back to map',
    totalStops: 'Total Stops',
    totalVoyages: 'Voyages',
    totalCategories: 'Categories',
    xrefCoverage: 'Cross-Ref Coverage',
    voyageStats: 'Voyage Statistics',
    categoryBreakdown: 'Category Breakdown',
    xrefBreakdown: 'Cross-Reference Distribution',
    topXrefPlaces: 'Richest Cross-Reference Locations',
    stops: 'stops',
    xrefs: 'references',
    total: 'Total',
    readMore: 'Read more',
    readLess: 'Show less',
    crossRefs: 'Cross-References',
    originalName: 'Original name:',
    ibnBattutaVisited: 'Ibn Battuta also visited this place',
    loading: 'Loading Evliya Çelebi Seyahatname...',
    loadError: 'Failed to load data',
    retry: 'Retry',
  },
  ar: {
    search: 'بحث عن الأماكن...',
    voyages: 'الرحلات',
    categories: 'الفئات',
    xrefLayers: 'المراجع المتقاطعة',
    all: 'الكل',
    showing: 'معروض',
    of: ' / ',
    dashboard: 'الإحصائيات',
    clearFilters: 'مسح الفلاتر',
    title: 'أوليا جلبي سياحتنامه — الإحصائيات',
    back: '← العودة إلى الخريطة',
    totalStops: 'إجمالي المحطات',
    totalVoyages: 'الرحلات',
    totalCategories: 'الفئات',
    xrefCoverage: 'تغطية المراجع',
    voyageStats: 'إحصائيات الرحلات',
    categoryBreakdown: 'توزيع الفئات',
    xrefBreakdown: 'توزيع المراجع المتقاطعة',
    topXrefPlaces: 'أغنى نقاط المراجع المتقاطعة',
    stops: 'محطة',
    xrefs: 'مرجع',
    total: 'المجموع',
    readMore: 'المزيد',
    readLess: 'أقل',
    crossRefs: 'المراجع المتقاطعة',
    originalName: 'الاسم الأصلي:',
    ibnBattutaVisited: 'زار ابن بطوطة هذا المكان أيضاً',
    loading: 'جارٍ التحميل...',
    loadError: 'فشل تحميل البيانات',
    retry: 'إعادة المحاولة',
  },
};

// ── Helpers ──

/** Get i18n label */
export function getLabels(lang) {
  return UI_LABELS[lang] || UI_LABELS.tr;
}

/** Get voyage name key for lang */
export function voyageNameKey(lang) {
  return lang === 'tr' ? 'title_tr' : lang === 'ar' ? 'title_ar' : 'title_en';
}

/** Normalize Turkish characters for fuzzy search */
export function normalizeTurkish(str) {
  return str
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/â/g, 'a')
    .replace(/î/g, 'i')
    .replace(/û/g, 'u');
}

/** Simple HTML tag stripper for narrative text (XSS prevention) */
export function stripHtml(str) {
  if (!str) return '';
  return str.replace(/<[^>]*>/g, '');
}

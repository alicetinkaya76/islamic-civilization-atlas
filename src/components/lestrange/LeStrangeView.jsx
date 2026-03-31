import { useState, useEffect, useMemo, useCallback, Component } from 'react';
import useAsyncData from '../../hooks/useAsyncData.jsx';
import SkeletonLoader from '../shared/SkeletonLoader';
import LeStrangeSidebar from './LeStrangeSidebar';
import LeStrangeMap from './LeStrangeMap';
import LeStrangeIdCard from './LeStrangeIdCard';
import '../../styles/lestrange.css';

/* ═══ Error Boundary ═══ */
class LeStrangeErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('LeStrangeView error:', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: 'center', color: '#c4b89a' }}>
          <h3>⚠️ Bir hata oluştu</h3>
          <p style={{ color: '#ef5350', fontSize: 12, fontFamily: 'monospace' }}>{String(this.state.error)}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}
            style={{ marginTop: 16, padding: '8px 16px', background: '#4a6741', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
            Tekrar Dene / Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ═══ Normalize for search ═══ */
const normalize = (s) =>
  (s || '').toLowerCase()
    .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
    .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/â/g, 'a').replace(/î/g, 'i').replace(/û/g, 'u')
    .replace(/[āáà]/g, 'a').replace(/[ūú]/g, 'u').replace(/[īíì]/g, 'i')
    .replace(/[ḥḫ]/g, 'h').replace(/ṣ/g, 's').replace(/ṭ/g, 't')
    .replace(/ḍ/g, 'd').replace(/ẓ/g, 'z').replace(/ʿ|ʾ|'/g, '')
    .replace(/[\u0610-\u065f\u0670]/g, '')
    .replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/أ|إ|آ/g, 'ا');

/* ═══ i18n labels ═══ */
const LS_T = {
  tr: {
    title: 'Doğu Hilâfet Ülkeleri',
    sub: 'Guy Le Strange (1905) — 434 Kayıt · 34 Eyalet',
    loading: 'Le Strange verileri yükleniyor…',
    totalEntries: 'kayıt', provinces: 'eyalet', geoTypes: 'coğrafi tip',
    geocoded: 'konumlu',
    search: 'Yer ara…', filtersTitle: 'Filtreler',
    allProvinces: 'Tüm Eyaletler', allTypes: 'Tüm Tipler',
    allPeriods: 'Tüm Dönemler', allChapters: 'Tüm Bölümler',
    entries: 'kayıt', noEntries: 'Bu filtre ile eşleşen kayıt yok.',
    noSelection: 'Detay için bir yere tıklayın',
    source: 'Kaynak: Guy Le Strange, The Lands of the Eastern Caliphate (Cambridge UP, 1905)',
    mapView: 'Harita', listView: 'Liste', tabDetail: 'Detay',
    province: 'Eyalet', geoType: 'Coğrafi Tip', chapter: 'Bölüm',
    period: 'Dönem', coordSource: 'Konum Güvenilirliği',
    modernName: 'Bugünkü Adı', modernCountry: 'Günümüz Ülkesi',
    altNames: 'Alternatif İsimler', leStrangeForm: 'Le Strange Yazımı',
    features: 'Özellikler', sourcesCited: 'Ortaçağ Kaynakları',
    products: 'Ürünler ve İhracat', roads: 'Yol Bağlantıları',
    relatedPlaces: 'İlişkili Yerler', crossRefs: 'Çapraz Referanslar',
    founded: 'Kuruluş', coordInfo: 'Koordinat', chapters: 'bölüm',
    modern_known: 'Kesin', approximate: 'Tahmini', estimated: 'Tahmini',
    uncertain: 'Belirsiz', unlocated: 'Konumsuz',
    xrefYaqut: "Yâkūt Mu'cemü'l-Büldân'da Gör",
    xrefEi1: "Brill EI-1'de Gör",
    xrefAtlas: 'Haritada Göster',
    xrefDia: 'DİA Maddesini Oku',
    sortName: 'İsim', sortChapter: 'Bölüm', sortProvince: 'Eyalet',
    district: 'Bölge', description: 'Açıklama',
    pageRange: 'Sayfa',
  },
  en: {
    title: 'Lands of the Eastern Caliphate',
    sub: 'Guy Le Strange (1905) — 434 Records · 34 Provinces',
    loading: 'Loading Le Strange data…',
    totalEntries: 'records', provinces: 'provinces', geoTypes: 'geo types',
    geocoded: 'geocoded',
    search: 'Search places…', filtersTitle: 'Filters',
    allProvinces: 'All Provinces', allTypes: 'All Types',
    allPeriods: 'All Periods', allChapters: 'All Chapters',
    entries: 'records', noEntries: 'No records match this filter.',
    noSelection: 'Click a place for details',
    source: 'Source: Guy Le Strange, The Lands of the Eastern Caliphate (Cambridge UP, 1905)',
    mapView: 'Map', listView: 'List', tabDetail: 'Detail',
    province: 'Province', geoType: 'Geo Type', chapter: 'Chapter',
    period: 'Period', coordSource: 'Coordinate Source',
    modernName: 'Modern Name', modernCountry: 'Modern Country',
    altNames: 'Alternate Names', leStrangeForm: 'Le Strange Form',
    features: 'Features', sourcesCited: 'Medieval Sources',
    products: 'Products & Exports', roads: 'Road Connections',
    relatedPlaces: 'Related Places', crossRefs: 'Cross-References',
    founded: 'Founded', coordInfo: 'Coordinates', chapters: 'chapters',
    modern_known: 'Precise', approximate: 'Approximate', estimated: 'Estimated',
    uncertain: 'Uncertain', unlocated: 'Unlocated',
    xrefYaqut: "View in Yāqūt Muʿjam al-Buldān",
    xrefEi1: 'View in Brill EI-1',
    xrefAtlas: 'Show on Map',
    xrefDia: 'Read DİA Entry',
    sortName: 'Name', sortChapter: 'Chapter', sortProvince: 'Province',
    district: 'District', description: 'Description',
    pageRange: 'Pages',
  },
  ar: {
    title: 'بلدان الخلافة الشرقية',
    sub: 'غي لي سترينج (١٩٠٥) — ٤٣٤ سجل · ٣٤ إقليم',
    loading: 'جاري تحميل البيانات…',
    totalEntries: 'سجل', provinces: 'إقليم', geoTypes: 'نوع جغرافي',
    geocoded: 'محدد الموقع',
    search: 'ابحث عن مكان…', filtersTitle: 'مرشحات',
    allProvinces: 'جميع الأقاليم', allTypes: 'جميع الأنواع',
    allPeriods: 'جميع الفترات', allChapters: 'جميع الفصول',
    entries: 'سجل', noEntries: 'لا توجد سجلات مطابقة.',
    noSelection: 'اضغط على مكان لعرض التفاصيل',
    source: 'المصدر: غي لي سترينج، بلدان الخلافة الشرقية (كامبريدج، ١٩٠٥)',
    mapView: 'خريطة', listView: 'قائمة', tabDetail: 'تفاصيل',
    province: 'إقليم', geoType: 'النوع', chapter: 'فصل',
    period: 'فترة', coordSource: 'مصدر الإحداثيات',
    modernName: 'الاسم الحديث', modernCountry: 'البلد الحالي',
    altNames: 'أسماء بديلة', leStrangeForm: 'كتابة لي سترينج',
    features: 'مميزات', sourcesCited: 'المصادر الوسيطة',
    products: 'المنتجات', roads: 'الطرق',
    relatedPlaces: 'أماكن ذات صلة', crossRefs: 'مراجع متقاطعة',
    founded: 'التأسيس', coordInfo: 'إحداثيات', chapters: 'فصل',
    modern_known: 'دقيق', approximate: 'تقريبي', estimated: 'تقديري',
    uncertain: 'غير مؤكد', unlocated: 'غير محدد',
    xrefYaqut: 'عرض في معجم البلدان لياقوت',
    xrefEi1: 'عرض في دائرة المعارف الإسلامية',
    xrefAtlas: 'عرض على الخريطة',
    xrefDia: 'اقرأ مادة الموسوعة',
    sortName: 'الاسم', sortChapter: 'الفصل', sortProvince: 'الإقليم',
    district: 'ناحية', description: 'الوصف',
    pageRange: 'صفحات',
  },
};

/* ═══ Helpers ═══ */
function buildStats(records) {
  const provinces = new Set(records.map(r => r.province).filter(Boolean));
  const geoTypes = new Set(records.map(r => r.geo_type).filter(Boolean));
  const geocoded = records.filter(r => r.coord_source && r.coord_source !== 'unlocated').length;
  return {
    total: records.length,
    provinces: provinces.size,
    geoTypes: geoTypes.size,
    geocoded,
    geocodedPct: ((geocoded / records.length) * 100).toFixed(1),
  };
}

function LeStrangeViewInner({ lang, initialSearch }) {
  const tr = LS_T[lang] || LS_T.tr;
  const { data: records, loading, error } = useAsyncData('/data/le_strange_eastern_caliphate.json');

  /* Load xref separately to avoid double-useAsyncData hook issues */
  const [xrefData, setXrefData] = useState(null);
  useEffect(() => {
    fetch('/data/le_strange_xref.json')
      .then(r => r.json())
      .then(setXrefData)
      .catch(() => setXrefData({}));
  }, []);

  const xref = useMemo(() => xrefData || {}, [xrefData]);
  const recordMap = useMemo(() => {
    const m = {};
    (records || []).forEach(r => { m[r.id] = r; });
    return m;
  }, [records]);

  const stats = useMemo(() => buildStats(records || []), [records]);

  /* ── Extract unique values for filters ── */
  const allProvinces = useMemo(() => {
    if (!records) return [];
    const c = {};
    const trMap = {};
    const arMap = {};
    records.forEach(r => {
      if (r.province) {
        c[r.province] = (c[r.province] || 0) + 1;
        if (r.province_tr && !trMap[r.province]) trMap[r.province] = r.province_tr;
        if (r.province_ar && !arMap[r.province]) arMap[r.province] = r.province_ar;
      }
    });
    return Object.entries(c).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({
      name: k, count: v, label_tr: trMap[k] || k, label_ar: arMap[k] || k
    }));
  }, [records]);

  const allGeoTypes = useMemo(() => {
    if (!records) return [];
    const c = {};
    const trMap = {};
    records.forEach(r => {
      if (r.geo_type) {
        c[r.geo_type] = (c[r.geo_type] || 0) + 1;
        if (r.geo_type_tr && !trMap[r.geo_type]) trMap[r.geo_type] = r.geo_type_tr;
      }
    });
    return Object.entries(c).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({
      name: k, count: v, label_tr: trMap[k] || k
    }));
  }, [records]);

  const allChapters = useMemo(() => {
    if (!records) return [];
    const c = {};
    records.forEach(r => {
      if (r.chapter) {
        if (!c[r.chapter]) c[r.chapter] = { num: r.chapter, title: r.chapter_title, count: 0 };
        c[r.chapter].count++;
      }
    });
    return Object.values(c).sort((a, b) => a.num - b.num);
  }, [records]);

  const allPeriods = useMemo(() => {
    if (!records) return [];
    const c = {};
    records.forEach(r => { if (r.period_tags) r.period_tags.forEach(p => { c[p] = (c[p] || 0) + 1; }); });
    return Object.entries(c).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ name: k, count: v }));
  }, [records]);

  /* ── Filters ── */
  const [search, setSearch] = useState(initialSearch || '');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedGeoType, setSelectedGeoType] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedChapter, setSelectedChapter] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [showMobile, setShowMobile] = useState('list');
  const [sortBy, setSortBy] = useState('chapter'); // 'name' | 'chapter' | 'province'

  /* Sync search from URL hash param */
  useEffect(() => {
    if (initialSearch) setSearch(initialSearch);
  }, [initialSearch]);

  const filtered = useMemo(() => {
    let arr = records || [];
    if (selectedProvince) arr = arr.filter(r => r.province === selectedProvince);
    if (selectedGeoType) arr = arr.filter(r => r.geo_type === selectedGeoType);
    if (selectedPeriod) arr = arr.filter(r => r.period_tags?.includes(selectedPeriod));
    if (selectedChapter) arr = arr.filter(r => r.chapter === selectedChapter);
    if (search && search.length >= 2) {
      const q = normalize(search);
      arr = arr.filter(r =>
        normalize(r.name_tr).includes(q) || normalize(r.name_en).includes(q) ||
        normalize(r.name_ar).includes(q) || normalize(r.le_strange_form).includes(q) ||
        normalize(r.modern_name).includes(q)
      );
    }
    /* Sort */
    const sorted = [...arr];
    if (sortBy === 'name') {
      const key = lang === 'ar' ? 'name_ar' : lang === 'en' ? 'name_en' : 'name_tr';
      sorted.sort((a, b) => (a[key] || '').localeCompare(b[key] || '', lang === 'ar' ? 'ar' : 'en'));
    } else if (sortBy === 'province') {
      sorted.sort((a, b) => (a.province || '').localeCompare(b.province || '') || a.chapter - b.chapter);
    } else {
      sorted.sort((a, b) => a.chapter - b.chapter || a.id - b.id);
    }
    return sorted;
  }, [records, search, selectedProvince, selectedGeoType, selectedPeriod, selectedChapter, sortBy, lang]);

  const handleSelect = useCallback((id) => {
    setSelectedId(id);
    if (window.innerWidth <= 900) setShowMobile('card');
  }, []);

  const selectedRecord = selectedId ? recordMap[selectedId] : null;

  if (loading || !records) return <SkeletonLoader variant="list" rows={10} message={tr.loading} />;
  if (error) return (
    <div className="skeleton-loader" style={{ textAlign: 'center', padding: 40 }}>
      <p style={{ color: '#ef5350', fontSize: 13 }}>{String(error.message || error)}</p>
      <button onClick={() => window.location.reload()}
        style={{ marginTop: 12, padding: '8px 20px', background: '#4a6741', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
        Tekrar dene / Retry
      </button>
    </div>
  );

  return (
    <div className="lestrange-view">
      {/* ── Header ── */}
      <div className="lestrange-header">
        <div className="lestrange-header-info">
          <h2 className="lestrange-title">{tr.title}</h2>
          <span className="lestrange-subtitle">{tr.sub}</span>
        </div>
        <div className="lestrange-header-stats">
          <span className="lestrange-stat"><strong>{stats.total}</strong> {tr.totalEntries}</span>
          <span className="lestrange-stat-sep">·</span>
          <span className="lestrange-stat"><strong>{stats.provinces}</strong> {tr.provinces}</span>
          <span className="lestrange-stat-sep">·</span>
          <span className="lestrange-stat"><strong>{stats.geoTypes}</strong> {tr.geoTypes}</span>
          <span className="lestrange-stat-sep">·</span>
          <span className="lestrange-stat"><strong>%{stats.geocodedPct}</strong> {tr.geocoded}</span>
        </div>
      </div>

      {/* ── Mobile toggle ── */}
      <div className="lestrange-mobile-toggle">
        <button className={showMobile === 'list' ? 'active' : ''} onClick={() => setShowMobile('list')}>☰ {tr.listView}</button>
        <button className={showMobile === 'map' ? 'active' : ''} onClick={() => setShowMobile('map')}>🗺 {tr.mapView}</button>
        {selectedRecord && <button className={showMobile === 'card' ? 'active' : ''} onClick={() => setShowMobile('card')}>📋 {tr.tabDetail}</button>}
      </div>

      {/* ── Body: 3 column ── */}
      <div className="lestrange-body">
        <div className={`lestrange-sidebar${showMobile === 'list' ? ' mobile-visible' : ''}`}>
          <LeStrangeSidebar
            lang={lang} tr={tr}
            filtered={filtered} records={records}
            search={search} setSearch={setSearch}
            allProvinces={allProvinces} allGeoTypes={allGeoTypes}
            allChapters={allChapters} allPeriods={allPeriods}
            selectedProvince={selectedProvince} setSelectedProvince={setSelectedProvince}
            selectedGeoType={selectedGeoType} setSelectedGeoType={setSelectedGeoType}
            selectedPeriod={selectedPeriod} setSelectedPeriod={setSelectedPeriod}
            selectedChapter={selectedChapter} setSelectedChapter={setSelectedChapter}
            sortBy={sortBy} setSortBy={setSortBy}
            selectedId={selectedId} onSelect={handleSelect}
            xref={xref}
          />
        </div>
        <div className={`lestrange-map-area${showMobile === 'map' ? ' mobile-visible' : ''}`}>
          <LeStrangeMap
            lang={lang} tr={tr}
            records={filtered} allRecords={records}
            selectedId={selectedId}
            selectedRecord={selectedRecord}
            onSelect={handleSelect}
          />
        </div>
        <div className={`lestrange-card-area${showMobile === 'card' ? ' mobile-visible' : ''}${selectedRecord ? ' has-selection' : ''}`}>
          <LeStrangeIdCard
            lang={lang} tr={tr}
            record={selectedRecord}
            xref={xref}
            onClose={() => setSelectedId(null)}
          />
        </div>
      </div>

      <div className="lestrange-source">{tr.source}</div>
    </div>
  );
}

export default function LeStrangeViewWrapper(props) {
  return (
    <LeStrangeErrorBoundary lang={props.lang}>
      <LeStrangeViewInner {...props} />
    </LeStrangeErrorBoundary>
  );
}

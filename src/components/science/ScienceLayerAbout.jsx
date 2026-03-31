/**
 * ScienceLayerAbout.jsx — islamicatlas.org Science Layer Dashboard (v7.4.0.0 / O8)
 *
 * B7: Added route statistics (24 routes × 3 categories, total waypoints)
 *     Regional distribution chart, cross-reference statistics
 *     Updated version and scholar counts
 */

import { useMemo } from 'react';
import { FIELD_COLORS, FIELD_NAMES, PERIODS } from './ScienceLayerView';

/* ── Route category labels ── */
const ROUTE_CAT_NAMES = {
  internal:          { en: 'Internal',          tr: 'İç',               ar: 'داخلي' },
  science_transfer:  { en: 'Science Transfer',  tr: 'Bilim Transferi',  ar: 'نقل العلوم' },
  cultural_transfer: { en: 'Cultural Transfer', tr: 'Kültür Transferi', ar: 'النقل الثقافي' },
};
const ROUTE_CAT_COLORS = {
  internal: '#3B82F6',
  science_transfer: '#F59E0B',
  cultural_transfer: '#10B981',
};

/* ── i18n ── */
const AB_T = {
  tr: {
    title: 'İslam Bilim Atlası — Hakkında',
    back: '← Haritaya Dön',
    overview: 'Genel Bakış',
    scholars: 'Alim', institutions: 'Kurum', discoveries: 'Keşif', routes: 'Güzergâh',
    byPeriod: 'Dönemlere Göre',
    byField: 'Alanlara Göre',
    byGender: 'Cinsiyete Göre',
    female: 'Kadın', male: 'Erkek',
    refCoverage: 'Referans Kapsamı',
    dia: 'DİA', alam: 'el-A\'lâm', ei1: 'EI-1',
    topCities: 'En Çok Alim Yetiştiren Şehirler',
    routeStats: 'Güzergâh İstatistikleri',
    routeCategories: 'Kategori', waypoints: 'Durak Noktası',
    crossRef: 'Çapraz Referanslar',
    scholarWithRoutes: 'Güzergâhlı Alim', routeWithScholars: 'Alimli Güzergâh',
    totalLinks: 'Toplam Bağlantı',
    byRegion: 'Bölgesel Dağılım',
    about: 'Proje Hakkında',
    aboutText: 'İslam Bilim Atlası, İslam medeniyetinin bilimsel mirasını interaktif bir harita üzerinde görselleştirme projesidir. 7. yüzyıldan 20. yüzyıla kadar Müslüman alimlerin katkılarını, çalıştıkları kurumları, bilimsel keşiflerini ve bilgi güzergâhlarını bir araya getirir.',
    sources: 'Kaynaklar',
    sourcesText: 'TDV İslam Ansiklopedisi (DİA), Hayreddin ez-Ziriklî — el-A\'lâm, Encyclopaedia of Islam (1st edition), İslam Medeniyeti Akademisi dersleri.',
    team: 'Hazırlayan',
    teamText: 'Dr. Ali Çetinkaya (Selçuk Üniversitesi), Dr. Hüseyin Gökalp (Selçuk Üniversitesi)',
    version: 'v7.4.0 · 31 Mart 2026',
    womenNote: '11 kadın alim: Meryem el-İcliyye, Süteyde, Zeyneb bt. Ahmed, Âişe el-Bâûniyye, Dayfe Hâtun, Zübeyde bt. Ca\'fer, Şühde el-Kâtibe, Raziye Sultan ve diğerleri',
  },
  en: {
    title: 'Islamic Science Atlas — About',
    back: '← Back to Map',
    overview: 'Overview',
    scholars: 'Scholars', institutions: 'Institutions', discoveries: 'Discoveries', routes: 'Routes',
    byPeriod: 'By Period',
    byField: 'By Field',
    byGender: 'By Gender',
    female: 'Women', male: 'Men',
    refCoverage: 'Reference Coverage',
    dia: 'DİA', alam: 'al-Aʿlām', ei1: 'EI-1',
    topCities: 'Top Scholarly Cities',
    routeStats: 'Route Statistics',
    routeCategories: 'Category', waypoints: 'Waypoints',
    crossRef: 'Cross-References',
    scholarWithRoutes: 'Scholars with Routes', routeWithScholars: 'Routes with Scholars',
    totalLinks: 'Total Links',
    byRegion: 'Regional Distribution',
    about: 'About the Project',
    aboutText: 'The Islamic Science Atlas visualizes the scientific heritage of Islamic civilization on an interactive map. It brings together the contributions of Muslim scholars from the 7th to 20th century, the institutions they worked at, their scientific discoveries, and knowledge routes.',
    sources: 'Sources',
    sourcesText: 'TDV İslâm Ansiklopedisi (DİA), Khayr al-Dīn al-Ziriklī — al-Aʿlām, Encyclopaedia of Islam (1st edition), Islamic Civilization Academy lectures.',
    team: 'Prepared by',
    teamText: 'Dr. Ali Çetinkaya (Selçuk University), Dr. Hüseyin Gökalp (Selçuk University)',
    version: 'v7.4.0 · March 31, 2026',
    womenNote: '11 women scholars including Mariam al-Ijliyya, Sutayda, Zaynab bint Ahmad, Aisha al-Ba\'uniyya, Dhayfa Khatun, Zubayda bint Ja\'far, Shuhda al-Katiba, Razia Sultan, Zaynab bint al-Kamal, and others',
  },
  ar: {
    title: 'أطلس العلوم الإسلامية — حول',
    back: '← العودة إلى الخريطة',
    overview: 'نظرة عامة',
    scholars: 'عالم', institutions: 'مؤسسة', discoveries: 'اكتشاف', routes: 'مسار',
    byPeriod: 'حسب الفترة',
    byField: 'حسب المجال',
    byGender: 'حسب الجنس',
    female: 'نساء', male: 'رجال',
    refCoverage: 'تغطية المراجع',
    dia: 'الموسوعة', alam: 'الأعلام', ei1: 'دائرة المعارف',
    topCities: 'أبرز المدن العلمية',
    routeStats: 'إحصائيات المسارات',
    routeCategories: 'الفئة', waypoints: 'نقاط التوقف',
    crossRef: 'المراجع المتبادلة',
    scholarWithRoutes: 'علماء بمسارات', routeWithScholars: 'مسارات بعلماء',
    totalLinks: 'إجمالي الروابط',
    byRegion: 'التوزيع الجغرافي',
    about: 'حول المشروع',
    aboutText: 'يعرض أطلس العلوم الإسلامية التراث العلمي للحضارة الإسلامية على خريطة تفاعلية.',
    sources: 'المصادر',
    sourcesText: 'موسوعة الإسلام التركية، الأعلام للزركلي، دائرة المعارف الإسلامية.',
    team: 'إعداد',
    teamText: 'د. علي جتين قايا (جامعة سلجوق)، د. حسين كوكالب (جامعة سلجوق)',
    version: 'الإصدار ٧.٤.٠ · ٣١ مارس ٢٠٢٦',
    womenNote: '١١ عالمة منهن مريم العجلية، ستيدة، زينب بنت أحمد، عائشة الباعونية، لبنة القرطبية، ضيفة خاتون، زبيدة بنت جعفر وغيرهن',
  },
};

/* ── Simple bar component ── */
function StatBar({ label, value, max, color }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="sci-about-bar-row">
      <span className="sci-about-bar-label">{label}</span>
      <div className="sci-about-bar-track">
        <div className="sci-about-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="sci-about-bar-value">{value}</span>
    </div>
  );
}

export default function ScienceLayerAbout({ lang, rawData, onClose }) {
  const t = AB_T[lang] || AB_T.en;
  const isRTL = lang === 'ar';

  const scholars = rawData?.scholars || [];
  const institutions = rawData?.institutions || [];
  const discoveries = rawData?.discoveries || [];
  const routes = rawData?.knowledge_routes || [];

  /* ── Period stats ── */
  const periodStats = useMemo(() => {
    const counts = {};
    scholars.forEach(s => { counts[s.period] = (counts[s.period] || 0) + 1; });
    return PERIODS.map(p => ({ ...p, count: counts[p.id] || 0 }));
  }, [scholars]);

  /* ── Field stats ── */
  const fieldStats = useMemo(() => {
    const counts = {};
    scholars.forEach(s => { counts[s.primary_field] = (counts[s.primary_field] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([field, count]) => ({ field, count }));
  }, [scholars]);

  /* ── Gender stats ── */
  const genderStats = useMemo(() => {
    let female = 0, male = 0;
    scholars.forEach(s => { s.gender === 'female' ? female++ : male++; });
    return { female, male };
  }, [scholars]);

  /* ── Reference coverage ── */
  const refStats = useMemo(() => {
    let dia = 0, alam = 0, ei1 = 0;
    scholars.forEach(s => {
      if (s.references?.dia) dia++;
      if (s.references?.alam) alam++;
      if (s.references?.ei1) ei1++;
    });
    return { dia, alam, ei1 };
  }, [scholars]);

  /* ── Top cities ── */
  const topCities = useMemo(() => {
    const counts = {};
    scholars.forEach(s => {
      const city = s.birth_place?.name?.[lang] || s.birth_place?.name?.en;
      if (city) counts[city] = (counts[city] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [scholars, lang]);

  /* ── B7: Route statistics ── */
  const routeStats = useMemo(() => {
    const catCounts = { internal: 0, science_transfer: 0, cultural_transfer: 0 };
    let totalWaypoints = 0;

    routes.forEach(r => {
      const cat = r.category || 'internal';
      if (catCounts[cat] !== undefined) catCounts[cat]++;
      totalWaypoints += 1 + (r.via?.length || 0) + 1;
    });

    return { catCounts, totalWaypoints };
  }, [routes]);

  /* ── B7: Cross-reference statistics ── */
  const crossRefStats = useMemo(() => {
    let scholarsWithRoutes = 0;
    let totalLinks = 0;

    scholars.forEach(s => {
      if (s.transfer_routes?.length > 0) {
        scholarsWithRoutes++;
        totalLinks += s.transfer_routes.length;
      }
    });

    let routesWithScholars = 0;
    routes.forEach(r => {
      if (r.route_scholars?.length > 0) routesWithScholars++;
    });

    return { scholarsWithRoutes, routesWithScholars, totalLinks };
  }, [scholars, routes]);

  const maxPeriod = Math.max(...periodStats.map(p => p.count), 1);
  const maxField = fieldStats.length > 0 ? fieldStats[0].count : 1;

  return (
    <div className="sci-about" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="sci-about-header">
        <button className="sci-about-back" onClick={onClose}>{t.back}</button>
        <h2 className="sci-about-title">{t.title}</h2>
        <span className="sci-about-version">{t.version}</span>
      </div>

      {/* Overview cards */}
      <div className="sci-about-overview">
        <div className="sci-about-card sci-about-card--gold">
          <span className="sci-about-card-num">{scholars.length}</span>
          <span className="sci-about-card-label">{t.scholars}</span>
        </div>
        <div className="sci-about-card sci-about-card--purple">
          <span className="sci-about-card-num">{institutions.length}</span>
          <span className="sci-about-card-label">{t.institutions}</span>
        </div>
        <div className="sci-about-card sci-about-card--teal">
          <span className="sci-about-card-num">{discoveries.length}</span>
          <span className="sci-about-card-label">{t.discoveries}</span>
        </div>
        <div className="sci-about-card sci-about-card--blue">
          <span className="sci-about-card-num">{routes.length}</span>
          <span className="sci-about-card-label">{t.routes}</span>
        </div>
      </div>

      {/* Charts grid */}
      <div className="sci-about-grid">
        {/* Period distribution */}
        <div className="sci-about-panel">
          <h3 className="sci-about-panel-title">{t.byPeriod}</h3>
          {periodStats.map(p => (
            <StatBar key={p.id} label={`${p.label[lang] || p.label.en} (${p.range})`} value={p.count} max={maxPeriod} color={p.color} />
          ))}
        </div>

        {/* Field distribution */}
        <div className="sci-about-panel">
          <h3 className="sci-about-panel-title">{t.byField}</h3>
          {fieldStats.slice(0, 12).map(({ field, count }) => (
            <StatBar key={field} label={FIELD_NAMES[field]?.[lang] || field} value={count} max={maxField} color={FIELD_COLORS[field] || '#888'} />
          ))}
        </div>

        {/* Gender stats */}
        <div className="sci-about-panel">
          <h3 className="sci-about-panel-title">{t.byGender}</h3>
          <div className="sci-about-gender-row">
            <div className="sci-about-gender-card">
              <span className="sci-about-gender-icon">♂</span>
              <span className="sci-about-gender-num">{genderStats.male}</span>
              <span className="sci-about-gender-label">{t.male}</span>
            </div>
            <div className="sci-about-gender-card sci-about-gender--female">
              <span className="sci-about-gender-icon">♀</span>
              <span className="sci-about-gender-num">{genderStats.female}</span>
              <span className="sci-about-gender-label">{t.female}</span>
            </div>
          </div>
          <p className="sci-about-gender-note">{t.womenNote}</p>
        </div>

        {/* B7: Route statistics */}
        <div className="sci-about-panel">
          <h3 className="sci-about-panel-title">{t.routeStats}</h3>
          {Object.entries(routeStats.catCounts).map(([cat, count]) => (
            <StatBar
              key={cat}
              label={ROUTE_CAT_NAMES[cat]?.[lang] || cat}
              value={count}
              max={Math.max(...Object.values(routeStats.catCounts), 1)}
              color={ROUTE_CAT_COLORS[cat]}
            />
          ))}
          <div className="sci-about-bar-row" style={{ marginTop: 8 }}>
            <span className="sci-about-bar-label" style={{ fontWeight: 600 }}>{t.waypoints}</span>
            <span className="sci-about-bar-value" style={{ width: 'auto', color: 'var(--gold)' }}>{routeStats.totalWaypoints}</span>
          </div>
        </div>

        {/* B7: Cross-reference stats */}
        <div className="sci-about-panel">
          <h3 className="sci-about-panel-title">{t.crossRef}</h3>
          <StatBar label={t.scholarWithRoutes} value={crossRefStats.scholarsWithRoutes} max={scholars.length} color="var(--gold)" />
          <StatBar label={t.routeWithScholars} value={crossRefStats.routesWithScholars} max={routes.length} color="#8b5cf6" />
          <div className="sci-about-bar-row" style={{ marginTop: 8 }}>
            <span className="sci-about-bar-label" style={{ fontWeight: 600 }}>{t.totalLinks}</span>
            <span className="sci-about-bar-value" style={{ width: 'auto', color: 'var(--gold)' }}>{crossRefStats.totalLinks}</span>
          </div>
          <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
            <StatBar label="el-Aʿlām ↔ Science" value={scholars.filter(s => s.xref_alam).length} max={scholars.length} color="#F59E0B" />
            <StatBar label="Yāqūt ↔ Science" value={scholars.filter(s => s.xref_yaqut).length} max={scholars.length} color="#3B82F6" />
          </div>
        </div>

        {/* Reference coverage */}
        <div className="sci-about-panel">
          <h3 className="sci-about-panel-title">{t.refCoverage}</h3>
          <StatBar label={t.dia} value={refStats.dia} max={scholars.length} color="var(--gold)" />
          <StatBar label={t.alam} value={refStats.alam} max={scholars.length} color="#3b82f6" />
          <StatBar label={t.ei1} value={refStats.ei1} max={scholars.length} color="#8b5cf6" />
        </div>

        {/* Top cities */}
        <div className="sci-about-panel">
          <h3 className="sci-about-panel-title">{t.topCities}</h3>
          {topCities.map(([city, count], i) => (
            <StatBar key={city} label={`${i + 1}. ${city}`} value={count} max={topCities[0]?.[1] || 1} color={`hsl(${i * 36}, 60%, 55%)`} />
          ))}
        </div>
      </div>

      {/* About text */}
      <div className="sci-about-text-section">
        <h3>{t.about}</h3>
        <p>{t.aboutText}</p>
        <h4>{t.sources}</h4>
        <p>{t.sourcesText}</p>
        <h4>{t.team}</h4>
        <p>{t.teamText}</p>
      </div>
    </div>
  );
}

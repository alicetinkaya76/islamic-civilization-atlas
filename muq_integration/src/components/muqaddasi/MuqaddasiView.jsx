import { useState, useMemo, useCallback, useEffect, Component } from 'react';
import useAsyncData from '../../hooks/useAsyncData.jsx';
import SkeletonLoader from '../shared/SkeletonLoader';
import MuqaddasiSidebar from './MuqaddasiSidebar';
import MuqaddasiMap from './MuqaddasiMap';
import MuqaddasiIdCard from './MuqaddasiIdCard';
import { normalize, MUQ_T, IQLIM_COLORS } from './constants';
import '../../styles/muqaddasi.css';

/* ═══ Error Boundary ═══ */
class MuqaddasiErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('MuqaddasiView error:', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: 'center', color: '#c4b89a' }}>
          <h3>⚠️ Bir hata oluştu</h3>
          <p style={{ color: '#ef5350', fontSize: 12, fontFamily: 'monospace' }}>{String(this.state.error)}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}
            style={{ marginTop: 16, padding: '8px 16px', background: '#2a6e5a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
            Tekrar Dene / Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ═══ Certainty group mapping ═══ */
const CERT_GROUP = {
  certain: 'certain', exact: 'certain', modern_known: 'certain',
  approximate: 'approximate', country: 'approximate', region: 'approximate', inferred: 'approximate',
  uncertain: 'uncertain',
  estimated: 'estimated',
};

/* ═══ Main component ═══ */
function MuqaddasiViewInner({ lang, initialSearch }) {
  const tr = MUQ_T[lang] || MUQ_T.tr;
  const { data: rawData, loading, error } = useAsyncData('/data/muqaddasi_atlas_layer.json');

  const places = useMemo(() => rawData?.places || [], [rawData]);
  const routes = useMemo(() => rawData?.routes || [], [rawData]);
  const aqualim = useMemo(() => rawData?.aqualim || [], [rawData]);

  const placeMap = useMemo(() => {
    const m = {};
    places.forEach(p => { m[p.id] = p; });
    return m;
  }, [places]);

  /* Iqlim list sorted by route count */
  const iqlimList = useMemo(() => {
    const counts = {};
    routes.forEach(r => {
      if (r.iqlim_ar) counts[r.iqlim_ar] = (counts[r.iqlim_ar] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([k]) => k);
  }, [routes]);

  /* ── State ── */
  const [search, setSearch] = useState(initialSearch || '');
  const [selectedIqlim, setSelectedIqlim] = useState('');
  const [selectedCert, setSelectedCert] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [showRoutes, setShowRoutes] = useState(true);
  const [showMobile, setShowMobile] = useState('list');

  useEffect(() => {
    if (initialSearch) setSearch(initialSearch);
  }, [initialSearch]);

  /* ── Filter ── */
  const filtered = useMemo(() => {
    let arr = places;
    if (selectedIqlim) arr = arr.filter(p => p.iqlim_ar === selectedIqlim);
    if (selectedCert) arr = arr.filter(p => CERT_GROUP[p.certainty] === selectedCert);
    if (search && search.length >= 2) {
      const q = normalize(search);
      arr = arr.filter(p =>
        normalize(p.name_ar).includes(q) ||
        normalize(p.desc_tr).includes(q) ||
        normalize(p.iqlim_ar).includes(q)
      );
    }
    return arr;
  }, [places, search, selectedIqlim, selectedCert]);

  /* ── Connected routes for selected place ── */
  const connectedRoutes = useMemo(() => {
    if (!selectedId) return [];
    return routes.filter(r => r.from_id === selectedId || r.to_id === selectedId);
  }, [routes, selectedId]);

  const handleSelect = useCallback((id) => {
    setSelectedId(id);
    if (window.innerWidth <= 900) setShowMobile('card');
  }, []);

  const handleClose = useCallback(() => {
    setSelectedId(null);
    if (window.innerWidth <= 900) setShowMobile('list');
  }, []);

  if (loading || !rawData) return <SkeletonLoader variant="list" rows={10} message={tr.loading} />;
  if (error) return (
    <div className="skeleton-loader" style={{ textAlign: 'center', padding: 40 }}>
      <p style={{ color: '#ef5350', fontSize: 13 }}>{String(error.message || error)}</p>
      <button onClick={() => window.location.reload()}
        style={{ marginTop: 12, padding: '8px 20px', background: '#2a6e5a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
        Tekrar dene / Retry
      </button>
    </div>
  );

  return (
    <div className="muq-view">
      {/* ── Header ── */}
      <div className="muq-header">
        <div className="muq-header-info">
          <h2 className="muq-title">{tr.title}</h2>
          <span className="muq-subtitle">{tr.sub}</span>
        </div>
        <div className="muq-header-stats">
          <span className="muq-stat">{places.length} {tr.totalPlaces}</span>
          <span className="muq-stat">{routes.length} {tr.routes}</span>
          <span className="muq-stat">{iqlimList.length} {tr.aqualim}</span>
        </div>
      </div>

      {/* ── Mobile tabs ── */}
      <div className="muq-mobile-tabs">
        <button className={showMobile === 'list' ? 'active' : ''} onClick={() => setShowMobile('list')}>
          {tr.listView}
        </button>
        <button className={showMobile === 'map' ? 'active' : ''} onClick={() => setShowMobile('map')}>
          {tr.mapView}
        </button>
        {selectedId && (
          <button className={showMobile === 'card' ? 'active' : ''} onClick={() => setShowMobile('card')}>
            Detay
          </button>
        )}
      </div>

      {/* ── Body ── */}
      <div className="muq-body">
        <div className={`muq-sidebar-wrap${showMobile === 'list' ? ' mobile-show' : ''}`}>
          <MuqaddasiSidebar
            places={places}
            filtered={filtered}
            selectedId={selectedId}
            onSelect={handleSelect}
            search={search}
            onSearch={setSearch}
            selectedIqlim={selectedIqlim}
            onIqlim={setSelectedIqlim}
            selectedCert={selectedCert}
            onCert={setSelectedCert}
            showRoutes={showRoutes}
            onToggleRoutes={() => setShowRoutes(v => !v)}
            iqlimList={iqlimList}
            tr={tr}
            lang={lang}
          />
        </div>

        <div className={`muq-map-wrap${showMobile === 'map' ? ' mobile-show' : ''}`}>
          <MuqaddasiMap
            places={places}
            routes={routes}
            filtered={filtered}
            selectedId={selectedId}
            onSelect={handleSelect}
            showRoutes={showRoutes}
            lang={lang}
          />
        </div>

        <div className={`muq-card-wrap${showMobile === 'card' ? ' mobile-show' : ''}`}>
          <MuqaddasiIdCard
            place={selectedId ? placeMap[selectedId] : null}
            connectedRoutes={connectedRoutes}
            onClose={handleClose}
            tr={tr}
            lang={lang}
          />
        </div>
      </div>
    </div>
  );
}

export default function MuqaddasiView({ lang, t, initialSearch }) {
  return (
    <MuqaddasiErrorBoundary>
      <MuqaddasiViewInner lang={lang || 'tr'} initialSearch={initialSearch} />
    </MuqaddasiErrorBoundary>
  );
}

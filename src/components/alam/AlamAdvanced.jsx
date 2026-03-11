import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import XREFS from '../../data/alam_xrefs.json';

/* ═══════════════════════════════════════════════════
   İlişki Türü Renk ve Etiket Haritaları
   ═══════════════════════════════════════════════════ */
const REL_COLOR = {
  student_of:    '#4fc3f7',   // mavi — hoca-talebe
  influenced_by: '#81c784',   // yeşil — entelektüel etki
  criticism:     '#ef5350',   // kırmızı — eleştiri/reddiye
  commentary:    '#ffb74d',   // turuncu — şerh/yorum
  peer:          '#ce93d8',   // mor — akran/muasır
  family:        '#f06292',   // pembe — aile
  biographer:    '#4db6ac',   // teal — biyografi
  patron:        '#a5d6a7',   // açık yeşil — himaye
  related:       '#546e7a',   // gri-mavi — genel (alam crossref)
};

const REL_LABEL_TR = {
  student_of:    'Hoca-Talebe',
  influenced_by: 'Etki',
  criticism:     'Eleştiri',
  commentary:    'Şerh',
  peer:          'Akran',
  family:        'Aile',
  biographer:    'Biyografi',
  patron:        'Himaye',
  related:       'Çapraz Ref',
};

const REL_LABEL_EN = {
  student_of:    'Teacher-Student',
  influenced_by: 'Influence',
  criticism:     'Criticism',
  commentary:    'Commentary',
  peer:          'Peer',
  family:        'Family',
  biographer:    'Biographer',
  patron:        'Patron',
  related:       'Cross-Ref',
};

const SRC_ICON = { wikidata: 'W', dia: 'D', alam: 'A' };

/* ═══════════════════════════════════════════════════
   1) CROSS-REFERENCE NETWORK — D3 Force Graph
   ═══════════════════════════════════════════════════ */
export function CrossRefNetwork({ data, lang, onSelectPerson }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [filterRel, setFilterRel] = useState('all');
  const isTr = lang === 'tr';

  /* Normalize XREFS: yeni format {s,t,r,src,c} veya eski [[s,t]] */
  const normalizedXrefs = useMemo(() => {
    if (!XREFS.length) return [];
    const first = XREFS[0];
    if (Array.isArray(first)) {
      // Eski format: [[s,t], ...]
      return XREFS.map(([s, t]) => ({ s, t, r: 'related', src: ['alam'], c: 2 }));
    }
    return XREFS; // Yeni format
  }, []);

  /* İlişki türleri (filtre için) */
  const relTypes = useMemo(() => {
    const types = new Set(normalizedXrefs.map(e => e.r || 'related'));
    return ['all', ...Array.from(types)];
  }, [normalizedXrefs]);

  /* Build graph data */
  const graph = useMemo(() => {
    const byId = {};
    data.forEach(b => { byId[b.id] = b; });

    const filtered = filterRel === 'all'
      ? normalizedXrefs
      : normalizedXrefs.filter(e => (e.r || 'related') === filterRel);

    const nodeIds = new Set();
    const validEdges = [];
    filtered.forEach(edge => {
      const s = edge.s, t = edge.t;
      if (byId[s] && byId[t]) {
        nodeIds.add(s);
        nodeIds.add(t);
        validEdges.push({
          source: s,
          target: t,
          rel: edge.r || 'related',
          sources: edge.src || ['alam'],
          confidence: edge.c || 2,
        });
      }
    });

    // Degree hesapla
    const degree = {};
    validEdges.forEach(e => {
      degree[e.source] = (degree[e.source] || 0) + 1;
      degree[e.target] = (degree[e.target] || 0) + 1;
    });

    const nodes = Array.from(nodeIds).map(id => {
      const b = byId[id];
      return {
        id,
        name: isTr ? b.ht : b.he,
        arabic: b.h,
        century: b.c,
        profession: isTr ? b.pt : b.pe,
        degree: degree[id] || 0,
        death: b.md,
        madhab: b.mz,
        diaSlug: b.ds,
      };
    });

    return { nodes, edges: validEdges };
  }, [data, isTr, normalizedXrefs, filterRel]);

  /* İstatistikler */
  const stats = useMemo(() => {
    const bySrc = { alam: 0, wikidata: 0, dia: 0 };
    normalizedXrefs.forEach(e => {
      (e.src || ['alam']).forEach(s => { if (bySrc[s] !== undefined) bySrc[s]++; });
    });
    return bySrc;
  }, [normalizedXrefs]);

  /* D3 force simulation */
  useEffect(() => {
    if (!svgRef.current || !graph.nodes.length) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const container = containerRef.current;
    const w = container?.clientWidth || 700;
    const h = 520;
    svg.attr('width', w).attr('height', h);

    const g = svg.append('g');

    // Zoom
    svg.call(d3.zoom().scaleExtent([0.2, 6]).on('zoom', (e) => {
      g.attr('transform', e.transform);
    }));

    const CENTURY_COLOR = c => {
      if (!c) return '#666';
      if (c <= 8)  return '#aed581';
      if (c <= 10) return '#4fc3f7';
      if (c <= 12) return '#ce93d8';
      if (c <= 14) return '#ff8a65';
      if (c <= 16) return '#ffd54f';
      if (c <= 18) return '#4dd0e1';
      return '#90a4ae';
    };

    const sim = d3.forceSimulation(graph.nodes)
      .force('link', d3.forceLink(graph.edges).id(d => d.id).distance(55).strength(0.25))
      .force('charge', d3.forceManyBody().strength(-70))
      .force('center', d3.forceCenter(w / 2, h / 2))
      .force('collision', d3.forceCollide().radius(d => Math.max(4, d.degree * 1.5) + 4));

    // Kenarlar: renk = ilişki türü, kalınlık = kaynak sayısı × güven
    const link = g.selectAll('line')
      .data(graph.edges)
      .join('line')
      .attr('stroke', d => REL_COLOR[d.rel] || REL_COLOR.related)
      .attr('stroke-width', d => Math.min(3, 0.5 + (d.sources.length * 0.5) + (d.confidence > 3 ? 0.5 : 0)))
      .attr('stroke-opacity', d => d.sources.length > 1 ? 0.9 : 0.5);

    // Düğümler
    const node = g.selectAll('circle')
      .data(graph.nodes)
      .join('circle')
      .attr('r', d => Math.max(3, Math.min(14, d.degree * 2)))
      .attr('fill', d => CENTURY_COLOR(d.century))
      .attr('stroke', '#080c18')
      .attr('stroke-width', 0.5)
      .attr('cursor', 'pointer')
      .on('click', (e, d) => {
        setSelectedNode(d);
        if (onSelectPerson) onSelectPerson(d.id);
      })
      .call(d3.drag()
        .on('start', (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on('end', (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; })
      );

    node.append('title').text(d =>
      `${d.name} (${d.arabic})\n${isTr ? 'Vefat' : 'Death'}: ${d.death || '?'}\n${d.degree} ${isTr ? 'bağlantı' : 'connections'}`
    );

    sim.on('tick', () => {
      link.attr('x1', d => d.source.x).attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
      node.attr('cx', d => d.x).attr('cy', d => d.y);
    });

    return () => sim.stop();
  }, [graph, isTr, onSelectPerson]);

  const relLabels = isTr ? REL_LABEL_TR : REL_LABEL_EN;

  return (
    <div className="alam-adv-panel" ref={containerRef}>
      <div className="alam-adv-header">
        <h3>🕸 {isTr ? 'Entelektüel İlişki Ağı' : 'Intellectual Relationship Network'}</h3>
        <span className="alam-adv-stat">
          {graph.nodes.length} {isTr ? 'düğüm' : 'nodes'} · {graph.edges.length} {isTr ? 'bağlantı' : 'links'}
        </span>
      </div>

      {/* Kaynak istatistikleri */}
      <div style={{ display: 'flex', gap: 8, margin: '6px 0', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: '#90a4ae' }}>
          📚 el-A'lâm: {stats.alam} &nbsp;|&nbsp;
          🌐 Wikidata: {stats.wikidata} &nbsp;|&nbsp;
          📖 DİA: {stats.dia}
        </span>
      </div>

      {/* İlişki türü filtresi */}
      <div style={{ display: 'flex', gap: 6, margin: '8px 0', flexWrap: 'wrap' }}>
        {relTypes.map(r => (
          <button key={r}
            onClick={() => setFilterRel(r)}
            style={{
              padding: '2px 10px', borderRadius: 12, fontSize: 11, cursor: 'pointer',
              background: filterRel === r ? (REL_COLOR[r] || '#4fc3f7') : '#1e2a44',
              color: filterRel === r ? '#080c18' : '#c4b89a',
              border: `1px solid ${REL_COLOR[r] || '#4fc3f7'}`,
              fontWeight: filterRel === r ? 700 : 400,
            }}>
            {r === 'all' ? (isTr ? 'Tümü' : 'All') : (relLabels[r] || r)}
          </button>
        ))}
      </div>

      <p className="alam-adv-desc" style={{ marginBottom: 4 }}>
        {isTr
          ? "Hoca-talebe (mavi), etki (yeşil), eleştiri (kırmızı) ilişkileri gösterir. Kenar kalınlığı = çoklu kaynak doğrulaması. Sürükle, yakınlaştır, tıkla."
          : "Shows teacher-student (blue), influence (green), criticism (red) relationships. Edge thickness = multi-source verification. Drag, zoom, click."}
      </p>

      {/* Renk açıklaması */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
        {Object.entries(REL_COLOR).filter(([k]) => k !== 'related').map(([k, v]) => (
          <span key={k} style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ width: 10, height: 10, background: v, borderRadius: 2, display: 'inline-block' }} />
            <span style={{ color: '#90a4ae' }}>{relLabels[k] || k}</span>
          </span>
        ))}
      </div>

      <svg ref={svgRef} style={{ width: '100%', height: 520, background: '#080c18', borderRadius: 8 }} />

      {selectedNode && (
        <div className="alam-adv-tooltip">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <strong>{selectedNode.name}</strong>
              <span dir="rtl" style={{ marginLeft: 8, color: '#c4b89a' }}>{selectedNode.arabic}</span>
            </div>
            <button onClick={() => setSelectedNode(null)}
              style={{ background: 'none', border: 'none', color: '#90a4ae', cursor: 'pointer', fontSize: 14 }}>✕</button>
          </div>
          <div style={{ fontSize: 12, color: '#90a4ae', marginTop: 4 }}>
            {isTr ? 'Vefat' : 'Death'}: {selectedNode.death || '?'}
            {selectedNode.madhab && <> · {selectedNode.madhab}</>}
          </div>
          {selectedNode.profession && (
            <div style={{ fontSize: 11, color: '#c4b89a', marginTop: 2 }}>{selectedNode.profession}</div>
          )}
          <div style={{ marginTop: 6, fontWeight: 600, color: '#4fc3f7' }}>
            {selectedNode.degree} {isTr ? 'bağlantı' : 'connections'}
          </div>
          {selectedNode.diaSlug && (
            <a href={`https://islamansiklopedisi.org.tr/${selectedNode.diaSlug}`}
              target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 11, color: '#ffb74d', display: 'block', marginTop: 4 }}>
              📖 DİA →
            </a>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   2) TIME MACHINE — Animated Year Slider
   ═══════════════════════════════════════════════════ */
export function TimeMachine({ data, lang }) {
  const [year, setYear] = useState(850);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef(null);
  const isTr = lang === 'tr';

  const alive = useMemo(() => {
    return data.filter(b => {
      const birth = b.mb || (b.hb ? Math.round(b.hb * 0.97 + 622) : null);
      const death = b.md || (b.hd ? Math.round(b.hd * 0.97 + 622) : null);
      if (!birth && !death) return false;
      const bY = birth || (death ? death - 70 : null);
      const dY = death || (birth ? birth + 70 : null);
      return bY && dY && bY <= year && dY >= year;
    });
  }, [data, year]);

  const aliveGeocoded = useMemo(() => alive.filter(b => b.lat != null), [alive]);

  /* Top cities of living scholars */
  const topCities = useMemo(() => {
    const counts = {};
    aliveGeocoded.forEach(b => { if (b.rg) counts[b.rg] = (counts[b.rg] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [aliveGeocoded]);

  /* Top professions alive */
  const topProfs = useMemo(() => {
    const counts = {};
    alive.forEach(b => {
      if (b.pt) b.pt.split(', ').forEach(p => { counts[p] = (counts[p] || 0) + 1; });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [alive]);

  /* Play/pause */
  useEffect(() => {
    if (!playing) { if (intervalRef.current) clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      setYear(y => {
        if (y >= 1950) { setPlaying(false); return 1950; }
        return y + 10;
      });
    }, 300);
    return () => clearInterval(intervalRef.current);
  }, [playing]);

  const maxAlive = Math.max(1, ...topCities.map(c => c[1]));

  return (
    <div className="alam-adv-panel">
      <div className="alam-adv-header">
        <h3>⏳ {isTr ? 'Zaman Makinesi' : 'Time Machine'}</h3>
        <span className="alam-adv-stat">{alive.length} {isTr ? 'kişi hayatta' : 'alive'}</span>
      </div>
      <p className="alam-adv-desc">
        {isTr
          ? `${year} yılında hayatta olan tüm kişileri gösterir. Slider'ı hareket ettir veya ▶ ile otomatik ilerlet.`
          : `Shows all persons alive in ${year} CE. Move the slider or press ▶ to animate.`}
      </p>

      <div className="alam-tm-controls">
        <button className={`battle-play-btn${playing ? ' playing' : ''}`}
          onClick={() => { if (!playing && year >= 1940) setYear(632); setPlaying(p => !p); }}>
          {playing ? '⏸' : '▶'}
        </button>
        <input type="range" min={632} max={1950} step={5} value={year}
          onChange={e => { setPlaying(false); setYear(+e.target.value); }}
          className="alam-tm-slider" />
        <span className="alam-tm-year">{year} {isTr ? 'M' : 'CE'}</span>
      </div>

      <div className="alam-tm-big-num">
        <span className="alam-tm-count">{alive.length}</span>
        <span className="alam-tm-label">{isTr ? 'kişi hayatta' : 'persons alive'}</span>
        <span className="alam-tm-sub">{aliveGeocoded.length} {isTr ? 'konumlu' : 'geocoded'}</span>
      </div>

      {/* Top regions alive */}
      <div className="alam-tm-section">
        <h4>{isTr ? 'En Yoğun Bölgeler' : 'Top Regions'}</h4>
        {topCities.map(([name, count]) => (
          <div key={name} className="alam-sp-bar-row">
            <span className="alam-sp-bar-label">{name}</span>
            <div className="alam-sp-bar-track">
              <div className="alam-sp-bar-fill alam-sp-bar-teal" style={{ width: `${(count / maxAlive) * 100}%` }} />
            </div>
            <span className="alam-sp-bar-val">{count}</span>
          </div>
        ))}
      </div>

      {/* Top professions alive */}
      <div className="alam-tm-section">
        <h4>{isTr ? 'Baskın Meslekler' : 'Top Professions'}</h4>
        {topProfs.map(([name, count]) => (
          <div key={name} className="alam-sp-bar-row">
            <span className="alam-sp-bar-label">{name}</span>
            <div className="alam-sp-bar-track">
              <div className="alam-sp-bar-fill" style={{ width: `${(count / (topProfs[0]?.[1] || 1)) * 100}%` }} />
            </div>
            <span className="alam-sp-bar-val">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   3) WORK-PROFESSION SCATTER / BUBBLE
   ═══════════════════════════════════════════════════ */
export function WorkProfessionScatter({ data, lang }) {
  const svgRef = useRef(null);
  const isTr = lang === 'tr';

  const bubbles = useMemo(() => {
    const profStats = {};
    data.forEach(b => {
      if (!b.pt) return;
      const prof = b.pt.split(', ')[0];
      if (!profStats[prof]) profStats[prof] = { count: 0, totalWorks: 0, withWorks: 0 };
      profStats[prof].count++;
      if (b.wc) { profStats[prof].totalWorks += b.wc; profStats[prof].withWorks++; }
    });
    return Object.entries(profStats)
      .filter(([, v]) => v.count >= 20)
      .map(([name, v]) => ({
        name,
        count: v.count,
        avgWorks: v.withWorks > 0 ? +(v.totalWorks / v.withWorks).toFixed(1) : 0,
        workRatio: +(v.withWorks / v.count * 100).toFixed(0),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }, [data]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    const w = svgRef.current.clientWidth || 600;
    const h = 400;
    svg.attr('width', w).attr('height', h);
    if (!bubbles.length) return;

    const M = { top: 40, right: 30, bottom: 50, left: 60 };
    const x = d3.scaleLinear()
      .domain([0, d3.max(bubbles, d => d.count) * 1.1])
      .range([M.left, w - M.right]);
    const y = d3.scaleLinear()
      .domain([0, d3.max(bubbles, d => d.avgWorks) * 1.2])
      .range([h - M.bottom, M.top]);
    const r = d3.scaleSqrt()
      .domain([0, d3.max(bubbles, d => d.workRatio)])
      .range([5, 25]);

    const color = d3.scaleOrdinal(d3.schemeSet2);

    const g = svg.append('g');

    g.selectAll('circle')
      .data(bubbles)
      .join('circle')
      .attr('cx', d => x(d.count))
      .attr('cy', d => y(d.avgWorks))
      .attr('r', d => r(d.workRatio))
      .attr('fill', (d, i) => color(i))
      .attr('opacity', 0.7)
      .attr('stroke', '#080c18')
      .attr('stroke-width', 1)
      .append('title')
      .text(d => `${d.name}: ${d.count} ${isTr ? 'kişi' : 'persons'}, ${d.avgWorks} ${isTr ? 'ort. eser' : 'avg works'}, %${d.workRatio} ${isTr ? 'eserli' : 'with works'}`);

    g.selectAll('text')
      .data(bubbles.filter(d => d.count > 100 || d.avgWorks > 4))
      .join('text')
      .attr('x', d => x(d.count))
      .attr('y', d => y(d.avgWorks) - r(d.workRatio) - 4)
      .attr('text-anchor', 'middle')
      .attr('fill', '#c4b89a')
      .attr('font-size', 9)
      .text(d => d.name);

    // Axes
    svg.append('g').attr('transform', `translate(0,${h - M.bottom})`)
      .call(d3.axisBottom(x).ticks(6)).attr('color', '#c4b89a');
    svg.append('g').attr('transform', `translate(${M.left},0)`)
      .call(d3.axisLeft(y).ticks(6)).attr('color', '#c4b89a');

    // Axis labels
    svg.append('text').attr('x', w / 2).attr('y', h - 8)
      .attr('text-anchor', 'middle').attr('fill', '#c4b89a').attr('font-size', 11)
      .text(isTr ? 'Kişi Sayısı' : 'Person Count');
    svg.append('text').attr('x', -h / 2).attr('y', 14)
      .attr('transform', 'rotate(-90)').attr('text-anchor', 'middle')
      .attr('fill', '#c4b89a').attr('font-size', 11)
      .text(isTr ? 'Ort. Eser Sayısı' : 'Avg. Work Count');

  }, [bubbles, isTr]);

  return (
    <div className="alam-adv-panel">
      <div className="alam-adv-header">
        <h3>🔬 {isTr ? 'Eser-Meslek Korelasyonu' : 'Work-Profession Correlation'}</h3>
      </div>
      <p className="alam-adv-desc">
        {isTr
          ? 'Her balon bir meslek grubunu temsil eder. X ekseni = kişi sayısı, Y ekseni = ortalama eser sayısı, balon büyüklüğü = eser sahibi oranı. Kalabalık meslekler ile üretken meslekler arasındaki farkı gösterir.'
          : 'Each bubble represents a profession. X = person count, Y = avg works, bubble size = % with works. Shows the difference between populous and productive professions.'}
      </p>
      <svg ref={svgRef} style={{ width: '100%', height: 400 }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   4) CENTURY COMPARISON — Split Screen
   ═══════════════════════════════════════════════════ */
export function CenturyComparison({ data, lang }) {
  const [centuryA, setCenturyA] = useState(10);
  const [centuryB, setCenturyB] = useState(15);
  const isTr = lang === 'tr';
  const CENTURIES = Array.from({ length: 15 }, (_, i) => i + 6);

  const getProfile = useCallback((c) => {
    const subset = data.filter(b => b.c === c);
    const total = subset.length;
    const geocoded = subset.filter(b => b.lat != null).length;
    const female = subset.filter(b => b.g === 'F').length;
    const works = subset.reduce((s, b) => s + (b.wc || 0), 0);
    const withDia = subset.filter(b => b.ds).length;

    // Top professions
    const profCounts = {};
    subset.forEach(b => { if (b.pt) b.pt.split(', ').forEach(p => { profCounts[p] = (profCounts[p] || 0) + 1; }); });
    const topProfs = Object.entries(profCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

    // Top regions
    const regCounts = {};
    subset.forEach(b => { if (b.rg) regCounts[b.rg] = (regCounts[b.rg] || 0) + 1; });
    const topRegions = Object.entries(regCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

    // Madhab
    const madhCounts = {};
    subset.forEach(b => { if (b.mz) madhCounts[b.mz] = (madhCounts[b.mz] || 0) + 1; });
    const topMadh = Object.entries(madhCounts).sort((a, b) => b[1] - a[1]).slice(0, 4);

    return { total, geocoded, female, works, withDia, topProfs, topRegions, topMadh };
  }, [data]);

  const profileA = useMemo(() => getProfile(centuryA), [centuryA, getProfile]);
  const profileB = useMemo(() => getProfile(centuryB), [centuryB, getProfile]);

  const CompareCol = ({ century, profile, color }) => (
    <div className="alam-cmp-col" style={{ borderColor: color }}>
      <select className="alam-cmp-select" value={century}
        onChange={e => century === centuryA ? setCenturyA(+e.target.value) : setCenturyB(+e.target.value)}
        style={{ borderColor: color, color }}>
        {CENTURIES.map(c => <option key={c} value={c}>{c}. {isTr ? 'yüzyıl' : 'century'}</option>)}
      </select>
      <div className="alam-cmp-big"><strong>{profile.total}</strong> {isTr ? 'biyografi' : 'biographies'}</div>
      <div className="alam-cmp-stats">
        <span>{profile.works} {isTr ? 'eser' : 'works'}</span>
        <span>{profile.female} {isTr ? 'kadın' : 'female'}</span>
        <span>{profile.withDia} DİA</span>
      </div>
      <h5>{isTr ? 'Meslekler' : 'Professions'}</h5>
      {profile.topProfs.map(([n, c]) => (
        <div key={n} className="alam-cmp-item"><span>{n}</span><strong>{c}</strong></div>
      ))}
      <h5>{isTr ? 'Bölgeler' : 'Regions'}</h5>
      {profile.topRegions.map(([n, c]) => (
        <div key={n} className="alam-cmp-item"><span>{n}</span><strong>{c}</strong></div>
      ))}
      <h5>{isTr ? 'Mezhepler' : 'Schools'}</h5>
      {profile.topMadh.map(([n, c]) => (
        <div key={n} className="alam-cmp-item"><span>{n}</span><strong>{c}</strong></div>
      ))}
    </div>
  );

  return (
    <div className="alam-adv-panel">
      <div className="alam-adv-header">
        <h3>⚖ {isTr ? 'Yüzyıl Karşılaştırması' : 'Century Comparison'}</h3>
      </div>
      <p className="alam-adv-desc">
        {isTr
          ? 'İki yüzyılı yan yana karşılaştır. Meslek, bölge ve mezhep dağılımındaki değişimi gör.'
          : 'Compare two centuries side by side. See shifts in profession, region and school distribution.'}
      </p>
      <div className="alam-cmp-grid">
        <CompareCol century={centuryA} profile={profileA} color="#4fc3f7" />
        <div className="alam-cmp-vs">VS</div>
        <CompareCol century={centuryB} profile={profileB} color="#ff8a65" />
      </div>
    </div>
  );
}

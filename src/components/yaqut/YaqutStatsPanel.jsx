import { useMemo, useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';

/* ═══ Mini donut chart ═══ */
function MiniDonut({ data, colors, size = 100 }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || !data.length) return;
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();
    const r = size / 2;
    const g = svg.attr('width', size).attr('height', size)
      .append('g').attr('transform', `translate(${r},${r})`);
    const pie = d3.pie().value(d => d.value).sort(null);
    const arc = d3.arc().innerRadius(r * 0.55).outerRadius(r - 2);
    g.selectAll('path').data(pie(data)).join('path')
      .attr('d', arc)
      .attr('fill', (d, i) => colors[i % colors.length])
      .attr('stroke', '#080c18')
      .attr('stroke-width', 1.5);
  }, [data, colors, size]);
  return <svg ref={ref} />;
}

/* ═══ Sparkline ═══ */
function Sparkline({ values, color = '#1a6b5a', width = 160, height = 36 }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || !values.length) return;
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);
    const x = d3.scaleLinear().domain([0, values.length - 1]).range([2, width - 2]);
    const y = d3.scaleLinear().domain([0, d3.max(values)]).range([height - 2, 2]);
    const line = d3.line().x((_, i) => x(i)).y(d => y(d)).curve(d3.curveMonotoneX);
    const area = d3.area().x((_, i) => x(i)).y0(height).y1(d => y(d)).curve(d3.curveMonotoneX);
    svg.append('path').datum(values).attr('d', area).attr('fill', color + '15');
    svg.append('path').datum(values).attr('d', line)
      .attr('fill', 'none').attr('stroke', color).attr('stroke-width', 1.5);
  }, [values, color, width, height]);
  return <svg ref={ref} />;
}

/* ═══ Animated counter ═══ */
function AnimNum({ target }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let start = null;
    const ease = t => 1 - Math.pow(1 - t, 3);
    function frame(ts) {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 1200, 1);
      el.textContent = Math.round(ease(p) * target).toLocaleString();
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }, [target]);
  return <span ref={ref}>0</span>;
}

export default function YaqutStatsPanel({ lang, ty, data }) {

  /* ── Core stats ── */
  const stats = useMemo(() => {
    const total = data.length;
    const geocoded = data.filter(e => e.lat != null).length;
    const withDia = data.filter(e => e.ds).length;
    const withPersons = data.filter(e => (e.np || 0) > 0 || (e.pc || 0) > 0).length;
    const withEvents = data.filter(e => (e.ec || 0) > 0).length;
    const withPoetry = data.filter(e => (e.py || 0) > 0).length;
    const totalXrefPersons = data.reduce((s, e) => s + (e.pc || 0), 0);

    return { total, geocoded, withDia, withPersons, withEvents, withPoetry, totalXrefPersons };
  }, [data]);

  /* ── Geo type donut ── */
  const geoDonutData = useMemo(() => {
    const counts = {};
    data.forEach(e => { if (e.gt) counts[e.gt] = (counts[e.gt] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
      .slice(0, 7)
      .map(([label, value]) => ({ label, value }));
  }, [data]);
  const geoColors = ['#d4a84b', '#66bb6a', '#a1887f', '#4fc3f7', '#ef5350', '#ce93d8', '#ff8a65'];

  /* ── Period donut ── */
  const periodData = useMemo(() => {
    const counts = {};
    data.forEach(e => { if (e.hp) counts[e.hp] = (counts[e.hp] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({ label, value }));
  }, [data]);

  /* ── Top 5 countries ── */
  const topCountries = useMemo(() => {
    const counts = {};
    data.forEach(e => { if (e.ct) counts[e.ct] = (counts[e.ct] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [data]);

  /* ── Top 5 geo types ── */
  const topGeoTypes = useMemo(() => {
    const counts = {};
    data.forEach(e => { if (e.gt) counts[e.gt] = (counts[e.gt] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [data]);

  /* ── Letter sparkline ── */
  const letterSpark = useMemo(() => {
    const ARABIC_LETTERS = 'أبتثجحخدذرزسشصضطظعغفقكلمنوهي'.split('');
    const counts = {};
    data.forEach(e => { if (e.lt) counts[e.lt] = (counts[e.lt] || 0) + 1; });
    return ARABIC_LETTERS.map(l => counts[l] || 0);
  }, [data]);

  /* ── Rotating fact ── */
  const [fact, setFact] = useState('');
  const facts = useMemo(() => {
    const f = [];
    if (isTr) {
      f.push(`Toplam ${stats.total.toLocaleString()} coğrafi giriş`);
      f.push(`%${((stats.geocoded / stats.total) * 100).toFixed(1)}'i modern koordinatla eşleştirilmiş`);
      f.push(`${stats.withDia.toLocaleString()} DİA bağlantılı giriş (%${((stats.withDia / stats.total) * 100).toFixed(1)})`);
      f.push(`${stats.totalXrefPersons.toLocaleString()} Ziriklî kişi bağlantısı`);
      f.push(`${stats.withPoetry.toLocaleString()} giriş şiir içeriyor`);
    } else {
      f.push(`${stats.total.toLocaleString()} total geographic entries`);
      f.push(`${((stats.geocoded / stats.total) * 100).toFixed(1)}% matched with modern coordinates`);
      f.push(`${stats.withDia.toLocaleString()} DIA-linked entries (${((stats.withDia / stats.total) * 100).toFixed(1)}%)`);
      f.push(`${stats.totalXrefPersons.toLocaleString()} Zirikli person links`);
      f.push(`${stats.withPoetry.toLocaleString()} entries contain poetry`);
    }
    return f;
  }, [stats, isTr]);

  useEffect(() => {
    setFact(facts[0]);
    const iv = setInterval(() => {
      setFact(f => {
        const idx = facts.indexOf(f);
        return facts[(idx + 1) % facts.length];
      });
    }, 5000);
    return () => clearInterval(iv);
  }, [facts]);

  const maxGeo = topGeoTypes[0]?.[1] || 1;
  const maxCountry = topCountries[0]?.[1] || 1;

  return (
    <div className="yaqut-stats-panel">
      {/* Title */}
      <div className="yaqut-sp-header">
        <h3>{{ tr: 'Veri Profili', en: 'Data Profile', ar: '' }[lang]}</h3>
        <span className="yaqut-sp-badge">{{ tr: 'Canlı İstatistik', en: 'Live Stats', ar: '' }[lang]}</span>
      </div>

      {/* Key metrics */}
      <div className="yaqut-sp-metrics">
        <div className="yaqut-sp-metric">
          <span className="yaqut-sp-metric-num"><AnimNum target={stats.total} /></span>
          <span className="yaqut-sp-metric-label">{{ tr: 'Giriş', en: 'Entries', ar: '' }[lang]}</span>
        </div>
        <div className="yaqut-sp-metric">
          <span className="yaqut-sp-metric-num"><AnimNum target={stats.geocoded} /></span>
          <span className="yaqut-sp-metric-label">{{ tr: 'Konumlu', en: 'Geocoded', ar: '' }[lang]}</span>
        </div>
        <div className="yaqut-sp-metric">
          <span className="yaqut-sp-metric-num"><AnimNum target={stats.withDia} /></span>
          <span className="yaqut-sp-metric-label">{{ tr: 'DİA', en: 'DIA', ar: '' }[lang]}</span>
        </div>
        <div className="yaqut-sp-metric">
          <span className="yaqut-sp-metric-num"><AnimNum target={stats.totalXrefPersons} /></span>
          <span className="yaqut-sp-metric-label">{{ tr: 'Kişi Bağ.', en: 'Person Links', ar: '' }[lang]}</span>
        </div>
        <div className="yaqut-sp-metric">
          <span className="yaqut-sp-metric-num"><AnimNum target={stats.withEvents} /></span>
          <span className="yaqut-sp-metric-label">{{ tr: 'Olaylı', en: 'With Events', ar: '' }[lang]}</span>
        </div>
        <div className="yaqut-sp-metric">
          <span className="yaqut-sp-metric-num"><AnimNum target={stats.withPoetry} /></span>
          <span className="yaqut-sp-metric-label">{{ tr: 'Şiirli', en: 'With Poetry', ar: '' }[lang]}</span>
        </div>
      </div>

      {/* Letter sparkline */}
      <div className="yaqut-sp-section">
        <div className="yaqut-sp-section-head">
          <span>{{ tr: 'Harf Dağılımı', en: 'Letter Distribution', ar: '' }[lang]}</span>
          <span className="yaqut-sp-range">أ – ي</span>
        </div>
        <Sparkline values={letterSpark} color="#1a6b5a" width={240} height={44} />
      </div>

      {/* Geo type donut */}
      <div className="yaqut-sp-section">
        <div className="yaqut-sp-section-head">
          <span>{{ tr: 'Coğrafi Tip', en: 'Geo Types', ar: '' }[lang]}</span>
        </div>
        <div className="yaqut-sp-donut-row">
          <MiniDonut data={geoDonutData} colors={geoColors} size={90} />
          <div className="yaqut-sp-donut-legend">
            {geoDonutData.slice(0, 6).map((d, i) => (
              <div key={d.label} className="yaqut-sp-legend-row">
                <span className="yaqut-sp-legend-dot" style={{ background: geoColors[i] }} />
                <span className="yaqut-sp-legend-label">{d.label}</span>
                <span className="yaqut-sp-legend-val">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Period donut */}
      <div className="yaqut-sp-section">
        <div className="yaqut-sp-section-head">
          <span>{{ tr: 'Tarihî Dönem', en: 'Historical Period', ar: '' }[lang]}</span>
        </div>
        <div className="yaqut-sp-donut-row">
          <MiniDonut data={periodData} colors={['#66bb6a', '#ff8a65', '#ce93d8']} size={70} />
          <div className="yaqut-sp-donut-legend">
            {periodData.map((d, i) => (
              <div key={d.label} className="yaqut-sp-legend-row">
                <span className="yaqut-sp-legend-dot" style={{ background: ['#66bb6a', '#ff8a65', '#ce93d8'][i] }} />
                <span className="yaqut-sp-legend-label">{d.label}</span>
                <span className="yaqut-sp-legend-val">{d.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top geo types */}
      <div className="yaqut-sp-section">
        <div className="yaqut-sp-section-head">
          <span>{{ tr: 'Baskın Tipler', en: 'Top Types', ar: '' }[lang]}</span>
        </div>
        <div className="yaqut-sp-bars">
          {topGeoTypes.map(([name, count]) => (
            <div key={name} className="yaqut-sp-bar-row">
              <span className="yaqut-sp-bar-label">{name}</span>
              <div className="yaqut-sp-bar-track">
                <div className="yaqut-sp-bar-fill" style={{ width: `${(count / maxGeo) * 100}%` }} />
              </div>
              <span className="yaqut-sp-bar-val">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top countries */}
      <div className="yaqut-sp-section">
        <div className="yaqut-sp-section-head">
          <span>{{ tr: 'En Yoğun Ülkeler', en: 'Top Countries', ar: '' }[lang]}</span>
        </div>
        <div className="yaqut-sp-bars">
          {topCountries.map(([name, count]) => (
            <div key={name} className="yaqut-sp-bar-row">
              <span className="yaqut-sp-bar-label">{name}</span>
              <div className="yaqut-sp-bar-track">
                <div className="yaqut-sp-bar-fill yaqut-sp-bar-teal" style={{ width: `${(count / maxCountry) * 100}%` }} />
              </div>
              <span className="yaqut-sp-bar-val">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Rotating fact */}
      <div className="yaqut-sp-fact">
        <span className="yaqut-sp-fact-icon">💡</span>
        <span className="yaqut-sp-fact-text">{fact}</span>
      </div>
    </div>
  );
}

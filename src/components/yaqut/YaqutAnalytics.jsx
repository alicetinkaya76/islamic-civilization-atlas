import { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { hn } from '../../data/i18n-utils';
import T from '../../data/i18n';

/* ═══ Shared ═══ */
const MARGIN = { top: 30, right: 20, bottom: 40, left: 50 };

const GEO_COLORS = {
  city: '#d4a84b', village: '#66bb6a', mountain: '#a1887f', river: '#4fc3f7',
  fortress: '#ef5350', region: '#ce93d8', town: '#ff8a65', district: '#ffb74d',
  valley: '#81c784', water: '#29b6f6', well: '#4dd0e1', monastery: '#9575cd',
  spring: '#26c6da', pass: '#8d6e63', island: '#4db6ac', desert: '#ffd54f',
  place: '#90a4ae', market: '#f06292', quarter: '#78909c', wadi: '#aed581',
};

const GEO_TR = {
  city: 'Şehir', village: 'Köy', mountain: 'Dağ', river: 'Nehir',
  fortress: 'Kale', region: 'Bölge', town: 'Kasaba', district: 'Nahiye',
  valley: 'Vadi', water: 'Su', well: 'Kuyu', monastery: 'Manastır',
  spring: 'Pınar', pass: 'Geçit', island: 'Ada', desert: 'Çöl',
  place: 'Mevki', market: 'Pazar', quarter: 'Mahalle', wadi: 'Kuru Dere',
};

/* ═══ A) Geo Type Distribution — Bar Chart ═══ */
function GeoTypeChart({ data, lang, ty }) {
  const t = T[lang];
  const svgRef = useRef(null);

  const geoData = useMemo(() => {
    const counts = {};
    data.forEach(e => { if (e.gt) counts[e.gt] = (counts[e.gt] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 15)
      .map(([type, count]) => ({ type, label: lang === "tr" ? (GEO_TR[type] || type) : type, count }));
  }, [data, lang === "tr"]);

  useEffect(() => {
    const svg = d3.select(svgRef.current); svg.selectAll('*').remove();
    const w = svgRef.current.clientWidth || 600, h = 320;
    svg.attr('width', w).attr('height', h);
    if (!geoData.length) return;

    const x = d3.scaleLinear().domain([0, geoData[0].count]).range([0, w - MARGIN.left - MARGIN.right]);
    const y = d3.scaleBand().domain(geoData.map(d => d.label)).range([MARGIN.top, h - MARGIN.bottom]).padding(0.12);
    const g = svg.append('g').attr('transform', `translate(${MARGIN.left},0)`);

    g.selectAll('rect').data(geoData).join('rect')
      .attr('x', 0).attr('y', d => y(d.label)).attr('height', y.bandwidth())
      .attr('fill', d => GEO_COLORS[d.type] || '#90a4ae').attr('rx', 3)
      .attr('width', 0).transition().duration(600).attr('width', d => x(d.count));

    g.selectAll('.label').data(geoData).join('text').attr('class', 'label')
      .attr('x', -5).attr('y', d => y(d.label) + y.bandwidth() / 2).attr('dy', '0.35em')
      .attr('text-anchor', 'end').attr('fill', '#c4b89a').attr('font-size', 11).text(d => d.label);

    g.selectAll('.count').data(geoData).join('text').attr('class', 'count')
      .attr('x', d => x(d.count) + 5).attr('y', d => y(d.label) + y.bandwidth() / 2)
      .attr('dy', '0.35em').attr('fill', '#e8dcc8').attr('font-size', 11).attr('font-weight', 600)
      .text(d => d.count.toLocaleString());
  }, [geoData]);

  return (
    <div className="yaqut-chart-card">
      <h3 className="yaqut-chart-title">📍 {ty.chartGeoType || t.yaqut.chartGeoTypeDist}</h3>
      <svg ref={svgRef} style={{ width: '100%', height: 320 }} />
    </div>
  );
}

/* ═══ B) Country Distribution ═══ */
function CountryChart({ data, lang, ty }) {
  const t = T[lang];
  const svgRef = useRef(null);

  const countryData = useMemo(() => {
    const counts = {};
    data.forEach(e => { if (e.ct) counts[e.ct] = (counts[e.ct] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 12)
      .map(([name, count]) => ({ name, count }));
  }, [data]);

  useEffect(() => {
    const svg = d3.select(svgRef.current); svg.selectAll('*').remove();
    const w = svgRef.current.clientWidth || 600, h = 300;
    svg.attr('width', w).attr('height', h);
    if (!countryData.length) return;

    const x = d3.scaleLinear().domain([0, countryData[0].count]).range([0, w - MARGIN.left - MARGIN.right]);
    const y = d3.scaleBand().domain(countryData.map(d => d.name)).range([MARGIN.top, h - MARGIN.bottom]).padding(0.15);
    const g = svg.append('g').attr('transform', `translate(${MARGIN.left},0)`);
    const color = d3.scaleOrdinal(d3.schemeSet3);

    g.selectAll('rect').data(countryData).join('rect')
      .attr('x', 0).attr('y', d => y(d.name)).attr('height', y.bandwidth())
      .attr('fill', (d, i) => color(i)).attr('rx', 3)
      .attr('width', 0).transition().duration(600).attr('width', d => x(d.count));

    g.selectAll('.label').data(countryData).join('text')
      .attr('x', -5).attr('y', d => y(d.name) + y.bandwidth() / 2).attr('dy', '0.35em')
      .attr('text-anchor', 'end').attr('fill', '#c4b89a').attr('font-size', 11).text(d => d.name);

    g.selectAll('.count').data(countryData).join('text')
      .attr('x', d => x(d.count) + 5).attr('y', d => y(d.name) + y.bandwidth() / 2)
      .attr('dy', '0.35em').attr('fill', '#e8dcc8').attr('font-size', 11).attr('font-weight', 600)
      .text(d => d.count.toLocaleString());
  }, [countryData]);

  return (
    <div className="yaqut-chart-card">
      <h3 className="yaqut-chart-title">🌍 {ty.chartCountry || t.yaqut.chartCountryDist}</h3>
      <svg ref={svgRef} style={{ width: '100%', height: 300 }} />
    </div>
  );
}

/* ═══ C) Arabic Letter Distribution ═══ */
function LetterChart({ data, lang, ty }) {
  const t = T[lang];
  const svgRef = useRef(null);

  const letterData = useMemo(() => {
    const ARABIC_ORDER = 'أبتثجحخدذرزسشصضطظعغفقكلمنوهي'.split('');
    const counts = {};
    data.forEach(e => { if (e.lt) counts[e.lt] = (counts[e.lt] || 0) + 1; });
    return ARABIC_ORDER.filter(l => counts[l]).map(letter => ({ letter, count: counts[letter] || 0 }));
  }, [data]);

  useEffect(() => {
    const svg = d3.select(svgRef.current); svg.selectAll('*').remove();
    const w = svgRef.current.clientWidth || 600, h = 260;
    svg.attr('width', w).attr('height', h);
    if (!letterData.length) return;

    const x = d3.scaleBand().domain(letterData.map(d => d.letter)).range([MARGIN.left, w - MARGIN.right]).padding(0.1);
    const y = d3.scaleLinear().domain([0, d3.max(letterData, d => d.count)]).nice().range([h - MARGIN.bottom, MARGIN.top]);

    svg.selectAll('rect').data(letterData).join('rect')
      .attr('x', d => x(d.letter)).attr('width', x.bandwidth()).attr('fill', '#1a6b5a').attr('rx', 2)
      .attr('y', h - MARGIN.bottom).attr('height', 0)
      .transition().duration(600).attr('y', d => y(d.count)).attr('height', d => y(0) - y(d.count));

    svg.selectAll('text.lbl').data(letterData).join('text').attr('class', 'lbl')
      .attr('x', d => x(d.letter) + x.bandwidth() / 2).attr('y', h - MARGIN.bottom + 16)
      .attr('text-anchor', 'middle').attr('fill', '#c4b89a').attr('font-size', 13)
      .attr('font-family', "'Amiri', serif").text(d => d.letter);

    svg.selectAll('text.cnt').data(letterData).join('text').attr('class', 'cnt')
      .attr('x', d => x(d.letter) + x.bandwidth() / 2).attr('y', d => y(d.count) - 4)
      .attr('text-anchor', 'middle').attr('fill', '#e8dcc8').attr('font-size', 9).text(d => d.count);
  }, [letterData]);

  return (
    <div className="yaqut-chart-card">
      <h3 className="yaqut-chart-title">🔤 {ty.chartLetter || t.yaqut.statsLetterDist}</h3>
      <svg ref={svgRef} style={{ width: '100%', height: 260 }} />
    </div>
  );
}

/* ═══ D) Atlas Tags — Tag Cloud ═══ */
function TagCloud({ data, lang, ty }) {
  const t = T[lang];
  const tagData = useMemo(() => {
    const counts = {};
    data.forEach(e => { if (e.tg) e.tg.forEach(t => { counts[t] = (counts[t] || 0) + 1; }); });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 40)
      .map(([tag, count]) => ({ tag, count }));
  }, [data]);
  const maxCount = Math.max(...tagData.map(d => d.count), 1);

  return (
    <div className="yaqut-chart-card">
      <h3 className="yaqut-chart-title">🏷 {ty.chartTags || t.yaqut.chartAtlasTags}</h3>
      <div className="yaqut-tagcloud">
        {tagData.map(d => (
          <span key={d.tag} className="yaqut-tagcloud-item"
            style={{ fontSize: 11 + (d.count / maxCount) * 14, opacity: 0.5 + (d.count / maxCount) * 0.5 }}
            title={`${d.tag}: ${d.count}`}>{d.tag}</span>
        ))}
      </div>
    </div>
  );
}

/* ═══ E) Cross-ref Density ═══ */
function CrossRefDensity({ data, lang, ty }) {
  const svgRef = useRef(null);
  const topPlaces = useMemo(() =>
    data.filter(e => e.pc > 0).sort((a, b) => b.pc - a.pc).slice(0, 20)
      .map(e => ({ name: hn(e, lang), count: e.pc })), [data, lang === "tr"]);

  useEffect(() => {
    const svg = d3.select(svgRef.current); svg.selectAll('*').remove();
    const w = svgRef.current.clientWidth || 600, h = 380;
    svg.attr('width', w).attr('height', h);
    if (!topPlaces.length) return;

    const x = d3.scaleLinear().domain([0, topPlaces[0].count]).range([0, w - MARGIN.left - MARGIN.right - 10]);
    const y = d3.scaleBand().domain(topPlaces.map(d => d.name)).range([MARGIN.top, h - MARGIN.bottom]).padding(0.1);
    const g = svg.append('g').attr('transform', `translate(${MARGIN.left},0)`);

    g.selectAll('rect').data(topPlaces).join('rect')
      .attr('x', 0).attr('y', d => y(d.name)).attr('height', y.bandwidth())
      .attr('fill', '#1a6b5a').attr('rx', 3)
      .attr('width', 0).transition().duration(600).attr('width', d => x(d.count));

    g.selectAll('.label').data(topPlaces).join('text')
      .attr('x', -5).attr('y', d => y(d.name) + y.bandwidth() / 2).attr('dy', '0.35em')
      .attr('text-anchor', 'end').attr('fill', '#c4b89a').attr('font-size', 10)
      .text(d => d.name.length > 20 ? d.name.slice(0, 19) + '…' : d.name);

    g.selectAll('.count').data(topPlaces).join('text')
      .attr('x', d => x(d.count) + 5).attr('y', d => y(d.name) + y.bandwidth() / 2)
      .attr('dy', '0.35em').attr('fill', '#e8dcc8').attr('font-size', 11).attr('font-weight', 600)
      .text(d => d.count.toLocaleString());
  }, [topPlaces]);

  return (
    <div className="yaqut-chart-card">
      <h3 className="yaqut-chart-title">👤 {ty.chartCrossRef}</h3>
      <svg ref={svgRef} style={{ width: '100%', height: 380 }} />
    </div>
  );
}

/* ═══ F) Time Distribution ═══ */
function TimeDistribution({ data, lang, ty }) {
  const svgRef = useRef(null);
  const centuryData = useMemo(() => {
    const counts = {};
    data.forEach(e => {
      if (e.dh) e.dh.forEach(d => {
        const c = Math.ceil(d / 100);
        if (c > 0 && c <= 15) counts[c] = (counts[c] || 0) + 1;
      });
    });
    return Array.from({ length: 10 }, (_, i) => ({ century: i + 1, count: counts[i + 1] || 0 })).filter(d => d.count > 0);
  }, [data]);

  useEffect(() => {
    const svg = d3.select(svgRef.current); svg.selectAll('*').remove();
    const w = svgRef.current.clientWidth || 600, h = 250;
    svg.attr('width', w).attr('height', h);
    if (!centuryData.length) return;

    const x = d3.scaleBand().domain(centuryData.map(d => d.century)).range([MARGIN.left, w - MARGIN.right]).padding(0.15);
    const y = d3.scaleLinear().domain([0, d3.max(centuryData, d => d.count)]).nice().range([h - MARGIN.bottom, MARGIN.top]);

    svg.selectAll('rect').data(centuryData).join('rect')
      .attr('x', d => x(d.century)).attr('width', x.bandwidth()).attr('fill', '#ce93d8').attr('rx', 2)
      .attr('y', h - MARGIN.bottom).attr('height', 0)
      .transition().duration(600).attr('y', d => y(d.count)).attr('height', d => y(0) - y(d.count));

    svg.append('g').attr('transform', `translate(0,${h - MARGIN.bottom})`)
      .call(d3.axisBottom(x).tickFormat(d => `${d}. H`)).attr('color', '#c4b89a');
    svg.append('g').attr('transform', `translate(${MARGIN.left},0)`)
      .call(d3.axisLeft(y).ticks(5)).attr('color', '#c4b89a');
  }, [centuryData]);

  return (
    <div className="yaqut-chart-card">
      <h3 className="yaqut-chart-title">📅 {ty.chartTime}</h3>
      <svg ref={svgRef} style={{ width: '100%', height: 250 }} />
    </div>
  );
}

/* ═══ G) DIA Coverage — Stacked bar (DIA linked vs not) per geo type ═══ */
function DiaCoverage({ data, lang, ty }) {
  const t = T[lang];
  const svgRef = useRef(null);
  const chartData = useMemo(() => {
    const byType = {};
    data.forEach(e => {
      const gt = e.gt || 'other';
      if (!byType[gt]) byType[gt] = { total: 0, dia: 0 };
      byType[gt].total++;
      if (e.ds) byType[gt].dia++;
    });
    return Object.entries(byType).sort((a, b) => b[1].total - a[1].total).slice(0, 12)
      .map(([type, v]) => ({ type, label: lang === "tr" ? (GEO_TR[type] || type) : type, dia: v.dia, noDia: v.total - v.dia, total: v.total, pct: ((v.dia / v.total) * 100).toFixed(0) }));
  }, [data, lang === "tr"]);

  useEffect(() => {
    const svg = d3.select(svgRef.current); svg.selectAll('*').remove();
    const w = svgRef.current.clientWidth || 600, h = 300;
    svg.attr('width', w).attr('height', h);
    if (!chartData.length) return;

    const maxTotal = d3.max(chartData, d => d.total);
    const x = d3.scaleLinear().domain([0, maxTotal]).range([0, w - MARGIN.left - MARGIN.right - 40]);
    const y = d3.scaleBand().domain(chartData.map(d => d.label)).range([MARGIN.top, h - MARGIN.bottom]).padding(0.12);
    const g = svg.append('g').attr('transform', `translate(${MARGIN.left},0)`);

    // No-DIA bar (background)
    g.selectAll('.bg').data(chartData).join('rect').attr('class', 'bg')
      .attr('x', 0).attr('y', d => y(d.label)).attr('height', y.bandwidth())
      .attr('fill', '#1e2a44').attr('rx', 3).attr('width', d => x(d.total));

    // DIA bar (foreground)
    g.selectAll('.fg').data(chartData).join('rect').attr('class', 'fg')
      .attr('x', 0).attr('y', d => y(d.label)).attr('height', y.bandwidth())
      .attr('fill', '#d4a84b').attr('rx', 3)
      .attr('width', 0).transition().duration(600).attr('width', d => x(d.dia));

    g.selectAll('.label').data(chartData).join('text')
      .attr('x', -5).attr('y', d => y(d.label) + y.bandwidth() / 2).attr('dy', '0.35em')
      .attr('text-anchor', 'end').attr('fill', '#c4b89a').attr('font-size', 10).text(d => d.label);

    g.selectAll('.pct').data(chartData).join('text')
      .attr('x', d => x(d.total) + 5).attr('y', d => y(d.label) + y.bandwidth() / 2)
      .attr('dy', '0.35em').attr('fill', '#d4a84b').attr('font-size', 10).attr('font-weight', 600)
      .text(d => `%${d.pct}`);

    // Legend
    const lg = svg.append('g').attr('transform', `translate(${MARGIN.left + 10}, ${MARGIN.top - 16})`);
    lg.append('rect').attr('width', 10).attr('height', 10).attr('fill', '#d4a84b').attr('rx', 1);
    lg.append('text').attr('x', 14).attr('y', 9).attr('fill', '#d4a84b').attr('font-size', 10)
      .text(t.yaqut?.chartDiaLinked || 'DİA Linked');
    const lg2 = svg.append('g').attr('transform', `translate(${MARGIN.left + 120}, ${MARGIN.top - 16})`);
    lg2.append('rect').attr('width', 10).attr('height', 10).attr('fill', '#1e2a44').attr('rx', 1);
    lg2.append('text').attr('x', 14).attr('y', 9).attr('fill', '#90a4ae').attr('font-size', 10)
      .text(t.yaqut?.chartDiaNotLinked || 'Not Linked');
  }, [chartData, lang === "tr"]);

  return (
    <div className="yaqut-chart-card">
      <h3 className="yaqut-chart-title">📖 {ty.chartDia || t.yaqut.chartDiaCoverage}</h3>
      <svg ref={svgRef} style={{ width: '100%', height: 300 }} />
    </div>
  );
}

/* ═══ H) Events & Persons Scatter — bubble chart ═══ */
function EventPersonScatter({ data, lang, ty }) {
  const t = T[lang];
  const svgRef = useRef(null);
  const bubbles = useMemo(() => {
    return data.filter(e => ((e.np || 0) > 0 || (e.ec || 0) > 0) && e.ct)
      .map(e => ({ name: hn(e, lang), np: e.np || 0, ec: e.ec || 0, pc: e.pc || 0, ct: e.ct }))
      .sort((a, b) => (b.np + b.ec) - (a.np + a.ec)).slice(0, 60);
  }, [data, lang === "tr"]);

  useEffect(() => {
    const svg = d3.select(svgRef.current); svg.selectAll('*').remove();
    const w = svgRef.current.clientWidth || 600, h = 350;
    svg.attr('width', w).attr('height', h);
    if (!bubbles.length) return;
    const M = { top: 40, right: 30, bottom: 50, left: 50 };

    const x = d3.scaleLinear().domain([0, d3.max(bubbles, d => d.ec) * 1.1]).range([M.left, w - M.right]);
    const y = d3.scaleLinear().domain([0, d3.max(bubbles, d => d.np) * 1.2]).range([h - M.bottom, M.top]);
    const r = d3.scaleSqrt().domain([0, d3.max(bubbles, d => d.pc)]).range([3, 20]);
    const color = d3.scaleOrdinal(d3.schemeSet2);

    svg.selectAll('circle').data(bubbles).join('circle')
      .attr('cx', d => x(d.ec)).attr('cy', d => y(d.np))
      .attr('r', d => r(d.pc || 1)).attr('fill', (d, i) => color(i % 8))
      .attr('opacity', 0.7).attr('stroke', '#080c18').attr('stroke-width', 0.5)
      .append('title').text(d => `${d.name}: ${d.np} ${t.yaqut.chartPersons}, ${d.ec} ${t.yaqut.chartEvents}, ${d.pc} ${t.yaqut.chartXref}`);

    svg.selectAll('text.lbl').data(bubbles.filter(d => d.np > 3 || d.ec > 3)).join('text').attr('class', 'lbl')
      .attr('x', d => x(d.ec)).attr('y', d => y(d.np) - r(d.pc || 1) - 3)
      .attr('text-anchor', 'middle').attr('fill', '#c4b89a').attr('font-size', 8)
      .text(d => d.name.length > 12 ? d.name.slice(0, 11) + '…' : d.name);

    svg.append('g').attr('transform', `translate(0,${h - M.bottom})`).call(d3.axisBottom(x).ticks(6)).attr('color', '#c4b89a');
    svg.append('g').attr('transform', `translate(${M.left},0)`).call(d3.axisLeft(y).ticks(6)).attr('color', '#c4b89a');

    svg.append('text').attr('x', w / 2).attr('y', h - 8).attr('text-anchor', 'middle')
      .attr('fill', '#c4b89a').attr('font-size', 11).text(t.yaqut?.chartEventCount || 'Event Count');
    svg.append('text').attr('x', -h / 2).attr('y', 14).attr('transform', 'rotate(-90)')
      .attr('text-anchor', 'middle').attr('fill', '#c4b89a').attr('font-size', 11)
      .text(t.yaqut?.chartPersonCount || 'Person Count');
  }, [bubbles, lang === "tr"]);

  return (
    <div className="yaqut-chart-card">
      <h3 className="yaqut-chart-title">🔬 {ty.chartScatter || t.yaqut.chartScatter}</h3>
      <svg ref={svgRef} style={{ width: '100%', height: 350 }} />
    </div>
  );
}

/* ═══ Chart descriptions (TR/EN) ═══ */
const DESC = {
  geoType:  { tr: 'Yâkût\'un sözlüğündeki 12.954 coğrafi girişin tip dağılımı. Genel yer, köy, dağ ve şehir en baskın kategorilerdir.', en: 'Type distribution of 12,954 geographic entries. Place, village, mountain, and city are the most prominent categories.' },
  country:  { tr: 'Modern ülke sınırlarına göre girişlerin dağılımı. Irak, İran, Suriye ve Mısır en yoğun bölgelerdir.', en: 'Distribution of entries by modern country. Iraq, Iran, Syria, and Egypt are the densest regions.' },
  letter:   { tr: 'Arap harflerine göre giriş sayısı dağılımı (alfabe sırasıyla). Ba (ب), Kaf (ق) ve Ha (ح) en yoğun harflerdir.', en: 'Entry count by Arabic letter (alphabet order). Ba (ب), Qaf (ق), and Ha (ح) have the most entries.' },
  tags:     { tr: 'Atlas etiketleri: tematik sınıflandırma. Abbâsî, ticaret, hac güzergâhı, ilim merkezi gibi etiketler.', en: 'Atlas tags: thematic classification. Tags like Abbasid, trade, pilgrimage route, knowledge center.' },
  crossRef: { tr: 'En çok Ziriklî biyografisi bağlanan yerler. Kahire (844), Bağdat (762) ve Mısır en yoğun merkezlerdir.', en: 'Places with most Zirikli biography links. Cairo (844), Baghdad (762) and Egypt are the densest centers.' },
  time:     { tr: 'Girişlerdeki Hicrî tarihlerin yüzyıla göre dağılımı. Erken Hicrî yüzyıllar baskındır.', en: 'Distribution of Hijri dates in entries by century. Early Hijri centuries are dominant.' },
  dia:      { tr: 'Her coğrafi tip için DİA bağlantı kapsam oranı. Altın çubuk = DİA\'da maddesi var, koyu = yok.', en: 'DIA link coverage rate per geo type. Gold bar = has DIA entry, dark = not linked.' },
  scatter:  { tr: 'Her balon bir yer\'i temsil eder. X = olay sayısı, Y = kişi sayısı (Yâkût metni), büyüklük = Ziriklî cross-ref sayısı.', en: 'Each bubble represents a place. X = event count, Y = person count (Yāqūt text), size = Zirikli cross-ref count.' },
};

/* ═══ Main Analytics ═══ */
export default function YaqutAnalytics({ lang, ty, data, filtered }) {
  const t = T[lang];
  const desc = (key) => DESC[key]?.[lang] || DESC[key]?.en || DESC[key]?.tr || '';

  return (
    <div className="yaqut-analytics">
      <div className="yaqut-analytics-grid">
        <div className="yaqut-chart-wrap">
          <GeoTypeChart data={data} lang={lang} ty={ty} />
          <p className="yaqut-chart-desc">{desc('geoType')}</p>
        </div>
        <div className="yaqut-chart-wrap">
          <CrossRefDensity data={data} lang={lang} ty={ty} />
          <p className="yaqut-chart-desc">{desc('crossRef')}</p>
        </div>
        <div className="yaqut-chart-wrap">
          <CountryChart data={data} lang={lang} ty={ty} />
          <p className="yaqut-chart-desc">{desc('country')}</p>
        </div>
        <div className="yaqut-chart-wrap">
          <DiaCoverage data={data} lang={lang} ty={ty} />
          <p className="yaqut-chart-desc">{desc('dia')}</p>
        </div>
        <div className="yaqut-chart-wrap">
          <LetterChart data={data} lang={lang} ty={ty} />
          <p className="yaqut-chart-desc">{desc('letter')}</p>
        </div>
        <div className="yaqut-chart-wrap">
          <EventPersonScatter data={data} lang={lang} ty={ty} />
          <p className="yaqut-chart-desc">{desc('scatter')}</p>
        </div>
        <div className="yaqut-chart-wrap">
          <TagCloud data={data} lang={lang} ty={ty} />
          <p className="yaqut-chart-desc">{desc('tags')}</p>
        </div>
        <div className="yaqut-chart-wrap">
          <TimeDistribution data={data} lang={lang} ty={ty} />
          <p className="yaqut-chart-desc">{desc('time')}</p>
        </div>
      </div>
    </div>
  );
}

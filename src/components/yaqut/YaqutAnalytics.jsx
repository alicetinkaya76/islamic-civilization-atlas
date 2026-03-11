import { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';

/* ═══ Shared chart constants ═══ */
const MARGIN = { top: 30, right: 20, bottom: 40, left: 50 };

const GEO_COLORS = {
  city: '#d4a84b', village: '#66bb6a', mountain: '#a1887f', river: '#4fc3f7',
  fortress: '#ef5350', region: '#ce93d8', town: '#ff8a65', district: '#ffb74d',
  valley: '#81c784', water: '#29b6f6', well: '#4dd0e1', monastery: '#9575cd',
  spring: '#26c6da', pass: '#8d6e63', island: '#4db6ac', desert: '#ffd54f',
  place: '#90a4ae', market: '#f06292', quarter: '#78909c', wadi: '#aed581',
};

/* ═══ A) Geo Type Distribution — Bar Chart ═══ */
function GeoTypeChart({ data, lang }) {
  const svgRef = useRef(null);
  const isTr = lang === 'tr';

  const geoData = useMemo(() => {
    const counts = {};
    data.forEach(e => {
      if (e.gt) counts[e.gt] = (counts[e.gt] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([type, count]) => ({ type, count }));
  }, [data]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    const w = svgRef.current.clientWidth || 600;
    const h = 300;
    svg.attr('width', w).attr('height', h);
    if (!geoData.length) return;

    const x = d3.scaleLinear()
      .domain([0, geoData[0].count])
      .range([0, w - MARGIN.left - MARGIN.right]);

    const y = d3.scaleBand()
      .domain(geoData.map(d => d.type))
      .range([MARGIN.top, h - MARGIN.bottom])
      .padding(0.15);

    const g = svg.append('g').attr('transform', `translate(${MARGIN.left},0)`);

    g.selectAll('rect').data(geoData).join('rect')
      .attr('x', 0).attr('y', d => y(d.type))
      .attr('height', y.bandwidth())
      .attr('fill', d => GEO_COLORS[d.type] || '#90a4ae')
      .attr('rx', 3)
      .attr('width', 0)
      .transition().duration(600)
      .attr('width', d => x(d.count));

    g.selectAll('.label').data(geoData).join('text')
      .attr('class', 'label')
      .attr('x', -5).attr('y', d => y(d.type) + y.bandwidth() / 2)
      .attr('dy', '0.35em').attr('text-anchor', 'end')
      .attr('fill', '#c4b89a').attr('font-size', 11)
      .text(d => d.type);

    g.selectAll('.count').data(geoData).join('text')
      .attr('class', 'count')
      .attr('x', d => x(d.count) + 5)
      .attr('y', d => y(d.type) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('fill', '#e8dcc8').attr('font-size', 11).attr('font-weight', 600)
      .text(d => d.count.toLocaleString());
  }, [geoData]);

  return (
    <div className="yaqut-chart-card">
      <h3 className="yaqut-chart-title">📍 {isTr ? 'Coğrafi Tip Dağılımı' : 'Geographic Type Distribution'}</h3>
      <svg ref={svgRef} style={{ width: '100%', height: 300 }} />
    </div>
  );
}

/* ═══ B) Country Distribution — Horizontal Bar ═══ */
function CountryChart({ data, lang }) {
  const svgRef = useRef(null);
  const isTr = lang === 'tr';

  const countryData = useMemo(() => {
    const counts = {};
    data.forEach(e => { if (e.ct) counts[e.ct] = (counts[e.ct] || 0) + 1; });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([name, count]) => ({ name, count }));
  }, [data]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    const w = svgRef.current.clientWidth || 600;
    const h = 300;
    svg.attr('width', w).attr('height', h);
    if (!countryData.length) return;

    const x = d3.scaleLinear().domain([0, countryData[0].count]).range([0, w - MARGIN.left - MARGIN.right]);
    const y = d3.scaleBand().domain(countryData.map(d => d.name)).range([MARGIN.top, h - MARGIN.bottom]).padding(0.15);
    const g = svg.append('g').attr('transform', `translate(${MARGIN.left},0)`);

    const color = d3.scaleOrdinal(d3.schemeSet3);

    g.selectAll('rect').data(countryData).join('rect')
      .attr('x', 0).attr('y', d => y(d.name))
      .attr('height', y.bandwidth())
      .attr('fill', (d, i) => color(i))
      .attr('rx', 3)
      .attr('width', 0)
      .transition().duration(600)
      .attr('width', d => x(d.count));

    g.selectAll('.label').data(countryData).join('text')
      .attr('x', -5).attr('y', d => y(d.name) + y.bandwidth() / 2)
      .attr('dy', '0.35em').attr('text-anchor', 'end')
      .attr('fill', '#c4b89a').attr('font-size', 11)
      .text(d => d.name);

    g.selectAll('.count').data(countryData).join('text')
      .attr('x', d => x(d.count) + 5)
      .attr('y', d => y(d.name) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('fill', '#e8dcc8').attr('font-size', 11).attr('font-weight', 600)
      .text(d => d.count.toLocaleString());
  }, [countryData]);

  return (
    <div className="yaqut-chart-card">
      <h3 className="yaqut-chart-title">🌍 {isTr ? 'Ülke Dağılımı' : 'Country Distribution'}</h3>
      <svg ref={svgRef} style={{ width: '100%', height: 300 }} />
    </div>
  );
}

/* ═══ C) Arabic Letter Distribution ═══ */
function LetterChart({ data, lang }) {
  const svgRef = useRef(null);
  const isTr = lang === 'tr';

  const letterData = useMemo(() => {
    const counts = {};
    data.forEach(e => { if (e.lt) counts[e.lt] = (counts[e.lt] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
      .map(([letter, count]) => ({ letter, count }));
  }, [data]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    const w = svgRef.current.clientWidth || 600;
    const h = 260;
    svg.attr('width', w).attr('height', h);
    if (!letterData.length) return;

    const x = d3.scaleBand()
      .domain(letterData.map(d => d.letter))
      .range([MARGIN.left, w - MARGIN.right])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(letterData, d => d.count)])
      .nice().range([h - MARGIN.bottom, MARGIN.top]);

    svg.selectAll('rect').data(letterData).join('rect')
      .attr('x', d => x(d.letter))
      .attr('width', x.bandwidth())
      .attr('fill', '#1a6b5a')
      .attr('rx', 2)
      .attr('y', h - MARGIN.bottom)
      .attr('height', 0)
      .transition().duration(600)
      .attr('y', d => y(d.count))
      .attr('height', d => y(0) - y(d.count));

    svg.selectAll('text.lbl').data(letterData).join('text')
      .attr('class', 'lbl')
      .attr('x', d => x(d.letter) + x.bandwidth() / 2)
      .attr('y', h - MARGIN.bottom + 16)
      .attr('text-anchor', 'middle')
      .attr('fill', '#c4b89a').attr('font-size', 13)
      .attr('font-family', "'Amiri', serif")
      .text(d => d.letter);

    svg.selectAll('text.cnt').data(letterData).join('text')
      .attr('class', 'cnt')
      .attr('x', d => x(d.letter) + x.bandwidth() / 2)
      .attr('y', d => y(d.count) - 4)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e8dcc8').attr('font-size', 9)
      .text(d => d.count);
  }, [letterData]);

  return (
    <div className="yaqut-chart-card">
      <h3 className="yaqut-chart-title">🔤 {isTr ? 'Harf Dağılımı' : 'Letter Distribution'}</h3>
      <svg ref={svgRef} style={{ width: '100%', height: 260 }} />
    </div>
  );
}

/* ═══ D) Atlas Tags — Tag Cloud ═══ */
function TagCloud({ data, lang }) {
  const isTr = lang === 'tr';

  const tagData = useMemo(() => {
    const counts = {};
    data.forEach(e => {
      if (e.tg) e.tg.forEach(t => { counts[t] = (counts[t] || 0) + 1; });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 40)
      .map(([tag, count]) => ({ tag, count }));
  }, [data]);

  const maxCount = Math.max(...tagData.map(d => d.count), 1);

  return (
    <div className="yaqut-chart-card">
      <h3 className="yaqut-chart-title">🏷 {isTr ? 'Atlas Etiketleri' : 'Atlas Tags'}</h3>
      <div className="yaqut-tagcloud">
        {tagData.map(d => {
          const size = 11 + (d.count / maxCount) * 14;
          const opacity = 0.5 + (d.count / maxCount) * 0.5;
          return (
            <span key={d.tag} className="yaqut-tagcloud-item"
              style={{ fontSize: size, opacity }}
              title={`${d.tag}: ${d.count}`}>
              {d.tag}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/* ═══ E) Cross-ref Density — Top places with most Zirikli persons ═══ */
function CrossRefDensity({ data, lang }) {
  const svgRef = useRef(null);
  const isTr = lang === 'tr';

  const topPlaces = useMemo(() => {
    return data.filter(e => e.pc > 0)
      .sort((a, b) => b.pc - a.pc)
      .slice(0, 20)
      .map(e => ({ name: isTr ? e.ht : e.he, count: e.pc }));
  }, [data, isTr]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    const w = svgRef.current.clientWidth || 600;
    const h = 360;
    svg.attr('width', w).attr('height', h);
    if (!topPlaces.length) return;

    const x = d3.scaleLinear().domain([0, topPlaces[0].count]).range([0, w - MARGIN.left - MARGIN.right - 10]);
    const y = d3.scaleBand().domain(topPlaces.map(d => d.name)).range([MARGIN.top, h - MARGIN.bottom]).padding(0.1);
    const g = svg.append('g').attr('transform', `translate(${MARGIN.left},0)`);

    g.selectAll('rect').data(topPlaces).join('rect')
      .attr('x', 0).attr('y', d => y(d.name))
      .attr('height', y.bandwidth())
      .attr('fill', '#1a6b5a')
      .attr('rx', 3)
      .attr('width', 0)
      .transition().duration(600)
      .attr('width', d => x(d.count));

    g.selectAll('.label').data(topPlaces).join('text')
      .attr('x', -5).attr('y', d => y(d.name) + y.bandwidth() / 2)
      .attr('dy', '0.35em').attr('text-anchor', 'end')
      .attr('fill', '#c4b89a').attr('font-size', 10)
      .text(d => d.name.length > 20 ? d.name.slice(0, 19) + '…' : d.name);

    g.selectAll('.count').data(topPlaces).join('text')
      .attr('x', d => x(d.count) + 5)
      .attr('y', d => y(d.name) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('fill', '#e8dcc8').attr('font-size', 11).attr('font-weight', 600)
      .text(d => d.count.toLocaleString());
  }, [topPlaces]);

  return (
    <div className="yaqut-chart-card">
      <h3 className="yaqut-chart-title">👤 {isTr ? 'En Çok Ziriklî Kişisi Bağlanan Yerler' : 'Top Places by Zirikli Person Count'}</h3>
      <svg ref={svgRef} style={{ width: '100%', height: 360 }} />
    </div>
  );
}

/* ═══ F) Time Distribution — Hijri dates by century ═══ */
function TimeDistribution({ data, lang }) {
  const svgRef = useRef(null);
  const isTr = lang === 'tr';

  const centuryData = useMemo(() => {
    const counts = {};
    data.forEach(e => {
      if (e.dh) {
        e.dh.forEach(d => {
          const century = Math.ceil(d / 100);
          if (century > 0 && century <= 15) {
            counts[century] = (counts[century] || 0) + 1;
          }
        });
      }
    });
    return Array.from({ length: 10 }, (_, i) => ({
      century: i + 1,
      count: counts[i + 1] || 0,
    })).filter(d => d.count > 0);
  }, [data]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    const w = svgRef.current.clientWidth || 600;
    const h = 250;
    svg.attr('width', w).attr('height', h);
    if (!centuryData.length) return;

    const x = d3.scaleBand()
      .domain(centuryData.map(d => d.century))
      .range([MARGIN.left, w - MARGIN.right])
      .padding(0.15);

    const y = d3.scaleLinear()
      .domain([0, d3.max(centuryData, d => d.count)])
      .nice().range([h - MARGIN.bottom, MARGIN.top]);

    svg.selectAll('rect').data(centuryData).join('rect')
      .attr('x', d => x(d.century))
      .attr('width', x.bandwidth())
      .attr('fill', '#ce93d8')
      .attr('rx', 2)
      .attr('y', h - MARGIN.bottom)
      .attr('height', 0)
      .transition().duration(600)
      .attr('y', d => y(d.count))
      .attr('height', d => y(0) - y(d.count));

    svg.append('g')
      .attr('transform', `translate(0,${h - MARGIN.bottom})`)
      .call(d3.axisBottom(x).tickFormat(d => `${d}. H`))
      .attr('color', '#c4b89a');

    svg.append('g')
      .attr('transform', `translate(${MARGIN.left},0)`)
      .call(d3.axisLeft(y).ticks(5))
      .attr('color', '#c4b89a');
  }, [centuryData]);

  return (
    <div className="yaqut-chart-card">
      <h3 className="yaqut-chart-title">📅 {isTr ? 'Hicrî Yüzyıl Dağılımı' : 'Hijri Century Distribution'}</h3>
      <svg ref={svgRef} style={{ width: '100%', height: 250 }} />
    </div>
  );
}

/* ═══ Chart descriptions ═══ */
const CHART_DESC = {
  geoType: {
    tr: 'Yâkût\'un sözlüğündeki 12.954 coğrafi girişin tip dağılımını gösterir. Genel yer (place), köy, dağ ve şehir en baskın kategorilerdir.',
    en: 'Shows the type distribution of 12,954 geographic entries in Yāqūt\'s dictionary. Generic place, village, mountain, and city are the most prominent categories.',
  },
  country: {
    tr: 'Modern ülke sınırlarına göre girişlerin dağılımı. Irak, İran, Suriye ve Mısır en yoğun bölgelerdir.',
    en: 'Distribution of entries by modern country borders. Iraq, Iran, Syria, and Egypt are the densest regions.',
  },
  letter: {
    tr: 'Arap harflerine göre giriş sayısı dağılımı. Ba (ب), Kaf (ق) ve Ha (ح) en yoğun harflerdir.',
    en: 'Entry count distribution by Arabic letter. Ba (ب), Qaf (ق), and Ha (ح) have the most entries.',
  },
  tags: {
    tr: 'Atlas etiketleri: tematik sınıflandırma. Abbâsî, ticaret, hac güzergâhı, ilim merkezi gibi etiketler.',
    en: 'Atlas tags: thematic classification. Tags like Abbasid, trade, pilgrimage route, knowledge center.',
  },
  crossRef: {
    tr: 'En çok Ziriklî biyografisi bağlanan yerler. Kahire, Bağdat, Mısır en yoğun merkezlerdir.',
    en: 'Places with most Zirikli biography links. Cairo, Baghdad, Egypt are the densest centers.',
  },
  time: {
    tr: 'Girişlerdeki Hicrî tarihlerin yüzyıla göre dağılımı. Erken Hicrî yüzyıllar baskındır.',
    en: 'Distribution of Hijri dates in entries by century. Early Hijri centuries are dominant.',
  },
};

/* ═══ Main Analytics Component ═══ */
export default function YaqutAnalytics({ lang, ty, data, filtered }) {
  const desc = (key) => lang === 'tr' ? CHART_DESC[key].tr : CHART_DESC[key].en;

  return (
    <div className="yaqut-analytics">
      <div className="yaqut-analytics-grid">
        <div className="yaqut-chart-wrap">
          <GeoTypeChart data={data} lang={lang} />
          <p className="yaqut-chart-desc">{desc('geoType')}</p>
        </div>
        <div className="yaqut-chart-wrap">
          <CrossRefDensity data={data} lang={lang} />
          <p className="yaqut-chart-desc">{desc('crossRef')}</p>
        </div>
        <div className="yaqut-chart-wrap">
          <CountryChart data={data} lang={lang} />
          <p className="yaqut-chart-desc">{desc('country')}</p>
        </div>
        <div className="yaqut-chart-wrap">
          <LetterChart data={data} lang={lang} />
          <p className="yaqut-chart-desc">{desc('letter')}</p>
        </div>
        <div className="yaqut-chart-wrap">
          <TagCloud data={data} lang={lang} />
          <p className="yaqut-chart-desc">{desc('tags')}</p>
        </div>
        <div className="yaqut-chart-wrap">
          <TimeDistribution data={data} lang={lang} />
          <p className="yaqut-chart-desc">{desc('time')}</p>
        </div>
      </div>
    </div>
  );
}

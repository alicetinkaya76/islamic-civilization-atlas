import { useMemo, useRef, useEffect, useState } from 'react';
import { getCentury, EI1_FIELD_COLORS } from './ei1Constants';

/* Simple canvas bar chart */
function BarChart({ data, width = 600, height = 280, label = 'count', color = 'rgba(201,168,76,0.7)' }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr; canvas.height = height * dpr;
    canvas.style.width = width + 'px'; canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const maxVal = Math.max(...data.map(d => d.value), 1);
    const barW = Math.max(8, Math.min(32, (width - 60) / data.length - 4));
    const chartH = height - 40;
    const startX = 40;

    // Grid lines
    const style = getComputedStyle(document.documentElement);
    const gridColor = style.getPropertyValue('--chart-grid').trim() || 'rgba(30,42,68,0.3)';
    const textColor = style.getPropertyValue('--chart-text').trim() || 'rgba(160,150,130,0.7)';

    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = 10 + (chartH / 4) * i;
      ctx.beginPath(); ctx.moveTo(startX, y); ctx.lineTo(width - 10, y); ctx.stroke();
      ctx.fillStyle = textColor;
      ctx.font = '10px sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(Math.round(maxVal * (1 - i / 4)), startX - 6, y + 4);
    }

    // Bars
    data.forEach((d, i) => {
      const x = startX + i * (barW + 4);
      const barH = (d.value / maxVal) * chartH;
      const y = 10 + chartH - barH;

      ctx.fillStyle = d.color || color;
      ctx.beginPath();
      const r = Math.min(3, barW / 4);
      ctx.moveTo(x, y + r); ctx.arcTo(x, y, x + barW, y, r);
      ctx.arcTo(x + barW, y, x + barW, y + barH, r);
      ctx.lineTo(x + barW, 10 + chartH); ctx.lineTo(x, 10 + chartH);
      ctx.closePath(); ctx.fill();

      // Label
      ctx.fillStyle = textColor;
      ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
      ctx.save();
      ctx.translate(x + barW / 2, height - 4);
      if (d.label.length > 5) { ctx.rotate(-0.5); }
      ctx.fillText(d.label.slice(0, 10), 0, 0);
      ctx.restore();
    });
  }, [data, width, height, color]);

  return <canvas ref={canvasRef} style={{ width, height, maxWidth: '100%' }} />;
}

export default function Ei1Analytics({ lang, te, data, filtered }) {
  const [activeChart, setActiveChart] = useState('century');

  /* Century distribution */
  const centuryData = useMemo(() => {
    const counts = {};
    filtered.forEach(b => {
      const c = getCentury(parseInt(b.dc) || 0);
      if (c && c >= 1 && c <= 21) counts[c] = (counts[c] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([c, n]) => ({ label: `${c}C`, value: n }))
      .sort((a, b) => parseInt(a.label) - parseInt(b.label));
  }, [filtered]);

  /* Field distribution */
  const fieldData = useMemo(() => {
    const counts = {};
    filtered.forEach(b => { (b.fl || []).forEach(f => { counts[f] = (counts[f] || 0) + 1; }); });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([f, c]) => ({ label: f, value: c, color: EI1_FIELD_COLORS[f] || '#546e7a' }));
  }, [filtered]);

  /* Volume distribution */
  const volumeData = useMemo(() => {
    const counts = {};
    filtered.forEach(b => {
      if (b.vol) counts[b.vol] = (counts[b.vol] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
      .map(([v, c]) => ({ label: `V${v}`, value: c }));
  }, [filtered]);

  /* Author contribution distribution */
  const authorData = useMemo(() => {
    const counts = {};
    filtered.forEach(b => { if (b.au) counts[b.au] = (counts[b.au] || 0) + 1; });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([a, c]) => ({ label: a.split(' ').pop() || a, value: c, fullLabel: a }));
  }, [filtered]);

  /* Article type pie data */
  const typeData = useMemo(() => {
    const counts = {};
    filtered.forEach(b => { counts[b.at || 'unknown'] = (counts[b.at || 'unknown'] || 0) + 1; });
    const colors = { biography: '#e57373', geography: '#4db6ac', concept: '#ffb74d', dynasty: '#7986cb', cross_reference: '#90a4ae', unknown: '#546e7a' };
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([t, c]) => ({ label: t, value: c, color: colors[t] || '#546e7a' }));
  }, [filtered]);

  const charts = [
    { id: 'century', label: te.centuryChart || 'Century' },
    { id: 'field', label: te.fieldChart || 'Fields' },
    { id: 'volume', label: te.volumeChart || 'Volumes' },
    { id: 'author', label: te.authorChart || 'Authors' },
    { id: 'type', label: te.typeChart || 'Types' },
  ];

  const chartData = {
    century: centuryData,
    field: fieldData,
    volume: volumeData,
    author: authorData,
    type: typeData,
  };

  return (
    <div className="ei1-analytics">
      <div className="ei1-analytics-tabs">
        {charts.map(c => (
          <button key={c.id} className={`ei1-analytics-tab${activeChart === c.id ? ' active' : ''}`}
            onClick={() => setActiveChart(c.id)}>
            {c.label}
          </button>
        ))}
      </div>

      <div className="ei1-analytics-chart">
        <h4 className="ei1-chart-title">
          {charts.find(c => c.id === activeChart)?.label}
          <span className="ei1-chart-subtitle"> ({filtered.length.toLocaleString()} {te.entries || 'entries'})</span>
        </h4>
        <div className="ei1-chart-canvas-wrap">
          <BarChart
            data={chartData[activeChart] || []}
            width={Math.min(700, typeof window !== 'undefined' ? window.innerWidth - 80 : 600)}
            height={300}
          />
        </div>
      </div>

      {/* Summary insights */}
      <div className="ei1-analytics-insights">
        <div className="ei1-insight-card">
          <div className="ei1-insight-icon">📊</div>
          <div className="ei1-insight-text">
            <strong>{filtered.filter(b => b.bio).length.toLocaleString()}</strong> {te.bioIn || 'biographies in'} <strong>{filtered.length.toLocaleString()}</strong> {te.filteredEntries || 'filtered entries'}
          </div>
        </div>
        <div className="ei1-insight-card">
          <div className="ei1-insight-icon">📅</div>
          <div className="ei1-insight-text">
            {te.dateRange || 'Date range'}: <strong>{
              (() => {
                const dcs = filtered.map(b => parseInt(b.dc)).filter(Boolean);
                return dcs.length ? `${Math.min(...dcs)} — ${Math.max(...dcs)} CE` : '—';
              })()
            }</strong>
          </div>
        </div>
        <div className="ei1-insight-card">
          <div className="ei1-insight-icon">✍️</div>
          <div className="ei1-insight-text">
            <strong>{new Set(filtered.map(b => b.au).filter(Boolean)).size}</strong> {te.distinctAuthors || 'distinct EI¹ authors'}
          </div>
        </div>
      </div>
    </div>
  );
}

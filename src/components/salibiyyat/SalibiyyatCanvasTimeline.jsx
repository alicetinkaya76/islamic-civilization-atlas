import { useRef, useEffect, useState, useCallback } from 'react';

const LANE_HEIGHT = 50;
const LANE_GAP = 8;
const HEADER_HEIGHT = 40;
const PADDING_X = 60;
const PADDING_Y = 20;
const DOT_RADIUS = 4;
const MIN_YEAR = 1096;
const MAX_YEAR = 1466;

const SOURCE_ORDER = ['IA', 'AS', 'MQ', 'US', 'IS', 'ID'];

/**
 * SalibiyyatCanvasTimeline — Canvas bee-swarm timeline
 * Ported from standalone CanvasTimeline.jsx
 *
 * Props:
 *   events   — events array
 *   sources  — sources array
 *   filters  — { source: 'all'|shortCode, type: 'all'|typeCode }
 *   srcColors — { shortCode: '#hex' }
 *   srcNames  — { shortCode: 'name' }
 *   eventTypeLabels — { typeCode: 'label' }
 */
export default function SalibiyyatCanvasTimeline({
  events = [], sources = [], filters = {},
  srcColors = {}, srcNames = {}, eventTypeLabels = {}
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const stateRef = useRef({
    offsetX: 0, offsetY: 0, scale: 1,
    dragging: false, dragStartX: 0, dragStartY: 0, dragOffsetX: 0, dragOffsetY: 0,
    hoveredEvent: null,
  });
  const [tooltip, setTooltip] = useState(null);
  const [dimensions, setDimensions] = useState({ w: 800, h: 400 });
  const rafRef = useRef(null);

  // Normalize field access
  const getYear = (e) => e.year !== undefined ? e.year : e.y;
  const getSrc = (e) => e.source_short || e.s;
  const getType = (e) => e.type || e.t;
  const getTitle = (e) => e.title || e.n;
  const getLoc = (e) => e.location || e.l;
  const getCluster = (e) => e.cluster_id || e.c;

  const filteredEvents = events.filter(e => {
    if (getYear(e) === null || getYear(e) === undefined) return false;
    if (filters.source !== 'all' && getSrc(e) !== filters.source) return false;
    if (filters.type !== 'all' && getType(e) !== filters.type) return false;
    return true;
  });

  const activeSources = SOURCE_ORDER.filter(s => {
    if (filters.source !== 'all') return s === filters.source;
    return filteredEvents.some(e => getSrc(e) === s);
  });

  const totalHeight = HEADER_HEIGHT + PADDING_Y + activeSources.length * (LANE_HEIGHT + LANE_GAP);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(entries => {
      const { width } = entries[0].contentRect;
      setDimensions({ w: width, h: Math.max(totalHeight + 60, 350) });
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [totalHeight]);

  const yearToX = useCallback((year) => {
    const st = stateRef.current;
    const contentWidth = dimensions.w - PADDING_X * 2;
    return PADDING_X + ((year - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * contentWidth * st.scale + st.offsetX;
  }, [dimensions.w]);

  const xToYear = useCallback((x) => {
    const st = stateRef.current;
    const contentWidth = dimensions.w - PADDING_X * 2;
    return Math.round(MIN_YEAR + ((x - PADDING_X - st.offsetX) / (contentWidth * st.scale)) * (MAX_YEAR - MIN_YEAR));
  }, [dimensions.w]);

  const laneY = useCallback((srcShort) => {
    const idx = activeSources.indexOf(srcShort);
    if (idx === -1) return -100;
    return HEADER_HEIGHT + PADDING_Y + idx * (LANE_HEIGHT + LANE_GAP) + LANE_HEIGHT / 2;
  }, [activeSources]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const { w, h } = dimensions;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = 'rgba(15,13,10,0.01)';
    ctx.fillRect(0, 0, w, h);

    const st = stateRef.current;
    const visMinYear = xToYear(0);
    const visMaxYear = xToYear(w);
    const yearSpan = visMaxYear - visMinYear;

    let gridStep = 100;
    if (yearSpan < 80) gridStep = 5;
    else if (yearSpan < 200) gridStep = 10;
    else if (yearSpan < 400) gridStep = 25;
    else if (yearSpan < 600) gridStep = 50;

    ctx.strokeStyle = 'rgba(212,168,72,0.06)';
    ctx.lineWidth = 0.5;
    ctx.font = '10px "Crimson Pro", serif';
    ctx.fillStyle = 'rgba(138,126,108,0.7)';
    ctx.textAlign = 'center';

    for (let y = Math.ceil(MIN_YEAR / gridStep) * gridStep; y <= MAX_YEAR; y += gridStep) {
      const x = yearToX(y);
      if (x < 20 || x > w - 20) continue;
      ctx.beginPath();
      ctx.moveTo(x, HEADER_HEIGHT);
      ctx.lineTo(x, h);
      ctx.stroke();
      ctx.fillText(y.toString(), x, HEADER_HEIGHT - 8);
    }

    activeSources.forEach((src, i) => {
      const y = HEADER_HEIGHT + PADDING_Y + i * (LANE_HEIGHT + LANE_GAP);
      ctx.fillStyle = 'rgba(42,33,24,0.3)';
      ctx.beginPath();
      ctx.roundRect(4, y, w - 8, LANE_HEIGHT, 6);
      ctx.fill();

      ctx.fillStyle = srcColors[src] || '#888';
      ctx.font = 'bold 11px "Crimson Pro", serif';
      ctx.textAlign = 'left';
      ctx.fillText(srcNames[src] || src, 8, y + LANE_HEIGHT / 2 + 4);
    });

    const hovered = st.hoveredEvent;
    filteredEvents.forEach(ev => {
      const x = yearToX(getYear(ev));
      if (x < -10 || x > w + 10) return;
      const y = laneY(getSrc(ev));
      if (y < 0) return;

      const loc = getLoc(ev) || '';
      const hash = (getYear(ev) * 31 + loc.charCodeAt(0)) % 100;
      const jitterY = ((hash / 100) - 0.5) * (LANE_HEIGHT - 16);

      const isHovered = hovered && getTitle(hovered) === getTitle(ev) && getYear(hovered) === getYear(ev) && getSrc(hovered) === getSrc(ev);
      const color = srcColors[getSrc(ev)] || '#888';

      ctx.beginPath();
      ctx.arc(x, y + jitterY, isHovered ? DOT_RADIUS * 2 : (getCluster(ev) ? DOT_RADIUS + 1 : DOT_RADIUS), 0, Math.PI * 2);
      ctx.fillStyle = isHovered ? '#d4a848' : color;
      ctx.globalAlpha = isHovered ? 1 : (getCluster(ev) ? 0.9 : 0.6);
      ctx.fill();

      if (getCluster(ev)) {
        ctx.strokeStyle = '#d4a848';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    });

    // Mini-map
    const mmW = 120, mmH = 20, mmX = w - mmW - 10, mmY = 8;
    ctx.fillStyle = 'rgba(26,22,18,0.8)';
    ctx.strokeStyle = 'rgba(212,168,72,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(mmX, mmY, mmW, mmH, 4);
    ctx.fill();
    ctx.stroke();

    const vStart = Math.max(0, ((visMinYear - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * mmW);
    const vEnd = Math.min(mmW, ((visMaxYear - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * mmW);
    ctx.fillStyle = 'rgba(212,168,72,0.3)';
    ctx.beginPath();
    ctx.roundRect(mmX + vStart, mmY + 2, Math.max(8, vEnd - vStart), mmH - 4, 2);
    ctx.fill();
  }, [dimensions, filteredEvents, activeSources, yearToX, xToYear, laneY, srcColors, srcNames]);

  useEffect(() => {
    const loop = () => { draw(); rafRef.current = requestAnimationFrame(loop); };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const st = stateRef.current;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const yearAtMouse = xToYear(mouseX);
    const delta = e.deltaY > 0 ? 0.85 : 1.18;
    const newScale = Math.max(0.5, Math.min(20, st.scale * delta));
    const contentWidth = dimensions.w - PADDING_X * 2;
    st.scale = newScale;
    st.offsetX = mouseX - PADDING_X - ((yearAtMouse - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * contentWidth * newScale;
  }, [dimensions.w, xToYear]);

  const handleMouseDown = useCallback((e) => {
    const st = stateRef.current;
    st.dragging = true;
    st.dragStartX = e.clientX;
    st.dragOffsetX = st.offsetX;
    canvasRef.current.style.cursor = 'grabbing';
  }, []);

  const handleMouseMove = useCallback((e) => {
    const st = stateRef.current;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (st.dragging) {
      st.offsetX = st.dragOffsetX + (e.clientX - st.dragStartX);
      setTooltip(null);
      return;
    }

    let found = null;
    for (const ev of filteredEvents) {
      const x = yearToX(getYear(ev));
      if (Math.abs(x - mouseX) > 8) continue;
      const y = laneY(getSrc(ev));
      if (y < 0) continue;
      const loc = getLoc(ev) || '';
      const hash = (getYear(ev) * 31 + loc.charCodeAt(0)) % 100;
      const jitterY = ((hash / 100) - 0.5) * (LANE_HEIGHT - 16);
      if (Math.abs((y + jitterY) - mouseY) < 8) { found = ev; break; }
    }

    st.hoveredEvent = found;
    canvas.style.cursor = found ? 'pointer' : 'grab';

    if (found) {
      setTooltip({
        x: mouseX, y: mouseY,
        title: getTitle(found), year: getYear(found), source: srcNames[getSrc(found)],
        location: getLoc(found), type: eventTypeLabels[getType(found)] || getType(found),
        color: srcColors[getSrc(found)],
      });
    } else {
      setTooltip(null);
    }
  }, [filteredEvents, yearToX, laneY, srcColors, srcNames, eventTypeLabels]);

  const handleMouseUp = useCallback(() => {
    stateRef.current.dragging = false;
    if (canvasRef.current) canvasRef.current.style.cursor = 'grab';
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  useEffect(() => {
    function handleKey(e) {
      const st = stateRef.current;
      if (e.key === 'ArrowLeft') { st.offsetX += 60; e.preventDefault(); }
      else if (e.key === 'ArrowRight') { st.offsetX -= 60; e.preventDefault(); }
      else if (e.key === '+' || e.key === '=') { st.scale = Math.min(20, st.scale * 1.2); e.preventDefault(); }
      else if (e.key === '-') { st.scale = Math.max(0.5, st.scale * 0.83); e.preventDefault(); }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const exportPNG = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'salibiyyat-timeline.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, []);

  return (
    <div ref={containerRef} className="sal-glass-card sal-canvas-timeline-wrap">
      <button onClick={exportPNG} className="sal-canvas-export-btn" title="Export as PNG">
        📷 PNG
      </button>
      <canvas
        ref={canvasRef}
        style={{ cursor: 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { stateRef.current.dragging = false; setTooltip(null); }}
      />
      {tooltip && (
        <div
          className="sal-canvas-tooltip"
          style={{ left: Math.min(tooltip.x + 14, (containerRef.current?.clientWidth || 800) - 240), top: Math.max(tooltip.y - 60, 8) }}
        >
          <div className="sal-canvas-tooltip__title">{tooltip.title}</div>
          <div className="sal-canvas-tooltip__source">
            <div className="sal-canvas-tooltip__dot" style={{ background: tooltip.color }} />
            <span>{tooltip.source}</span>
          </div>
          <div className="sal-canvas-tooltip__meta">{tooltip.year} · {tooltip.location} · {tooltip.type}</div>
        </div>
      )}
    </div>
  );
}

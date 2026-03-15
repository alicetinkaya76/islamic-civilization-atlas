/**
 * ToursEditor — Tur düzenleyici (durak sıralama, ekleme/silme)
 * v5.2.0.0
 */
import { useState, useCallback } from 'react';
import { useAdmin } from '../AdminContext';

function StopEditor({ stop, index, onChange, onRemove, onMove, total }) {
  const update = (key, val) => onChange(index, { ...stop, [key]: val });

  return (
    <div className="admin-tour-stop">
      <div className="admin-tour-stop-header">
        <span className="admin-tour-stop-num">{index + 1}.</span>
        <input className="admin-input admin-input-inline" value={stop.title_tr || ''}
          onChange={e => update('title_tr', e.target.value)} placeholder="Başlık (TR)" />
        <div className="admin-tour-stop-actions">
          <button className="admin-btn-icon" disabled={index === 0} onClick={() => onMove(index, -1)} title="Yukarı">↑</button>
          <button className="admin-btn-icon" disabled={index === total - 1} onClick={() => onMove(index, 1)} title="Aşağı">↓</button>
          <button className="admin-btn-icon danger" onClick={() => onRemove(index)} title="Sil">×</button>
        </div>
      </div>
      <div className="admin-tour-stop-body">
        <div className="admin-tri-wrap">
          <div className="admin-tri-col">
            <div className="admin-tri-label"><span>Başlık TR</span></div>
            <input className="admin-input" value={stop.title_tr || ''} onChange={e => update('title_tr', e.target.value)} />
          </div>
          <div className="admin-tri-col">
            <div className="admin-tri-label"><span>Title EN</span></div>
            <input className="admin-input" value={stop.title_en || ''} onChange={e => update('title_en', e.target.value)} />
          </div>
          <div className="admin-tri-col">
            <div className="admin-tri-label"><span>العنوان AR</span></div>
            <input className="admin-input rtl" dir="rtl" value={stop.title_ar || ''} onChange={e => update('title_ar', e.target.value)} />
          </div>
        </div>
        <div className="admin-tri-wrap">
          <div className="admin-tri-col">
            <div className="admin-tri-label"><span>Metin TR</span></div>
            <textarea className="admin-input admin-textarea" rows={3} value={stop.text_tr || ''}
              onChange={e => update('text_tr', e.target.value)} />
          </div>
          <div className="admin-tri-col">
            <div className="admin-tri-label"><span>Text EN</span></div>
            <textarea className="admin-input admin-textarea" rows={3} value={stop.text_en || ''}
              onChange={e => update('text_en', e.target.value)} />
          </div>
          <div className="admin-tri-col">
            <div className="admin-tri-label"><span>النص AR</span></div>
            <textarea className="admin-input admin-textarea rtl" rows={3} dir="rtl" value={stop.text_ar || ''}
              onChange={e => update('text_ar', e.target.value)} />
          </div>
        </div>
        <div className="admin-tour-stop-meta">
          <label>Lat <input className="admin-input admin-input-sm" type="number" step="0.01" value={stop.lat || ''} onChange={e => update('lat', +e.target.value)} /></label>
          <label>Lon <input className="admin-input admin-input-sm" type="number" step="0.01" value={stop.lon || ''} onChange={e => update('lon', +e.target.value)} /></label>
          <label>Zoom <input className="admin-input admin-input-sm" type="number" value={stop.zoom || ''} onChange={e => update('zoom', +e.target.value)} /></label>
          <label>Yıl <input className="admin-input admin-input-sm" type="number" value={stop.year || ''} onChange={e => update('year', +e.target.value)} /></label>
        </div>
      </div>
    </div>
  );
}

function TourCard({ tour, tourIndex, onUpdate, onDelete }) {
  const [open, setOpen] = useState(false);

  const update = (key, val) => onUpdate(tourIndex, { ...tour, [key]: val });
  const updateStop = (stopIdx, newStop) => {
    const stops = [...tour.stops];
    stops[stopIdx] = newStop;
    update('stops', stops);
  };
  const addStop = () => {
    update('stops', [...(tour.stops || []), {
      title_tr: '', title_en: '', title_ar: '',
      text_tr: '', text_en: '', text_ar: '',
      lat: 30, lon: 42, zoom: 5, year: 800
    }]);
  };
  const removeStop = (idx) => update('stops', tour.stops.filter((_, i) => i !== idx));
  const moveStop = (idx, dir) => {
    const stops = [...tour.stops];
    const newIdx = idx + dir;
    [stops[idx], stops[newIdx]] = [stops[newIdx], stops[idx]];
    update('stops', stops);
  };

  return (
    <div className="admin-tour-card">
      <div className="admin-tour-card-header" onClick={() => setOpen(!open)}>
        <span className="admin-tour-icon">{tour.icon || '🛤'}</span>
        <span className="admin-tour-title">{tour.title_tr || tour.id}</span>
        <span className="admin-tour-stops-count">{tour.stops?.length || 0} durak</span>
        <span className="admin-tour-toggle">{open ? '▼' : '►'}</span>
        <button className="admin-btn-icon danger" onClick={(e) => { e.stopPropagation(); onDelete(tourIndex); }} title="Turu Sil">🗑</button>
      </div>
      {open && (
        <div className="admin-tour-card-body">
          <div className="admin-tour-meta">
            <div className="admin-field-group">
              <label className="admin-label">ID</label>
              <input className="admin-input" value={tour.id || ''} onChange={e => update('id', e.target.value)} />
            </div>
            <div className="admin-field-group">
              <label className="admin-label">Icon</label>
              <input className="admin-input admin-input-sm" value={tour.icon || ''} onChange={e => update('icon', e.target.value)} />
            </div>
          </div>
          <div className="admin-tri-wrap">
            <div className="admin-tri-col">
              <div className="admin-tri-label"><span>Başlık TR</span></div>
              <input className="admin-input" value={tour.title_tr || ''} onChange={e => update('title_tr', e.target.value)} />
            </div>
            <div className="admin-tri-col">
              <div className="admin-tri-label"><span>Title EN</span></div>
              <input className="admin-input" value={tour.title_en || ''} onChange={e => update('title_en', e.target.value)} />
            </div>
            <div className="admin-tri-col">
              <div className="admin-tri-label"><span>العنوان AR</span></div>
              <input className="admin-input rtl" dir="rtl" value={tour.title_ar || ''} onChange={e => update('title_ar', e.target.value)} />
            </div>
          </div>
          <div className="admin-tri-wrap">
            <div className="admin-tri-col">
              <div className="admin-tri-label"><span>Açıklama TR</span></div>
              <textarea className="admin-input admin-textarea" rows={2} value={tour.desc_tr || ''} onChange={e => update('desc_tr', e.target.value)} />
            </div>
            <div className="admin-tri-col">
              <div className="admin-tri-label"><span>Description EN</span></div>
              <textarea className="admin-input admin-textarea" rows={2} value={tour.desc_en || ''} onChange={e => update('desc_en', e.target.value)} />
            </div>
            <div className="admin-tri-col">
              <div className="admin-tri-label"><span>الوصف AR</span></div>
              <textarea className="admin-input admin-textarea rtl" rows={2} dir="rtl" value={tour.desc_ar || ''} onChange={e => update('desc_ar', e.target.value)} />
            </div>
          </div>

          <h4 className="admin-sub-title">Duraklar ({tour.stops?.length || 0})</h4>
          {(tour.stops || []).map((stop, i) => (
            <StopEditor key={i} stop={stop} index={i} total={tour.stops.length}
              onChange={updateStop} onRemove={removeStop} onMove={moveStop} />
          ))}
          <button className="admin-btn admin-btn-sm" onClick={addStop}>+ Durak Ekle</button>
        </div>
      )}
    </div>
  );
}

export default function ToursEditor() {
  const { tours, setTours, logChange } = useAdmin();

  const updateTour = useCallback((idx, newTour) => {
    setTours(prev => prev.map((t, i) => i === idx ? newTour : t));
    logChange('update', 'tours', newTour.id || idx, '*', '…', 'updated');
  }, [setTours, logChange]);

  const deleteTour = useCallback((idx) => {
    if (!confirm('Bu tur silinecek. Emin misiniz?')) return;
    setTours(prev => prev.filter((_, i) => i !== idx));
    logChange('delete', 'tours', idx, '*', 'deleted', null);
  }, [setTours, logChange]);

  const addTour = useCallback(() => {
    setTours(prev => [...prev, {
      id: 'new-tour-' + Date.now(), icon: '🛤',
      title_tr: 'Yeni Tur', title_en: 'New Tour', title_ar: '',
      desc_tr: '', desc_en: '', desc_ar: '',
      stops: []
    }]);
    logChange('add', 'tours', '—', '*', null, 'new');
  }, [setTours, logChange]);

  return (
    <div className="admin-tours-editor">
      <div className="admin-entity-header">
        <h2 className="admin-section-title">🛤 Turlar ({tours.length})</h2>
        <button className="admin-btn admin-btn-primary" onClick={addTour}>+ Yeni Tur</button>
      </div>
      {tours.map((tour, i) => (
        <TourCard key={tour.id || i} tour={tour} tourIndex={i}
          onUpdate={updateTour} onDelete={deleteTour} />
      ))}
    </div>
  );
}

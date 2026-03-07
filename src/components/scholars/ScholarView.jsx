import { useState, useMemo, useCallback } from 'react';
import DB from '../../data/db.json';
import SCHOLAR_META from '../../data/scholar_meta';
import SCHOLAR_LINKS from '../../data/scholar_links';
import SCHOLAR_IDENTITY from '../../data/scholar_identity';
import ScholarNetwork, { DISC_COLORS } from './ScholarNetwork';
import ScholarTimeline from './ScholarTimeline';
import { lf } from '../../hooks/useEntityLookup';
import '../../styles/scholars.css';

const discColor = d => DISC_COLORS[d] || '#c9a84c';

const ALL_DISCS = [
  'Fıkıh', 'Hadis', 'Tefsir', 'Kelam', 'Tasavvuf',
  'Tıp', 'Matematik & Astronomi', 'Coğrafya & Seyahat',
  'Tarih', 'Dil & Edebiyat', 'Kıraat', 'Mimari & Sanat',
  'Çağdaş İslam Düşüncesi',
];

const DISC_EN = {
  'Fıkıh':'Islamic Law', 'Hadis':'Hadith', 'Tefsir':'Exegesis',
  'Kelam':'Theology', 'Tasavvuf':'Sufism', 'Tıp':'Medicine',
  'Matematik & Astronomi':'Math & Astronomy', 'Coğrafya & Seyahat':'Geography',
  'Tarih':'History', 'Dil & Edebiyat':'Literature', 'Kıraat':'Recitation',
  'Mimari & Sanat':'Architecture', 'Çağdaş İslam Düşüncesi':'Modern Thought',
};

export default function ScholarView({ lang, t }) {
  const [view, setView] = useState('network'); // 'network' | 'timeline'
  const [activeDiscs, setActiveDiscs] = useState(new Set(ALL_DISCS));
  const [periodYear, setPeriodYear] = useState(2025);
  const [linkFilter, setLinkFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [showLinks, setShowLinks] = useState(true);
  const [showIdCard, setShowIdCard] = useState(false);

  const ts = t.scholars || {};

  // Merge scholars with metadata
  const allScholars = useMemo(() =>
    DB.scholars.map(s => ({ ...s, ...(SCHOLAR_META[s.id] || {}) })),
  []);

  // Filter scholars
  const filtered = useMemo(() => {
    let arr = allScholars.filter(s => s.disc_tr); // need disc_tr
    // Discipline filter
    if (activeDiscs.size < ALL_DISCS.length) {
      arr = arr.filter(s => activeDiscs.has(s.disc_tr));
    }
    // Period filter
    arr = arr.filter(s => s.b <= periodYear);
    // Search filter
    if (search) {
      const q = search.toLowerCase();
      arr = arr.filter(s =>
        (s.tr || '').toLowerCase().includes(q) ||
        (s.en || '').toLowerCase().includes(q)
      );
    }
    return arr;
  }, [allScholars, activeDiscs, periodYear, search]);

  // Filter links
  const filteredLinks = useMemo(() => {
    let arr = SCHOLAR_LINKS;
    if (linkFilter) arr = arr.filter(l => l.type === linkFilter);
    return arr;
  }, [linkFilter]);

  // Search: find matching id for centering
  const searchId = useMemo(() => {
    if (!search) return null;
    const q = search.toLowerCase();
    const match = allScholars.find(s =>
      (s.tr || '').toLowerCase().includes(q) ||
      (s.en || '').toLowerCase().includes(q)
    );
    return match?.id || null;
  }, [search, allScholars]);

  // Selected scholar
  const sel = useMemo(() => {
    if (!selectedId) return null;
    return allScholars.find(s => s.id === selectedId) || null;
  }, [selectedId, allScholars]);

  // Teachers/Students of selected
  const teachers = useMemo(() => {
    if (!sel) return [];
    return SCHOLAR_LINKS
      .filter(l => l.target === sel.id && l.type === 'teacher')
      .map(l => allScholars.find(s => s.id === l.source))
      .filter(Boolean);
  }, [sel, allScholars]);

  const students = useMemo(() => {
    if (!sel) return [];
    return SCHOLAR_LINKS
      .filter(l => l.source === sel.id && l.type === 'teacher')
      .map(l => allScholars.find(s => s.id === l.target))
      .filter(Boolean);
  }, [sel, allScholars]);

  const toggleDisc = (disc) => {
    setActiveDiscs(prev => {
      const next = new Set(prev);
      if (next.has(disc)) next.delete(disc);
      else next.add(disc);
      return next;
    });
  };
  const selectAll = () => setActiveDiscs(new Set(ALL_DISCS));

  const handleSelect = useCallback((id) => {
    setSelectedId(id);
  }, []);

  // Disc pills that actually exist in the data
  const existingDiscs = useMemo(() =>
    ALL_DISCS.filter(d => allScholars.some(s => s.disc_tr === d)),
  [allScholars]);

  return (
    <div className="scholar-view">
      {/* Toolbar */}
      <div className="scholar-toolbar">
        {/* View toggle */}
        <div className="scholar-view-toggle">
          <button className={`scholar-view-btn${view === 'network' ? ' active' : ''}`}
            onClick={() => setView('network')}>
            🕸 {ts.networkView || 'Network'}
          </button>
          <button className={`scholar-view-btn${view === 'timeline' ? ' active' : ''}`}
            onClick={() => setView('timeline')}>
            📊 {ts.timelineView || 'Timeline'}
          </button>
        </div>

        <div className="scholar-toolbar-sep" />

        {/* Discipline pills */}
        <div className="scholar-disc-pills">
          <button className={`disc-pill${activeDiscs.size === ALL_DISCS.length ? ' active' : ''}`}
            style={{ color: '#c9a84c' }} onClick={selectAll}>
            {ts.allDisc || 'All'}
          </button>
          {existingDiscs.map(disc => (
            <button key={disc}
              className={`disc-pill${activeDiscs.has(disc) ? ' active' : ''}`}
              style={{ color: discColor(disc) }}
              onClick={() => toggleDisc(disc)}>
              {lang === 'tr' ? disc : (DISC_EN[disc] || disc)}
            </button>
          ))}
        </div>

        <div className="scholar-toolbar-sep" />

        {/* Period slider */}
        <div className="scholar-toolbar-grp">
          <span className="scholar-toolbar-label">{ts.period || 'Period'}:</span>
          <input type="range" className="scholar-period-slider"
            min={622} max={2025} value={periodYear}
            onChange={e => setPeriodYear(+e.target.value)} />
          <span className="scholar-toolbar-label" style={{ minWidth: 32 }}>{periodYear}</span>
        </div>

        <div className="scholar-toolbar-sep" />

        {/* Link filter */}
        <select className="scholar-link-sel" value={linkFilter}
          onChange={e => setLinkFilter(e.target.value)}>
          <option value="">{ts.all || 'All'}</option>
          <option value="teacher">{ts.teacher || 'Teacher'}</option>
          <option value="influence">{ts.influence || 'Influence'}</option>
          <option value="debate">{ts.debate || 'Debate'}</option>
        </select>

        {/* Show links toggle (timeline) */}
        {view === 'timeline' && (
          <button className={`scholar-show-links-btn${showLinks ? ' active' : ''}`}
            onClick={() => setShowLinks(p => !p)}>
            🔗 {ts.showLinks || 'Links'}
          </button>
        )}

        {/* Search */}
        <input className="scholar-search" type="text" value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={`🔍 ${ts.searchPlaceholder || 'Search...'}`} />

        <span className="scholar-stats">
          {filtered.length} / {allScholars.length}
        </span>
      </div>

      {/* Main area */}
      <div className="scholar-main">
        {/* D3 view */}
        {view === 'network' ? (
          <ScholarNetwork
            scholars={filtered}
            links={filteredLinks}
            lang={lang}
            selected={selectedId}
            onSelect={handleSelect}
            searchId={searchId}
            t={t}
          />
        ) : (
          <ScholarTimeline
            scholars={filtered}
            links={filteredLinks}
            lang={lang}
            selected={selectedId}
            onSelect={handleSelect}
            showLinks={showLinks}
          />
        )}

        {/* Detail panel */}
        <div className="scholar-detail">
          {!sel ? (
            <div className="scholar-detail-empty">
              {ts.noSelection || 'Click a scholar to see details'}
            </div>
          ) : (
            <>
              <span className="scholar-detail-disc"
                style={{ color: discColor(sel.disc_tr), background: discColor(sel.disc_tr) + '22' }}>
                ● {lang === 'tr' ? sel.disc_tr : (sel.disc_en || sel.disc_tr)}
              </span>
              <div className="scholar-detail-name">{sel.tr}</div>
              <div className="scholar-detail-en">{sel.en}</div>
              <div className="scholar-detail-dates">
                {sel.b} – {sel.d}
                {(sel.city_tr || sel.city_en) && (
                  <> · {lang === 'tr' ? sel.city_tr : sel.city_en}</>
                )}
              </div>

              {/* Identity Card Toggle */}
              {SCHOLAR_IDENTITY[sel.id] && (
                <button
                  className={`scholar-idcard-toggle${showIdCard ? ' active' : ''}`}
                  onClick={() => setShowIdCard(p => !p)}
                >
                  🪪 {ts.idCardToggle || 'Identity Card'}
                </button>
              )}

              {/* Identity Card */}
              {showIdCard && SCHOLAR_IDENTITY[sel.id] && (() => {
                const card = SCHOLAR_IDENTITY[sel.id];
                const lk = lang === 'tr' ? '_tr' : '_en';
                const rows = [
                  ['idLaqab',      card['laqab' + lk]],
                  ['idKunya',      card['kunya' + lk]],
                  ['idNisba',      card['nisba' + lk]],
                  ['idTabaqa',     card['tabaqa' + lk]],
                  ['idBirthDate',  card['birthDate' + lk]],
                  ['idBirthPlace', card['birthPlace' + lk]],
                  ['idDeathDate',  card['deathDate' + lk]],
                  ['idDeathPlace', card['deathPlace' + lk]],
                  ['idGrave',      card['grave' + lk]],
                  ['idFather',     card['father' + lk]],
                  ['idMother',     card['mother' + lk]],
                  ['idSpouses',    card['spouses' + lk]],
                  ['idChildren',   card['children' + lk]],
                  ['idPredecessor',card['predecessor' + lk]],
                  ['idSuccessor',  card['successor' + lk]],
                  ['idCreed',      card['creed' + lk]],
                  ['idFiqh',       card['fiqh' + lk]],
                  ['idPosition',   card['position' + lk]],
                  ['idInstitutions', card['institutions' + lk]],
                  ['idTeachers',   card['teachers_txt' + lk]],
                  ['idStudents',   card['students_txt' + lk]],
                  ['idReign',      card['reignPeriod' + lk]],
                ];
                return (
                  <div className="scholar-idcard">
                    <div className="scholar-idcard-header">
                      <span className="scholar-idcard-icon">🪪</span>
                      <span>{ts.idCard || 'Identity Card'}</span>
                    </div>
                    <table className="scholar-idcard-table">
                      <tbody>
                        {rows.map(([key, val]) =>
                          val && val !== '—' ? (
                            <tr key={key}>
                              <td className="scholar-idcard-label">{ts[key] || key}</td>
                              <td className="scholar-idcard-value">{val}</td>
                            </tr>
                          ) : null
                        )}
                      </tbody>
                    </table>
                    {card.diaRef && (
                      <a className="scholar-idcard-dia"
                        href={card.diaRef} target="_blank" rel="noopener noreferrer">
                        📖 {ts.idDiaRef || 'DİA Entry'} ↗
                      </a>
                    )}
                  </div>
                );
              })()}

              <hr className="scholar-detail-hr" />

              {/* Works */}
              {sel.works_tr && (
                <div className="scholar-detail-section">
                  <div className="scholar-detail-label">{ts.works || 'Major Works'}</div>
                  <div className="scholar-detail-works">{sel.works_tr}</div>
                </div>
              )}

              {/* Teachers */}
              {teachers.length > 0 && (
                <div className="scholar-detail-section">
                  <div className="scholar-detail-label">{ts.teachers || 'Teachers'}</div>
                  <div className="scholar-detail-links-list">
                    {teachers.map(t2 => (
                      <button key={t2.id} className="scholar-detail-link-chip"
                        onClick={() => setSelectedId(t2.id)}>
                        {lang === 'tr' ? t2.tr : t2.en}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Students */}
              {students.length > 0 && (
                <div className="scholar-detail-section">
                  <div className="scholar-detail-label">{ts.students || 'Students'}</div>
                  <div className="scholar-detail-links-list">
                    {students.map(st => (
                      <button key={st.id} className="scholar-detail-link-chip"
                        onClick={() => setSelectedId(st.id)}>
                        {lang === 'tr' ? st.tr : st.en}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <hr className="scholar-detail-hr" />

              {/* Narrative */}
              {(sel.narr_tr || sel.narr_en) && (
                <div className="scholar-detail-section">
                  <div className="scholar-narr">
                    {lf(sel, 'narr', lang)}
                  </div>
                </div>
              )}

              {/* Chain */}
              {(sel.chain_tr || sel.chain_en) && (
                <div className="scholar-detail-section">
                  <div className="scholar-detail-label">{ts.chain || t.m?.chain || 'Influence Chain'}</div>
                  <div className="scholar-detail-works" style={{ fontSize: 11, color: '#c4b89a' }}>
                    {lf(sel, 'chain', lang)}
                  </div>
                </div>
              )}

              {/* DİA Attribution */}
              {SCHOLAR_IDENTITY[sel.id] && (
                <div className="scholar-dia-attribution">
                  <span className="scholar-dia-attribution-icon">📚</span>
                  <span>
                    {lang === 'tr'
                      ? 'Biyografik veriler: TDV İslâm Ansiklopedisi (DİA)'
                      : 'Biographical data: TDV Encyclopedia of Islam (DİA)'}
                  </span>
                  <a href="https://islamansiklopedisi.org.tr" target="_blank" rel="noopener noreferrer"
                    className="scholar-dia-attribution-link">
                    islamansiklopedisi.org.tr ↗
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

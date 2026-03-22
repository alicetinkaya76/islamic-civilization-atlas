import { useState, useEffect } from 'react';
import T from '../../data/i18n';
import '../../styles/about.css';

const STATS = [
  { icon: '🏛', key: 'dynasties', count: '186' },
  { icon: '📖', key: 'alam', count: '13,940' },
  { icon: '📚', key: 'dia', count: '8,528' },
  { icon: '📕', key: 'ei1', count: '7,568' },
  { icon: '🌍', key: 'yaqut', count: '12,954' },
];

const SOURCES = [
  { name: 'Bosworth, C.E.', work: 'The New Islamic Dynasties', detail: '186 dynasties, 632–1924 CE' },
  { name: 'al-Ziriklī, Khayr al-Dīn', work: 'al-Aʿlām', detail: '13,940 bios, 8th ed.' },
  { name: 'TDV İslam Ansiklopedisi', work: 'DİA', detail: '8,528 scholar bios, 44 vols.' },
  { name: 'Brill', work: 'Encyclopaedia of Islam, 1st ed.', detail: '7,568 entries' },
  { name: 'Yāqūt al-Ḥamawī', work: "Muʿjam al-Buldān", detail: '12,954 geographic entries' },
];

const TECH = ['React', 'Vite', 'Leaflet', 'D3.js', 'Three.js'];

export default function AboutModal({ lang, onResetOnboarding, onResetLanding, externalOpen, onExternalClose }) {
  const [open, setOpen] = useState(false);
  const t = T[lang];

  useEffect(() => {
    if (externalOpen) { setOpen(true); onExternalClose?.(); }
  }, [externalOpen, onExternalClose]);

  const labels = {
    tr: {
      stats: 'Proje İstatistikleri', sources: 'Veri Kaynakları', tech: 'Teknoloji',
      version: 'Versiyon', authors: 'Yazarlar', license: 'Lisans',
      dynasties: 'Hanedan', alam: 'el-Aʿlâm', dia: 'DİA Biyografi',
      ei1: 'EI-1 Makale', yaqut: 'Muʿcem Kaydı', affiliations: 'Kurumsal Bağlantılar',
    },
    en: {
      stats: 'Project Statistics', sources: 'Data Sources', tech: 'Technology',
      version: 'Version', authors: 'Authors', license: 'License',
      dynasties: 'Dynasties', alam: 'al-Aʿlām', dia: 'DİA Biographies',
      ei1: 'EI-1 Articles', yaqut: 'Muʿjam Entries', affiliations: 'Affiliations',
    },
    ar: {
      stats: 'إحصائيات المشروع', sources: 'مصادر البيانات', tech: 'التقنية',
      version: 'الإصدار', authors: 'المؤلفون', license: 'الرخصة',
      dynasties: 'السلالات', alam: 'الأعلام', dia: 'تراجم DİA',
      ei1: 'مقالات EI-1', yaqut: 'معجم البلدان', affiliations: 'الانتماءات',
    },
  };
  const L = labels[lang] || labels.en;

  return (
    <>
      <button className="about-btn" onClick={() => setOpen(true)}>
        ℹ {t.about.btn}
      </button>
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="about-modal-rich" onClick={e => e.stopPropagation()}>
            <button className="about-close" onClick={() => setOpen(false)}>✕</button>

            {/* Header */}
            <div className="about-header">
              <div className="about-logo">☪</div>
              <h2 className="about-title">{t.about.title}</h2>
              <p className="about-subtitle">{t.about.desc1}</p>
            </div>

            {/* Stats Grid */}
            <div className="about-section">
              <h3 className="about-section-title">{L.stats}</h3>
              <div className="about-stats-grid">
                {STATS.map(s => (
                  <div key={s.key} className="about-stat-card">
                    <span className="about-stat-icon">{s.icon}</span>
                    <span className="about-stat-count">{s.count}</span>
                    <span className="about-stat-label">{L[s.key]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Data Sources */}
            <div className="about-section">
              <h3 className="about-section-title">{L.sources}</h3>
              <div className="about-sources-list">
                {SOURCES.map((src, i) => (
                  <div key={i} className="about-source-row">
                    <div className="about-source-name">{src.name}</div>
                    <div className="about-source-work">{src.work}</div>
                    <div className="about-source-detail">{src.detail}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Authors */}
            <div className="about-section">
              <h3 className="about-section-title">{L.authors}</h3>
              <div className="about-authors">
                <div className="about-author-card">
                  <div className="about-author-name">
                    Dr. Hüseyin Gökalp
                    <a href="https://orcid.org/0000-0001-6796-5765" target="_blank" rel="noopener noreferrer" className="about-orcid" title="ORCID">
                      <img src="https://orcid.org/sites/default/files/images/orcid_16x16.png" alt="ORCID" width="14" height="14" />
                    </a>
                  </div>
                  <div className="about-author-role">{t.about.gokalp}</div>
                </div>
                <div className="about-author-card">
                  <div className="about-author-name">
                    Dr. Ali Çetinkaya
                    <a href="https://orcid.org/0000-0002-7747-6854" target="_blank" rel="noopener noreferrer" className="about-orcid" title="ORCID">
                      <img src="https://orcid.org/sites/default/files/images/orcid_16x16.png" alt="ORCID" width="14" height="14" />
                    </a>
                  </div>
                  <div className="about-author-role">{t.about.cetinkaya}</div>
                </div>
              </div>
            </div>

            {/* Affiliations */}
            <div className="about-section">
              <h3 className="about-section-title">{L.affiliations}</h3>
              <div className="about-affiliations">
                <span className="about-affil-badge">🎓 Selçuk Üniversitesi</span>
                <span className="about-affil-badge">💡 Kapsül Teknoloji Platformu</span>
              </div>
            </div>

            {/* Tech + Version */}
            <div className="about-section about-section-row">
              <div className="about-tech">
                <h3 className="about-section-title">{L.tech}</h3>
                <div className="about-tech-tags">
                  {TECH.map(t => <span key={t} className="about-tech-tag">{t}</span>)}
                </div>
              </div>
              <div className="about-version">
                <h3 className="about-section-title">{L.version}</h3>
                <div className="about-version-info">
                  <span className="about-ver-badge">v6.5.3.0</span>
                  <a href="https://github.com/alicetinkaya76/islamic-civilization-atlas" target="_blank" rel="noopener noreferrer" className="about-github-link">
                    GitHub ↗
                  </a>
                </div>
              </div>
            </div>

            {/* License */}
            <div className="about-license-bar">
              <span>📄 CC BY-NC 4.0</span>
              <span className="about-license-text">{t.about.license}</span>
            </div>

            {/* Action buttons */}
            <div className="about-actions">
              {onResetOnboarding && (
                <button className="about-action-btn" onClick={() => { onResetOnboarding(); setOpen(false); }}>
                  🗺 {t.about.showGuide}
                </button>
              )}
              {onResetLanding && (
                <button className="about-action-btn" onClick={() => { onResetLanding(); setOpen(false); }}>
                  ☪ {t.about.showLanding}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

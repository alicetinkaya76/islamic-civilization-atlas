import { useState } from 'react';
import T from '../../data/i18n';

const CITATIONS = {
  apa: `Gökalp, H. & Çetinkaya, A. (2026). Islamic Dynasties Atlas Dataset: Bosworth's Islamic Dynasties Database (632–1924 CE) [Data set]. Zenodo. https://doi.org/10.5281/zenodo.18818238`,

  bibtex: `@misc{gokalp_cetinkaya_2026,
  author       = {Gökalp, Hüseyin and Çetinkaya, Ali},
  title        = {Islamic Dynasties Atlas Dataset: Bosworth's Islamic Dynasties Database (632--1924 CE)},
  year         = {2026},
  publisher    = {Zenodo},
  doi          = {10.5281/zenodo.18818238},
  url          = {https://doi.org/10.5281/zenodo.18818238}
}`,

  chicago: `Gökalp, Hüseyin, and Ali Çetinkaya. "Islamic Dynasties Atlas Dataset: Bosworth's Islamic Dynasties Database (632–1924 CE)." Zenodo, 2026. https://doi.org/10.5281/zenodo.18818238.`
};

export default function CitationBox({ lang }) {
  const [tab, setTab] = useState('apa');
  const [copied, setCopied] = useState(false);
  const t = T[lang];

  const copy = () => {
    navigator.clipboard.writeText(CITATIONS[tab]).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="cite-box">
      <div className="cite-title">{t.cite.title}</div>
      <div className="cite-tabs">
        {['apa', 'bibtex', 'chicago'].map(k => (
          <button key={k} className={`cite-tab${tab === k ? ' active' : ''}`} onClick={() => setTab(k)}>
            {k === 'apa' ? 'APA' : k === 'bibtex' ? 'BibTeX' : 'Chicago'}
          </button>
        ))}
      </div>
      <pre className="cite-text">{CITATIONS[tab]}</pre>
      <button className="cite-copy" onClick={copy}>
        {copied ? `✓ ${t.cite.copied}` : `📋 ${t.cite.copy}`}
      </button>
    </div>
  );
}

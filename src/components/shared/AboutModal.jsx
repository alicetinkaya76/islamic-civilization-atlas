import { useState } from 'react';

export default function AboutModal({ lang, onResetOnboarding, onResetLanding }) {
  const [open, setOpen] = useState(false);

  const _c = { tr: {
    title: 'Hakkında',
    body: [
      'Müslüman Hanedanlar Atlası, C. Edmund Bosworth\'un "The New Islamic Dynasties" başvuru eserinden derlenen kapsamlı bir interaktif tarih atlasıdır.',
      'Proje, 632–1924 CE dönemindeki 186 İslam hanedanlığını, 830 hükümdarı, 50 savaşı, 50 olayı, 49 âlimi, 40 mimari eseri, 15 ticaret yolunu, 30 diplomatik ilişkiyi ve 69 önemli şehri kapsamaktadır.',
      'Veri seti, 12 interaktif CSV tablosu ve 200 nedensellik bağlantısı içerir. Tüm veriler iki dilli (Türkçe/İngilizce) olarak sunulmaktadır.',
    ],
    authors: 'Yazarlar',
    data: 'Veri Kaynağı',
    dataDesc: 'Bosworth, C. E. (2004). The New Islamic Dynasties. Edinburgh University Press.',
    license: 'Lisans: CC BY-SA 4.0',
    close: 'Kapat'
  }, en: {
    title: 'About',
    body: [
      'The Islamic Dynasties Atlas is a comprehensive interactive historical atlas compiled from C. Edmund Bosworth\'s "The New Islamic Dynasties" reference work.',
      'The project covers 186 Islamic dynasties (632–1924 CE), 830 rulers, 50 battles, 50 events, 49 scholars, 40 monuments, 15 trade routes, 30 diplomatic relations, and 69 major cities.',
      'The dataset includes 12 interlinked CSV tables and 200 causal links. All data is presented bilingually (Turkish/English).',
    ],
    authors: 'Authors',
    data: 'Data Source',
    dataDesc: 'Bosworth, C. E. (2004). The New Islamic Dynasties. Edinburgh University Press.',
    license: 'License: CC BY-SA 4.0',
    close: 'Close'
  }, ar: {
    title: 'About',
    body: [
      'The Islamic Dynasties Atlas is a comprehensive interactive historical atlas compiled from C. Edmund Bosworth\'s "The New Islamic Dynasties" reference work.',
      'The project covers 186 Islamic dynasties (632–1924 CE), 830 rulers, 50 battles, 50 events, 49 scholars, 40 monuments, 15 trade routes, 30 diplomatic relations, and 69 major cities.',
      'The dataset includes 12 interlinked CSV tables and 200 causal links. All data is presented bilingually (Turkish/English).',
    ],
    authors: 'Authors',
    data: 'Data Source',
    dataDesc: 'Bosworth, C. E. (2004). The New Islamic Dynasties. Edinburgh University Press.',
    license: 'License: CC BY-SA 4.0',
    close: 'Close'
  } }; const content = _c[lang] || _c.en;

  return (
    <>
      <button className="about-btn" onClick={() => setOpen(true)}>
        ℹ {{ tr: 'Hakkında', en: 'About', ar: '' }[lang]}
      </button>
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">{content.title}</h2>
            {content.body.map((p, i) => <p key={i} className="modal-p">{p}</p>)}
            <div className="modal-section">
              <h3 className="modal-h3">{content.authors}</h3>
              <div className="modal-author">
                <strong>Dr. Hüseyin Gökalp</strong><br />
                {{ tr: 'Selçuk Üniversitesi, İlahiyat Fakültesi, İslam Tarihi Anabilim Dalı', en: 'Selçuk University, Faculty of Theology, Dept. of Islamic History', ar: '' }[lang]}
              </div>
              <div className="modal-author">
                <strong>Dr. Ali Çetinkaya</strong>
                <a href="https://orcid.org/0000-0002-7747-6854" target="_blank" rel="noopener noreferrer" className="modal-orcid">
                  <img src="https://orcid.org/sites/default/files/images/orcid_16x16.png" alt="ORCID" width="14" height="14" />
                </a>
                <br />
                {{ tr: 'Selçuk Üniversitesi, Teknoloji Fakültesi, Bilgisayar Mühendisliği Bölümü', en: 'Selçuk University, Faculty of Technology, Dept. of Computer Engineering', ar: '' }[lang]}
              </div>
            </div>
            <div className="modal-section">
              <h3 className="modal-h3">{content.data}</h3>
              <p className="modal-p modal-ref">{content.dataDesc}</p>
            </div>
            <p className="modal-license">{content.license}</p>
            {onResetOnboarding && (
              <button className="modal-onboarding-reset" onClick={() => { onResetOnboarding(); setOpen(false); }}>
                🗺 {{ tr: 'Rehberi Tekrar Göster', en: 'Show Guide Again', ar: '' }[lang]}
              </button>
            )}
            {onResetLanding && (
              <button className="modal-onboarding-reset" onClick={() => { onResetLanding(); setOpen(false); }} style={{ marginTop: 6 }}>
                ☪ {{ tr: 'Giriş Sayfasını Tekrar Göster', en: 'Show Landing Page Again', ar: '' }[lang]}
              </button>
            )}
            <button className="modal-close" onClick={() => setOpen(false)}>{content.close}</button>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * FeedbackModal.jsx — islamicatlas.org Görüş & Öneri / Feedback & Suggestions
 * 
 * Trilingual (TR/EN/AR), dark theme, Google Sheets backend.
 * Usage: <FeedbackModal lang={lang} />
 */

import { useState, useCallback } from 'react';

const ENDPOINT = 'https://script.google.com/macros/s/AKfycbxZcb_Glq7_rb8CYzwsGncKzZDE3yF2qgOjNZAtwdWqW71UXz6zOajNIABrGFKWXQvc4w/exec';

/* ── i18n ── */
const L = {
  tr: {
    btn: 'Görüş Bildir',
    title: 'Görüş ve Öneri',
    subtitle: 'İslam Tarih Atlası\'nı geliştirmemize yardımcı olun',
    type: 'Bildirim Türü',
    types: {
      general: 'Genel görüş',
      correction: 'Düzeltme önerisi',
      newEntry: 'Yeni kayıt önerisi',
      bug: 'Hata bildirimi',
    },
    page: 'Sayfa veya kayıt adı',
    pagePlaceholder: 'ör. Aziziye Camii, Harita sayfası...',
    message: 'Mesajınız',
    messagePlaceholder: 'Görüş, öneri veya düzeltmenizi buraya yazın...',
    name: 'Adınız (isteğe bağlı)',
    email: 'E-posta (isteğe bağlı)',
    send: 'Gönder',
    sending: 'Gönderiliyor...',
    success: 'Mesajınız alındı. Teşekkür ederiz!',
    error: 'Bir hata oluştu. Lütfen tekrar deneyin.',
    close: 'Kapat',
    required: 'Bu alan zorunludur',
  },
  en: {
    btn: 'Feedback',
    title: 'Feedback & Suggestions',
    subtitle: 'Help us improve the Atlas of Islamic History',
    type: 'Feedback Type',
    types: {
      general: 'General feedback',
      correction: 'Correction suggestion',
      newEntry: 'New entry suggestion',
      bug: 'Bug report',
    },
    page: 'Page or record name',
    pagePlaceholder: 'e.g. Aziziye Mosque, Map page...',
    message: 'Your message',
    messagePlaceholder: 'Write your feedback, suggestion, or correction here...',
    name: 'Your name (optional)',
    email: 'Email (optional)',
    send: 'Send',
    sending: 'Sending...',
    success: 'Your message has been received. Thank you!',
    error: 'An error occurred. Please try again.',
    close: 'Close',
    required: 'This field is required',
  },
  ar: {
    btn: 'ملاحظات',
    title: 'الملاحظات والاقتراحات',
    subtitle: 'ساعدنا في تحسين أطلس التاريخ الإسلامي',
    type: 'نوع الملاحظة',
    types: {
      general: 'ملاحظة عامة',
      correction: 'اقتراح تصحيح',
      newEntry: 'اقتراح إدخال جديد',
      bug: 'بلاغ عن خلل',
    },
    page: 'الصفحة أو اسم السجل',
    pagePlaceholder: 'مثال: مسجد العزيزية، صفحة الخريطة...',
    message: 'رسالتك',
    messagePlaceholder: 'اكتب ملاحظتك أو اقتراحك أو تصحيحك هنا...',
    name: 'اسمك (اختياري)',
    email: 'البريد الإلكتروني (اختياري)',
    send: 'إرسال',
    sending: 'جارٍ الإرسال...',
    success: 'تم استلام رسالتك. شكرًا لك!',
    error: 'حدث خطأ. يرجى المحاولة مرة أخرى.',
    close: 'إغلاق',
    required: 'هذا الحقل مطلوب',
  },
};

export default function FeedbackModal({ lang = 'tr' }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | sending | success | error
  const [form, setForm] = useState({
    type: 'general',
    page: '',
    message: '',
    name: '',
    email: '',
  });
  const [touched, setTouched] = useState({});

  const t = L[lang] || L.tr;
  const isRTL = lang === 'ar';

  const handleChange = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    setTouched(t => ({ ...t, [field]: true }));
  };

  const handleSubmit = useCallback(async () => {
    if (!form.message.trim()) {
      setTouched(t => ({ ...t, message: true }));
      return;
    }

    setStatus('sending');

    try {
      // Get current page info from URL hash
      const currentPage = window.location.hash || '/';

      await fetch(ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: form.type,
          page: form.page || currentPage,
          message: form.message,
          name: form.name,
          email: form.email,
          lang: lang,
        }),
      });

      // no-cors always returns opaque — assume success
      setStatus('success');
      setForm({ type: 'general', page: '', message: '', name: '', email: '' });
      setTouched({});
    } catch (err) {
      console.error('Feedback submit error:', err);
      setStatus('error');
    }
  }, [form, lang]);

  const handleClose = () => {
    setOpen(false);
    // Reset after animation
    setTimeout(() => {
      setStatus('idle');
      setTouched({});
    }, 300);
  };

  return (
    <>
      {/* ── Floating Button ── */}
      <button
        className="fb-trigger"
        onClick={() => setOpen(true)}
        title={t.btn}
        aria-label={t.btn}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <span className="fb-trigger-text">{t.btn}</span>
      </button>

      {/* ── Modal Overlay ── */}
      {open && (
        <div className="fb-overlay" onClick={handleClose}>
          <div
            className="fb-modal"
            dir={isRTL ? 'rtl' : 'ltr'}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="fb-header">
              <div>
                <h2 className="fb-title">{t.title}</h2>
                <p className="fb-subtitle">{t.subtitle}</p>
              </div>
              <button className="fb-close" onClick={handleClose}>✕</button>
            </div>

            {/* Body */}
            {status === 'success' ? (
              <div className="fb-success">
                <div className="fb-success-icon">✓</div>
                <p>{t.success}</p>
                <button className="fb-btn" onClick={handleClose}>{t.close}</button>
              </div>
            ) : status === 'error' ? (
              <div className="fb-success">
                <div className="fb-success-icon" style={{ background: 'rgba(198,40,40,0.15)', color: '#ef5350' }}>!</div>
                <p>{t.error}</p>
                <button className="fb-btn" onClick={() => setStatus('idle')}>{t.close}</button>
              </div>
            ) : (
              <div className="fb-body">
                {/* Type */}
                <div className="fb-field">
                  <label className="fb-label">{t.type}</label>
                  <select
                    className="fb-select"
                    value={form.type}
                    onChange={(e) => handleChange('type', e.target.value)}
                  >
                    {Object.entries(t.types).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>

                {/* Page */}
                <div className="fb-field">
                  <label className="fb-label">{t.page}</label>
                  <input
                    className="fb-input"
                    type="text"
                    placeholder={t.pagePlaceholder}
                    value={form.page}
                    onChange={(e) => handleChange('page', e.target.value)}
                  />
                </div>

                {/* Message */}
                <div className="fb-field">
                  <label className="fb-label">
                    {t.message} <span style={{ color: '#ef5350' }}>*</span>
                  </label>
                  <textarea
                    className={`fb-textarea ${touched.message && !form.message.trim() ? 'fb-error' : ''}`}
                    placeholder={t.messagePlaceholder}
                    value={form.message}
                    onChange={(e) => handleChange('message', e.target.value)}
                    rows={4}
                  />
                  {touched.message && !form.message.trim() && (
                    <span className="fb-error-text">{t.required}</span>
                  )}
                </div>

                {/* Name + Email row */}
                <div className="fb-row">
                  <div className="fb-field">
                    <label className="fb-label">{t.name}</label>
                    <input
                      className="fb-input"
                      type="text"
                      value={form.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                    />
                  </div>
                  <div className="fb-field">
                    <label className="fb-label">{t.email}</label>
                    <input
                      className="fb-input"
                      type="email"
                      value={form.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                    />
                  </div>
                </div>

                {/* Submit */}
                <button
                  className="fb-btn fb-btn-primary"
                  onClick={handleSubmit}
                  disabled={status === 'sending'}
                >
                  {status === 'sending' ? t.sending : t.send}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

import { useEffect, useRef, useCallback } from 'react';

/**
 * Reusable BottomSheet — slides up from bottom with drag-to-close.
 * Props:
 *   open       — boolean
 *   onClose    — () => void
 *   title      — optional header text
 *   children   — content
 *   className  — optional extra class
 */
export default function BottomSheet({ open, onClose, title, children, className = '' }) {
  const sheetRef = useRef(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  /* Close on ESC */
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  /* Prevent body scroll when open */
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  /* Touch drag to dismiss */
  const onTouchStart = useCallback((e) => {
    startY.current = e.touches[0].clientY;
    currentY.current = 0;
  }, []);

  const onTouchMove = useCallback((e) => {
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0 && sheetRef.current) {
      currentY.current = dy;
      sheetRef.current.style.transform = `translateY(${dy}px)`;
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    if (currentY.current > 100) {
      onClose();
    }
    if (sheetRef.current) {
      sheetRef.current.style.transform = '';
    }
    currentY.current = 0;
  }, [onClose]);

  if (!open) return null;

  return (
    <>
      <div className="btm-sheet-backdrop" onClick={onClose} />
      <div
        ref={sheetRef}
        className={`btm-sheet ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Bottom sheet'}
      >
        <div
          className="btm-sheet-handle-area"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="btm-sheet-handle" />
        </div>
        {title && <div className="btm-sheet-title">{title}</div>}
        <div className="btm-sheet-body">
          {children}
        </div>
      </div>
    </>
  );
}

import { useRef, useCallback, useEffect } from 'react';

/**
 * useSwipeGesture — detect horizontal swipe on a target element.
 *
 * @param {Object} opts
 * @param {Function} opts.onSwipeLeft  — called on left swipe (→ next)
 * @param {Function} opts.onSwipeRight — called on right swipe (→ prev)
 * @param {number}   opts.threshold    — min px to trigger (default 60)
 * @param {number}   opts.maxVertical  — max vertical drift (default 80)
 * @param {boolean}  opts.enabled      — enable/disable (default true)
 * @returns {Object} { ref } — attach ref to swipeable element
 */
export default function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  threshold = 60,
  maxVertical = 80,
  enabled = true,
} = {}) {
  const ref = useRef(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const swiping = useRef(false);

  const onTouchStart = useCallback((e) => {
    try {
      if (!enabled) return;
      const touch = e.touches?.[0];
      if (!touch) return;
      startX.current = touch.clientX;
      startY.current = touch.clientY;
      swiping.current = true;
    } catch (err) {
      console.warn('[Swipe] touchstart error:', err);
    }
  }, [enabled]);

  const onTouchEnd = useCallback((e) => {
    try {
      if (!enabled || !swiping.current) return;
      swiping.current = false;
      const touch = e.changedTouches?.[0];
      if (!touch) return;
      const dx = touch.clientX - startX.current;
      const dy = Math.abs(touch.clientY - startY.current);

      if (dy > maxVertical) return; // too vertical — ignore
      if (Math.abs(dx) < threshold) return; // too short

      if (dx < 0) {
        onSwipeLeft?.();
      } else {
        onSwipeRight?.();
      }
    } catch (err) {
      console.warn('[Swipe] touchend error:', err);
    }
  }, [enabled, threshold, maxVertical, onSwipeLeft, onSwipeRight]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [enabled, onTouchStart, onTouchEnd]);

  return { ref };
}

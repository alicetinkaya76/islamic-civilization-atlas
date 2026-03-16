import { useState, useEffect, useRef } from 'react';

/**
 * Lazily fetch JSON data from public/ directory.
 * Caches in a module-level Map so each URL is fetched at most once.
 *
 * @param {string|null} url — path like '/data/alam_lite.json'
 * @returns {{ data: any, loading: boolean, error: Error|null }}
 */

const cache = new Map();

export default function useAsyncData(url) {
  const [data, setData] = useState(() => (url && cache.has(url) ? cache.get(url) : null));
  const [loading, setLoading] = useState(() => (url && !cache.has(url)));
  const [error, setError] = useState(null);
  const urlRef = useRef(url);

  useEffect(() => {
    if (!url) return;
    urlRef.current = url;

    // Already cached
    if (cache.has(url)) {
      setData(cache.get(url));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(json => {
        cache.set(url, json);
        if (urlRef.current === url) {
          setData(json);
          setLoading(false);
        }
      })
      .catch(err => {
        if (urlRef.current === url) {
          setError(err);
          setLoading(false);
        }
      });
  }, [url]);

  return { data, loading, error };
}

/**
 * Preload a JSON file into cache without rendering anything.
 * Useful for prefetching on hover or on tab switch.
 */
export function preloadData(url) {
  if (!url || cache.has(url)) return;
  fetch(url)
    .then(r => r.ok ? r.json() : null)
    .then(json => { if (json) cache.set(url, json); })
    .catch(() => {});
}

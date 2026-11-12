import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

const MIN_SPIN_MS = 380;

export function useAutoRefresh(loader, options) {
  const opts = options || {};
  const intervalMs = opts.intervalMs !== undefined ? opts.intervalMs : 5000;
  const enabled = opts.enabled !== undefined ? opts.enabled : true;
  const location = useLocation();
  const loaderRef = useRef(loader);
  loaderRef.current = loader;
  const loaderKeyRef = useRef('');
  const mountedRef = useRef(false);
  const [lastRefreshed, setLastRefreshed] = useState(() => new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const inFlightRef = useRef(false);
  const spinTimerRef = useRef(null);

  /* Silent background sync: runs without toggling `isRefreshing` so the
     RefreshButton never flashes, disables, or resizes on background timers
     or window focus events. Only updates state when the loader signals a
     change (`result !== false`). */
  const runSilent = useCallback(async (isInitial = false) => {
    if (!mountedRef.current || inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const changed = await loaderRef.current({ silent: true, manual: false, initial: isInitial });
      if (mountedRef.current && (isInitial || changed === true)) {
        setLastRefreshed(new Date());
      }
    } catch {
      /* ignore background sync errors */
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  /* Manual user-triggered refresh: always executes, spins the button icon
     smoothly for at least MIN_SPIN_MS so it never flickers for 1 frame,
     and updates `lastRefreshed`. */
  const refresh = useCallback(async () => {
    if (!mountedRef.current) return;
    if (spinTimerRef.current) {
      clearTimeout(spinTimerRef.current);
      spinTimerRef.current = null;
    }
    const startedAt = Date.now();
    inFlightRef.current = true;
    setIsRefreshing(true);
    try {
      await loaderRef.current({ silent: false, manual: true, initial: false });
      if (mountedRef.current) {
        setLastRefreshed(new Date());
        setRefreshCount((c) => c + 1);
      }
    } catch {
      /* ignore manual refresh error */
    } finally {
      inFlightRef.current = false;
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, MIN_SPIN_MS - elapsed);
      if (remaining > 0 && mountedRef.current) {
        spinTimerRef.current = setTimeout(() => {
          spinTimerRef.current = null;
          if (mountedRef.current) setIsRefreshing(false);
        }, remaining);
      } else if (mountedRef.current) {
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (spinTimerRef.current) {
        clearTimeout(spinTimerRef.current);
        spinTimerRef.current = null;
      }
    };
  }, []);

  const pathKey = location.pathname + location.search;
  useEffect(() => {
    if (!enabled) return;
    if (loaderKeyRef.current === pathKey) return;
    loaderKeyRef.current = pathKey;
    runSilent(true);
  }, [enabled, pathKey, runSilent]);

  useEffect(() => {
    if (!enabled) return;
    const onFocus = () => runSilent(false);
    const onVisible = () => {
      if (document.visibilityState === 'visible') runSilent(false);
    };
    const onOnline = () => runSilent(false);
    const onStorage = () => runSilent(false);
    const onDataChanged = () => runSilent(false);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onOnline);
    window.addEventListener('storage', onStorage);
    window.addEventListener('rdana:data-changed', onDataChanged);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('rdana:data-changed', onDataChanged);
    };
  }, [enabled, runSilent]);

  useEffect(() => {
    if (!enabled || !intervalMs) return;
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') runSilent(false);
    }, intervalMs);
    return () => clearInterval(id);
  }, [enabled, intervalMs, runSilent]);

  return { refresh, lastRefreshed, isRefreshing, refreshCount };
}

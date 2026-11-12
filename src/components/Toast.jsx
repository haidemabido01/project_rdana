import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/* ------------------------------------------------------------------ *
 * Toasts
 *
 * One slot at a time: the newest message replaces whatever was showing.
 * That matters most for Undo — if two deletions happened back to back,
 * only the most recent one can be reversed, and showing two competing
 * "Undo" buttons on a phone would be ambiguous about what gets restored.
 * ------------------------------------------------------------------ */

const ToastCtx = createContext(null);

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be called inside <ToastProvider>');
  return ctx;
}

let seq = 0;

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const clearTimer = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const dismiss = useCallback(() => {
    clearTimer();
    setToast(null);
  }, [clearTimer]);

  const push = useCallback(
    (t) => {
      clearTimer();
      setToast({ id: ++seq, tone: 'info', duration: 2600, ...t });
    },
    [clearTimer]
  );

  useEffect(() => clearTimer, [clearTimer]);

  useEffect(() => {
    if (!toast) return undefined;
    const ms = toast.duration ?? 2600;
    timer.current = setTimeout(() => setToast(null), ms);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [toast]);

  const api = useMemo(
    () => ({
      success: (message, duration) => push({ message, tone: 'success', duration }),
      error: (message, duration) => push({ message, tone: 'error', duration }),
      info: (message, duration) => push({ message, tone: 'info', duration }),
      /* message + onUndo, kept longer so there is time to notice it */
      undo: (message, onUndo, duration = 7000) =>
        push({ message, tone: 'undo', actionLabel: 'Undo', onAction: onUndo, duration })
    }),
    [push]
  );

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <Toaster toast={toast} onDismiss={dismiss} />
    </ToastCtx.Provider>
  );
}

function canPortal() {
  return typeof document !== 'undefined' && !!document.body;
}

function Toaster({ toast, onDismiss }) {
  if (!toast) return null;

  const node = (
    <div className="toast-host no-print" aria-live="polite" aria-atomic="true">
      <div key={toast.id} className={`toast toast-${toast.tone}`}>
        <span className="toast-msg">{toast.message}</span>
        {toast.onAction && (
          <button
            type="button"
            className="toast-action"
            onClick={() => {
              toast.onAction();
              onDismiss();
            }}
          >
            {toast.actionLabel || 'Undo'}
          </button>
        )}
        <button type="button" className="toast-close" aria-label="Dismiss" onClick={onDismiss}>
          ✕
        </button>
        <span className="toast-bar" style={{ animationDuration: `${toast.duration || 2600}ms` }} />
      </div>
    </div>
  );

  return canPortal() ? createPortal(node, document.body) : node;
}

/* ------------------------------------------------------------------ *
 * Presentational pieces, exported for the render tests.
 * ------------------------------------------------------------------ */
export function ToastMessage({ toast }) {
  if (!toast) return null;
  return (
    <div className={`toast toast-${toast.tone}`}>
      <span className="toast-msg">{toast.message}</span>
      {toast.actionLabel && <button type="button" className="toast-action">{toast.actionLabel}</button>}
    </div>
  );
}
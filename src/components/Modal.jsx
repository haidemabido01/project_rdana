import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/* ------------------------------------------------------------------ *
 * Modal
 *
 * Hand-rolled so the app stays dependency-free. Handles the parts that
 * actually matter for field use: ESC to cancel, a Tab trap so the phone
 * keyboard / screen reader cannot wander behind the overlay, focus
 * returned to whatever opened it, and the body scroll locked while open.
 *
 * On narrow screens the panel becomes a bottom sheet, which sits within
 * thumb reach instead of at the top of the screen.
 * ------------------------------------------------------------------ */

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function canPortal() {
  return typeof document !== 'undefined' && !!document.body;
}

export function Modal({ open, title, children, footer, onCancel, initialFocus, labelledBy }) {
  const panelRef = useRef(null);
  const restoreRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    restoreRef.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const panel = panelRef.current;
    const items = () => Array.from(panel?.querySelectorAll(FOCUSABLE) ?? []);
    const first = initialFocus ? panel?.querySelector(initialFocus) : items()[0];
    (first ?? items()[0])?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onCancel?.();
        return;
      }
      if (e.key !== 'Tab') return;
      const list = items();
      if (!list.length) return;
      const head = list[0];
      const tail = list[list.length - 1];
      if (e.shiftKey && document.activeElement === head) {
        e.preventDefault();
        tail.focus();
      } else if (!e.shiftKey && document.activeElement === tail) {
        e.preventDefault();
        head.focus();
      }
    };

    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = prevOverflow;
      const back = restoreRef.current;
      if (back && typeof back.focus === 'function') back.focus();
    };
  }, [open, onCancel, initialFocus]);

  if (!open) return null;

  const headId = labelledBy || 'modal-title';

  const node = (
    <div
      className="modal-overlay no-print"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel?.();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby={headId} ref={panelRef}>
        <div className="modal-head">
          <h2 className="modal-title" id={headId}>
            {title}
          </h2>
          <button type="button" className="modal-x" aria-label="Close" onClick={onCancel}>
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );

  return canPortal() ? createPortal(node, document.body) : node;
}

/* ------------------------------------------------------------------ *
 * ConfirmDialog
 *
 * Cancels are focused by default rather than the destructive action, so
 * a stray Enter keypress cannot delete an assessment.
 * ------------------------------------------------------------------ */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  busy = false,
  children,
  onConfirm,
  onCancel
}) {
  return (
    <Modal
      open={open}
      title={title}
      onCancel={onCancel}
      initialFocus='.btn-ghost, .btn-outline'
      footer={
        <>
          <button type="button" className="btn btn-outline btn-sm" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn btn-sm ${danger ? 'btn-danger-solid' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      {message && <p className="modal-msg">{message}</p>}
      {children}
    </Modal>
  );
}
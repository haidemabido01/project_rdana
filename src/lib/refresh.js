export function notifyDataChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event('rdana:data-changed'));
  try {
    localStorage.setItem('rdana.lastDataChange', String(Date.now()));
  } catch {
  }
}

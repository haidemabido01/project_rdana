import { RefreshCw } from 'lucide-react';

export default function RefreshButton({ onRefresh, isRefreshing, label = 'Refresh', className = '' }) {
  const base =
    'inline-flex flex-none items-center justify-center gap-2 min-h-[36px] px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-navy-900 whitespace-nowrap hover:bg-slate-50 active:bg-slate-100 shadow-sm transition-colors cursor-pointer disabled:cursor-wait';
  return (
    <button
      type="button"
      onClick={() => {
        if (!isRefreshing && onRefresh) onRefresh();
      }}
      disabled={isRefreshing}
      aria-busy={isRefreshing || undefined}
      aria-label={label}
      title="Refresh now"
      className={`${base} ${className}`.trim()}
    >
      <RefreshCw
        size={14}
        className={`flex-none transition-transform ${
          isRefreshing ? 'animate-spin text-brand-600' : 'text-slate-600'
        }`}
      />
      <span>{label}</span>
    </button>
  );
}

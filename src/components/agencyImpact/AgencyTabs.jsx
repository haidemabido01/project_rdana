/* ------------------------------------------------------------------ *
 * Horizontal pill tabs.
 *
 * Active tab: brand orange fill. Idle tabs: white with a hairline
 * border, matching the dashboard section switcher.
 * ------------------------------------------------------------------ */
export default function AgencyTabs({ tabs = [], active, onSelect }) {
  return (
    <nav aria-label="Impact sections">
      <div role="tablist" className="flex w-max min-w-max gap-2">
        {tabs.map((tab) => {
          const isActive = tab.key === active;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelect?.(tab.key)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-150 active:scale-[0.97] ${
                isActive
                  ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/30'
                  : 'border border-gray-200 bg-white text-gray-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

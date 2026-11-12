/* ------------------------------------------------------------------ *
 * Barangay ranking chart — Overview tab.
 *
 * A hand-drawn SVG column chart: the app ships no charting library, so
 * the plot is plain SVG on a fixed 760 x 360 user-space canvas that
 * scales to the width of its card.
 *
 * Every barangay of Tagbina is always plotted, sorted from most to
 * least affected. With no records yet the columns render as empty
 * slots, and the bars fill in by themselves the moment a Phase 1
 * assessment records affected families in Section VIII.
 * ------------------------------------------------------------------ */

const W = 760;
const H = 360;
const PAD = { top: 26, right: 12, bottom: 96, left: 46 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

const TIERS = [
  { key: 'first', color: '#DC2626', label: 'Ranks 1–3 · respond first' },
  { key: 'high', color: '#F97316', label: 'Ranks 4–8 · high impact' },
  { key: 'watch', color: '#FBBF24', label: 'Ranks 9+ · monitor' }
];

const SLOT_FILL = '#F3F4F6';
const LABEL_FILL = '#374151';
const MUTED_FILL = '#9CA3AF';
const VALUE_FILL = '#1E293B';

function tierOf(rank) {
  if (rank == null) return null;
  if (rank <= 3) return 'first';
  if (rank <= 8) return 'high';
  return 'watch';
}

function colorOf(rank) {
  const tier = TIERS.find((t) => t.key === tierOf(rank));
  return tier ? tier.color : null;
}

/* A "nice" ceiling for the y axis: five steps that divide cleanly. */
function axisScale(maxValue) {
  if (!(maxValue > 0) || maxValue <= 4) return { max: 4, step: 1 };
  const target = maxValue / 5;
  const exp = 10 ** Math.floor(Math.log10(target));
  const factor = target / exp;
  const step =
    (factor <= 1 ? 1 : factor <= 2 ? 2 : factor <= 3 ? 3 : factor <= 5 ? 5 : 10) * exp;
  return { max: step * 5, step };
}

export default function BarangayRankingChart({
  rows = [],
  emptyTitle = 'No affected families recorded yet',
  emptyHint = ''
}) {
  const maxValue = rows.reduce((m, r) => Math.max(m, Number(r.value) || 0), 0);
  const isEmpty = maxValue <= 0;
  const { max, step } = axisScale(maxValue);
  const ticks = [0, step, step * 2, step * 3, step * 4, step * 5];
  const slot = rows.length ? PLOT_W / rows.length : PLOT_W;
  const barW = Math.min(18, Math.max(6, slot - 8));
  const baseline = PAD.top + PLOT_H;
  const yFor = (value) => baseline - (Math.min(value, max) / max) * PLOT_H;

  const summary = rows
    .map((r) => `${r.label}: ${Number(r.value) || 0}`)
    .join(', ');

  return (
    <div>
      <div className="relative">
        <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block h-auto w-full min-w-[680px]"
          role="img"
          aria-label={`Affected families by barangay, ranked. ${summary || 'No records yet.'}`}
        >
          {/* Empty column slots — always drawn so the chart is ready */}
          {rows.map((r, i) => {
            const cx = PAD.left + slot * i + slot / 2;
            return (
              <rect
                key={`slot-${r.key}`}
                x={cx - barW / 2}
                y={PAD.top}
                width={barW}
                height={PLOT_H}
                rx={4}
                fill={SLOT_FILL}
              />
            );
          })}

          {/* y axis grid */}
          {ticks.map((tick) => {
            const y = yFor(tick);
            const showLabel = !isEmpty || tick === 0;
            return (
              <g key={`tick-${tick}`}>
                <line
                  x1={PAD.left}
                  y1={y}
                  x2={W - PAD.right}
                  y2={y}
                  stroke="#E5E7EB"
                  strokeWidth="1"
                  strokeDasharray={tick === 0 ? undefined : '3 4'}
                />
                {showLabel && (
                  <text
                    x={PAD.left - 8}
                    y={y + 3.2}
                    textAnchor="end"
                    fontSize="9.5"
                    fontWeight="600"
                    fill={MUTED_FILL}
                  >
                    {tick.toLocaleString()}
                  </text>
                )}
              </g>
            );
          })}

          {/* bars */}
          {rows.map((r, i) => {
            const value = Number(r.value) || 0;
            const cx = PAD.left + slot * i + slot / 2;
            const fill = colorOf(r.rank);
            const barH = value > 0 ? Math.max(3, baseline - yFor(value)) : 0;
            const showZero = !isEmpty && r.hasData && value === 0;
            return (
              <g key={r.key} className="group">
                <title>
                  {r.hasData
                    ? `${r.label}: ${value.toLocaleString()} affected families`
                    : `${r.label}: no assessment recorded yet`}
                </title>
                {value > 0 && (
                  <>
                    <rect
                      x={cx - barW / 2}
                      y={baseline - barH}
                      width={barW}
                      height={barH}
                      rx={3}
                      fill={fill}
                      className="transition-opacity duration-150 group-hover:opacity-75"
                    />
                    <text
                      x={cx}
                      y={baseline - barH - 6}
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="700"
                      fill={VALUE_FILL}
                    >
                      {value.toLocaleString()}
                    </text>
                  </>
                )}
                {showZero && (
                  <text
                    x={cx}
                    y={baseline - 6}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="700"
                    fill={MUTED_FILL}
                  >
                    0
                  </text>
                )}
              </g>
            );
          })}

          {/* baseline */}
          <line
            x1={PAD.left}
            y1={baseline}
            x2={W - PAD.right}
            y2={baseline}
            stroke="#D1D5DB"
            strokeWidth="1"
          />

          {/* x axis — rotated barangay names with their rank */}
          {rows.map((r, i) => {
            const cx = PAD.left + slot * i + slot / 2;
            const label = r.rank ? `${r.rank}. ${r.label}` : r.label;
            return (
              <text
                key={`label-${r.key}`}
                x={cx}
                y={H - 8}
                transform={`rotate(-90 ${cx} ${H - 8})`}
                textAnchor="start"
                fontSize="9.5"
                fontWeight={r.rank ? 700 : 500}
                fill={r.rank ? LABEL_FILL : MUTED_FILL}
              >
                {label}
              </text>
            );
          })}
        </svg>
        </div>

        {/* Empty state — sits over the ready-but-blank plot */}
        {isEmpty && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-4">
            <div className="max-w-md rounded-xl border border-dashed border-gray-300 bg-white/95 px-4 py-3 text-center shadow-sm">
              <p className="text-xs font-bold text-navy-900 sm:text-sm">{emptyTitle}</p>
              {emptyHint && (
                <p className="mt-1 text-[11px] leading-relaxed text-gray-500">{emptyHint}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div
        className={`mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-medium text-gray-500 ${
          isEmpty ? 'opacity-60' : ''
        }`}
      >
        {TIERS.map((t) => (
          <span key={t.key} className="inline-flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ background: t.color }}
              aria-hidden="true"
            />
            {t.label}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-sm bg-gray-100 ring-1 ring-inset ring-gray-200"
            aria-hidden="true"
          />
          No data yet
        </span>
      </div>
    </div>
  );
}

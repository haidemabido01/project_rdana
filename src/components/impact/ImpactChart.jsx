/* ------------------------------------------------------------------ *
 * E — Municipal impact bar chart.
 *
 * Hand-rolled SVG: the app ships no charting dependency, and a small
 * vector chart keeps the offline bundle light. The drawing surface is a
 * fixed 320 x 196 user-space canvas that scales to the width of its
 * card, so the layout never reflows between phone and desktop.
 * ------------------------------------------------------------------ */

import { PLACEHOLDER_CHART } from './placeholders';

const W = 320;
const H = 196;
const PAD = { top: 12, right: 12, bottom: 26, left: 36 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;
const BAR_W = 32;
const MIN_BAR_H = 3; /* keeps the smallest series visible */

export default function ImpactChart({ chart = PLACEHOLDER_CHART }) {
  const ticks = chart.yAxisTicks || [];
  const max = Math.max(...ticks, 1);
  const bars = chart.bars || [];
  const slot = PLOT_W / Math.max(bars.length, 1);

  const yFor = (value) => PAD.top + PLOT_H - (Math.min(value, max) / max) * PLOT_H;

  return (
    <section className="h-full rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-base font-bold tracking-tight text-navy-900">{chart.title}</h2>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mx-auto mt-3 block h-auto w-full max-w-[440px]"
        role="img"
        aria-label={`${chart.title}. ${bars.map((b) => `${b.label}: ${b.value}`).join(', ')}.`}
      >
        {/* Horizontal grid lines + value labels */}
        {ticks.map((tick) => {
          const y = yFor(tick);
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
              <text
                x={PAD.left - 8}
                y={y + 3.2}
                textAnchor="end"
                fontSize="9.5"
                fontWeight="600"
                fill="#9CA3AF"
              >
                {tick.toLocaleString()}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {bars.map((bar, i) => {
          const raw = (Math.min(bar.value, max) / max) * PLOT_H;
          const h = Math.max(raw, MIN_BAR_H);
          const x = PAD.left + slot * i + (slot - BAR_W) / 2;
          const y = PAD.top + PLOT_H - h;
          return (
            <g key={bar.key} className="group">
              <title>{`${bar.label}: ${bar.value.toLocaleString()}`}</title>
              <rect
                x={x}
                y={y}
                width={BAR_W}
                height={h}
                rx="4"
                fill={bar.color}
                className="transition-opacity duration-150 group-hover:opacity-80"
              />
            </g>
          );
        })}

        {/* Baseline */}
        <line
          x1={PAD.left}
          y1={PAD.top + PLOT_H}
          x2={W - PAD.right}
          y2={PAD.top + PLOT_H}
          stroke="#D1D5DB"
          strokeWidth="1"
        />

        {/* X-axis caption */}
        <text
          x={PAD.left + PLOT_W / 2}
          y={H - 7}
          textAnchor="middle"
          fontSize="9.5"
          fontWeight="600"
          letterSpacing="0.4"
          fill="#C7CBD1"
        >
          {chart.xAxisLabel}
        </text>
      </svg>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ background: chart.legend.color }}
          aria-hidden="true"
        />
        <span className="text-xs font-medium text-gray-600">{chart.legend.label}</span>
      </div>

      {/* Disclaimer */}
      <p className="mt-1.5 text-[11px] leading-relaxed text-gray-400">{chart.disclaimer}</p>
    </section>
  );
}

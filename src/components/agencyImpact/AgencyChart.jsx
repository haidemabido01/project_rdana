import { IMPACT_COLORS } from '../impact/palette';

/* ------------------------------------------------------------------ *
 * Agency analytics chart card.
 *
 * A hand-drawn vertical bar chart on the system's white surface. The
 * app ships no charting library, so the plot is plain SVG on a fixed
 * 320 x 210 user-space canvas that scales to the width of its card.
 *
 * Series carry their own group, which drives the grouped x-axis labels
 * and the dashed divider between the groups.
 * ------------------------------------------------------------------ */

const W = 320;
const H = 210;
const PAD = { top: 14, right: 14, bottom: 48, left: 40 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;
const BAR_W = 24;
const BAR_GAP = 16;

export default function AgencyChart({
  title,
  ticks = [0, 20, 40, 60, 80, 100],
  series = [],
  legend = { color: IMPACT_COLORS.blue, label: 'Sample assessment count' },
  disclaimer = 'Sample-only chart. Units and metrics vary by agency; displayed values are not verified RDANA records.'
}) {
  const max = Math.max(...ticks, 1);

  /* Groups come from the series itself, in the order they appear. */
  const groups = series.reduce((acc, bar) => {
    if (!acc.includes(bar.group)) acc.push(bar.group);
    return acc;
  }, []);
  const groupWidth = groups.length ? PLOT_W / groups.length : PLOT_W;

  const yFor = (value) => PAD.top + PLOT_H - (Math.min(value, max) / max) * PLOT_H;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-base font-bold tracking-tight text-navy-900 sm:text-lg">{title}</h2>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mx-auto mt-4 block h-auto w-full max-w-[480px]"
        role="img"
        aria-label={`${title}. ${series.map((b) => `${b.label}: ${b.value}`).join(', ')}.`}
      >
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
                {tick}
              </text>
            </g>
          );
        })}

        {groups.slice(1).map((group, i) => (
          <line
            key={`sep-${group}`}
            x1={PAD.left + groupWidth * (i + 1)}
            y1={PAD.top}
            x2={PAD.left + groupWidth * (i + 1)}
            y2={PAD.top + PLOT_H}
            stroke="#E5E7EB"
            strokeWidth="1"
            strokeDasharray="2 5"
          />
        ))}

        {groups.map((group, groupIndex) => {
          const groupBars = series.filter((b) => b.group === group);
          const blockWidth = groupBars.length * BAR_W + (groupBars.length - 1) * BAR_GAP;
          const startX = PAD.left + groupWidth * groupIndex + (groupWidth - blockWidth) / 2;

          return groupBars.map((bar, barIndex) => {
            const h = Math.max((Math.min(bar.value, max) / max) * PLOT_H, 3);
            const x = startX + barIndex * (BAR_W + BAR_GAP);
            return (
              <g key={bar.key} className="group">
                <title>{`${bar.label}: ${bar.value}`}</title>
                <rect
                  x={x}
                  y={PAD.top + PLOT_H - h}
                  width={BAR_W}
                  height={h}
                  rx="4"
                  style={{ fill: bar.color }}
                  className="transition-opacity duration-150 group-hover:opacity-80"
                />
              </g>
            );
          });
        })}

        <line
          x1={PAD.left}
          y1={PAD.top + PLOT_H}
          x2={W - PAD.right}
          y2={PAD.top + PLOT_H}
          stroke="#D1D5DB"
          strokeWidth="1"
        />

        {groups.map((group, groupIndex) => (
          <text
            key={`label-${group}`}
            x={PAD.left + groupWidth * groupIndex + groupWidth / 2}
            y={PAD.top + PLOT_H + 22}
            textAnchor="middle"
            fontSize="10"
            fontWeight="600"
            fill="#6B7280"
          >
            {group}
          </text>
        ))}
      </svg>

      <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ background: legend.color }}
          aria-hidden="true"
        />
        <span className="text-xs font-medium text-gray-600">{legend.label}</span>
      </div>

      <p className="mt-1.5 text-[11px] leading-relaxed text-gray-400">{disclaimer}</p>
    </section>
  );
}

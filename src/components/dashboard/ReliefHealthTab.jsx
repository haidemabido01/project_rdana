import { Cross, Droplet, Heart, Package, Tent } from 'lucide-react';
import { BarList, Panel, ProgressBar, StatBlock } from './ui';

/* Icons for the four relief quadrants, keyed to the relief key. */
const RELIEF_ICONS = {
  foodNfi: Package,
  safeWater: Droplet,
  shelter: Tent,
  medical: Cross
};

const RELIEF_ACCENTS = {
  foodNfi: 'brand',
  safeWater: 'blue',
  shelter: 'purple',
  medical: 'red'
};

/* ------------------------------------------------------------------ *
 * Tab 3 — Relief & Health
 * The health picture on the left, what has to be delivered on the right.
 * ------------------------------------------------------------------ */
export default function ReliefHealthTab({ data, service }) {
  const maxNeeds = Math.max(1, ...service.health.byArea.map((a) => a.value));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Health & medical needs */}
      <Panel
        title="Health & Medical Needs"
        subtitle="Casualties and health issues reported in Form 1."
        action={
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50">
            <Heart className="h-4.5 w-4.5 text-red-600" strokeWidth={2} />
          </span>
        }
      >
        <p className="text-4xl font-extrabold tracking-tight text-navy-900">
          {service.health.value.toLocaleString()}
        </p>
        <p className="mt-1 text-sm text-gray-500">{service.health.subtext}</p>

        <div className="mt-6">
          <h3 className="text-sm font-semibold text-navy-900">Reported medical needs by area</h3>
          <div className="mt-4 space-y-3">
            {service.health.byArea.map((a) => (
              <div key={a.label}>
                <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                  <span className="truncate">{a.label}</span>
                  <span className="font-semibold text-navy-900">{a.value}</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-red-500"
                    style={{ width: `${(a.value / maxNeeds) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {service.health.byArea.length === 0 && (
              <p className="text-sm text-gray-500">
                No health issues recorded yet — add them in Form 1 Section IV.
              </p>
            )}
          </div>
        </div>
      </Panel>

      {/* Immediate relief requirements */}
      <Panel title="Immediate Relief Requirements" subtitle="Priority needs recorded per RDANA cluster.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {service.relief.map((q) => {
            const Icon = RELIEF_ICONS[q.key] || Package;
            return (
              <div key={q.key} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                    {
                      brand: 'bg-brand-50 text-brand-600',
                      blue: 'bg-blue-50 text-blue-600',
                      purple: 'bg-purple-50 text-purple-600',
                      red: 'bg-red-50 text-red-600'
                    }[RELIEF_ACCENTS[q.key]]
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" strokeWidth={2} />
                </span>
                <p className="mt-3 text-sm font-semibold text-navy-900">{q.label}</p>
                <p className="mt-1 text-2xl font-extrabold text-navy-900">{q.value.toLocaleString()}</p>
                <p className="mt-1 line-clamp-2 text-xs text-gray-500">{q.subtext}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-semibold text-navy-900">Cluster coverage</h3>
          <p className="mt-1 text-xs text-gray-500">
            How many of the RDANA clusters have a priority recorded.
          </p>
          <div className="mt-3">
            <ProgressBar
              segments={[
                {
                  key: 'recorded',
                  width: `${Math.min(
                    100,
                    (service.relief.reduce((a, q) => a + (q.value > 0 ? 1 : 0), 0) / 4) * 100
                  )}%`,
                  className: 'bg-brand-500'
                }
              ]}
            />
          </div>
        </div>
      </Panel>
    </div>
  );
}

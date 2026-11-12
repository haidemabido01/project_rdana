import { Building2, Construction, Droplets, Radio, ShieldAlert, Zap } from 'lucide-react';
import { formatPeso, formatPesoShort } from '../../lib/damage';
import { timeAgo } from '../../lib/format';
import { LIFELINE_TONES } from '../../lib/services';
import { Panel, ProgressBar, StatBlock, StatusPill } from './ui';

const LIFELINE_ICONS = {
  'Roads and Bridges': Construction,
  Electricity: Zap,
  'Communication Network': Radio,
  'Water Supply System': Droplets
};

/* ------------------------------------------------------------------ *
 * Tab 2 — Damage & Services
 * How much of the housing stock is repairable versus a total loss, and
 * whether the essential lifelines are running in each reporting area.
 * ------------------------------------------------------------------ */
export default function DamageServicesTab({ data, service }) {
  const h = service.housing;
  const bt = data?.buildingTotals || {
    assessments: 0,
    cost: 0,
    families: 0,
    personsAffected: 0,
    displaced: 0,
    damagedUnits: 0,
    latestBuildingName: ''
  };
  const latestBuilding = (data?.buildingAssessments || [])[0];
  const unsafeCount = (data?.buildingAssessments || []).filter((b) =>
    String(b.usabilityStatus || '').toLowerCase().includes('unsafe')
  ).length;

  return (
    <div className="space-y-6">
      {/* Building Structure — auto-updated from saved forms */}
      {bt.assessments > 0 && (
        <Panel
          title="Building Structure — Auto-Updated"
          subtitle={`From saved Building Structure forms, latest first.${
            latestBuilding?.updatedAt ? ` Latest updated ${timeAgo(latestBuilding.updatedAt)}.` : ''
          }${bt.latestBuildingName ? ` Latest: ${bt.latestBuildingName}.` : ''}`}
        >
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                <Building2 className="h-3.5 w-3.5" /> Buildings Assessed
              </p>
              <p className="mt-2 text-3xl font-extrabold text-navy-900">
                {bt.assessments.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {bt.damagedUnits.toLocaleString()} damaged unit{bt.damagedUnits === 1 ? '' : 's'}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Building Damage Cost
              </p>
              <p className="mt-2 text-2xl font-extrabold text-brand-600">{formatPeso(bt.cost)}</p>
              <p className="mt-1 text-xs text-gray-500">
                {bt.cost > 0 ? formatPesoShort(bt.cost) : '—'} of total cost
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                <ShieldAlert className="h-3.5 w-3.5" /> Unsafe Buildings
              </p>
              <p className="mt-2 text-3xl font-extrabold text-red-600">{unsafeCount.toLocaleString()}</p>
              <p className="mt-1 text-xs text-gray-500">Unsafe / Unusable status</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Affected / Displaced
              </p>
              <p className="mt-2 text-3xl font-extrabold text-navy-900">
                {bt.personsAffected.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {bt.families.toLocaleString()} families · {bt.displaced.toLocaleString()} displaced
              </p>
            </div>
          </div>
        </Panel>
      )}

      {/* Housing damage */}
      <Panel
        title="Housing Damage Assessment"
        subtitle="Damaged houses by how much was lost, from Form 1 records."
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Partially Damaged
            </p>
            <p className="mt-2 text-3xl font-extrabold text-yellow-600">
              {h.partiallyDamaged.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Repairable — needs kits and materials
              {h.buildingPartially > 0
                ? ` · ${h.buildingPartially.toLocaleString()} from Building Structures`
                : ''}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Totally Damaged
            </p>
            <p className="mt-2 text-3xl font-extrabold text-red-600">{h.totallyDamaged.toLocaleString()}</p>
            <p className="mt-1 text-xs text-gray-500">
              Needs replacement, not repair
              {h.buildingTotally > 0
                ? ` · ${h.buildingTotally.toLocaleString()} from Building Structures`
                : ''}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
            <span>Partially damaged · {h.partialPct.toFixed(0)}%</span>
            <span>Totally damaged · {h.totalPct.toFixed(0)}%</span>
          </div>
          <ProgressBar
            segments={[
              { key: 'partial', width: `${h.partialPct}%`, className: 'bg-yellow-400' },
              { key: 'total', width: `${h.totalPct}%`, className: 'bg-red-500' }
            ]}
          />
        </div>
      </Panel>

      {/* Lifelines */}
      <Panel title="Roads, Bridges & Essential Services" subtitle="Lifeline status recorded in Form 1 Section III.">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {service.lifelines.summary.map((s) => {
            const Icon = LIFELINE_ICONS[s.key] || Construction;
            const accent = s.down > 0 ? 'red' : s.partial > 0 ? 'yellow' : s.reported ? 'green' : 'slate';
            return (
              <StatBlock
                key={s.key}
                icon={Icon}
                accent={accent}
                title={s.label}
                value={s.value}
                subtext={s.subtext}
              />
            );
          })}
        </div>

        {/* Per-area status */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                <th scope="col" className="py-3 pr-4 font-semibold">
                  Area
                </th>
                <th scope="col" className="py-3 pr-4 font-semibold">
                  Electricity
                </th>
                <th scope="col" className="py-3 pr-4 font-semibold">
                  Communication
                </th>
                <th scope="col" className="py-3 pr-4 font-semibold">
                  Roads &amp; Bridges
                </th>
              </tr>
            </thead>
            <tbody>
              {service.lifelines.rows.map((row) => (
                <tr key={row.incidentId} className="border-b border-gray-100 last:border-0">
                  <td className="py-3 pr-4 font-medium text-navy-900">
                    {row.area}
                    {row.municipality && (
                      <div className="text-xs font-normal text-gray-500">{row.municipality}</div>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <StatusPill label={row.Electricity} tone={LIFELINE_TONES[row.Electricity]} />
                  </td>
                  <td className="py-3 pr-4">
                    <StatusPill
                      label={row['Communication Network']}
                      tone={LIFELINE_TONES[row['Communication Network']]}
                    />
                  </td>
                  <td className="py-3 pr-4">
                    <StatusPill label={row['Roads and Bridges']} tone={LIFELINE_TONES[row['Roads and Bridges']]} />
                  </td>
                </tr>
              ))}
              {service.lifelines.rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-sm text-gray-500">
                    No assessment with a reporting area yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

import { RotateCcw } from 'lucide-react';
import { GhostButton, Panel, ProgressBar } from './ui';

/* ------------------------------------------------------------------ *
 * Tab 4 — Agency Reports
 * Who has submitted, and how long the assessment took compared with
 * the paper process it replaces.
 * ------------------------------------------------------------------ */
export default function AgencyReportsTab({ service, onReset }) {
  const a = service.agencies;
  const p = service.processing;

  const manualLabel = `${Math.floor(p.manualMinutes / 60)}h ${p.manualMinutes % 60}m`;
  const digitalLabel =
    p.digitalMinutes >= 60
      ? `${Math.floor(p.digitalMinutes / 60)}h ${Math.round(p.digitalMinutes % 60)}m`
      : `${Math.round(p.digitalMinutes)}m`;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Agency submission monitoring */}
      <Panel
        title="Agency Submission Monitoring"
        subtitle="Response groups recorded in Form 1 Section V."
        action={
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-navy-700">
            {a.total} agencies
          </span>
        }
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Submission rate</p>
        <p className="mt-1 text-3xl font-extrabold tracking-tight text-navy-900">{a.rate.toFixed(1)}%</p>

        <div className="mt-4">
          <ProgressBar
            segments={[
              { key: 'submitted', width: `${a.rate}%`, className: 'bg-green-500' }
            ]}
          />
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
          <span>Completed: {a.submitted}</span>
          <span>Pending: {a.pending}</span>
        </div>

        {a.names.length > 0 && (
          <div className="mt-5 border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Agencies</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {a.names.map((n) => (
                <span
                  key={n}
                  className="rounded-full bg-navy-100 px-2.5 py-1 text-xs font-medium text-navy-700"
                >
                  {n}
                </span>
              ))}
            </div>
          </div>
        )}
      </Panel>

      {/* Reporting and processing time */}
      <Panel title="RDANA Reporting & Processing Time" subtitle="Digital capture against the paper baseline.">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Manual</p>
            <p className="mt-2 text-2xl font-extrabold text-navy-900">{manualLabel}</p>
            <p className="mt-1 text-xs text-gray-500">Paper form, per assessment</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Digital</p>
            <p className="mt-2 text-2xl font-extrabold text-green-600">{digitalLabel}</p>
            <p className="mt-1 text-xs text-gray-500">
              {p.assessed > 0 ? `Average across ${p.assessed} assessment${p.assessed === 1 ? '' : 's'}` : 'No timing yet'}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <ProgressBar
            segments={[{ key: 'digital', width: `${Math.max(2, p.rate)}%`, className: 'bg-green-500' }]}
          />
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 text-xs text-gray-500">
          <span>
            {p.savedMinutes > 0
              ? `Saves about ${Math.round(p.savedMinutes)} minutes per report`
              : 'Time saved per report — needs timing data'}
          </span>
          <GhostButton icon={RotateCcw} onClick={onReset}>
            Reset view
          </GhostButton>
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-gray-400">
          The manual baseline is an assumption ({p.manualMinutes} minutes per paper RDANA form) used only
          for comparison. Digital time is measured on this device from the moment a form is opened until it
          is last edited.
        </p>
      </Panel>
    </div>
  );
}

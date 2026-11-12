import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getIncident } from '../lib/db';
import RefreshButton from '../components/RefreshButton';
import { useToast } from '../components/Toast';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { formTypeOf, getForm } from '../lib/forms';
import Report1 from '../components/reports/Report1';
import Report2 from '../components/reports/Report2';

export default function ReportView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const notify = useToast();
  const [inc, setInc] = useState(null);
  const signatureRef = useRef('');

  const { refresh, lastRefreshed, isRefreshing } = useAutoRefresh(
    async ({ silent } = {}) => {
      const found = await getIncident(id);
      if (!found || found.deletedAt) {
        navigate('/', { replace: true });
        return false;
      }
      const foundType = formTypeOf(found);
      if (foundType === 'building' || foundType === 'agriculture') {
        navigate('/', { replace: true });
        return false;
      }
      const sig = `${found.id}:${found.updatedAt || ''}`;
      if (silent && signatureRef.current === sig) {
        return false;
      }
      signatureRef.current = sig;
      setInc(found);
      return true;
    },
    { intervalMs: 5000 }
  );

  const handleRefresh = async () => {
    await refresh();
    notify.info('Report preview refreshed.');
  };

  if (!inc) {
    return <div className="empty">Loading…</div>;
  }

  const type = formTypeOf(inc);
  const form = getForm(type);

  // Form 2 is a wide, dense official form and prints landscape; Form 1
  // stays portrait. @page cannot be scoped with a selector, so the rule is
  // emitted from here, where the form type is known.
  const pageRule = `@media print { @page { size: ${type === 'phase2' ? 'landscape' : 'portrait'}; margin: 10mm; } }`;

  return (
    <div>
      <style>{pageRule}</style>

      <div className="toolbar no-print">
        <Link to={`/incident/${inc.id}`} className="btn btn-ghost btn-sm">
          ← Back to edit
        </Link>
        <div className="row">
          <RefreshButton
            onRefresh={handleRefresh}
            lastRefreshed={lastRefreshed}
            isRefreshing={isRefreshing}
            label="Refresh"
          />
          <span className="badge badge-navy">{form.formName}</span>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => window.print()}>
            Print / Save as PDF
          </button>
        </div>
      </div>

      <p className="page-sub no-print">
        {form.campaign} · prints as <b>{type === 'phase2' ? 'landscape' : 'portrait'}</b> (set in your
        browser&apos;s print dialog).
      </p>

      {type === 'phase2' ? (
        <Report2 inc={inc} />
      ) : (
        <Report1 inc={inc} />
      )}
    </div>
  );
}
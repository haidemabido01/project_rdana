import ComingSoonPanel from '../components/impact/ComingSoonPanel';

/* ------------------------------------------------------------------ *
 * MPDO portal — coming in a future update.
 *
 * The interface for the Municipal Planning & Development Office is
 * planned but outside the current MVP scope. This page is kept as a
 * placeholder so the route resolves and can be linked to from the
 * agency grid.
 * ------------------------------------------------------------------ */
const AGENCY = { code: 'MPDO', name: 'Municipal Planning and Development Office' };

export default function ImpactMpdo() {
  return (
    <div data-impact data-tailwind className="mx-auto w-full max-w-[1120px]">
      <ComingSoonPanel agency={AGENCY} />
    </div>
  );
}

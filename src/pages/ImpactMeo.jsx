import ComingSoonPanel from '../components/impact/ComingSoonPanel';

/* ------------------------------------------------------------------ *
 * MEO portal — coming in a future update.
 *
 * The interface for the Municipal Engineering Office is planned but
 * outside the current MVP scope. This page is kept as a placeholder
 * so the route resolves and can be linked to from the agency grid.
 * ------------------------------------------------------------------ */
const AGENCY = { code: 'MEO', name: 'Municipal Engineering Office' };

export default function ImpactMeo() {
  return (
    <div data-impact data-tailwind className="mx-auto w-full max-w-[1120px]">
      <ComingSoonPanel agency={AGENCY} />
    </div>
  );
}

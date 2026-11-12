import { useMemo, useRef, useState } from 'react';
import {
  buildAnalytics,
  buildIncidentOptions,
  collectFilterOptions,
  formTypeOf,
  sortIncidentsLatestFirst
} from '../lib/analytics';
import { datasetToIncidents } from '../lib/dataset';
import { listDatasets, listIncidents } from '../lib/db';
import { buildServiceAnalytics } from '../lib/services';
import { useAutoRefresh } from './useAutoRefresh';

/* One loading path for every screen that shows analytics. The Dashboard,
   the agency overview and the agency impact pages all mount this hook, so
   they read the same saved assessments and the same uploaded data set and
   therefore render the same figures. */
export function useAnalyticsData({ source, datasetId, intervalMs = 3000 } = {}) {
  const [incidents, setIncidents] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataVersion, setDataVersion] = useState('');
  const signatureRef = useRef('');

  const { refresh, lastRefreshed, isRefreshing } = useAutoRefresh(
    async ({ silent } = {}) => {
      const [incRows, dsRows] = await Promise.all([listIncidents(), listDatasets()]);
      const sorted = sortIncidentsLatestFirst(incRows);
      const incSig = sorted.map((r) => `${r.id}:${r.updatedAt || ''}`).join(',');
      const dsSig = dsRows.map((d) => `${d.id}:${d.uploadedAt || ''}`).join(',');
      const signature = `${incSig}||${dsSig}`;
      if (silent && signatureRef.current === signature) {
        return false;
      }
      signatureRef.current = signature;
      setIncidents(sorted);
      setDatasets(dsRows);
      setDataVersion(signature);
      setLoading(false);
      return true;
    },
    { intervalMs }
  );

  const activeDataset = useMemo(() => {
    if (datasetId) {
      const found = datasets.find((d) => d.id === datasetId);
      if (found) return found;
    }
    return datasets[0] || null;
  }, [datasets, datasetId]);

  const datasetIncidents = useMemo(
    () => (activeDataset ? datasetToIncidents(activeDataset) : []),
    [activeDataset]
  );

  /* Analytics covers only RDANA Form 1 and Form 2 records. Legacy
     Building Structure and Agriculture records are excluded. */
  const validIncidents = useMemo(
    () =>
      incidents.filter((inc) => {
        const type = formTypeOf(inc);
        return type === 'phase1' || type === 'phase2';
      }),
    [incidents]
  );

  /* Saved forms and uploaded data sets together, de-duplicated by id. This
     is the default for the Disaster Situation Overview so that filling a
     form or uploading a file immediately moves every headline figure. */
  const combinedIncidents = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const inc of [...validIncidents, ...datasetIncidents]) {
      if (!inc?.id || seen.has(inc.id)) continue;
      seen.add(inc.id);
      out.push(inc);
    }
    return out;
  }, [validIncidents, datasetIncidents]);

  const resolvedSource = source || (datasets.length > 0 ? 'dataset' : 'assessments');

  const activeIncidents = useMemo(() => {
    if (resolvedSource === 'combined') return combinedIncidents;
    if (resolvedSource === 'dataset' && datasets.length > 0) return datasetIncidents;
    return validIncidents;
  }, [resolvedSource, datasets.length, combinedIncidents, datasetIncidents, validIncidents]);

  const options = useMemo(() => collectFilterOptions(activeIncidents), [activeIncidents]);
  const incidentOptions = useMemo(() => buildIncidentOptions(activeIncidents), [activeIncidents]);
  const data = useMemo(() => buildAnalytics(activeIncidents), [activeIncidents]);
  const service = useMemo(() => buildServiceAnalytics(activeIncidents), [activeIncidents]);

  return {
    incidents: activeIncidents,
    savedIncidents: validIncidents,
    datasets,
    activeDataset,
    activeIncidents,
    datasetIncidents,
    validIncidents,
    resolvedSource,
    options,
    incidentOptions,
    data,
    service,
    loading,
    dataVersion,
    refresh,
    lastRefreshed,
    isRefreshing
  };
}

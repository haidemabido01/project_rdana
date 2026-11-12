import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  ClipboardList,
  Database,
  Eye,
  FileSpreadsheet,
  FileText,
  HeartPulse,
  Users
} from 'lucide-react';
import { formTypeOf, isFilledBuilding, sortLatestFirst } from '../../lib/analytics';
import { TAGBINA_BARANGAYS } from '../../lib/constants';
import { formatPeso, formatPesoShort } from '../../lib/damage';
import { datasetToIncidents } from '../../lib/dataset';
import { composeSitePlace, timeAgo } from '../../lib/format';
import BarangayRankingChart from './BarangayRankingChart';
import { KpiCard, MetaPill, Panel } from './ui';

const STANDARD_HAZARDS = ['Earthquake', 'Typhoon', 'Flood', 'Volcanic Eruption', 'Landslide', 'Fire', 'Other'];

function fileExt(name) {
  const ext = String(name || '').split('.').pop();
  return ext && ext !== name ? ext.toUpperCase() : 'FILE';
}

/* Mirrors each form's isUntitled rule: only a form that actually carries
   identifying data counts as filled, so stray empty drafts never show up
   in the Data Sets Details card. */
function isFilledAssessment(inc, type) {
  if (type === 'building') return isFilledBuilding(inc);
  if (type === 'phase2') {
    const h = inc.header || {};
    return Boolean(h.incidentName || h.affectedMunicipality || h.areaAssessed);
  }
  if (type === 'agriculture') {
    const h = inc.header || {};
    return Boolean(h.location || h.typeOfDisaster);
  }
  const p = inc.profile || {};
  return Boolean(composeSitePlace(p) || p.siteLocation || p.incidentName);
}

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/* Turns a saved record into the identifying fields the Overview needs:
   what form it is, its name, where it happened, the hazard, the headline
   numbers and who assessed it. */
function describeIncident(inc) {
  const type = formTypeOf(inc);
  const base = {
    key: inc.id,
    type,
    when: inc.updatedAt || inc.createdAt || '',
    reportHref: `/incident/${inc.id}/report`,
    editHref: `/incident/${inc.id}`
  };

  if (type === 'building') {
    const b = inc.building || {};
    const d = inc.disaster || {};
    const c = inc.classification || {};
    const s = inc.structure || {};
    const co = inc.condition || {};
    const cost = inc.cost || {};
    const a = inc.assessment || {};
    return {
      ...base,
      typeLabel: 'Building',
      title: b.buildingName || 'Assessed Building',
      subtitle: [
        c.buildingClassification || b.buildingOccupancy,
        b.buildingType || c.buildingType,
        b.floors ? `${b.floors} flr(s)` : ''
      ]
        .filter(Boolean)
        .join(' · '),
      barangay: [b.barangay, b.purok].filter(Boolean).join(', '),
      municipality: [b.municipality, b.province].filter(Boolean).join(', '),
      hazard: d.calamityType || 'Earthquake',
      hazardDetail: [
        d.magnitude ? `Mag ${d.magnitude}` : '',
        d.intensity ? `Int ${d.intensity}` : '',
        d.windSignal ? `Signal #${d.windSignal}` : '',
        d.rainfallWarning || ''
      ]
        .filter(Boolean)
        .join(' · '),
      date: d.dateOfCalamity || a.date || '',
      detail: [s.severity, co.usabilityStatus].filter(Boolean).join(' · '),
      components: Array.isArray(s.components) ? s.components : [],
      people: `${toNum(b.affectedIndividuals || b.occupants).toLocaleString()} affected · ${toNum(
        b.occupants
      ).toLocaleString()} occupants`,
      cost: cost.damageCost || cost.repairCost,
      assessor: a.assessorName || '—',
      office: a.office || 'MEO',
      when: inc.updatedAt || a.date || base.when
    };
  }

  if (type === 'phase2') {
    const h = inc.header || {};
    const s2 = inc.s2 || {};
    return {
      ...base,
      typeLabel: 'Form 2',
      title: h.incidentName || h.areaAssessed || 'Untitled assessment',
      subtitle: 'Phase 2 · within 3–15 days',
      barangay: h.areaAssessed || '',
      municipality: [h.affectedMunicipality, h.province].filter(Boolean).join(', '),
      hazard: h.typeOfDisaster || 'Disaster',
      hazardDetail: '',
      date: h.eventDateTime || h.reportDate || '',
      detail: `${toNum(s2.affectedBarangays).toLocaleString()} barangays affected`,
      components: [],
      people: `${toNum(s2.familiesAffected).toLocaleString()} families · ${toNum(
        s2.personsAffected
      ).toLocaleString()} individuals`,
      cost: '',
      assessor: '—',
      office: 'MDRRMO',
      when: inc.updatedAt || h.reportDate || base.when
    };
  }

  if (type === 'agriculture') {
    const h = inc.header || {};
    return {
      ...base,
      typeLabel: 'Agriculture',
      title: h.location || h.typeOfDisaster || 'Untitled agriculture assessment',
      subtitle: h.sector || 'Agriculture & Fisheries',
      barangay: h.location || '',
      municipality: '',
      hazard: h.typeOfDisaster || 'Disaster',
      hazardDetail: '',
      date: h.occurrenceDateTime || '',
      detail: 'Crops · Livestock · Fisheries',
      components: [],
      people: `${toNum(h.affectedFarmers).toLocaleString()} farmers affected`,
      cost: '',
      assessor: '—',
      office: 'OMAG',
      when: inc.updatedAt || h.occurrenceDateTime || base.when
    };
  }

  const p = inc.profile || {};
  const eff = inc.initialEffects || {};
  const types = Array.isArray(p.disasterTypes) ? p.disasterTypes : [];
  const profiles = inc.damage?.barangays || [];
  const structures = inc.damage?.structures || [];
  const structure = structures[0] || {};
  const cost =
    profiles.reduce((a, r) => a + toNum(r.estimatedCost), 0) ||
    structures.reduce((a, r) => a + toNum(r.estimatedCost), 0);
  const families = profiles.reduce((a, r) => a + toNum(r.affectedFamilies), 0);
  const isDataset = inc.source === 'dataset';
  const fields = inc.datasetFields || {};
  const units = toNum(structure.units);
  const subtitleParts = [
    !isDataset || fields.buildingType ? structure.buildingType : '',
    !isDataset || fields.structureType ? structure.structureType : '',
    (!isDataset || fields.units) && units
      ? `${units.toLocaleString()} unit${units === 1 ? '' : 's'}`
      : ''
  ].filter(Boolean);
  const detailParts = [
    !isDataset || fields.severity ? structure.damageLevel : '',
    `${families.toLocaleString()} families`,
    `${toNum(eff.affected?.total).toLocaleString()} individuals affected`
  ].filter(Boolean);
  return {
    ...base,
    type: isDataset ? 'dataset' : type,
    typeLabel: isDataset ? 'Uploaded' : 'Form 1',
    title:
      structure.buildingName ||
      composeSitePlace(p) ||
      p.siteLocation ||
      p.incidentName ||
      'Untitled assessment',
    subtitle: subtitleParts.length
      ? subtitleParts.join(' · ')
      : types.length
      ? types.join(' · ')
      : 'Phase 1 · within 72 hours',
    barangay: [p.barangay, p.purok].filter(Boolean).join(', '),
    municipality: [p.municipality, p.province].filter(Boolean).join(', '),
    hazard: types[0] || 'Disaster',
    hazardDetail: '',
    date: p.occurrenceTime || '',
    detail: detailParts.join(' · '),
    components: [],
    people: `${toNum(eff.displaced?.total).toLocaleString()} displaced · ${toNum(
      eff.dead?.total
    ).toLocaleString()} dead · ${toNum(eff.injured?.total).toLocaleString()} injured`,
    cost,
    assessor: isDataset ? inc.datasetAssessor || inc.datasetName || 'Uploaded file' : '—',
    office: isDataset ? inc.datasetOffice || 'Uploaded data set' : 'MDRRMO',
    when: inc.updatedAt || p.occurrenceTime || base.when
  };
}

const FORM_TYPE_TONES = {
  building: 'bg-brand-50 text-brand-700 border-brand-200',
  phase1: 'bg-blue-50 text-blue-700 border-blue-200',
  phase2: 'bg-purple-50 text-purple-700 border-purple-200',
  agriculture: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  dataset: 'bg-cyan-50 text-cyan-700 border-cyan-200'
};

/* Shared detail table so saved forms and uploaded data set rows read the
   same way — record name, location, hazard, headline numbers and who/what
   produced the record. */
function DetailTable({ rows, emptyMessage, dataset = false }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] text-left text-xs">
        <thead>
          <tr className="border-b border-gray-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-600">
            <th className="py-3 px-3">Form / Record</th>
            <th className="py-3 px-3">Location</th>
            <th className="py-3 px-3">Hazard &amp; Date</th>
            <th className="py-3 px-3">Details</th>
            <th className="py-3 px-3">People / Cost</th>
            <th className="py-3 px-3">Assessor / Office</th>
            <th className="py-3 px-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} className="py-6 text-center text-sm text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          )}

          {rows.map((row) => {
            const components = row.components || [];
            return (
              <tr key={row.key} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-3 align-top">
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                      FORM_TYPE_TONES[row.type] || FORM_TYPE_TONES.phase1
                    }`}
                  >
                    {row.typeLabel}
                  </span>
                  <div className="mt-1 font-bold text-navy-900" title={row.title}>
                    {row.title}
                  </div>
                  {row.subtitle && <div className="text-[10px] text-slate-400">{row.subtitle}</div>}
                </td>
                <td className="py-3 px-3 align-top">
                  <div className="font-semibold text-navy-900">{row.barangay || '—'}</div>
                  <div className="text-[11px] text-slate-500">{row.municipality || '—'}</div>
                </td>
                <td className="py-3 px-3 align-top">
                  <div className="font-semibold text-navy-900">{row.hazard || '—'}</div>
                  {row.hazardDetail && (
                    <div className="text-[11px] text-slate-500">{row.hazardDetail}</div>
                  )}
                  {row.date && <div className="text-[10px] text-slate-400">{row.date}</div>}
                </td>
                <td className="py-3 px-3 align-top">
                  {row.detail && <div className="text-slate-600">{row.detail}</div>}
                  {components.length > 0 && (
                    <div className="mt-1 flex max-w-[240px] flex-wrap gap-1">
                      {components.slice(0, 4).map((c) => (
                        <span
                          key={c}
                          className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600"
                        >
                          {c}
                        </span>
                      ))}
                      {components.length > 4 && (
                        <span className="text-[10px] text-slate-400">
                          +{components.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </td>
                <td className="py-3 px-3 align-top">
                  <div className="text-slate-600">{row.people}</div>
                  {row.cost > 0 && (
                    <div className="mt-0.5 font-bold text-navy-900">{formatPeso(row.cost)}</div>
                  )}
                </td>
                <td className="py-3 px-3 align-top">
                  <div className="font-medium text-navy-900">{row.assessor}</div>
                  <div className="text-[11px] text-slate-500">{row.office}</div>
                  {row.when && (
                    <div className="text-[10px] text-slate-400">
                      Updated {timeAgo(row.when) || 'just now'}
                    </div>
                  )}
                </td>
                <td className="py-3 px-3 align-top text-right">
                  {dataset ? (
                    <Link
                      to="/data-sets"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Manage
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  ) : (
                    <div className="inline-flex items-center gap-1.5">
                      <Link
                        to={row.reportHref}
                        className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2.5 py-1 text-[11px] font-bold text-brand-700 border border-brand-200 hover:bg-brand-100"
                      >
                        <FileText className="h-3 w-3" />
                        Report
                      </Link>
                      <Link
                        to={row.editHref}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Eye className="h-3 w-3" />
                        Edit
                      </Link>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* One uploaded file, with its parsed records shown in the same detail table
   as saved forms. Large files start collapsed to keep the Overview fast. */
function UploadGroup({ group, filtered = false }) {
  const [expanded, setExpanded] = useState(false);
  const DEFAULT_LIMIT = 500;
  const canExpand = group.records.length > DEFAULT_LIMIT;
  const visible =
    expanded || !canExpand ? group.records : group.records.slice(0, DEFAULT_LIMIT);
  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 bg-slate-50/70 px-3 py-2.5">
        <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <FileSpreadsheet className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-navy-900" title={group.name}>
            {group.name}
          </div>
          <div className="text-[10px] text-slate-500">
            {group.kind} ·{' '}
            {filtered
              ? `${group.records.length.toLocaleString()} of ${group.rowCount.toLocaleString()} rows`
              : `${group.rowCount.toLocaleString()} rows`}{' '}
            · {group.columns.length.toLocaleString()} columns
            {group.when ? ` · uploaded ${timeAgo(group.when) || 'just now'}` : ''}
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
          <CheckCircle2 className="h-3 w-3" strokeWidth={2.4} />
          Uploaded
        </span>
        <Link
          to="/data-sets"
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
        >
          Manage
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
      <DetailTable
        rows={visible}
        dataset
        emptyMessage="This file has no rows that could be read as assessment records."
      />
      {canExpand && (
        <div className="border-t border-gray-100 px-3 py-2 text-center">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-[11px] font-bold text-brand-700 hover:text-brand-800"
          >
            {expanded
              ? 'Show fewer rows'
              : `Show all ${group.records.length.toLocaleString()} rows`}
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Tab 1 — Overview
 * The headline numbers for the incident, then the barangay ranking
 * that tells the authority which area to serve first.
 * ------------------------------------------------------------------ */
export default function OverviewTab({
  data,
  rankingBarangays,
  filters,
  onFilter,
  options,
  datasets = [],
  incidents = []
}) {
  const t = data.totals;
  const earthquake = data.earthquake || {
    assessments: 0,
    families: 0,
    affected: 0,
    displaced: 0,
    dead: 0,
    injured: 0,
    cost: 0
  };
  /* Latest saved Building Structure assessment on top, regardless of the
     order the caller happened to pass the records in. */
  const buildingAssessments = useMemo(
    () => sortLatestFirst(data.buildingAssessments || []),
    [data.buildingAssessments]
  );
  const bt = data.buildingTotals || {
    assessments: 0,
    cost: 0,
    families: 0,
    personsAffected: 0,
    displaced: 0,
    damagedUnits: 0,
    earthquakeAssessments: 0,
    earthquakeCost: 0,
    earthquakeFamilies: 0,
    earthquakeAffected: 0,
    latestBuildingName: ''
  };
  const hasBuilding = bt.assessments > 0;
  const buildingNote = hasBuilding
    ? ` · incl. ${formatPesoShort(bt.cost)} from ${bt.assessments} Building Structure${bt.assessments === 1 ? '' : 's'}`
    : '';

  const hazardOptions = useMemo(() => {
    const set = new Set(STANDARD_HAZARDS);
    for (const h of options.hazards || []) {
      if (h) set.add(h);
    }
    return [...set];
  }, [options.hazards]);

  /* Every Tagbina barangay, ranked by affected families (or recorded
     earthquake damages/assessments when family counts are not separate).
     Barangays with no record yet stay on the chart as empty slots, so
     the graph is complete from the first load and fills itself in as
     forms or Excel dataset rows arrive. */
  const sourceBarangays = rankingBarangays || data.barangays;
  const ranking = useMemo(() => {
    const agg = new Map();
    for (const b of sourceBarangays) {
      const name = String(b.barangay || '').trim();
      if (!name) continue;
      const key = name.toLowerCase();
      const cur = agg.get(key) || { name, families: 0, damaged: 0, assessments: 0 };
      cur.families += Number(b.families) || 0;
      cur.damaged += Number(b.damaged) || 0;
      cur.assessments += Number(b.assessments) || 0;
      agg.set(key, cur);
    }

    const totalFamilies = [...agg.values()].reduce((s, c) => s + c.families, 0);
    const totalDamaged = [...agg.values()].reduce((s, c) => s + c.damaged, 0);

    const isFiltered = filters.incident && filters.incident !== 'all';
    const names = isFiltered ? [...agg.values()].map((c) => c.name) : [...TAGBINA_BARANGAYS];
    if (!isFiltered) {
      for (const [key, cur] of agg) {
        if (!names.some((n) => n.toLowerCase() === key)) names.push(cur.name);
      }
    }

    const rows = names.map((name) => {
      const rec = agg.get(name.toLowerCase());
      const value = rec
        ? totalFamilies > 0 && rec.families > 0
          ? rec.families
          : totalDamaged > 0 && rec.damaged > 0
          ? rec.damaged
          : rec.families || rec.damaged || rec.assessments
        : 0;
      return {
        key: name.toLowerCase(),
        label: name,
        value,
        hasData: Boolean(rec)
      };
    });

    rows.sort(
      (a, b) =>
        b.value - a.value ||
        Number(b.hasData) - Number(a.hasData) ||
        a.label.localeCompare(b.label)
    );

    let rank = 0;
    return rows.map((r) => {
      if (r.value > 0) rank += 1;
      return { ...r, rank: r.value > 0 ? rank : null };
    });
  }, [sourceBarangays, filters.incident]);

  /* Two separate registries: every filled assessment record with its actual
     saved data, and every uploaded CSV/Excel file. Each is newest-first. */
  const datasetDetails = useMemo(() => {
    const selectedId = filters.incident && filters.incident !== 'all' ? filters.incident : null;

    const formRows = incidents
      .filter((inc) => isFilledAssessment(inc, formTypeOf(inc)))
      .filter((inc) => !selectedId || inc.id === selectedId)
      .map((inc) => describeIncident(inc))
      .sort((a, b) => new Date(b.when || 0) - new Date(a.when || 0));

    /* Each uploaded file is expanded into the same per-record detail rows as
       a saved form, so building name, location, type, damage and cost from
       e.g. "cleaned_Building_Structure assessment tagbina" are readable.
       When one building/assessment is picked, only its row is kept. */
    const uploadGroups = datasets
      .map((ds) => {
        const cols = ds.columns || [];
        const records = datasetToIncidents(ds)
          .filter((inc) => !selectedId || inc.id === selectedId)
          .map((inc) => describeIncident(inc))
          .sort((a, b) => String(a.title || '').localeCompare(String(b.title || '')));
        return {
          key: `upload-${ds.id}`,
          id: ds.id,
          name: ds.name,
          kind: fileExt(ds.name),
          columns: cols,
          rowCount: ds.rows?.length || 0,
          when: ds.uploadedAt || '',
          records
        };
      })
      .filter((group) => !selectedId || group.records.length > 0)
      .sort((a, b) => new Date(b.when || 0) - new Date(a.when || 0));

    const uploadRowCount = uploadGroups.reduce((sum, g) => sum + g.records.length, 0);
    return { formRows, uploadGroups, uploadRowCount, selectedId };
  }, [datasets, incidents, filters.incident]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <select
          aria-label="Select incident"
          value={filters.incident}
          onChange={(e) => onFilter('incident', e.target.value)}
          className="w-auto min-w-[11rem] rounded-full border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 outline-none transition-colors hover:border-brand-300 focus:border-brand-500"
        >
          <option value="all">All assessments</option>
          {options.incidents.map((inc) => (
            <option key={inc.id} value={inc.id}>
              {inc.label}
            </option>
          ))}
        </select>

        <select
          aria-label="Select disaster type"
          value={filters.hazard}
          onChange={(e) => onFilter('hazard', e.target.value)}
          className="w-auto min-w-[11rem] rounded-full border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 outline-none transition-colors hover:border-brand-300 focus:border-brand-500"
        >
          <option value="all">All hazards</option>
          {hazardOptions.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>

        <select
          aria-label="Select area"
          value={filters.area}
          onChange={(e) => onFilter('area', e.target.value)}
          className="w-auto min-w-[11rem] rounded-full border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 outline-none transition-colors hover:border-brand-300 focus:border-brand-500"
        >
          <option value="all">All areas</option>
          {options.barangays.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>

        <div className="flex flex-wrap gap-2">
          <MetaPill accent="navy">{`${t.assessments} assessment${t.assessments === 1 ? '' : 's'}`}</MetaPill>
          <MetaPill accent="green">{`${t.barangays} reporting area${t.barangays === 1 ? '' : 's'}`}</MetaPill>
          {t.critical > 0 && <MetaPill accent="red">{`${t.critical} critical`}</MetaPill>}
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={Banknote}
          accent="brand"
          title="Total Estimated Damage Cost"
          value={formatPeso(t.cost)}
          subtext={`${t.damagedUnits.toLocaleString()} damaged housing unit${
            t.damagedUnits === 1 ? '' : 's'
          } recorded${buildingNote}`}
        />
        <KpiCard
          icon={Users}
          accent="navy"
          title="Affected Families & Individuals"
          value={t.families.toLocaleString()}
          unit="families"
          subtext={`${t.personsAffected.toLocaleString()} individuals affected${
            hasBuilding
              ? ` · ${bt.families.toLocaleString()} fam / ${bt.personsAffected.toLocaleString()} ind from Building Structures`
              : ''
          }`}
        />
        <KpiCard
          icon={HeartPulse}
          accent="blue"
          title="Displaced Persons"
          value={t.displaced.toLocaleString()}
          subtext={`${t.dead.toLocaleString()} dead · ${t.injured.toLocaleString()} injured${
            hasBuilding && bt.displaced > 0
              ? ` · ${bt.displaced.toLocaleString()} displaced from Building Structures`
              : ''
          }`}
        />
        <KpiCard
          icon={Activity}
          accent="red"
          title={earthquake.assessments > 0 || t.assessments === 0 ? 'Earthquake Assessments' : 'Recorded Assessments'}
          value={(earthquake.assessments > 0 ? earthquake.assessments : t.assessments).toLocaleString()}
          subtext={
            earthquake.assessments > 0
              ? `${earthquake.families.toLocaleString()} families · ${earthquake.affected.toLocaleString()} individuals · ${formatPesoShort(
                  earthquake.cost
                )} damage${
                  bt.earthquakeAssessments > 0
                    ? ` · ${bt.earthquakeAssessments} from Building Structures (${formatPesoShort(
                        bt.earthquakeCost
                      )})`
                    : ''
                }`
              : t.assessments > 0
              ? `${t.families.toLocaleString()} families · ${t.personsAffected.toLocaleString()} individuals · ${formatPesoShort(
                  t.cost
                )} damage${buildingNote}`
              : 'No assessments in this selection'
          }
        />
      </div>

      {hasBuilding && (
        <p className="text-xs text-gray-500">
          Auto-updated from saved Building Structure forms — latest:{' '}
          <b className="text-navy-900">
            {bt.latestBuildingName || buildingAssessments[0]?.buildingName || 'Building Structure'}
          </b>
          {buildingAssessments[0]?.updatedAt
            ? ` · updated ${timeAgo(buildingAssessments[0].updatedAt)}`
            : ''}{' '}
          · Totals, families, displaced, earthquake count, ranking and Damage &amp; Services refresh
          automatically on save.
        </p>
      )}

      {/* Barangay ranking — the respond-first chart */}
      <Panel
        title="Affected Families by Reporting Area"
        subtitle="Affected families per Tagbina barangay (Form 1), ranked — the leftmost bars are the first areas to respond to. Updates automatically on save."
      >
        <BarangayRankingChart
          rows={ranking}
          emptyTitle="No affected families recorded yet"
          emptyHint="Fill the Barangay Damage Profile (Section VIII) of a Phase 1 assessment. Every barangay is already plotted — the bars fill in automatically once records come in."
        />
      </Panel>

      {/* Disaster Situation Details — forms and uploads kept separate */}
      <Panel
        title="Disaster Situation Details"
        subtitle={
          datasetDetails.selectedId
            ? 'Showing only the selected building/assessment — choose “All assessments” to see every form and uploaded row.'
            : 'Assessment forms and uploaded data sets are shown separately below, each with the most recent activity first.'
        }
        action={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 border border-brand-200">
            <Database className="h-3.5 w-3.5" />
            {datasetDetails.formRows.length} form{datasetDetails.formRows.length === 1 ? '' : 's'} ·{' '}
            {datasetDetails.uploadGroups.length} file{datasetDetails.uploadGroups.length === 1 ? '' : 's'}
          </span>
        }
      >
        {(!datasetDetails.selectedId || datasetDetails.formRows.length > 0) && (
          <>
            <div className="mb-3 flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-brand-600" />
              <h3 className="text-sm font-bold text-navy-900">Assessment Forms — Filled Data</h3>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                {datasetDetails.formRows.length}
              </span>
            </div>
            <DetailTable
              rows={datasetDetails.formRows}
              emptyMessage="No filled assessment forms yet. Fill and save any form — the data will appear here automatically."
            />
          </>
        )}

        {(!datasetDetails.selectedId || datasetDetails.uploadGroups.length > 0) && (
          <>
            <div
              className={`mb-3 flex flex-wrap items-center gap-2 ${
                !datasetDetails.selectedId || datasetDetails.formRows.length > 0
                  ? 'mt-6 border-t border-gray-100 pt-5'
                  : ''
              }`}
            >
              <Database className="h-4 w-4 text-brand-600" />
              <h3 className="text-sm font-bold text-navy-900">Uploaded Data Sets</h3>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                {datasetDetails.uploadGroups.length}
              </span>
              {datasetDetails.uploadRowCount > 0 && (
                <span className="text-[10px] text-slate-400">
                  {datasetDetails.uploadRowCount.toLocaleString()} readable rows
                </span>
              )}
            </div>
            {datasetDetails.uploadGroups.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center">
                <FileSpreadsheet className="mx-auto h-8 w-8 text-gray-400" strokeWidth={1.6} />
                <p className="mt-2 text-sm font-semibold text-navy-900">No uploaded data sets yet.</p>
                <p className="mt-1 text-xs text-gray-500">
                  Upload a CSV/Excel file from Data Sets — its rows will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {datasetDetails.uploadGroups.map((group) => (
                  <UploadGroup
                    key={group.key}
                    group={group}
                    filtered={Boolean(datasetDetails.selectedId)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </Panel>

    </div>
  );
}

import {
  HeartPulse,
  Map,
  School,
  ShieldAlert,
  Sprout,
  HandHelping,
  Wheat,
  Wrench
} from 'lucide-react';
import {
  buildAgencyAssessments,
  buildAgencyChart,
  buildAgencyMetrics,
  buildAgencyReporting
} from './agencyMetrics';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'assessments', label: 'Assessments' },
  { key: 'permissions', label: 'Permissions' }
];

export const MDRRMO_HEADER = {
  code: 'MDRRMO',
  title: 'OCD – MDRRMO',
  subtitle: 'Central Disaster Operations Administrator',
  representative: '—',
  description:
    'Coordinate disaster operations, emergency response, and recovery reporting across the municipality.',
  tone: 'brand',
  icon: ShieldAlert
};

const BASE = {
  mdrrmo: {
    tone: 'brand',
    header: {
      code: 'MDRRMO',
      title: 'OCD – MDRRMO',
      subtitle: 'Disaster Risk Reduction & Management',
      representative: 'Juan Dela Cruz',
      description:
        'Central coordinator for disaster operations, emergency response activation, multi-agency reporting, and recovery monitoring across all barangays.',
      icon: ShieldAlert
    }
  },
  mho: {
    tone: 'blue',
    header: {
      code: 'MHO',
      title: 'DOH – MHO',
      subtitle: 'Health and Medical Assessment',
      representative: 'Dr. Cindy Barriga-Balahay',
      description:
        'Assess medical assistance requirements, health facility conditions, and disaster-related health service needs.',
      icon: HeartPulse
    }
  },
  deped: {
    tone: 'purple',
    header: {
      code: 'DepEd',
      title: 'DepEd',
      subtitle: 'Education and School Damage Assessment',
      representative: 'Myrna Mozo',
      description:
        'Monitor damaged educational facilities, affected classrooms, learning disruptions, and schools used as evacuation centers.',
      icon: School
    }
  },
  omag: {
    tone: 'green',
    header: {
      code: 'OMAG',
      title: 'DA – OMAG',
      subtitle: 'Agricultural Damage Assessment',
      representative: 'Warlito D. Untua',
      description:
        'Monitor agricultural damage, affected farmland, crop losses, livestock impacts, and agricultural recovery needs.',
      icon: Sprout
    }
  },
  mswdo: {
    tone: 'red',
    header: {
      code: 'MSWDO',
      title: 'MSWDO',
      subtitle: 'Social Welfare & Disaster Assistance',
      representative: 'Crissalen Danao',
      description:
        'Coordinate social protection, relief distribution, psychosocial support, and welfare needs for disaster-affected families and vulnerable groups.',
      icon: HandHelping
    }
  },
  masso: {
    tone: 'green',
    header: {
      code: 'MASSO',
      title: 'MASSO',
      subtitle: 'Municipal Agriculture Services Office',
      representative: 'Ricardo Lumibao',
      description:
        'Assess damage to agricultural inputs, seed stocks, irrigation systems, and provide post-disaster agricultural recovery support to affected farmers.',
      icon: Wheat
    }
  },
  meo: {
    tone: 'yellow',
    header: {
      code: 'MEO',
      title: 'MEO',
      subtitle: 'Infrastructure & Public Works Damage Assessment',
      representative: 'Engr. Roberto Fernandez',
      description:
        'Assess damage to roads, bridges, flood control structures, public buildings, and utilities. Coordinate emergency repairs and infrastructure recovery.',
      icon: Wrench
    }
  },
  mpdo: {
    tone: 'navy',
    header: {
      code: 'MPDO',
      title: 'MPDO',
      subtitle: 'Municipal Planning & Disaster Risk Coordination',
      representative: 'Atty. Leonora Villanueva',
      description:
        'Consolidate multi-agency damage data, coordinate recovery planning, track rehabilitation progress, and maintain the disaster risk reduction master plan.',
      icon: Map
    }
  }
};

const EMPTY_CTX = {
  incidents: [],
  options: { barangays: [] },
  incidentOptions: [],
  data: null,
  service: null
};

function filtersFor(ctx) {
  const incidents = (ctx.incidentOptions || []).map((option) => ({
    id: option.id,
    label: option.label
  }));
  const areas = (ctx.options?.barangays || []).map((barangay) => ({
    id: barangay,
    label: barangay
  }));
  return {
    incidents: [{ id: 'all', label: 'All assessments' }, ...incidents],
    areas: [{ id: 'all', label: 'All Areas' }, ...areas]
  };
}

export function buildAgencyView(agencyId, ctx = EMPTY_CTX) {
  const base = BASE[agencyId];
  if (!base) return null;
  const charts = buildAgencyChart(agencyId, ctx);
  return {
    tone: base.tone,
    header: base.header,
    filters: filtersFor(ctx),
    tabs: TABS,
    metrics: buildAgencyMetrics(agencyId, ctx),
    chart: charts.impact,
    overviewChart: charts.overview,
    reporting: buildAgencyReporting(ctx),
    assessments: buildAgencyAssessments(agencyId, ctx)
  };
}

export const MVP_AGENCY_IDS = ['mdrrmo', 'omag', 'mho', 'deped'];

export function buildAgencyPortals(ctx = EMPTY_CTX) {
  return {
    mdrrmo: {
      agencyId: 'mdrrmo',
      label: 'OCD – MDRRMO',
      view: buildAgencyView('mdrrmo', ctx)
    },
    mho: {
      agencyId: 'mho',
      label: 'DOH – MHO',
      view: buildAgencyView('mho', ctx)
    },
    omag: {
      agencyId: 'omag',
      label: 'DA – OMAG',
      view: buildAgencyView('omag', ctx)
    },
    deped: {
      agencyId: 'deped',
      label: 'DepEd',
      view: buildAgencyView('deped', ctx)
    }
  };
}

export const MDRRMO_VIEW = buildAgencyView('mdrrmo');
export const MHO_VIEW = buildAgencyView('mho');
export const DEPED_VIEW = buildAgencyView('deped');
export const OMA_VIEW = buildAgencyView('omag');
export const AGENCY_PORTALS = buildAgencyPortals();

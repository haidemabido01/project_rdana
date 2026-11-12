import { uid } from './model';
import {
  ACCESS_TARGETS,
  ALT_WATER_SOURCES,
  COORD_CLUSTERS,
  COORD_LEVELS,
  FOOD_SOURCE_ROWS,
  HEALTH_SUPPLY_ROWS,
  INFO_FLOW_BODIES,
  LIVELIHOOD_SECTORS,
  PROTECTION_CHILD_ROWS,
  SANITATION_ROWS,
  SCHOOL_ROWS,
  SERVICE_ROWS
} from './constants2';

export const FORM2_TYPE = 'phase2';

const now = () => new Date().toISOString();

const presetRows = (list, fields) =>
  list.map((r) => ({ id: uid(), key: r.key, label: r.label, ...fields }));

/* ---- 3. Affected Roads and Bridges -------------------------------- */
export const blankRoad = () => ({
  id: uid(),
  classification: '',
  areaLocation: '',
  damageDescription: '',
  status: ''
});

export const blankBridge = () => ({
  id: uid(),
  areaLocation: '',
  bridgeName: '',
  damageDescription: '',
  status: ''
});

/* ---- 6b. Health Establishments ------------------------------------ */
export const blankFacility = () => ({
  id: uid(),
  facilityName: '',
  category: '',
  operationalNo: '',
  nonOperationalNo: '',
  bedsAvailable: '',
  water: '',
  electricity: '',
  backupPower: '',
  damageType: ''
});

/* ---- 7g / 8d / 8e / 9 / 10 / 11f / 12 repeatable needs tables ----- */
export const blankNeedsRow = () => ({ id: uid(), needs: '', quantity: '', families: '', observations: '' });

export const blankIntervention = () => ({
  id: uid(),
  donorSource: '',
  existingProgramYN: '',
  productsDistributed: '',
  availableInventory: ''
});

export const blankFoodNeed = () => ({
  id: uid(),
  assessedNeeds: '',
  quantity: '',
  families: '',
  observations: ''
});

/* ---- 13a. Cluster x Administrative level grid (9 x 6 = 54) --------- */
export function blankCoordGrid() {
  const grid = {};
  for (const c of COORD_CLUSTERS) {
    grid[c.key] = {};
    for (const l of COORD_LEVELS) grid[c.key][l.key] = '';
  }
  return grid;
}

export function createForm2() {
  return {
    id: uid(),
    formType: FORM2_TYPE,
    // Deferred seam: id of the Phase 1 record this assessment follows up on.
    // Not populated yet — the Form 1 <-> Form 2 relationship is still open.
    caseId: '',
    createdAt: now(),
    updatedAt: now(),

    /* ---------------- Assessment header ---------------- */
    header: {
      province: '',
      incidentName: '',
      reportDate: '',
      eventDateTime: '',
      participatingAgencies: [{ id: uid(), name: '' }],
      gpsLat: '',
      gpsLng: '',
      gpsAccuracy: '',
      affectedMunicipality: '',
      areaAssessed: ''
    },

    /* ---------------- 1. Situation before the disaster ---------------- */
    s1: {
      totalPopulation: '',
      men: '',
      women: '',
      avgPersonsPerFamily: '',
      pwdCount: '',
      povertyRate: ''
    },

    /* ---------------- 2. Situation after the disaster ----------------- */
    s2: {
      affectedBarangays: '',
      personsAffected: '',
      familiesAffected: '',
      personsDisplaced: '',
      familiesDisplaced: '',
      childrenUnder2: '',
      pregnantWomen: '',
      elderly60: '',
      ips: '',
      pwds: '',
      deaths: '',
      injured: '',
      missing: ''
    },

    /* ---------------- 3. Affected roads and bridges ------------------- */
    s3: {
      roads: [blankRoad()],
      bridges: [blankBridge()]
    },

    /* ---------------- 4. Accessibility -------------------------------- */
    s4: {
      routes: ACCESS_TARGETS.map((t) => ({ id: uid(), key: t.key, label: t.label, byLand: '', byAir: '', byWater: '' })),
      observations: ''
    },

    /* ---------------- 5. Electricity, communication and fuel ---------- */
    s5: {
      services: presetRows(SERVICE_ROWS, { status: [], why: '' }),
      observations: ''
    },

    /* ---------------- 6. Health ---------------------------------------- */
    s6: {
       supplies: presetRows(HEALTH_SUPPLY_ROWS, { available: '', extra: '', satisfies: '' }),
       suppliesOthers: '',
      facilities: [blankFacility()],
      disposal: { corpsesYN: '', humanCorpseProblem: '', animalCorpseProblem: '' },
      impact: '',
      earlyRecoveryIssues: '',
      observations: ''
    },

    /* ---------------- 7. WASH ----------------------------------------- */
    s7: {
      waterBeforeYN: '',
      sufficientPct: '',
      poorPct: '',
      nonePct: '',
      waterObservations: '',
      dwellingsWithWaterPct: '',
      altSurfaceYN: '',
      altSubterraneanYN: '',
      altObservations: '',
      altWater: presetRows(ALT_WATER_SOURCES, { damaged: '', contaminated: '', destroyed: '', remarks: '' }),
      impactWater: '',
      latrines: { functionalYN: '', unitsDamaged: '', observations: '' },
      sewer: { functionalYN: '', observations: '' },
      septic: { functionalYN: '', observations: '' },
      solidWaste: { functionalYN: '', observations: '' },
      greyBlack: { functionalYN: '', observations: '' },
      rubbish: { functionalYN: '', observations: '' },
      sanitationNeeds: [blankNeedsRow()],
      impactSanitation: '',
      earlyRecoveryIssues: '',
      observations: ''
    },

    /* ---------------- 8. Food and nutrition --------------------------- */
    s8: {
      sources: presetRows(FOOD_SOURCE_ROWS, { before: '', after: '', observations: '' }),
      /* The form lists five items under "Means for affected families to prepare
         food", each with its own Yes / No and its own Observations column. */
      prepare: {
        waterYN: '',
        waterObs: '',
        kitchenYN: '',
        kitchenObs: '',
        fuelYN: '',
        fuelObs: '',
        utensilsYN: '',
        utensilsObs: '',
        reservesYN: '',
        reservesObs: ''
      },
      reserves: {
        affectedYN: '',
        displacedYN: '',
        duration: '',
        capacityYN: '',
        observations: ''
      },
      interventions: [blankIntervention()],
      foodNeeds: [blankFoodNeed()],
      impact: '',
      earlyRecoveryIssues: '',
      observations: ''
    },

    /* ---------------- 9. Shelter -------------------------------------- */
    s9: {
      totallyDamaged: '',
      partiallyDamaged: '',
      familiesEvacDestroyed: '',
      familiesWithHosts: '',
      shelterNeeds: [blankNeedsRow()],
      impact: '',
      earlyRecoveryIssues: '',
      observations: ''
    },

    /* ---------------- 10. Livelihood ---------------------------------- */
    s10: {
      sectors: presetRows(LIVELIHOOD_SECTORS, { impact: '', mainly: '', familiesAffected: '' }),
      livelihoodNeeds: [blankNeedsRow()],
      impact: '',
      earlyRecoveryIssues: '',
      observations: ''
    },

    /* ---------------- 11. Protection ---------------------------------- */
    s11: {
      children: presetRows(PROTECTION_CHILD_ROWS, { total: '', boys: '', girls: '' }),
      mistreatmentAbuseYN: '',
      psychosocialOrgsYN: '',
      rightsOrgsYN: '',
      barriers: '',
      protectionNeeds: [blankNeedsRow()],
      impact: '',
      earlyRecoveryIssues: '',
      observations: ''
    },

    /* ---------------- 12. Education ----------------------------------- */
    s12: {
      schools: SCHOOL_ROWS.map((r) => ({ id: uid(), key: r.key, label: r.label, totalExisting: '', partiallyDamaged: '', totallyDamaged: '' })),
      educationNeeds: [blankNeedsRow()],
      impact: '',
      earlyRecoveryIssues: '',
      observations: ''
    },

    /* ---------------- 13. Organization and coordination ---------------- */
    s13: {
      grid: blankCoordGrid(),
      infoFlow: INFO_FLOW_BODIES.map((b) => ({ id: uid(), key: b.key, label: b.label, existsYN: '' })),
      mainNeeds: '',
      impact: '',
      earlyRecoveryIssues: '',
      observations: ''
    }
  };
}
import { FORM2_CAMPAIGN, FORM2_SUBTITLE, FORM2_TITLE } from '../constants2';
import { createIncident } from '../model';
import { createForm2 } from '../model2';
import { issuesBySection, validateIncident } from '../validate';
import { validateForm2 } from '../validate2';
import { composeSitePlace, displayDT } from '../format';
import * as F1 from '../../components/sections';
import * as F2 from '../../components/sections2';

/* ------------------------------------------------------------------ *
 * RDANA Form 1 — Phase 1, within 72 hours
 * ------------------------------------------------------------------ */
const form1 = {
  formType: 'phase1',
  label: 'Phase 1',
  formName: 'Form 1',
  campaign: 'RDANA Form 1 — Phase 1 (within 72 hours)',
  reportTitle: 'Rapid Damage Assessment and Needs Analysis',
  reportSubtitle: '(Initial Report / Form I — Phase 1, within 72 hours)',
  create: createIncident,
  validate: validateIncident,

  sections: [
    { key: 'I', title: 'Profile of the Disaster' },
    { key: 'II', title: 'Initial Effects' },
    { key: 'III', title: 'Status of Lifelines & Critical Facilities' },
    { key: 'IV', title: 'Other Health & Non-Health Issues' },
    { key: 'V', title: 'Initial Response Actions' },
    { key: 'VI', title: 'Initial Needs Assessment' },
    { key: 'VII', title: 'Damage Register — Houses & Buildings' },
    { key: 'VIII', title: 'Barangay Damage Profile & Priority' }
  ],

  title: (inc) =>
    composeSitePlace(inc.profile) || inc.profile?.siteLocation || 'Untitled assessment',

  /* True when nothing identifies the assessment yet. Used to warn about
     stray empty drafts. */
  isUntitled: (inc) => {
    const p = inc.profile || {};
    return !(composeSitePlace(p) || p.siteLocation || p.incidentName);
  },

  listLine: (inc) => {
    const p = inc.profile || {};
    const types = Array.isArray(p.disasterTypes) ? p.disasterTypes : [];
    return {
      title: composeSitePlace(p) || p.siteLocation || 'Untitled assessment',
      sub: types.length ? types.join(' · ') : 'Type not set',
      occurrence: p.occurrenceTime
    };
  },

  renderSection: (page, ctx) => {
    const { inc, f1, psgc, gps, notify } = ctx;
    switch (page) {
      case 0:
        return (
          <F1.ProfileSection
            profile={inc.profile}
            onChange={f1.updateProfile}
            onNow={f1.onNow}
            onGps={gps.onGet}
            gpsBusy={gps.busy}
            gpsError={gps.error}
            gpsAccuracy={gps.accuracy}
            gpsWeak={gps.weak}
            locationRegions={psgc.regions}
          />
        );
      case 1:
        return (
          <F1.EffectsSection
            effects={inc.initialEffects}
            onChange={f1.updateEffects}
            onSetTotalMode={f1.setTotalMode}
          />
        );
      case 2:
        return (
          <F1.LifelinesSection
            lifelines={inc.lifelines}
            onChange={f1.updateLifeline}
            onAdd={f1.addLifeline}
            onRemove={f1.removeLifeline}
          />
        );
      case 3:
        return (
          <F1.IssuesSection
            issues={inc.issues}
            onChange={f1.updateIssue}
            onAdd={f1.addIssue}
            onRemove={f1.removeIssue}
          />
        );
      case 4:
        return (
          <F1.ActionsSection
            actions={inc.responseActions}
            onChange={f1.updateAction}
            onAdd={f1.addAction}
            onRemove={f1.removeAction}
          />
        );
      case 5:
        return <F1.NeedsSection needs={inc.needs} onChange={f1.updateNeed} />;
      case 6:
        return (
          <F1.DamageRegisterSection
            damage={inc.damage}
            onChange={f1.updateStructure}
            onAdd={f1.addStructure}
            onRemove={f1.removeStructure}
            onChangeNotes={f1.updateDamageNotes}
          />
        );
      case 7:
        return (
          <F1.BarangayProfileSection
            damage={inc.damage}
            onChange={f1.updateBarangayProfile}
            onAdd={f1.addBarangayProfile}
            onRemove={f1.removeBarangayProfile}
          />
        );
      default:
        return null;
    }
  }
};

/* ------------------------------------------------------------------ *
 * RDANA Form 2 — Phase 2, 3-15 days. Sectoral deep-dive, 10 pages.
 * ------------------------------------------------------------------ */
const form2 = {
  formType: 'phase2',
  label: 'Phase 2',
  formName: 'Form 2',
  campaign: FORM2_CAMPAIGN,
  reportTitle: FORM2_TITLE,
  reportSubtitle: FORM2_SUBTITLE,
  create: createForm2,
  validate: validateForm2,

  sections: [
    { key: '1', title: 'Assessment Profile', chip: 'Profile' },
    { key: '2', title: 'Situation After the Disaster', chip: 'After' },
    { key: '3', title: 'Roads, Bridges & Accessibility', chip: 'Access' },
    { key: '4', title: 'Electricity, Communication & Fuel', chip: 'Utilities' },
    { key: '5', title: 'Health', chip: 'Health' },
    { key: '6', title: 'WASH', chip: 'WASH' },
    { key: '7', title: 'Food & Nutrition', chip: 'Food' },
    { key: '8', title: 'Shelter & Livelihood', chip: 'Shelter' },
    { key: '9', title: 'Protection & Education', chip: 'Protect' },
    { key: '10', title: 'Organization & Coordination', chip: 'Coord' }
  ],

  title: (inc) => {
    const h = inc.header || {};
    return h.incidentName || h.affectedMunicipality || h.areaAssessed || 'Untitled assessment';
  },

  isUntitled: (inc) => {
    const h = inc.header || {};
    return !(h.incidentName || h.affectedMunicipality || h.areaAssessed);
  },

  listLine: (inc) => {
    const h = inc.header || {};
    return {
      title: h.incidentName || h.areaAssessed || 'Untitled assessment',
      sub: [h.affectedMunicipality, h.province].filter(Boolean).join(', ') || 'Location not set',
      occurrence: h.eventDateTime
    };
  },

  renderSection: (page, ctx) => {
    const { inc, onChange, psgc, gps, removeRow, notify } = ctx;
    const pass = {
      inc,
      onChange,
      onGps: gps.onGet,
      gpsBusy: gps.busy,
      gpsError: gps.error,
      gpsAccuracy: gps.accuracy,
      gpsWeak: gps.weak,
      removeRow,
      notify
    };
    switch (page) {
      case 0:
        return (
          <F2.F2Profile
            {...pass}
            provinces={psgc.provinces}
            municipalities={psgc.municipalities}
          />
        );
      case 1:
        return <F2.F2After {...pass} />;
      case 2:
        return <F2.F2Access {...pass} />;
      case 3:
        return <F2.F2Utilities {...pass} />;
      case 4:
        return <F2.F2Health {...pass} />;
      case 5:
        return <F2.F2Wash {...pass} />;
      case 6:
        return <F2.F2Food {...pass} />;
      case 7:
        return <F2.F2ShelterLivelihood {...pass} />;
      case 8:
        return <F2.F2ProtectionEducation {...pass} />;
      case 9:
        return <F2.F2Coordination {...pass} />;
      default:
        return null;
    }
  }
};

export const FORMS = { phase1: form1, phase2: form2 };
export const DEFAULT_FORM = 'phase1';
export const FORM_TYPE_LIST = [form1, form2];

export function getForm(formType) {
  return FORMS[formType] || FORMS[DEFAULT_FORM];
}

/* Which form does a stored record belong to? Records saved before the
   Form 2 work existed carry no formType and are all Phase 1. */
export function formTypeOf(inc) {
  if (inc?.formType === 'agriculture') return 'agriculture';
  if (inc?.formType === 'building') return 'building';
  return inc?.formType === 'phase2' ? 'phase2' : 'phase1';
}

export { issuesBySection, displayDT };
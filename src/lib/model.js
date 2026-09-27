import { LIFELINES, CLUSTERS } from './constants';

export function uid() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

export function blankMetric() {
  return { total: '', men: '', women: '', children: '', elderly: '', pwds: '' };
}

export function blankLifeline(key, label) {
  return { id: uid(), key, label, status: '', observation: '' };
}

export function defaultLifelines() {
  return LIFELINES.map((l) => blankLifeline(l.key, l.label));
}

export function blankNeeds(key, label) {
  return { id: uid(), key, label, priorityNeeds: '' };
}

export function defaultNeeds() {
  return CLUSTERS.map((c) => blankNeeds(c.key, c.label));
}

export function createIncident() {
  return {
    id: uid(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    profile: {
      siteLocation: '',
      country: 'Philippines',
      region: '',
      province: '',
      municipality: '',
      barangay: '',
      purok: '',
      timeArrival: '',
      timeDeparture: '',
      interviewees: [{ id: uid(), name: '' }],
      gpsLat: '',
      gpsLng: '',
      disasterType: '',
      occurrenceTime: '',
      summary: ''
    },
    initialEffects: {
      populationCensus: blankMetric(),
      affected: blankMetric(),
      displaced: blankMetric(),
      dead: blankMetric(),
      injured: blankMetric(),
      missing: blankMetric()
    },
    lifelines: defaultLifelines(),
    issues: [{ id: uid(), healthIssue: '', nonHealthIssue: '' }],
    responseActions: [{ id: uid(), groupInvolved: '', assetsDeployed: '', assistanceExtent: '', familiesServed: '' }],
    needs: defaultNeeds()
  };
}
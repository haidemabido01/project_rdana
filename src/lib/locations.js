let cache = null;
let inflight = null;

export function getLocations() {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = fetch('/data/locations.json')
      .then((r) => {
        if (!r.ok) throw new Error(`Locations data unavailable (${r.status})`);
        return r.json();
      })
      .then((d) => {
        cache = d;
        return d;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/* Flat list of every province name across all regions. Form 2 only asks
   for "Province", so it needs the collapsed list rather than the cascade. */
export function allProvinces(regions) {
  const names = new Set();
  for (const r of regions || []) {
    for (const p of r.provinces || []) if (p.name) names.add(p.name);
  }
  return [...names].sort();
}

/* Municipalities / cities inside a given province, for the
   "Affected Municipality / City" field. */
export function municipalitiesIn(regions, province) {
  if (!province) return [];
  for (const r of regions || []) {
    const p = (r.provinces || []).find((x) => x.name === province);
    if (p) return (p.municities || []).map((m) => m.name);
  }
  return [];
}
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
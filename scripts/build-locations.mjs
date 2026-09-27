import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'public', 'data');
mkdirSync(outDir, { recursive: true });

const raw = process.argv[2] || 'C:/Users/MABIDO/AppData/Local/Temp/opencode/psgc';

const regions = JSON.parse(readFileSync(join(raw, 'regions.json'), 'utf8'));
const provinces = JSON.parse(readFileSync(join(raw, 'provinces.json'), 'utf8'));
const municities = JSON.parse(readFileSync(join(raw, 'cities-municipalities.json'), 'utf8'));
const barangays = JSON.parse(readFileSync(join(raw, 'barangays.json'), 'utf8'));

const REGION_ORDER = {
  '130000000': 0, // NCR
  '140000000': 1, // CAR
  '150000000': 18, // BARMM
};

const regionByCode = new Map(regions.map((r) => [r.code, r]));
const provinceByCode = new Map(provinces.map((p) => [p.code, p]));

const tree = new Map();

const getRegion = (code, fallbackName) => {
  let node = tree.get(code);
  if (!node) {
    const r = regionByCode.get(code);
    node = {
      code,
      name: r ? r.name : fallbackName || 'Unknown Region',
      provinces: new Map(),
    };
    tree.set(code, node);
  }
  return node;
};

let orphans = 0;
let skippedBarangays = 0;

for (const m of municities) {
  const p = provinceByCode.get(m.provinceCode);
  if (!p) {
    const region = getRegion(m.regionCode, null);
    if (!region) {
      orphans += 1;
      continue;
    }
    const pseudo = m.regionCode === '130000000' ? 'NCR (Metro Manila)' : region.name;
    let prov = region.provinces.get('__direct__');
    if (!prov) {
      prov = { name: pseudo, municipalityOnly: true, municities: new Map() };
      region.provinces.set('__direct__', prov);
    }
    prov.municities.set(m.code, { name: m.name, barangays: [] });
    continue;
  }
  const region = getRegion(p.regionCode || m.regionCode, null);
  let prov = region.provinces.get(p.code);
  if (!prov) {
    prov = { name: p.name, municities: new Map() };
    region.provinces.set(p.code, prov);
  }
  prov.municities.set(m.code, { name: m.name, barangays: [] });
}

for (const b of barangays) {
  const mcode = b.municipalityCode || b.cityCode;
  let found = false;
  for (const region of tree.values()) {
    for (const prov of region.provinces.values()) {
      const m = prov.municities.get(mcode);
      if (m) {
        m.barangays.push(b.name);
        found = true;
        break;
      }
    }
    if (found) break;
  }
  if (!found) skippedBarangays += 1;
}

const regionsOut = [...tree.values()]
  .sort((a, b) => {
    const oa = REGION_ORDER[a.code] ?? Number((regionByCode.get(a.code)?.regionName || a.code).replace(/\D+/g, '') || 99);
    const ob = REGION_ORDER[b.code] ?? Number((regionByCode.get(b.code)?.regionName || b.code).replace(/\D+/g, '') || 99);
    return oa - ob;
  })
  .map((r) => ({
    name: r.name,
    provinces: [...r.provinces.values()]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((p) => ({
        name: p.name,
        municities: [...p.municities.values()]
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((m) => ({ name: m.name, barangays: m.barangays.sort((a, b) => a.localeCompare(b)) })),
      })),
  }));

const out = {
  source: 'Philippine Standard Geographic Code (PSGC), via OSSPhilippines/psgc-api (PSA data, 2020-09)',
  regions: regionsOut,
};

writeFileSync(join(outDir, 'locations.json'), JSON.stringify(out));

const totalMun = regionsOut.reduce((a, r) => a + r.provinces.reduce((b, p) => b + p.municities.length, 0), 0);
const totalBar = regionsOut.reduce((a, r) => a + r.provinces.reduce((b, p) => b + p.municities.reduce((c, m) => c + m.barangays.length, 0), 0), 0);
console.log(`regions: ${regionsOut.length}`);
console.log(`provinces: ${regionsOut.reduce((a, r) => a + r.provinces.length, 0)}`);
console.log(`municities: ${totalMun}`);
console.log(`barangays: ${totalBar}`);
console.log(`orphan municities skipped: ${orphans}`);
console.log(`barangays skipped: ${skippedBarangays}`);
console.log(`wrote public/data/locations.json (${(out.length / 1024).toFixed(0)} KB bytes)`);
console.log(`file size: ${((writeFileSync(join(outDir, 'locations.json'), JSON.stringify(out)), readFileSync(join(outDir, 'locations.json'))).length / 1024 / 1024).toFixed(2)} MB`);
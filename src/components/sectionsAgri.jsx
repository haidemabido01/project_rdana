import { uid } from '../lib/model';
import {
  Field,
  MatrixRows,
  MilitaryDateTimeInput,
  NumberInput,
  RepeatTable,
  SubSection,
  TextArea,
  TextInput
} from './ui';

export function AgriProfile({ inc, onChange }) {
  const h = inc.header || {};
  const setH = (f, v) => onChange('header.' + f, v);
  return (
    <div>
      <SubSection title="Assessment identification">
        <div className="grid-2">
          <Field label="Type of Disaster">
            <TextInput value={h.typeOfDisaster} onChange={(e) => setH('typeOfDisaster', e.target.value)} placeholder="e.g. Typhoon Paeng" />
          </Field>
          <Field label="Date and Time of Occurrence" required hint="24-hour clock">
            <MilitaryDateTimeInput value={h.occurrenceDateTime} onChange={(v) => setH('occurrenceDateTime', v)} />
          </Field>
          <Field label="Location">
            <TextInput value={h.location} onChange={(e) => setH('location', e.target.value)} placeholder="e.g. Panukulan, Quezon" />
          </Field>
          <Field label="Affected No. of Farmers/Fisherfolks">
            <NumberInput value={h.affectedFarmers} onChange={(e) => setH('affectedFarmers', e.target.value)} />
          </Field>
          <Field label="Sector">
            <TextInput value={h.sector} onChange={(e) => setH('sector', e.target.value)} />
          </Field>
        </div>
      </SubSection>
    </div>
  );
}

export function AgriInfrastructure({ inc, onChange }) {
  const rows = inc.infrastructure || [];
  return (
    <div>
      <SubSection title="A. Infrastructure Issues">
        <MatrixRows
          rows={rows}
          labelKey="facility"
          labelHead="Facility or Property"
          minWidth={720}
          columns={[
            { key: 'degree', label: 'Degree of Damage (Major / Minor)', type: 'radio', options: ['Major', 'Minor'], width: 220 },
            { key: 'remarks', label: 'Description of Damage/Remarks', type: 'area', full: true }
          ]}
          onChange={(i, f, v) => onChange(`infrastructure.${i}.${f}`, v)}
        />
      </SubSection>
    </div>
  );
}

export function AgriCrops({ inc, onChange }) {
  const rows = inc.crops || [];
  const op = (i, f, v) => onChange(`crops.${i}.${f}`, v);
  return (
    <div>
      <SubSection title="B. Crop Issues">
        <div className="table-wrap">
          <table className="grid">
            <thead>
              <tr>
                <th className="rowlabel">Crops Affected</th>
                <th>Totally Damaged</th>
                <th>Partially Damaged</th>
                <th>Farmers Affected</th>
                <th>Description of Damage/Remarks</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id}>
                  <th className="rowlabel">{r.crop}</th>
                  <td><NumberInput value={r.totallyDamaged} onChange={(e) => op(i, 'totallyDamaged', e.target.value)} /></td>
                  <td><NumberInput value={r.partiallyDamaged} onChange={(e) => op(i, 'partiallyDamaged', e.target.value)} /></td>
                  <td><NumberInput value={r.farmersAffected} onChange={(e) => op(i, 'farmersAffected', e.target.value)} /></td>
                  <td><TextArea rows={1} value={r.remarks} onChange={(e) => op(i, 'remarks', e.target.value)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SubSection>
    </div>
  );
}

export function AgriFisheries({ inc, onChange, removeRow }) {
  const rows = inc.fisheries || [];
  return (
    <div>
      <SubSection title="D. Fisheries / Resources and Implements Issues">
        <RepeatTable
          rows={rows}
          cols={2}
          columns={[
            { key: 'resource', label: 'Resource Used', type: 'text', full: true },
            { key: 'partiallyDamaged', label: 'Partially Damaged', type: 'num', width: 130 },
            { key: 'totallyDamaged', label: 'Totally Damaged', type: 'num', width: 130 },
            { key: 'units', label: 'Units', type: 'text', width: 100 },
            { key: 'farmersAffected', label: 'Farmers/Fisherfolks Affected', type: 'num', width: 140 },
            { key: 'remarks', label: 'Description of Damage/Remarks', type: 'area', full: true }
          ]}
          onChange={(i, f, v) => onChange(`fisheries.${i}.${f}`, v)}
          onAdd={() => onChange('fisheries', [...rows, { id: uid(), resource: '', partiallyDamaged: '', totallyDamaged: '', units: '', farmersAffected: '', remarks: '' }])}
          onRemove={(i) => removeRow('fisheries', rows, i, 'fishery resource')}
          addLabel="+ Add resource"
        />
      </SubSection>
    </div>
  );
}

export function AgriMachineries({ inc, onChange, removeRow }) {
  const rows = inc.machineries || [];
  return (
    <div>
      <SubSection title="D. Agricultural Implements and Machineries Issues">
        <RepeatTable
          rows={rows}
          cols={2}
          columns={[
            { key: 'machinery', label: 'Machinery / Implement', type: 'text', full: true },
            { key: 'description', label: 'Description of Damage', type: 'area', full: true },
            { key: 'partiallyDamaged', label: 'Partially Damaged', type: 'num', width: 130 },
            { key: 'totallyDamaged', label: 'Totally Damaged', type: 'num', width: 130 },
            { key: 'remarks', label: 'Remarks', type: 'area', full: true }
          ]}
          onChange={(i, f, v) => onChange(`machineries.${i}.${f}`, v)}
          onAdd={() => onChange('machineries', [...rows, { id: uid(), machinery: '', description: '', partiallyDamaged: '', totallyDamaged: '', remarks: '' }])}
          onRemove={(i) => removeRow('machineries', rows, i, 'machinery')}
          addLabel="+ Add machinery"
        />
      </SubSection>
    </div>
  );
}

export function AgriCosting({ inc, onChange }) {
  const c = inc.costing || {};
  const set = (f, v) => onChange('costing.' + f, v);
  return (
    <div>
      <SubSection title="E. Costing / Cost of Production Damages">
        <div className="grid-2">
          <Field label="Cost of Production Damages">
            <NumberInput value={c.productionDamages} onChange={(e) => set('productionDamages', e.target.value)} />
          </Field>
          <Field label="Estimated Amount of Damages (PHP)">
            <NumberInput value={c.estimatedAmount} onChange={(e) => set('estimatedAmount', e.target.value)} />
          </Field>
          <Field label="Remarks">
            <TextArea rows={3} value={c.remarks} onChange={(e) => set('remarks', e.target.value)} />
          </Field>
        </div>
      </SubSection>
    </div>
  );
}

export function AgriAnimals({ inc, onChange, removeRow }) {
  const rows = inc.animals || [];
  return (
    <div>
      <SubSection title="C. Animal Issues">
        <RepeatTable
          rows={rows}
          cols={3}
          columns={[
            { key: 'animal', label: 'Animals Affected', type: 'text', full: true },
            { key: 'dead', label: 'Dead', type: 'num', width: 100 },
            { key: 'partiallyDamaged', label: 'Partially Damaged', type: 'num', width: 120 },
            { key: 'missing', label: 'Missing', type: 'num', width: 100 },
            { key: 'injured', label: 'Injured', type: 'num', width: 100 },
            { key: 'remarks', label: 'Description of Damage/Remarks', type: 'area', full: true }
          ]}
          onChange={(i, f, v) => onChange(`animals.${i}.${f}`, v)}
          onAdd={() => onChange('animals', [...rows, { id: uid(), animal: '', dead: '', partiallyDamaged: '', missing: '', injured: '', remarks: '' }])}
          onRemove={(i) => removeRow('animals', rows, i, 'animal')}
          addLabel="+ Add animal"
        />
      </SubSection>
    </div>
  );
}

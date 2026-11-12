import { uid } from './model';

export const AGRI_TYPE = 'agriculture';

export function createAgriculture() {
  return {
    id: uid(),
    formType: AGRI_TYPE,
    caseId: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),

    header: {
      typeOfDisaster: '',
      occurrenceDateTime: '',
      location: '',
      affectedFarmers: '',
      sector: 'AGRICULTURE and FISHERIES'
    },

    infrastructure: [
      { id: uid(), facility: 'ANIMAL HOUSING', degree: [], remarks: '' },
      { id: uid(), facility: 'FOOD STORAGE/PROCESSING', degree: [], remarks: '' },
      { id: uid(), facility: 'MACHINERY/EQUIPMENT', degree: [], remarks: '' },
      { id: uid(), facility: 'WAREHOUSES', degree: [], remarks: '' }
    ],

    crops: [
      { id: uid(), crop: 'RICE (SEEDLINGS, PLANTED, HARVEST)', totallyDamaged: '', partiallyDamaged: '', farmersAffected: '', remarks: '' },
      { id: uid(), crop: 'BANANA', totallyDamaged: '', partiallyDamaged: '', farmersAffected: '', remarks: '' },
      { id: uid(), crop: 'Others (HVC)', totallyDamaged: '', partiallyDamaged: '', farmersAffected: '', remarks: '' },
      { id: uid(), crop: 'COCONUT', totallyDamaged: '', partiallyDamaged: '', farmersAffected: '', remarks: '' }
    ],

    animals: [{ id: uid(), animal: '', dead: '', partiallyDamaged: '', missing: '', injured: '', remarks: '' }],

    fisheries: [
      { id: uid(), resource: 'MOTORBOAT', partiallyDamaged: '', totallyDamaged: '', units: '', farmersAffected: '', remarks: '' },
      { id: uid(), resource: 'SEAWEEDS', partiallyDamaged: '', totallyDamaged: '', units: '', farmersAffected: '', remarks: '' },
      { id: uid(), resource: 'FISH CAGE', partiallyDamaged: '', totallyDamaged: '', units: '', farmersAffected: '', remarks: '' },
      { id: uid(), resource: 'TALAY', partiallyDamaged: '', totallyDamaged: '', units: '', farmersAffected: '', remarks: '' }
    ],

    machineries: [
      { id: uid(), machinery: 'HAND TRACTOR', description: '', partiallyDamaged: '', totallyDamaged: '', remarks: '' }
    ],

    costing: {
      productionDamages: '',
      estimatedAmount: '',
      remarks: ''
    }
  };
}
import { uid } from './model';

export const BUILDING_TYPE = 'building';

export function createBuilding() {
  return {
    id: uid(),
    formType: BUILDING_TYPE,
    caseId: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),

    disaster: {
      calamityType: '',
      dateOfCalamity: '',
      intensity: '',
      magnitude: '',
      windSignal: '',
      rainfallWarning: '',
      impactDescription: ''
    },

    classification: {
      buildingClassification: '',
      buildingType: ''
    },

    building: {
      buildingName: '',
      province: '',
      municipality: '',
      barangay: '',
      purok: '',
      floors: '',
      buildingType: '',
      occupants: '',
      buildingOccupancy: '',
      affectedIndividuals: ''
    },

    structure: {
      components: [],
      otherComponent: '',
      findings: '',
      severity: ''
    },

    condition: {
      usabilityStatus: '',
      recommendedActions: ''
    },

    cost: {
      damageCost: '',
      repairCost: ''
    },

    assessment: {
      date: '',
      time: '',
      assessorName: '',
      office: '',
      designation: '',
      photos: '',
      photoItems: []
    }
  };
}
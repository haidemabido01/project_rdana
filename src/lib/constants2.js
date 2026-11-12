/* Picklists and table schemas transcribed from:
   "RDANA Form 2 (for Phase 2-within 3-15days).doc" — OCD CARAGA VERSION 2015 */

export const FORM2_TITLE = 'Rapid Damage Assessment and Needs Analysis';
export const FORM2_SUBTITLE = '(Form II — Phase 2, within 3–15 days)';
export const FORM2_CAMPAIGN = 'RDANA Form 2 — Phase 2 (3-15 days)';

export const IMPACT_LEVELS = ['High', 'Medium', 'Low', 'None'];
export const PASSABILITY = ['Passable', 'Impassable'];
export const POWER_STATUSES = ['Operational/Normal', 'Intermittent', 'Non-operational'];

export const ROAD_CLASSES = ['N', 'P', 'C/M', 'B', 'FMR'];

export const ROAD_CLASS_LABELS = {
  N: 'National',
  P: 'Provincial',
  'C/M': 'City / Municipal',
  B: 'Barangay',
  FMR: 'Farm-to-Market Road'
};

export const ACCESS_TARGETS = [
  { key: 'center', label: 'To the municipal / city center' },
  { key: 'zones', label: 'Routes to affected zones' }
];

export const ACCESS_MODES = [
  { key: 'byLand', label: 'By Land', hint: 'Est. travel time / vehicle type' },
  { key: 'byAir', label: 'By Air', hint: 'Est. travel time / flights available' },
  { key: 'byWater', label: 'By Water', hint: 'Est. travel time / vessel type' }
];

export const SERVICE_ROWS = [
  { key: 'electricity', label: 'Electricity' },
  { key: 'telephoneFax', label: 'Telephone / fax' },
  { key: 'mobilePhone', label: 'Mobile phone' },
  { key: 'radio', label: 'Radio' },
  { key: 'television', label: 'Television' },
  { key: 'radioComms', label: 'Radio Communication' },
  { key: 'fuelDistribution', label: 'Fuel Distribution' }
];

export const HEALTH_SUPPLY_ROWS = [
  { key: 'medicalPersonnel', label: 'Medical Personnel' },
  { key: 'medicines', label: 'Medicines' },
  { key: 'medicalSupplies', label: 'Medical Supplies' },
  { key: 'others', label: 'Others' }
];

export const ALT_WATER_SOURCES = [
  { key: 'wells', label: 'Wells' },
  { key: 'riversStreams', label: 'Rivers / streams' },
  { key: 'storage', label: 'Storage infrastructure' },
  { key: 'aqueduct', label: 'Aqueduct' },
  { key: 'spring', label: 'Spring' },
  { key: 'others', label: 'Others' }
];

export const FOOD_SOURCE_ROWS = [
  { key: 'selfProduction', label: 'Self-production' },
  { key: 'purchase', label: 'Purchase' },
  { key: 'donationsAid', label: 'Donations / food aid' },
  { key: 'exchangeTrade', label: 'Exchange / Trade' },
  { key: 'collection', label: 'Collection' }
];

/* Five rows in the official form, each with Yes / No and Observations.
   `yn` and `obs` are the keys under s8.prepare. */
export const PREPARE_ITEMS = [
  { key: 'water', label: 'Water', yn: 'waterYN', obs: 'waterObs' },
  { key: 'kitchen', label: 'Kitchen', yn: 'kitchenYN', obs: 'kitchenObs' },
  { key: 'fuelFirewood', label: 'Fuel / firewood for cooking', yn: 'fuelYN', obs: 'fuelObs' },
  { key: 'utensils', label: 'Kitchen Utensils', yn: 'utensilsYN', obs: 'utensilsObs' },
  { key: 'reserves', label: 'Food Reserves', yn: 'reservesYN', obs: 'reservesObs' }
];

export const SANITATION_ROWS = [
  { key: 'latrines', label: 'Latrines' },
  { key: 'sewer', label: 'Sewer System' },
  { key: 'septic', label: 'Septic Tanks' },
  { key: 'solidWaste', label: 'Solid waste' },
  { key: 'greyBlack', label: 'Discharge of grey / black liquids' },
  { key: 'rubbish', label: 'Rubbish disposal' }
];

export const LIVELIHOOD_SECTORS = [
  { key: 'farming', label: 'Farming' },
  { key: 'cattleRaising', label: 'Cattle Raising' },
  { key: 'fishing', label: 'Fishing' },
  { key: 'industrial', label: 'Industrial' },
  { key: 'commerce', label: 'Commerce' },
  { key: 'manualLabor', label: 'Manual Labor' },
  { key: 'skilledLabor', label: 'Skilled Labor' },
  { key: 'others', label: 'Others' }
];

export const GENDER_OF_SECTOR = ['Female', 'Male', 'Both'];

export const PROTECTION_CHILD_ROWS = [
  { key: 'identification', label: 'Identification / Documentation' },
  { key: 'orphans', label: 'Orphans' },
  { key: 'separated', label: 'Separated from Parents' }
];

export const SCHOOL_ROWS = [
  { key: 'classrooms', label: 'No. of Classrooms' },
  { key: 'furnishings', label: 'Furnishings Affected (est. %)' },
  { key: 'materials', label: 'Materials Affected (est. %)' },
  { key: 'students', label: 'No. of Students Affected' }
];

export const COORD_CLUSTERS = [
  { key: 'foodNfi', label: 'Food / NFI' },
  { key: 'campIdpProtection', label: 'Camp / IDP / Protection' },
  { key: 'shelterLivelihood', label: 'Shelter / Livelihood' },
  { key: 'washHealthNutrition', label: 'WASH / Health / Nutrition / Psychosocial Services' },
  { key: 'logisticsTelecom', label: 'Logistics / Telecom' },
  { key: 'education', label: 'Education' },
  { key: 'agriculture', label: 'Agriculture' },
  { key: 'earlyRecovery', label: 'Early Recovery' },
  { key: 'others', label: 'Others' }
];

export const COORD_LEVELS = [
  { key: 'national', label: 'National' },
  { key: 'regional', label: 'Regional' },
  { key: 'provincial', label: 'Provincial' },
  { key: 'cityMunicipal', label: 'City / Municipal' },
  { key: 'barangay', label: 'Barangay' },
  { key: 'others', label: 'Others' }
];

export const INFO_FLOW_BODIES = [
  { key: 'ngo', label: 'NGOs' },
  { key: 'unAgencies', label: 'UN Agencies' },
  { key: 'bdrrrmc', label: 'BDRRMC' },
  { key: 'cmdrrrmc', label: 'C / MDRRMC' },
  { key: 'pdrrrmc', label: 'PDRRMC' },
  { key: 'rdrrrmc', label: 'RDRRMC' },
  { key: 'ndrrrmc', label: 'NDRRMC' }
];

/* ------------------------------------------------------------------ *
 * Table column schemas. Each column is consumed by the shared
 * Cell renderer in components/ui.jsx.
 * ------------------------------------------------------------------ */

export const ROAD_COLUMNS = [
  { key: 'classification', label: 'Classification', type: 'select', options: ROAD_CLASSES, width: 110 },
  { key: 'areaLocation', label: 'Area / Location', type: 'text', full: true },
  { key: 'damageDescription', label: 'Damage Description', type: 'area', full: true },
  { key: 'status', label: 'Status', type: 'select', options: PASSABILITY, width: 130 }
];

export const BRIDGE_COLUMNS = [
  { key: 'areaLocation', label: 'Area / Location', type: 'text' },
  { key: 'bridgeName', label: 'Name of Bridge', type: 'text' },
  { key: 'damageDescription', label: 'Damage Description', type: 'area', full: true },
  { key: 'status', label: 'Status', type: 'select', options: PASSABILITY, width: 130 }
];

export const FACILITY_COLUMNS = [
  { key: 'facilityName', label: 'Name of Health Facility', type: 'text', full: true },
  { key: 'category', label: 'Category', type: 'text', placeholder: 'e.g. RHU, BHS, lying-in' },
  { key: 'operationalNo', label: 'Operational (No.)', type: 'num', width: 120 },
  { key: 'nonOperationalNo', label: 'Non-operational (No.)', type: 'num', width: 130 },
  { key: 'bedsAvailable', label: 'No. of Beds Available', type: 'num', width: 120 },
  { key: 'water', label: 'Water', type: 'yn', width: 100 },
  { key: 'electricity', label: 'Electricity', type: 'yn', width: 110 },
  { key: 'backupPower', label: 'Back-up Power', type: 'yn', width: 120 },
  { key: 'damageType', label: 'Type of Damage', type: 'area', full: true }
];

export const ALT_WATER_COLUMNS = [
  { key: 'damaged', label: 'Damaged', type: 'yn', width: 100 },
  { key: 'contaminated', label: 'Contaminated', type: 'yn', width: 120 },
  { key: 'destroyed', label: 'Destroyed', type: 'yn', width: 100 },
  { key: 'remarks', label: 'Remarks', type: 'area', full: true }
];

export const SANITATION_NEEDS_COLUMNS = [
  { key: 'needs', label: 'Needs', type: 'text', full: true },
  { key: 'quantity', label: 'Estimated Quantity', type: 'num', width: 140 },
  { key: 'families', label: 'Estimated No. of Families', type: 'num', width: 150 },
  { key: 'observations', label: 'Observations', type: 'area', full: true }
];

export const INTERVENTION_COLUMNS = [
  { key: 'donorSource', label: 'Donor / Source', type: 'text' },
  { key: 'existingProgramYN', label: 'Existing program?', type: 'yn', width: 130 },
  { key: 'productsDistributed', label: 'Products distributed', type: 'area', full: true },
  { key: 'availableInventory', label: 'Available inventory', type: 'area', full: true }
];

export const FOOD_NEEDS_COLUMNS = [
  { key: 'assessedNeeds', label: 'Assessed Needs', type: 'text', full: true },
  { key: 'quantity', label: 'Estimated Quantity', type: 'num', width: 140 },
  { key: 'families', label: 'Estimated No. of Recipient Families', type: 'num', width: 170 },
  { key: 'observations', label: 'Observations', type: 'area', full: true }
];

export const SHELTER_NEEDS_COLUMNS = [
  { key: 'needs', label: 'Needs', type: 'text', full: true },
  { key: 'quantity', label: 'Estimated Quantity', type: 'num', width: 140 },
  { key: 'families', label: 'Estimated No. of Families', type: 'num', width: 160 }
];

export const LIVELIHOOD_SECTOR_COLUMNS = [
  { key: 'impact', label: 'Impact', type: 'select', options: ['High', 'Medium', 'Low'], width: 110 },
  { key: 'mainly', label: 'Sectors Mainly Female or Male', type: 'select', options: GENDER_OF_SECTOR, width: 150 },
  { key: 'familiesAffected', label: 'Est. No. of Families Affected', type: 'num', width: 170 }
];

export const LIVELIHOOD_NEEDS_COLUMNS = [
  { key: 'needs', label: 'Needs', type: 'text', full: true },
  { key: 'quantity', label: 'Estimated Quantity', type: 'num', width: 140 },
  { key: 'families', label: 'Est. No. of Families to Benefit', type: 'num', width: 165 },
  { key: 'observations', label: 'Observations', type: 'area', full: true }
];

export const PROTECTION_NEEDS_COLUMNS = [
  { key: 'needs', label: 'Needs', type: 'text', full: true },
  { key: 'quantity', label: 'Quantity', type: 'num', width: 120 },
  { key: 'families', label: 'No. of Families', type: 'num', width: 130 },
  { key: 'observations', label: 'Observations', type: 'area', full: true }
];

export const EDUCATION_NEEDS_COLUMNS = [
  { key: 'needs', label: 'Needs', type: 'text', full: true },
  { key: 'quantity', label: 'Quantity', type: 'num', width: 120 },
  { key: 'families', label: 'No. of Families', type: 'num', width: 130 },
  { key: 'observations', label: 'Observations', type: 'area', full: true }
];
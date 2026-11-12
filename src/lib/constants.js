export const DISASTER_TYPES = [
  'Typhoon',
  'Flood',
  'Flash Flood',
  'Earthquake',
  'Tsunami',
  'Storm Surge',
  'Volcanic Eruption',
  'Landslide',
  'Fire',
  'Drought',
  'Hydrometeorological',
  'Armed Conflict',
  'Vehicular Accident',
  'Industrial Accident',
  'Epidemic / Outbreak',
  'Other'
];

export const LIFELINES = [
  { key: 'roadsBridges', label: 'Roads and Bridges' },
  { key: 'electricity', label: 'Electricity' },
  { key: 'communication', label: 'Communication Network' },
  { key: 'hospitals', label: 'Hospitals' },
  { key: 'schools', label: 'Schools' },
  { key: 'airports', label: 'Airports' },
  { key: 'seaports', label: 'Sea Ports' },
  { key: 'water', label: 'Water Supply System' },
  { key: 'market', label: 'Market' },
  { key: 'houses', label: 'Residential Houses' },
  { key: 'others', label: 'Others' }
];

export const LIFELINE_STATUSES = [
  'Operational',
  'Intermittent',
  'Non-operational',
  'Partially damaged'
];

export const DISAGG_COLUMNS = [
  { key: 'total', label: 'Total' },
  { key: 'men', label: 'Men' },
  { key: 'women', label: 'Women' },
  { key: 'children', label: 'Children' },
  { key: 'elderly', label: 'Elderly' },
  { key: 'pwds', label: 'PWDs' }
];

export const METRICS = [
  { key: 'populationCensus', label: 'Population (Census)' },
  { key: 'affected', label: 'Affected Population' },
  { key: 'displaced', label: 'Displaced Population' },
  { key: 'dead', label: 'Dead' },
  { key: 'injured', label: 'Injured' },
  { key: 'missing', label: 'Missing' }
];

/* The 25 barangays of the Municipality of Tagbina, Surigao del Sur.
   Mirrors public/data/locations.json (PSGC list) so the dashboard can
   plot every area even before any assessment has reported on it. */
export const TAGBINA_BARANGAYS = [
  'Batunan',
  'Carpenito',
  'Doña Carmen',
  'Hinagdanan',
  'Kahayagan',
  'Lago',
  'Maglambing',
  'Maglatab',
  'Magsaysay',
  'Malixi',
  'Manambia',
  'Osmeña',
  'Poblacion',
  'Quezon',
  'San Vicente',
  'Santa Cruz',
  'Santa Fe',
  'Santa Juana',
  'Santa Maria',
  'Sayon',
  'Soriano',
  'Tagongon',
  'Trinidad',
  'Ugoban',
  'Villaverde'
];

export const CLUSTERS = [
  { key: 'logistics', label: 'Logistics and Emergency Telecommunications' },
  { key: 'foodNfi', label: 'Food and Non-Food Items' },
  { key: 'washHealth', label: 'WASH, Health, Nutrition and Psychological Services' },
  { key: 'campShelter', label: 'Camp Management, Emergency Shelter and Protection' },
  { key: 'permShelterLive', label: 'Permanent Shelter and Livelihood' },
  { key: 'education', label: 'Education' },
  { key: 'agriculture', label: 'Agriculture' },
  { key: 'earlyRecovery', label: 'Early Recovery' }
];
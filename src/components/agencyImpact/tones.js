export const TONE_CHIPS = {
  brand: 'bg-brand-50 text-brand-600',
  navy: 'bg-navy-100 text-navy-800',
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  red: 'bg-red-50 text-red-600',
  purple: 'bg-purple-50 text-purple-600',
  yellow: 'bg-yellow-50 text-yellow-600',
  slate: 'bg-gray-100 text-gray-600'
};


export function toneChip(tone) {
  return TONE_CHIPS[tone] || TONE_CHIPS.brand;
}

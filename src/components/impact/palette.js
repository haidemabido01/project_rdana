/* ------------------------------------------------------------------ *
 * Impact dashboard palette.
 *
 * The screen is rendered in the product's light theme (orange, blue,
 * white on a gray-50 canvas). The four data colours below are the only
 * saturated hues in the system, so they carry the meaning: blue for
 * figures, orange for attention, green for completion, purple for the
 * secondary series.
 * ------------------------------------------------------------------ */

export const IMPACT_COLORS = {
  blue: '#0066FF',
  purple: '#7B3FE4',
  orange: '#FF6B00',
  green: '#00C853'
};

/* Soft tints used behind the saturated hues (chips, pills, tracks). */
export const IMPACT_TINTS = {
  blue: '#EFF6FF',
  orange: '#FFF7ED',
  green: '#ECFDF3',
  purple: '#F5F0FF'
};

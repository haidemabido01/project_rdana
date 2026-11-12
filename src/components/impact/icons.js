import { ClipboardList, House, UserRound, Users } from 'lucide-react';

/* ------------------------------------------------------------------ *
 * Icon registry.
 *
 * The mock data stores plain string keys (`icon: 'users'`) so the data
 * module never imports a component. The screen resolves the key here.
 * ------------------------------------------------------------------ */

export const METRIC_ICONS = {
  users: Users,
  user: UserRound,
  house: House,
  clipboard: ClipboardList
};

export function resolveIcon(key, fallback = ClipboardList) {
  return METRIC_ICONS[key] || fallback;
}

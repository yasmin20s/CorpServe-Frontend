/**
 * Company label from API — never mirror the person's full name in the company slot.
 * If the stored company equals full name (common bad data / legacy), treat as unset.
 */
export function getDisplayCompanyName(companyName, fullName) {
  const c = String(companyName ?? '').trim();
  if (!c) return '';
  const f = String(fullName ?? '').trim();
  if (f && c.toLowerCase() === f.toLowerCase()) return '';
  return c;
}

/** @param {unknown} n */
export function formatCompactMoney(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return '—';
  if (Math.abs(x) >= 1000) return `EGP ${(x / 1000).toFixed(1)}k`;
  return `EGP ${Math.round(x).toLocaleString()}`;
}

export function formatMoneyFull(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 'EGP 0';
  return `EGP ${x.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

/**
 * @param {Record<string, unknown>} row
 * @param {function(...string): unknown} pick
 */
export function formatRecentRowPrice(row, pick) {
  const price = pick(row, 'price', 'Price');
  if (price != null && Number.isFinite(Number(price))) return formatMoneyFull(price);
  const min = pick(row, 'budgetMin', 'BudgetMin');
  const max = pick(row, 'budgetMax', 'BudgetMax');
  const a = Number(min);
  const b = Number(max);
  if (Number.isFinite(a) && Number.isFinite(b)) return formatMoneyFull((a + b) / 2);
  if (Number.isFinite(a)) return formatMoneyFull(a);
  if (Number.isFinite(b)) return formatMoneyFull(b);
  return '—';
}

export function formatStatusPill(statusRaw) {
  const s = String(statusRaw || '').trim();
  if (!s) return '—';
  const lower = s.toLowerCase();
  if (lower === 'active') return 'In Progress';
  if (lower === 'completed') return 'Completed';
  return s;
}

export function getAccountStatusLabel(accountStatusRaw) {
  const raw = String(accountStatusRaw ?? '').trim().toLowerCase();
  if (raw === 'suspended' || raw === '2') return 'Suspended';
  if (raw === 'active' || raw === '1') return 'Active';
  return 'Active';
}

export function getAccountStatusClasses(accountStatusRaw) {
  const status = getAccountStatusLabel(accountStatusRaw).toLowerCase();
  if (status === 'suspended') return 'border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/35 dark:bg-rose-500/16 dark:text-rose-200';
  return 'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/35 dark:bg-emerald-500/16 dark:text-emerald-200';
}

/** Category pill palette (index-based) */
const CATEGORY_PALETTE = [
  { border: 'border-sky-300', bg: 'bg-sky-50', text: 'text-sky-800' },
  { border: 'border-teal-300', bg: 'bg-teal-50', text: 'text-teal-800' },
  { border: 'border-violet-300', bg: 'bg-violet-50', text: 'text-violet-800' },
  { border: 'border-orange-300', bg: 'bg-orange-50', text: 'text-orange-800' },
  { border: 'border-slate-300', bg: 'bg-slate-50', text: 'text-slate-800' },
  { border: 'border-fuchsia-300', bg: 'bg-fuchsia-50', text: 'text-fuchsia-800' },
];

export function categoryPillClasses(index) {
  return CATEGORY_PALETTE[Math.abs(index) % CATEGORY_PALETTE.length];
}

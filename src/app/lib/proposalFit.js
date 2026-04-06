/**
 * Local calendar YYYY-MM-DD — avoids UTC day-shift when comparing date inputs to API DateTimes.
 */
export function toLocalDateKey(value) {
  if (value == null || value === '') return '';
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Vendor proposes delivery on or before the client's expected deadline. */
export function proposedDeliveryMeetsClientDeadline(proposedDeadline, clientDeadlineRaw) {
  const p = toLocalDateKey(proposedDeadline);
  const c = toLocalDateKey(clientDeadlineRaw);
  if (!p || !c) return false;
  return p <= c;
}

export function priceInClientBudgetRange(proposedPrice, budgetMin, budgetMax) {
  const min = Number(budgetMin);
  const max = Number(budgetMax);
  const price = Number(proposedPrice);
  if (!Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || max <= 0) return false;
  return Number.isFinite(price) && price >= min && price <= max;
}

export function pickVendorRequestBudget(req) {
  const min = req?.budgetMin ?? req?.BudgetMin;
  const max = req?.budgetMax ?? req?.BudgetMax;
  return { min: Number(min ?? 0), max: Number(max ?? 0) };
}

export function pickVendorRequestDeadline(req) {
  return req?.deadline ?? req?.Deadline ?? '';
}

export function pickVendorRequestCreatedAt(req) {
  const v = req?.createdAt ?? req?.CreatedAt;
  return v == null ? '' : String(v).trim();
}

/** Proposal list/detail: camelCase or PascalCase; raw ISO string if API sends DateTime JSON. */
export function pickProposalCreatedAt(proposal) {
  const v = proposal?.createdAt ?? proposal?.CreatedAt;
  if (v == null) return '';
  return String(v).trim();
}

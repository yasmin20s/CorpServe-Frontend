import { format, isValid } from 'date-fns';
import { parseApiDateTime } from './formatRelativeTime';

function formatUtcCalendarDdMmYyyy(parsed) {
  const day = String(parsed.getUTCDate()).padStart(2, '0');
  const month = String(parsed.getUTCMonth() + 1).padStart(2, '0');
  const year = parsed.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Display deadline / created-at from API (ISO) as dd/MM/yyyy using the UTC calendar day
 * so admin monitors match stored CorpServe dates (avoids local TZ shifting the day).
 */
export function formatDeadlineDate(value) {
  if (value == null || value === '') return '-';
  if (typeof value === 'string' && value.trim()) {
    const parsed = parseApiDateTime(value.trim());
    if (parsed && !Number.isNaN(parsed.getTime())) {
      return formatUtcCalendarDdMmYyyy(parsed);
    }
  }
  const d = value instanceof Date ? value : new Date(value);
  if (!isValid(d)) return String(value);
  return format(d, 'dd/MM/yyyy');
}

/** Parse a strict dd/mm/yyyy string (day and month may be 1–2 digits). Returns null if invalid. */
export function parseDdMmYyyy(value) {
  if (value == null || String(value).trim() === '') return null;
  const m = String(value).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  const date = new Date(year, month - 1, day);
  if (!isValid(date) || date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

/** ISO timestamp for the calendar day (UTC 00:00) — matches typical `expectedDeadline` payloads. */
export function calendarDateToIsoUtc(date) {
  if (!date || !isValid(date)) return null;
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).toISOString();
}

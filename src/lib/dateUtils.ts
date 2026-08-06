import { format, isValid, parse } from "date-fns";

/** US-style date shown in tables, cards, labels, and read-only fields. */
export const UI_DATE_DISPLAY_FORMAT = "MM/dd/yy";

export const MUI_DATE_PICKER_DISPLAY_FORMAT = "MM/DD/YY";

export function formatDisplayDate(
  value: string | number | Date | null | undefined
): string {
  if (value == null || value === "") return "";
  const d = value instanceof Date ? value : new Date(value);
  if (!isValid(d)) return String(value).trim();
  return format(d, UI_DATE_DISPLAY_FORMAT);
}

/** yyyy-MM-dd (or ISO) without timezone shift for filter labels. */
export function formatDisplayDateFromYmd(ymd: string | null | undefined): string {
  const s = String(ymd ?? "").trim();
  if (!s) return "";
  return formatDisplayDate(`${s}T12:00:00`);
}

export function formatDisplayDateRangeYmd(
  startYmd: string,
  endYmd: string,
  separator = " – "
): string {
  const start = formatDisplayDateFromYmd(startYmd);
  const end = formatDisplayDateFromYmd(endYmd);
  if (!start && !end) return "";
  if (!start) return end;
  if (!end) return start;
  return `${start}${separator}${end}`;
}

export function formatDisplayDateRange(
  start: string | number | Date | null | undefined,
  end: string | number | Date | null | undefined,
  separator = " – "
): string {
  const s = formatDisplayDate(start);
  const e = formatDisplayDate(end);
  if (!s && !e) return "";
  if (!s) return e;
  if (!e) return s;
  return `${s}${separator}${e}`;
}

/** Parse UI date text (MM/dd/yy) or yyyy-MM-dd back to API yyyy-MM-dd. */
export function parseDisplayDateToYmd(input: string | null | undefined): string {
  const s = String(input ?? "").trim();
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const parsed = parse(s, UI_DATE_DISPLAY_FORMAT, new Date());
  if (!isValid(parsed)) return "";
  return format(parsed, "yyyy-MM-dd");
}

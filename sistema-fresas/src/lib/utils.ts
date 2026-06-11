import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(num);
}

// The business operates in Bolivia (GMT-4, no DST) regardless of the
// timezone the server process happens to run in (e.g. UTC in production).
const APP_TIMEZONE = "America/La_Paz";
const APP_UTC_OFFSET = "-04:00";

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: APP_TIMEZONE,
  });
}

// For @db.Date columns, which Prisma represents as UTC midnight regardless
// of session timezone — format using UTC to avoid shifting to the prior day.
export function formatDateUTC(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: APP_TIMEZONE,
  });
}

// "YYYY-MM-DD" for a timestamp as seen in Bolivia time, independent of the
// server's local timezone — for CSV exports of timestamptz fields.
export function toAppDateString(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

// "HH:mm" (24h) for a timestamp in Bolivia time — for CSV exports.
export function toAppTimeString(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(d);
}

export function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Parses a "YYYY-MM-DD" string as a local-time Date (midnight local time),
// avoiding the UTC interpretation that `new Date(dateStr)` would apply.
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// "YYYY-MM-DD" for "today" in Bolivia time, independent of the server
// process's local timezone.
export function todayLocalDateString(): string {
  return toAppDateString(new Date());
}

export function todayStart(): Date {
  return dateRangeStart(todayLocalDateString());
}

export function todayEnd(): Date {
  return dateRangeEnd(todayLocalDateString());
}

// Builds the UTC instant for the start/end of a calendar day in Bolivia
// time (GMT-4, fixed offset, no DST), independent of the server's
// local timezone — for filtering timestamptz columns like Sale.createdAt.
export function dateRangeStart(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000${APP_UTC_OFFSET}`);
}

export function dateRangeEnd(dateStr: string): Date {
  return new Date(`${dateStr}T23:59:59.999${APP_UTC_OFFSET}`);
}

// For @db.Date columns, which Prisma stores/compares as UTC calendar dates
// regardless of session timezone.
export function dateOnlyRangeStart(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

export function dateOnlyRangeEnd(dateStr: string): Date {
  return new Date(`${dateStr}T23:59:59.999Z`);
}

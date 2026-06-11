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

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
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
  });
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

export function todayStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function todayEnd(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

export function dateRangeStart(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00`);
}

export function dateRangeEnd(dateStr: string): Date {
  return new Date(`${dateStr}T23:59:59.999`);
}

// For @db.Date columns, which Prisma stores/compares as UTC calendar dates
// regardless of session timezone.
export function dateOnlyRangeStart(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

export function dateOnlyRangeEnd(dateStr: string): Date {
  return new Date(`${dateStr}T23:59:59.999Z`);
}

/**
 * Nepal Standard Time (NPT) Date Utilities
 * Timezone: Asia/Kathmandu — UTC+5:45
 *
 * The worldcup26.ir API returns dates as "MM/dd/yyyy HH:mm" in US venue local
 * time. We parse them and convert to NPT for display throughout the app.
 */

import { parse } from "date-fns";
import {
  formatInTimeZone,
  toZonedTime,
  fromZonedTime,
} from "date-fns-tz";

export const NPT_TIMEZONE = "Asia/Kathmandu";

/**
 * Parse API date string "MM/dd/yyyy HH:mm" → JS Date (treated as UTC)
 * The API stores venue local times; we treat them as-is and add offset below.
 */
export function parseMatchDate(localDate: string): Date {
  // API format: "06/13/2026 21:00"
  try {
    return parse(localDate, "MM/dd/yyyy HH:mm", new Date());
  } catch {
    return new Date(NaN);
  }
}

/**
 * Format a match date from API string → Nepal Time
 * Output: "Jun 14, 2:45 AM NPT"
 */
export function formatMatchDateNPT(localDate: string | null | undefined): string {
  if (!localDate) return "";
  try {
    const date = parseMatchDate(localDate);
    if (isNaN(date.getTime())) return "";
    return formatInTimeZone(date, NPT_TIMEZONE, "MMM d, h:mm a") + " NPT";
  } catch {
    return "";
  }
}

/**
 * Format a match date — date only
 * Output: "Jun 14"
 */
export function formatMatchDateShortNPT(localDate: string | null | undefined): string {
  if (!localDate) return "";
  try {
    const date = parseMatchDate(localDate);
    if (isNaN(date.getTime())) return "";
    return formatInTimeZone(date, NPT_TIMEZONE, "MMM d");
  } catch {
    return "";
  }
}

/**
 * Format time only in NPT
 * Output: "7:15 AM NPT"
 */
export function formatTimeNPT(localDate: string | null | undefined): string {
  if (!localDate) return "";
  try {
    const date = parseMatchDate(localDate);
    if (isNaN(date.getTime())) return "";
    return formatInTimeZone(date, NPT_TIMEZONE, "h:mm a") + " NPT";
  } catch {
    return "";
  }
}

/**
 * Format match date with weekday
 * Output: "Sun, Jun 14, 7:15 AM NPT"
 */
export function formatMatchDateFullNPT(localDate: string | null | undefined): string {
  if (!localDate) return "";
  try {
    const date = parseMatchDate(localDate);
    if (isNaN(date.getTime())) return "";
    return formatInTimeZone(date, NPT_TIMEZONE, "EEE, MMM d, h:mm a") + " NPT";
  } catch {
    return "";
  }
}

/**
 * Get current Nepal time string for header clock
 * Output: "8:45 AM NPT"
 */
export function getCurrentNPTTime(): string {
  try {
    return formatInTimeZone(new Date(), NPT_TIMEZONE, "h:mm:ss a") + " NPT";
  } catch {
    return new Date().toLocaleTimeString();
  }
}

/**
 * Get current Nepal time date for comparisons
 */
export function getCurrentNPTDate(): Date {
  return toZonedTime(new Date(), NPT_TIMEZONE);
}

/**
 * Check if a match date string is today in NPT
 */
export function isMatchToday(localDate: string | null | undefined): boolean {
  if (!localDate) return false;
  try {
    const matchDate = parseMatchDate(localDate);
    const nowNPT = toZonedTime(new Date(), NPT_TIMEZONE);
    const matchNPT = toZonedTime(matchDate, NPT_TIMEZONE);
    return (
      matchNPT.getFullYear() === nowNPT.getFullYear() &&
      matchNPT.getMonth() === nowNPT.getMonth() &&
      matchNPT.getDate() === nowNPT.getDate()
    );
  } catch {
    return false;
  }
}

export interface CountdownResult {
  days: number;
  hours: number;
  mins: number;
  secs: number;
  totalSeconds: number;
  isExpired: boolean;
}

/**
 * Get countdown from now (NPT) to the next unstarted match
 */
export function getNextMatchCountdown(
  games: Array<{ local_date: string; finished: string; time_elapsed: string }>
): CountdownResult {
  const nowMs = Date.now();

  // Find the next unstarted match
  const upcoming = games
    .filter(
      (g) =>
        g.time_elapsed === "notstarted" &&
        g.finished !== "TRUE" &&
        g.local_date
    )
    .map((g) => ({ game: g, dateMs: parseMatchDate(g.local_date).getTime() }))
    .filter(({ dateMs }) => !isNaN(dateMs) && dateMs > nowMs)
    .sort((a, b) => a.dateMs - b.dateMs);

  if (!upcoming.length) {
    return { days: 0, hours: 0, mins: 0, secs: 0, totalSeconds: 0, isExpired: true };
  }

  const diffMs = upcoming[0]!.dateMs - nowMs;
  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  return { days, hours, mins, secs, totalSeconds, isExpired: false };
}

/**
 * Get the next upcoming match for display
 */
export function getNextMatch<T extends { local_date: string; finished: string; time_elapsed: string }>(
  games: T[]
): T | null {
  const nowMs = Date.now();
  const upcoming = games
    .filter(
      (g) =>
        g.time_elapsed === "notstarted" &&
        g.finished !== "TRUE" &&
        g.local_date
    )
    .map((g) => ({ game: g, dateMs: parseMatchDate(g.local_date).getTime() }))
    .filter(({ dateMs }) => !isNaN(dateMs) && dateMs > nowMs)
    .sort((a, b) => a.dateMs - b.dateMs);
  return upcoming[0]?.game ?? null;
}

// Suppress unused import warning for fromZonedTime (used for potential future conversions)
void fromZonedTime;

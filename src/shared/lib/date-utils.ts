export type HariBelajar = "SENIN" | "SELASA" | "RABU" | "KAMIS" | "JUMAT" | "SABTU" | "MINGGU";

/**
 * Returns the current day name in Indonesian (SENIN..MINGGU) based on the specified timezone (default: Asia/Jakarta).
 * This prevents UTC server timezone offsets (e.g. Vercel) from reporting yesterday's day during morning hours (00:00 - 06:59 WIB).
 */
export function getHariBelajarInTimezone(
  date: Date = new Date(),
  timeZone: string = "Asia/Jakarta"
): HariBelajar {
  try {
    const dayName = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone }).format(date);
    const map: Record<string, HariBelajar> = {
      Monday: "SENIN",
      Tuesday: "SELASA",
      Wednesday: "RABU",
      Thursday: "KAMIS",
      Friday: "JUMAT",
      Saturday: "SABTU",
      Sunday: "MINGGU",
    };
    return map[dayName] || "SENIN";
  } catch {
    const fallbackMap: Record<number, HariBelajar> = {
      1: "SENIN",
      2: "SELASA",
      3: "RABU",
      4: "KAMIS",
      5: "JUMAT",
      6: "SABTU",
      0: "MINGGU",
    };
    return fallbackMap[date.getDay()] || "SENIN";
  }
}

/**
 * Returns current HH:mm formatted string in the specified timezone (default: Asia/Jakarta).
 */
export function getCurrentHHMMInTimezone(
  date: Date = new Date(),
  timeZone: string = "Asia/Jakarta"
): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone,
    }).formatToParts(date);
    const hour = parts.find((p) => p.type === "hour")?.value || "00";
    const minute = parts.find((p) => p.type === "minute")?.value || "00";
    return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
  } catch {
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }
}

/**
 * Formats a date into a localized Indonesian date string in the specified timezone.
 */
export function formatDateInTimezone(
  date: Date = new Date(),
  timeZone: string = "Asia/Jakarta",
  options?: Intl.DateTimeFormatOptions
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone,
    ...options,
  };
  return new Intl.DateTimeFormat("id-ID", defaultOptions).format(date);
}

/**
 * Returns the Date object representing 00:00:00.000 (start of day) in the specified timezone (default: Asia/Jakarta).
 */
export function getStartOfDayInTimezone(
  date: Date = new Date(),
  timeZone: string = "Asia/Jakarta"
): Date {
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone }).format(date); // YYYY-MM-DD
  return new Date(`${ymd}T00:00:00+07:00`);
}

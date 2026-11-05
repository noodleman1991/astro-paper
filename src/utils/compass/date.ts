import type { Locale } from "@/i18n/config";

/** Compact post date for compass tiles: "24 mar 2026" / "24 במרץ 2026". */
export const postDate = (
  date: Date,
  locale: Locale,
  timeZone: string,
  withYear = true
) =>
  new Intl.DateTimeFormat(locale === "he" ? "he-IL" : "en-GB", {
    day: "numeric",
    month: "short",
    ...(withYear && { year: "numeric" }),
    timeZone,
  })
    .format(date)
    .toLowerCase();

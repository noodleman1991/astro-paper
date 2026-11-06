import { DEFAULT_LOCALE, isLocale, type Locale } from "./config";

/**
 * Pick the best supported locale from an Accept-Language header.
 * Matches on the primary subtag only ("he-IL" → "he").
 */
export function preferredLocale(header: string | null): Locale {
  if (!header) return DEFAULT_LOCALE;
  const ranked = header
    .split(",")
    .map(part => {
      const [tag, ...params] = part.trim().split(";");
      const qParam = params.find(p => p.trim().startsWith("q="));
      const parsed = qParam ? Number(qParam.trim().slice(2)) : 1;
      return {
        primary: tag.trim().toLowerCase().split("-")[0],
        q: Number.isNaN(parsed) ? 0 : parsed,
      };
    })
    .filter(({ q }) => q > 0)
    .sort((a, b) => b.q - a.q);
  const best = ranked.find(({ primary }) => isLocale(primary));
  return best ? (best.primary as Locale) : DEFAULT_LOCALE;
}

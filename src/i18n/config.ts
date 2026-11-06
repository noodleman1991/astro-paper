export const LOCALES = ["en", "he"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function localeDir(locale: Locale): "ltr" | "rtl" {
  return locale === "he" ? "rtl" : "ltr";
}

/** Prefix a site-absolute path with the locale segment when needed. */
export function localePath(locale: Locale, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return normalized;
  return normalized === "/" ? `/${locale}/` : `/${locale}${normalized}`;
}

/** Locale encoded in a pathname ("/he/..." → "he"; anything else → "en"). */
export function pathLocale(pathname: string): Locale {
  const segment = pathname.split("/")[1];
  return segment === "he" ? "he" : "en";
}

/** The same page's path in the target locale. */
export function alternatePath(pathname: string, target: Locale): string {
  const bare = pathname.replace(/^\/he(\/|$)/, "/");
  return localePath(target, bare);
}

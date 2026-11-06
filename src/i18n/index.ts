import type { Locale } from "./config";
import en, { type Dict } from "./translations/en";
import he from "./translations/he";

const dictionaries: Record<Locale, Dict> = { en, he };

export function useTranslations(locale: Locale): Dict {
  return dictionaries[locale];
}

export { fmt } from "./format";
export * from "./config";

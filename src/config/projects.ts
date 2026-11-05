import type { Locale } from "@/i18n/config";
import type { LinkChip } from "./services";

export interface Project {
  /** 1-based; `#portfolio/<nn>` uses it zero-padded. */
  n: number;
  title: string;
  tag: string;
  lead: string;
  paras: string[];
  links: LinkChip[];
}

const TAGS = [
  "web",
  "hubs",
  "apps",
  "data",
  "AI",
  "web",
  "databases",
  "hubs",
  "apps",
  "data",
];
const EN_NAMES = [
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
];
const HE_NAMES = [
  "אחד",
  "שתיים",
  "שלוש",
  "ארבע",
  "חמש",
  "שש",
  "שבע",
  "שמונה",
  "תשע",
  "עשר",
];

// Placeholders until the real projects arrive; the copy in brackets is for the owner to replace.
export const PROJECTS: Record<Locale, Project[]> = {
  en: EN_NAMES.map((name, i) => ({
    n: i + 1,
    title: `project ${name}`,
    tag: TAGS[i],
    lead: "[one line: what it is and who it’s for]",
    paras: [
      "[the problem, in two sentences]",
      "[what you built, and what changed for them after]",
    ],
    links: [
      { label: "[service]" },
      { label: "[year]" },
      { label: "[stack]" },
      { label: "[visit ↗]" },
    ],
  })),
  he: HE_NAMES.map((name, i) => ({
    n: i + 1,
    title: `פרויקט ${name}`,
    tag: TAGS[i],
    lead: "[שורה אחת: מה זה ולמי זה]",
    paras: ["[הבעיה, בשני משפטים]", "[מה נבנה, ומה השתנה אצלם אחר כך]"],
    links: [
      { label: "[שירות]" },
      { label: "[שנה]" },
      { label: "[טכנולוגיות]" },
      { label: "[לאתר ↗]" },
    ],
  })),
};

export const projectHash = (n: number) => String(n).padStart(2, "0");

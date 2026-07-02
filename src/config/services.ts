import type { Locale } from "@/i18n/config";

export interface Service {
  /** astro-icon name, e.g. "tabler:code" */
  icon: string;
  title: string;
  blurb: string;
}

// 6 tiles per locale: enough unique items that the vertical marquee never
// shows a duplicate in view (the block fits ~4 tiles; 3 would force a repeat).
export const SERVICES: Record<Locale, Service[]> = {
  en: [
    {
      icon: "tabler:code",
      title: "web development",
      blurb: "Fast, accessible websites built to last.",
    },
    {
      icon: "tabler:device-mobile",
      title: "app development",
      blurb: "Tools and apps that do the job simply.",
    },
    {
      icon: "tabler:hierarchy-2",
      title: "knowledge hubs",
      blurb: "Structure a team's accumulated knowledge.",
    },
    {
      icon: "tabler:database",
      title: "databases",
      blurb: "Model and store data so it stays usable.",
    },
    {
      icon: "tabler:chart-dots",
      title: "data tools",
      blurb: "Pipelines and dashboards that surface what matters.",
    },
    {
      icon: "tabler:sparkles",
      title: "AI integration",
      blurb: "AI where it actually helps — not for its own sake.",
    },
  ],
  he: [
    {
      icon: "tabler:code",
      title: "פיתוח אתרים",
      blurb: "אתרים מהירים ונגישים שנבנו להחזיק מעמד.",
    },
    {
      icon: "tabler:device-mobile",
      title: "פיתוח אפליקציות",
      blurb: "כלים ואפליקציות שעושים את העבודה בפשטות.",
    },
    {
      icon: "tabler:hierarchy-2",
      title: "האבים של ידע",
      blurb: "בניית מבנה לידע המצטבר של צוות.",
    },
    {
      icon: "tabler:database",
      title: "מסדי נתונים",
      blurb: "מידול ואחסון נתונים כך שיישארו שמישים.",
    },
    {
      icon: "tabler:chart-dots",
      title: "כלי דאטה",
      blurb: "צינורות נתונים ודשבורדים שמראים את מה שחשוב.",
    },
    {
      icon: "tabler:sparkles",
      title: "שילוב AI",
      blurb: "AI איפה שהוא באמת עוזר — לא בשביל עצמו.",
    },
  ],
};

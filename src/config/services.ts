export interface Service {
  /** astro-icon name, e.g. "tabler:code" */
  icon: string;
  title: string;
  blurb: string;
}

// 6 tiles: enough unique items that the vertical marquee never shows a
// duplicate in view (the block fits ~4 tiles; 3 would force a repeat).
export const SERVICES: Service[] = [
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
];

import type { Locale } from "@/i18n/config";

/** A chip in a detail window; site paths are localised when rendered. */
export interface LinkChip {
  label: string;
  href?: string;
}

export type ServiceId = "web" | "app" | "hubs" | "db" | "data" | "ai";

export interface Service {
  id: ServiceId;
  /** English in both locales, used in `#services/<slug>`. */
  slug: string;
  /** astro-icon name, e.g. "tabler:code" */
  icon: string;
  title: string;
  blurb: string;
  lead: string;
  paras: string[];
  links: LinkChip[];
}

const L = {
  astro: { label: "Astro ↗", href: "https://astro.build" },
  next: { label: "Next.js ↗", href: "https://nextjs.org" },
  flutter: { label: "Flutter ↗", href: "https://flutter.dev" },
  material: {
    label: "Material 3 guidelines ↗",
    href: "https://m3.material.io",
  },
  obsidian: { label: "Obsidian ↗", href: "https://obsidian.md" },
  notion: { label: "Notion ↗", href: "https://www.notion.so" },
  supabase: { label: "Supabase ↗", href: "https://supabase.com" },
  firebase: { label: "Firebase ↗", href: "https://firebase.google.com" },
  streamlit: { label: "Streamlit ↗", href: "https://streamlit.io" },
  pandas: { label: "pandas ↗", href: "https://pandas.pydata.org" },
};
const WORK_WITH = "/posts/what-i-work-with/";
const TREES = "/posts/knowledge-trees/";

export const SERVICES: Record<Locale, Service[]> = {
  en: [
    {
      id: "web",
      slug: "web-development",
      icon: "tabler:code",
      title: "web development",
      blurb: "Fast, accessible websites built to last.",
      lead: "Fast, accessible websites built to last.",
      paras: [
        "websites and web apps are usually Next.js and React. when the priority is getting content out clearly — research outputs, resource libraries, documentation — I reach for Astro. already on WordPress? happy to work with that too.",
        "whatever the stack, the bar is the same: fast on a weak phone, readable by a screen reader, still maintainable in three years.",
      ],
      links: [
        L.astro,
        L.next,
        { label: "what i work with →", href: WORK_WITH },
      ],
    },
    {
      id: "app",
      slug: "app-development",
      icon: "tabler:device-mobile",
      title: "app development",
      blurb: "Tools and apps that do the job simply.",
      lead: "Tools and apps that do the job simply.",
      paras: [
        "mobile apps I build with Flutter — one codebase for Android and iOS. small internal tools often don’t need an app store at all; a focused web app does the job.",
        "the interesting question is rarely the framework. it’s which twenty percent of the features do eighty percent of the work.",
      ],
      links: [L.flutter, L.material],
    },
    {
      id: "hubs",
      slug: "knowledge-hubs",
      icon: "tabler:hierarchy-2",
      title: "knowledge hubs",
      blurb: "Structure a team's accumulated knowledge.",
      lead: "Structure a team’s accumulated knowledge.",
      paras: [
        "teams accumulate knowledge faster than they organize it. I set up hubs — wikis, resource libraries, internal handbooks — where structure follows how people actually search, not how departments are drawn.",
        "the tooling varies: Notion, Obsidian, a static site, sometimes a database with a thin interface. the constant is caring about the second year, when the hub either lives or rots.",
      ],
      links: [
        L.obsidian,
        L.notion,
        { label: "knowledge trees →", href: TREES },
      ],
    },
    {
      id: "db",
      slug: "databases",
      icon: "tabler:database",
      title: "databases",
      blurb: "Model and store data so it stays usable.",
      lead: "Model and store data so it stays usable.",
      paras: [
        "databases and access control usually sit on Supabase or Firebase: private team spaces, members-only content, forms that go somewhere useful, different access for different people.",
        "most of the value is in the modeling — naming things honestly and deciding what’s a table, what’s a field, and what’s actually two different questions.",
      ],
      links: [L.supabase, L.firebase],
    },
    {
      id: "data",
      slug: "data-tools",
      icon: "tabler:chart-dots",
      title: "data tools",
      blurb: "Pipelines and dashboards that surface what matters.",
      lead: "Pipelines and dashboards that surface what matters.",
      paras: [
        "Python is where the more specific work happens: searching across hundreds of documents by meaning rather than keywords, making field data readable, automating something repetitive.",
        "Streamlit puts a browser interface on all of this — nothing technical needed on your end.",
      ],
      links: [L.streamlit, L.pandas],
    },
    {
      id: "ai",
      slug: "ai-integration",
      icon: "tabler:sparkles",
      title: "AI integration",
      blurb: "AI where it actually helps — not for its own sake.",
      lead: "AI where it actually helps — not for its own sake.",
      paras: [
        "most of what I build now involves AI in some form. the question I find useful isn’t what AI can do in general, but what it can do with your content, your workflows, your constraints.",
        "connecting a language model to your own reports so your team can ask questions and get answers from your material — not the internet — is the shape this usually takes.",
      ],
      links: [
        { label: "[provider docs ↗]" },
        { label: "what i work with →", href: WORK_WITH },
      ],
    },
  ],
  he: [
    {
      id: "web",
      slug: "web-development",
      icon: "tabler:code",
      title: "פיתוח אתרים",
      blurb: "אתרים מהירים ונגישים שנבנו להחזיק מעמד.",
      lead: "אתרים מהירים ונגישים שנבנו להחזיק מעמד.",
      paras: [
        "אתרים ואפליקציות ווב נבנים לרוב ב־Next.js וב־React. כשהעיקר הוא להוציא תוכן בבהירות — תוצרי מחקר, ספריות משאבים, תיעוד — אני בוחר ב־Astro. כבר על WordPress? אשמח לעבוד גם עם זה.",
        "לא משנה מה הטכנולוגיה, הרף זהה: מהיר בטלפון חלש, קריא לקורא מסך, ועדיין ניתן לתחזוקה בעוד שלוש שנים.",
      ],
      links: [L.astro, L.next, { label: "עם מה אני עובד ←", href: WORK_WITH }],
    },
    {
      id: "app",
      slug: "app-development",
      icon: "tabler:device-mobile",
      title: "פיתוח אפליקציות",
      blurb: "כלים ואפליקציות שעושים את העבודה בפשטות.",
      lead: "כלים ואפליקציות שעושים את העבודה בפשטות.",
      paras: [
        "אפליקציות מובייל אני בונה ב־Flutter — קוד אחד לאנדרואיד ול־iOS. כלים פנימיים קטנים לרוב לא צריכים חנות אפליקציות בכלל; אפליקציית ווב ממוקדת עושה את העבודה.",
        "השאלה המעניינת היא כמעט אף פעם לא הפריימוורק, אלא אילו עשרים אחוז מהפיצ׳רים עושים שמונים אחוז מהעבודה.",
      ],
      links: [L.flutter, { ...L.material, label: "הנחיות Material 3 ↗" }],
    },
    {
      id: "hubs",
      slug: "knowledge-hubs",
      icon: "tabler:hierarchy-2",
      title: "האבים של ידע",
      blurb: "בניית מבנה לידע המצטבר של צוות.",
      lead: "בניית מבנה לידע המצטבר של צוות.",
      paras: [
        "צוותים צוברים ידע מהר יותר משהם מארגנים אותו. אני מקים האבים — ויקי, ספריות משאבים, מדריכים פנימיים — שהמבנה שלהם עוקב אחרי הדרך שבה אנשים באמת מחפשים, ולא אחרי חלוקת המחלקות.",
        "הכלים משתנים: Notion, Obsidian, אתר סטטי, לפעמים מסד נתונים עם ממשק דק. מה שקבוע הוא האכפתיות מהשנה השנייה, כשההאב או חי או נרקב.",
      ],
      links: [L.obsidian, L.notion, { label: "עצי ידע ←", href: TREES }],
    },
    {
      id: "db",
      slug: "databases",
      icon: "tabler:database",
      title: "מסדי נתונים",
      blurb: "מידול ואחסון נתונים כך שיישארו שמישים.",
      lead: "מידול ואחסון נתונים כך שיישארו שמישים.",
      paras: [
        "מסדי נתונים והרשאות יושבים לרוב על Supabase או Firebase: מרחבי צוות פרטיים, תוכן לחברים בלבד, טפסים שמגיעים למקום מועיל, הרשאות שונות לאנשים שונים.",
        "רוב הערך נמצא במידול — לקרוא לדברים בשמם, ולהחליט מה טבלה, מה שדה, ומה בעצם שתי שאלות שונות.",
      ],
      links: [L.supabase, L.firebase],
    },
    {
      id: "data",
      slug: "data-tools",
      icon: "tabler:chart-dots",
      title: "כלי דאטה",
      blurb: "צינורות נתונים ודשבורדים שמראים את מה שחשוב.",
      lead: "צינורות נתונים ודשבורדים שמראים את מה שחשוב.",
      paras: [
        "ב־Python קורית העבודה הממוקדת יותר: חיפוש במאות מסמכים לפי משמעות ולא לפי מילות מפתח, הפיכת נתוני שטח לקריאים, אוטומציה של משהו שחוזר על עצמו.",
        "Streamlit שם על כל זה ממשק בדפדפן — בלי שום דבר טכני מהצד שלך.",
      ],
      links: [L.streamlit, L.pandas],
    },
    {
      id: "ai",
      slug: "ai-integration",
      icon: "tabler:sparkles",
      title: "שילוב AI",
      blurb: "AI איפה שהוא באמת עוזר — לא בשביל עצמו.",
      lead: "AI איפה שהוא באמת עוזר — לא בשביל עצמו.",
      paras: [
        "רוב מה שאני בונה היום כולל AI בצורה כלשהי. השאלה שאני מוצא מועילה היא לא מה AI יכול לעשות באופן כללי, אלא מה הוא יכול לעשות עם התוכן שלך, תהליכי העבודה שלך והאילוצים שלך.",
        "חיבור מודל שפה לדוחות שלכם, כך שהצוות יוכל לשאול שאלות ולקבל תשובות מהחומר שלכם — לא מהאינטרנט — זו הצורה שזה לובש לרוב.",
      ],
      links: [
        { label: "[תיעוד הספק ↗]" },
        { label: "עם מה אני עובד ←", href: WORK_WITH },
      ],
    },
  ],
};

/** Service by id, for components that place tiles by shape key. */
export const serviceById = (locale: Locale, id: ServiceId) =>
  SERVICES[locale].find(s => s.id === id) as Service;

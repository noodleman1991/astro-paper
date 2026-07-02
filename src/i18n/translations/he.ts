import type { Dict } from "./en";

const he: Dict = {
  site: {
    desc: "פורטפוליו ובלוג אישי",
  },
  a11y: {
    skipToContent: "דילוג לתוכן",
    openMenu: "פתיחת תפריט",
    closeMenu: "סגירת תפריט",
    themeToggle: "החלפה בין מצב בהיר לכהה",
    rssFeed: "פיד RSS",
  },
  nav: {
    posts: "פוסטים",
    tags: "תגיות",
    about: "אודות",
    archives: "ארכיון",
    search: "חיפוש",
  },
  footer: {
    copyright: "זכויות יוצרים",
    allRights: "כל הזכויות שמורות.",
  },
  pages: {
    posts: { title: "פוסטים", desc: "כל המאמרים שפרסמתי." },
    tags: { title: "תגיות", desc: "כל התגיות שבשימוש בפוסטים." },
    tagDetail: {
      titlePrefix: "תגית:",
      desc: 'כל המאמרים עם התגית "{tag}".',
    },
    archives: { title: "ארכיון", desc: "כל המאמרים שבארכיון." },
    search: {
      title: "חיפוש",
      placeholder: "חיפוש מאמרים ...",
      inputAria: "חיפוש מאמרים",
    },
    notFound: { message: "העמוד לא נמצא", goHome: "חזרה הביתה" },
  },
  post: {
    updated: "עודכן:",
    prev: "הקודם",
    next: "הבא",
    prevPost: "הפוסט הקודם",
    nextPost: "הפוסט הבא",
    goBack: "חזרה",
    backToTop: "חזרה למעלה",
    shareOn: "שיתוף הפוסט:",
    copy: "העתקה",
    copied: "הועתק",
    paginationAria: "ניווט בין עמודים",
    gotoPrev: "לעמוד הקודם",
    gotoNext: "לעמוד הבא",
    untranslated: "הפוסט הזה עדיין לא תורגם לעברית — מוצג באנגלית.",
  },
  breadcrumb: {
    home: "בית",
    page: "עמוד",
  },
  home: {
    heroAria: "היכרות",
    servicesAria: "מה אני עושה",
    blogAria: "מהבלוג",
    portfolioAria: "תיק עבודות",
    heroHeading: "היי, אני עמית",
    heroIntro:
      "אני בונה אתרים ואפליקציות, ומקים האבים וניהול ידע — עם ובלי AI.",
  },
};

export default he;

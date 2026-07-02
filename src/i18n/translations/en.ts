// English is the source of truth: its shape is the Dict type.
// Values are plain strings (no `as const`) so `typeof en` types leaves as string.
const en = {
  site: {
    desc: "personal portfolio and blog",
  },
  a11y: {
    skipToContent: "Skip to content",
    openMenu: "Open Menu",
    closeMenu: "Close Menu",
    themeToggle: "Toggles light & dark",
    rssFeed: "RSS feed",
  },
  nav: {
    posts: "Posts",
    tags: "Tags",
    about: "About",
    archives: "Archives",
    search: "Search",
  },
  footer: {
    copyright: "Copyright",
    allRights: "All rights reserved.",
  },
  pages: {
    posts: { title: "Posts", desc: "All the articles I've posted." },
    tags: { title: "Tags", desc: "All the tags used in posts." },
    tagDetail: {
      titlePrefix: "Tag:",
      desc: 'All the articles with the tag "{tag}".',
    },
    archives: { title: "Archives", desc: "All the articles I've archived." },
    search: {
      title: "Search",
      placeholder: "search any article ...",
      inputAria: "Search articles",
    },
    notFound: { message: "Page Not Found", goHome: "Go back home" },
  },
  post: {
    updated: "Updated:",
    prev: "Prev",
    next: "Next",
    prevPost: "Previous Post",
    nextPost: "Next Post",
    goBack: "Go back",
    backToTop: "Back to top",
    shareOn: "Share this post on:",
    copy: "Copy",
    copied: "Copied",
    paginationAria: "Pagination Navigation",
    gotoPrev: "Goto Previous Page",
    gotoNext: "Goto Next Page",
    untranslated: "this post hasn't been translated yet — shown in English.",
  },
  breadcrumb: {
    home: "Home",
    page: "page",
  },
  home: {
    heroAria: "Introduction",
    servicesAria: "What I do",
    blogAria: "From the blog",
    portfolioAria: "Portfolio",
    heroHeading: "hi, I'm Amit",
    heroIntro:
      "I build websites and apps, set up hubs and knowledge management with and without AI.",
  },
};

export default en;
export type Dict = typeof en;

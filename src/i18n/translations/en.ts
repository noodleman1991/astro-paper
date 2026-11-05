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
  compass: {
    titles: {
      blog: "blog",
      services: "services",
      portfolio: "portfolio",
      about: "about",
    },
    logoAria: "about — spiro spero",
    close: "close section",
    closeAbout: "close about",
    hint: {
      desktop:
        "hover a slice to peek · click it and it pours out · the logo is about",
      phone: "tap a slice · tap the logo for about",
    },
    side: {
      services: ["services", "six ways i can help", "open one for the details"],
      blog: ["blog", "notes as i go", "the whole list lives on its own page"],
      portfolio: [
        "selected work",
        "ten projects on a dial",
        "scroll, drag or tap an edge",
      ],
    },
    blog: {
      read: "read →",
      allPosts: "all posts",
      allPostsSub: "tags · search",
    },
    about: {
      hi: "hi, i'm amit",
      intro:
        "I build websites and apps, set up hubs and knowledge management with and without AI.",
      motto: "spiro spero",
      mottoSub: "i breathe, i hope",
      photo: "[your photo]",
      how: "how i work",
      howSub: "[one line]",
      sayHi: "say hi",
      mail: "mail",
      linkedin: "linkedin ↗",
    },
    how: {
      title: "how i work",
      lead: "[the short version, in one sentence]",
      paras: [
        "[how a project usually starts — the first conversation, what you ask about]",
        "[how you keep it small and useful — what you build first, what you leave out]",
        "[how you hand it over, so it’s still alive in the second year]",
      ],
      links: [
        { label: "what i work with →", href: "/posts/what-i-work-with/" },
        { label: "knowledge trees →", href: "/posts/knowledge-trees/" },
      ] as { label: string; href?: string }[],
    },
    win: {
      services: "services",
      portfolio: "portfolio · {n} / 10",
      about: "about",
      closeWin: "close window",
      next: "next →",
      ctaService: "start something like this →",
      ctaProject: "something like this? say hi →",
      ctaAbout: "say hi →",
      media: "[project image or short screen recording]",
    },
    dial: {
      status: "projects {from}–{to} of 10",
      end: "that's the lot",
      endSub: "ten projects · something like this?",
      sayHi: "say hi →",
    },
    top: {
      share: "share",
      shareAria: "share this site",
      copyLink: "copy link",
      copied: "copied ✓",
      emailCopied: "copied ✓",
      language: "switch language",
      theme: "toggle dark mode",
    },
    drawer: {
      title: "say hi",
      open: "say hi",
      aria: "contact and settings",
      close: "× close",
      closeAria: "close contact",
      write: "write me a message",
      share: "share this site",
      copy: "copy link",
      dark: "dark",
      light: "light",
      plain: "plain menu",
      compass: "compass",
    },
    plain: {
      pick: "pick a section below ↓",
      sections: "sections",
      hide: "hide the compass and use a plain menu",
      back: "bring the compass back",
    },
  },
};

export default en;
export type Dict = typeof en;

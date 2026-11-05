import { navigate } from "astro:transitions/client";
import { formatHash, parseHash, type SectionId } from "./route";
import { fitScale, layoutFor } from "./stage";
import { INITIAL, reduce, toRoute, type Action, type State } from "./state";

const STAGES = {
  desktop: { w: 1280, h: 800 },
  phone: { w: 390, h: 844 },
} as const;

const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);
const qsa = <T extends Element = HTMLElement>(root: ParentNode, sel: string) =>
  Array.from(root.querySelectorAll<T>(sel));

/** Per-visit decoration: rough-edge seed, sparkle turn, ants phase, stagger order. */
function vary(root: HTMLElement) {
  root
    .querySelector("#cp-rough feTurbulence")
    ?.setAttribute("seed", String(Math.ceil(rand(0, 999))));
  for (const spark of qsa<SVGElement>(root, ".cp-spark"))
    spark.style.transform = `translate(${rand(-8, 8).toFixed(1)}px, ${rand(-8, 8).toFixed(1)}px) rotate(${rand(-12, 12).toFixed(1)}deg)`;
  for (const ants of qsa<SVGElement>(root, ".cp-ants"))
    ants.style.animationDelay = `${-rand(0, 5).toFixed(2)}s`;
  for (const region of qsa(root, "[data-region]")) {
    const labels = qsa(region, ":scope > .cp-lbl");
    const order = labels.map((_, i) => i).sort(() => Math.random() - 0.5);
    labels.forEach((l, i) => l.style.setProperty("--i", String(order[i])));
  }
}

export function initCompass(root: HTMLElement): () => void {
  const ac = new AbortController();
  const { signal } = ac;
  const home = location.pathname + location.search;
  let state: State = INITIAL;
  let peekTimer = 0;
  let opener: HTMLElement | null = null;

  const dialogs = qsa<HTMLDialogElement>(root, "dialog[data-item]");

  function render() {
    const { open, peek, item } = state;
    root.classList.toggle("st-about", open === "about");
    for (const r of qsa(root, "[data-region]")) {
      r.classList.toggle("is-pinned", open === r.dataset.region);
      r.classList.toggle("is-peek", !open && peek === r.dataset.region);
    }
    for (const el of qsa<Element>(root, "[data-title]"))
      el.classList.toggle(
        "is-pinned",
        open === (el as HTMLElement).dataset.title
      );
    for (const el of qsa<Element>(root, "[data-wedge]")) {
      const id = (el as HTMLElement).dataset.wedge;
      el.classList.toggle("is-on", open === id || (!open && peek === id));
    }
    for (const el of qsa(root, "[data-toggle][aria-expanded]"))
      el.setAttribute("aria-expanded", String(open === el.dataset.toggle));
    for (const hint of qsa(root, ".cp-hint"))
      hint.classList.toggle("is-hidden", Boolean(open || peek));

    const want = open && item ? `${open}/${item}` : null;
    for (const d of dialogs) {
      if (d.dataset.item === want && !d.open) d.showModal();
      else if (d.dataset.item !== want && d.open) d.close();
    }
  }

  // Hashes of the entries this page pushed, so closing steps back to the
  // entry it came from instead of piling up a new one.
  let trail = [location.hash];

  /**
   * User-initiated changes get a history entry. Hash entries go through the
   * router so it treats them as in-page moves (no re-fetch on Back/Forward);
   * a bare path can't, so fully closing either steps back or replaces.
   */
  function push() {
    const hash = formatHash(toRoute(state));
    if (hash === location.hash) return;
    if (trail.length > 1 && trail[trail.length - 2] === hash) {
      trail.pop();
      history.back();
    } else if (hash) {
      void navigate(hash);
      trail.push(hash);
    } else {
      history.replaceState(history.state, "", home);
      trail = [""];
    }
  }

  function dispatch(action: Action, record = true) {
    const next = reduce(state, action);
    if (next === state) return;
    state = next;
    render();
    if (record) push();
  }

  function routeFromUrl(record = false) {
    dispatch({ type: "route", route: parseHash(location.hash) }, record);
  }

  function fit() {
    const layout = layoutFor(innerWidth);
    const stage = STAGES[layout];
    const top = document.querySelector("[data-topbar]")?.clientHeight ?? 0;
    const k = fitScale(root.clientWidth, innerHeight - top, stage.w, stage.h);
    root.style.setProperty("--k", k.toFixed(4));
    root.style.setProperty("--stage-h", `${stage.h}px`);
    root.dataset.layout = layout;
  }

  const setPeek = (section: SectionId | null) => {
    clearTimeout(peekTimer);
    if (section) dispatch({ type: "peek", section }, false);
    else
      peekTimer = window.setTimeout(
        () => dispatch({ type: "peek", section: null }, false),
        80
      );
  };

  /** A tile and its label light up together. */
  const setHot = (el: Element | null, on: boolean) => {
    const key =
      (el as HTMLElement | null)?.dataset.tile ??
      (el as HTMLElement | null)?.dataset.tileLabel;
    const region = el?.closest("[data-region]");
    if (!key || !region) return;
    for (const t of qsa<Element>(
      region,
      `[data-tile="${key}"], [data-tile-label="${key}"]`
    ))
      t.classList.toggle("is-hot", on);
  };

  const peekTarget = (t: EventTarget | null) => {
    const el = (t as Element | null)?.closest<HTMLElement>(
      "[data-stage=desktop] [data-wedge], [data-stage=desktop] .cp-label"
    );
    const id = el?.dataset.wedge ?? el?.dataset.toggle;
    return id && id !== "about" ? (id as SectionId) : null;
  };

  root.addEventListener(
    "click",
    ev => {
      if (ev.target instanceof HTMLDialogElement) {
        ev.target.close(); // a click on the backdrop
        return;
      }
      const el = (ev.target as Element).closest<HTMLElement>(
        "[data-toggle], [data-win], [data-close], [data-release], [data-href]"
      );
      if (!el) return;
      if (el.dataset.href) {
        ev.preventDefault();
        void navigate(el.dataset.href);
        return;
      }
      ev.preventDefault();
      if (el.dataset.toggle) {
        clearTimeout(peekTimer);
        dispatch({ type: "toggle", section: el.dataset.toggle as SectionId });
      } else if (el.dataset.win) {
        const [section, ...rest] = el.dataset.win.split("/");
        const id = rest.join("/");
        opener = el instanceof HTMLButtonElement ? el : opener;
        if (state.open === section) dispatch({ type: "item", id });
        else
          dispatch({
            type: "route",
            route: { open: section as SectionId, item: id },
          });
      } else {
        dispatch({ type: "close" });
      }
    },
    { signal }
  );

  for (const [over, out] of [
    ["pointerover", "pointerout"],
    ["focusin", "focusout"],
  ] as const) {
    root.addEventListener(
      over,
      ev => {
        const id = peekTarget(ev.target);
        if (id) setPeek(id);
        setHot(
          (ev.target as Element).closest("[data-tile], [data-tile-label]"),
          true
        );
      },
      { signal }
    );
    root.addEventListener(
      out,
      ev => {
        if (peekTarget(ev.target)) setPeek(null);
        setHot(
          (ev.target as Element).closest("[data-tile], [data-tile-label]"),
          false
        );
      },
      { signal }
    );
  }

  for (const d of dialogs)
    d.addEventListener(
      "close",
      () => {
        if (state.item && d.dataset.item === `${state.open}/${state.item}`)
          dispatch({ type: "item", id: null });
        if (opener?.isConnected && !document.querySelector("dialog[open]"))
          opener.focus();
      },
      { signal }
    );

  document.addEventListener(
    "keydown",
    ev => {
      if (ev.key !== "Escape" || document.querySelector("dialog[open]")) return;
      if (state.open) dispatch({ type: "close" });
    },
    { signal }
  );

  window.addEventListener(
    "popstate",
    () => {
      if (location.pathname + location.search !== home) return;
      if (trail[trail.length - 2] === location.hash) trail.pop();
      else if (trail[trail.length - 1] !== location.hash)
        trail = [location.hash];
      routeFromUrl();
    },
    { signal }
  );

  const ro = new ResizeObserver(fit);
  ro.observe(root);
  window.addEventListener("resize", fit, { signal });

  vary(root);
  fit();
  routeFromUrl();
  render();
  const canonical = formatHash(toRoute(state));
  if (canonical !== location.hash) {
    history.replaceState(history.state, "", canonical || home);
    trail = [location.hash];
  }

  return () => {
    ac.abort();
    ro.disconnect();
    clearTimeout(peekTimer);
  };
}

let cleanup: (() => void) | null = null;

/** Wires the controller to the router's page lifecycle (once per document). */
export function mountCompass() {
  document.addEventListener("astro:page-load", () => {
    cleanup?.();
    const root = document.querySelector<HTMLElement>("[data-compass]");
    cleanup = root ? initCompass(root) : null;
  });
  document.addEventListener("astro:before-swap", () => {
    cleanup?.();
    cleanup = null;
  });
}

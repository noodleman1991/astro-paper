import { navigate } from "astro:transitions/client";
import { fmt } from "@/i18n/format";
import {
  cellRole,
  dialAngle,
  dragStep,
  keyStep,
  rangeLabel,
  visibleProjects,
  wheelStep,
} from "./dial";
import { SECTIONS, formatHash, parseHash, type SectionId } from "./route";
import { fitScale, layoutFor } from "./stage";
import { INITIAL, reduce, toRoute, type Action, type State } from "./state";

// `crop` is the band the board kept for its top bar; the real bar sits
// above the stage, so that band is cut rather than doubled.
const STAGES = {
  desktop: { w: 1280, h: 800, crop: 64 },
  phone: { w: 390, h: 844, crop: 0 },
} as const;

const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);
const qsa = <T extends Element = HTMLElement>(root: ParentNode, sel: string) =>
  Array.from(root.querySelectorAll<T>(sel));

/** Per-visit decoration: rough-edge seed, sparkle turn, ants phase, stagger order. */
function vary(root: HTMLElement) {
  root
    .querySelectorAll("#cp-rough feTurbulence, #cp-rough-ph feTurbulence")
    .forEach(f => f.setAttribute("seed", String(Math.ceil(rand(0, 999)))));
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
  const rtl = root.dataset.dir === "rtl";

  const dialogs = qsa<HTMLDialogElement>(root, "dialog[data-item]");
  const dial = root.querySelector<HTMLElement>("[data-dial]");

  function render() {
    const { open, peek, item } = state;
    // st-<section> docks the phone compass opposite the open spill
    for (const id of SECTIONS) root.classList.toggle(`st-${id}`, open === id);
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
    if (dial) renderDial(dial);
  }

  /** Ring angle, which cells sit in the window, and the spoken range. */
  function renderDial(el: HTMLElement) {
    const { step } = state;
    const angle = dialAngle(step);
    el.style.setProperty("--ring", `${angle}deg`);
    el.style.setProperty("--turn", `${rtl ? -angle : angle}deg`);
    for (const c of qsa<HTMLElement | SVGElement>(el, "[data-cell]")) {
      const role = cellRole(Number(c.dataset.cell), step);
      if (c instanceof SVGElement)
        c.classList.toggle("is-peek", role === "next" || role === "prev");
      else {
        c.classList.toggle("is-out", role !== "visible");
        c.inert = role !== "visible";
      }
    }
    const status = el.querySelector<HTMLElement>("[data-dial-status]");
    const text = fmt(status?.dataset.template ?? "", {
      range: rangeLabel(visibleProjects(step)),
    });
    if (status && status.textContent !== text) status.textContent = text;
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
    const k = fitScale(
      root.clientWidth,
      innerHeight - top,
      stage.w,
      stage.h - stage.crop
    );
    root.style.setProperty("--k", k.toFixed(4));
    root.style.setProperty("--stage-h", `${stage.h}px`);
    root.style.setProperty("--crop", `${stage.crop}px`);
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
      const target = ev.target as Element;
      if (dial?.contains(target)) {
        if (performance.now() - draggedAt < 300) {
          ev.preventDefault(); // the end of a drag, not a pick
          return;
        }
        const cell = target.closest<SVGElement>("svg [data-cell]");
        const role = cell && cellRole(Number(cell.dataset.cell), state.step);
        if (role === "next" || role === "prev") {
          ev.preventDefault();
          dispatch({ type: "turn", by: role === "next" ? 1 : -1 }, false);
          return;
        }
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
        // a route, not a bare item, so a project also turns into the window
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

  // The dial turns by wheel, drag and arrow keys while portfolio is open.
  let wheelAt = -Infinity;
  let downX: number | null = null;
  let draggedAt = -Infinity;
  const dialOpen = () => state.open === "portfolio" && !state.item;

  dial?.addEventListener(
    "wheel",
    ev => {
      if (!dialOpen()) return;
      ev.preventDefault();
      const delta =
        Math.abs(ev.deltaY) >= Math.abs(ev.deltaX) ? ev.deltaY : ev.deltaX;
      const now = performance.now();
      const by = wheelStep(delta, now, wheelAt);
      // a step, and every event of the momentum tail behind it, holds the lock
      if (by || now - wheelAt < 420) wheelAt = now;
      if (by) dispatch({ type: "turn", by }, false);
    },
    { passive: false, signal }
  );
  dial?.addEventListener(
    "pointerdown",
    ev => {
      if (dialOpen() && ev.button === 0) downX = ev.clientX;
    },
    { signal }
  );
  window.addEventListener(
    "pointerup",
    ev => {
      if (downX === null) return;
      const by = dragStep(ev.clientX - downX, rtl);
      downX = null;
      if (!by) return;
      draggedAt = performance.now();
      dispatch({ type: "turn", by }, false);
    },
    { signal }
  );
  window.addEventListener("pointercancel", () => (downX = null), { signal });
  dial?.addEventListener(
    "keydown",
    ev => {
      const by = dialOpen() ? keyStep(ev.key, rtl) : 0;
      if (!by) return;
      ev.preventDefault();
      dispatch({ type: "turn", by }, false);
      // focus stays in the window: the label that just turned in takes it
      if (
        document.activeElement?.closest("[inert]") ||
        !dial.contains(document.activeElement)
      ) {
        const shown = qsa(
          dial,
          ".pf-turn button[data-cell]:not([inert]), .pf-turn [data-cell]:not([inert]) a"
        );
        (by > 0 ? shown[0] : shown[shown.length - 1])?.focus();
      }
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

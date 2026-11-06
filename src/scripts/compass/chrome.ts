/**
 * Top bar and contact drawer: copy with feedback, share, the drawer and its
 * theme button. One delegated listener per document, so it survives swaps.
 */
const COPIED_MS = 1600;
const timers = new WeakMap<HTMLElement, number>();

/** Swaps the label for its "copied ✓" text, then puts it back. */
function flash(el: HTMLElement) {
  const label = el.querySelector<HTMLElement>("[data-copy-label]");
  if (!label?.dataset.copied) return;
  label.dataset.text ??= label.textContent ?? "";
  label.textContent = label.dataset.copied;
  clearTimeout(timers.get(label));
  timers.set(
    label,
    window.setTimeout(
      () => (label.textContent = label.dataset.text ?? ""),
      COPIED_MS
    )
  );
}

function share(el: HTMLElement, ev: Event) {
  const url = el.dataset.share || location.href;
  if (navigator.share) {
    ev.preventDefault(); // keeps the popover shut
    // a dismissed share sheet rejects; nothing to do then
    navigator.share({ title: document.title, url }).catch(() => undefined);
    return;
  }
  if (el.hasAttribute("popovertarget")) return; // the popover opens natively
  el.closest("dialog")?.close();
  document.getElementById("cp-share")?.showPopover();
}

export function mountChrome() {
  document.addEventListener("click", ev => {
    const target = ev.target as Element;
    if (
      target instanceof HTMLDialogElement &&
      target.matches("[data-drawer]")
    ) {
      target.close(); // a click on the backdrop
      return;
    }
    const el = target.closest<HTMLElement>(
      "[data-copy], [data-share], [data-drawer-open], [data-theme-toggle]"
    );
    if (!el) return;
    if (el.dataset.copy) {
      // a mailto link still opens; the copy rides along
      navigator.clipboard?.writeText(el.dataset.copy).then(
        () => flash(el),
        () => undefined
      );
    } else if (el.matches("[data-share]")) share(el, ev);
    else if (el.matches("[data-drawer-open]"))
      document.querySelector<HTMLDialogElement>("[data-drawer]")?.showModal();
    else document.getElementById("theme-btn")?.click();
  });
}

export type SectionId = "services" | "blog" | "portfolio" | "about";
export type Route = { open: SectionId | null; item: string | null };

export const SECTIONS: SectionId[] = ["services", "blog", "portfolio", "about"];
export const CLOSED: Route = { open: null, item: null };

/** Reads `#section` or `#section/item`; anything else is closed. */
export function parseHash(hash: string): Route {
  const [head, ...rest] = hash.replace(/^#/, "").split("/");
  if (!SECTIONS.includes(head as SectionId)) return CLOSED;
  try {
    const item = decodeURIComponent(rest.join("/"));
    return { open: head as SectionId, item: item || null };
  } catch {
    return CLOSED;
  }
}

export const formatHash = (r: Route) =>
  r.open ? `#${r.open}${r.item ? `/${encodeURIComponent(r.item)}` : ""}` : "";

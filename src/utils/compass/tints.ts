export type Theme = "light" | "dark";
export type Tint = "k1" | "k2" | "k3" | "k4" | "khot";
export type SpotId = "portfolio" | "services" | "blog" | "about";

export const SPOTS: Record<SpotId, string> = {
  portfolio: "#e8837c",
  services: "#a0c4f4",
  blog: "#a0e8b4",
  about: "#f4a0b5",
};

export const THEME: Record<Theme, { bg: string; fg: string; soft: string }> = {
  light: { bg: "#fdfdfd", fg: "#282728", soft: "#4a494a" },
  dark: { bg: "#212737", fg: "#eaedf3", soft: "#c3c8d4" },
};

/** Spot percentage in `color-mix(in srgb, spot P%, bg)` per tile tier. */
export const TINTS: Record<Theme, Record<Tint, number>> = {
  light: { k1: 20, k2: 30, k3: 40, k4: 52, khot: 72 },
  dark: { k1: 12, k2: 16, k3: 20, k4: 25, khot: 36 },
};

type Rgb = [number, number, number];

const toRgb = (c: string | Rgb): Rgb =>
  typeof c === "string"
    ? ([1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)) as Rgb)
    : c;

/** Same result as CSS `color-mix(in srgb, spot P%, bg)`, unrounded. */
export function mixHex(spot: string, bg: string, percent: number): Rgb {
  const a = toRgb(spot);
  const b = toRgb(bg);
  const p = percent / 100;
  return a.map((v, i) => v * p + b[i] * (1 - p)) as Rgb;
}

const luminance = (c: Rgb) => {
  const [r, g, b] = c.map(v => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** WCAG 2.1 contrast ratio between two colours. */
export function contrastRatio(a: string | Rgb, b: string | Rgb): number {
  const [hi, lo] = [luminance(toRgb(a)), luminance(toRgb(b))].sort(
    (x, y) => y - x
  );
  return (hi + 0.05) / (lo + 0.05);
}

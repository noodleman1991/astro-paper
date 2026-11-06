import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contrastRatio, mixHex } from "./contrast";
import { RING, SPOTS, THEME, TINTS, type Theme, type Tint } from "./tints";

const themes: Theme[] = ["light", "dark"];
const tints: Tint[] = ["k1", "k2", "k3", "k4", "khot"];

describe("contrastRatio", () => {
  it("matches WCAG for black on white", () =>
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1));
  it("mixes like color-mix in srgb", () =>
    expect(
      contrastRatio(mixHex(SPOTS.services, THEME.light.bg, 52), THEME.light.fg)
    ).toBeCloseTo(11.01, 1));
});

describe("tile tints meet AA", () => {
  for (const theme of themes)
    for (const [spot, hex] of Object.entries(SPOTS))
      for (const tint of tints) {
        const bg = mixHex(hex, THEME[theme].bg, TINTS[theme][tint]);
        it(`${theme} ${spot} ${tint}: fg ≥ 4.5`, () =>
          expect(contrastRatio(bg, THEME[theme].fg)).toBeGreaterThanOrEqual(
            4.5
          ));
        if (tint !== "khot")
          it(`${theme} ${spot} ${tint}: soft ≥ 4.5`, () =>
            expect(contrastRatio(bg, THEME[theme].soft)).toBeGreaterThanOrEqual(
              4.5
            ));
      }
});

describe("the accent motto on the still about tile", () => {
  // set at 24px, so it is large text: AA is 3:1
  it.each(themes)("%s ≥ 3", theme =>
    expect(
      contrastRatio(
        mixHex(SPOTS.about, THEME[theme].bg, TINTS[theme].k2),
        THEME[theme].accent
      )
    ).toBeGreaterThanOrEqual(3)
  );
});

// WCAG 1.4.11: a focus ring needs 3:1 against the paper it sits on
describe("focus rings keep 3:1 on spot paper", () => {
  for (const theme of themes)
    for (const [spot, hex] of Object.entries(SPOTS)) {
      it(`${theme} ${spot} window bar`, () =>
        expect(contrastRatio(hex, RING[theme].bar)).toBeGreaterThanOrEqual(3));
      for (const tint of tints)
        it(`${theme} ${spot} ${tint} tile`, () =>
          expect(
            contrastRatio(
              mixHex(hex, THEME[theme].bg, TINTS[theme][tint]),
              RING[theme].tile
            )
          ).toBeGreaterThanOrEqual(3));
    }
});

describe("compass.css carries the rings", () => {
  const css = readFileSync(
    new URL("../../styles/compass.css", import.meta.url),
    "utf8"
  );
  it("window bars use the bar ink", () =>
    expect(css).toContain(
      `.cp-win-bar .cp-sticker:focus-visible {\n  outline-color: ${RING.light.bar};`
    ));
  it("tiles use the foreground", () =>
    expect(css).toContain(
      ".compass-home .cp-lbl:focus-visible {\n  outline-color: var(--foreground);"
    ));
});

describe("global.css carries the same ladder", () => {
  const css = readFileSync(
    new URL("../../styles/global.css", import.meta.url),
    "utf8"
  );
  const block = (sel: string) =>
    css.slice(css.indexOf(sel), css.indexOf("}", css.indexOf(sel)));
  it.each(themes)("%s", theme => {
    const b = block(
      theme === "light" ? 'html[data-theme="light"]' : 'html[data-theme="dark"]'
    );
    for (const tint of tints)
      expect(b).toContain(`--${tint}: ${TINTS[theme][tint]}%;`);
  });
});

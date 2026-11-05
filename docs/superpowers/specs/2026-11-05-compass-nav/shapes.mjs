// v6 geometry: every spill is the slice itself grown bigger — edges continue the slice's own edges,
// one smooth front, no lobes, no drips. portfolio is a dial (desktop) and a stream (phone).
import fs from 'fs';
import { createRequire } from 'module';
import { ri, lerp, dist, at, interp, fanMap, vWave, tile, outline, labelRect, inPoly } from './geo.mjs';
const require = createRequire('/Users/amitlockshinski/WebstormProjects/astro-paper/package.json');
const { Resvg } = require('@resvg/resvg-js');

const OUT = {};
const R = d => (d * Math.PI) / 180;
const ell = (a, b) => th => 1 / Math.hypot(Math.cos(R(th)) / a, Math.sin(R(th)) / b);
const box = b => (b ? { cx: b.cx, cy: b.cy, w: b.w, h: b.h } : null);
const star = (x, y, s) => `M${ri(x)} ${ri(y - s)}Q${ri(x)} ${ri(y)} ${ri(x + s)} ${ri(y)}Q${ri(x)} ${ri(y)} ${ri(x)} ${ri(y + s)}Q${ri(x)} ${ri(y)} ${ri(x - s)} ${ri(y)}Q${ri(x)} ${ri(y)} ${ri(x)} ${ri(y - s)}Z`;

// a fan spill: v=0..1 runs between the two edge angles; front(v) is solved against the real edge angle
function fan(name, { C, thL, thR, F, u0, cells, ok, aspects, inset = 8, sparks = [], corner = 44 }) {
  const map = fanMap(C, thL, thR);
  const th = (u, v) => thL(u) + (thR(u) - thL(u)) * v;
  const front = v => { let u = 300; for (let i = 0; i < 6; i++) u = F(th(u, v)); return u; };
  const tiles = {};
  for (const [id, c] of Object.entries(cells(front))) {
    const t = tile(map, c, { inset });
    tiles[id] = { d: t.d, box: box(labelRect(t.poly, ok, aspects)) };
  }
  const pts = [], corners = [];
  corners.push(0); for (let i = 0; i < 40; i++) pts.push(map(u0 + (front(0) - u0) * i / 40, 0));
  corners.push(pts.length); for (let i = 0; i < 90; i++) pts.push(map(front(i / 90), i / 90));
  corners.push(pts.length); for (let i = 0; i < 40; i++) pts.push(map(front(1) + (u0 - front(1)) * i / 40, 1));
  corners.push(pts.length); for (let i = 0; i < 12; i++) pts.push(map(u0, 1 - i / 12));
  const o = outline(pts, 64, corners, [6, corner, corner, 6]);
  const sp = sparks.map(([v, du, s]) => { const p = map(front(v) + du, v); return star(p[0], p[1], s); }).join('');
  OUT[name] = { pour: o.d, origin: [ri(C[0]), ri(C[1])], tiles, sparks: sp };
  return { pour: o.d, tiles, front, map };
}

// ---------- preview ----------
function preview(file, W, H, C, Rc, parts) {
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="#fdfdfd"/>`;
  for (const pr of parts) {
    if (pr.pour) s += `<path d="${pr.pour}" fill="${pr.k1}" stroke="#282728" stroke-width="2"/>`;
    s += pr.pre || '';
    for (const t of pr.tiles || []) s += `<path d="${t.d}" fill="${t.fill}" stroke="#282728" stroke-width="2"${pr.clip ? ` clip-path="url(#${pr.clip})"` : ''}/>`;
    for (const b of pr.boxes || []) if (b) s += `<rect x="${b.cx - b.w / 2}" y="${b.cy - b.h / 2}" width="${b.w}" height="${b.h}" fill="none" stroke="#c33" stroke-dasharray="4 3"/>`;
    if (pr.sparks) s += `<path d="${pr.sparks}" fill="#fdfdfd" stroke="#282728" stroke-width="2" stroke-linejoin="round"/>`;
  }
  if (C) {
    s += `<circle cx="${C[0]}" cy="${C[1]}" r="${Rc + 3}" fill="#fdfdfd"/><circle cx="${C[0]}" cy="${C[1]}" r="${Rc}" fill="none" stroke="#282728" stroke-width="2"/><circle cx="${C[0]}" cy="${C[1]}" r="${Rc * 1.107}" fill="none" stroke="#282728" stroke-dasharray="2 9"/><circle cx="${C[0]}" cy="${C[1]}" r="${Rc * 0.41}" fill="none" stroke="#282728" stroke-width="2"/>`;
    for (const a of [88, -28, 212]) { const p0 = at(C, Rc * 0.44, a), p1 = at(C, Rc, a); s += `<line x1="${p0[0]}" y1="${p0[1]}" x2="${p1[0]}" y2="${p1[1]}" stroke="#282728" stroke-width="2"/>`; }
  }
  if (W === 1280) s += `<line x1="0" y1="63" x2="1280" y2="63" stroke="#282728"/>`;
  s += '</svg>';
  fs.mkdirSync('prev', { recursive: true });
  fs.writeFileSync(`prev/${file}.png`, new Resvg(s, { fitTo: { mode: 'width', value: W > 600 ? 1000 : 390 } }).render().asPng());
}
const mixc = (spot, t) => { const h = parseInt(spot.slice(1), 16), r = h >> 16, g = (h >> 8) & 255, b = h & 255; const m = c => Math.round(c * t + 253 * (1 - t)); return `rgb(${m(r)},${m(g)},${m(b)})`; };
const ink = spot => ({ k1: mixc(spot, .2), k2: mixc(spot, .3), k3: mixc(spot, .4), k4: mixc(spot, .52) });
const SV = ink('#a0c4f4'), BL = ink('#a0e8b4'), PF = ink('#e8837c'), AB = ink('#f4a0b5');
const fills = (tiles, pick) => Object.entries(tiles).map(([k, t]) => ({ d: t.d, fill: pick(k) }));

// ================= DESKTOP 1280×800, compass stays put =================
const DC = [640, 432];
const dOK = p => p[0] > 16 && p[0] < 1264 && p[1] > 72 && p[1] < 792 && dist(p, DC) > 174;

{ // services — the upper-right slice grown out to a wide, lopsided slice: an inner ring of three, an outer ring of three
  const g = fan('sv', {
    C: DC, u0: 118, ok: dOK, aspects: [1.0, 1.3, 1.7, 2.2],
    thL: interp([[118, 86], [640, 80]]), thR: interp([[118, -26], [640, -31]]), F: ell(590, 350),
    cells: F => {
      const s1 = v => 118 + 0.5 * (F(v) - 118) + 8 * Math.sin(Math.PI * 1.2 * v + 0.4);
      const a1 = vWave(0.27, 0.03, 118, 350, 1, 0.2), a2 = vWave(0.64, -0.03, 118, 320, 1.2, 0.5);
      const b1 = vWave(0.47, 0.035, 240, 560, 1, 0.9), b2 = vWave(0.76, -0.035, 240, 560, 1.1, 0.3);
      return {
        db: { uIn: () => 118, uOut: F, vLo: () => 0, vHi: a1, rad: [10, 30, 36, 12] },
        app: { uIn: () => 118, uOut: s1, vLo: a1, vHi: a2, rad: [12, 14, 34, 20] },
        ai: { uIn: () => 118, uOut: s1, vLo: a2, vHi: () => 1, rad: [16, 12, 26, 36] },
        data: { uIn: s1, uOut: F, vLo: a1, vHi: b1, rad: [24, 36, 16, 14] },
        web: { uIn: s1, uOut: F, vLo: b1, vHi: b2, rad: [14, 22, 44, 18] },
        hubs: { uIn: s1, uOut: F, vLo: b2, vHi: () => 1, rad: [30, 14, 22, 40] },
      };
    },
    sparks: [[0.18, 26, 9], [0.84, 30, 7]],
  });
  preview('d6-services', 1280, 800, DC, 150, [{ pour: g.pour, k1: SV.k1, tiles: fills(g.tiles, k => (k === 'web' ? SV.k4 : ['hubs', 'data'].includes(k) ? SV.k3 : SV.k2)), boxes: Object.values(g.tiles).map(t => t.box), sparks: OUT.sv.sparks }]);
}
{ // blog — the upper-left slice grown out and cut like a pie: three slices of their own
  const g = fan('bl', {
    C: DC, u0: 118, ok: dOK, aspects: [0.9, 1.2, 1.6, 2.1],
    thL: interp([[118, 94], [640, 99]]), thR: interp([[118, 206], [640, 212]]), F: ell(540, 350),
    cells: F => {
      const c1 = vWave(0.34, 0.04, 118, 470, 1, 0.3), c2 = vWave(0.70, -0.035, 118, 470, 1.2, 0.8);
      return {
        w1: { uIn: () => 118, uOut: F, vLo: () => 0, vHi: c1, rad: [8, 34, 18, 10] },
        k1: { uIn: () => 118, uOut: F, vLo: c1, vHi: c2, rad: [10, 12, 44, 24] },
        all: { uIn: () => 118, uOut: F, vLo: c2, vHi: () => 1, rad: [12, 10, 26, 40] },
      };
    },
    sparks: [[0.12, 24, 7], [0.56, 30, 9]],
  });
  preview('d6-blog', 1280, 800, DC, 150, [{ pour: g.pour, k1: BL.k1, tiles: fills(g.tiles, k => (k === 'k1' ? BL.k4 : k === 'w1' ? BL.k3 : BL.k2)), boxes: Object.values(g.tiles).map(t => t.box), sparks: OUT.bl.sparks }]);
}
{ // about — the logo breathes out a halo all the way round: four sectors
  const F = ell(430, 350), map = (u, v) => at(DC, u, v);
  const seam = (b, k) => u => b + 3 * Math.sin(Math.PI * (u - 118) / 300 + k);
  const sA = seam(62, 0.3), sB = seam(120, 1.4), sC = seam(228, 2.2), sD = seam(312, 0.9);
  const cells = {
    how: { uIn: () => 118, uOut: F, vLo: sA, vHi: sB, rad: [8, 30, 26, 10] },
    intro: { uIn: () => 118, uOut: F, vLo: sB, vHi: sC, rad: [10, 16, 40, 14] },
    say: { uIn: () => 118, uOut: F, vLo: sC, vHi: sD, rad: [12, 10, 30, 22] },
    photo: { uIn: () => 118, uOut: F, vLo: sD, vHi: u => sA(u) + 360, rad: [10, 12, 36, 28] },
  };
  const tiles = {};
  for (const [id, c] of Object.entries(cells)) { const t = tile(map, c, { inset: 8 }); tiles[id] = { d: t.d, box: box(labelRect(t.poly, dOK, id === 'intro' ? [1.0, 1.2, 1.4] : [1.2, 1.6, 2.2, 3])) }; }
  const pts = []; for (let i = 0; i < 180; i++) pts.push(at(DC, F(i * 2) + 3, i * 2));
  const o = outline(pts, 72);
  const sp = [[40, 22, 8], [200, 26, 7], [338, 24, 9]].map(([a, du, s]) => { const p = at(DC, F(a) + 8 + du, a); return star(p[0], p[1], s); }).join('');
  OUT.ab = { pour: o.d, origin: DC, tiles, sparks: sp };
  preview('d6-about', 1280, 800, DC, 150, [{ pour: o.d, k1: AB.k1, tiles: fills(tiles, k => (k === 'photo' ? AB.k4 : k === 'how' ? AB.k3 : AB.k2)), boxes: Object.values(tiles).map(t => t.box), sparks: sp }]);
}
{ // portfolio — a dial: eleven cells around the compass, the bottom slice grown out is the window onto it
  const W = [34, 31, 35, 30, 34, 33, 31, 35, 32, 30, 35];
  const A = [0]; W.forEach(w => A.push(A[A.length - 1] + w));
  const ids = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10', 'end'];
  const seam = k => u => A[k] + 2.6 * Math.sin(Math.PI * (u - 160) / 190 + 1.3 * k);
  const map = (u, v) => at(DC, u, v);
  const rads = [[10, 14, 30, 24], [12, 10, 22, 34], [14, 12, 36, 20], [10, 12, 24, 30], [12, 14, 32, 18], [10, 10, 28, 36], [14, 12, 20, 30], [12, 10, 34, 22], [10, 14, 26, 32], [12, 12, 30, 20], [14, 10, 24, 34]];
  const cells = ids.map((id, k) => {
    const lo = k === 0 ? u => seam(0)(u) : seam(k), hi = k === 10 ? u => seam(0)(u) + 360 : seam(k + 1);
    const out = 344 + 6 * Math.sin(k * 1.7);
    const c = { uIn: () => 160, uOut: () => out, vLo: lo, vHi: hi, rad: rads[k] };
    const t = tile(map, c, { inset: 7 });
    // label box: measured with the cell turned to the bottom of the dial, then turned back
    const mid = (A[k] + A[k + 1]) / 2, turn = 270 - mid;
    const tc = { ...c, vLo: u => lo(u) + turn, vHi: u => hi(u) + turn };
    const tt = tile(map, tc, { inset: 7 });
    const b = labelRect(tt.poly, () => true, [1.2, 1.5]);
    const rr = dist([b.cx, b.cy], DC), aa = 270 - turn + (Math.atan2(-(b.cy - DC[1]), b.cx - DC[0]) * 180 / Math.PI - 270);
    const p = at(DC, rr, aa);
    return { id, d: t.d, mid, box: { cx: ri(p[0]), cy: ri(p[1]), w: ri(b.w * 0.86), h: ri(b.h * 0.86) } };
  });
  // the window: the bottom slice's edges carried straight out, a smooth front just above the fold
  const thL = interp([[118, 203], [358, 194]]), thR = interp([[118, 337], [358, 346]]);
  const env = (fr, dA) => {
    const m = fanMap(DC, u => thL(u) - dA, u => thR(u) + dA), pts = [], corners = [];
    corners.push(0); for (let i = 0; i < 30; i++) pts.push(m(118 + (fr - 118) * i / 30, 0));
    corners.push(pts.length); for (let i = 0; i < 80; i++) pts.push(m(fr, i / 80));
    corners.push(pts.length); for (let i = 0; i < 30; i++) pts.push(m(fr + (118 - fr) * i / 30, 1));
    corners.push(pts.length); for (let i = 0; i < 12; i++) pts.push(m(118, 1 - i / 12));
    return outline(pts, 64, corners, [6, 40, 40, 6]).d;
  };
  const pour = env(358, 0), clip = env(351, -1.6);
  const sp = [[197, 382, 8], [343, 384, 7]].map(([a, r, s]) => { const p = at(DC, r, a); return star(p[0], p[1], s); }).join('');
  OUT.pf = { pour, clip, A, cells: cells.map(({ id, d, box, mid }) => ({ id, d, box, mid: Math.round(mid * 10) / 10 })), sparks: sp };
  for (const n of [0, 3]) {
    const rho = 270 - (A[n] + A[n + 4]) / 2;
    const rot = `<clipPath id="cw"><path d="${clip}"/></clipPath>`;
    const tl = `<g clip-path="url(#cw)"><g transform="rotate(${-rho} ${DC[0]} ${DC[1]})">` + cells.map((c, k) => `<path d="${c.d}" fill="${[PF.k3, PF.k2, PF.k4, PF.k2][k % 4]}" stroke="#282728" stroke-width="2"/>`).join('') + '</g></g>';
    const bx = cells.map(c => { const r = dist([c.box.cx, c.box.cy], DC), a = Math.atan2(-(c.box.cy - DC[1]), c.box.cx - DC[0]) * 180 / Math.PI + rho, p = at(DC, r, a); return `<rect x="${p[0] - c.box.w / 2}" y="${p[1] - c.box.h / 2}" width="${c.box.w}" height="${c.box.h}" fill="none" stroke="#c33" stroke-dasharray="4 3"/>`; }).join('');
    preview('d6-portfolio-' + n, 1280, 800, DC, 150, [{ pour, k1: PF.k1, pre: rot + tl + bx, sparks: sp }]);
  }
}

// ================= PHONE 390×844 — the compass docks (scale .72, R≈94) =================
const PR = 94;
const pOK = C => p => p[0] > 12 && p[0] < 378 && p[1] > 76 && p[1] < 832 && dist(p, C) > PR + 12;
// distance from C to a margin box along a direction, so fronts follow the screen with paper left around
const boxF = (C, x0, x1, y0, y1) => th => { const dx = Math.cos(R(th)), dy = -Math.sin(R(th)); let t = 1e4; if (dx > 1e-6) t = Math.min(t, (x1 - C[0]) / dx); if (dx < -1e-6) t = Math.min(t, (x0 - C[0]) / dx); if (dy > 1e-6) t = Math.min(t, (y1 - C[1]) / dy); if (dy < -1e-6) t = Math.min(t, (y0 - C[1]) / dy); return t; };
// phone sections fill the screen as tidy rows (like the sketch); the bottom row is bitten by the docked compass,
// and the spill's outline dips under the compass across the open slice, so it visibly comes out of it
function column(name, { C, dipA, dipB, rows, pick }) {
  const X0 = 18, X1 = 372, Y0 = 86, YB = 812, RR = PR + 12;
  const map = (u, v) => [X0 + (X1 - X0) * v, u];
  const rim = x => { const dx = x - C[0]; return Math.abs(dx) < RR ? Math.min(YB, C[1] - Math.sqrt(RR * RR - dx * dx)) : YB; };
  const yb = v => { const x = X0 + (X1 - X0) * v; let m = rim(x); for (let k = -1; k <= 1; k += 2) m = Math.min(m, rim(x + k * 10)); return m; };
  const ok = pOK(C), tiles = {};
  const wave = (y, A, k, ph) => v => y + A * Math.sin(Math.PI * k * v + ph);
  rows.forEach((r, n) => {
    const top = r.top === Y0 ? () => Y0 : wave(r.top, 10, 1.1 + 0.2 * (n % 2), n), btm = r.btm === 'yb' ? yb : wave(r.btm, 10, 1.1 + 0.2 * ((n + 1) % 2), n + 1);
    const splits = (r.splits || []).map((sv, k) => u => sv + 0.05 * Math.sin(Math.PI * (u - r.top) / 200 + n + k));
    r.cells.forEach((id, k) => {
      const t = tile(map, { uIn: btm, uOut: top, vLo: k ? splits[k - 1] : () => 0, vHi: k < r.cells.length - 1 ? splits[k] : () => 1, rad: r.rad[k] }, { inset: 6 });
      tiles[id] = { d: t.d, box: box(labelRect(t.poly, ok, r.aspects || [0.9, 1.2, 1.6, 2.2, 2.8])) };
    });
  });
  // outline: the screen-sized sheet, dipping under the compass between the slice's edges
  const pts = [], corners = [];
  const seg = (a, b, n) => { for (let i = 0; i < n; i++) pts.push(lerp(a, b, i / n)); };
  const inA = at(C, 46, dipA), inB = at(C, 46, dipB), rimA = at(C, RR - 4, dipA), rimB = at(C, RR - 4, dipB);
  const clampP = p => [Math.max(X0, Math.min(X1, p[0])), Math.min(YB, p[1])];
  corners.push(pts.length); seg([X0, Y0], [X1, Y0], 30);
  corners.push(pts.length); seg([X1, Y0], [X1, yb(1)], 40);
  const bottom = []; for (let i = 0; i <= 60; i++) bottom.push([X0 + (X1 - X0) * (1 - i / 60), yb(1 - i / 60)]);
  for (const q of bottom) pts.push(q);
  corners.push(pts.length); seg([X0, yb(0)], [X0, Y0], 40);
  const o = outline(pts, 80, corners, [30, 30, 30]);
  OUT[name] = { pour: o.d, origin: [ri(C[0]), ri(C[1])], tiles, sparks: '' };
  preview('p6-' + name.slice(1), 390, 844, C, PR, [{ pour: o.d, k1: pick.k1, tiles: fills(tiles, pick.f), boxes: Object.values(tiles).map(t => t.box) }]);
}
column('psv', {
  C: [58, 786], dipA: 92, dipB: -30,
  rows: [
    { top: 86, btm: 240, cells: ['web'], rad: [[16, 22, 30, 12]], aspects: [1.6, 2.2, 2.8, 3.4] },
    { top: 240, btm: 400, cells: ['hubs'], rad: [[24, 12, 14, 34]], aspects: [1.6, 2.2, 2.8, 3.4] },
    { top: 400, btm: 570, cells: ['app', 'ai'], splits: [0.54], rad: [[12, 30, 18, 14], [30, 12, 14, 24]] },
    { top: 570, btm: 'yb', cells: ['db', 'data'], splits: [0.4], rad: [[14, 12, 30, 20], [12, 24, 36, 30]] },
  ],
  pick: { k1: SV.k1, f: k => (k === 'web' ? SV.k4 : ['hubs', 'data'].includes(k) ? SV.k3 : SV.k2) },
});
column('pbl', {
  C: [332, 786], dipA: 88, dipB: 212,
  rows: [
    { top: 86, btm: 330, cells: ['k1'], rad: [[18, 30, 24, 14]], aspects: [1.2, 1.6, 2.0] },
    { top: 330, btm: 560, cells: ['w1'], rad: [[26, 14, 34, 18]], aspects: [1.4, 1.8, 2.4] },
    { top: 560, btm: 'yb', cells: ['all'], rad: [[14, 30, 40, 24]], aspects: [1.2, 1.6, 2.0] },
  ],
  pick: { k1: BL.k1, f: k => (k === 'k1' ? BL.k4 : k === 'w1' ? BL.k3 : BL.k2) },
});
column('pab', {
  C: [195, 800], dipA: 172, dipB: 8,
  rows: [
    { top: 86, btm: 380, cells: ['intro'], rad: [[18, 34, 24, 16]], aspects: [1.1, 1.4, 1.8] },
    { top: 380, btm: 600, cells: ['photo', 'how'], splits: [0.44], rad: [[14, 28, 20, 12], [24, 12, 14, 30]], aspects: [0.8, 1.1, 1.5] },
    { top: 600, btm: 'yb', cells: ['say'], rad: [[16, 14, 30, 30]], aspects: [2.2, 3, 4] },
  ],
  pick: { k1: AB.k1, f: k => (k === 'photo' ? AB.k4 : k === 'how' ? AB.k3 : AB.k2) },
});
{ // portfolio: docked top-centre; a fixed envelope under the slice, the tiles flow through it
  const C = [195, 38], Yb = 826, y0 = 76, y1 = 300;
  const ease = y => { const t = Math.max(0, Math.min(1, (y - y0) / (y1 - y0))); return (1 - Math.cos(Math.PI * t)) / 2; };
  const Lx = y => 134 + (16 - 134) * ease(y), Rx = y => 256 + (374 - 256) * ease(y);
  const pts = [], corners = [];
  corners.push(0); for (let i = 0; i <= 50; i++) { const y = y0 + (Yb - y0) * i / 50; pts.push([Lx(y), y]); }
  corners.push(pts.length); for (let i = 1; i < 20; i++) pts.push([16 + 358 * i / 20, Yb]);
  corners.push(pts.length); for (let i = 0; i <= 50; i++) { const y = Yb - (Yb - y0) * i / 50; pts.push([Rx(y), y]); }
  corners.push(pts.length); for (let i = 1; i < 10; i++) pts.push(at(C, 40, 330 - 120 * i / 10));
  const o = outline(pts, 90, corners, [40, 34, 34, 40]);
  OUT.ppf = { pour: o.d };
}

fs.writeFileSync('shapes.json', JSON.stringify(OUT));
console.log(Object.keys(OUT).join(' '), (JSON.stringify(OUT).length / 1024).toFixed(1) + 'KB');

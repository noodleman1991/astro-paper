// geometry kit for v5 spills: a spill is a "ruled" flow map between two edge curves,
// cells are a grid in (u = along the flow, v = across) with wiggly shared boundaries.
export const ri = n => Math.round(n);
export const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
export const mul = (a, k) => [a[0] * k, a[1] * k];
export const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
export const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
export const dir = deg => [Math.cos(deg * Math.PI / 180), -Math.sin(deg * Math.PI / 180)];
export const at = (C, r, deg) => add(C, mul(dir(deg), r));
const bz = (P, t) => { const u = 1 - t; return [u * u * u * P[0][0] + 3 * u * u * t * P[1][0] + 3 * u * t * t * P[2][0] + t * t * t * P[3][0], u * u * u * P[0][1] + 3 * u * u * t * P[1][1] + 3 * u * t * t * P[2][1] + t * t * t * P[3][1]]; };
const bzd = (P, t) => { const u = 1 - t; return [3 * u * u * (P[1][0] - P[0][0]) + 6 * u * t * (P[2][0] - P[1][0]) + 3 * t * t * (P[3][0] - P[2][0]), 3 * u * u * (P[1][1] - P[0][1]) + 6 * u * t * (P[2][1] - P[1][1]) + 3 * t * t * (P[3][1] - P[2][1])]; };
export const edgeAt = (P, u) => (u < 0 ? add(P[0], mul(bzd(P, 0), u)) : u > 1 ? add(P[3], mul(bzd(P, 1), u - 1)) : bz(P, u));
export const ruled = (L, R) => (u, v) => lerp(edgeAt(L, u), edgeAt(R, u), v);

// ---- wiggles
export const uWave = (b, A, k = 1, ph = 0) => v => b + A * Math.sin(Math.PI * k * v + ph);
export const uTab = (b, A, c, w) => v => b + A * Math.exp(-(((v - c) / w) ** 2));
export const vWave = (c, A, u0, u1, k = 1, ph = 0) => u => c + A * Math.sin(Math.PI * k * (u - u0) / (u1 - u0) + ph);
export const lobes = (base, spans) => v => { let f = base; for (const [a, b, A] of spans) if (v > a && v < b) f += A * Math.pow(Math.sin(Math.PI * (v - a) / (b - a)), 0.75); return f; };

// ---- polygons
export function area(p) { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; }
export const inPoly = (pt, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if (((yi > pt[1]) !== (yj > pt[1])) && (pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi)) c = !c; } return c; };
function segDist(p, a, b) { const ab = sub(b, a), t = Math.max(0, Math.min(1, ((p[0] - a[0]) * ab[0] + (p[1] - a[1]) * ab[1]) / ((ab[0] ** 2 + ab[1] ** 2) || 1))); return dist(p, add(a, mul(ab, t))); }
const edgeDist = (p, poly) => { let m = Infinity; for (let i = 0; i < poly.length; i++) m = Math.min(m, segDist(p, poly[i], poly[(i + 1) % poly.length])); return m; };

function cellPoly(map, c, n = 16) {
  const corner = (uf, vf) => { let v = 0.5, u = 0; for (let i = 0; i < 12; i++) { u = uf(v); v = vf(u); } return [u, v]; };
  const a = corner(c.uIn, c.vLo), b = corner(c.uIn, c.vHi), cc = corner(c.uOut, c.vHi), d = corner(c.uOut, c.vLo);
  const pts = [], corners = [];
  corners.push(pts.length); for (let i = 0; i < n; i++) { const v = a[1] + (b[1] - a[1]) * i / n; pts.push(map(c.uIn(v), v)); }
  corners.push(pts.length); for (let i = 0; i < n; i++) { const u = b[0] + (cc[0] - b[0]) * i / n; pts.push(map(u, c.vHi(u))); }
  corners.push(pts.length); for (let i = 0; i < n; i++) { const v = cc[1] + (d[1] - cc[1]) * i / n; pts.push(map(c.uOut(v), v)); }
  corners.push(pts.length); for (let i = 0; i < n; i++) { const u = d[0] + (a[0] - d[0]) * i / n; pts.push(map(u, c.vLo(u))); }
  return { pts, corners, uv: { a, b, cc, d } };
}
function dedupe(p) { const out = []; for (const q of p) if (!out.length || dist(out[out.length - 1], q) > 0.5) out.push(q); if (out.length > 2 && dist(out[0], out[out.length - 1]) < 0.5) out.pop(); return out; }
function insetPoly(p, d) {
  const N = p.length, s = area(p) > 0 ? 1 : -1, out = [];
  const nrm = (a, b) => { const e = sub(b, a), l = Math.hypot(e[0], e[1]) || 1; return s > 0 ? [-e[1] / l, e[0] / l] : [e[1] / l, -e[0] / l]; };
  for (let i = 0; i < N; i++) {
    const n0 = nrm(p[(i - 1 + N) % N], p[i]), n1 = nrm(p[i], p[(i + 1) % N]);
    let m = add(n0, n1); const l = Math.hypot(m[0], m[1]) || 1; m = mul(m, 1 / l);
    const cos = Math.max(0.45, m[0] * n1[0] + m[1] * n1[1]);
    out.push(add(p[i], mul(m, d / cos)));
  }
  return out;
}
function cum(p) { const c = [0]; for (let i = 1; i <= p.length; i++) c.push(c[i - 1] + dist(p[i - 1], p[i % p.length])); return c; }
function pointAt(p, c, s) { const T = c[p.length]; s = ((s % T) + T) % T; let i = 0; while (i < p.length - 1 && c[i + 1] < s) i++; const seg = c[i + 1] - c[i] || 1; return lerp(p[i], p[(i + 1) % p.length], (s - c[i]) / seg); }
export function resample(p, N, start = 0) { const c = cum(p), T = c[p.length], out = []; for (let i = 0; i < N; i++) out.push(pointAt(p, c, start + T * i / N)); return out; }
function roundCorners(p, cornerIdx, radii) {
  const c = cum(p), T = c[p.length], out = [], K = cornerIdx.length;
  const sc = cornerIdx.map(i => c[i]);
  const side = k => { const s0 = sc[k], s1 = k === K - 1 ? T + sc[0] : sc[k + 1]; return s1 - s0; };
  const rad = cornerIdx.map((_, k) => Math.min(radii[k % radii.length], 0.42 * side(k), 0.42 * side((k - 1 + K) % K)));
  for (let k = 0; k < K; k++) {
    const r = rad[k], P0 = pointAt(p, c, sc[k] - r), P1 = p[cornerIdx[k]], P2 = pointAt(p, c, sc[k] + r);
    for (let i = 0; i <= 8; i++) { const t = i / 8, u = 1 - t; out.push([u * u * P0[0] + 2 * u * t * P1[0] + t * t * P2[0], u * u * P0[1] + 2 * u * t * P1[1] + t * t * P2[1]]); }
    const sA = sc[k] + r, sB = (k === K - 1 ? T + sc[0] : sc[k + 1]) - rad[(k + 1) % K];
    for (let i = 0; i < p.length; i++) { let s = c[i]; if (s < sA - 0.01) s += T; if (s > sA + 0.5 && s < sB - 0.5) out.push(p[i]); }
  }
  return out;
}
// sort points of a side run in order (the filter above can wrap) — keep simple: rebuild by angle along arclength
export function smoothPath(p) {
  const N = p.length; let d = `M${ri(p[0][0])} ${ri(p[0][1])}`;
  for (let i = 0; i < N; i++) {
    const p0 = p[(i - 1 + N) % N], p1 = p[i], p2 = p[(i + 1) % N], p3 = p[(i + 2) % N];
    const c1 = add(p1, mul(sub(p2, p0), 1 / 6)), c2 = sub(p2, mul(sub(p3, p1), 1 / 6));
    d += `C${ri(c1[0])} ${ri(c1[1])} ${ri(c2[0])} ${ri(c2[1])} ${ri(p2[0])} ${ri(p2[1])}`;
  }
  return d + 'Z';
}
// build one finished tile: inset (channel), rounded corners, fixed point count
export function tile(map, c, { inset = 8, N = 18 } = {}) {
  const { pts, corners } = cellPoly(map, c);
  const raw = dedupe(pts);
  const a = Math.abs(area(pts));
  if (a < 400) { const pp = resample(pts.length > 2 ? pts : [pts[0], add(pts[0], [0.5, 0]), add(pts[0], [0, 0.5])], N); return { d: smoothPath(pp), poly: pp, collapsed: true }; }
  const ins = insetPoly(pts, inset);
  const rounded = roundCorners(ins, corners, c.rad || [22]);
  const pp = resample(rounded, N);
  return { d: smoothPath(pp), poly: resample(rounded, 64), collapsed: false };
}
export function outline(pts, N = 56, corners = null, radii = [28]) {
  const p = corners ? roundCorners(pts, corners, radii) : pts;
  const pp = resample(p, N);
  return { d: smoothPath(pp), poly: resample(p, 160) };
}
// label rect: biggest rect of given aspects around the pole of the (visible) tile
export function labelRect(poly, ok = () => true, aspects = [1.3, 1.7, 2.2, 2.8], step = 6) {
  const xs = poly.map(p => p[0]), ys = poly.map(p => p[1]);
  let best = null;
  for (let y = Math.min(...ys); y <= Math.max(...ys); y += step) for (let x = Math.min(...xs); x <= Math.max(...xs); x += step) {
    const p = [x, y]; if (!inPoly(p, poly) || !ok(p)) continue;
    const dd = edgeDist(p, poly); if (!best || dd > best.dd) best = { p, dd };
  }
  if (!best) return null;
  const fits = (cx, cy, w, h) => { for (let i = 0; i <= 4; i++) for (const [fx, fy] of [[i / 4, 0], [i / 4, 1], [0, i / 4], [1, i / 4]]) { const q = [cx - w / 2 + w * fx, cy - h / 2 + h * fy]; if (!inPoly(q, poly) || !ok(q)) return false; } return true; };
  let top = null;
  for (const asp of aspects) for (const [ox, oy] of [[0, 0], [-12, 0], [12, 0], [0, -10], [0, 10]]) {
    const cx = best.p[0] + ox, cy = best.p[1] + oy; let h = 8;
    while (h < 600 && fits(cx, cy, h * asp, h)) h += 2;
    h -= 2; const w = h * asp;
    if (!top || w * h > top.w * top.h) top = { cx, cy, w, h };
  }
  return { cx: ri(top.cx), cy: ri(top.cy), w: ri(top.w), h: ri(top.h) };
}
// polar ruled map: cross-lines are arcs around the compass centre, so the first tiles hug the slice
export const polarRuled = (C, L, R) => (u, v) => {
  const a = sub(edgeAt(L, u), C), b = sub(edgeAt(R, u), C);
  const ra = Math.hypot(a[0], a[1]), rb = Math.hypot(b[0], b[1]);
  const ta = Math.atan2(a[1], a[0]); let tb = Math.atan2(b[1], b[0]);
  while (tb - ta > Math.PI) tb -= 2 * Math.PI; while (tb - ta < -Math.PI) tb += 2 * Math.PI;
  const r = ra + (rb - ra) * v, t = ta + (tb - ta) * v;
  return [C[0] + r * Math.cos(t), C[1] + r * Math.sin(t)];
};
// polar near the slice, straight further out
export const blendRuled = (C, L, R, u0 = 0.3, u1 = 0.8) => { const P = polarRuled(C, L, R), S = ruled(L, R); return (u, v) => { const t = Math.max(0, Math.min(1, (u - u0) / (u1 - u0))), w = t * t * (3 - 2 * t); return lerp(P(u, v), S(u, v), w); }; };
// pure fan: u is the radius from the compass centre, v sweeps between two edge angles that bend with radius
export const interp = pts => r => { if (r <= pts[0][0]) return pts[0][1]; for (let i = 0; i < pts.length - 1; i++) { const [r0, a0] = pts[i], [r1, a1] = pts[i + 1]; if (r <= r1) { const t = (r - r0) / (r1 - r0), w = (1 - Math.cos(Math.PI * t)) / 2; return a0 + (a1 - a0) * w; } } return pts[pts.length - 1][1]; };
export const fanMap = (C, thL, thR) => (u, v) => at(C, u, thL(u) + (thR(u) - thL(u)) * v);
// smooth curve through points, u in [0,1] (Catmull-Rom), clamped-extrapolated outside
export const through = P => u => {
  const n = P.length - 1, x = Math.max(0, Math.min(1, u)) * n, i = Math.min(n - 1, Math.floor(x)), t = x - i;
  const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(n, i + 2)];
  const f = k => 0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t * t + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t * t * t);
  const q = [f(0), f(1)];
  if (u > 1) { const d = sub(P[n], P[n - 1]); return add(P[n], mul(d, (u - 1) * n)); }
  return q;
};

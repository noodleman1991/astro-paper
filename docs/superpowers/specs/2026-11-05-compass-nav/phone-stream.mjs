// phone portfolio stream, as used in the prototype's logic class (reference for the port to TypeScript)
export class PhoneStream {
  PF_ROWS = [[50, 'p1', 'p2', 0.44], [282, 'p3', 'p4', 0.6], [510, 'p5', 'p6', 0.4], [740, 'p7', 'p8', 0.56], [968, 'p9', 'p10', 0.46], [1196, 'end', null, 0], [1376]];
  PF_RAD = [[10, 12, 30, 16], [24, 12, 14, 32], [12, 30, 18, 14], [30, 14, 12, 24], [14, 22, 34, 12], [36, 40, 40, 30]];
  PF_MAX = 636;
  // the envelope stays still; each tile is laid out in flow space and mapped into it, so a tile narrows and
  // flattens as it rises into the neck under the slice, and opens to full width further down
  pfGeo(off) {
    const Yt = 76, E0 = 90, G = 6, M = 6;
    const ease = y => { const t = Math.max(0, Math.min(1, (y - 76) / 224)); return (1 - Math.cos(Math.PI * t)) / 2; };
    const L = y => 138 - 118 * ease(y), R = y => 252 + 118 * ease(y);
    const Y = f => { const e = f - off; return e >= E0 ? Yt + e : Yt + E0 * Math.exp((e - E0) / E0); };
    const F = y => { const e = y - Yt; return (e >= E0 ? e : E0 + E0 * Math.log(Math.max(e, 0.01) / E0)) + off; };
    const X = (y, v) => L(y) + (R(y) - L(y)) * v;
    const rows = this.PF_ROWS, out = {};
    const seam = k => v => rows[k][0] + (k === 0 ? 0 : 12 * Math.sin(Math.PI * (1.1 + 0.2 * (k % 2)) * v + k));
    const q = n => Math.round(n * 10) / 10;
    const mk = (id, sT, sB, vLf, vRf, rad) => {
      const vlT = vLf(sT(0.5)), vrT = vRf(sT(0.5)), vlB = vLf(sB(0.5)), vrB = vRf(sB(0.5));
      const top = t => { const v = vlT + (vrT - vlT) * t, y = Y(sT(v)) + G; return [X(y, vlT) + G + (X(y, vrT) - X(y, vlT) - 2 * G) * t, y]; };
      const btm = t => { const v = vrB + (vlB - vrB) * t, y = Y(sB(v)) - G; return [X(y, vrB) - G + (X(y, vlB) - X(y, vrB) + 2 * G) * t, y]; };
      const yTR = top(1)[1], yBR = btm(0)[1], yBL = btm(1)[1], yTL = top(0)[1];
      const right = t => { const y = yTR + (yBR - yTR) * t; return [X(y, vRf(F(y))) - G, y]; };
      const left = t => { const y = yBL + (yTL - yBL) * t; return [X(y, vLf(F(y))) + G, y]; };
      const h = Math.min(yBL - yTL, yBR - yTR), wT = top(1)[0] - top(0)[0], wB = btm(0)[0] - btm(1)[0];
      const vm = (vlT + vrT) / 2, fT = sT(vm), fB = sB(vm), ym = (Y(fT) + Y(fB)) / 2;
      const vL = vLf(F(ym)), vR = vRf(F(ym));
      const wFull = 350 * (vR - vL) - 2 * G, wNow = X(ym, vR) - X(ym, vL) - 2 * G;
      const sc = Math.max(0.3, Math.min(1, (Y(fB) - Y(fT) - 2 * G) / (fB - fT - 2 * G), wNow / wFull));
      const op = Math.max(0, Math.min(1, (sc - 0.55) / 0.3));
      let d = '';
      if (h >= 12 && yTL < 860) {
        const lim = Math.max(0, Math.min(h, wT, wB) / 2 - 1), r = rad.map(x => Math.min(x, lim));
        const lens = [wT, h, wB, h], edges = [top, right, btm, left];
        const pts = [];
        edges.forEach((e, i) => {
          const a = r[i] / lens[i], b = 1 - r[(i + 1) % 4] / lens[i];
          for (let j = 0; j <= M; j++) pts.push(e(a + (b - a) * j / M));
          pts.push(['Q', e(1)]);
        });
        let first = pts[0];
        d = 'M' + q(first[0]) + ' ' + q(first[1]);
        for (let j = 1; j < pts.length; j++) {
          const p = pts[j];
          if (p[0] === 'Q') { const nx = pts[(j + 1) % pts.length]; d += 'Q' + q(p[1][0]) + ' ' + q(p[1][1]) + ' ' + q(nx[0]) + ' ' + q(nx[1]); j++; if (j >= pts.length) break; }
          else d += 'L' + q(p[0]) + ' ' + q(p[1]);
        }
        d += 'Z';
      }
      const lw = Math.max(96, Math.min(330, wFull - 8));
      out[id] = {
        d, fc: (fT + fB) / 2,
        ls: 'left: ' + q(X(ym, (vL + vR) / 2)) + 'px; top: ' + q(ym) + 'px; width: ' + q(lw) + 'px; transform: translate(-50%, -50%) scale(' + sc.toFixed(3) + '); opacity: ' + op.toFixed(2) + '; pointer-events: ' + (op > 0.6 ? 'auto' : 'none'),
      };
    };
    rows.slice(0, -1).forEach(([top, a, b, sv], k) => {
      const split = f => sv + 0.04 * Math.sin(Math.PI * (f - top) / 220 + k);
      if (!b) mk(a, seam(k), seam(k + 1), () => 0, () => 1, this.PF_RAD[k]);
      else { mk(a, seam(k), seam(k + 1), () => 0, split, this.PF_RAD[k]); mk(b, seam(k), seam(k + 1), split, () => 1, this.PF_RAD[(k + 2) % 5]); }
    });
    return out;
  }
}

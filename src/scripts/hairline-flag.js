/**
 * Flag: a university flag on a tall pole, a ball on top and the halyard down
 * the pole, set in a plinth of three rounded steps. The pointer is the wind,
 * read on the plane at the cloth's height, which never moves: the cloth
 * streams away from it, the nearer the stronger and the flatter, its fly end
 * swinging after the hoist on a softer spring; it stays within 55° of left
 * or right, so it never turns edge-on. Moving the pointer gusts: the
 * ripple's phase runs on a spring, so waves travel down the cloth and settle
 * when the hand holds still. At rest a light breeze holds the cloth out to
 * the right in a soft ripple, its shield bright; a strong wind gives the
 * bright to the cloth's edge. The slider is the wind's reach, in world units.
 *
 * The cloth is sixteen upright strips, each opaque and painted back to front
 * by depth, so a fold covers what is behind it; the shield is cut per strip.
 */
// @ts-nocheck
import HL from './vendor/hairline-kernel.js';

const {
  Cam, clamp, circ, facing, fillet, fit, hull, lerp, open, poly, prism, proj, rad, rings, seg,
  spring, stepS, unproj, disposer, mk, pointer, put, register, solid,
} = HL;

const ZP = 128, ZT = 121, FL = 84, FH = 50, HO = 3.6, NC = 16, ZW = ZT - FH / 2, TAU = 2 * Math.PI;
const REST = { th: rad(-72), s: 0.4, ph: 2.2 }, FLOOR = 0.12, DROOP = rad(48), STRONG = 0.6;
const STEPS = [[30, 0, 7, 6], [21, 7, 13, 5], [12.5, 13, 18, 4]]; // half-width, z0, z1, corner radius
const WA = rad(-45), LEAN = rad(55), CR = 2.2; // screen-right; how far the stream may turn toward or away from you; the cloth's corner radius, on screen

/** The wind's strength u reaches from the pole: 1 at the pole, falling to a floor at one reach and beyond. */
const strength = (u) => FLOOR + (1 - FLOOR) * clamp(1 - u, 0, 1) ** 1.4;
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
/** The stream's angle for wind from (x, y): away from it, held within LEAN of left or right so the cloth never goes edge-on. */
function away(x, y) {
  const q = wrap(Math.atan2(-y, -x) - WA), side = Math.abs(q) <= Math.PI / 2 ? 0 : Math.PI;
  return WA + side + clamp(wrap(q - side), -LEAN, LEAN);
}

/** The cloth's seventeen columns, [x, y, z of the top], for hoist angle a0, fly angle a1, strength s, ripple phase ph. */
function cloth(a0, a1, s, ph) {
  const sag = DROOP * (1 - s), amp = lerp(13, 3.5, s), waves = lerp(1.1, 2, s), du = 1 / NC, out = [];
  let x = HO * Math.cos(a0), y = HO * Math.sin(a0), z = ZT;
  for (let j = 0; j <= NC; j++) {
    const u = j * du, a = lerp(a0, a1, u);
    if (j) { const b = sag * (u - du / 2), h = FL * du * Math.cos(b); x += h * Math.cos(a); y += h * Math.sin(a); z -= FL * du * Math.sin(b); }
    // the ripple: across the stream, nothing at the hoist, growing to the fly
    const n = amp * u ** 0.7 * Math.sin(TAU * waves * u - ph);
    out.push([x - n * Math.sin(a), y + n * Math.cos(a), z]);
  }
  return out;
}

/** The shield and its chevron in cloth units (U along, V down), sampled every unit and cut into runs, one list per strip. */
function emblem() {
  const at = ([a, b]) => [31 + a, 25 + b];
  const shield = fillet([[-9, -14], [9, -14], [9, 2], [0, 15], [-9, 2]], [1.2, 1.2, 7, 1.5, 7], 6).map(at);
  const chevron = fillet([[-6, 5], [0, -3], [6, 5]], [0, 1.2, 0], 3).map(at); // open: the closing edge is never drawn
  const lines = [[...shield, shield[0]], chevron], byStrip = Array.from({ length: NC }, () => []);
  for (const line of lines) {
    const pts = [line[0]];
    for (let i = 1; i < line.length; i++) {
      const p = line[i - 1], q = line[i], n = Math.max(1, Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1])));
      for (let k = 1; k <= n; k++) pts.push([lerp(p[0], q[0], k / n), lerp(p[1], q[1], k / n)]);
    }
    // a run crossing into the next strip ends one sample over, so the two halves meet
    let run = null, k0 = -1;
    pts.forEach((p, i) => {
      const k = clamp(Math.floor((p[0] / FL) * NC), 0, NC - 1);
      if (k === k0) { run.push(p); return; }
      if (run) run.push(p);
      run = i ? [pts[i - 1], p] : [p];
      byStrip[k].push(run);
      k0 = k;
    });
  }
  return byStrip;
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let reach = value, last = null, strong = null;

  // Fitted to the cloth streaming every way at both ends of the wind, so no pose leaves the frame.
  const C = Cam(45, 0.5, 1.6), env = [[-30, -30, 0], [30, 30, 0], [30, -30, 0], [-30, 30, 0], [0, 0, ZP + 12]];
  for (let k = 0; k < 16; k++) for (const s of [FLOOR, 1]) for (const ph of [0, 1.6, 3.1, 4.7]) {
    for (const c of cloth((k * TAU) / 16, (k * TAU) / 16, s, ph)) env.push(c, [c[0], c[1], c[2] - FH]);
  }
  fit(C, env, 176, 166);
  const P = proj(C), front = facing(C);

  const g = mk("g", {}, svg);
  for (const [w, z0, z1, r] of STEPS) { const [ring, inner] = rings(-w, -w, w, w, r, 1.6); put(solid(g), prism(P, front, ring, inner, z0, z1)); }
  // The pole: a collar on the top step, the shaft, the truck, the ball.
  const pole = mk("g", {}, g);
  const round = (r, b, z0, z1) => put(solid(pole), prism(P, front, circ(r, 24), circ(r - b, 24), z0, z1));
  round(4.4, 1, 18, 23); round(2.2, 0.6, 23, ZP); round(3.4, 0.8, ZP, ZP + 2.4);
  const ball = [];
  for (let k = 0; k < 200; k++) { const z = 1 - (2 * k + 1) / 200, r = Math.sqrt(1 - z * z), a = k * 2.39996; ball.push(P(4.4 * r * Math.cos(a), 4.4 * r * Math.sin(a), ZP + 6.8 + 4.4 * z)); }
  put(solid(pole), { sil: poly(hull(ball)), crease: "" });

  // The cloth: the halyard first, then one group per strip, re-ordered by depth as it moves.
  const cg = mk("g", {}, g), hal = mk("path", { class: "nf lo" }, cg);
  const strips = emblem().map((runs, k) => {
    const sg = mk("g", {}, cg);
    return {
      k, runs, g: sg, depth: 0,
      face: mk("path", { class: "fo" }, sg), edge: mk("path", { class: "nf sil" }, sg),
      fold: mk("path", { class: "nf lo" }, sg), mark: mk("path", { class: "nf" }, sg),
    };
  });

  const a0 = spring(REST.th), a1 = spring(REST.th, { k: 45, c: 12 }), st = spring(REST.s), ph = spring(REST.ph); // the fly lags the hoist
  let drawn = "", order = "", ahead = null;

  function draw() {
    const key = [a0.x, a1.x, st.x, ph.x].join();
    if (key === drawn) return;
    drawn = key;
    const cols = cloth(a0.x, a1.x, st.x, ph.x), T = cols.map((c) => P(...c)), B = cols.map((c) => P(c[0], c[1], c[2] - FH));
    const on = ([U, V]) => {
      const f = (U / FL) * NC, k = clamp(Math.floor(f), 0, NC - 1), t = f - k, a = cols[k], b = cols[k + 1];
      return P(lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t) - V);
    };
    for (const sp of strips) {
      const k = sp.k, q = [T[k], T[k + 1], B[k + 1], B[k]], end = k === 0 || k === NC - 1;
      // the cloth's four outer corners are rounded; a strip's inner corners meet its neighbours'
      const f = end ? fillet(q, k ? [0, CR, CR, 0] : [CR, 0, 0, CR], 3) : q;
      sp.face.setAttribute("d", poly(f));
      sp.edge.setAttribute("d", !end ? seg(q[0], q[1]) + seg(q[3], q[2]) : k ? open(f) : open([...f.slice(8), ...f.slice(0, 8)]));
      sp.fold.setAttribute("d", k % 4 === 0 && k ? seg(q[0], q[3]) : "");
      sp.mark.setAttribute("d", sp.runs.map((r) => open(r.map(on))).join(""));
      sp.depth = cols[k][0] + cols[k][1] + cols[k + 1][0] + cols[k + 1][1];
    }
    const h = cols[0];
    hal.setAttribute("d", seg(P(h[0], h[1], ZP + 1.2), T[0]) + seg(B[0], P(h[0], h[1], 23)));
    // Paint order: strips far to near; the whole cloth behind the pole or in front of it.
    const sorted = strips.slice().sort((p, q) => p.depth - q.depth), now = sorted.map((s) => s.k).join();
    if (now !== order) { order = now; sorted.forEach((s, i) => (i ? sorted[i - 1].g : hal).after(s.g)); }
    const near = Math.cos(a0.x) + Math.sin(a0.x) > 0;
    if (near !== ahead) { ahead = near; if (near) pole.after(cg); else pole.before(cg); }
  }

  const all = [a0, a1, st, ph];
  const L = register(stage, (dt) => { let m = false; for (const sp of all) if (stepS(sp, dt)) m = true; draw(); return m; });
  bag.add(L.unregister);

  /** One highlight: the shield at rest and in a light wind, the cloth's edge in a strong one. */
  function light(on) {
    if (on === strong) return;
    strong = on;
    for (const sp of strips) { sp.edge.classList.toggle("hi", on); sp.mark.classList.toggle("hi", !on); }
  }

  // The wind comes from the pointer on the fixed plane at the cloth's height (rule 01).
  function blow(p) {
    const [x, y] = unproj(C, p[0], p[1], ZW), d = Math.hypot(x, y), s = strength(d / reach);
    if (d > 4) { a0.t += wrap(away(x, y) - a0.t); a1.t = a0.t; }
    // a gust: the farther the hand moved, the farther the waves run down the cloth
    ph.t += Math.min(1.2, (last ? Math.hypot(p[0] - last[0], p[1] - last[1]) : 8) * 0.05) * (0.5 + s);
    st.t = s; last = p;
    const r = x - y, f = x + y, side = Math.abs(r) >= Math.abs(f) ? (r < 0 ? "left" : "right") : f > 0 ? "front" : "back";
    read.textContent = `from ${side} · ${s >= STRONG ? "strong" : s >= 0.35 ? "fresh" : "light"}`;
    light(s >= STRONG); L.wake();
  }
  // The wind drops: back to the rest angle and strength, the ripple running on to the rest phase.
  function calm() {
    last = null; a0.t += wrap(REST.th - a0.t); a1.t = a0.t; st.t = REST.s;
    ph.t = REST.ph + TAU * Math.ceil((ph.t + 2 - REST.ph) / TAU);
    read.textContent = "rest"; light(false); L.wake();
  }

  bag.add(pointer(stage, { move: blow, leave: calm }));
  bag.add(() => svg.replaceChildren());
  read.textContent = "rest"; light(false); draw();

  return {
    set: (v) => { reach = v; if (last) blow(last); },
    destroy: bag.dispose,
  };
}

export const flag = {
  name: "flag",
  means: "A university flag on its pole; the pointer is the wind, and the cloth streams and ripples away from it.",
  rules: [1, 3, 5, 6],
  range: [60, 100, 150],
  tour: [[140, 135], [262, 118], [205, 245], null],
  mount,
};

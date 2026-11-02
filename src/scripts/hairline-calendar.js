/**
 * Calendar: a desk flip calendar, a tent-shaped stand with a ring binding
 * along its ridge carrying twelve month pages, August to July. Each page is a
 * grid of day tiles, its first and last weeks ragged where the month starts
 * and ends, and its event days stand raised off the page. The pointer's x
 * scrubs through the year: the pages swing up over the rings and down the
 * back on a spring, curling as they go, and the month left in front lights its
 * event days. At rest August is caught just past upright over the rings and
 * September's events are lit. The slider is how many pages are in the air at
 * once.
 *
 * Pages, ring arcs and the stand all turn about the ring axis, so they are
 * painted by how far their angle round it is from edge-on, the farthest first.
 */
// @ts-nocheck
import HL from './vendor/hairline-kernel.js';

const {
  Cam, clamp, facing, fillet, fit, hull, open, poly, proj, rad, rrect, run, spring, stepS,
  disposer, mk, pointer, put, reflect, register, solid,
} = HL;

const N = 12, XA = -49.5, XB = 49.5, X0 = XA - 5, X1 = XB + 5; // the pages' and the stand's ends along the ridge
const L = 74, S0 = 2, H = 70.6, D = 37.6, RR = 5.5, RISE = 2; // page length from the ring axis, the stand, the rings, an event day's lift
const AF = Math.atan2(-H, D), AB = Math.atan2(-H, -D) + 2 * Math.PI; // the stand's front and back faces, as angles round the axis
const PHI = Math.atan2(0.5, 0.612); // the angle round the axis at which a page is seen edge-on, at Cam(45, 0.5)
const FAN = rad(0.35), CURL = 0.3, K_REST = 0.53, W_REST = 1; // at rest August stands just past upright, September in front
const TURNED = 0.38; // how far through its window a page turns edge-on, and its face leaves you
const MONTH = ["August", "September", "October", "November", "December", "January", "February", "March", "April", "May", "June", "July"];
// Event days by date, illustrative: each month its own pattern.
const EVENTS = [[22, 27], [3, 10, 19, 29], [1, 8, 15, 21, 28], [5, 12, 19], [3], [21, 28], [3, 11, 18, 24], [4, 11, 25], [1, 8, 15, 22], [6], [], [15]];

const dist = (a) => Math.abs(Math.atan2(Math.sin(a - PHI), Math.cos(a - PHI))); // 0 edge-on toward you, π edge-on away
/** Day cell c of a 7 × 5 grid, in the page's own (s down from the axis, u along it), inset by b. */
const cell = (c, b = 0) => {
  const s = 18 + Math.floor(c / 7) * 11, u = XA + 5 + (c % 7) * 13;
  return rrect(s + b, u + b, s + 9 - b, u + 11 - b, 2.2 - b, 3);
};
const HEAD = rrect(8, XA + 5, 15, XB - 5, 2.5, 3); // the band where a month's name would be printed
/** A closed outline with no edge longer than 8, so a curling page can bend it. */
const dense = (pts) => pts.flatMap((p, i) => {
  const q = pts[(i + 1) % pts.length], n = Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / 8);
  return Array.from({ length: n }, (_, j) => [p[0] + ((q[0] - p[0]) * j) / n, p[1] + ((q[1] - p[1]) * j) / n]);
});
const OUT = dense(fillet([[S0, XA], [S0, XB], [L, XB], [L, XA]], [1, 1, 3, 3], 3));
/** The stand's end, a rounded triangle in (y, z), inset by b, as ring samples with outward normals. */
const RI = (D * H) / (D + Math.hypot(D, H)), END = (b) => {
  const k = 1 - b / RI, pts = fillet([[D, 0], [0, H], [-D, 0]].map(([y, z]) => [y * k, RI + (z - RI) * k]), [3 - b, 3 - b, 3 - b], 4);
  return pts.map((p, i) => {
    const a = pts[(i + pts.length - 1) % pts.length], c = pts[(i + 1) % pts.length];
    return { u: p[0], v: p[1], nu: c[1] - a[1], nv: a[0] - c[0] };
  });
};

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  const C = Cam(45, 0.5, 1.3);
  // Fitted to every pose: the stand, and a page swung anywhere round the axis.
  const box = [[X0, -D, 0], [X1, D, 0], [X0, D, 0], [X1, -D, 0]];
  for (let j = 0; j < 24; j++) for (const x of [XA, XB]) box.push([x, L * Math.cos((j * Math.PI) / 12), H + L * Math.sin((j * Math.PI) / 12)]);
  fit(C, box, 200, 166);
  const P = proj(C);
  let wv = value, pick = 1, lastX = null;
  const k = spring(K_REST), w = spring(W_REST);

  const g = mk("g", {}, svg);
  reflect(svg, g, P, facing(C), rrect(X0, -D, X1, D, 3, 4), 0, 14);
  const lg = mk("g", {}, g), items = [];

  // The stand: a tent of two rounded ends; its near end's front edge is the crease.
  const st = solid(lg), foot = END(0).map((q) => [q.u, q.v]);
  put(st, {
    sil: poly(hull(foot.map(([y, z]) => P(X0, y, z)).concat(foot.map(([y, z]) => P(X1, y, z))))),
    crease: open(run(END(1.4), (q) => 0.612 * q.nu + 0.5 * q.nv > 0).map((q) => P(X1, q.u, q.v))),
  });
  items.push({ g: st.g, key: (dist(AF) + dist(AB)) / 2 });

  // The rings, cut into arcs by angle so each arc takes its own place among the pages. Inside the stand they are not drawn.
  const NS = 16, SW = (AB - AF) / NS;
  for (let j = 0; j < NS; j++) {
    let d = "";
    for (let r = 0; r < 9; r++) {
      const x = XA + 5.5 + r * 11, arc = [];
      for (let m = 0; m <= 4; m++) { const th = AF + (j + m / 4) * SW; arc.push(P(x, RR * Math.cos(th), H + RR * Math.sin(th))); }
      d += open(arc);
    }
    items.push({ g: mk("path", { class: "nf", d }, lg), key: dist(AF + (j + 0.5) * SW) });
  }

  // The pages: page i lies at F on the front stack, fanned by FAN so the stack shows its edge, and at B, tucked inside the stand's back, once over.
  const pages = MONTH.map((_, i) => {
    const first = new Date(2026, 7 + i, 1).getDay(), days = new Date(2026, 8 + i, 0).getDate();
    const on = new Set(EVENTS[i].map((d) => (first + d - 1) % 35)), cells = [], evs = [];
    for (let c = 0; c < 35; c++) if ((c - first + 35) % 35 < days) (on.has(c) ? evs : cells).push(c);
    const grp = mk("g", {}, lg);
    const pg = {
      F: AF + (N - i) * FAN, B: AB + rad(3), t: NaN, key: 0, cls: "", ecls: "x", g: grp,
      cells: cells.map((c) => cell(c)), evs: evs.map((c) => [cell(c), cell(c, 0.9)]),
      edge: mk("path", { class: "lo" }, grp), grid: mk("path", { class: "nf lo" }, grp),
      ev: mk("path", {}, grp), top: mk("path", { class: "nf lo" }, grp),
    };
    items.push(pg);
    return pg;
  });

  /** Page pg turned t of the way over: it curls away from edge-on, never through it, so one side of it shows at a time. */
  function shape(pg, t) {
    const a0 = pg.F + t * (pg.B - pg.F), bend = CURL * Math.sin(Math.PI * t) * Math.sin(a0 - PHI);
    const at = (s, u, h = 0) => {
      const a = a0 + (bend * s) / L, c = Math.cos(a), n = Math.sin(a);
      return P(u, s * c - h * n, H + s * n + h * c);
    };
    pg.edge.setAttribute("d", poly(OUT.map(([s, u]) => at(s, u))));
    pg.key = dist(a0 + bend / 2);
    const face = Math.sin(a0 - PHI) < 0, ring = (r, h) => r.map((q) => at(q.u, q.v, h));
    // a raised day: its side walls that face you, read on the page as it is turned
    const near = (q) => 0.612 * q.nv + (0.612 * Math.cos(a0) + 0.5 * Math.sin(a0)) * q.nu > 0;
    pg.grid.setAttribute("d", face ? [HEAD, ...pg.cells].map((r) => poly(ring(r))).join("") : "");
    pg.ev.setAttribute("d", face ? pg.evs.map(([r]) => poly(hull(ring(r).concat(ring(r, RISE))))).join("") : "");
    pg.top.setAttribute("d", face ? pg.evs.map(([, ri]) => open(ring(run(ri, near), RISE))).join("") : "");
  }

  function draw() {
    const ts = pages.map((_, i) => { const l = i === N - 1 ? 0 : clamp((k.x - i - 0.5) / w.x + 0.5, 0, 1); return l * l * (3 - 2 * l); });
    const front = ts.findIndex((t) => t <= 0.02);
    let moved = false;
    pages.forEach((pg, i) => {
      // In the air or on top: the silhouette. A settled stack shows only its last page's edge, a second line for its thickness.
      const t = ts[i], cls = (t > 0.02 && t < 0.98) || i === front ? "sil" : (t > 0 && t < 1) || i === N - 1 ? "lo" : "fo";
      const ecls = i === pick ? "hi" : "";
      if (cls !== pg.cls) { pg.edge.setAttribute("class", cls); pg.cls = cls; }
      if (ecls !== pg.ecls) { pg.ev.setAttribute("class", ecls); pg.ecls = ecls; }
      if (Math.abs(t - pg.t) < 1e-4) return;
      pg.t = t; moved = true;
      shape(pg, t);
    });
    if (moved) items.sort((a, b) => b.key - a.key).forEach((it) => lg.append(it.g));
  }

  const B2 = register(stage, (dt) => { const a = stepS(k, dt), b = stepS(w, dt); draw(); return a || b; });
  bag.add(B2.unregister);

  // The pointer's x, read across the stand at rest, is how far through the year you are. The target picks the month (rule 01):
  // the first page that will still show you its face.
  const xL = P(X0, D, 0)[0], xR = P(X1, -D, 0)[0];
  function aim(x) {
    lastX = x;
    if (x == null) { k.t = K_REST; w.t = W_REST; }
    else { const f = clamp((x - xL) / (xR - xL), 0, 1); w.t = wv; k.t = 0.5 - wv / 2 + f * (N - 2 + wv); }
    pick = clamp(Math.floor(k.t + 0.5 + (0.5 - TURNED) * w.t), 0, N - 1);
    const n = EVENTS[pick].length;
    read.textContent = x == null ? "rest" : `${MONTH[pick]} · ${n} event${n === 1 ? "" : "s"}`;
    B2.wake();
  }
  bag.add(pointer(stage, { move: (p) => aim(p[0]), leave: () => aim(null) }));
  bag.add(() => svg.replaceChildren());
  aim(null);
  draw();

  return {
    set: (v) => { wv = v; if (lastX != null) aim(lastX); },
    destroy: bag.dispose,
  };
}

export const calendar = {
  name: "calendar",
  means: "A desk calendar of the year's events; the pointer flips through its months, each page with its own event days marked.",
  rules: [1, 4, 5, 6],
  range: [0.6, 1, 2.2],
  tour: [[146, 200], [208, 200], [254, 200], null],
  mount,
};

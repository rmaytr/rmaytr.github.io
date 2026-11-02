/**
 * Portico: the student government's website as a browser window lying flat, a
 * title bar with three dots and an address field, over a page: a header
 * carrying a small classical portico (three steps, four columns before a wall,
 * an entablature and a pediment), then five content blocks on a grid below it,
 * each with an image or lines of text. The pointer's x drags the page from its
 * old layout to its redesign. On the left every block sits crooked and out of
 * line; moving right, the redesign sweeps down the page from the header, each
 * block sliding and turning square on its own spring, and the block being set
 * takes the bright stroke. At rest the redesign is part-way: the portico stands
 * square on its header with its pediment lit, and the lower blocks are still on
 * their way. The slider is how crooked the old layout was, in degrees.
 */
// @ts-nocheck
import HL from './vendor/hairline-kernel.js';

const {
  Cam, circ, clamp, facing, fillet, fit, hull, poly, prism, proj, rad, ringAt, rings, rrect, seg, spring, stepS,
  flatDot, mk, place, pointer, put, register, disposer, solid,
} = HL;

const X0 = -60, X1 = 64, Y0 = -74, Y1 = 74, T = 4, BAR = 12, PT = 2.4; // the window: its top edge is x = X0, its left edge y = Y1
const REST = 0.6, LAG = 0.1, SPAN = 0.5; // the redesign at rest; each block starts LAG after the one above it and lands SPAN later
// The portico on its header, facing down the page: three steps, a back wall, four columns, the entablature, the pediment.
const PX = -19, PY = 22, SD = 28, SW = 52, SI = 2.4, SH = 2.2, NC = 4, CS = 11, CR = 2.4;
const ZS = PT + 3 * SH, ZE = ZS + 22, ED = 17, EW = 40, EH = 4, ZB = ZE + EH, ZP = ZB + 11;
// Where the old layout left a part: [dx, dy] at 10°, and its turn in units of the slider's degrees.
const PORTICO = [1, 3, 0.7];
// The page's blocks on the redesign's grid, in reading order: [x0, y0, x1, y1], where the old layout left each,
// and its marks, an image [x0, y0, x1, y1] or a line of text [x, from y, to y]. The header comes first, its title beside the portico.
const BLOCKS = [
  [[-41, -66, 3, 66], [0, -1.5, 0.1], [[-24, -12, -56], [-16, -12, -42]]],
  [[10, 26.7, 30, 66], [-1, 1, -0.45], [[13, 29.7, 21, 63], [25.5, 63, 41]]],
  [[10, -19.7, 30, 19.7], [2.5, -1, 0.4], [[13, -16.7, 21, 16.7], [25.5, 16.7, -5]]],
  [[10, -66, 30, -26.7], [1, 1, -0.6], [[13, -63, 21, -29.7], [25.5, -29.7, -51]]],
  [[37, -19.7, 57, 66], [0, 1.5, 0.25], [[40, 31, 54, 63], [43, 26, -10], [49, 26, -2]]],
  [[37, -66, 57, -26.7], [-1, -2, -0.6], [[43, -29.7, -60], [49, -29.7, -50]]],
];

/** The share of the redesign block r has reached when the page as a whole is at p. */
const qOf = (p, r) => clamp((p - r * LAG) / SPAN, 0, 1);

/** A part q of the way from where the old layout left it to its place: maps a point, and turns a ring with its normals. */
function pose(cx, cy, [dx, dy, a], deg, q) {
  const k = 1 - q, t = rad(a * deg * k), c = Math.cos(t), s = Math.sin(t);
  const ox = cx + (dx * deg * k) / 10, oy = cy + (dy * deg * k) / 10;
  const xy = (x, y) => [ox + (x - cx) * c - (y - cy) * s, oy + (x - cx) * s + (y - cy) * c];
  const ring = (rg) => rg.map((p) => { const [u, v] = xy(p.u, p.v); return { u, v, nu: p.nu * c - p.nv * s, nv: p.nu * s + p.nv * c }; });
  return { xy, ring };
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  const C = Cam(45, 0.5, 1.58);
  fit(C, [[X0, Y0, -T], [X1, Y1, -T], [X0, Y1, -T], [X1, Y0, -T], [PX, PY, ZP]], 200, 166);
  const P = proj(C), front = facing(C);
  let deg = value;

  const g = mk("g", {}, svg);
  // The window, lying flat: a thin plate, the title bar's seam, its address field and three dots.
  put(solid(g), prism(P, front, rrect(X0, Y0, X1, Y1, 9, 14), rrect(X0 + 1.6, Y0 + 1.6, X1 - 1.6, Y1 - 1.6, 7.4, 14), -T, 0));
  mk("path", { class: "nf", d: seg(P(X0 + BAR, Y0 + 1.6, 0), P(X0 + BAR, Y1 - 1.6, 0)) }, g);
  mk("path", { class: "nf lo", d: poly(ringAt(P, rrect(X0 + 3.4, Y0 + 10, X0 + BAR - 3.4, Y1 - 28, 2.6, 4), 0)) }, g);
  for (let k = 0; k < 3; k++) place(flatDot(g, C, 1.7, "dot m"), P(X0 + BAR / 2, Y1 - 8 - k * 6, 0));

  // The blocks: a thin plate each, with its marks on top. The plates never overlap, so their order is by depth
  // alone, header first, since its portico rises over the page behind it.
  const items = BLOCKS.map(([[x0, y0, x1, y1], old, marks], r) => {
    const [ring, inner] = rings(x0, y0, x1, y1, 2.4, 1);
    const shapes = marks.map((m) => (m.length === 4 ? rrect(m[0], m[1], m[2], m[3], 1.6, 4) : m));
    return { r, old, shapes, ring, inner, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, sp: spring(qOf(REST, r), { eps: 0.001 }), drawn: NaN };
  });
  [items[0], ...items.slice(1).sort((a, b) => a.cx + a.cy - (b.cx + b.cy))].forEach((it) => {
    it.g = mk("g", {}, g); it.el = solid(it.g); it.mk = mk("path", { class: "nf lo" }, it.g);
  });

  // The portico, inside the header's group, bottom up and back to front: steps, the back wall, the columns along
  // the front edge, the entablature, the pediment.
  const hg = items[0].g, part = (ring, inner) => [solid(hg), ring, inner], FX = PX + ED / 2;
  const steps = [0, 1, 2].map((k) => part(...rings(PX - SD / 2 + k * SI, PY - SW / 2 + k * SI, PX + SD / 2 - k * SI, PY + SW / 2 - k * SI, 1.6, 0.8)));
  const wall = part(...rings(PX - ED / 2 + 1, PY - EW / 2 + 2, PX - ED / 2 + 5, PY + EW / 2 - 2, 1, 0.6));
  const col = (r, k) => circ(r, 16).map((q) => ({ ...q, u: q.u + FX - 3.2, v: q.v + PY + (k - (NC - 1) / 2) * CS }));
  const cols = Array.from({ length: NC }, (_, k) => part(col(CR, k), col(CR - 0.7, k)));
  const ent = part(...rings(PX - ED / 2, PY - EW / 2, FX, PY + EW / 2, 1.2, 0.8));
  const ped = solid(hg), eave = rrect(PX - ED / 2, PY - EW / 2, FX, PY + EW / 2, 1.2, 4), ridge = rrect(PX - ED / 2, PY - 0.9, FX, PY + 0.9, 0.9, 4);
  // the tympanum, framed 1.3 inside the front face's rakes and base, in (y, z); the ridge runs back from its apex
  const tym = fillet([[PY - 14.9, ZB + 1.3], [PY + 14.9, ZB + 1.3], [PY, ZP - 1.5]], [1, 1, 1]);

  function drawPortico(o) {
    steps.forEach(([el, ring, inner], k) => put(el, prism(P, front, o.ring(ring), o.ring(inner), PT + k * SH, PT + (k + 1) * SH)));
    [wall, ...cols].forEach(([el, ring, inner]) => put(el, prism(P, front, o.ring(ring), o.ring(inner), ZS, ZE)));
    put(ent[0], prism(P, front, o.ring(ent[1]), o.ring(ent[2]), ZE, ZB));
    // a gable is the hull of its eaves and its ridge
    const roof = ringAt(P, o.ring(eave), ZB).concat(ringAt(P, o.ring(ridge), ZP));
    const face = poly(tym.map(([y, z]) => P(...o.xy(FX, y), z))), rd = seg(P(...o.xy(FX - 0.6, PY), ZP), P(...o.xy(PX - ED / 2 + 1.2, PY), ZP));
    put(ped, { sil: poly(hull(roof)), crease: face + rd });
  }

  function draw(it, q) {
    const o = pose(it.cx, it.cy, it.old, deg, q);
    put(it.el, prism(P, front, o.ring(it.ring), o.ring(it.inner), 0, PT));
    it.mk.setAttribute("d", it.shapes.map((m) => (typeof m[0] === "number"
      ? seg(P(...o.xy(m[0], m[1]), PT), P(...o.xy(m[0], m[2]), PT))
      : poly(ringAt(P, o.ring(m), PT)))).join(""));
    if (it.r === 0) drawPortico(pose(PX, PY, PORTICO, deg, q));
  }

  const B = register(stage, (dt) => {
    let moving = false;
    for (const it of items) {
      if (stepS(it.sp, dt)) moving = true;
      if (it.sp.x !== it.drawn) { it.drawn = it.sp.x; draw(it, it.sp.x); }
    }
    return moving;
  });
  bag.add(B.unregister);

  /** The bright stroke: on the block being set (f), or at rest (-1) on the pediment, which is also the header's. */
  function light(f) {
    ped.sil.classList.toggle("hi", f <= 0);
    for (const it of items) if (it.r) it.el.sil.classList.toggle("hi", it.r === f);
  }

  // The pointer's x is how far the redesign has got; the targets, never the pose on screen, pick the block (rule 01).
  function aim(x) {
    const p = x == null ? REST : clamp((x - 60) / 280, 0, 1), f = items.findIndex((it) => qOf(p, it.r) < 1);
    for (const it of items) it.sp.t = qOf(p, it.r);
    light(x == null ? -1 : f < 0 ? items.length - 1 : f);
    read.textContent = x == null ? "rest" : p === 0 ? "old layout" : `redesign ${Math.round(p * 100)}%`;
    B.wake();
  }
  bag.add(pointer(stage, { move: (p) => aim(p[0]), leave: () => aim(null) }));
  bag.add(() => svg.replaceChildren());
  aim(null);

  return {
    set: (v) => { deg = v; for (const it of items) it.drawn = NaN; B.wake(); },
    destroy: bag.dispose,
  };
}

export const portico = {
  name: "portico",
  means: "The student government's website, a columned portico in its header; the pointer drags its page from the old layout into the redesign.",
  rules: [1, 3, 5, 8],
  range: [5, 10, 16],
  tour: [[60, 160], [200, 160], [340, 160], null],
  mount,
};

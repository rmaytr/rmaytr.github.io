/**
 * Tutor: an open textbook lying on a desk, a hardcover with its page block
 * parted at the gutter. The pointer's x is how far through the book you are:
 * the leaves between here and there lift off one side and turn over onto the
 * other, on a spring, so a sweep riffles through course after course. At rest
 * one leaf stands mid-turn and bright, its edge falling ahead of it. The
 * slider is how many leaves are in the air at once.
 *
 * Every leaf hinges on the spine, and is drawn by its angle round the spine.
 * The leaves are painted by how far that angle is from edge-on, the farthest
 * first, which is back to front.
 */
const {
  Cam, clamp, facing, fit, hull, open, poly, prism, proj, rings, run, spring, stepS,
  disposer, mk, pointer, put, reflect, register, solid,
} = HL;

const N = 8, L = 100, W = 72, E = 4, CT = 2.2, ZS = 10, R = 4, G = 20, B = 1.6, RC = 2.6, CURL = 0.3;
const X0 = -L / 2, X1 = L / 2, XA = X0 + B, XB = X1 - B, WL = W - B;
const PHI = Math.atan2(0.5, 0.612); // the angle round the spine at which a leaf is seen edge-on, at Cam(45, 0.5)
const LEAD = 0.05; // the chosen leaf is the one just past upright, where it faces the camera
const W_REST = 1.2, K_REST = 4.5 + 0.12 * W_REST; // at rest one leaf, the fifth, stands two-thirds over
const COURSE = ["calc I", "calc II", "phys I", "python"];

/** How far a page has risen out of the gutter, 0 at the spine to 1 by G. */
const rise = (s) => { const u = Math.min(s / G, 1); return 1 - (1 - u) * (1 - u); };
const top = (y) => ZS + R * rise(Math.abs(y));
/** A ring with n samples on every segment, so a curved top can follow it. */
const dense = (ring, n) => ring.flatMap((q, i) => {
  const r = ring[(i + 1) % ring.length];
  return Array.from({ length: n }, (_, k) => ({ u: q.u + ((r.u - q.u) * k) / n, v: q.v + ((r.v - q.v) * k) / n, nu: q.nu, nv: q.nv }));
});

/**
 * A leaf's angle round the spine at distance s, turned t of the way over: lying on a side at 0 and 1. Between,
 * it flattens out of its lying shape fast, so no part of it is edge-on while another is not, and its edge leads
 * away from edge-on, never through a pile.
 */
function ang(s, t) {
  const aR = Math.atan2(R * rise(s), s), a = Math.PI * t + Math.pow(1 - 2 * t, 3) * aR;
  return clamp(a + CURL * Math.sin(Math.PI * t) * (s / WL) * (a - PHI), aR, Math.PI - aR);
}

// A leaf in its own (s, x): up the head edge, round the fore-edge, back down the foot. The spine edge is never stroked.
const SAMP = Array.from({ length: 13 }, (_, k) => (WL - RC) * Math.pow(k / 12, 1.4));
const corner = (f, xc, sg) => [WL - RC + RC * Math.sin((f * Math.PI) / 2), xc + sg * RC * Math.cos((f * Math.PI) / 2)];
const OUT = [
  ...SAMP.map((s) => [s, XA]),
  ...[1, 2, 3, 4].map((j) => corner(j / 4, XA + RC, -1)),
  ...[0, 1, 2, 3].map((j) => corner(1 - j / 4, XB - RC, 1)),
  ...SAMP.slice().reverse().map((s) => [s, XB]),
];
// Lines of text, as rules across the page: [x, where the line ends]. Two paragraphs, each ending short.
const ROWS = [[XA + 10, 62], [XA + 16, 62], [XA + 22, 62], [XA + 28, 40], [XA + 40, 62], [XA + 46, 62], [XA + 52, 62], [XA + 58, 62], [XA + 64, 30]];
const TS = [9, 13, 18, 25, 34, 44, 54];

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  const C = Cam(45, 0.5, 1.62);
  fit(C, [[X0 - E, -W - E, 0], [X1 + E, W + E, 0], [X0 - E, W + E, 0], [X1 + E, -W - E, 0], [X0, 0, ZS + WL], [X1, 0, ZS + WL]], 200, 166);
  const P = proj(C), front = facing(C);
  let wv = value, pick = 0;
  const k = spring(K_REST), w = spring(W_REST);
  /** The screen point of (s, x) on a leaf turned t over, and the leaf's lines of text. */
  const onLeaf = (t) => {
    const memo = new Map();
    return (s, x) => { if (!memo.has(s)) memo.set(s, ang(s, t)); const a = memo.get(s); return P(x, s * Math.cos(a), ZS + s * Math.sin(a)); };
  };
  const text = (at) => ROWS.map(([x, s1]) => open(TS.filter((s) => s < s1).concat([s1]).map((s) => at(s, x)))).join("");

  const g = mk("g", {}, svg);
  const [cover, coverIn] = rings(X0 - E, -W - E, X1 + E, W + E, 3.5, 1.2);
  reflect(svg, g, P, front, cover, 0, 14);
  put(solid(g), prism(P, front, cover, coverIn, 0, CT));

  // The page block, one solid each side of the gutter: its top rises out of the gutter and is a page of text when no leaf
  // lies on it, and two page lines run round its near faces.
  for (const [y0, y1] of [[-W, 0], [0, W]]) {
    const [ring, inner] = rings(X0, y0, X1, y1, 3, B).map((r) => dense(r, 6));
    const s = solid(g);
    put(s, {
      sil: poly(hull(ring.map((q) => P(q.u, q.v, CT)).concat(ring.map((q) => P(q.u, q.v, top(q.v)))))),
      crease: open(run(inner, front).map((q) => P(q.u, q.v, top(q.v)))),
    });
    const near = run(ring, front);
    mk("path", { class: "nf lo", d: [0.4, 0.72].map((f) => open(near.map((q) => P(q.u, q.v, CT + f * (ZS - CT))))).join("") + text(onLeaf(y0 < 0 ? 1 : 0)) }, s.g);
  }

  // The leaves, each its own group so it can be moved in the paint order without being redrawn.
  const lg = mk("g", {}, g);
  const leaves = Array.from({ length: N }, (_, i) => {
    const grp = mk("g", {}, lg);
    return {
      i, g: grp, t: NaN, key: 0, cls: "",
      face: mk("path", { class: "fo" }, grp), lines: mk("path", { class: "nf lo" }, grp), edge: mk("path", { class: "nf lo" }, grp),
    };
  });

  function shape(lf, t) {
    const at = onLeaf(t), out = OUT.map(([s, x]) => at(s, x));
    lf.face.setAttribute("d", poly(out));
    lf.edge.setAttribute("d", open(out));
    lf.lines.setAttribute("d", text(at));
    // back to front: the farther a leaf's angle is from edge-on, the farther back; on a pile, the leaf turned last lies on top
    const a = ang(WL * 0.6, t);
    lf.key = Math.abs(a - PHI) + (a < PHI ? lf.i : N - lf.i) * 1e-6;
  }

  function draw() {
    let moved = false;
    for (const lf of leaves) {
      const l = clamp((k.x - lf.i - 0.5) / w.x + 0.5, 0, 1), t = l * l * (3 - 2 * l);
      const cls = "nf " + (lf.i === pick ? "hi" : t > 0.01 && t < 0.99 ? "sil" : "lo");
      if (cls !== lf.cls) { lf.edge.setAttribute("class", cls); lf.cls = cls; }
      if (Math.abs(t - lf.t) < 1e-4) continue;
      lf.t = t; moved = true;
      shape(lf, t);
    }
    if (moved) leaves.slice().sort((a, b) => b.key - a.key).forEach((lf) => lg.append(lf.g));
  }

  const B2 = register(stage, (dt) => { const a = stepS(k, dt), b = stepS(w, dt); draw(); return a || b; });
  bag.add(B2.unregister);

  // The pointer's x, read on the book's width at rest, is how far through it you are; the target picks the leaf (rule 01).
  const sxU = P(0, W, ZS)[0], sxT = P(0, -W, ZS)[0];
  function aim(x) {
    if (x == null) { k.t = K_REST; w.t = W_REST; }
    else { k.t = -wv / 2 + clamp((x - sxU) / (sxT - sxU), 0, 1) * (N + wv); w.t = wv; }
    pick = clamp(Math.round(k.t - 0.5 - LEAD * w.t), 0, N - 1);
    read.textContent = x == null ? "rest" : COURSE[Math.floor((pick * COURSE.length) / N)];
    B2.wake();
  }
  let inside = false;
  bag.add(pointer(stage, { move: (p) => { inside = true; aim(p[0]); }, leave: () => { inside = false; aim(null); } }));
  bag.add(() => svg.replaceChildren());
  aim(null);
  draw();

  return {
    set: (v) => { wv = v; if (inside) { w.t = v; B2.wake(); } },
    destroy: bag.dispose,
  };
}

hairline({
  name: "tutor",
  means: "An open textbook: the pointer's x is how far through it you are, and the pages lift and turn over toward it.",
  rules: [1, 5, 6, 8],
  range: [1.2, 3, 4.5],
  tour: [[169, 160], [214, 150], [243, 160], null],
  mount,
});

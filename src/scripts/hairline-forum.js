/**
 * Forum: a student-government chamber. Thirty-one seats, each a cushion and a
 * back, stand in three curved tiers of 9, 10 and 12, facing a lectern on a low
 * round dais. The pointer's x sweeps a vote across the hemicycle: every seat
 * to its left stands, rising off its dashed footprint on the 700ms lift curve,
 * staggered out from the edge of the vote. The last seat to stand takes the
 * bright stroke; once more than half stand, the lectern takes it instead: the
 * motion carries. At rest seventeen stand on the left and the lectern is lit.
 * The slider is how high a standing seat rises, in units.
 *
 * Seats are counted by their resting screen x, which never moves (rule 01).
 * The tiers are concave, so their outline is written by hand: the top edge
 * where a wall faces away, the foot where it faces you.
 */
// @ts-nocheck
import HL from './vendor/hairline-kernel.js';

const {
  Cam, circ, extremes, facing, fit, hull, open, poly, prism, proj, rad, ringAt, rings, rrect, run, seg,
  tdone, tset, tval, tween, disposer, mk, place, pointer, put, register, solid,
} = HL;

const ROWS = [9, 10, 12], R0 = 42, D = 15, T = 5, PB = 4, MID = 225, HS = 82; // arcs D apart, each a step T up; seats span MID ± HS degrees
const ROUT = R0 + 2.5 * D, RB = ROUT + 3, APRON = 26, ALL = 31, MAJ = 16, REST = 17, STEP = 30, TOP = 22;
const SW = 4.6, SF = -4.5, SB = 2.5, BB = 5, SH = 5, BH = 12; // a seat in its own frame: half-width; cushion front and back; the back's rear; heights
const LC = -7, LZ = 21, TILT = 0.5; // the lectern: how far toward you of the arcs' centre, its top's height and slope

const dir = (a) => [Math.cos(rad(a)), Math.sin(rad(a))];
const xy = (a, r) => dir(a).map((d) => d * r);
const deg = (x) => (x * 180) / Math.PI;
const inset = (ring, b) => ring.map((q) => ({ ...q, u: q.u - b * q.nu, v: q.v - b * q.nv }));

/** A ring of arcs, each [cx, cy, r, from, to] by the angle of its outward normal; a negative r is a concave arc. */
function arcs(list) {
  const out = [];
  for (const [cx, cy, r, a0, a1] of list) {
    const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / 6));
    for (let k = 0; k <= n; k++) { const [nu, nv] = dir(a0 + ((a1 - a0) * k) / n); out.push({ u: cx + r * nu, v: cy + r * nv, nu, nv }); }
  }
  return out;
}

/** A curved tier: an annular sector from radius a to b over MID ± h degrees, its four corners rounded by rc. */
function sector(a, b, h, rc) {
  const f0 = MID - h, f1 = MID + h, al = deg(Math.asin(rc / (b - rc))), be = deg(Math.asin(rc / (a + rc)));
  return arcs([
    [0, 0, b, f0 + al, f1 - al], [...xy(f1 - al, b - rc), rc, f1 - al, f1 + 90],
    [...xy(f1 - be, a + rc), rc, f1 + 90, f1 + 180 - be], [0, 0, -a, f1 + 180 - be, f0 + 180 + be],
    [...xy(f0 + be, a + rc), rc, f0 + 180 + be, f0 + 270], [...xy(f0 + al, b - rc), rc, f0 + 270, f0 + 360 + al],
  ]);
}

/** The floor: a half disc behind the line through the arcs' centre, and an apron toward you that holds the dais. */
function floor(rc) {
  const k = (s) => { const a = xy(MID + s * 90, RB - rc), b = xy(MID + 180, APRON - rc); return [a[0] + b[0], a[1] + b[1]]; };
  return arcs([[0, 0, RB, MID - 90, MID + 90], [...k(1), rc, MID + 90, MID + 180], [...k(-1), rc, MID + 180, MID + 270]]);
}

/** A ring drawn in a part's own frame (u across, v toward angle a), turned to a and moved to c. */
function turn(ring, c, a) {
  const [ex, ey] = dir(a);
  return ring.map((q) => ({ u: c[0] + q.u * ey + q.v * ex, v: c[1] - q.u * ex + q.v * ey, nu: q.nu * ey + q.nv * ex, nv: -q.nu * ex + q.nv * ey }));
}

/** A slab from z0 to z1 on a footprint that may be concave: the top edge where a wall faces away, the foot where it faces you, and one crease. */
const slab = (P, front, ring, z0, z1, b) => ({
  sil: poly(ring.map((q) => P(q.u, q.v, front(q) ? z0 : z1))),
  crease: open(ringAt(P, run(inset(ring, b), front), z1)),
});

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let lift = value, cur = REST;

  // The camera is fitted to the floor and to the back row standing at the slider's top, so no pose leaves the frame.
  const C = Cam(45, 0.5, 1.8), ap = xy(MID + 180, APRON);
  fit(C, [[...xy(MID + 90, RB).map((v, i) => v + ap[i]), -PB], [...xy(MID - 90, RB).map((v, i) => v + ap[i]), -PB], [...xy(MID, ROUT), 2 * T + BH + TOP]], 200, 166);
  const P = proj(C), front = facing(C);

  const g = mk("g", {}, svg), base = floor(10);
  put(solid(g), prism(P, front, base, inset(base, 2), -PB, 0));
  // Two curved tiers, the upper one painted after the lower it stands on and a little shorter at the ends.
  for (const [k, h] of [[1, 88], [2, 85]]) put(solid(g), slab(P, front, sector(R0 + (k - 0.5) * D, ROUT, h, 3), (k - 1) * T, k * T, 1.4));

  const seats = [];
  ROWS.forEach((n, k) => {
    for (let j = 0; j < n; j++) { const a = MID - HS + ((j + 0.5) / n) * 2 * HS; seats.push({ a, c: xy(a, R0 + k * D), z: k * T }); }
  });
  // Ranked by resting screen x: the pointer's x counts the seats to its left, the one it is on included, and
  // nothing that moves is ever tested (rule 01).
  const xs = seats.map((s) => P(s.c[0], s.c[1], s.z)[0]);
  const order = seats.map((_, i) => i).sort((i, j) => xs[i] - xs[j]);
  order.forEach((i, r) => { seats[i].rank = r; });
  const count = (x) => order.filter((i) => xs[i] < x + 4).length;

  let lectern = null;
  const lc = xy(MID, LC), e = dir(MID);
  function buildPodium() {
    const pg = mk("g", {}, g), dais = circ(14, 40).map((q) => ({ ...q, u: q.u + lc[0], v: q.v + lc[1] }));
    put(solid(pg), prism(P, front, dais, inset(dais, 1.6), 0, 3));
    // The lectern: a body, and on it a wider reading desk, 2.5 thick, sloping up toward the seats.
    const [post, postIn] = rings(-5, -3.5, 5, 3.5, 1.6, 0.8), desk = turn(rrect(-7.5, -5.5, 7.5, 5.5, 2, 4), lc, MID);
    const zt = (u, v) => LZ + TILT * ((u - lc[0]) * e[0] + (v - lc[1]) * e[1]);
    const tilt = (ring, dz = 0) => ring.map((q) => P(q.u, q.v, zt(q.u, q.v) + dz));
    lectern = [solid(pg), solid(pg)];
    put(lectern[0], prism(P, front, turn(post, lc, MID), turn(postIn, lc, MID), 3, LZ - 2));
    put(lectern[1], { sil: poly(hull(tilt(desk, -2.5).concat(tilt(desk)))), crease: open(tilt(run(inset(desk, 1), front))) });
    // a gooseneck microphone, rising from the desk's far edge and bending over it toward the speaker
    const neck = [];
    for (let k = 0; k <= 8; k++) {
      const t = k / 8, w = turn([{ u: 4 - 3 * t, v: 4.5 - 5 * t * t, nu: 0, nv: 0 }], lc, MID)[0];
      neck.push(P(w.u, w.v, LZ + TILT * 4.5 + 11 * t * (1.6 - 0.6 * t)));
    }
    mk("path", { class: "nf", d: open(neck) }, pg);
    place(mk("circle", { r: 1.7, class: "dot m" }, pg), neck[8]);
  }
  function buildSeat(s) {
    const grp = mk("g", {}, g);
    // A guide, painted before the seat that covers it: the seat's footprint, and dashed drops to it once it rises.
    const foot = turn(rings(-SW, SF, SW, BB, 1.8, 1)[0], s.c, s.a);
    s.foot = poly(ringAt(P, foot, s.z));
    s.drops = extremes(P, foot);
    s.guide = mk("path", { class: "nf dash" }, grp);
    s.parts = [[SB, BB, BH, 1.2, 0.5], [SF, SB, SH, 1.8, 0.8]].map(([v0, v1, h, r, b]) => {
      const [ring, inner] = rings(-SW, v0, SW, v1, r, b);
      return { ring: turn(ring, s.c, s.a), inner: turn(inner, s.c, s.a), h };
    });
    if (Math.cos(rad(s.a - 45)) > 0) s.parts.reverse(); // the back is the nearer part: paint the cushion first
    s.parts.forEach((p) => { p.el = solid(grp); });
    s.tw = tween(s.rank < REST ? 1 : 0);
    s.drawn = NaN;
  }
  // Seats and podium, back to front: by x + y, from the far corner.
  [...seats, { c: lc }].sort((p, q) => p.c[0] + p.c[1] - q.c[0] - q.c[1]).forEach((s) => (s.a === undefined ? buildPodium() : buildSeat(s)));

  function draw(s, t) {
    const z = s.z + t * lift;
    if (z === s.drawn) return;
    s.drawn = z;
    for (const p of s.parts) put(p.el, prism(P, front, p.ring, p.inner, z, z + p.h));
    s.guide.setAttribute("d", s.foot + (z - s.z > 1 ? s.drops.map((q) => seg(P(q.u, q.v, s.z), P(q.u, q.v, z))).join("") : ""));
  }
  const B = register(stage, (_dt, now) => {
    let moving = false;
    for (const s of seats) { draw(s, tval(s.tw, now)); if (!tdone(s.tw, now)) moving = true; }
    return moving;
  });
  bag.add(B.unregister);

  /** Stands the m seats furthest left. The stagger spreads out from the edge of the vote, or from where the pointer let go. */
  function vote(m, live) {
    const now = performance.now(), from = live ? m : cur, carried = m >= MAJ;
    cur = m;
    for (const s of seats) {
      tset(s.tw, s.rank < m ? 1 : 0, now, Math.abs(s.rank + 0.5 - from) * STEP);
      const lit = !carried && s.rank === m - 1;
      for (const p of s.parts) p.el.sil.classList.toggle("hi", lit);
    }
    for (const p of lectern) p.sil.classList.toggle("hi", carried);
    read.textContent = live ? `${m} of ${ALL}${carried ? " · carried" : ""}` : "rest";
    B.wake();
  }

  bag.add(pointer(stage, { move: (p) => vote(count(p[0]), true), leave: () => vote(REST, false) }));
  bag.add(() => svg.replaceChildren());
  vote(REST, false);

  return {
    set: (v) => { lift = v; for (const s of seats) s.drawn = NaN; B.wake(); },
    destroy: bag.dispose,
  };
}

export const forum = {
  name: "forum",
  means: "A student-government chamber of 31 seats; the pointer sweeps a vote across it and the motion carries once a majority stands.",
  rules: [1, 2, 4, 6],
  range: [10, 16, 22],
  tour: [[118, 170], [190, 165], [300, 170], null],
  mount,
};

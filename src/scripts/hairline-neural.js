/**
 * Neural: a small feed-forward network standing on three rails, four input
 * pucks, five hidden and three outputs, every node of one layer linked to
 * every node of the next. The pointer picks the input it is in line with, and
 * a real forward pass runs from it: the links it drives brighten hop by hop,
 * the hidden nodes lift by their activation, and the output with the highest
 * score lifts and lights, the prediction. One path, input to hidden to output,
 * carries the bright stroke. At rest input 2 is lit through hidden 4 to output
 * 1, with hidden 2 lifted on a dimmer branch. The slider is how high a fully
 * active node lifts, in world units.
 */
// @ts-nocheck
import HL from './vendor/hairline-kernel.js';

const {
  Cam, clamp, facing, fit, poly, prism, proj, ringAt, rings, seg, unproj,
  tdone, tset, tval, tween, disposer, mk, pointer, put, register, solid,
} = HL;

const SIZES = [4, 5, 3], R = 7, HN = 6, D = 22, LX = 60, RW = 11, T = 3, LMAX = 14, STEP = 50, REST = 1, ON = 0.3;
// The weights: H[a] is the hidden layer's activation for input a alone, W2[j] the hidden node j's pull on each output.
const H = [[0.35, 0.1, 0.95, 0, 0.5], [0.1, 0.65, 0, 0.95, 0.15], [0.9, 0, 0.3, 0.5, 0.05], [0.15, 0.9, 0.05, 0.1, 0.55]];
const W2 = [[0.1, 0.2, 0.9], [0.2, 0.8, 0.1], [0.3, 0.9, 0.1], [0.9, 0.1, 0.2], [0.1, 0.3, 0.8]];
const LINK = ["nf", "nf sil", "nf hi"]; // a link's three levels: idle, carrying signal, on the path

/** The forward pass for input a: each layer's activation, the path (a, j, k), and the level of the link s → t out of layer L. */
function pass(a) {
  const h = H[a], o = [0, 1, 2].map((k) => h.reduce((s, v, j) => s + v * W2[j][k], 0));
  const top = Math.max(...o), k = o.indexOf(top), c = h.map((v, j) => v * W2[j][k]), j = c.indexOf(Math.max(...c));
  const gate = (v) => (v > ON ? v : 0); // under ON a node stays seated and a link stays idle
  return {
    path: [a, j, k],
    act: [[0, 1, 2, 3].map((i) => +(i === a)), h.map(gate), o.map((v) => gate(Math.exp((v - top) / 0.15)))], // outputs: a softmax, over its winner
    link: (L, s, t) => {
      if (s === [a, j][L] && t === [j, k][L]) return 2;
      return gate(L === 0 ? (s === a ? h[t] : 0) : h[s] * W2[s][t]) ? 1 : 0;
    },
  };
}
const PASS = [0, 1, 2, 3].map(pass);

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let lift = value, cur = -1;

  // One rail under each layer. The camera is fitted with every node at the highest lift.
  const rails = SIZES.map((n, L) => [L * LX - RW, -((n - 1) / 2) * D - RW, L * LX + RW, ((n - 1) / 2) * D + RW]);
  const C = Cam(45, 0.5, 1.95);
  fit(C, rails.flatMap(([x0, y0, x1, y1]) => [[x0, y0, -T], [x1, y1, -T], [x0, y1, -T], [x1, y0, -T], [x0, y0, HN + LMAX], [x1, y0, HN + LMAX], [x0, y1, HN + LMAX]]), 200, 166);
  const P = proj(C), front = facing(C);

  const rest = PASS[REST], links = [];
  const layers = SIZES.map((n, L) => Array.from({ length: n }, (_, i) => {
    const x = L * LX, y = (i - (n - 1) / 2) * D;
    return { L, i, x, y, ring: rings(x - R, y - R, x + R, y + R, R, 1.2), z: tween(lift * rest.act[L][i]), on: tween(+(rest.path[L] === i)), zd: NaN, lv: -1 };
  }));
  const nodes = layers.flat();

  // The rails, each with a dim seat under every puck: hidden while it rests, the gap a lift opens.
  const g = mk("g", {}, svg);
  rails.forEach(([x0, y0, x1, y1], L) => {
    put(solid(g), prism(P, front, ...rings(x0, y0, x1, y1, 6, 1.4), -T, 0));
    for (const nd of layers[L]) mk("path", { class: "nf lo", d: poly(ringAt(P, nd.ring[0], 0)) }, g);
  });
  // Layer by layer: the links into a layer, then its pucks from the far end, so a puck covers the ends that run under it.
  layers.forEach((row, L) => {
    if (L > 0) for (const a of layers[L - 1]) for (const b of row) {
      const lv = rest.link(L - 1, a.i, b.i);
      links.push({ L: L - 1, a, b, el: mk("path", { class: LINK[0] }, g), on: tween(+(lv === 2)), carry: tween(+(lv > 0)), lv: -1 });
    }
    for (const nd of row) nd.el = solid(g);
  });

  /** A link runs from the rim of one puck's top to the rim of the next, at each one's height now. */
  function drawLink(ln) {
    const { a, b } = ln, dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), ux = (dx / d) * R, uy = (dy / d) * R;
    ln.el.setAttribute("d", seg(P(a.x + ux, a.y + uy, a.zd + HN), P(b.x - ux, b.y - uy, b.zd + HN)));
  }

  // A switch is a 0-to-1 tween read at its halfway mark, so a stroke lights and goes out at the same beat of its hop.
  const flip = (tw, now) => Math.round(tval(tw, now));
  const B = register(stage, (_dt, now) => {
    let moving = false;
    for (const nd of nodes) {
      const z = tval(nd.z, now), lv = flip(nd.on, now);
      nd.moved = z !== nd.zd;
      if (nd.moved) { nd.zd = z; put(nd.el, prism(P, front, nd.ring[0], nd.ring[1], z, z + HN)); }
      if (lv !== nd.lv) { nd.lv = lv; nd.el.sil.classList.toggle("hi", lv === 1); }
      if (!tdone(nd.z, now) || !tdone(nd.on, now)) moving = true;
    }
    for (const ln of links) {
      const lv = flip(ln.on, now) ? 2 : flip(ln.carry, now);
      if (ln.a.moved || ln.b.moved) drawLink(ln);
      if (lv !== ln.lv) { ln.lv = lv; ln.el.setAttribute("class", LINK[lv]); }
      if (!tdone(ln.on, now) || !tdone(ln.carry, now)) moving = true;
    }
    return moving;
  });
  bag.add(B.unregister);

  /** Runs the pass for input a, or the rest pass for -1: each layer starts a hop after the links into it (rule 02, by hop). */
  function show(a) {
    const s = PASS[a < 0 ? REST : a], now = performance.now();
    for (const nd of nodes) {
      tset(nd.z, lift * s.act[nd.L][nd.i], now, 2 * nd.L * STEP);
      tset(nd.on, +(s.path[nd.L] === nd.i), now, 2 * nd.L * STEP);
    }
    for (const ln of links) {
      const lv = s.link(ln.L, ln.a.i, ln.b.i), d = (2 * ln.L + 1) * STEP;
      tset(ln.on, +(lv === 2), now, d); tset(ln.carry, +(lv > 0), now, d);
    }
    read.textContent = a < 0 ? "rest" : `in ${a + 1} → out ${s.path[2] + 1}`;
    B.wake();
  }
  function choose(a) {
    if (a === cur) return;
    cur = a;
    show(a);
  }

  // The input in line with the pointer, read on the plane of the inputs' rest tops, which never moves (rule 01).
  const pick = (p) => clamp(Math.round(unproj(C, p[0], p[1], HN)[1] / D + (SIZES[0] - 1) / 2), 0, SIZES[0] - 1);
  bag.add(pointer(stage, { move: (p) => choose(pick(p)), leave: () => choose(-1) }));
  bag.add(() => svg.replaceChildren());
  read.textContent = "rest";
  B.wake();

  return {
    set: (v) => { lift = v; show(cur); },
    destroy: bag.dispose,
  };
}

export const neural = {
  name: "neural",
  means: "A small neural network; the pointer picks an input and its signal flows forward layer by layer to light one output.",
  rules: [2, 4, 5, 6],
  range: [5, 9, 14],
  tour: [[170, 110], [110, 140], [79, 155], null],
  mount,
};

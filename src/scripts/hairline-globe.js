/**
 * Globe: a desk globe on its stand, the axis tilted 23.4° inside a half
 * meridian ring. The pointer's x picks the longitude to bring round to the
 * front, and the globe turns there on a spring. Three pins (Moscow,
 * Scottsdale, Birmingham) ride the surface; the one turned to face you is the
 * bright dot, and a dashed route arcs between them. At rest the Atlantic faces
 * you with Birmingham lit. The slider is how far the globe turns across the
 * stage, in degrees.
 */
// @ts-nocheck
import HL from './vendor/hairline-kernel.js';

const {
  Cam, clamp, circ, fit, prism, proj, hull, poly, open, spring, stepS,
  mk, place, pointer, put, register, disposer, solid, rad,
} = HL;

const R = 46, RM = R + 5, H = 74, TILT = rad(23.4), REST = -40, FACE = -45; // east runs right, so the front longitude sits at -45
const V = [0.612, 0.612, 0.5]; // toward the camera at Cam(45, 0.5)
const W = [Math.SQRT1_2, -Math.SQRT1_2, 0]; // screen-horizontal
const AX = [W[0] * Math.sin(TILT), W[1] * Math.sin(TILT), Math.cos(TILT)]; // the tilted pole
const CITIES = [["Moscow", 55.75, 37.6], ["Scottsdale", 33.5, -111.9], ["Birmingham", 33.5, -86.8]];
const HOME = 2;

const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
/** A unit vector for lat/lon, spun by th about the pole, then tilted about the view-horizontal axis. */
function unit(lat, lon, th) {
  const la = rad(lat), lo = rad(lon + th);
  const x = Math.cos(la) * Math.cos(lo), y = -Math.cos(la) * Math.sin(lo), z = Math.sin(la);
  // tilt: rotate about a = (1,1,0)/√2 by TILT; a × ẑ = W
  const a = [Math.SQRT1_2, Math.SQRT1_2, 0], c = Math.cos(TILT), s = Math.sin(TILT), p = [x, y, z];
  const ad = dot3(a, p), cr = [a[1] * z, -a[0] * z, a[0] * y - a[1] * x];
  return [0, 1, 2].map((k) => p[k] * c + cr[k] * s + a[k] * ad * (1 - c));
}
const at = (u, r = R) => [u[0] * r, u[1] * r, H + u[2] * r];

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  const C = Cam(45, 0.5, 1.62);
  const foot = at(AX.map((v) => -v), RM);
  fit(C, [[-RM, -RM, H], [RM, RM, H], [-RM, RM, H], [RM, -RM, H], [0, 0, H + RM], [foot[0], foot[1], 0]], 200, 160);
  const P = proj(C);
  let span = value, th = spring(FACE - REST), pick = HOME, drawn = NaN;

  const g = mk("g", {}, svg);
  // The stand: a round foot and a short stem up to the ring's south end.
  const ring = (r, cx, cy) => circ(r, 40).map((q) => ({ ...q, u: q.u + cx, v: q.v + cy }));
  const front = (q) => q.nu * V[0] + q.nv * V[1] > 0;
  put(solid(g), prism(P, front, ring(30, foot[0], foot[1]), ring(28, foot[0], foot[1]), 0, 6));
  put(solid(g), prism(P, front, ring(4.5, foot[0], foot[1]), ring(3.5, foot[0], foot[1]), 6, foot[2]));

  // The half meridian ring: its back half is painted before the ball, its front half after.
  const mountPts = (r) => {
    const back = [], fwd = [];
    for (let k = 0; k <= 48; k++) {
      const t = -Math.PI / 2 + (k / 48) * Math.PI, d = [0, 1, 2].map((i) => -W[i] * Math.cos(t) + AX[i] * Math.sin(t));
      (dot3(d, V) > 0 ? fwd : back).push(P(...at(d, r)));
    }
    return [back, fwd];
  };
  const [mb, mf] = mountPts(RM), [mb2, mf2] = mountPts(RM + 2.5);
  mk("path", { class: "nf", d: open(mb) + open(mb2) }, g);

  // The ball: an opaque plate, then the graticule and route on its near face.
  const ball = solid(g), sph = [];
  for (let k = 0; k < 160; k++) { const z = 1 - (2 * k + 1) / 160, r = Math.sqrt(1 - z * z), a = k * 2.39996; sph.push(P(...at([r * Math.cos(a), r * Math.sin(a), z]))); }
  put(ball, { sil: poly(hull(sph)), crease: "" });
  const grid = mk("path", { class: "nf lo" }, g), eq = mk("path", { class: "nf" }, g), route = mk("path", { class: "nf dash" }, g);
  const pins = CITIES.map(() => mk("circle", { class: "dot m", r: 2.6 }, g));
  mk("path", { class: "nf", d: open(mf) + open(mf2) }, g);

  // Draws a curve given as unit vectors, keeping only the runs that face the camera.
  const near = (us, lift = () => 1) => {
    let d = "", run = [];
    us.forEach((u, i) => {
      if (dot3(u, V) > 0.02) run.push(P(...at(u, R * lift(i)))); else { d += open(run); run = []; }
    });
    return d + open(run);
  };

  function draw() {
    const t = th.x;
    if (t === drawn) return;
    drawn = t;
    let gd = "";
    for (let lon = 0; lon < 180; lon += 30) { // each meridian is a great circle: up one side, down the other
      const us = [];
      for (let k = 0; k <= 32; k++) us.push(unit(-90 + (k / 32) * 180, lon, t));
      for (let k = 1; k <= 32; k++) us.push(unit(90 - (k / 32) * 180, lon + 180, t));
      gd += near(us);
    }
    for (const lat of [-60, -30, 30, 60]) { const us = []; for (let k = 0; k <= 64; k++) us.push(unit(lat, (k / 64) * 360, t)); gd += near(us); }
    grid.setAttribute("d", gd);
    const eqU = []; for (let k = 0; k <= 72; k++) eqU.push(unit(0, (k / 72) * 360, t));
    eq.setAttribute("d", near(eqU));
    const cu = CITIES.map(([, la, lo]) => unit(la, lo, t));
    let rd = "";
    for (let s = 0; s < 2; s++) {
      const a = cu[s], b = cu[s + 1], us = [];
      for (let k = 0; k <= 32; k++) { const f = k / 32, m = a.map((v, i) => v * (1 - f) + b[i] * f), n = Math.hypot(...m); us.push(m.map((v) => v / n)); }
      rd += near(us, (i) => 1 + 0.16 * Math.sin((i / 32) * Math.PI));
    }
    route.setAttribute("d", rd);
    cu.forEach((u, i) => {
      const show = dot3(u, V) > 0.05;
      pins[i].setAttribute("display", show ? "inline" : "none");
      if (show) place(pins[i], P(...at(u, R + 1)));
      pins[i].setAttribute("class", i === pick ? "dot" : "dot m");
    });
  }

  const B = register(stage, (dt) => { const m = stepS(th, dt); draw(); return m; });
  bag.add(B.unregister);

  // The pointer's x is a longitude; the target, not the pose on screen, picks the city (rule 01).
  function aim(x) {
    const lon = x == null ? REST : REST + (clamp(x, 0, 400) / 400 - 0.5) * span;
    th.t = FACE - lon;
    if (x == null) { pick = HOME; read.textContent = "rest"; }
    else {
      const near = CITIES.map((c, i) => [Math.abs(c[2] - lon), i]).sort((a, b) => a[0] - b[0])[0];
      pick = near[0] < 18 ? near[1] : -1;
      read.textContent = pick >= 0 ? CITIES[pick][0] : `${Math.round(Math.abs(lon))}°${lon < 0 ? "W" : "E"}`;
    }
    drawn = NaN;
    B.wake();
  }
  bag.add(pointer(stage, { move: (p) => aim(p[0]), leave: () => aim(null) }));
  bag.add(() => svg.replaceChildren());
  aim(null);

  return { set: (v) => { span = v; }, destroy: bag.dispose };
}

export const globe = {
  name: "globe",
  means: "A desk globe turns to bring the place under the pointer round to face you; the city it lands on lights up.",
  rules: [1, 4, 5, 6],
  range: [150, 220, 300],
  tour: [[341, 160], [69, 160], [115, 160], null],
  mount,
};

/**
 * Web: the World Wide Web globe, the internet's own icon, floating over a
 * browser window that lies flat beneath it. Its axis stands square to your
 * eye, so the parallels draw as straight lines and the meridians as ellipses,
 * the way the icon is drawn. The pointer's x is a longitude, and the globe
 * spins on a spring to bring it round to face you; the meridian it lands on is
 * the bright line. At rest the prime meridian is lit, a little right of centre.
 * The slider is how far the globe turns across the stage, in degrees.
 */
// @ts-nocheck
import HL from './vendor/hairline-kernel.js';

const {
  Cam, clamp, facing, fit, open, poly, prism, proj, rad, ringAt, rrect, seg, spring, stepS,
  flatDot, mk, place, pointer, put, register, disposer, solid,
} = HL;

const R = 46, H = 92, CX = 24, CY = -30, REST = -24, STEP = 30, HOME = 0;
const X0 = -50, X1 = 46, Y0 = -62, Y1 = 62, T = 4, BAR = 13; // the window: its top edge is x = X0, its left edge y = Y1
const E = Math.SQRT1_2, K = 0.5, CK = Math.sqrt(1 - K * K); // Cam(45, 0.5): 45° round, sin(elevation) .5
const V = [CK * E, CK * E, K]; // toward the camera
const W = [E, -E, 0]; // screen-right
const U = [-K * E, -K * E, CK]; // screen-up: the axis, square to the line of sight, so the icon reads true

/** The unit vector at lat, and at a = lon + spin (radians), on a sphere whose pole is U and whose a = 0 faces you. */
const dir = (lat, a) => [0, 1, 2].map((i) => Math.sin(lat) * U[i] + Math.cos(lat) * (Math.cos(a) * V[i] + Math.sin(a) * W[i]));
const at = (d, r = R) => [CX + d[0] * r, CY + d[1] * r, H + d[2] * r];
const wrap = (l) => ((((l + 180) % 360) + 360) % 360) - 180;
const label = (l) => (l === 0 ? "0°" : l === -180 ? "180°" : `${Math.abs(l)}°${l < 0 ? "W" : "E"}`);

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  const C = Cam(45, 0.5, 1.43);
  const side = (s) => at([0, 1, 2].map((i) => Math.cos(s) * W[i] + Math.sin(s) * U[i]));
  fit(C, [[X0, Y0, -T], [X1, Y1, -T], [X0, Y1, -T], [X1, Y0, -T], side(0), side(Math.PI), side(Math.PI / 2), side(-Math.PI / 2)], 200, 166);
  const P = proj(C), front = facing(C);
  let span = value, over = null, pick = HOME, drawn = NaN;
  const th = spring(-REST);

  const g = mk("g", {}, svg);
  // The browser window, lying flat: a thin plate, its title bar, three dots and an address field.
  const wr = rrect(X0, Y0, X1, Y1, 9, 14), wi = rrect(X0 + 1.6, Y0 + 1.6, X1 - 1.6, Y1 - 1.6, 7.4, 14); // 14 steps: the 2:1 view stretches the near corners
  put(solid(g), prism(P, front, wr, wi, -T, 0));
  mk("path", { class: "nf", d: seg(P(X0 + BAR, Y0 + 1.6, 0), P(X0 + BAR, Y1 - 1.6, 0)) }, g);
  mk("path", { class: "nf lo", d: poly(ringAt(P, rrect(X0 + 3.6, Y0 + 9, X0 + 9.4, Y1 - 31, 2.9, 4), 0)) }, g);
  for (let k = 0; k < 3; k++) place(flatDot(g, C, 1.9, "dot m"), P(X0 + BAR / 2, Y1 - 9 - k * 7, 0));
  // A dashed drop from the globe's centre to the window, painted before the ball so the ball covers its top.
  mk("path", { class: "nf dash", d: seg(P(CX, CY, H), P(CX, CY, 0)) }, g);

  // The ball: an opaque plate, then the parallels (straight, they never move), the equator and the meridians.
  const ball = solid(g), rim = [];
  for (let k = 0; k < 72; k++) rim.push(P(...side((k / 72) * 2 * Math.PI)));
  put(ball, { sil: poly(rim), crease: "" });
  const chord = (lat) => seg(P(...at(dir(rad(lat), -Math.PI / 2))), P(...at(dir(rad(lat), Math.PI / 2))));
  mk("path", { class: "nf lo", d: [-60, -30, 30, 60].map(chord).join("") }, g);
  mk("path", { class: "nf", d: chord(0) }, g);
  const grid = mk("path", { class: "nf lo" }, g), mer = mk("path", { class: "nf hi" }, g);

  /** The near half of one meridian at spin t, or nothing when it has turned away; a dim one also goes as it nears the limb, so it never doubles the outline. */
  function meridian(lon, t) {
    const a = rad(lon + t);
    if (Math.cos(a) <= (lon === pick ? 0 : 0.2)) return "";
    const pts = [];
    for (let k = 0; k <= 24; k++) pts.push(P(...at(dir(rad(-90 + k * 7.5), a))));
    return open(pts);
  }

  function draw() {
    const t = th.x;
    if (t === drawn) return;
    drawn = t;
    let gd = "", md = "";
    for (let lon = -180; lon < 180; lon += STEP) {
      const d = meridian(lon, t);
      if (lon === pick) md = d; else gd += d;
    }
    grid.setAttribute("d", gd);
    mer.setAttribute("d", md);
  }

  const B = register(stage, (dt) => { const m = stepS(th, dt); draw(); return m; });
  bag.add(B.unregister);

  // The pointer's x is a longitude; the target, not the pose on screen, picks the meridian (rule 01).
  function aim(x) {
    over = x;
    const lon = x == null ? REST : REST + (clamp(x, 0, 400) / 400 - 0.5) * span;
    th.t = -lon;
    pick = x == null ? HOME : wrap(Math.round(lon / STEP) * STEP);
    read.textContent = x == null ? "rest" : label(pick);
    drawn = NaN;
    B.wake();
  }
  bag.add(pointer(stage, { move: (p) => aim(p[0]), leave: () => aim(null) }));
  bag.add(() => svg.replaceChildren());
  aim(null);

  return { set: (v) => { span = v; if (over != null) aim(over); }, destroy: bag.dispose };
}

export const web = {
  name: "web",
  means: "The web's globe spins over a browser window to bring the meridian under the pointer round to face you.",
  rules: [1, 4, 6, 8],
  range: [120, 200, 300],
  tour: [[336, 130], [72, 130], [250, 130], null],
  mount,
};

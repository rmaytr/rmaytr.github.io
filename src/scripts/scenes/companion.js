// The hero's AI companion: an original character built in code. A clay helmet with a bevelled visor and headphones on a
// padded bust. Eyes follow the pointer, it blinks, smiles when you hover its face, beams and hops when clicked, and breathes.
import { THREE, stage, loop, glow, ss, reduce as reduceQ } from './stage.js';
import { ParametricGeometry } from 'three/addons/geometries/ParametricGeometry.js';

const reduce = reduceQ();
const TAU = Math.PI * 2;
const V2 = (x, y) => new THREE.Vector2(x, y);
// scratch objects so nothing is allocated per frame
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _d = new THREE.Vector3(), _p = new THREE.Vector2();
const _n = new THREE.Vector3(), _t = new THREE.Vector3(), _y = new THREE.Vector3(), _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3();

// ---- surfaces: u runs around (seam at the back), v bottom to top, so ParametricGeometry faces outwards
const superK = (s, c, n) => (Math.abs(s) ** n + Math.abs(c) ** n) ** (-1 / n);
const OPEN = 2.82; // the shell curls under to this angle from the crown and closes on the neck
function helmet(u, v, t) {
  const ph = Math.PI + TAU * u, th = 0.002 + (OPEN - 0.002) * (1 - v), s = Math.sin(ph), c = Math.cos(ph);
  const rho = Math.sin(th) * superK(s, c, 2.4);
  return t.set(rho * s * 1.08, Math.cos(th) * 0.97, rho * c + ss(1.5, 2.3, th) * Math.max(0, c) ** 2 * 0.05);
}
const bustCurve = new THREE.SplineCurve([[1.0, -4.9], [1.15, -3.9], [1.34, -2.9], [1.5, -2.1], [1.54, -1.75], [1.42, -1.5], [1.15, -1.3], [0.8, -1.13], [0.52, -1.03], [0.4, -0.97]].map(([r, y]) => V2(r, y)));
function bust(u, v, t) {
  bustCurve.getPointAt(v, _p);
  const ph = Math.PI + TAU * u, s = Math.sin(ph), c = Math.cos(ph), y = _p.y;
  const r = _p.x * superK(s, c, 2 + 0.7 * (1 - ss(-1.7, -1.0, y))); // round at the neck, boxier through the chest
  const depth = 0.6 + 0.3 * ss(-1.6, -0.95, y), chest = 0.09 * Math.exp(-(((y + 2) / 0.55) ** 2)) * Math.max(0, c) ** 2;
  return t.set(r * s, y, r * c * depth + chest);
}
const vAt = (y) => { let lo = 0, hi = 1; for (let i = 0; i < 24; i++) { const m = (lo + hi) / 2; if (bustCurve.getPointAt(m, _p).y < y) lo = m; else hi = m; } return lo; };

/** Point at arc-length offset (x right, y up) from (u0, v0) on surface S, lifted along the normal; n, t get normal and tangent. */
function onSurface(S, u0, v0, x, y, lift, out, n = _n, t = _t) {
  const e = 1e-4;
  const v = v0 + y / (S(u0, v0 + e, _a).distanceTo(S(u0, v0 - e, _b)) / (2 * e));
  const u = u0 + x / (S(u0 + e, v, _a).distanceTo(S(u0 - e, v, _b)) / (2 * e));
  t.subVectors(S(u + e, v, _a), S(u - e, v, _b)).normalize();
  S(u, v + e, _c); n.crossVectors(t, _c.sub(S(u, v - e, _d))).normalize();
  return S(u, v, out).addScaledVector(n, lift);
}
/** Turn q so local +Z follows normal n and +X the tangent t. */
const orient = (q, n, t) => { _y.crossVectors(n, t).normalize(); return q.setFromRotationMatrix(_m.makeBasis(_a.crossVectors(_y, n), _y, n)); };
const outline = (a, w, h, e, out) => { const c = Math.cos(a), s = Math.sin(a); return out.set(w * Math.sign(c) * Math.abs(c) ** (2 / e), h * Math.sign(s) * Math.abs(s) ** (2 / e)); };

/**
 * A raised panel on surface S: a superellipse outline (half-extents w, h, exponent e) swept by profile rings
 * [scale, outward offset, lift] (or functions of the outline angle). groups: the ring each material starts at.
 */
function panel(S, u0, v0, w, h, e, prof, groups = [0], seg = 144) {
  const pos = [], uv = [], idx = [], p = new THREE.Vector3(), o = new THREE.Vector2();
  for (const ring of prof) for (let j = 0; j < seg; j++) {
    const a = (j / seg) * TAU, [k, off, lift] = typeof ring === 'function' ? ring(a) : ring;
    outline(a, w, h, e, o);
    const gx = Math.sign(o.x) * Math.abs(o.x / w) ** (e - 1) / w, gy = Math.sign(o.y) * Math.abs(o.y / h) ** (e - 1) / h, gl = Math.hypot(gx, gy);
    onSurface(S, u0, v0, o.x * k + (gx / gl) * off, o.y * k + (gy / gl) * off, lift, p);
    pos.push(p.x, p.y, p.z); uv.push(0.5 + (o.x * k) / (2 * w), 0.5 + (o.y * k) / (2 * h));
  }
  for (let r = 0; r < prof.length - 1; r++) for (let j = 0; j < seg; j++) {
    const a = r * seg + j, j1 = (j + 1) % seg;
    idx.push(a, a + seg, r * seg + j1, a + seg, (r + 1) * seg + j1, r * seg + j1);
  }
  const g = new THREE.BufferGeometry(); g.setIndex(idx);
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  groups.forEach((r0, i) => g.addGroup(r0 * seg * 6, ((groups[i + 1] ?? prof.length - 1) - r0) * seg * 6, i));
  g.computeVertexNormals();
  if (!prof[0][0]) { // a centre ring is one point: share one normal there, or the shading pinches into a star
    const nm = g.attributes.normal; _a.set(0, 0, 0);
    for (let j = 0; j < seg; j++) _a.add(_b.fromBufferAttribute(nm, j));
    _a.normalize(); for (let j = 0; j < seg; j++) nm.setXYZ(j, _a.x, _a.y, _a.z);
  }
  return g;
}
/** Bake vertex colours (soft ambient occlusion, panel tints): ao(colour, x, y, z, u, v) returns the colour. */
function shade(geo, ao) {
  const p = geo.attributes.position, uv = geo.attributes.uv, col = new Float32Array(p.count * 3), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) ao(c.setScalar(1), p.getX(i), p.getY(i), p.getZ(i), uv.getX(i), uv.getY(i)).toArray(col, i * 3);
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); return geo;
}

// ---- procedural textures, generated once: a grey height field drawn on a canvas, turned into a normal map
function normalMap(w, h, draw, k = 3, repeat = [1, 1]) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const g = cv.getContext('2d', { willReadFrequently: true });
  g.fillStyle = '#808080'; g.fillRect(0, 0, w, h); draw(g, w, h);
  const src = g.getImageData(0, 0, w, h).data, img = g.createImageData(w, h), o = img.data;
  const at = (x, y) => src[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const nx = (at(x - 1, y) - at(x + 1, y)) * k, ny = (at(x, y + 1) - at(x, y - 1)) * k, l = Math.hypot(nx, ny, 1), i = (y * w + x) * 4;
    o[i] = (nx / l * 0.5 + 0.5) * 255; o[i + 1] = (ny / l * 0.5 + 0.5) * 255; o[i + 2] = (0.5 / l + 0.5) * 255; o[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); t.anisotropy = 4; return t;
}
function noise(g, w, h, cells, alpha) {
  const cv = document.createElement('canvas'); cv.width = cv.height = cells;
  const ng = cv.getContext('2d'), d = ng.createImageData(cells, cells);
  for (let i = 0; i < d.data.length; i += 4) { d.data[i] = d.data[i + 1] = d.data[i + 2] = Math.random() * 255; d.data[i + 3] = 255; }
  ng.putImageData(d, 0, 0); g.globalAlpha = alpha; g.drawImage(cv, 0, 0, w, h); g.globalAlpha = 1;
}
const stroke = (g, pts, width, col) => { g.strokeStyle = col; g.lineWidth = width; g.lineCap = 'round'; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); };
const seam = (g, ...pts) => { stroke(g, pts, 7, 'rgba(96,96,96,.55)'); stroke(g, pts, 2.5, '#303030'); };
const clayGrain = (g, w, h) => { noise(g, w, h, 96, 0.065); noise(g, w, h, w, 0.04); };

export function mountCompanion(host, canvas) {
  const { renderer, scene, camera, composer, dispose } = stage(canvas, { bloom: [0.5, 0.45, 1.0], env: 0.28 });
  const small = matchMedia('(pointer: coarse)').matches || innerWidth < 760;
  const pr = Math.min(devicePixelRatio, small ? 1.5 : 1.75);
  renderer.setPixelRatio(pr); composer.setPixelRatio(pr);
  renderer.shadowMap.enabled = true;
  let camZ = 10.5, cx = 0, cy = 0;
  camera.position.set(0, 0.1, camZ); camera.lookAt(0, -0.45, 0);

  // light: a soft warm key that casts the head's shadow, cardinal and rose rims, a sand bounce from below
  const key = new THREE.DirectionalLight(0xfff0e4, 1.9); key.position.set(4.5, 5.5, 4.5); scene.add(key);
  key.castShadow = true; key.shadow.mapSize.setScalar(small ? 512 : 1024); key.shadow.radius = 5; key.shadow.bias = -0.0004; key.shadow.normalBias = 0.025;
  Object.assign(key.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 2, far: 16 });
  scene.add(new THREE.HemisphereLight(0xf6efe8, 0x2a0d0d, 0.32));
  const fill = new THREE.DirectionalLight(0xf3ede4, 0.3); fill.position.set(-5, 1, 4); scene.add(fill);
  const rimA = new THREE.DirectionalLight(0xd44444, 2.6); rimA.position.set(-4.5, 1.8, -3); scene.add(rimA);
  const rimB = new THREE.DirectionalLight(0xe8a49c, 1.8); rimB.position.set(4.5, 1.2, -3); scene.add(rimB);
  const bounce = new THREE.DirectionalLight(0xd4a574, 0.35); bounce.position.set(0, -4, 3); scene.add(bounce);

  // textures. The ivory front narrows to the waist between dark side panels; seams trace that edge and bend with the form
  const collarV = vAt(-1.08), waistV = vAt(-3.1), vLo = vAt(-3.0), vHi = vAt(-1.6);
  const frontHW = (v) => 0.11 + 0.09 * ss(vLo, vHi, v); // half-width of the front panel, in u
  const bustTex = normalMap(512, 512, (g, w, h) => {
    clayGrain(g, w, h);
    const Y = (v) => (1 - v) * h;
    seam(g, [0, Y(waistV)], [w, Y(waistV)]); seam(g, [0, 0], [0, h]); seam(g, [w, 0], [w, h]);
    for (const sgn of [-1, 1]) seam(g, ...Array.from({ length: 33 }, (_, i) => { const v = collarV * (i / 32); return [(0.5 + sgn * frontHW(v)) * w, Y(v)]; }));
  });
  const headTex = normalMap(512, 512, (g, w, h) => {
    clayGrain(g, w, h);
    const Y = (v) => (1 - v) * h;
    seam(g, [0, 0], [0, h]); seam(g, [w, 0], [w, h]); seam(g, [w / 2, 0], [w / 2, Y(0.74)]);
    seam(g, [0, Y(0.8)], [w, Y(0.8)]); seam(g, [0, Y(0.13)], [w, Y(0.13)]);
    for (const u of [0.25, 0.75]) for (const dx of [-16, 0, 16]) stroke(g, [[u * w + dx, Y(0.7)], [u * w + dx, Y(0.62)]], 6, '#3a3a3a'); // temple vents
  });
  const grainTex = normalMap(256, 256, clayGrain, 2.5, [3, 3]);
  const ribTex = normalMap(256, 256, (g, w, h) => {
    for (let i = 0; i < 8; i++) { const x = (i + 0.5) * w / 8; stroke(g, [[x, 0], [x, h]], 18, '#a8a8a8'); stroke(g, [[x, 0], [x, h]], 8, '#d0d0d0'); }
    for (const y of [14, h - 14]) { stroke(g, [[0, y], [w, y]], 10, '#5a5a5a'); for (let i = 0; i < 8; i++) stroke(g, [[i * w / 8 + 6, y], [i * w / 8 + 22, y]], 4, '#e6e6e6'); }
  }, 2.5, [14, 1]);
  const ringTex = normalMap(256, 256, (g, w, h) => { noise(g, w, h, w, 0.1); for (let y = 4; y < h; y += 9) stroke(g, [[0, y], [w, y]], 2, '#606060'); }, 2);
  const maps = [bustTex, headTex, grainTex, ribTex, ringTex];

  // materials: soft-touch clay, a cardinal livery, graphite and rubber, ribbed fabric, brushed sand metal, gloss visor
  const clayP = { color: 0xe9e2da, roughness: 0.58, clearcoat: 0.12, clearcoatRoughness: 0.55, sheen: 0.4, sheenColor: 0xffe2d4, sheenRoughness: 0.65 };
  const clayHead = new THREE.MeshPhysicalMaterial({ ...clayP, vertexColors: true, normalMap: headTex });
  const clayBody = new THREE.MeshPhysicalMaterial({ ...clayP, vertexColors: true, normalMap: bustTex });
  const clay = new THREE.MeshPhysicalMaterial({ ...clayP, normalMap: grainTex });
  const plateMat = new THREE.MeshPhysicalMaterial({ ...clayP, color: 0xf1e9df, roughness: 0.42, clearcoat: 0.3, normalMap: grainTex });
  const red = new THREE.MeshPhysicalMaterial({ color: 0x9c2626, roughness: 0.5, clearcoat: 0.25, clearcoatRoughness: 0.4, sheen: 0.3, sheenColor: 0xe8a49c, normalMap: grainTex });
  const graphite = new THREE.MeshStandardMaterial({ color: 0x2e2627, roughness: 0.62, normalMap: grainTex });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x1f1819, roughness: 0.9, normalMap: grainTex });
  const fabric = new THREE.MeshPhysicalMaterial({ color: 0x5e1a1c, roughness: 0.95, sheen: 0.8, sheenColor: 0xe8a49c, sheenRoughness: 0.5, normalMap: ribTex });
  const metal = new THREE.MeshStandardMaterial({ color: 0xd4a574, metalness: 0.9, roughness: 0.36, envMap: scene.environment, envMapIntensity: 0.7 });
  const capMetal = new THREE.MeshStandardMaterial({ color: 0xb88a5f, metalness: 0.75, roughness: 0.5, envMap: scene.environment, envMapIntensity: 0.5, normalMap: ringTex });
  const visorMat = new THREE.MeshPhysicalMaterial({ color: 0x120c0d, roughness: 0.38, clearcoat: 0.35, clearcoatRoughness: 0.4, envMap: scene.environment, envMapIntensity: 0.32 });
  const eyeMat = glow(0xffd2a8, 2.1), sparkMat = glow(0xffffff, 1.6), cardMat = glow(0xd44444, 2.2), roseMat = glow(0xe8a49c, 2);
  const blushMat = new THREE.MeshBasicMaterial({ color: 0xff7a7a, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false });
  const smileMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffd2a8).multiplyScalar(1.6), toneMapped: false, transparent: true });

  const add = (geo, mat, parent, x = 0, y = 0, z = 0, cast = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m; };
  const lathe = (pts, seg = 72) => new THREE.LatheGeometry(pts.map(([r, y]) => V2(r, y)), seg);
  const rig = new THREE.Group(); scene.add(rig);
  const body = new THREE.Group(); rig.add(body);

  // ---- bust: shoulders, tapered chest, a raised chest plate with the core light, pauldrons, a ribbed neck and collar
  const ivory = new THREE.Color(clayP.color), side = new THREE.Color(0x3a2e2f);
  side.setRGB(side.r / ivory.r, side.g / ivory.g, side.b / ivory.b); // vertex colour that turns the clay into warm graphite
  add(shade(new ParametricGeometry(bust, 192, 110), (c, x, y, z, u, v) => {
    const neck = 1 - 0.38 * Math.exp(-((Math.max(0, Math.hypot(x, (y + 0.98) * 1.4, z) - 0.4) / 0.35) ** 2));
    const ao = neck * (0.72 + 0.28 * ss(-4.2, -1.8, y)) * (1 - 0.3 * Math.exp(-((Math.hypot(Math.abs(x) - 1.25, y + 1.5, z * 0.8) / 0.5) ** 2)));
    const hw = frontHW(v);
    return c.lerp(side, ss(hw - 0.006, hw + 0.006, Math.abs(u - 0.5)) * ss(-1.5, -1.7, y)).multiplyScalar(ao);
  }), clayBody, body, 0, 0, 0, false);
  const chestV = vAt(-2.05), plateLift = 0.05;
  add(panel(bust, 0.5, chestV, 0.56, 0.48, 2.8, [[0, 0, plateLift], [0.5, 0, plateLift], [0.8, 0, plateLift], [0.94, 0, plateLift], [1, 0, 0.048], [1, 0.02, 0.04], [1, 0.034, 0.02], [1, 0.04, 0], [1, 0.044, -0.02]]), plateMat, body, 0, 0, 0, false);
  const onPlate = (obj, x, y, lift = plateLift) => { onSurface(bust, 0.5, chestV, x, y, lift, obj.position); orient(obj.quaternion, _n, _t); return obj; };
  const emblem = onPlate(new THREE.Group(), 0, 0.06); body.add(emblem);
  add(lathe([[0.215, -0.01], [0.226, 0.012], [0.216, 0.027], [0.19, 0.03], [0.176, 0.014], [0.17, 0]], 64), graphite, emblem).rotation.x = Math.PI / 2;
  add(new THREE.CircleGeometry(0.172, 48), visorMat, emblem, 0, 0, 0.004);
  const chestRing = add(new THREE.TorusGeometry(0.115, 0.016, 10, 64), roseMat, emblem, 0, 0, 0.012);
  add(new THREE.CircleGeometry(0.045, 32), cardMat, emblem, 0, 0, 0.014);
  const slot = new THREE.CapsuleGeometry(0.018, 0.24, 4, 12).rotateZ(Math.PI / 2);
  for (const y of [-0.28, -0.345]) { const m = add(slot, graphite, body, 0, 0, 0, false); onPlate(m, 0, y, plateLift - 0.004); m.scale.z = 0.45; }

  // pauldrons: a clay dome on a cardinal trim band, mirrored
  const domeGeo = lathe([[0.5, 0.04], [0.53, 0.1], [0.52, 0.18], [0.46, 0.28], [0.34, 0.37], [0.18, 0.42], [0.001, 0.44]], 64);
  const trimGeo = lathe([[0.5, -0.06], [0.555, -0.04], [0.572, 0.0], [0.566, 0.05], [0.53, 0.08]], 64);
  for (const s of [-1, 1]) {
    const pad = new THREE.Group(); pad.position.set(s * 1.22, -1.43, 0); pad.rotation.z = -s * 0.62; pad.scale.set(0.82, 0.62, 0.7); body.add(pad);
    add(domeGeo, clay, pad); add(trimGeo, red, pad);
  }
  add(lathe([[0.36, -1.06], [0.395, -1.0], [0.38, -0.93], [0.355, -0.87], [0.37, -0.8], [0.36, -0.72], [0.33, -0.62], [0.3, -0.55]], 72), fabric, body, 0, 0, 0, false);
  add(lathe([[0.4, -1.1], [0.5, -1.09], [0.545, -1.05], [0.552, -1.0], [0.532, -0.955], [0.48, -0.94], [0.4, -0.945]], 96), graphite, body, 0, 0, 0, false);
  add(new THREE.TorusGeometry(0.549, 0.011, 8, 128), cardMat, body, 0, -1.02, 0, false).rotation.x = Math.PI / 2;

  // ---- head: a shaped shell, a bubble visor sunk in a bevelled rim with a brow, headphones, a mic boom, an antenna
  const head = new THREE.Group(); head.position.y = 0.1; rig.add(head);
  add(shade(new ParametricGeometry(helmet, 128, 88), (c, x, y, z) => c.multiplyScalar((0.62 + 0.38 * ss(-0.85, -0.3, y)) * (1 - 0.3 * Math.exp(-((Math.hypot(Math.abs(x) - 1.05, y, z) / 0.42) ** 2))))), clayHead, head);
  const VU = 0.5, VV = 1 - 1.62 / OPEN, VW = 0.98, VH = 0.56, VE = 3, DOME = 0.06;
  const glassLift = (s) => 0.012 + DOME * (1 - s * s);
  const rimRing = (off, lift, browOff, browLift) => (a) => { const b = Math.max(0, Math.sin(a)) ** 2; return [1, off + browOff * b, lift + browLift * b]; };
  add(panel(helmet, VU, VV, VW, VH, VE, [
    ...[0, 0.3, 0.5, 0.65, 0.77, 0.86, 0.93, 0.97, 1].map((s) => [s, 0, glassLift(s)]),
    [1, 0, glassLift(1)], // repeated so the glass edge and the rim get their own normals
    rimRing(-0.02, 0.03, 0, 0), rimRing(-0.006, 0.045, 0, 0.01), // a thin metal bead holds the glass
    rimRing(0.004, 0.05, 0, 0.015), rimRing(0.022, 0.07, 0.015, 0.04), rimRing(0.045, 0.075, 0.04, 0.05),
    rimRing(0.07, 0.058, 0.06, 0.04), rimRing(0.088, 0.024, 0.07, 0.015), rimRing(0.098, -0.02, 0.07, 0),
  ], [0, 9, 11], 160), [visorMat, metal, clay], head);
  const glassAt = (x, y) => glassLift(Math.min(1, (Math.abs(x / VW) ** VE + Math.abs(y / VH) ** VE) ** (1 / VE)));
  const faceOn = (obj, x, y, lift = 0.008) => { onSurface(helmet, VU, VV, x, y, glassAt(x, y) + lift, obj.position); orient(obj.quaternion, _n, _t); return obj; };

  const eyeGeo = new THREE.CapsuleGeometry(0.092, 0.11, 8, 24), sparkGeo = new THREE.SphereGeometry(0.024, 12, 12);
  const eyes = [-1, 1].map((s) => {
    const g = new THREE.Group(); head.add(g);
    g.add(new THREE.Mesh(eyeGeo, eyeMat));
    const spark = new THREE.Mesh(sparkGeo, sparkMat); spark.position.set(-0.03, 0.065, 0.075); g.add(spark);
    return { g, s };
  });
  const happyGeo = new THREE.TorusGeometry(0.1, 0.027, 10, 40, Math.PI);
  const happy = [-1, 1].map(() => { const m = new THREE.Mesh(happyGeo, eyeMat); m.visible = false; head.add(m); return m; });
  const blushGeo = new THREE.CircleGeometry(0.1, 32);
  for (const s of [-1, 1]) { const m = faceOn(new THREE.Mesh(blushGeo, blushMat), s * 0.55, -0.17, 0.004); m.scale.set(1.3, 0.7, 1); head.add(m); }
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.02, 10, 48, Math.PI), smileMat); head.add(smile);

  // headphones: rubber cushion, cardinal cup, glowing ring and a brushed cap with concentric grooves; the left is a mirror
  const pod = new THREE.Group(); pod.position.x = 1.02; head.add(pod);
  const ax = new THREE.Group(); ax.rotation.z = -Math.PI / 2; pod.add(ax);
  add(new THREE.TorusGeometry(0.27, 0.075, 16, 64), rubber, ax, 0, 0.05).rotation.x = Math.PI / 2;
  add(lathe([[0.24, 0.06], [0.335, 0.075], [0.36, 0.11], [0.365, 0.17], [0.35, 0.22], [0.31, 0.25], [0.285, 0.255]]), red, ax);
  add(new THREE.TorusGeometry(0.29, 0.015, 10, 72), cardMat, ax, 0, 0.255).rotation.x = Math.PI / 2;
  add(lathe([[0.275, 0.245], [0.262, 0.262], [0.2, 0.275], [0.1, 0.282], [0.001, 0.284]], 64), capMetal, ax);
  const podL = pod.clone(); podL.scale.x = -1; podL.position.x = -1.02; head.add(podL);
  // a band leaning back over the crown, with a stitched cushion under it
  const loop2 = (rc, hr, hw) => Array.from({ length: 41 }, (_, i) => { const a = (i / 40) * TAU, c = Math.cos(a), s = Math.sin(a); return [rc + hr * Math.sign(c) * Math.abs(c) ** 0.5, hw * Math.sign(s) * Math.abs(s) ** 0.5]; });
  const band = add(new THREE.LatheGeometry(loop2(1.065, 0.035, 0.12).map(([r, y]) => V2(r, y)), 96, Math.PI / 2, Math.PI), clay, head);
  band.rotation.x = Math.PI / 2 - 0.3; band.scale.x = 1.1;
  const cushion = add(new THREE.LatheGeometry(loop2(1.005, 0.03, 0.075).map(([r, y]) => V2(r, y)), 64, Math.PI / 2 + 0.55, Math.PI - 1.1), fabric, head);
  cushion.rotation.copy(band.rotation); cushion.scale.x = 1.1;
  // mic boom on the left cup
  const boom = new THREE.CatmullRomCurve3([[-1.2, -0.18, 0.1], [-1.16, -0.48, 0.42], [-0.92, -0.7, 0.7], [-0.56, -0.76, 0.84]].map(([x, y, z]) => new THREE.Vector3(x, y, z)));
  add(new THREE.TubeGeometry(boom, 48, 0.024, 8), graphite, head);
  const mic = new THREE.Group(); mic.position.copy(boom.getPoint(1)); mic.quaternion.setFromUnitVectors(_y.set(0, 1, 0), boom.getTangent(1)); head.add(mic);
  add(new THREE.CapsuleGeometry(0.046, 0.08, 4, 16), red, mic);
  add(new THREE.SphereGeometry(0.024, 12, 12), roseMat, mic, 0, 0.07);
  // neck seal where the shell ends
  const seal = add(new THREE.TorusGeometry(Math.sin(OPEN) + 0.02, 0.04, 12, 72), rubber, head, 0, Math.cos(OPEN) * 0.97 + 0.01, 0); seal.rotation.x = Math.PI / 2; seal.scale.set(1.08, 1, 1);

  // antenna on a spring: socket, coil, stalk and a glowing tip, sprouting just ahead of the band
  const antBase = new THREE.Group(); head.add(antBase);
  onSurface(helmet, 0.57, 0.82, 0, 0, -0.005, antBase.position); antBase.quaternion.setFromUnitVectors(_y.set(0, 1, 0), _n.add(_s.set(0, 1.5, 0)).normalize());
  const ant = new THREE.Group(); antBase.add(ant);
  add(lathe([[0.08, -0.02], [0.082, 0.02], [0.06, 0.045], [0.032, 0.055]], 32), metal, antBase);
  add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({ length: 41 }, (_, i) => new THREE.Vector3(Math.cos(i * 0.9) * 0.03, 0.05 + i * 0.003, Math.sin(i * 0.9) * 0.03))), 120, 0.008, 6), metal, ant);
  add(new THREE.CylinderGeometry(0.012, 0.016, 0.46, 10), clay, ant, 0, 0.28);
  add(new THREE.TorusGeometry(0.03, 0.01, 8, 24), metal, ant, 0, 0.5).rotation.x = Math.PI / 2;
  add(new THREE.SphereGeometry(0.07, 32, 24), cardMat, ant, 0, 0.56, 0, false);

  // screws: a few brushed rivets on the visor rim and the chest plate, one instanced draw each
  const screwGeo = new THREE.SphereGeometry(1, 10, 6, 0, TAU, 0, Math.PI / 2).rotateX(Math.PI / 2);
  const screws = (parent, placements) => {
    const im = new THREE.InstancedMesh(screwGeo, metal, placements.length); parent.add(im);
    placements.forEach(([S, u0, v0, x, y, lift], i) => { onSurface(S, u0, v0, x, y, lift, _b); orient(_q, _n, _t); im.setMatrixAt(i, _m.compose(_b, _q, _s.set(0.026, 0.026, 0.012))); });
    return im;
  };
  const rimPt = (a) => { const o = outline(a, VW, VH, VE, _p), b = Math.max(0, Math.sin(a)) ** 2, k = 1 + (0.045 + 0.04 * b) / Math.hypot(o.x, o.y); return [helmet, VU, VV, o.x * k, o.y * k, 0.074 + 0.05 * b]; };
  const headScrews = screws(head, [0.8, 2.34, 3.94, 5.48].map(rimPt));
  const bodyScrews = screws(body, [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sy]) => [bust, 0.5, chestV, sx * 0.44, sy * 0.37, plateLift]));

  // floating shapes at different depths, shifting with the pointer
  const floaters = [
    [new THREE.TorusGeometry(0.34, 0.12, 32, 96), clay, [-3.3, 1.3, -1.2], 0.6],
    [new THREE.IcosahedronGeometry(0.34, 1), visorMat, [3.2, -0.3, -0.6], 1.0],
    [new THREE.SphereGeometry(0.16, 32, 24), cardMat, [2.5, 1.8, -2.2], 0.35],
    [new THREE.OctahedronGeometry(0.26, 0), red, [-3.8, -2.3, 0.4], 1.4],
    [new THREE.SphereGeometry(0.1, 24, 16), roseMat, [-1.8, 2.15, -1.6], 0.5],
    [new THREE.TorusKnotGeometry(0.16, 0.05, 128, 16), clay, [3.6, 2.2, -2.6], 0.4],
  ].map(([g, m, p, d]) => { const o = new THREE.Mesh(g, m); o.position.set(...p); scene.add(o); return { o, bx: p[0], by: p[1], d, ph: Math.random() * 6 }; });

  let tx = 0, ty = 0, rx = 0, ry = 0, hover = 0, hoverT = 0, blinkAt = 2, joyUntil = -1, hopV = 0, hopY = 0, antV = 0, antA = 0, lastRy = 0, t0 = 0;
  const onMove = (e) => {
    const r = host.getBoundingClientRect(); tx = ((e.clientX - r.left) / r.width - 0.5) * 2; ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    hoverT = Math.hypot(tx * 1.6, ty + 0.15) < 0.32 ? 1 : 0;
  };
  const onLeave = () => { tx = 0; ty = 0; hoverT = 0; };
  const onClick = (e) => { if (e.target.closest('a, button')) return; joyUntil = t0 + 1.4; hopV = reduce ? 0 : 3.2; };
  host.addEventListener('pointermove', onMove); host.addEventListener('pointerleave', onLeave); host.addEventListener('click', onClick);

  const stop = loop(host, (t, dt) => {
    t0 = t;
    const k = reduce ? 1 : 1 - Math.exp(-dt * 4.5), idle = reduce ? 0 : 1;
    ry += (tx * 0.5 - ry) * k; rx += (ty * 0.28 - rx) * k; hover += (hoverT - hover) * Math.min(1, dt * 7);
    head.rotation.set(rx + idle * Math.sin(t * 0.9) * 0.02, ry, -ry * 0.1 + idle * Math.sin(t * 0.7) * 0.03);
    rig.rotation.y = ry * 0.2;
    // the camera drifts a touch the other way, so the bust's depth reads against the floaters
    cx += (-tx * 0.3 * idle - cx) * k; cy += (ty * 0.16 * idle - cy) * k;
    camera.position.set(cx, 0.1 + cy, camZ); camera.lookAt(0, -0.45, 0);
    if (t > blinkAt) blinkAt = t + 2.4 + Math.random() * 3;
    const closed = blinkAt - t < 0.12 ? 1 - (blinkAt - t) / 0.12 : 0;
    const joy = t < joyUntil, gx = tx * 0.22, gy = -ty * 0.16;
    for (let i = 0; i < 2; i++) { const { g, s } = eyes[i]; g.visible = !joy; faceOn(g, s * 0.34 + gx, 0.07 + gy); g.scale.set(1, Math.max(0.08, (1 - closed) * (1 - hover * 0.3)), 1); }
    for (let i = 0; i < 2; i++) { happy[i].visible = joy; faceOn(happy[i], (i ? 1 : -1) * 0.34 + gx, 0.09 + gy); }
    faceOn(smile, gx * 0.6, -0.21 + gy * 0.6).rotateZ(Math.PI);
    const grin = joy ? 1 : 0.35 + hover * 0.65; smile.scale.set(grin, grin, 1); smileMat.opacity = 0.5 + hover * 0.5;
    blushMat.opacity = 0.3 + hover * 0.35 + (joy ? 0.2 : 0);
    hopV -= (72 * hopY + 6 * hopV) * dt; hopY += hopV * dt;
    const breathe = idle * Math.sin(t * 1.6);
    rig.position.y = hopY * 0.12 + breathe * 0.025; body.scale.set(1 + breathe * 0.003, 1 + breathe * 0.005, 1 + breathe * 0.008);
    chestRing.scale.setScalar(1 + idle * Math.sin(t * 2.2) * 0.08);
    const turn = (ry - lastRy) / Math.max(dt, 0.001); lastRy = ry;
    antV += (-120 * antA - 9 * antV - turn * 6 * idle) * dt; antA += antV * dt; ant.rotation.z = Math.max(-0.6, Math.min(0.6, antA)) - 0.12;
    for (let i = 0; i < floaters.length; i++) { const f = floaters[i]; f.o.position.x = f.bx - tx * 0.35 * f.d; f.o.position.y = f.by + ty * 0.25 * f.d + idle * Math.sin(t * 0.8 + f.ph) * 0.12; f.o.rotation.x = idle * t * 0.3 + f.ph; f.o.rotation.y = idle * t * 0.4; }
    composer.render();
  });
  const fitCam = () => { camZ = canvas.clientWidth < 760 ? 13.5 : 10.5; };
  addEventListener('resize', fitCam); fitCam();
  return () => {
    stop(); removeEventListener('resize', fitCam); host.removeEventListener('pointermove', onMove); host.removeEventListener('pointerleave', onLeave); host.removeEventListener('click', onClick);
    headScrews.dispose(); bodyScrews.dispose(); key.dispose(); maps.forEach((m) => m.dispose()); dispose();
  };
}

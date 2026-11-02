// HackBama scene: an electric race car follows a glowing racing line around an autocross course, driven by scroll.
// Everything is modelled and textured in code: a lofted body, extruded wings, lathed tyres, canvas-drawn livery, carbon and asphalt.
import { THREE, stage, loop, tick, player, glow, additive, ss, radialTexture, reduce as reduceQ } from './stage.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const reduce = reduceQ();
const V3 = THREE.Vector3;
const INK = '#0B0909', IVORY = '#F3EDE4', SAND = '#D4A574', CARDINAL = '#8C1515', CARDINAL_LIGHT = '#B83A3A';
const N = 700, RS = 6;                    // racing-line segments and tube sides
const HALF = 0.92, CONE_OFFSET = 1.0;     // track half-width; cones either side of the line
const R = 0.088, TW = 0.075;              // wheel radius and tyre width
const AXLES = [0.27, -0.29], TRACK = 0.2; // axle positions along the car, half the track width
const CHASE = { back: 4.0, up: 2.2, ahead: 1.4 }, CHASE_TALL = { back: 4.4, up: 2.3, ahead: 2.0 }; // portrait screens frame the car lower, under the HUD
const clamp = (x, a) => Math.max(-a, Math.min(a, x));
const wrapPi = (a) => a - Math.PI * 2 * Math.round(a / (Math.PI * 2));
// seeded noise, so the generated textures are identical on every visit
const rng = (seed) => () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

/* ---------- textures, drawn once on canvases ---------- */

function asphalt(g, w, h, seed) {
  const r = rng(seed), img = g.createImageData(w, h), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = 90 + (r() - 0.5) * 50 + (r() < 0.03 ? r() * 80 : 0) - (r() < 0.03 ? 35 : 0);
    d[i] = v + 5; d[i + 1] = v; d[i + 2] = v - 4; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  for (let k = 0; k < 30; k++) { // soft wear patches, repeated across the edges so the tile stays seamless
    const x = r() * w, y = r() * h, rad = 20 + r() * 80, a = 0.06 + r() * 0.1, col = r() < 0.65 ? '0,0,0' : '255,236,220';
    for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) {
      const gr = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, rad);
      gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`);
      g.fillStyle = gr; g.fillRect(x + ox - rad, y + oy - rad, rad * 2, rad * 2);
    }
  }
}

function trackSurface(g, w, h) { // u runs across the track, v along it: asphalt with worn chalk edge lines
  asphalt(g, w, h, 11);
  const r = rng(5);
  for (const x0 of [0.04, 0.96]) for (let y = 0; y < h; y += 2) { g.fillStyle = `rgba(243,237,228,${0.3 + r() * 0.4})`; g.fillRect(x0 * w - 3, y, 6, 2); }
}

function carbon(g, w, h) { // 2x2 twill: each tow shaded across its width
  const s = 16;
  for (let i = 0; i < w / s; i++) for (let j = 0; j < h / s; j++) {
    const x = i * s, y = j * s, gr = ((i + j) & 3) < 2 ? g.createLinearGradient(x, y, x, y + s) : g.createLinearGradient(x, y, x + s, y);
    gr.addColorStop(0, '#08080a'); gr.addColorStop(0.5, '#232327'); gr.addColorStop(1, '#08080a');
    g.fillStyle = gr; g.fillRect(x, y, s, s);
  }
}

// Body livery. u runs round the section (0 belly, .25 left flank, .5 top, .75 right flank); v runs from the tail (canvas bottom) to the nose (top).
function livery(g, w, h) {
  g.fillStyle = IVORY; g.fillRect(0, 0, w, h);
  g.fillStyle = CARDINAL; g.fillRect(0, 0, w * 0.17, h); g.fillRect(w * 0.83, 0, w * 0.17, h);
  g.fillStyle = SAND; g.fillRect(w * 0.17, 0, 6, h); g.fillRect(w * 0.83 - 6, 0, 6, h);
  const chevron = (dy) => { g.beginPath(); g.moveTo(w * 0.17, 0); g.lineTo(w * 0.83, 0); g.lineTo(w * 0.83, h * 0.22 + dy); g.lineTo(w * 0.5, h * 0.4 + dy); g.lineTo(w * 0.17, h * 0.22 + dy); g.fill(); };
  g.fillStyle = SAND; chevron(12); g.fillStyle = CARDINAL; chevron(0);
  g.fillStyle = CARDINAL_LIGHT; g.fillRect(w * 0.475, h * 0.62, 9, h * 0.38); g.fillRect(w * 0.525 - 9, h * 0.62, 9, h * 0.38);
}

function podLivery(g, w, h) { // same layout as the body; a number roundel on each flank, drawn turned and stretched to sit square on the pod
  g.fillStyle = CARDINAL; g.fillRect(0, 0, w, h);
  g.fillStyle = '#5a0c0c'; g.fillRect(0, 0, w * 0.13, h); g.fillRect(w * 0.87, 0, w * 0.13, h);
  g.fillStyle = SAND; g.fillRect(w * 0.36, 0, 5, h); g.fillRect(w * 0.64 - 5, 0, 5, h);
  const ku = w / 0.8, kv = h / 0.4; // texels per unit round the section and along the pod
  for (const [u, dir] of [[0.25, 1], [0.75, -1]]) {
    g.save(); g.translate(w * u, h * 0.55); g.rotate((dir * Math.PI) / 2); g.scale(kv / ku, 1);
    g.fillStyle = IVORY; g.beginPath(); g.roundRect(-50, -36, 100, 72, 14); g.fill();
    g.fillStyle = INK; g.font = '800 60px "Bricolage Grotesque", system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('01', 0, 3);
    g.restore();
  }
}

const bands = (g, w, h, body, band) => { g.fillStyle = body; g.fillRect(0, 0, w, h); g.fillStyle = band; g.fillRect(0, h * 0.3, w, h * 0.13); g.fillRect(0, h * 0.56, w, h * 0.1); };
const cone = (col) => (g, w, h) => { bands(g, w, h, col, '#e2dbd1'); g.fillStyle = '#121010'; g.fillRect(0, h * 0.95, w, h * 0.05); };

function carShadow(g, w, h) { // shapes drawn off-canvas so only their blurred shadows land on it
  g.fillStyle = '#000'; g.shadowColor = '#000'; g.shadowOffsetX = w * 2;
  g.shadowBlur = 26; g.beginPath(); g.roundRect(w * 0.27 - w * 2, h * 0.1, w * 0.46, h * 0.8, 40); g.fill();
  g.shadowBlur = 10;
  for (const [x, y] of [[0.18, 0.27], [0.82, 0.27], [0.18, 0.74], [0.82, 0.74]]) { g.beginPath(); g.ellipse(w * x - w * 2, h * y, w * 0.06, h * 0.06, 0, 0, Math.PI * 2); g.fill(); }
}
const blob = (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(0,0,0,0.75)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); };
const across = (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#000'); gr.addColorStop(0.5, '#fff'); gr.addColorStop(1, '#000'); g.fillStyle = gr; g.fillRect(0, 0, w, h); };
function rubber(g, w, h) { const r = rng(3); for (let y = 0; y < h; y++) for (const x0 of [0.1, 0.77]) { g.fillStyle = `rgba(0,0,0,${0.25 + r() * 0.5})`; g.fillRect(x0 * w, y, 0.13 * w, 1); } }

function textures(aniso) {
  const list = [];
  const make = (w, h, draw, wrap = false) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso;
    if (wrap) t.wrapS = t.wrapT = THREE.RepeatWrapping;
    list.push(t); return t;
  };
  const T = {
    ground: make(512, 512, (g, w, h) => asphalt(g, w, h, 7), true), track: make(256, 512, trackSurface, true), carbon: make(256, 256, carbon, true),
    livery: make(1024, 512, livery), pods: make(1024, 256, podLivery),
    coneSand: make(64, 256, cone(SAND)), coneCardinal: make(64, 256, cone(CARDINAL_LIGHT)), coneBands: make(64, 256, (g, w, h) => bands(g, w, h, '#000', '#fff')),
    chequer: make(256, 32, (g, w, h) => { for (let i = 0; i < w / 16; i++) for (let j = 0; j < h / 16; j++) { g.fillStyle = (i + j) & 1 ? IVORY : '#1a1414'; g.fillRect(i * 16, j * 16, 16, 16); } }),
    shadow: make(256, 512, carShadow), blob: make(64, 64, blob), across: make(64, 4, across), rubber: make(64, 256, rubber, true), glow: radialTexture(),
  };
  list.push(T.glow);
  T.ground.repeat.set(40, 40); T.carbon.repeat.set(10, 10);
  return { T, list };
}

function materials(T) {
  const paint = (o) => new THREE.MeshPhysicalMaterial({ clearcoat: 1, clearcoatRoughness: 0.24, roughness: 0.42, ...o });
  const std = (o) => new THREE.MeshStandardMaterial(o);
  return {
    body: paint({ map: T.livery, color: 0xe2dad0 }), pods: paint({ map: T.pods }), cardinal: paint({ color: 0x8c1515, roughness: 0.3 }),
    carbon: paint({ map: T.carbon, roughness: 0.5, metalness: 0.2, clearcoat: 0.35 }),
    glass: paint({ color: 0x1c0e0e, roughness: 0.22, metalness: 0.2, clearcoatRoughness: 0.3 }),
    black: std({ color: 0x0c0a0a, roughness: 0.55, metalness: 0.2, side: THREE.DoubleSide }),
    rubber: std({ color: 0x151213, roughness: 0.9 }), rim: std({ color: 0xb98d5f, metalness: 0.9, roughness: 0.32 }),
    steel: std({ color: 0x9a948e, metalness: 1, roughness: 0.35 }), sand: std({ color: 0xd4a574, roughness: 0.55 }),
    head: glow(0xffe6c8, 3.2), tail: glow(0xff0804, 1.6),
  };
}

/* ---------- geometry builders ---------- */

// Catmull-Rom through key sections [z, half-width, height above centre, depth below centre, centre y]
function profile(keys, z) {
  let k = 0; while (k < keys.length - 2 && z > keys[k + 1][0]) k++;
  const a = keys[Math.max(0, k - 1)], b = keys[k], c = keys[k + 1], d = keys[Math.min(keys.length - 1, k + 2)];
  const t = (z - b[0]) / (c[0] - b[0]), t2 = t * t, t3 = t2 * t;
  return b.map((_, i) => 0.5 * (2 * b[i] + (c[i] - a[i]) * t + (2 * a[i] - 5 * b[i] + 4 * c[i] - d[i]) * t2 + (3 * b[i] - a[i] - 3 * c[i] + d[i]) * t3));
}

// A lofted shell of superellipse sections along z (uv.x round the section from the belly, uv.y tail to nose), capped at both ends as group 1.
function loft(keys, stations, segs, n) {
  const pos = [], uv = [], idx = [], ends = [], ring = segs + 1, e = 2 / n, z0 = keys[0][0], z1 = keys[keys.length - 1][0];
  for (let i = 0; i <= stations; i++) {
    const z = z0 + ((z1 - z0) * i) / stations, [, w, ht, hb, yc] = profile(keys, z);
    ends.push([z, yc]);
    for (let j = 0; j <= segs; j++) {
      const a = (j / segs) * Math.PI * 2, s = Math.sin(a), c = -Math.cos(a), y = Math.sign(c) * Math.abs(c) ** e;
      pos.push(Math.sign(s) * Math.abs(s) ** e * Math.max(w, 0.003), yc + y * Math.max(y > 0 ? ht : hb, 0.003), z);
      uv.push(j / segs, i / stations);
      if (i < stations && j < segs) { const k = i * ring + j; idx.push(k, k + 1, k + ring, k + 1, k + ring + 1, k + ring); }
    }
  }
  const sides = idx.length;
  for (const [i, back] of [[0, true], [stations, false]]) { // caps on their own vertices, so the shell's normals stay smooth
    const c = pos.length / 3; pos.push(0, ends[i][1], ends[i][0]); uv.push(0.5, 0.5);
    for (let j = 0; j <= segs; j++) { const q = (i * ring + j) * 3; pos.push(pos[q], pos[q + 1], pos[q + 2]); uv.push(0.5, 0.5); }
    for (let j = 0; j < segs; j++) back ? idx.push(c, c + j + 2, c + j + 1) : idx.push(c, c + j + 1, c + j + 2);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx);
  geo.addGroup(0, sides, 0); geo.addGroup(sides, idx.length - sides, 1); geo.computeVertexNormals();
  return geo;
}

function shape(pts) { return new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y))); }

function foilGeometry() { // unit-chord inverted aerofoil, unit span centred on x, leading edge at z = 0, trailing edge at z = -1
  const s = new THREE.Shape();
  s.moveTo(0, 0); s.bezierCurveTo(0, -0.08, 0.3, -0.11, 0.55, -0.075); s.bezierCurveTo(0.8, -0.045, 0.95, -0.015, 1, 0);
  s.lineTo(1, 0.012); s.bezierCurveTo(0.7, 0.02, 0.3, 0.045, 0.08, 0.04); s.bezierCurveTo(0.02, 0.035, 0, 0.02, 0, 0);
  return new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false, curveSegments: 8 }).rotateY(Math.PI / 2).translate(-0.5, 0, 0);
}

function plateGeometry() { // unit endplate: chord 1 back from z = 0, 0.55 tall, thin in x
  const s = new THREE.Shape(), w = 1, h = 0.55, r = 0.1;
  s.moveTo(r, 0); s.lineTo(w - r, 0); s.quadraticCurveTo(w, 0, w, r); s.lineTo(w, h - r); s.quadraticCurveTo(w, h, w - r, h);
  s.lineTo(r, h); s.quadraticCurveTo(0, h, 0, h - r); s.lineTo(0, r); s.quadraticCurveTo(0, 0, r, 0);
  return new THREE.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: false, curveSegments: 4 }).rotateY(Math.PI / 2).translate(-0.02, 0, 0);
}

function wheelGeometries() { // one wheel, outer face toward +x
  const hw = TW / 2, rr = 0.058;
  const tyre = new THREE.LatheGeometry([[rr, -hw * 0.9], [R * 0.86, -hw], [R - 0.007, -hw * 0.94], [R, -hw * 0.66], [R, hw * 0.66], [R - 0.007, hw * 0.94], [R * 0.86, hw], [rr, hw * 0.9]]
    .map(([x, y]) => new THREE.Vector2(x, y)), 40).rotateZ(-Math.PI / 2);
  const face = new THREE.Shape().absarc(0, 0, rr, 0, Math.PI * 2, false);
  for (let k = 0; k < 6; k++) { // six spokes of constant width
    const a = (k / 6) * Math.PI * 2, b = a + Math.PI / 3, ro = rr * 0.84, ri = rr * 0.36, sw = 0.0055, hole = new THREE.Path();
    hole.absarc(0, 0, ro, a + sw / ro, b - sw / ro, false); hole.absarc(0, 0, ri, b - sw / ri, a + sw / ri, true); face.holes.push(hole);
  }
  return {
    tyre,
    rim: new THREE.ExtrudeGeometry(face, { depth: 0.008, bevelEnabled: false, curveSegments: 6 }).rotateY(Math.PI / 2).translate(hw - 0.02, 0, 0),
    barrel: new THREE.CylinderGeometry(rr * 0.97, rr * 0.97, TW * 0.82, 28, 1, true).rotateZ(Math.PI / 2),
    disc: new THREE.CylinderGeometry(0.043, 0.043, 0.006, 28).rotateZ(Math.PI / 2),
    nut: new THREE.CylinderGeometry(0.011, 0.011, 0.014, 10).rotateZ(Math.PI / 2).translate(hw - 0.008, 0, 0),
    band: new THREE.RingGeometry(R * 0.8, R * 0.86, 40).rotateY(Math.PI / 2).translate(hw + 0.0012, 0, 0),
    caliper: new THREE.BoxGeometry(0.014, 0.024, 0.034).translate(-0.006, 0.036, -0.012),
  };
}

function suspension() { // upper and lower wishbones on each corner, merged into one mesh
  const rod = new THREE.CylinderGeometry(0.0045, 0.0045, 1, 5), parts = [], m = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new V3(0, 1, 0);
  for (const z of AXLES) for (const sx of [1, -1]) for (const [y0, y1] of [[0.15, 0.115], [0.07, 0.065]]) for (const dz of [0.055, -0.055]) {
    const a = new V3(sx * 0.085, y0, z + dz), b = new V3(sx * 0.17, y1, z), d = b.clone().sub(a);
    parts.push(rod.clone().applyMatrix4(m.compose(a.add(b).multiplyScalar(0.5), q.setFromUnitVectors(up, d.clone().normalize()), new V3(1, d.length(), 1))));
  }
  const geo = mergeGeometries(parts); parts.forEach((p) => p.dispose()); rod.dispose();
  return geo;
}

const TUB = [[-0.43, 0.06, 0.04, 0.03, 0.115], [-0.34, 0.08, 0.07, 0.045, 0.12], [-0.16, 0.098, 0.105, 0.06, 0.12], [-0.02, 0.105, 0.072, 0.065, 0.12],
  [0.14, 0.092, 0.06, 0.06, 0.115], [0.32, 0.062, 0.045, 0.045, 0.1], [0.46, 0.034, 0.026, 0.026, 0.078], [0.54, 0.01, 0.008, 0.008, 0.068]];
const PODS = [[-0.25, 0.11, 0.03, 0.028, 0.083], [-0.14, 0.165, 0.05, 0.034, 0.088], [0, 0.19, 0.058, 0.035, 0.09], [0.1, 0.188, 0.055, 0.035, 0.09], [0.15, 0.18, 0.05, 0.035, 0.09]];

const part = (parent, geo, mat, [x, y, z] = [0, 0, 0], [sx, sy, sz] = [1, 1, 1], rx = 0) => {
  const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.rotation.x = rx; parent.add(o); return o;
};

function aero(body, M) { // wings, endplates, pylons, floor and lights
  const foil = foilGeometry(), plate = plateGeometry(), box = new THREE.BoxGeometry(1, 1, 1);
  part(body, foil, M.cardinal, [0, 0.262, -0.33], [0.38, 0.11, 0.11], 0.12);
  part(body, foil, M.sand, [0, 0.292, -0.425], [0.38, 0.06, 0.06], 0.55);
  part(body, foil, M.carbon, [0, 0.03, 0.6], [0.47, 0.1, 0.1], 0.05);
  part(body, foil, M.cardinal, [0, 0.045, 0.52], [0.44, 0.055, 0.055], 0.4);
  for (const sx of [1, -1]) {
    part(body, plate, M.carbon, [sx * 0.194, 0.215, -0.31], [0.2, 0.2, 0.2]);
    part(body, plate, M.cardinal, [sx * 0.236, 0.012, 0.6], [0.12, 0.12, 0.12]);
    part(body, box, M.tail, [sx * 0.194, 0.27, -0.512], [0.01, 0.09, 0.006]);
    part(body, box, M.carbon, [sx * 0.045, 0.2, -0.36], [0.008, 0.13, 0.06]);
    part(body, box, M.carbon, [sx * 0.025, 0.055, 0.52], [0.006, 0.04, 0.04]);
    part(body, box, M.head, [sx * 0.054, 0.098, 0.37], [0.004, 0.007, 0.045]);
  }
  part(body, box, M.tail, [0, 0.112, -0.433], [0.05, 0.02, 0.01]);
  const floor = shape([[-0.06, 0.42], [0.06, 0.42], [0.2, 0.16], [0.2, -0.18], [0.15, -0.24], [0.13, -0.38], [-0.13, -0.38], [-0.15, -0.24], [-0.2, -0.18], [-0.2, 0.16]]);
  part(body, new THREE.ExtrudeGeometry(floor, { depth: 0.008, bevelEnabled: false }).rotateX(Math.PI / 2), M.carbon, [0, 0.052, 0]);
}

function buildCar(T, M) {
  const car = new THREE.Group(), body = new THREE.Group(), fronts = [], spins = [];
  car.add(body);
  part(body, loft(TUB, 44, 36, 2.5), [M.body, M.black]);
  part(body, loft(PODS, 18, 28, 3), [M.pods, M.black]);
  part(body, new THREE.SphereGeometry(1, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2), M.glass, [0, 0.186, 0.02], [0.072, 0.066, 0.16]);
  aero(body, M);
  part(car, suspension(), M.black);
  const G = wheelGeometries();
  for (const z of AXLES) for (const sx of [1, -1]) {
    const corner = new THREE.Group(), spin = new THREE.Group();
    corner.position.set(sx * TRACK, R, z); corner.scale.x = sx; // mirrored on the right so the sidewall band faces out
    [[G.tyre, M.rubber], [G.band, M.sand], [G.rim, M.rim], [G.barrel, M.black], [G.disc, M.steel], [G.nut, M.cardinal]].forEach(([g, m]) => part(spin, g, m));
    corner.add(spin); part(corner, G.caliper, M.cardinal); car.add(corner);
    spins.push(spin); if (z > 0) fronts.push(corner);
  }
  // soft contact shadow and a rose glow on the ground, turning with the car but not rolling with the body
  part(car, new THREE.PlaneGeometry(1.5, 1.9).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial(additive({ map: T.glow, color: 0xb83a3a, opacity: 0.22, fog: false })), [0, 0.01, 0]).renderOrder = 1;
  part(car, new THREE.PlaneGeometry(0.62, 1.15).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: T.shadow, color: 0, transparent: true, opacity: 0.85, depthWrite: false }), [0, 0.012, 0]).renderOrder = 2;
  return { car, body, fronts, spins };
}

/* ---------- the course ---------- */

// A flat strip along the curve: uv.x across (0..1), uv.y along in units of vLen; optional per-vertex alpha.
function ribbon(curve, half, y, vLen, alphaAt) {
  const pos = [], uv = [], nor = [], col = [], idx = [], L = curve.getLength(), p = new V3(), t = new V3();
  for (let i = 0; i <= N; i++) {
    const u = i / N; curve.getPointAt(u, p); curve.getTangentAt(u, t);
    pos.push(p.x - t.z * half, y, p.z + t.x * half, p.x + t.z * half, y, p.z - t.x * half);
    uv.push(0, (u * L) / vLen, 1, (u * L) / vLen); nor.push(0, 1, 0, 0, 1, 0);
    if (alphaAt) { const a = alphaAt(u); col.push(1, 1, 1, a, 1, 1, 1, a); }
    if (i < N) { const k = i * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  if (alphaAt) geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 4));
  geo.setIndex(idx);
  return geo;
}

function cones(scene, curve, T) {
  const shell = new THREE.CylinderGeometry(0.012, 0.066, 0.23, 18).translate(0, 0.129, 0), base = new THREE.BoxGeometry(0.17, 0.014, 0.17).translate(0, 0.007, 0);
  base.attributes.uv.array.fill(0.02); // the base samples the dark foot of the cone texture
  const geo = mergeGeometries([shell, base]); shell.dispose(); base.dispose();
  const mat = (map) => new THREE.MeshStandardMaterial({ map, roughness: 0.55, emissive: 0xf3ede4, emissiveMap: T.coneBands, emissiveIntensity: 0.07 });
  const sides = [new THREE.InstancedMesh(geo, mat(T.coneSand), 90), new THREE.InstancedMesh(geo, mat(T.coneCardinal), 90)];
  const shadows = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.36, 0.36).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: T.blob, color: 0, transparent: true, depthWrite: false }), 180);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), one = new V3(1, 1, 1), at = new V3(), p = new V3(), t = new V3(), yAxis = new V3(0, 1, 0), r = rng(9);
  for (let i = 0; i < 90; i++) {
    curve.getPointAt(i / 90, p); curve.getTangentAt(i / 90, t);
    [1, -1].forEach((s, k) => {
      at.set(p.x - t.z * s * CONE_OFFSET, 0, p.z + t.x * s * CONE_OFFSET);
      sides[k].setMatrixAt(i, m.compose(at, q.setFromAxisAngle(yAxis, r() * Math.PI), one));
      shadows.setMatrixAt(i * 2 + k, m.compose(at.set(at.x + 0.035, 0.011, at.z - 0.022), q.identity(), one)); // falls away from the key light
    });
  }
  shadows.renderOrder = 1;
  scene.add(shadows, ...sides);
  return [shadows, ...sides];
}

function course(scene, curve, T) {
  const L = curve.getLength(), t1 = new V3(), t2 = new V3();
  const bend = (u) => { curve.getTangentAt(u, t1); curve.getTangentAt((u + 0.004) % 1, t2); return wrapPi(Math.atan2(t2.x, t2.z) - Math.atan2(t1.x, t1.z)) / (0.004 * L); };
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(160, 160).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: T.ground, color: 0x2e2727, roughness: 0.95 }));
  const track = new THREE.Mesh(ribbon(curve, HALF, 0.004, HALF * 2), new THREE.MeshStandardMaterial({ map: T.track, color: 0x4a3f3f, roughness: 0.7 }));
  // rubber laid down by earlier laps, heavier where the line bends
  const marks = new THREE.Mesh(ribbon(curve, 0.3, 0.006, 1.2, (u) => 0.15 + 0.6 * Math.min(1, Math.abs(bend(u)) * 1.4)),
    new THREE.MeshBasicMaterial({ map: T.rubber, color: 0x050303, vertexColors: true, transparent: true, depthWrite: false }));
  // the racing line: a hot tube that cools from sand-white at the car to cardinal behind it, over a soft spill of light on the asphalt
  const spillGeo = ribbon(curve, 0.32, 0.008, 1), spill = new THREE.Mesh(spillGeo, new THREE.MeshBasicMaterial(additive({ map: T.across, color: 0xd44444, opacity: 0.35, fog: false })));
  const lineGeo = new THREE.TubeGeometry(curve, N, 0.016, RS, true);
  const lineMat = new THREE.ShaderMaterial({
    uniforms: { uHead: { value: 0 }, uHot: { value: new THREE.Color(0xffb48a).multiplyScalar(2.1) }, uCool: { value: new THREE.Color(0xff5a4a).multiplyScalar(2.2) } },
    vertexShader: 'varying float vU; void main(){ vU = uv.x; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform float uHead; uniform vec3 uHot, uCool; varying float vU; void main(){ gl_FragColor = vec4(mix(uCool, uHot, smoothstep(uHead - 0.035, uHead, vU)), 1.0); }',
  });
  const line = new THREE.Mesh(lineGeo, lineMat); line.position.y = 0.028;
  // chequered start/finish strip across the track where the line begins
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(HALF * 2, 0.14).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: T.chequer, color: 0x8a817a, roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -2 }));
  curve.getPointAt(0, t1); curve.getTangentAt(0, t2); flag.position.set(t1.x, 0.005, t1.z); flag.rotation.y = Math.atan2(t2.x, t2.z);
  marks.renderOrder = 1; spill.renderOrder = 2;
  scene.add(ground, track, flag, marks, spill, line);
  return { bend, L, lineGeo, lineMat, spillGeo, instanced: cones(scene, curve, T) };
}

/* ---------- the scene ---------- */

export async function mountRace(wrap, canvas, card, prog, lap) {
  const { renderer, scene, camera, composer, warm, dispose } = stage(canvas, { bloom: [0.7, 0.5, 1.0], bg: 0x070505, env: 0.32 });
  scene.fog = new THREE.Fog(0x110a09, 9, 30);
  await tick(); // let a frame through between setup steps
  const { T, list } = textures(Math.min(8, renderer.capabilities.getMaxAnisotropy()));
  await tick();
  const M = materials(T);
  const pts = [[-7, 0], [-4.5, -3.5], [-0.5, -2.2], [2.5, -4.6], [7, -3], [7.5, 1], [4, 2.2], [1.5, 0.6], [-1.5, 3.8], [-6, 3.4]].map(([x, z]) => new V3(x, 0, z));
  const curve = new THREE.CatmullRomCurve3(pts, true, 'centripetal');
  const { bend, L, lineGeo, lineMat, spillGeo, instanced } = course(scene, curve, T);
  await tick();
  const { car, body, fronts, spins } = buildCar(T, M);
  await tick();
  scene.add(car);

  scene.add(new THREE.HemisphereLight(0xfff2e8, 0x1a0b0a, 0.3));
  const key = new THREE.DirectionalLight(0xfff0e0, 1.25); key.position.set(-6, 10, 4); scene.add(key);
  // rose rim: a narrow spot kept ahead of the car and aimed back at it, so it edges the car for the chase camera without tinting the whole lot
  const rim = new THREE.SpotLight(0xe8786c, 9, 10, 0.32, 1, 1.2); rim.target = car; scene.add(rim);
  const beam = new THREE.SpotLight(0xffe2c4, 2.2, 6, 0.5, 0.8, 1.4); beam.position.set(0, 0.13, 0.5); beam.target.position.set(0, 0, 2.5); car.add(beam, beam.target);

  // reduced motion holds the finished lap (the whole line, as the HUD reads 36.8 s) with the camera already at rest
  let p = reduce ? 1 : 0, prevS = -1, still = 0, w = 0, h = 0, speed = 0, roll = 0, pitch = 0, steer = 0, turn = 0;
  const pos = new V3(), tg = new V3(), aim = new V3(), camPos = new V3(0, 15, 11), look = new V3(), TOP = new V3(0, 15, 11), ORIGIN = new V3();
  const play = player(wrap, 4.5, p); // the lap plays in four and a half seconds, quicker while the reader keeps scrolling
  const stop = loop(wrap, (_, dt) => {
    const last = p, resized = canvas.width !== w || canvas.height !== h;
    p = reduce ? 1 : play.step(dt);
    w = canvas.width; h = canvas.height;
    const rewound = p < last; // back at the start for the next visit: no swoop or wheel spin carried over from the last lap
    if (rewound) { prevS = -1; speed = roll = pitch = steer = 0; }
    if (p !== last || resized) still = 0;
    else if (++still > 90) return; // everything has settled: keep the last frame rather than drawing it again
    const s = ss(0.06, 0.92, p), u = s % 1;
    curve.getPointAt(u, pos); curve.getTangentAt(u, tg);
    car.position.copy(pos); car.rotation.y = Math.atan2(tg.x, tg.z);

    // wheels roll with the distance covered, the fronts steer into the bend ahead, the body leans out of it and pitches with speed changes
    const ds = prevS < 0 ? 0 : (s - prevS) * L, v = dt > 0 ? ds / dt : 0;
    prevS = s; turn = bend((u + 0.01) % 1);
    for (let i = 0; i < spins.length; i++) spins[i].rotation.x += ds / R;
    steer += (clamp(Math.atan(0.56 * turn) * 1.4, 0.36) - steer) * 0.25;
    fronts[0].rotation.y = fronts[1].rotation.y = steer;
    roll += (0.06 * Math.tanh(speed * speed * turn * 0.004) - roll) * 0.12;
    pitch += (clamp((speed - v) * 0.004, 0.035) - pitch) * 0.1;
    speed += (v - speed) * 0.2;
    body.rotation.set(pitch, 0, roll);

    lineGeo.setDrawRange(0, Math.floor(s * N) * RS * 6); spillGeo.setDrawRange(0, Math.floor(s * N) * 6); lineMat.uniforms.uHead.value = s;
    rim.position.set(pos.x + tg.x * 3.5 + tg.z * 1.2, 2.4, pos.z + tg.z * 3.5 - tg.x * 1.2);

    const overview = Math.min(1, 1 - ss(0.02, 0.18, p) + ss(0.9, 1, p));
    const chase = camera.aspect < 0.8 ? CHASE_TALL : CHASE;
    aim.copy(pos).addScaledVector(tg, -chase.back); aim.y += chase.up;
    camPos.lerp(aim.lerp(TOP, overview), rewound ? 1 : 0.12);
    look.lerp(aim.copy(pos).addScaledVector(tg, chase.ahead).lerp(ORIGIN, overview), rewound ? 1 : 0.15);
    camera.position.copy(camPos); camera.lookAt(look);
    if (!reduce) lap.textContent = (36.8 * ss(0.06, 0.92, p)).toFixed(1) + ' s';
    const c = reduce ? 1 : ss(0.9, 0.99, p); card.style.opacity = c; card.style.transform = `translateY(${(1 - c) * 24}px)`;
    prog.style.height = p * 100 + '%';
    composer.render();
  }, warm(), { renderer, composer, max: renderer.getPixelRatio() });
  return () => { stop(); play.stop(); instanced.forEach((o) => o.dispose()); list.forEach((t) => t.dispose()); dispose(); };
}

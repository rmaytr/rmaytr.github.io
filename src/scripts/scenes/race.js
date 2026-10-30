// HackBama scene: a car follows a glowing racing line around a cone course, driven by scroll.
import { THREE, stage, loop, glow, additive, ss, scrollProgress, radialTexture, reduce as reduceQ } from './stage.js';

const reduce = reduceQ();

export function mountRace(wrap, canvas, card, prog, lap) {
  const { scene, camera, composer, dispose } = stage(canvas, { bloom: [0.7, 0.5, 1.0], bg: 0x070505, env: 0.35 });
  scene.fog = new THREE.Fog(0x070505, 10, 34);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x1a0808, 0.5));
  const sun = new THREE.DirectionalLight(0xfff0e0, 1.2); sun.position.set(-6, 10, 4); scene.add(sun);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ color: 0x120e0e, roughness: 0.92 })); ground.rotation.x = -Math.PI / 2; scene.add(ground);
  const grid = new THREE.GridHelper(80, 80, 0x3a1414, 0x1f1212); grid.position.y = 0.002; scene.add(grid);

  const pts = [[-7, 0], [-4.5, -3.5], [-0.5, -2.2], [2.5, -4.6], [7, -3], [7.5, 1], [4, 2.2], [1.5, 0.6], [-1.5, 3.8], [-6, 3.4]].map(([x, z]) => new THREE.Vector3(x, 0, z));
  const curve = new THREE.CatmullRomCurve3(pts, true, 'centripetal');
  const N = 700, linePts = curve.getSpacedPoints(N);
  // the track surface: a ribbon along the curve
  const rib = [], ribIdx = [];
  for (let i = 0; i <= N; i++) { const u = i / N, p = curve.getPointAt(u), tg = curve.getTangentAt(u), nx = -tg.z, nz = tg.x; rib.push(p.x + nx * 0.85, 0.004, p.z + nz * 0.85, p.x - nx * 0.85, 0.004, p.z - nz * 0.85); if (i < N) { const a = i * 2; ribIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(rib, 3)); rg.setIndex(ribIdx); rg.computeVertexNormals();
  scene.add(new THREE.Mesh(rg, new THREE.MeshStandardMaterial({ color: 0x1d1717, roughness: 0.8, side: THREE.DoubleSide })));
  // cones on both edges
  const coneGeo = new THREE.ConeGeometry(0.08, 0.26, 20), coneA = new THREE.MeshStandardMaterial({ color: 0xd4a574, roughness: 0.5 }), coneB = new THREE.MeshStandardMaterial({ color: 0xb83a3a, roughness: 0.5 });
  for (let i = 0; i < 90; i++) { const u = i / 90, p = curve.getPointAt(u), tg = curve.getTangentAt(u); [1, -1].forEach((s) => { const c = new THREE.Mesh(coneGeo, s > 0 ? coneA : coneB); c.position.set(p.x - tg.z * s * 1.0, 0.13, p.z + tg.x * s * 1.0); scene.add(c); }); }
  // the racing line, drawn in light behind the car
  const RS = 8, lg = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(linePts.map((q) => q.clone().setY(0.05)), true), N, 0.018, RS, true);
  scene.add(new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff5a4a).multiplyScalar(2.4), toneMapped: false })));
  // the car
  const car = new THREE.Group(); scene.add(car);
  const clay = new THREE.MeshPhysicalMaterial({ color: 0xc9c2ba, roughness: 0.35, clearcoat: 0.8 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.62, 8, 24), clay); body.rotation.x = Math.PI / 2; body.scale.set(1.25, 1, 0.55); body.position.y = 0.16; car.add(body);
  const cab = new THREE.Mesh(new THREE.SphereGeometry(0.14, 24, 16), new THREE.MeshPhysicalMaterial({ color: 0x0c0909, roughness: 0.1, clearcoat: 1 })); cab.scale.set(1, 0.6, 1.5); cab.position.set(0, 0.25, 0.02); car.add(cab);
  const wheelGeo = new THREE.CylinderGeometry(0.085, 0.085, 0.07, 24), tire = new THREE.MeshStandardMaterial({ color: 0x1a1414, roughness: 0.8 });
  [[0.2, 0.28], [-0.2, 0.28], [0.2, -0.28], [-0.2, -0.28]].forEach(([x, z]) => { const w = new THREE.Mesh(wheelGeo, tire); w.rotation.z = Math.PI / 2; w.position.set(x, 0.085, z); car.add(w); });
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.02), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xd44444).multiplyScalar(3), toneMapped: false })); tail.position.set(0, 0.18, -0.42); car.add(tail);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.03, 0.02), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffd8b0).multiplyScalar(2.5), toneMapped: false })); head.position.set(0, 0.17, 0.42); car.add(head);

  let p = reduce ? 0.5 : 0; const camPos = new THREE.Vector3(0, 14, 12), look = new THREE.Vector3();
  const stop = loop(wrap, () => {
    p += ((reduce ? 0.5 : scrollProgress(wrap)) - p) * 0.12;
    const u = ss(0.06, 0.92, p) % 1, pos = curve.getPointAt(u), tg = curve.getTangentAt(u);
    car.position.copy(pos); car.lookAt(pos.clone().add(tg));
    lg.setDrawRange(0, Math.floor(u * N) * RS * 6);
    const overview = 1 - ss(0.02, 0.18, p) + ss(0.9, 1, p);
    const chase = pos.clone().addScaledVector(tg, -5.5).add(new THREE.Vector3(0, 3.2, 0));
    const top = new THREE.Vector3(0, 15, 11);
    camPos.lerp(chase.lerp(top, Math.min(1, overview)), 0.12);
    look.lerp(pos.clone().addScaledVector(tg, 1.5).lerp(new THREE.Vector3(0, 0, 0), Math.min(1, overview)), 0.15);
    camera.position.copy(camPos); camera.lookAt(look);
    if (!reduce) lap.textContent = (36.8 * ss(0.06, 0.92, p)).toFixed(1) + ' s';
    const c = reduce ? 1 : ss(0.9, 0.99, p); card.style.opacity = c; card.style.transform = `translateY(${(1 - c) * 24}px)`;
    prog.style.height = p * 100 + '%';
    composer.render();
  });
  return () => { stop(); dispose(); };
}

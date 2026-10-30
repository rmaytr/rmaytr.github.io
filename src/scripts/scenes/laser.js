// Research scene: a beam strikes an aluminum target and a glowing red sphere swells from the impact.
import { THREE, stage, loop, glow, additive, ss, scrollProgress, radialTexture, reduce as reduceQ } from './stage.js';

const reduce = reduceQ();

export function mountLaser(wrap, canvas, card, prog, label) {
  const { scene, camera, composer, bloomPass, dispose } = stage(canvas, { bloom: [0.8, 0.55, 0.4], bg: 0x050404, env: 0.45 });
  scene.fog = new THREE.FogExp2(0x050404, 0.06);
  const target = new THREE.Group(); scene.add(target); target.rotation.x = 0.2;
  const alu = new THREE.MeshStandardMaterial({ color: 0xb4b8be, metalness: 1, roughness: 0.34 });
  target.add(new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.16, 128), alu));
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.022, 16, 128), new THREE.MeshStandardMaterial({ color: 0x8c1515, metalness: 0.6, roughness: 0.3, emissive: 0x3a0505 })); rim.rotation.x = Math.PI / 2; rim.position.y = 0.08; target.add(rim);
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, 1.6, 64), new THREE.MeshStandardMaterial({ color: 0x151111, metalness: 0.8, roughness: 0.5 })); ped.position.y = -0.9; target.add(ped);

  const glowTex = radialTexture();
  const addMat = additive;
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.92, 1, 128), new THREE.MeshBasicMaterial(addMat({ color: 0xd44444, side: THREE.DoubleSide }))); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.09; target.add(ring);
  const flash = new THREE.Sprite(new THREE.SpriteMaterial(addMat({ map: glowTex, color: 0xffe2c8 }))); flash.position.y = 0.2; target.add(flash);
  const impact = new THREE.PointLight(0xff6a4a, 0, 7, 1.6); impact.position.y = 0.5; target.add(impact);

  // beam
  const L = 9, beam = new THREE.Group(); beam.rotation.z = 0.55; beam.rotation.x = -0.15; beam.position.y = 0.08; target.add(beam);
  const coreMat = new THREE.MeshBasicMaterial(addMat({ color: 0xffffff }));
  const haloMat = new THREE.ShaderMaterial(addMat({ uniforms: { uA: { value: 0 } },
    vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
    fragmentShader: 'uniform float uA; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(abs(dot(vN, vV)), 2.2); gl_FragColor = vec4(vec3(0.83,0.27,0.27) * (0.6 + f*2.2), f * uA); }' }));
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, L, 16, 1, true), coreMat), halo = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, L, 32, 1, true), haloMat);
  beam.add(core, halo);

  // the plume, simplified: a glowing sphere that swells from the impact (the disc hides its lower part)
  const sphMat = new THREE.ShaderMaterial(addMat({ uniforms: { uT: { value: 0 }, uA: { value: 0 }, uHeat: { value: 1 } },
    vertexShader: `uniform float uT; varying vec3 vN; varying vec3 vV; varying float vD;
      void main(){ vec3 p = position; float d = sin(p.x*3.7+uT*1.3)*sin(p.y*4.3-uT*1.1)*sin(p.z*3.9+uT*0.9); p += normal*d*0.06; vD = d;
        vec4 mv = modelViewMatrix*vec4(p,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform float uA, uHeat; varying vec3 vN; varying vec3 vV; varying float vD;
      void main(){ float f = 1.0 - abs(dot(vN, vV)); float rim = pow(f, 2.0); float core = pow(1.0 - f, 2.5);
        vec3 hot = vec3(1.0, 0.85, 0.62), card = vec3(0.86, 0.18, 0.17), deep = vec3(0.55, 0.05, 0.06);
        vec3 col = mix(mix(deep, card, rim), hot, core * uHeat) * (1.0 + vD * 0.5);
        gl_FragColor = vec4(col * 1.25, (rim * 0.85 + core * (0.18 + 0.4 * uHeat) + 0.05) * uA); }` }));
  const sphere = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 48), sphMat); target.add(sphere);
  const coreGlow = new THREE.Sprite(new THREE.SpriteMaterial(addMat({ map: glowTex, color: 0xffd2a8 }))); target.add(coreGlow);

  // a few slow embers instead of a spray of sparks
  const E = 90, eg = new THREE.BufferGeometry(), ep = new Float32Array(E * 3), seeds = [];
  for (let i = 0; i < E; i++) { const th = Math.random() * Math.PI * 2, el = 0.3 + Math.random() * 1.1; seeds.push([Math.cos(th) * Math.cos(el), Math.sin(el), Math.sin(th) * Math.cos(el), 0.6 + Math.random() * 1.6]); }
  eg.setAttribute('position', new THREE.BufferAttribute(ep, 3));
  const embers = new THREE.Points(eg, new THREE.PointsMaterial(addMat({ color: 0xffb08a, size: 0.045, map: glowTex, opacity: 0 }))); target.add(embers);
  const D = 400, dg = new THREE.BufferGeometry(), dp = new Float32Array(D * 3);
  for (let i = 0; i < D; i++) { dp[i * 3] = (Math.random() - 0.5) * 16; dp[i * 3 + 1] = (Math.random() - 0.2) * 8; dp[i * 3 + 2] = (Math.random() - 0.5) * 10; }
  dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  const dust = new THREE.Points(dg, new THREE.PointsMaterial({ color: 0x6a4a44, size: 0.02, transparent: true, opacity: 0.6, depthWrite: false })); scene.add(dust);

  let p = reduce ? 0.5 : 0;
  const v = new THREE.Vector3();
  const stop = loop(wrap, (t) => {
    p += ((reduce ? 0.5 : scrollProgress(wrap)) - p) * 0.12;
    const beamIn = ss(0.04, 0.16, p), beamA = beamIn * (1 - ss(0.55, 0.66, p));
    core.scale.y = halo.scale.y = Math.max(0.001, beamIn); core.position.y = halo.position.y = (L / 2) * beamIn + (1 - beamIn) * L;
    coreMat.opacity = beamA * (0.85 + 0.15 * Math.sin(t * 40)); haloMat.uniforms.uA.value = beamA * 0.45;
    const hit = ss(0.15, 0.19, p) * (1 - ss(0.19, 0.3, p));
    flash.scale.setScalar(0.4 + hit * 3); flash.material.opacity = hit * 0.8;
    const rw = ss(0.17, 0.42, p); ring.scale.setScalar(0.15 + rw * 2.6); ring.material.opacity = (1 - rw) * ss(0.17, 0.2, p) * 0.8;
    const g = ss(0.17, 0.78, p), fade = 1 - ss(0.72, 0.9, p), s = 0.04 + 1.45 * (1 - Math.pow(1 - g, 2.4));
    sphere.scale.setScalar(s); sphere.position.y = 0.08 + s * 0.55;
    sphMat.uniforms.uT.value = t; sphMat.uniforms.uA.value = ss(0.16, 0.22, p) * fade; sphMat.uniforms.uHeat.value = 1 - g * 0.85;
    coreGlow.position.y = sphere.position.y * 0.8; coreGlow.scale.setScalar(s * 1.6); coreGlow.material.opacity = (1 - g) * ss(0.16, 0.2, p) * 0.9;
    impact.intensity = (hit * 5 + (1 - g) * 1.5) * ss(0.15, 0.2, p) * fade;
    const eg2 = ss(0.18, 0.75, p); embers.material.opacity = ss(0.18, 0.25, p) * (1 - ss(0.5, 0.75, p)) * 0.9;
    seeds.forEach(([x, y, z, sp], i) => { const r = eg2 * sp * 1.4; ep[i * 3] = x * r; ep[i * 3 + 1] = 0.1 + y * r - eg2 * eg2 * 0.6; ep[i * 3 + 2] = z * r; });
    eg.attributes.position.needsUpdate = true;
    bloomPass.strength = 0.75 + hit * 0.9 + (1 - g) * 0.25;
    const cz = 11 - ss(0, 0.7, p) * 2.4, cx = Math.sin(p * Math.PI) * 1.6;
    camera.position.set(cx, 2.2 + p * 0.5, cz); camera.lookAt(0, 1.0 + p * 0.5, 0);
    dust.rotation.y = t * 0.01;
    canvas.style.opacity = 1 - ss(0.82, 0.95, p) * 0.9;
    // material label anchored to the target's right edge
    v.set(1.35, 0.1, 0.3); target.localToWorld(v); v.project(camera);
    label.style.transform = `translate(${(v.x * 0.5 + 0.5) * canvas.clientWidth + 10}px, ${(-v.y * 0.5 + 0.5) * canvas.clientHeight - 18}px)`;
    label.style.opacity = ss(0.02, 0.1, p) * (1 - ss(0.7, 0.8, p));
    const c = reduce ? 1 : ss(0.88, 0.98, p); card.style.opacity = c; card.style.transform = `translateY(${(1 - c) * 24}px)`;
    prog.style.height = p * 100 + '%';
    composer.render();
  });
  return () => { stop(); dispose(); };
}

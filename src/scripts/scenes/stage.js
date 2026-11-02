// Shared three.js setup for every scene: renderer, bloom, resize, a visibility-gated loop and disposal.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { addBrake } from '../motion';

export { THREE };
/** Hands the main thread back for a moment, so long scene setup runs in short slices between frames. */
export const tick = () => new Promise((r) => (globalThis.scheduler?.yield ? globalThis.scheduler.yield().then(r) : setTimeout(r, 0)));
export const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export const glow = (hex, k) => new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k), toneMapped: false });
export const additive = (o) => Object.assign(o, { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });

/** How far the page has scrolled through a pinned wrapper, 0 to 1. The first HOLD of the scroll keeps the scene at its
 *  opening and the next EASE of it speeds up gently, so a reader who arrives scrolling fast lands on the start, not mid-way. */
const HOLD = 0.12, EASE = 0.25;
export const scrollProgress = (wrap) => {
  const r = wrap.getBoundingClientRect();
  const t = Math.max(0, (Math.min(1, Math.max(0, -r.top / (r.height - innerHeight))) - HOLD) / (1 - HOLD));
  const s = 1 / (1 - EASE / 2); // the linear part's slope, so the curve still ends at 1
  return t < EASE ? (s * t * t) / (2 * EASE) : s * (t - EASE / 2);
};

/** Paces a scroll-driven scene. Its progress follows the scroll on a spring, never faster than `rate` (progress per
 *  second), and while it trails the scroll the wheel is slowed in that direction (never stopped, and never when scrolling
 *  back toward it), so a fast scroll plays the scene through instead of skipping it. Touch keeps its native scroll; the
 *  scene then catches up at its own pace. */
export function pacer(wrap, rate, p = 0) {
  const SPRING = 9; // settles in about a third of a second
  let v = 0, target = p;
  const stop = addBrake((dy) => {
    const r = wrap.getBoundingClientRect(), lag = target - p;
    if (r.top > 1 || r.bottom < innerHeight / 2 || Math.sign(dy) !== Math.sign(lag)) return dy; // only while pinned or just leaving
    if (dy > 0 && r.bottom < innerHeight + 1 && p < 0.97) return dy * 0.05; // past the pin with the ending still to play: hold it in view
    return dy * (1 - Math.min(0.95, Math.max(0, (Math.abs(lag) - 0.04) / 0.14))); // a small lag is free; past ~0.18 the wheel nearly stops
  });
  const step = (to, dt) => {
    target = to;
    v = Math.max(-rate, Math.min(rate, v + (SPRING * SPRING * (to - p) - 2 * SPRING * v) * dt));
    p += v * dt;
    return p;
  };
  return { step, stop };
}

export function radialTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'), gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,220,190,.6)'); gr.addColorStop(0.6, 'rgba(212,68,68,.18)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function stage(canvas, { bloom = [0.6, 0.4, 0.85], bg = null, env = 0.4, fov = 32 } = {}) {
  // no antialiasing on the canvas: the scene is drawn into the bloom chain's buffers, so the canvas only ever gets one
  // full-screen picture, which multisampling can't change and would only cost memory bandwidth every frame
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: !bg, powerPreference: 'high-performance' });
  renderer.debug.checkShaderErrors = import.meta.env.DEV; // the check waits on the driver for every shader's log; shipped shaders are known good
  renderer.setPixelRatio(Math.min(2, devicePixelRatio));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  if (bg) scene.background = new THREE.Color(bg);
  // the room reflections are rendered in warm(), once their shaders have compiled; until then a blank map of the same
  // size stands in, so every material compiles for the real one. _setSize/_allocateTargets are PMREMGenerator's private
  // API (three 0.186): they create the blur and GGX materials that fromScene() then reuses
  const pmrem = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment();
  pmrem._setSize(256);
  const stand = pmrem._allocateTargets();
  scene.environment = stand.texture;
  scene.environmentIntensity = env;
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 200);
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), ...bloom);
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());
  const size = () => { const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); composer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); };
  const ro = new ResizeObserver(size); ro.observe(canvas); size();
  let disposed = false;

  /** Gets everything the first frame needs ready without freezing the page: compiles every shader (the scene's, the bloom
   *  chain's and the reflections') on the driver's own threads (KHR_parallel_shader_compile), then renders the
   *  reflections and uploads the textures a few at a time. Hidden parts are included (compile walks every object). */
  const warm = async () => {
    // stand-in meshes for the full-screen passes; a normal attribute would change the program variant, so the quad has none
    const plane = new THREE.PlaneGeometry(2, 2).deleteAttribute('normal'), box = new THREE.BoxGeometry();
    const backdrop = new THREE.Mesh(box, new THREE.MeshBasicMaterial({ side: THREE.BackSide })); // as PMREM's own backdrop box
    const quads = (ms) => { const s = new THREE.Scene(); for (const m of ms) s.add(new THREE.Mesh(plane, m)); return s; };
    const bloomMats = composer.passes.filter((p) => !p.isOutputPass).flatMap((p) => Object.values(p).flat()).filter((m) => m?.isShaderMaterial);
    // the output pass picks its tone mapping defines on its first frame: let it pick them now, without drawing
    // (_fsQuad is OutputPass's private quad, three 0.186), so its shader compiles with the rest
    const out = composer.passes.find((p) => p.isOutputPass), draw = out._fsQuad.render;
    out._fsQuad.render = () => {}; out.render(renderer, null, composer.renderTarget1); out._fsQuad.render = draw;
    // compile into the buffers each part really draws into: the program variants differ (tone mapping and output colour space)
    const prev = renderer.getRenderTarget(), jobs = [renderer.compileAsync(quads([out.material]), camera)]; // the output pass draws to the screen
    renderer.setRenderTarget(composer.renderTarget1);
    jobs.push(renderer.compileAsync(scene, camera), renderer.compileAsync(quads(bloomMats), camera));
    renderer.setRenderTarget(stand);
    jobs.push(renderer.compileAsync(room, camera), renderer.compileAsync(quads([pmrem._blurMaterial, pmrem._ggxMaterial]).add(backdrop), camera));
    renderer.setRenderTarget(prev);
    await Promise.all(jobs).catch(() => {}); // a failed warm-up only means the first frame compiles as before
    if (disposed) return;
    // ask the driver for each program's inputs now, while it has nothing queued, not between the first draws (each query waits for every draw before it)
    for (const p of renderer.info.programs) { p.getUniforms(); p.getAttributes(); }
    const map = pmrem.fromScene(room, 0.04).texture;
    scene.traverse((o) => [o.material].flat().forEach((m) => { if (m?.envMap === stand.texture) m.envMap = map; }));
    scene.environment = map;
    stand.dispose(); room.dispose(); backdrop.material.dispose(); box.dispose(); plane.dispose();
    const textures = new Set();
    scene.traverse((o) => [o.material].flat().forEach((m) => m && Object.values(m).forEach((v) => { if (v?.isTexture && v.image && !v.isRenderTargetTexture) textures.add(v); })));
    for (const t of textures) { await tick(); if (disposed) return; renderer.initTexture(t); }
  };
  const dispose = () => {
    disposed = true; ro.disconnect();
    scene.traverse((o) => { o.geometry?.dispose?.(); const m = o.material; (Array.isArray(m) ? m : [m]).forEach((x) => { x?.map?.dispose?.(); x?.dispose?.(); }); });
    scene.environment?.dispose?.(); stand.dispose(); room.dispose(); pmrem.dispose(); bloomPass.dispose(); composer.dispose(); renderer.dispose(); renderer.forceContextLoss();
  };
  return { renderer, scene, camera, composer, bloomPass, warm, dispose };
}

/** Runs cb(time, dt) each frame while el is on screen and the tab is visible, once `ready` (a warm-up) has resolved;
 *  returns a stop function. With `adapt` ({ renderer, composer, max }), a device that can't hold ~45 fps steps its pixel
 *  ratio down by quarters (never below 1, never back up, so it can't flicker between sizes); fast devices keep full detail. */
export function loop(el, cb, ready = Promise.resolve(), adapt = null) {
  let visible = false, raf = 0, stopped = false, go = false;
  let frames = 0, acc = 0, n = 0, pr = adapt?.max ?? 1;
  ready.catch(() => {}).then(() => { if (stopped) return; go = true; cb(0, 0); }); // draw once straight away, even off screen, so the GPU's first-draw work happens now, not mid-scroll
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: '100px' });
  io.observe(el);
  const timer = new THREE.Timer();
  const frame = (ts) => { if (stopped) return; raf = requestAnimationFrame(frame); timer.update(ts); const dt = Math.min(0.05, timer.getDelta());
    if (!go || !visible || document.hidden) return;
    cb(timer.getElapsed(), dt);
    if (!adapt || ++frames < 60 || pr <= 1) return; // the first second settles caches and late compiles
    acc += dt; if (++n < 45) return;
    const slow = acc / n > 1 / 45; acc = n = 0;
    if (slow) { pr = Math.max(1, pr - 0.25); adapt.renderer.setPixelRatio(pr); adapt.composer.setPixelRatio(pr); }
  };
  raf = requestAnimationFrame(frame);
  return () => { stopped = true; cancelAnimationFrame(raf); io.disconnect(); };
}

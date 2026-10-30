// Shared three.js setup for every scene: renderer, bloom, resize, a visibility-gated loop and disposal.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export { THREE };
export const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export const glow = (hex, k) => new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k), toneMapped: false });
export const additive = (o) => Object.assign(o, { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });

/** How far the page has scrolled through a pinned wrapper, 0 to 1. */
export const scrollProgress = (wrap) => { const r = wrap.getBoundingClientRect(); return Math.min(1, Math.max(0, -r.top / (r.height - innerHeight))); };

export function radialTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'), gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,220,190,.6)'); gr.addColorStop(0.6, 'rgba(212,68,68,.18)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function stage(canvas, { bloom = [0.6, 0.4, 0.85], bg = null, env = 0.4, fov = 32 } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: !bg, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  if (bg) scene.background = new THREE.Color(bg);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = env;
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 200);
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), ...bloom);
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());
  const size = () => { const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); composer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); };
  const ro = new ResizeObserver(size); ro.observe(canvas); size();
  const dispose = () => {
    ro.disconnect();
    scene.traverse((o) => { o.geometry?.dispose?.(); const m = o.material; (Array.isArray(m) ? m : [m]).forEach((x) => { x?.map?.dispose?.(); x?.dispose?.(); }); });
    scene.environment?.dispose?.(); pmrem.dispose(); bloomPass.dispose(); composer.dispose(); renderer.dispose(); renderer.forceContextLoss();
  };
  return { renderer, scene, camera, composer, bloomPass, dispose };
}

/** Runs cb(time, dt) each frame while el is on screen and the tab is visible; returns a stop function. */
export function loop(el, cb) {
  let visible = false, raf = 0, stopped = false;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: '100px' });
  io.observe(el);
  const timer = new THREE.Timer();
  const frame = (ts) => { if (stopped) return; raf = requestAnimationFrame(frame); timer.update(ts); const dt = Math.min(0.05, timer.getDelta()); if (visible && !document.hidden) cb(timer.getElapsed(), dt); };
  raf = requestAnimationFrame(frame);
  return () => { stopped = true; cancelAnimationFrame(raf); io.disconnect(); };
}

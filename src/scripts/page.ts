// Runs setup on every page load (Astro's client router) and its cleanup before the next swap.
export type Cleanup = void | (() => void);

export function onPage(setup: () => Cleanup): void {
  document.addEventListener('astro:page-load', () => {
    const cleanup = setup();
    if (typeof cleanup === 'function') document.addEventListener('astro:before-swap', cleanup, { once: true });
  });
}

export const reducedMotion = (): boolean => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = (): boolean => matchMedia('(hover: hover) and (pointer: fine)').matches;

/** Calls cb on idle, so heavy modules (three.js) load after first paint. */
export const whenIdle = (cb: () => void): void => {
  if ('requestIdleCallback' in window) requestIdleCallback(cb, { timeout: 1500 });
  else setTimeout(cb, 200);
};

/** Calls cb once, when el comes within `margin` of the viewport; returns a function that cancels it. */
export const whenNear = (el: Element, cb: () => void, margin = '150% 0px'): (() => void) => {
  const io = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) { io.disconnect(); cb(); } }, { rootMargin: margin });
  io.observe(el);
  return () => io.disconnect();
};

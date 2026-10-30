// Mounts Hairline figures: the package's own, or the custom ones drawn with hairline-create.
type Handle = { destroy: () => void };
type Custom = { name: string; means: string; range: number[]; tour: unknown; mount: (env: unknown, v: number) => Handle };
const CUSTOM: Record<string, () => Promise<Custom>> = {
  globe: () => import('./hairline-globe.js').then((m) => m.globe),
  web: () => import('./hairline-web.js').then((m) => m.web),
  tutor: () => import('./hairline-tutor.js').then((m) => m.tutor),
};

/** The bench's mount, reduced to what a page needs: a stage, an svg, a silent read-out, and the tour. */
async function mountCustom(el: HTMLElement, load: () => Promise<Custom>, play: boolean): Promise<Handle> {
  const [{ default: HL }, fig] = await Promise.all([import('./vendor/hairline-kernel.js'), load()]);
  HL.inject(document);
  el.setAttribute('data-hairline', fig.name);
  el.setAttribute('role', 'img');
  el.setAttribute('aria-label', fig.means);
  const svg = HL.mk('svg', { viewBox: '0 0 400 320', 'aria-hidden': 'true' }, el);
  const read = { textContent: '' };
  const handle = fig.mount({ stage: el, svg, read }, fig.range[1]);
  const tour = play ? HL.tour(el, fig.tour, () => {}) : null;
  return { destroy: () => { tour?.stop(); handle.destroy(); svg.remove(); } };
}

export async function mountFigures(root: ParentNode = document): Promise<() => void> {
  const els = [...root.querySelectorAll<HTMLElement>('[data-figure]')];
  if (!els.length) return () => {};
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pkg: Record<string, unknown> = await import('@lucasmarkes/hairline');
  const handles: Handle[] = [];
  for (const el of els) {
    const name = el.dataset.figure ?? '';
    try {
      if (name in CUSTOM) handles.push(await mountCustom(el, CUSTOM[name], !reduce));
      else {
        const f = pkg[name];
        if (typeof f === 'function') handles.push(f(el, { play: !reduce, intensity: 0.7, theme: 'dark', label: el.dataset.label }) as Handle);
      }
    } catch {
      el.remove(); // a figure is decoration; the card reads without it
    }
  }
  return () => handles.forEach((h) => h.destroy());
}

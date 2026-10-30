// The shared motion layer: smooth scroll, reveals, split headlines, counters, cursor, magnetic links,
// nav behaviour and the iris transition between pages. GSAP owns all of it.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import { onPage, reducedMotion, finePointer } from './page';

gsap.registerPlugin(ScrollTrigger, SplitText);

let lenis: Lenis | null = null;

function smoothScroll(): void {
  if (reducedMotion()) return;
  lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis?.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

function cursor(): void {
  const el = document.querySelector<HTMLElement>('.cursor');
  if (!el || !finePointer() || reducedMotion()) return;
  const mark = () => document.documentElement.classList.add('has-cursor');
  mark();
  // the client router replaces <html>'s attributes on every navigation
  document.addEventListener('astro:after-swap', mark);
  const x = gsap.quickTo(el, 'x', { duration: 0.18, ease: 'power3' });
  const y = gsap.quickTo(el, 'y', { duration: 0.18, ease: 'power3' });
  addEventListener('pointermove', (e) => { el.classList.add('on'); x(e.clientX); y(e.clientY); }, { passive: true });
  document.documentElement.addEventListener('mouseleave', () => el.classList.remove('on'));
  document.addEventListener('pointerover', (e) => {
    const t = e.target as HTMLElement;
    el.classList.toggle('big', !!t.closest('a, button, [data-cursor]'));
  });
}

const PAGE_NAMES: Record<string, string> = { '/': 'Home', '/about/': 'About', '/work/': 'Projects', '/experience/': 'Experience', '/research/': 'Research' };

function transitions(): void {
  const pt = document.querySelector<HTMLElement>('[data-pt]');
  if (!pt || reducedMotion()) return;
  const ring = pt.querySelector<HTMLElement>('.pt-ring')!, fill = pt.querySelector<HTMLElement>('.pt-fill')!;
  const word = pt.querySelector<HTMLElement>('[data-pt-word]')!;
  let x = innerWidth / 2, y = innerHeight / 2, active = false, failsafe = 0;
  document.addEventListener('pointerdown', (e) => { x = e.clientX; y = e.clientY; }, { capture: true, passive: true });

  let seq = 0;
  const hide = () => { active = false; clearTimeout(failsafe); gsap.killTweensOf([ring, fill, word]); gsap.set([ring, fill], { clearProps: 'clipPath' }); pt.classList.remove('on'); };
  // a page restored from the back-forward cache may come back with the overlay still up
  addEventListener('pageshow', (e) => { if (e.persisted) hide(); });

  document.addEventListener('astro:before-preparation', (e) => {
    const ev = e as Event & { loader: () => Promise<void>; to: URL; signal: AbortSignal };
    const original = ev.loader;
    const mine = ++seq;
    // an aborted navigation that nothing replaces must not leave the overlay up
    ev.signal?.addEventListener('abort', () => setTimeout(() => { if (seq === mine) hide(); }));
    const name = PAGE_NAMES[ev.to.pathname] ?? (ev.to.pathname.startsWith('/work/') ? ev.to.pathname.split('/')[2]?.replace(/-/g, ' ') : '') ?? '';
    word.textContent = name;
    pt.style.setProperty('--x', `${x}px`); pt.style.setProperty('--y', `${y}px`);
    pt.classList.add('on'); active = true;
    clearTimeout(failsafe); failsafe = window.setTimeout(hide, 4000); // never leave the page covered
    const tl = gsap.timeline()
      .fromTo(ring, { clipPath: `circle(0% at ${x}px ${y}px)` }, { clipPath: `circle(150% at ${x}px ${y}px)`, duration: 0.75, ease: 'expo.inOut' })
      .fromTo(fill, { clipPath: `circle(0% at ${x}px ${y}px)` }, { clipPath: `circle(150% at ${x}px ${y}px)`, duration: 0.75, ease: 'expo.inOut' }, 0.1)
      .fromTo(word, { xPercent: 40, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 0.7, ease: 'expo.out' }, 0.35);
    ev.loader = async () => { await Promise.all([tl.then(), original()]); };
  });

  // only after a swap (not on the first load, so a reload keeps its scroll position)
  document.addEventListener('astro:after-swap', () => {
    try { if (lenis) { document.documentElement.classList.add('lenis', 'lenis-smooth'); lenis.scrollTo(0, { immediate: true }); } } catch { /* scroll position is a nicety */ }
  });
  // page-load fires after every swap, so the exit always runs
  document.addEventListener('astro:page-load', () => {
    if (!active) return;
    const cx = innerWidth / 2, cy = innerHeight / 2;
    gsap.timeline({ onComplete: hide })
      .to(word, { xPercent: -40, opacity: 0, duration: 0.6, ease: 'expo.in' })
      .to(fill, { clipPath: `circle(0% at ${cx}px ${cy}px)`, duration: 0.8, ease: 'expo.inOut' }, 0.1)
      .to(ring, { clipPath: `circle(0% at ${cx}px ${cy}px)`, duration: 0.8, ease: 'expo.inOut' }, 0.2);
  });
}

/** Per-page effects; everything they create is reverted before the next page swaps in. */
function pageEffects(): () => void {
  const ctx = gsap.context(() => {
    const reduce = reducedMotion();
    const nav = document.querySelector<HTMLElement>('[data-nav]');
    if (nav) {
      ScrollTrigger.create({
        start: 0, end: 'max',
        onUpdate: (self) => {
          nav.classList.toggle('solid', self.scroll() > 40);
          nav.classList.toggle('hidden', self.direction === 1 && self.scroll() > 400);
        },
      });
    }

    // headings that rise line by line
    document.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
      if (reduce) return;
      // autoSplit re-splits after fonts load and on resize, so line masks never clip
      SplitText.create(el, {
        type: 'lines', mask: 'lines', linesClass: 'line', autoSplit: true,
        onSplit: (self) => gsap.from(self.lines, { yPercent: 110, duration: 1, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: el, start: 'top 88%', once: true } }),
      });
    });

    // statements that light up word by word with scroll
    document.querySelectorAll<HTMLElement>('[data-words]').forEach((el) => {
      if (reduce) return;
      const split = SplitText.create(el, { type: 'words' });
      gsap.fromTo(split.words, { opacity: 0.18 }, { opacity: 1, stagger: 0.05, ease: 'none', scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true } });
    });

    // everything else rises into place, staggered
    const items = gsap.utils.toArray<HTMLElement>('[data-reveal]');
    if (!items.length) { /* nothing to reveal on this page */ }
    else if (reduce) gsap.set(items, { opacity: 1, y: 0 });
    else ScrollTrigger.batch(items, { start: 'top 90%', once: true, onEnter: (b) => gsap.to(b, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.07 }) });

    // counters: the final text is in the HTML; the number ticks up into it, width locked
    document.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
      const final = el.textContent ?? '';
      const m = final.match(/[\d,.]+/);
      if (!m || reduce) return;
      const target = parseFloat(m[0].replace(/,/g, '')), decimals = (m[0].split('.')[1] ?? '').length;
      const [pre, post] = [final.slice(0, m.index), final.slice((m.index ?? 0) + m[0].length)];
      el.style.minWidth = `${el.getBoundingClientRect().width}px`;
      const o = { v: 0 };
      gsap.to(o, {
        v: target, duration: 1.6, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        onUpdate: () => { el.textContent = pre + o.v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + post; },
        onComplete: () => { el.textContent = final; },
      });
    });

    // magnetic controls
    if (finePointer() && !reduce) {
      document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
        const x = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3' }), y = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3' });
        el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(); x((e.clientX - r.left - r.width / 2) * 0.3); y((e.clientY - r.top - r.height / 2) * 0.35); });
        el.addEventListener('pointerleave', () => { x(0); y(0); });
      });
    }
  });

  // copy email
  const copyHandlers: Array<() => void> = [];
  document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((b) => {
    const hint = b.querySelector('.email-hint'), status = b.parentElement?.querySelector('[data-copy-status]');
    const h = async () => {
      try {
        await navigator.clipboard.writeText(b.dataset.copy ?? '');
        if (status) status.textContent = 'Email address copied';
        if (hint) { const was = hint.textContent; hint.textContent = 'Copied ✓'; setTimeout(() => { hint.textContent = was; if (status) status.textContent = ''; }, 2000); }
      } catch {
        location.href = `mailto:${b.dataset.copy}`; // no clipboard access: open the mail app instead
      }
    };
    b.addEventListener('click', h); copyHandlers.push(() => b.removeEventListener('click', h));
  });

  // local time in Birmingham
  const clock = document.querySelector<HTMLElement>('[data-clock]');
  const tick = () => { if (clock) clock.textContent = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', hour: 'numeric', minute: '2-digit' }).format(new Date()) + ' CT'; };
  tick();
  const timer = setInterval(tick, 30_000);

  // pins add height above later sections, so measure once everything is set up, then honour a #hash
  requestAnimationFrame(() => {
    ScrollTrigger.refresh();
    const id = location.hash ? decodeURIComponent(location.hash.slice(1)) : '';
    const target = id ? document.getElementById(id) : null;
    if (target) { if (lenis) lenis.scrollTo(target, { immediate: true }); else target.scrollIntoView(); }
  });
  return () => { ctx.revert(); copyHandlers.forEach((f) => f()); clearInterval(timer); };
}

let booted = false;
export function boot(): void {
  if (booted) return;
  booted = true;
  smoothScroll();
  cursor();
  transitions();
  onPage(pageEffects);
}

/** Scroll the page to a y position, through Lenis when it is running. */
export function scrollToY(y: number): void {
  if (lenis) lenis.scrollTo(y, { duration: 1.4 });
  else window.scrollTo({ top: y, behavior: reducedMotion() ? 'auto' : 'smooth' });
}

export { gsap, ScrollTrigger };

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const pages = ['/', '/about/', '/work/', '/experience/', '/research/', '/work/hackbama/', '/work/phasora/', '/work/sofiakamal/', '/work/bor-realty/', '/work/leetcode/', '/404'];
// Driver and GPU noise that is not the site's: shader compiler precision notes on Windows.
const ignorable = (t: string) => /X4122|GPU stall due to ReadPixels/i.test(t);

for (const path of pages) {
  for (const motion of ['no-preference', 'reduce'] as const) {
    test(`${path} loads clean (${motion})`, async ({ page }, info) => {
      const problems: string[] = [];
      page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
      page.on('console', (m) => { if ((m.type() === 'error' || m.type() === 'warning') && !ignorable(m.text())) problems.push(`${m.type()}: ${m.text()}`); });
      await page.emulateMedia({ reducedMotion: motion });
      const res = await page.goto(path, { waitUntil: 'networkidle' });
      if (path !== '/404') expect(res?.status()).toBe(200);
      await expect(page.locator('h1')).toHaveCount(1);
      const [vw, sw] = await page.evaluate(() => [innerWidth, document.documentElement.scrollWidth]);
      expect(sw, 'no sideways overflow').toBeLessThanOrEqual(vw);
      if (info.project.name === 'phone') expect(vw, 'layout viewport not widened by overflow').toBe(390);
      await page.waitForTimeout(1500);
      await page.screenshot({ path: `test-results/shots/${info.project.name}-${motion}${path.replace(/\//g, '_') || '_home'}.png`, fullPage: false });
      expect(problems, problems.join('\n')).toEqual([]);
    });
  }
}

test('internal links resolve', async ({ page, request }) => {
  const seen = new Set<string>();
  for (const path of pages.slice(0, 5)) {
    await page.goto(path);
    for (const href of await page.locator('a[href^="/"]').evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).getAttribute('href') ?? ''))) {
      const url = href.split('#')[0] || '/';
      if (seen.has(url)) continue;
      seen.add(url);
      expect((await request.get(url)).status(), url).toBe(200);
    }
  }
});

test('no serious accessibility violations', async ({ page }) => {
  test.setTimeout(150_000); // axe on every page, one after another
  for (const path of pages) {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(path, { waitUntil: 'networkidle' });
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    const bad = r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(bad.map((v) => `${path}: ${v.id} (${v.nodes.length}) ${v.nodes[0]?.target}`), path).toEqual([]);
  }
});

test('reduced motion: everything is visible and reachable', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/', { waitUntil: 'networkidle' });
  for (const sel of ['#hero-name .line', '.hero .tag', '.hero .right']) {
    expect(Number(await page.locator(sel).first().evaluate((el) => getComputedStyle(el).opacity)), sel).toBeGreaterThan(0.8);
  }
  for (const id of ['#race', '#laser']) {
    await page.locator(id).scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    expect(await page.locator(`${id} [data-card]`).evaluate((el) => getComputedStyle(el).opacity), id).toBe('1');
  }
  await expect(page.locator('[data-lap]')).toHaveText('36.8 s');
  if (info.project.name === 'desktop') {
    const last = page.locator('.track .panel').last();
    await last.scrollIntoViewIfNeeded();
    await expect(last).toBeInViewport();
  }
});

test('client navigation keeps the js class and does not pile up WebGL contexts', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'pointer navigation');
  test.setTimeout(150_000); // twelve full page transitions, each followed by a settle
  const warnings: string[] = [];
  page.on('console', (m) => { if (/too many active webgl contexts/i.test(m.text())) warnings.push(m.text()); });
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  for (let i = 0; i < 6; i++) {
    await page.locator('header nav a[href="/about/"]').click();
    await page.waitForURL('**/about/');
    await expect(page.locator('html')).toHaveClass(/(^|\s)js(\s|$)/);
    await page.locator('header .mark').click();
    await page.waitForURL((u) => u.pathname === '/');
    await page.waitForTimeout(2500);
  }
  expect(warnings).toEqual([]);
});

test('the page transition opens, lands and clears', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'pointer navigation');
  await page.goto('/', { waitUntil: 'networkidle' });
  const overlay = page.locator('[data-pt]');
  await page.locator('header nav a[href="/work/"]').click();
  await expect(overlay).toHaveClass(/(^|\s)on(\s|$)/);
  await page.waitForURL('**/work/');
  await expect(overlay).not.toHaveClass(/(^|\s)on(\s|$)/, { timeout: 3000 });
  await expect(page.locator('h1')).toBeInViewport();
});

test('a navigation cut short by another still ends uncovered', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'pointer navigation');
  await page.goto('/', { waitUntil: 'networkidle' });
  // hold the first page back so the second click aborts it mid-flight
  await page.route('**/work/', async (r) => { await new Promise((f) => setTimeout(f, 1500)); await r.continue(); });
  await page.locator('header nav a[href="/work/"]').click();
  await page.locator('header nav a[href="/about/"]').click();
  await page.waitForURL('**/about/');
  await expect(page.locator('[data-pt]')).not.toHaveClass(/(^|\s)on(\s|$)/, { timeout: 3000 });
  await page.waitForTimeout(2000); // the held-back page must not swap in late
  expect(new URL(page.url()).pathname).toBe('/about/');
});

test('the projects overview shows every project and each tile reaches its panel', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  const tiles = page.locator('[data-jump]');
  await expect(tiles).toHaveCount(await page.locator('[data-panel]').count());
  const last = tiles.last();
  const id = await last.getAttribute('data-jump');
  await last.scrollIntoViewIfNeeded();
  await last.click();
  await expect(page.locator(`#${id}`)).toBeInViewport({ ratio: 0.5, timeout: 4000 });
});

test('a reload keeps the scroll position', async ({ page }) => {
  await page.goto('/about/', { waitUntil: 'networkidle' });
  await page.evaluate(() => window.scrollTo(0, 1200));
  await page.waitForTimeout(500);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(800);
});

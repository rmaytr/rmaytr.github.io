// Renders the print layout of the CV (/cv/print/) to public/cv/Rodion_Mayatskiy_CV.pdf, and copies it into dist/
// so the current build serves it too. Run after `astro build`: `npm run cv:pdf`.
import { spawn } from 'node:child_process';
import { copyFileSync, mkdirSync, statSync } from 'node:fs';
import { chromium } from '@playwright/test';

const PORT = 4405, OUT = 'public/cv/Rodion_Mayatskiy_CV.pdf';
const server = spawn(`npx astro preview --port ${PORT}`, { shell: true, stdio: 'ignore' });
const stop = () => { if (process.platform === 'win32') spawn('taskkill', ['/pid', String(server.pid), '/t', '/f']); else server.kill(); };

try {
  const url = `http://localhost:${PORT}/cv/print/`;
  for (let i = 0; ; i++) {
    try { if ((await fetch(url)).ok) break; } catch { /* not up yet */ }
    if (i > 60) throw new Error(`preview server did not start on port ${PORT}`);
    await new Promise((r) => setTimeout(r, 500));
  }
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  mkdirSync('public/cv', { recursive: true });
  await page.pdf({ path: OUT, format: 'Letter', preferCSSPageSize: true, printBackground: true });
  await browser.close();
  mkdirSync('dist/cv', { recursive: true });
  copyFileSync(OUT, 'dist/cv/Rodion_Mayatskiy_CV.pdf');
  console.log(`cv-pdf: wrote ${OUT} (${Math.round(statSync(OUT).size / 1024)} KB)`);
} finally {
  stop();
}

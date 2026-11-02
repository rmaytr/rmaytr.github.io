// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://rmaytr.github.io',
  // the CV's print layout only exists to make the PDF, so it stays out of the sitemap
  integrations: [react(), sitemap({ filter: (page) => !page.includes('/cv/print/') })],
  prefetch: { prefetchAll: true },
});

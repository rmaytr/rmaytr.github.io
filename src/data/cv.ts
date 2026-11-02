// Helpers for the CV, which is built from the same data as the rest of the site.

/** The bullet points of a project's markdown body: list items and bold-led paragraphs, kept with their **marks**.
 *  Skips headings, tables, comments, parenthetical notes and the brief (sections about the problem or constraints),
 *  so only what was done remains. Links become their text and inline code its contents. */
export function mdBullets(body: string): string[] {
  const out: string[] = [];
  let brief = false;
  for (const raw of body.split(/\r?\n/)) {
    const line = raw.trim();
    const heading = line.match(/^#{1,6}\s+(.*)$/)?.[1];
    if (heading !== undefined) { brief = /^(the )?(problem|constraints?|challenge)\b/i.test(heading); continue; }
    if (brief) continue;
    const item = line.match(/^(?:[-*]|\d+\.)\s+(.*)$/)?.[1] ?? (line.startsWith('**') ? line : null);
    if (!item || item.startsWith('(')) continue;
    out.push(item.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/`([^`]+)`/g, '$1'));
  }
  return out;
}

/** A link as a reader sees it on paper: no scheme, no www, no trailing slash. */
export const shortUrl = (href: string): string => href.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

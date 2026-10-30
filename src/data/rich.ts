// Inline emphasis for data strings: **key detail** becomes <strong> (sand), ==highlight== becomes <mark> (a cardinal
// marker stroke). Text is escaped first, so a data string can never inject markup. Render with set:html and class="rich".
const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };

export const rich = (s: string): string =>
  s.replace(/[&<>"]/g, (c) => ESC[c]).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/==(.+?)==/g, '<mark>$1</mark>');

/** The same string with the marks removed, for places that take plain text (meta descriptions, aria labels). */
export const plain = (s: string): string => s.replace(/\*\*(.+?)\*\*/g, '$1').replace(/==(.+?)==/g, '$1');

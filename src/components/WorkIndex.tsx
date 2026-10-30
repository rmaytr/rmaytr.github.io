// The /work index: search, filters with counts, layout-animated reflow and a cursor-following preview.
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react';

export interface WorkItem {
  id: string;
  title: string;
  cardLine: string;
  year: string;
  role: string;
  stack: string[];
  category: string[];
  archive: boolean;
  status?: string;
  result?: string;
  cover?: string;
}

const FILTERS: Array<[string, string]> = [['all', 'All'], ['featured', 'Featured'], ['web', 'Web'], ['systems', 'Systems & ML'], ['games', 'Games']];

export default function WorkIndex({ items }: { items: WorkItem[] }) {
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [hover, setHover] = useState<WorkItem | null>(null);
  const preview = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const reduce = useReducedMotion();

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((i) =>
      (filter === 'all' || i.category.includes(filter)) &&
      (!needle || [i.title, i.cardLine, i.role, ...i.stack].join(' ').toLowerCase().includes(needle)));
  }, [items, filter, q]);

  // "/" focuses the search, as on most code sites
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') { e.preventDefault(); search.current?.focus(); }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);

  const onMove = (e: React.PointerEvent) => {
    if (preview.current) preview.current.style.transform = `translate(${e.clientX + 24}px, ${e.clientY - 90}px)`;
  };

  return (
    <div className="wi" onPointerMove={onMove}>
      <div className="wi-tools">
        <label className="wi-search">
          <span className="visually-hidden">Search projects</span>
          <input ref={search} type="search" placeholder="Search projects or stack  ( / )" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <div className="wi-filters" role="group" aria-label="Filter projects">
          {FILTERS.map(([k, label]) => (
            <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)}>
              {filter === k && <motion.span layoutId="pill" className="wi-pill" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
              <span className="wi-label">{label}<sup>{k === 'all' ? items.length : items.filter((i) => i.category.includes(k)).length}</sup></span>
            </button>
          ))}
        </div>
      </div>

      <LayoutGroup>
        <motion.ol className="wi-list" layout={!reduce}>
          <AnimatePresence initial={false}>
            {shown.map((i) => (
              <motion.li
                key={i.id}
                layout={!reduce}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                onPointerEnter={() => setHover(i)}
                onPointerLeave={() => setHover(null)}
              >
                <a href={`/work/${i.id}/`} className="wi-row">
                  <span className="wi-year meta">{i.year}</span>
                  <span className="wi-title">{i.title}{i.archive && <em> archive</em>}</span>
                  <span className="wi-line">{i.result ?? i.status ?? i.cardLine}</span>
                  <span className="wi-stack meta">{i.stack.slice(0, 3).join(' · ')}</span>
                  <span className="wi-arrow" aria-hidden="true">↗</span>
                </a>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ol>
      </LayoutGroup>
      {shown.length === 0 && <p className="muted">No project matches “{q}”.</p>}

      <div ref={preview} className="wi-preview" aria-hidden="true">
        <AnimatePresence>
          {hover?.cover && (
            <motion.img key={hover.id} src={hover.cover} alt="" initial={{ opacity: 0, scale: 0.9, rotate: -3 }} animate={{ opacity: 1, scale: 1, rotate: -2 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.35 }} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { ChevronLeft, CornerDownLeft, Play, GitCompare, Sparkles, Activity, Check, Copy } from 'lucide-react';
import { DiskLogo } from './disk-logo';

/*
 * An interactive replica of the diskMon desktop app with sample data and real-world developer scenarios:
 * 1. Live Memory & Workload Treemap (live sampling)
 * 2. Maintainer Fix Verification Diff (milestone alignment & PR delta)
 * 3. Empirical AI Reclaim Experiment (Ollama keep_alive: 0 unload & cold start benchmark)
 * Layout, colors and typography follow crates/resource-ui (app.rs, treemap.rs, theme.rs).
 */

type Category = 'browser' | 'ide' | 'lsp' | 'build' | 'container' | 'database' | 'llm' | 'app' | 'system';
type Metric = 'mem' | 'cpu' | 'disk';
type PreviewMode = 'live' | 'diff' | 'ai';
type Milestone = 'opened' | 'build_start' | 'build_done';
type DiffBranch = 'bug' | 'fix';

const CATEGORY: Record<Category, { name: string; color: string }> = {
  browser: { name: 'Browsers', color: '#f2ae3d' },
  ide: { name: 'IDEs', color: '#b07ce8' },
  lsp: { name: 'Language servers', color: '#6c9cf0' },
  build: { name: 'Builds', color: '#ec6a5c' },
  container: { name: 'Containers', color: '#4fbfae' },
  database: { name: 'Databases', color: '#9cc85a' },
  llm: { name: 'Local AI', color: '#ea8ab3' },
  app: { name: 'Apps', color: '#f08a3c' },
  system: { name: 'System', color: '#7d7973' },
};
const METRICS: { key: Metric; label: string }[] = [{ key: 'mem', label: 'Memory' }, { key: 'cpu', label: 'CPU' }, { key: 'disk', label: 'Disk I/O' }];
const TOTAL_RAM_MB = 32 * 1024;

interface Proc { pid: number; ppid: number; name: string; mem: number; cpu: number; disk: number; threads: number }
interface Workload { id: string; name: string; category: Category; procs: Proc[]; mem: number; cpu: number; disk: number; alert?: string | undefined; growth: number }

function workload(id: string, name: string, category: Category, memMb: number, count: number, cpu: number, diskKbs: number,
  named: [string, number][], filler: string, extra: { alert?: string; growth?: number } = {}): Workload {
  const base = 300 + (id.length * 977 + memMb * 13) % 60000;
  const rest = count - named.length;
  const left = memMb - named.reduce((a, [, m]) => a + m, 0);
  const weights = Array.from({ length: Math.max(1, rest) }, (_, i) => 0.86 ** i);
  const wsum = weights.reduce((a, b) => a + b, 0) || 1;
  const mems = [...named.map(([, m]) => m), ...weights.map(w => (left * w) / wsum)];
  const share = mems.map((m, i) => m * (1 + 0.6 * Math.sin(i * 2.3 + base)) + 1);
  const shareSum = share.reduce((a, b) => a + b, 0) || 1;
  const procs = mems.map((mem, i) => ({
    pid: base + i * 7,
    ppid: i === 0 ? 1 : base,
    name: named[i]?.[0] ?? filler,
    mem,
    cpu: (cpu * share[i]!) / shareSum,
    disk: (diskKbs * share[i]!) / shareSum,
    threads: 4 + Math.round(mem / 40) % 60,
  }));
  return { id, name, category, procs, mem: memMb, cpu, disk: diskKbs, alert: extra.alert, growth: extra.growth ?? 0.01 };
}

const BASE_WORKLOADS: Workload[] = [
  workload('chrome', 'Google Chrome', 'browser', 4710, 38, 23, 1400,
    [['Google Chrome Helper (GPU)', 540], ['Google Chrome', 410], ['Google Chrome Helper (Renderer)', 392], ['Google Chrome Helper (Renderer)', 344], ['Google Chrome Helper', 128]],
    'Google Chrome Helper (Renderer)', { alert: 'Grew 312 MB in 5 min', growth: 0.07 }),
  workload('ollama', 'Ollama', 'llm', 3150, 2, 85, 220, [['ollama_llama_server', 2960], ['ollama', 190]], 'ollama'),
  workload('docker', 'Docker', 'container', 2870, 9, 9, 12600,
    [['com.docker.virtualization', 2110], ['com.docker.backend', 310], ['Docker Desktop', 180], ['Docker Desktop Helper (Renderer)', 120]], 'com.docker.build'),
  workload('vscode', 'Visual Studio Code', 'ide', 1950, 14, 6, 340,
    [['Code Helper (Plugin)', 1420], ['Code Helper (Renderer)', 260], ['Code Helper (GPU)', 150], ['Code', 120]], 'Code Helper', { alert: 'Extension host leak: +1.4 GiB', growth: 0.22 }),
  workload('system', 'macOS System', 'system', 1640, 268, 4, 900,
    [['WindowServer', 380], ['mds_stores', 160], ['Spotlight', 92], ['launchd', 41], ['corespotlightd', 38]], 'system daemon'),
  workload('rust-analyzer', 'rust-analyzer', 'lsp', 1130, 1, 3, 40, [['rust-analyzer', 1130]], 'rust-analyzer', { alert: 'Grew 140 MB in 5 min', growth: 0.12 }),
  workload('slack', 'Slack', 'app', 820, 6, 1, 60, [['Slack Helper (Renderer)', 410], ['Slack', 190]], 'Slack Helper'),
  workload('cargo', 'Cargo build', 'build', 640, 5, 380, 2200, [['rustc', 380], ['rustc', 150], ['cargo', 60]], 'rustc', { alert: 'CPU above 100% for 30 s' }),
  workload('figma', 'Figma', 'app', 590, 6, 2, 30, [['Figma Helper (Renderer)', 330], ['Figma', 140]], 'Figma Helper'),
  workload('spotify', 'Spotify', 'app', 380, 4, 2, 80, [['Spotify Helper (Renderer)', 190], ['Spotify', 120]], 'Spotify Helper'),
  workload('postgres', 'PostgreSQL', 'database', 290, 7, 1, 160, [['postgres', 120]], 'postgres'),
];

const MORE = { apps: 22, procs: 52, mem: 420, cpu: 3, disk: 90 };
const PROCESS_COUNT = BASE_WORKLOADS.reduce((a, w) => a + w.procs.length, 0) + MORE.procs;
const APP_COUNT = BASE_WORKLOADS.length + MORE.apps;

const valueOf = (x: { mem: number; cpu: number; disk: number }, m: Metric) => (m === 'mem' ? x.mem : m === 'cpu' ? x.cpu : x.disk);
function mb(v: number) { return v >= 1024 ? `${(v / 1024).toFixed(2)} GB` : `${Math.round(v)} MB`; }
function rate(kbs: number) { return kbs >= 1024 ? `${Math.round(kbs / 1024)} MB/s` : `${Math.round(kbs)} KB/s`; }
function cpu(p: number) { return `${p >= 10 ? Math.round(p) : p.toFixed(1)}%`; }
const format = (x: { mem: number; cpu: number; disk: number }, m: Metric) => (m === 'mem' ? mb(x.mem) : m === 'cpu' ? cpu(x.cpu) : rate(x.disk));

function live<T extends { mem: number; cpu: number; disk: number }>(x: T, seed: number, tick: number, growth = 0): T {
  const s = Math.sin(tick * 0.9 + seed);
  return { ...x, mem: x.mem * (1 + 0.006 * s + growth * 0.02 * Math.min(tick, 30) / 30), cpu: Math.max(0.1, x.cpu * (1 + 0.18 * s)), disk: Math.max(0, x.disk * (1 + 0.35 * Math.sin(tick * 1.7 + seed))) };
}

type Rect = { x: number; y: number; w: number; h: number };
function squarify<T extends { value: number }>(items: T[], r: Rect): (T & Rect)[] {
  const total = items.reduce((a, i) => a + i.value, 0);
  if (!total || r.w <= 0 || r.h <= 0) return [];
  const scale = (r.w * r.h) / total;
  let rest = items.map(item => ({ item, area: item.value * scale }));
  let { x, y, w, h } = r;
  const out: (T & Rect)[] = [];
  const worst = (row: { area: number }[], side: number) => {
    const s = row.reduce((a, c) => a + c.area, 0);
    const max = Math.max(...row.map(c => c.area)), min = Math.min(...row.map(c => c.area));
    return Math.max((side * side * max) / (s * s), (s * s) / (side * side * min));
  };
  while (rest.length) {
    const side = Math.min(w, h);
    const row = [rest[0]!];
    let i = 1;
    while (i < rest.length && worst([...row, rest[i]!], side) <= worst(row, side)) row.push(rest[i++]!);
    rest = rest.slice(i);
    const thick = row.reduce((a, c) => a + c.area, 0) / side;
    let off = 0;
    for (const c of row) {
      const len = c.area / thick;
      out.push(w >= h ? { ...c.item, x, y: y + off, w: thick, h: len } : { ...c.item, x: x + off, y, w: len, h: thick });
      off += len;
    }
    if (w >= h) { x += thick; w -= thick; } else { y += thick; h -= thick; }
  }
  return out;
}

type Selection = { kind: 'workload'; id: string } | { kind: 'process'; id: string; pid: number } | null;
const HEADER_H = 20;
const MAX_CHILDREN = 24;
const tint = (color: string, pct: number) => `color-mix(in srgb, ${color} ${pct}%, #121110)`;

export function DiskPreview({ version, onWatchVideo }: { version: string; onWatchVideo?: () => void }) {
  const [mode, setMode] = useState<PreviewMode>('live');
  const [diffBranch, setDiffBranch] = useState<DiffBranch>('bug');
  const [milestone, setMilestone] = useState<Milestone>('build_done');
  const [aiUnloaded, setAiUnloaded] = useState(false);
  const [aiReloading, setAiReloading] = useState(false);

  const [metric, setMetric] = useState<Metric>('mem');
  const [focus, setFocus] = useState<string | null>(null);
  const [selection, setSelection] = useState<Selection>({ kind: 'workload', id: 'vscode' });
  const [filter, setFilter] = useState('');
  const [paused, setPaused] = useState(false);
  const [tick, setTick] = useState(0);
  const [frozenFor, setFrozenFor] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [size, setSize] = useState({ w: 620, h: 400 });
  const mapRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    const el = mapRef.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const id = setInterval(() => (paused ? setFrozenFor(s => s + 2) : setTick(t => t + 1)), 2000);
    return () => clearInterval(id);
  }, [paused]);

  useEffect(() => {
    if (!status) return;
    const id = setTimeout(() => setStatus(null), 4000);
    return () => clearTimeout(id);
  }, [status]);

  // Adjust workloads dynamically based on mode (Live, Diff, or AI Reclaim)
  const workloads = useMemo(() => {
    return BASE_WORKLOADS.map((w, wi) => {
      let memOverride = w.mem;
      let alertOverride = w.alert;

      // In PR Fix Diff mode:
      if (mode === 'diff') {
        if (w.id === 'vscode') {
          if (diffBranch === 'fix') {
            memOverride = milestone === 'opened' ? 520 : milestone === 'build_start' ? 610 : 710;
            alertOverride = undefined;
          } else {
            memOverride = milestone === 'opened' ? 620 : milestone === 'build_start' ? 1280 : 1950;
            alertOverride = milestone === 'build_done' ? 'Extension host leak: +1.4 GiB' : undefined;
          }
        }
      }

      // In AI Reclaim mode:
      if (mode === 'ai') {
        if (w.id === 'ollama') {
          memOverride = aiUnloaded ? 120 : 14200; // 14.2 GB Llama 3.3 weights + KV cache vs lightweight unloaded daemon
          alertOverride = aiUnloaded ? undefined : 'Llama-3.3-70B · 100% GPU VRAM';
        }
      }

      const procs = w.procs.map((p, pi) => {
        let pMem = p.mem;
        if (mode === 'diff' && w.id === 'vscode' && p.name.includes('Plugin')) {
          pMem = diffBranch === 'fix' ? (milestone === 'build_done' ? 180 : 120) : (milestone === 'build_done' ? 1420 : 890);
        }
        if (mode === 'ai' && w.id === 'ollama' && p.name.includes('server')) {
          pMem = aiUnloaded ? 40 : 14000;
        }
        return live({ ...p, mem: pMem }, wi * 3.1 + pi, tick, mode === 'live' ? w.growth : 0);
      });

      const sum = (k: 'mem' | 'cpu' | 'disk') => procs.reduce((a, p) => a + p[k], 0);
      return { ...w, procs, mem: sum('mem'), cpu: sum('cpu'), disk: sum('disk'), alert: alertOverride };
    });
  }, [tick, mode, diffBranch, milestone, aiUnloaded]);

  const more = useMemo(() => live(MORE, 42, tick), [tick]);
  const used = workloads.reduce((a, w) => a + w.mem, 0) + more.mem;
  const needle = filter.trim().toLowerCase();
  const matches = (w: Workload) => !needle || w.name.toLowerCase().includes(needle) || w.procs.some(p => p.name.toLowerCase().includes(needle));
  const focused = workloads.find(w => w.id === focus);

  const toggle = (next: Selection) => setSelection(s => (JSON.stringify(s) === JSON.stringify(next) ? null : next));
  const togglePause = () => { setPaused(p => !p); setFrozenFor(0); };

  const exportReport = () => {
    if (mode === 'diff') {
      const md = `### 🔍 diskMon Fix Verification Summary
- **Target Workload:** \`Visual Studio Code (Code Helper Plugin)\`
- **Milestone Aligned:** \`📍 Build Completed\`
- **Original Run (main):** 1.42 GiB (System Pressure: 76% High)
- **Verified Run (PR #42):** 180 MiB (System Pressure: 32% Normal)
- **Net Memory Delta:** **-1.24 GiB (-87.3%)**
- **Both Builds Succeeded:** 42.1s (main) vs 39.4s (PR #42)
> Generated by diskMon Milestone Verification.`;
      navigator.clipboard?.writeText(md);
      setStatus('✓ Copied Markdown PR verification summary to clipboard');
    } else if (mode === 'ai') {
      const md = `### 🤖 diskMon AI Reclaim Benchmark
- **Model:** \`Llama-3.3-70B-Instruct (q4_K_M)\`
- **Active Placement:** \`100% GPU / Unified Memory\`
- **RAM Recovered:** \`+14.08 GiB\` via \`POST /api/generate { keep_alive: 0 }\`
- **Cold Reload Latency:** \`3.1s\` (NVMe direct streaming)
- **Concurrency Impact:** Zero swap thrashing during concurrent builds.`;
      navigator.clipboard?.writeText(md);
      setStatus('✓ Copied AI benchmark telemetry to clipboard');
    } else {
      setStatus('Sample snapshot · Desktop app saves full Markdown to Downloads');
    }
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target instanceof HTMLInputElement) {
      if (e.key === 'Escape') { setFilter(''); e.currentTarget.focus(); }
      return;
    }
    const keys: Record<string, () => void> = {
      '1': () => setMetric('mem'), '2': () => setMetric('cpu'), '3': () => setMetric('disk'),
      p: togglePause, e: exportReport, '/': () => filterRef.current?.focus(),
      Enter: () => { if (selection?.kind === 'workload') setFocus(selection.id); },
      Backspace: () => setFocus(null), Escape: () => { setSelection(null); setFilter(''); },
    };
    const action = keys[e.key];
    if (action) { e.preventDefault(); action(); }
  };

  // --- treemap tiles -------------------------------------------------------------------------
  const tiles: ReactNode[] = [];
  const area = { x: 0, y: 0, w: size.w, h: size.h };
  const isSel = (kind: 'workload' | 'process', id: string, pid?: number) =>
    selection?.kind === kind && selection.id === id && (kind === 'workload' || (selection.kind === 'process' && selection.pid === pid));

  if (focused) {
    const color = CATEGORY[focused.category].color;
    const items = focused.procs.map(p => ({ ...p, value: valueOf(p, metric) })).filter(p => p.value > 0).sort((a, b) => b.value - a.value).slice(0, MAX_CHILDREN * 2);
    for (const n of squarify(items, area)) {
      const dim = needle && !n.name.toLowerCase().includes(needle);
      tiles.push(<button key={n.pid} type="button" title={`${n.name} (PID ${n.pid})`} onClick={() => toggle({ kind: 'process', id: focused.id, pid: n.pid })}
        className={`dm-tile dm-zoomed ${isSel('process', focused.id, n.pid) ? 'is-selected' : ''} ${dim ? 'is-dim' : ''}`}
        style={{ left: n.x + 1.5, top: n.y + 1.5, width: Math.max(0, n.w - 3), height: Math.max(0, n.h - 3), background: tint(color, 30), borderTopColor: color }}>
        {n.w > 60 && n.h > 34 && <span className="dm-stacked"><b>{n.name}</b><small>{format(n, metric)} · PID {n.pid}</small></span>}
      </button>);
    }
  } else {
    const ranked = workloads.map(w => ({ w, value: valueOf(w, metric) })).filter(i => i.value > 0).sort((a, b) => b.value - a.value);
    const items: { id: string; value: number; wl?: typeof ranked[number]['w'] }[] = ranked.map(i => ({ id: i.w.id, value: i.value, wl: i.w }));
    if (valueOf(more, metric) > 0) items.push({ id: 'more', value: valueOf(more, metric) });
    for (const n of squarify(items, area)) {
      const t = { x: n.x + 1.5, y: n.y + 1.5, w: n.w - 3, h: n.h - 3 };
      if (t.w < 2 || t.h < 2) continue;
      const w = n.wl;
      if (!w) {
        tiles.push(<div key="more" className="dm-tile dm-more" style={{ left: t.x, top: t.y, width: t.w, height: t.h }}>
          {t.w > 60 && t.h > 18 && <span className="dm-label"><b>{MORE.apps} more apps</b><small>{format(more, metric)}</small></span>}
        </div>);
        continue;
      }
      const color = CATEGORY[w.category].color;
      const header = t.h >= HEADER_H * 2 && t.w >= 70;
      const body = { x: 2, y: HEADER_H + 2, w: t.w - 4, h: t.h - HEADER_H - 4 };
      const kids = header && body.w >= 8 && body.h >= 8
        ? squarify(w.procs.map(p => ({ ...p, value: valueOf(p, metric) })).filter(p => p.value > 0).sort((a, b) => b.value - a.value).slice(0, MAX_CHILDREN), body)
        : [];
      tiles.push(<div key={w.id} role="button" tabIndex={-1} title={`${w.name}\n${format(w, metric)} · ${w.procs.length} processes`}
        className={`dm-tile ${w.alert ? 'is-flagged' : ''} ${isSel('workload', w.id) ? 'is-selected' : ''} ${matches(w) ? '' : 'is-dim'}`}
        style={{ left: t.x, top: t.y, width: t.w, height: t.h, background: tint(color, 22), ['--c' as string]: color }}
        onClick={() => toggle({ kind: 'workload', id: w.id })} onDoubleClick={() => { setFocus(w.id); setSelection({ kind: 'workload', id: w.id }); }}>
        {header ? <span className="dm-band" style={{ background: tint(color, 34), borderTopColor: color }}><b>{w.name}</b>{t.w > 140 && <small>{format(w, metric)}</small>}</span>
          : t.w > 60 && t.h > 18 && <span className="dm-label"><b>{w.name}</b>{t.w > 140 && <small>{format(w, metric)}</small>}</span>}
        {kids.map(k => {
          const r = { x: body.x + k.x + 1, y: body.y + k.y + 1, w: k.w - 2, h: k.h - 2 };
          if (r.w < 2 || r.h < 2) return null;
          return <span key={k.pid} className={`dm-child ${isSel('process', w.id, k.pid) ? 'is-selected' : ''}`} title={`${k.name} (PID ${k.pid})\nin ${w.name}`}
            style={{ left: r.x, top: r.y, width: r.w, height: r.h, background: tint(color, 40) }}
            onClick={e => { e.stopPropagation(); toggle({ kind: 'process', id: w.id, pid: k.pid }); }}>
            {r.w > 56 && r.h > 30 && <span className="dm-stacked"><b>{k.name}</b><small>{format(k, metric)}</small></span>}
          </span>;
        })}
      </div>);
    }
  }

  // --- side panel ----------------------------------------------------------------------------
  const selW = selection && workloads.find(w => w.id === selection.id);
  const selP = selection?.kind === 'process' ? selW?.procs.find(p => p.pid === selection.pid) : undefined;
  const subject = selP ?? selW;
  const subjectColor = selW ? CATEGORY[selW.category].color : '#f08a3c';
  const spark = useMemo(() => {
    const base = subject ? subject.mem : used;
    const growth = selW?.growth ?? 0.01;
    const pts = Array.from({ length: 150 }, (_, i) => base * (1 - growth + growth * (i / 149)) * (1 + 0.012 * Math.sin((i + tick) / 6) + 0.006 * Math.sin((i + tick) * 1.3)));
    const lo = Math.min(...pts) * 0.995, hi = Math.max(...pts) * 1.005;
    return pts.map((v, i) => `${(i / 149) * 100},${36 - ((v - lo) / (hi - lo)) * 34}`).join(' ');
  }, [subject, selW, used, tick]);

  const picks: { w: typeof workloads[number]; reason: string }[] = [];
  const pick = (w: typeof workloads[number] | undefined, reason: string) => { if (w && !picks.some(p => p.w.id === w.id)) picks.push({ w, reason }); };
  workloads.filter(w => w.alert).forEach(w => pick(w, w.alert!));
  const top = (k: (w: typeof workloads[number]) => number) => [...workloads].sort((a, b) => k(b) - k(a)).find(w => !picks.some(p => p.w.id === w.id));
  const byCpu = top(w => w.cpu); pick(byCpu, `${cpu(byCpu?.cpu ?? 0)} CPU`);
  const byDisk = top(w => w.disk); pick(byDisk, `${rate(byDisk?.disk ?? 0)} disk I/O`);
  const byCount = top(w => w.procs.length); pick(byCount, `${byCount?.procs.length ?? 0} processes`);
  const shown = picks.slice(0, 5);
  const largest = Math.max(...shown.map(p => p.w.mem));

  const memory = [{ name: 'Wired', gb: 3.1, color: '#ec6a5c' }, { name: 'Active', gb: 11.8, color: '#f08a3c' }, { name: 'Compressed', gb: 2.4, color: '#b07ce8' }, { name: 'Cached', gb: 7.0, color: '#7d7973' }];
  const present = (Object.keys(CATEGORY) as Category[]).filter(c => workloads.some(w => w.category === c));

  const simulateAiReload = () => {
    setAiReloading(true);
    setStatus('Reloading Llama-3.3 weights via NVMe stream...');
    setTimeout(() => {
      setAiUnloaded(false);
      setAiReloading(false);
      setStatus('✓ Model reloaded in 3.1s (100% GPU placement restored)');
    }, 3100);
  };

  return <div className={`dm-window ${paused ? 'is-paused' : ''}`} tabIndex={0} onKeyDown={onKey} aria-label="Interactive diskMon preview with sample data">
    <div className="dm-titlebar">
      <div className="traffic-lights"><i /><i /><i /></div>
      <span>diskMon</span>
      <div className="dm-mode-pills" role="tablist" aria-label="Preview Scenarios">
        <button type="button" role="tab" aria-selected={mode === 'live'} className={`dm-mode-pill ${mode === 'live' ? 'is-active' : ''}`} onClick={() => { setMode('live'); setSelection({ kind: 'workload', id: 'chrome' }); }}>
          <Activity size={10} /> Live Monitor
        </button>
        <button type="button" role="tab" aria-selected={mode === 'diff'} className={`dm-mode-pill ${mode === 'diff' ? 'is-active' : ''}`} onClick={() => { setMode('diff'); setSelection({ kind: 'workload', id: 'vscode' }); }}>
          <GitCompare size={10} /> PR Fix Diff
        </button>
        <button type="button" role="tab" aria-selected={mode === 'ai'} className={`dm-mode-pill ${mode === 'ai' ? 'is-active' : ''}`} onClick={() => { setMode('ai'); setSelection({ kind: 'workload', id: 'ollama' }); }}>
          <Sparkles size={10} /> AI Reclaim
        </button>
      </div>
    </div>

    {/* Dedicated Subbar for PR Fix Verification Mode */}
    {mode === 'diff' && (
      <div className="dm-diff-subbar">
        <div className="dm-milestone-track">
          <span className="dm-muted">ALIGNED MILESTONES:</span>
          {([['opened', '1. Opened Workspace (0:00)'], ['build_start', '2. Build Started (1:15)'], ['build_done', '3. Build Completed (2:40)']] as const).map(([k, label]) => (
            <button key={k} type="button" className={`dm-pin ${milestone === k ? 'is-active' : ''}`} onClick={() => setMilestone(k)}>
              📍 {label}
            </button>
          ))}
        </div>
        <div className="dm-branch-toggle">
          <button type="button" className={`dm-branch-btn ${diffBranch === 'bug' ? 'is-active-bug' : ''}`} onClick={() => setDiffBranch('bug')}>
            🔴 Main Branch (Bug Run)
          </button>
          <button type="button" className={`dm-branch-btn ${diffBranch === 'fix' ? 'is-active-fix' : ''}`} onClick={() => setDiffBranch('fix')}>
            🟢 PR #42 (Verified Fix)
          </button>
        </div>
      </div>
    )}

    {/* Dedicated Subbar for AI Reclaim Experiment Mode */}
    {mode === 'ai' && (
      <div className="dm-diff-subbar">
        <div className="dm-milestone-track">
          <span className="dm-muted">OLLAMA RUNTIME EXPERIMENT:</span>
          <span className="dm-tag-chip">Model: Llama-3.3-70B-q4</span>
          <span className="dm-tag-chip">Placement: 100% GPU VRAM</span>
          <span className="dm-tag-chip">KV Cache: 32K context</span>
        </div>
        <div className="dm-branch-toggle">
          {!aiUnloaded ? (
            <button type="button" className="dm-btn dm-resume" onClick={() => { setAiUnloaded(true); setStatus('Model unloaded: 14.1 GiB returned to OS'); }}>
              Test API Unload (keep_alive: 0)
            </button>
          ) : (
            <button type="button" className="dm-btn dm-export" disabled={aiReloading} onClick={simulateAiReload}>
              {aiReloading ? 'Streaming from NVMe (3.1s)...' : 'Benchmark Cold Reload'}
            </button>
          )}
        </div>
      </div>
    )}

    <div className="dm-header">
      <div className="dm-crumbs">
        <DiskLogo size={16} />
        <b>diskMon</b><span className="dm-muted">/</span>
        <button type="button" className={focused ? 'dm-muted' : ''} onClick={() => setFocus(null)}>All apps</button>
        {focused && <><span className="dm-muted">/</span><b className="dm-crumb-current">{focused.name}</b></>}
        {paused && <span className="dm-paused">PAUSED · frozen {frozenFor}s ago</span>}
      </div>
      <div className="dm-controls">
        <div className="dm-segment" role="group" aria-label="Size tiles by">{METRICS.map((m, i) =>
          <button key={m.key} type="button" title={`Size tiles by ${m.label} (${i + 1})`} aria-pressed={metric === m.key} className={metric === m.key ? 'is-on' : ''} onClick={() => setMetric(m.key)}>{m.label}</button>)}</div>
        <input ref={filterRef} className="dm-filter" value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter  /" aria-label="Filter apps and processes" />
        <button type="button" className={`dm-btn ${paused ? 'dm-resume' : ''}`} title={paused ? 'Resume live updates (P)' : 'Freeze the view on the current snapshot (P)'} onClick={togglePause}>{paused ? 'Resume' : 'Pause'}</button>
        <button type="button" className="dm-btn dm-export" title="Export report" onClick={exportReport}>
          {mode === 'diff' ? 'Copy PR Summary' : mode === 'ai' ? 'Copy AI Stats' : 'Export report'}
        </button>
        {onWatchVideo && (
          <button type="button" className="dm-btn" title="Watch full 4K video walkthrough" onClick={onWatchVideo} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Play size={10} fill="currentColor" /> 4K Walkthrough
          </button>
        )}
      </div>
    </div>
    <div className="dm-legend"><b>{mb(used)}</b><span className="dm-muted">· {PROCESS_COUNT} processes · {APP_COUNT} apps</span>
      <span className="dm-keys">{present.map(c => <span key={c}><i style={{ background: CATEGORY[c].color }} />{CATEGORY[c].name}</span>)}<span><i className="dm-hatch-key" />Has an alert</span></span>
    </div>
    {status && <div className="dm-status">{status}</div>}
    <div className="dm-body">
      <div className="dm-map-wrap">
        {focused && <button type="button" className="dm-back" onClick={() => setFocus(null)}><ChevronLeft size={12} /> All apps</button>}
        <div className="dm-map" ref={mapRef}>{tiles}</div>
      </div>
      <aside className="dm-side">
        {mode === 'diff' ? (
          <section className="dm-diff-panel">
            <h4>MAINTAINER VERIFICATION (PR #42)</h4>
            <div className="dm-diff-card">
              <div className="dm-diff-stat">
                <span>TARGET WORKLOAD</span>
                <b>VS Code (Code Helper Plugin)</b>
              </div>
              <div className="dm-diff-row">
                <div>
                  <small>MAIN (BUG RUN)</small>
                  <p className="dm-text-danger">1.42 GiB</p>
                </div>
                <div className="dm-diff-arrow">➔</div>
                <div>
                  <small>PR #42 (FIX RUN)</small>
                  <p className="dm-text-success">180 MiB</p>
                </div>
              </div>
              <div className="dm-diff-metric">
                <span>NET MEMORY DELTA:</span>
                <span className="dm-diff-badge is-green">-1.24 GiB (-87.3%)</span>
              </div>
              <div className="dm-diff-metric">
                <span>PRESSURE:</span>
                <span className="dm-text-dim">76% (High) ➔ 32% (Normal)</span>
              </div>
              <div className="dm-diff-metric">
                <span>BUILD STATUS:</span>
                <span className="dm-text-dim">42.1s ➔ 39.4s (Passed)</span>
              </div>
              <button type="button" className="dm-copy-pr-btn" onClick={exportReport}>
                <Copy size={11} /> Copy PR Markdown Summary
              </button>
            </div>
          </section>
        ) : mode === 'ai' ? (
          <section className="dm-diff-panel">
            <h4>OLLAMA MEMORY EXPERIMENT</h4>
            <div className="dm-diff-card">
              <div className="dm-diff-stat">
                <span>RUNNING MODEL</span>
                <b>Llama-3.3-70B-q4 (GGUF)</b>
              </div>
              <div className="dm-diff-metric">
                <span>HARDWARE PLACEMENT:</span>
                <span className="dm-diff-badge is-green">100% GPU Unified</span>
              </div>
              <div className="dm-diff-metric">
                <span>CONTEXT ALLOCATION:</span>
                <span className="dm-text-dim">4.8 GB KV Cache @ 32K</span>
              </div>
              <div className="dm-diff-metric">
                <span>MEMORY RECOVERED:</span>
                <span className="dm-diff-badge is-green">{aiUnloaded ? '+14.08 GiB' : '0 B (Model Warm)'}</span>
              </div>
              <div className="dm-diff-metric">
                <span>COLD RELOAD LATENCY:</span>
                <span className="dm-text-dim">3.1s from PCIe 4.0 SSD</span>
              </div>
              <div className="dm-ai-insight">
                💡 <em>At 3.1s reload cost, unloading idle models frees enough RAM to run Chrome & Cargo builds with zero swap stalls.</em>
              </div>
            </div>
          </section>
        ) : (
          <section>
            <h4>SELECTION</h4>
            {subject ? <>
              <div className="dm-sel-name"><i style={{ background: subjectColor }} />{subject.name}</div>
              <div className="dm-big">{mb(subject.mem).split(' ')[0]}<small>{mb(subject.mem).split(' ')[1]}</small></div>
              <div className="dm-muted dm-small">{selP ? `in ${selW!.name}` : CATEGORY[selW!.category].name}{selW?.alert && !selP ? ` · ${selW.alert}` : ''}</div>
              <div className="dm-spark-label"><span>LAST 5 MIN</span></div>
              <svg className="dm-spark" viewBox="0 0 100 38" preserveAspectRatio="none" aria-hidden="true"><polyline points={spark} fill="none" stroke={subjectColor} strokeWidth="1.4" vectorEffect="non-scaling-stroke" /></svg>
              <dl className="dm-stats">{(selP ? [['PID', String(selP.pid)], ['PARENT', String(selP.ppid)], ['CPU', cpu(selP.cpu)], ['DISK I/O', rate(selP.disk)], ['VIRTUAL', `${(1.5 + selP.mem / 250).toFixed(2)} GB`], ['THREADS', String(selP.threads)]]
                : [['OF RAM', `${((selW!.mem / TOTAL_RAM_MB) * 100).toFixed(1)}%`], ['PROCESSES', String(selW!.procs.length)], ['CPU', cpu(selW!.cpu)], ['DISK I/O', rate(selW!.disk)]]
              ).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
              {!selP && focus !== selW!.id && <button type="button" className="dm-look" onClick={() => setFocus(selW!.id)}>Look inside <CornerDownLeft size={11} /></button>}
            </> : <>
              <div className="dm-sel-name">All apps</div>
              <div className="dm-big">{mb(used).split(' ')[0]}<small>{mb(used).split(' ')[1]}</small></div>
              <div className="dm-muted dm-small">Click a tile to see what it is.</div>
            </>}
          </section>
        )}

        <section>
          <h4>WORTH A LOOK</h4>
          {shown.map(({ w, reason }) => <button type="button" key={w.id} className="dm-pick" style={{ ['--c' as string]: CATEGORY[w.category].color }} onClick={() => setSelection({ kind: 'workload', id: w.id })}>
            <span><b>{w.name}</b><span className="dm-mono">{mb(w.mem)}</span></span>
            <span><small>{reason}</small><i><i style={{ width: `${(w.mem / largest) * 100}%` }} /></i></span>
          </button>)}
        </section>
        <section>
          <h4>MEMORY</h4>
          <div className="dm-meter">{memory.map(m => <i key={m.name} style={{ width: `${(m.gb / 32) * 100}%`, background: m.color }} />)}</div>
          <div className="dm-meter-keys">{memory.map(m => <span key={m.name}><i style={{ background: m.color }} />{m.name} <b>{m.gb.toFixed(1)} GB</b></span>)}</div>
          <dl className="dm-rows">{[['Free', mode === 'ai' && aiUnloaded ? '21.78 GB' : '7.70 GB'], ['Total', '32.00 GB'], ['Swap used', mode === 'diff' && diffBranch === 'fix' ? '0 MB' : '512 MB of 2.00 GB'], ['Pressure', mode === 'diff' && diffBranch === 'fix' ? '32% (Normal)' : mode === 'diff' ? '76% (High)' : '38%']].map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
        </section>
      </aside>
    </div>
    <div className="dm-footer">
      <span className="dm-shortcuts">{[['click', 'select'], ['enter', 'open'], ['bksp', 'up'], ['/', 'filter'], ['1 2 3', 'mode'], ['p', 'pause'], ['e', 'export'], ['esc', 'clear']].map(([k, a]) => <span key={k}><kbd>{k}</kbd>{a}</span>)}</span>
      <span className={paused ? 'dm-amber' : ''}>
        {mode === 'diff' ? `PR Verification Mode · Aligned at milestone: ${milestone.replace('_', ' ')} · ${diffBranch === 'fix' ? 'PR #42 (Clean Fix)' : 'Main Branch (Bug)'}` : mode === 'ai' ? `Ollama Runtime Inspector · Llama-3.3-70B (${aiUnloaded ? 'Unloaded' : 'Active'})` : paused ? `paused · showing snapshot from ${frozenFor}s ago` : `diskMon ${version} · sampled ${PROCESS_COUNT} processes · 38 ms · updated 1s ago`}
      </span>
    </div>
  </div>;
}

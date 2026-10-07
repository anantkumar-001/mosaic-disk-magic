import { useState } from 'react';
import { Activity, AlertTriangle, Archive, ArrowUpRight, Check, ChevronDown, FileText, Grid2X2, HardDrive, Layers, LayoutDashboard, RotateCcw, Search, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

const categories = [
  { name: 'Ollama Local LLM', description: 'Local LLM · 29% of RAM · alert', size: 9.4, tone: 'amber', flagged: true },
  { name: 'Google Chrome', description: 'Browser · 38 processes', size: 4.6, tone: 'coral', flagged: false },
  { name: 'Docker Container Runtime', description: 'Container runtime · 9 processes', size: 2.8, tone: 'rose', flagged: false },
  { name: 'VS Code IDE', description: 'IDE · 14 processes', size: 1.9, tone: 'violet', flagged: false },
  { name: 'macOS System Daemons', description: 'System · 212 processes', size: 1.6, tone: 'blue', flagged: false },
  { name: 'Rust Analyzer', description: 'Language server · +140 MB growth · alert', size: 1.1, tone: 'teal', flagged: true },
];
const nav = [{ name: 'Overview', icon: LayoutDashboard }, { name: 'Find', icon: Search }, { name: 'Treemap', icon: Grid2X2 }, { name: 'Workloads', icon: Layers }, { name: 'Alerts', icon: AlertTriangle }, { name: 'History', icon: Archive }, { name: 'Monitor', icon: Activity }];

export function DiskPreview() {
  const [selected, setSelected] = useState<string[]>(categories.map(c => c.name));
  const [cleared, setCleared] = useState(false);
  const [active, setActive] = useState('Overview');
  const [search, setSearch] = useState('');
  const total = categories.filter(c => selected.includes(c.name)).reduce((a, c) => a + c.size, 0);
  const filtered = categories.filter(c => (active !== 'Alerts' || c.flagged) && c.name.toLowerCase().includes(search.toLowerCase()));
  return <div className="disk-window">
    <aside className="disk-sidebar">
      <div className="traffic-lights"><i /><i /><i /></div>
      <div className="sidebar-brand"><span className="brand-mark small"><HardDrive /></span> diskMon</div>
      <nav aria-label="diskMon preview">{nav.map(item => <Button key={item.name} variant="ghost" className={`preview-nav ${active === item.name ? 'is-active' : ''}`} onClick={() => setActive(item.name)}><item.icon /> <span>{item.name}</span></Button>)}</nav>
      <div className="sidebar-bottom"><span className="status-dot" /> 412 PIDs sampled <span>v0.1</span></div>
    </aside>
    <div className="disk-main">
      <div className="window-toolbar"><span>{active}</span><span className="preview-label">INTERACTIVE PREVIEW</span><span className="drive-tag"><HardDrive size={12} /> This Mac · 32 GB <ChevronDown size={12} /></span></div>
      <div className="disk-content">
        <div className="disk-heading"><div><span className="eyebrow">YOUR MEMORY, AT A GLANCE</span><h3>{cleared ? 'Your incident report is ready.' : 'Where your RAM is going.'}</h3></div><span className="scan-status"><Check size={12} /> Snapshot complete</span></div>
        {active === 'Find' && <label className="preview-search"><Search size={15} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Find a workload…" aria-label="Find a workload" /></label>}
        <div className="disk-analysis"><div className={`disk-ring ${cleared ? 'is-cleared' : ''}`}><div className="ring-center"><span className="ring-caption">{cleared ? 'IN YOUR REPORT' : 'SELECTED FOOTPRINT'}</span><strong>{total.toFixed(1)}<small>GB</small></strong><span>{cleared ? 'Exported as Markdown.' : 'of 32 GB physical RAM.'}</span><span className="ring-safe"><ShieldCheck size={12} /> {cleared ? 'Home paths redacted' : 'Read-only. Nothing is closed.'}</span></div></div>
          <div className="category-list"><div className="list-label">{cleared ? 'ADDED TO REPORT · DEMO' : 'WORKLOADS BY FOOTPRINT'}<span>RAM</span></div>{filtered.map(c => <label key={c.name} className={`category-row ${cleared && selected.includes(c.name) ? 'category-cleared' : ''}`}><input type="checkbox" checked={selected.includes(c.name)} disabled={cleared} onChange={() => setSelected(s => s.includes(c.name) ? s.filter(n => n !== c.name) : [...s, c.name])} /><span className={`category-color ${c.tone}`} /><span className="category-copy"><b>{c.name}</b><small>{c.description}</small></span><span className="category-size">{c.size.toFixed(1)} <small>GB</small></span></label>)}</div>
        </div>
        <div className="capacity-label"><span><HardDrive size={12} /> Physical memory</span><span><b>24.3 GB</b> in use of 32.0 GB</span></div><div className={`capacity-bar ${cleared ? 'capacity-cleared' : ''}`}><i /><i /><i /><i /><i /><i /><i /></div>
      </div>
      <div className="window-footer"><span><ShieldCheck size={13} /> {cleared ? 'Demo only. No data was read from your Mac.' : 'Read-only. diskMon never closes or changes a process.'}</span><Button variant={cleared ? 'outline' : 'ember'} size="sm" disabled={!total} onClick={() => { if (cleared) setCleared(false); else setCleared(true); }}>{cleared ? <><RotateCcw /> Replay</> : <><FileText /> Export report · {total.toFixed(1)} GB <ArrowUpRight /></>}</Button></div>
    </div>
  </div>;
}

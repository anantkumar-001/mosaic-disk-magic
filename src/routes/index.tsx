import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUpRight, Check, ChevronDown, ChevronUp, Command, HardDrive, LayoutGrid, LockKeyhole, Monitor, ScanLine, ShieldCheck, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MosaicLandscape } from '@/components/mosaic-landscape';
import { DiskPreview } from '@/components/disk-preview';

export const Route = createFileRoute('/')({
  head: () => ({ meta: [
    { title: 'diskMon — See where your memory goes.' },
    { name: 'description', content: 'diskMon is a free, open-source app for macOS and Windows that groups running processes into workloads, maps their memory in a treemap, and flags the ones putting your RAM under pressure.' },
    { property: 'og:title', content: 'diskMon — See where your memory goes.' },
    { property: 'og:description', content: 'Workload grouping, a memory treemap, and rule-based alerts for macOS and Windows. Explore the interactive diskMon preview.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
  ] }), component: Index,
});
const DOWNLOADS: Record<string, string> = {
  Mac: 'https://github.com/antcybersec/diskMon/releases/latest/download/diskMon-macos-universal.dmg',
  Windows: 'https://github.com/antcybersec/diskMon/releases/latest/download/diskMon-windows-x64.exe',
};
const download = (platform: string) => { const url = DOWNLOADS[platform]; if (url) window.location.href = url; };

const MODAL_COPY: Record<string, string> = {
  Mac: 'diskMon 0.1.1 for macOS 11 or later (Apple Silicon and Intel). Open the .dmg and drag diskMon to Applications. It is not notarized by Apple yet, so the first time you open it macOS blocks it: go to System Settings → Privacy & Security and click Open Anyway.',
  Windows: 'diskMon 0.1.1 for Windows 10 and 11 (64-bit). It is a single .exe with nothing to install. It is not code-signed yet, so Windows SmartScreen may warn you: click More info → Run anyway.',
  'Mac & Windows': 'Free and open source. Pick the app for your computer. Downloads come from the diskMon releases page on GitHub.',
};

const faqs = [
  ['Can diskMon close or change my apps?', 'No. diskMon only reads process information from your operating system. It never kills, pauses, or modifies a process. The preview on this page is a simulation with sample data and does not read anything from your device.'],
  ['What does diskMon measure?', 'For every running process: physical memory footprint, resident and virtual memory, CPU user and system time, bytes read from and written to disk, and (on macOS) thread count. It then adds those up for each workload.'],
  ['Is diskMon available for Mac and Windows?', 'Yes. diskMon 0.1.1 runs on macOS 11 or later (Apple Silicon and Intel) and on Windows 10 and 11 (64-bit). Both downloads are free. They are not code-signed yet, so your system asks you to confirm the first time you open the app.'],
  ['Does my data leave my computer?', 'No. diskMon collects and analyzes everything locally on your computer and makes no network connections. Incident reports redact your home folder path before you share them.'],
];
function Index() {
  const [platform, setPlatform] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  useEffect(() => {
    if (!platform) return;
    const listener = (e: KeyboardEvent) => { if (e.key === 'Escape') setPlatform(null); };
    document.addEventListener('keydown', listener);
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', listener); document.body.style.overflow = oldOverflow; };
  }, [platform]);
  return <>
    <header className="site-header"><a className="brand" href="#" aria-label="diskMon home"><span className="brand-mark"><HardDrive /></span>diskMon</a><nav className="header-nav" aria-label="Main navigation"><a href="#inside">Inside diskMon</a><a href="#availability">Availability</a><a href="#faq">FAQ</a></nav><div className="header-action"><span>Know what’s using your memory.</span><Button variant="ivory" size="sm" onClick={() => setPlatform('Mac & Windows')}>Get diskMon <ArrowUpRight /></Button></div></header>
    <main>
      <section className="hero"><MosaicLandscape /><div className="hero-copy"><div className="hero-badge"><span className="status-dot" /> Open source · For macOS and Windows <ArrowUpRight size={11} /></div><h1>diskMon.<br />See where your RAM <span>goes.</span></h1><p className="hero-description">Find out which apps are using your memory.<br />Grouped, mapped, and explained.</p><div className="hero-actions"><Button variant="ivory" onClick={() => { download('Mac'); setPlatform('Mac'); }}><Command /> Download for Mac <ArrowDown /></Button><Button variant="outline" onClick={() => { download('Windows'); setPlatform('Windows'); }}><Monitor /> Windows</Button></div><span className="hero-note"><ShieldCheck size={11} /> Read-only. Nothing leaves your computer.</span></div>
        <div className="preview-wrap" id="preview"><div className="preview-topline"><span><span className="status-dot" /> EVERY PROCESS HAS A PLACE.</span><span>TRY THE SAMPLE SNAPSHOT <ArrowDown size={10} /></span></div><DiskPreview /><div className="trust-line"><span><ShieldCheck /> Read-only by design</span><span><LockKeyhole /> Runs fully on your computer</span><span><Sparkles /> Written in Rust</span></div></div>
      </section>
      <section className="section" id="inside"><div className="section-header"><div><span className="eyebrow">01 / FROM PROCESSES TO ANSWERS</span><h2>Fewer PIDs.<br /><em>More answers.</em></h2></div><p>Activity Monitor lists hundreds of processes. diskMon groups them into the apps you actually run and shows which ones are using your memory.</p></div><div className="feature-grid">{[{icon:ScanLine,title:'See every workload.',text:'diskMon reads every running process and groups helpers into the app they belong to: browsers, IDEs, language servers, Docker, Ollama, and system processes.',number:'01 / GROUP'},{icon:LayoutGrid,title:'Map the memory.',text:'Each workload becomes a tile in a squarified treemap, sized by its physical memory footprint, so the biggest consumers stand out at a glance.',number:'02 / MAP'},{icon:ActivityIcon,title:'Catch problems early.',text:'Rule-based alerts flag any workload using 25% or more of your RAM (critical at 40%) and any workload that grows by more than 100 MB between snapshots.',number:'03 / DIAGNOSE'}].map(f => <article className="feature" key={f.title}><div className="feature-icon"><f.icon /></div><h3>{f.title}</h3><p>{f.text}</p><span className="feature-number">{f.number}</span></article>)}</div></section>
      <section className="section pricing-section" id="availability"><div className="pricing-copy"><span className="eyebrow">02 / WHERE IT STANDS</span><h2>Early days.<br />A <em>solid core.</em></h2><p>diskMon 0.1.1 is a free desktop app for macOS and Windows. It is early: the core is solid, and code signing comes next.</p><Button variant="ghost" onClick={() => document.getElementById('preview')?.scrollIntoView({ behavior: 'smooth' })}>Explore the preview <ArrowUpRight /></Button></div><div className="pricing-panel"><span className="eyebrow">MEET DISKMON</span><h3>Your memory, explained.</h3><p>Free and open source under the MIT license.</p><ul><li><Check /> Per-process memory, CPU time & disk I/O</li><li><Check /> Workload grouping & memory treemap</li><li><Check /> Rule-based diagnostic alerts</li><li><Check /> Privacy-redacted Markdown reports</li></ul><Button variant="ember" onClick={() => setPlatform('Mac & Windows')}>Download diskMon <ArrowUpRight /></Button></div></section>
      <section className="section faq-layout" id="faq"><div><span className="eyebrow">03 / GOOD QUESTIONS</span><h2>A little more<br /><em>peace of mind.</em></h2></div><div>{faqs.map(([q,a],i) => <div className="faq-item" key={q}><Button variant="ghost" className="faq-toggle" aria-expanded={openFaq === i} aria-controls={`answer-${i}`} onClick={() => setOpenFaq(openFaq === i ? null : i)}>{q}{openFaq === i ? <ChevronUp /> : <ChevronDown />}</Button>{openFaq === i && <p id={`answer-${i}`}>{a}</p>}</div>)}</div></section>
    </main><footer className="site-footer"><a className="brand" href="#"><span className="brand-mark small"><HardDrive /></span>diskMon</a><p>© 2026 diskMon. MIT licensed. See where your memory goes.</p><a href="#" className="footer-top">Back to the top <ArrowUpRight size={12} /></a></footer>
    {platform && <div className="download-overlay" onClick={() => setPlatform(null)}><section className="download-modal" role="dialog" aria-modal="true" aria-labelledby="download-title" onClick={e => e.stopPropagation()}><Button autoFocus variant="ghost" size="icon" className="modal-close" aria-label="Close download dialog" onClick={() => setPlatform(null)}><X /></Button><span className="brand-mark"><HardDrive /></span><span className="eyebrow modal-eyebrow">DISKMON FOR {platform.toUpperCase()}</span><h2 id="download-title">{platform === 'Mac & Windows' ? 'diskMon 0.1.1 is here.' : 'Your download has started.'}</h2><p>{MODAL_COPY[platform]}</p>{platform === 'Mac & Windows' ? <><Button variant="ember" className="mb-2 w-full" onClick={() => download('Mac')}><Command /> Download for Mac <ArrowDown /></Button><Button variant="outline" onClick={() => download('Windows')}><Monitor /> Download for Windows <ArrowDown /></Button></> : <Button variant="ember" onClick={() => download(platform)}>Download again <ArrowDown /></Button>}</section></div>}
  </>;
}
function ActivityIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 12h4l3-8 4 16 3-8h4" /></svg>; }

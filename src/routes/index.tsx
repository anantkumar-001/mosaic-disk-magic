import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUpRight, Check, ChevronDown, ChevronUp, Command, HardDrive, LayoutGrid, LockKeyhole, Monitor, ScanLine, ShieldCheck, Sparkles, Terminal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MosaicLandscape } from '@/components/mosaic-landscape';
import { DiskPreview } from '@/components/disk-preview';

export const Route = createFileRoute('/')({
  head: () => ({ meta: [
    { title: 'diskMon — See where your memory goes.' },
    { name: 'description', content: 'diskMon is a free, open-source app for macOS, Windows and Linux that groups running processes into workloads, maps their memory in a treemap, and flags the ones putting your RAM under pressure.' },
    { property: 'og:title', content: 'diskMon — See where your memory goes.' },
    { property: 'og:description', content: 'Workload grouping, a memory treemap, and rule-based alerts for macOS, Windows and Linux. Explore the interactive diskMon preview.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
  ] }), component: Index,
});
/** Latest desktop release; the download links below always serve the newest one. */
const VERSION = '0.3.0';
const RELEASES = 'https://github.com/antcybersec/diskMon/releases/latest/download';
/** Platform key for the pop-up that offers every download. */
const ALL = 'Mac, Windows & Linux';

const DOWNLOADS: Record<string, string> = {
  Mac: `${RELEASES}/diskMon-macos-universal.dmg`,
  Windows: `${RELEASES}/diskMon-windows-x64.exe`,
  Linux: `${RELEASES}/diskMon-linux-x86_64.AppImage`,
};
const download = (platform: string) => { const url = DOWNLOADS[platform]; if (url) window.location.href = url; };

const MODAL_COPY: Record<string, string> = {
  Mac: `diskMon ${VERSION} for macOS 11 or later (Apple Silicon and Intel). Open the .dmg and drag diskMon to Applications. It is not notarized by Apple yet, so the first time you open it macOS blocks it: go to System Settings → Privacy & Security and click Open Anyway.`,
  Windows: `diskMon ${VERSION} for Windows 10 and 11 (64-bit). It is a single .exe with nothing to install. It is not code-signed yet, so Windows SmartScreen may warn you: click More info → Run anyway.`,
  Linux: `diskMon ${VERSION} for Linux (x86_64) as an AppImage, which runs on most distributions. Make it executable with chmod +x diskMon-linux-x86_64.AppImage, then run it. If it doesn't start, run it with --appimage-extract-and-run. On Ubuntu or Debian you can install the .deb from the GitHub releases page instead.`,
  [ALL]: 'Free and open source. Pick the app for your computer. Downloads come from the diskMon releases page on GitHub.',
};

const faqs = [
  ['Can diskMon close or change my apps?', 'No. diskMon only reads process information from your operating system. It never kills, pauses, or modifies a process. The preview on this page is a simulation with sample data and does not read anything from your device.'],
  ['What does diskMon measure?', 'For every running process: memory footprint, live CPU use, disk read and write speed, virtual memory and (on macOS and Linux) thread count. diskMon adds those up for each app and keeps five minutes of history. On macOS it also shows wired, compressed and cached memory, swap and memory pressure.'],
  ['Is diskMon available for Mac, Windows and Linux?', `Yes. diskMon ${VERSION} runs on macOS 11 or later (Apple Silicon and Intel), Windows 10 and 11 (64-bit), and Linux (x86_64, as an AppImage or .deb). All downloads are free. They are not code-signed yet, so your system asks you to confirm the first time you open the app.`],
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
    <header className="site-header"><a className="brand" href="#" aria-label="diskMon home"><span className="brand-mark"><HardDrive /></span>diskMon</a><nav className="header-nav" aria-label="Main navigation"><a href="#inside">Inside diskMon</a><a href="#availability">Availability</a><a href="#faq">FAQ</a></nav><div className="header-action"><span>Know what’s using your memory.</span><Button variant="ivory" size="sm" onClick={() => setPlatform(ALL)}>Get diskMon <ArrowUpRight /></Button></div></header>
    <main>
      <section className="hero"><MosaicLandscape /><div className="hero-copy"><div className="hero-badge"><span className="status-dot" /> Open source · For macOS, Windows and Linux <ArrowUpRight size={11} /></div><h1>diskMon.<br />See where your RAM <span>goes.</span></h1><p className="hero-description">Find out which apps are using your memory.<br />Grouped, mapped, and explained.</p><div className="hero-actions"><Button variant="ivory" onClick={() => { download('Mac'); setPlatform('Mac'); }}><Command /> Download for Mac <ArrowDown /></Button><Button variant="outline" onClick={() => { download('Windows'); setPlatform('Windows'); }}><Monitor /> Windows</Button><Button variant="outline" onClick={() => { download('Linux'); setPlatform('Linux'); }}><Terminal /> Linux</Button></div><span className="hero-note"><ShieldCheck size={11} /> Read-only. Nothing leaves your computer.</span></div>
        <div className="preview-wrap" id="preview"><div className="preview-topline"><span><span className="status-dot" /> EVERY PROCESS HAS A PLACE.</span><span>TRY THE SAMPLE SNAPSHOT <ArrowDown size={10} /></span></div><DiskPreview /><div className="trust-line"><span><ShieldCheck /> Read-only by design</span><span><LockKeyhole /> Runs fully on your computer</span><span><Sparkles /> Written in Rust</span></div></div>
      </section>
      <section className="section" id="inside"><div className="section-header"><div><span className="eyebrow">01 / FROM PROCESSES TO ANSWERS</span><h2>Fewer PIDs.<br /><em>More answers.</em></h2></div><p>Activity Monitor lists hundreds of processes. diskMon groups them into the apps you actually run and shows which ones are using your memory.</p></div><div className="feature-grid">{[{icon:ScanLine,title:'See every workload.',text:'diskMon reads every running process and folds helpers into the app they belong to, from browsers and IDEs to language servers, Docker, Ollama and system processes.',number:'01 / GROUP'},{icon:LayoutGrid,title:'Map the memory.',text:'Each app becomes a tile in a nested treemap with its processes inside. Size it by memory, CPU or disk I/O, then zoom into any app to see what it is running.',number:'02 / MAP'},{icon:ActivityIcon,title:'Catch problems early.',text:'Alerts flag apps using 25% or more of your RAM, memory growth of over 100 MB, sustained high CPU, sudden process storms and high memory pressure.',number:'03 / DIAGNOSE'}].map(f => <article className="feature" key={f.title}><div className="feature-icon"><f.icon /></div><h3>{f.title}</h3><p>{f.text}</p><span className="feature-number">{f.number}</span></article>)}</div></section>
      <section className="section pricing-section" id="availability"><div className="pricing-copy"><span className="eyebrow">02 / WHERE IT STANDS</span><h2>Early days.<br />A <em>solid core.</em></h2><p>diskMon {VERSION} is a free desktop app for macOS, Windows and Linux. It is early: the core is solid, and code signing comes next.</p><Button variant="ghost" onClick={() => document.getElementById('preview')?.scrollIntoView({ behavior: 'smooth' })}>Explore the preview <ArrowUpRight /></Button></div><div className="pricing-panel"><span className="eyebrow">MEET DISKMON</span><h3>Your memory, explained.</h3><p>Free and open source under the MIT license.</p><ul><li><Check /> Live memory, CPU & disk I/O for every app</li><li><Check /> Nested treemap with zoom & filter</li><li><Check /> Alerts for leaks, CPU spikes & process storms</li><li><Check /> Privacy-redacted Markdown reports</li></ul><Button variant="ember" onClick={() => setPlatform(ALL)}>Download diskMon <ArrowUpRight /></Button></div></section>
      <section className="section faq-layout" id="faq"><div><span className="eyebrow">03 / GOOD QUESTIONS</span><h2>A little more<br /><em>peace of mind.</em></h2></div><div>{faqs.map(([q,a],i) => <div className="faq-item" key={q}><Button variant="ghost" className="faq-toggle" aria-expanded={openFaq === i} aria-controls={`answer-${i}`} onClick={() => setOpenFaq(openFaq === i ? null : i)}>{q}{openFaq === i ? <ChevronUp /> : <ChevronDown />}</Button>{openFaq === i && <p id={`answer-${i}`}>{a}</p>}</div>)}</div></section>
    </main><footer className="site-footer"><a className="brand" href="#"><span className="brand-mark small"><HardDrive /></span>diskMon</a><p>© 2026 diskMon. MIT licensed. See where your memory goes.</p><a href="#" className="footer-top">Back to the top <ArrowUpRight size={12} /></a></footer>
    {platform && <div className="download-overlay" onClick={() => setPlatform(null)}><section className="download-modal" role="dialog" aria-modal="true" aria-labelledby="download-title" onClick={e => e.stopPropagation()}><Button autoFocus variant="ghost" size="icon" className="modal-close" aria-label="Close download dialog" onClick={() => setPlatform(null)}><X /></Button><span className="brand-mark"><HardDrive /></span><span className="eyebrow modal-eyebrow">DISKMON FOR {platform.toUpperCase()}</span><h2 id="download-title">{platform === ALL ? `diskMon ${VERSION} is here.` : 'Your download has started.'}</h2><p>{MODAL_COPY[platform]}</p>{platform === ALL ? <><Button variant="ember" className="mb-2 w-full" onClick={() => download('Mac')}><Command /> Download for Mac <ArrowDown /></Button><Button variant="outline" className="mb-2 w-full" onClick={() => download('Windows')}><Monitor /> Download for Windows <ArrowDown /></Button><Button variant="outline" onClick={() => download('Linux')}><Terminal /> Download for Linux <ArrowDown /></Button></> : <Button variant="ember" onClick={() => download(platform)}>Download again <ArrowDown /></Button>}</section></div>}
  </>;
}
function ActivityIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 12h4l3-8 4 16 3-8h4" /></svg>; }

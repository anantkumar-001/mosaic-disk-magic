import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { MosaicLandscape } from "@/components/mosaic-landscape";
import { DiskPreview } from "@/components/disk-preview";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DiskMon — See and reclaim your disk space" },
      { name: "description", content: "DiskMon maps what fills your drive and clears junk safely in one click." },
      { property: "og:title", content: "DiskMon — See and reclaim your disk space" },
      { property: "og:description", content: "DiskMon maps what fills your drive and clears junk safely in one click." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const FEATURES = [
  { t: "Instant scan", d: "Map every gigabyte on your drive in seconds." },
  { t: "Safe cleanup", d: "Only removes caches, leftovers and junk you approve." },
  { t: "Live monitor", d: "Get a nudge before your disk fills up." },
];

function Index() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="text-xl font-semibold tracking-tight">Disk<span className="text-primary">Mon</span></span>
        <Button variant="outline" size="sm">Download</Button>
      </header>

      <section className="relative -mt-20 overflow-hidden">
        <MosaicLandscape className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background" />
        <div className="relative mx-auto flex min-h-[90vh] max-w-4xl flex-col items-center justify-center px-6 pt-24 text-center">
          <p className="mb-4 rounded-full border border-border bg-card/60 px-4 py-1 text-xs uppercase tracking-[0.2em] text-muted-foreground backdrop-blur">
            Disk cleanup, beautifully done
          </p>
          <h1 className="font-display text-6xl leading-[0.95] md:text-8xl">
            Clear the clutter.<br /><em className="text-primary">Keep the calm.</em>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            DiskMon shows exactly what's filling your drive and frees space safely in one click.
          </p>
          <div className="mt-8 flex gap-3">
            <Button size="lg">Download for Mac</Button>
            <Button size="lg" variant="outline">Windows</Button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-24 md:grid-cols-2">
        <div>
          <h2 className="font-display text-5xl">Try it right here.</h2>
          <p className="mt-4 text-muted-foreground">Pick what to sweep and watch the space come back.</p>
          <div className="mt-10 grid gap-6">
            {FEATURES.map((f) => (
              <div key={f.t} className="border-l-2 border-primary pl-4">
                <h3 className="font-semibold">{f.t}</h3>
                <p className="text-sm text-muted-foreground">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
        <DiskPreview />
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} DiskMon
      </footer>
    </main>
  );
}

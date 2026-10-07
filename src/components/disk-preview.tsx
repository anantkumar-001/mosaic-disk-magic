import { useState } from "react";
import { Button } from "@/components/ui/button";

const START = [
  { name: "System cache", size: 18.4 },
  { name: "Old downloads", size: 26.1 },
  { name: "Duplicate photos", size: 12.7 },
  { name: "App leftovers", size: 7.9 },
  { name: "Trash", size: 4.3 },
];
const TOTAL = 512;
const USED_BASE = 310;

export function DiskPreview() {
  const [items, setItems] = useState(START.map((i) => ({ ...i, on: true })));
  const [freed, setFreed] = useState(0);
  const junk = items.reduce((s, i) => s + i.size, 0);
  const selected = items.filter((i) => i.on).reduce((s, i) => s + i.size, 0);
  const used = USED_BASE + junk;

  const clean = () => {
    setFreed((f) => f + selected);
    setItems((list) => list.filter((i) => !i.on));
  };

  return (
    <div className="rounded-2xl border border-border bg-card/80 p-6 shadow-2xl backdrop-blur-xl">
      <div className="flex items-baseline justify-between">
        <p className="text-sm text-muted-foreground">Macintosh HD</p>
        <p className="text-sm text-muted-foreground">{used.toFixed(1)} / {TOTAL} GB</p>
      </div>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-muted">
        <div className="flex h-full transition-all duration-700" style={{ width: `${(used / TOTAL) * 100}%` }}>
          <div className="h-full bg-foreground/60" style={{ width: `${(USED_BASE / used) * 100}%` }} />
          <div className="h-full flex-1 bg-primary" />
        </div>
      </div>
      <ul className="mt-5 space-y-2">
        {items.map((i, idx) => (
          <li key={i.name}>
            <label className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 hover:bg-accent">
              <span className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={i.on}
                  onChange={() => setItems((l) => l.map((x, j) => (j === idx ? { ...x, on: !x.on } : x)))}
                  className="accent-[var(--primary)]"
                />
                {i.name}
              </span>
              <span className="tabular-nums text-muted-foreground">{i.size} GB</span>
            </label>
          </li>
        ))}
        {items.length === 0 && <li className="px-3 py-2 text-muted-foreground">All clean. Nothing left to sweep.</li>}
      </ul>
      <div className="mt-5 flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {freed > 0 ? `Freed ${freed.toFixed(1)} GB` : `${selected.toFixed(1)} GB selected`}
        </p>
        <Button onClick={clean} disabled={selected === 0}>Clean up</Button>
      </div>
    </div>
  );
}

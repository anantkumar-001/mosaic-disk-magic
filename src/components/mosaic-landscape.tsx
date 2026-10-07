import { useEffect, useRef } from "react";

// Canvas2D mosaic: 16px cells, animated wave, vignette + bloom.
const CELL = 16;

function ridge(x: number, seed: number, amp: number, base: number) {
  return (
    base +
    Math.sin(x * 0.004 + seed) * amp +
    Math.sin(x * 0.011 + seed * 2.3) * amp * 0.45 +
    Math.sin(x * 0.027 + seed * 5.1) * amp * 0.18
  );
}

export function MosaicLandscape({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let w = 0;
    let h = 0;
    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w;
      canvas.height = h;
    };
    resize();
    window.addEventListener("resize", resize);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const draw = (t: number) => {
      const time = reduce ? 0 : t / 1000;
      ctx.clearRect(0, 0, w, h);
      const cols = Math.ceil(w / CELL);
      const rows = Math.ceil(h / CELL);
      for (let cx = 0; cx < cols; cx++) {
        const x = cx * CELL;
        const far = ridge(x, 1.2, h * 0.08, h * 0.42);
        const mid = ridge(x, 3.7, h * 0.1, h * 0.58);
        const near = ridge(x, 6.1, h * 0.07, h * 0.76);
        for (let cy = 0; cy < rows; cy++) {
          const y = cy * CELL;
          const wave = Math.sin(cx * 0.18 + cy * 0.12 - time * 1.6) * 0.6;
          let r: number, g: number, b: number;
          if (y < far) {
            const k = y / far; // sky: deep night to copper horizon
            r = 18 + k * 120;
            g = 14 + k * 62;
            b = 20 + k * 30;
            const sun = Math.hypot(x - w * 0.5, y - far * 0.92) / (w * 0.35);
            const s = Math.max(0, 1 - sun);
            r += s * 120;
            g += s * 70;
            b += s * 30;
          } else if (y < mid) {
            r = 92; g = 52; b = 38;
          } else if (y < near) {
            r = 52; g = 30; b = 24;
          } else {
            r = 24; g = 15; b = 13;
          }
          // brightness 12 / contrast 115%
          const adj = (v: number) => Math.min(255, Math.max(0, (v - 128) * 1.15 + 128 + 12 + wave * 18));
          // vignette 38%
          const dx = (x - w / 2) / (w / 2);
          const dy = (y - h / 2) / (h / 2);
          const vig = 1 - Math.min(1, (dx * dx + dy * dy) * 0.38);
          const size = CELL - 3 + wave * 1.5;
          ctx.fillStyle = `rgb(${adj(r) * vig},${adj(g) * vig},${adj(b) * vig})`;
          ctx.fillRect(x + (CELL - size) / 2, y + (CELL - size) / 2, size, size);
        }
      }
      if (!reduce) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className={className}
      style={{ filter: "drop-shadow(0 0 24px var(--glow)) saturate(1.1)" }}
    />
  );
}

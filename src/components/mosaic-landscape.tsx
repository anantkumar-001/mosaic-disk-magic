import { useEffect, useRef } from 'react';
import landscape from '@/assets/mountain-source.jpg';

export function MosaicLandscape() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const photo = new Image();
    let frame = 0;
    let last = 0;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const sample = document.createElement('canvas');
    const sampler = sample.getContext('2d', { willReadFrequently: true });
    let colors: Uint8ClampedArray | undefined;
    let cols = 0;
    let rows = 0;
    const resize = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      cols = Math.ceil(canvas.width / 12);
      rows = Math.ceil(canvas.height / 12);
      sample.width = cols; sample.height = rows;
      if (!sampler || !photo.complete || !photo.naturalWidth) return;
      const ratio = Math.max(cols / photo.width, rows / photo.height);
      sampler.drawImage(photo, (cols - photo.width * ratio) / 2, (rows - photo.height * ratio) / 2, photo.width * ratio, photo.height * ratio);
      colors = sampler.getImageData(0, 0, cols, rows).data;
    };
    const draw = (time: number) => {
      if (colors && time - last > 65) {
        last = time;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
          const i = (y * cols + x) * 4;
          const wave = reduced ? 1 : 1 + Math.sin(x * .09 + y * .13 - time * .00065) * .085;
          const edge = Math.max(.3, 1 - Math.pow(Math.abs(x / cols - .5) * 1.7, 2) * .38);
          const tone = (v: number) => Math.max(0, Math.min(255, ((v - 128) * 1.15 + 140) * wave * edge));
          ctx.fillStyle = `rgb(${tone(colors[i] ?? 0)},${tone(colors[i + 1] ?? 0)},${tone(colors[i + 2] ?? 0)})`;
          ctx.fillRect(x * 12, y * 12, 11.4, 11.4);
        }
      }
      if (!reduced) frame = requestAnimationFrame(draw);
    };
    photo.onload = () => { resize(); frame = requestAnimationFrame(draw); };
    photo.src = landscape;
    const observer = new ResizeObserver(resize); observer.observe(canvas);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); photo.onload = null; };
  }, []);
  return <div className="landscape"><img src={landscape} alt="Sunrise over layered mountain peaks" width={1920} height={1024} /><canvas ref={ref} aria-hidden="true" /><div className="landscape-shade" /></div>;
}

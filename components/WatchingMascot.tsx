"use client";

import { useEffect, useRef } from "react";

/**
 * Cursor-tracking character drawn from a head-pose grid of transparent images
 * (public/mascot/r{row}_c{col}.webp), built by scripts/build_mascot_grid.py.
 *
 * Rows are head tilt, top row looking up. Columns are head turn toward
 * screen-left, c00 facing the camera. The right half of the screen uses the
 * same columns mirrored. Cursor X relative to the head picks the column,
 * cursor Y picks the row, so moving across the face passes through the
 * facing-camera pose instead of swinging around it.
 *
 * Canvas + pre-decoded images: drawing a frame is a copy, no video seeking,
 * and WebP alpha works on both themes.
 */
type Props = {
  rows?: number;
  cols?: number;
  dir?: string;
  /** Head centre as fractions of the component box. */
  head?: [number, number];
  /** Cursor distance (fraction of viewport width/height) that gives the full turn/tilt. */
  reach?: [number, number];
  /** 0..1 per 60fps frame; higher is snappier. */
  smoothing?: number;
  className?: string;
  label?: string;
};

/** Crossfade when the row changes or the left/right mirror switches. */
const SWITCH_FADE_MS = 120;
/** Row hysteresis, in normalised tilt units, so a cursor on a boundary can't flicker. */
const ROW_HYSTERESIS = 0.08;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export default function WatchingMascot({
  rows = 3,
  cols = 20,
  dir = "/mascot",
  head = [0.5, 0.3],
  reach = [0.4, 0.4],
  smoothing = 0.16,
  className,
  label = "Animated character that looks at your cursor",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [headX, headY] = head;
  const [reachX, reachY] = reach;

  useEffect(() => {
    const canvasEl = canvasRef.current;
    const ctxEl = canvasEl?.getContext("2d");
    if (!canvasEl || !ctxEl) return;
    const canvas: HTMLCanvasElement = canvasEl;
    const ctx: CanvasRenderingContext2D = ctxEl;

    const midRow = Math.floor(rows / 2);
    const images: (HTMLImageElement | null)[][] = Array.from({ length: rows }, () =>
      new Array<HTMLImageElement | null>(cols).fill(null),
    );
    let disposed = false;

    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = matchMedia("(pointer: fine)").matches;

    let pointer: { x: number; y: number } | null = null;
    // Signed, -1..1: yaw < 0 means the cursor is left of the head, pitch < 0 above it.
    let yaw = 0;
    let pitch = 0;
    let row = midRow;
    let shown: { img: HTMLImageElement; flip: boolean; row: number; col: number } | null = null;
    let fade: { img: HTMLImageElement; flip: boolean; start: number } | null = null;
    let lastKey = "";
    let raf = 0;
    let prev = performance.now();
    let visible = false;

    const url = (r: number, c: number) => `${dir}/r${r}_c${String(c).padStart(2, "0")}.webp`;

    const load = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.decode().then(() => resolve(img), reject);
      });

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      lastKey = "";
      draw(performance.now());
    };

    const drawImage = (img: HTMLImageElement, alpha: number, flip: boolean) => {
      const s = Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
      const w = img.naturalWidth * s;
      const h = img.naturalHeight * s;
      ctx.save();
      if (flip) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.globalAlpha = alpha;
      ctx.drawImage(img, (canvas.width - w) / 2, canvas.height - h, w, h);
      ctx.restore();
    };

    // Nearest loaded image in the same row, then the middle row, so the first
    // paint doesn't wait for the whole grid.
    const nearest = (r: number, c: number) => {
      for (const rr of [r, midRow]) {
        for (let d = 0; d < cols; d++) {
          const a = images[rr][c - d];
          if (a) return a;
          const b = images[rr][c + d];
          if (b) return b;
        }
      }
      return null;
    };

    function draw(now: number) {
      const col = Math.round(Math.abs(yaw) * (cols - 1));
      const flip = yaw > 0; // cursor right of the head: mirror the left-turn frames
      const img = nearest(row, col);
      if (!img) return;

      if (shown && (shown.flip !== flip || shown.row !== row)) {
        fade = { img: shown.img, flip: shown.flip, start: now };
      }
      shown = { img, flip, row, col };

      const fp = fade ? (now - fade.start) / SWITCH_FADE_MS : 1;
      if (fp >= 1) fade = null;

      const key = `${row}:${col}:${flip}:${fade ? Math.round(fp * 10) : "-"}`;
      if (key === lastKey) return;
      lastKey = key;
      canvas.dataset.pose = `${row},${flip ? -col : col}`;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawImage(img, 1, flip);
      if (fade) drawImage(fade.img, 1 - fp, fade.flip);
      ctx.globalAlpha = 1;
    }

    function tick(now: number) {
      const dt = Math.min((now - prev) / 1000, 0.05);
      prev = now;
      const k = 1 - Math.pow(1 - smoothing, dt * 60);

      let ty = 0;
      let tp = 0;
      if (pointer) {
        const r = canvas.getBoundingClientRect();
        const dx = pointer.x - (r.left + r.width * headX);
        const dy = pointer.y - (r.top + r.height * headY);
        ty = clamp(dx / (window.innerWidth * reachX), -1, 1);
        tp = clamp(dy / (window.innerHeight * reachY), -1, 1);
      } else if (!finePointer) {
        // Touch: no cursor to follow, so look slowly from side to side.
        ty = 0.6 * Math.sin(now / 2600);
      }

      yaw += (ty - yaw) * k;
      pitch += (tp - pitch) * k;

      // Row from tilt: equal bands, with hysteresis around each boundary.
      const band = 2 / rows;
      const centreOf = (r: number) => -1 + band * (r + 0.5);
      if (Math.abs(pitch - centreOf(row)) > band / 2 + ROW_HYSTERESIS) {
        row = clamp(Math.floor((pitch + 1) / band), 0, rows - 1);
      }

      draw(now);
      raf = requestAnimationFrame(tick);
    }

    const start = () => {
      if (raf || reducedMotion || disposed) return;
      prev = performance.now();
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      pointer = { x: e.clientX, y: e.clientY };
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(canvas);
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    (async () => {
      // First paint: facing the camera.
      try {
        images[midRow][0] = await load(url(midRow, 0));
      } catch {
        return;
      }
      if (disposed) return;
      lastKey = "";
      draw(performance.now());
      if (reducedMotion) return;

      // Then the rest, nearest-to-centre first, six at a time.
      const queue: [number, number][] = [];
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) queue.push([r, c]);
      queue.sort((a, b) => Math.abs(a[0] - midRow) + a[1] / cols - (Math.abs(b[0] - midRow) + b[1] / cols));
      let next = 0;
      const worker = async () => {
        while (next < queue.length && !disposed) {
          const [r, c] = queue[next++];
          if (images[r][c]) continue;
          try {
            images[r][c] = await load(url(r, c));
          } catch {
            /* a missing image falls back to its nearest loaded neighbour */
          }
        }
      };
      await Promise.all(Array.from({ length: 6 }, worker));
      if (visible) start();
    })();

    return () => {
      disposed = true;
      stop();
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, [rows, cols, dir, headX, headY, reachX, reachY, smoothing]);

  return <canvas ref={canvasRef} role="img" aria-label={label} className={className} />;
}
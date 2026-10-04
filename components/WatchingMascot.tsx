"use client";

import { useEffect, useRef } from "react";

/**
 * Cursor-tracking character drawn from a transparent image sequence
 * (public/mascot/f_000.webp ...), built by scripts/build_mascot_frames.py.
 *
 * mode "angle":      frames are one full gaze circle; the cursor's angle around
 *                    the head picks the frame, so the character looks at the
 *                    cursor in 2D.
 * mode "horizontal": frames are one left-to-right sweep; cursor X picks the frame.
 *
 * symmetric (angle mode): frames cover only the left half of the circle,
 * down (90) -> left (180) -> up (270), first and last inclusive; the right
 * half is drawn as their mirror image.
 *
 * Canvas + pre-decoded images instead of <video>.currentTime: seeking is
 * instant on every browser, and WebP alpha lets the character sit on either
 * theme without a matching background baked into the clip.
 */
type Props = {
  frameCount: number;
  dir?: string;
  mode?: "angle" | "horizontal";
  /** Image shown when the cursor is on the face (angle mode). */
  neutralSrc?: string;
  /** Gaze direction of frame 0, degrees on screen: 0 = right, 90 = down. */
  startAngleDeg?: number;
  /** True if the clip turns right -> down -> left -> up. */
  clockwise?: boolean;
  /** Frames span down -> left -> up only; mirror them for the right half. */
  symmetric?: boolean;
  /** Head centre as fractions of the component box. */
  head?: [number, number];
  /** Radius in px around the head inside which the neutral image fades in. */
  deadZone?: number;
  /** 0..1 per 60fps frame; higher is snappier. */
  smoothing?: number;
  className?: string;
  label?: string;
};

const TAU = Math.PI * 2;
/** Crossfade length when the mirrored half switches over (straight up / down). */
const FLIP_FADE_MS = 110;
/** Neutral fade speed per 60fps frame; faster than the head so the two faces overlap briefly. */
const NEUTRAL_SMOOTHING = 0.38;
/** The neutral pose turns off only once the cursor is this much beyond deadZone. */
const NEUTRAL_EXIT = 1.3;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export default function WatchingMascot({
  frameCount,
  dir = "/mascot",
  mode = "angle",
  neutralSrc,
  startAngleDeg = 0,
  clockwise = true,
  symmetric = false,
  head = [0.5, 0.4],
  deadZone = 90,
  smoothing = 0.16,
  className,
  label = "Animated character that looks at your cursor",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [headX, headY] = head;

  useEffect(() => {
    const canvasEl = canvasRef.current;
    const ctxEl = canvasEl?.getContext("2d");
    if (!canvasEl || !ctxEl) return;
    const canvas: HTMLCanvasElement = canvasEl;
    const ctx: CanvasRenderingContext2D = ctxEl;

    const frames: (HTMLImageElement | null)[] = new Array(frameCount).fill(null);
    let neutral: HTMLImageElement | null = null;
    let disposed = false;

    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = matchMedia("(pointer: fine)").matches;
    const angleMode = mode === "angle";

    let pointer: { x: number; y: number } | null = null;
    let cur = 0;
    let target = 0;
    let nCur = neutralSrc ? 1 : 0; // start facing the visitor until the mouse moves
    let nTarget = nCur;
    let lastKey = "";
    let shownIdx = -1;
    let shownFlip = false;
    let fade: { img: HTMLImageElement; flip: boolean; start: number } | null = null;
    let raf = 0;
    let prev = performance.now();
    let visible = false;

    const frameUrl = (i: number) => `${dir}/f_${String(i).padStart(3, "0")}.webp`;

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
      draw();
    };

    const drawImage = (img: HTMLImageElement, alpha: number, flip = false) => {
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

    // Which image to draw for the current position, and whether to mirror it.
    const pick = (): [number, boolean] => {
      if (!angleMode) return [Math.round(cur * (frameCount - 1)), false];
      if (!symmetric) return [Math.round(cur * frameCount) % frameCount, false];
      const deg = cur * 360;
      const flip = deg < 90 || deg > 270;
      const m = flip ? (540 - deg) % 360 : deg; // reflect across the vertical axis
      return [Math.round(((m - 90) / 180) * (frameCount - 1)), flip];
    };

    // Nearest decoded frame, so the first paint does not wait for the full set.
    const nearestFrame = (i: number) => {
      for (let d = 0; d < frameCount; d++) {
        const a = frames[(i + d) % frameCount];
        if (a) return a;
        const b = frames[(i - d + frameCount) % frameCount];
        if (b) return b;
      }
      return null;
    };

    function draw() {
      const [idx, flip] = pick();
      const now = performance.now();

      // Mirror switch: briefly fade the outgoing image instead of popping.
      if (shownIdx >= 0 && flip !== shownFlip) {
        const prev = nearestFrame(shownIdx);
        if (prev) fade = { img: prev, flip: shownFlip, start: now };
      }
      shownIdx = idx;
      shownFlip = flip;
      const fp = fade ? (now - fade.start) / FLIP_FADE_MS : 1;
      if (fp >= 1) fade = null;

      const n = neutral ? Math.round(nCur * 24) / 24 : 0;
      const key = `${idx}:${flip}:${n}:${fade ? Math.round(fp * 8) : "-"}`;
      if (key === lastKey) return;
      lastKey = key;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const frame = nearestFrame(idx);
      if (frame && n < 1) drawImage(frame, 1, flip);
      if (fade && n < 1) drawImage(fade.img, 1 - fp, fade.flip);
      if (neutral && n > 0) drawImage(neutral, n);
      ctx.globalAlpha = 1;
    }

    function tick(now: number) {
      const dt = Math.min((now - prev) / 1000, 0.05);
      prev = now;
      const k = 1 - Math.pow(1 - smoothing, dt * 60);

      if (pointer) {
        const r = canvas.getBoundingClientRect();
        if (angleMode) {
          const dx = pointer.x - (r.left + r.width * headX);
          const dy = pointer.y - (r.top + r.height * headY);
          let t = (Math.atan2(dy, dx) - (startAngleDeg * Math.PI) / 180) / TAU;
          t = ((t % 1) + 1) % 1;
          target = clockwise ? t : (1 - t) % 1;
          const dist = Math.hypot(dx, dy);
          if (!neutral) nTarget = 0;
          else if (dist < deadZone) nTarget = 1;
          else if (dist > deadZone * NEUTRAL_EXIT) nTarget = 0;
        } else {
          target = clamp01(pointer.x / window.innerWidth);
        }
      } else if (!finePointer) {
        // Touch: no cursor to follow, so drift slowly instead of freezing.
        nTarget = 0;
        target = angleMode ? (target + dt / 14) % 1 : 0.5 + 0.5 * Math.sin(now / 2600);
      }

      if (angleMode) {
        let d = target - cur;
        d -= Math.round(d); // shortest way round, never sweep through the whole clip
        cur = (((cur + d * k) % 1) + 1) % 1;
      } else {
        cur += (target - cur) * k;
      }
      const kn = 1 - Math.pow(1 - NEUTRAL_SMOOTHING, dt * 60);
      nCur += (nTarget - nCur) * kn;

      draw();
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
      // First paint: the neutral pose (or frame 0), then fill in the rest.
      const first = await Promise.allSettled([
        neutralSrc ? load(neutralSrc) : Promise.reject(),
        load(frameUrl(0)),
      ]);
      if (disposed) return;
      if (first[0].status === "fulfilled") neutral = first[0].value;
      if (first[1].status === "fulfilled") frames[0] = first[1].value;
      lastKey = "";
      draw();
      if (reducedMotion) return;

      // Six at a time keeps the hero's own requests from queueing behind ~100 images.
      let next = 1;
      const worker = async () => {
        while (next < frameCount && !disposed) {
          const i = next++;
          try {
            frames[i] = await load(frameUrl(i));
          } catch {
            /* a missing frame falls back to its nearest neighbour */
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
  }, [frameCount, dir, mode, neutralSrc, startAngleDeg, clockwise, symmetric, headX, headY, deadZone, smoothing]);

  return <canvas ref={canvasRef} role="img" aria-label={label} className={className} />;
}
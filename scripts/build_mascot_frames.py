#!/usr/bin/env python3
"""
Build public/mascot/ from a Flow clip shot on flat blue.

  python3 scripts/build_mascot_frames.py circle.mp4 \
      --keys 0.85:0 1.9:90 3.5:180 5.25:270 6.0:360 \
      --skip 5.42-5.58 --neutral 0.2 --crop 720:720:280:0 --size 600 --frames 72

--keys     time:angle pairs read off the clip (0 = looking right, 90 = down,
           180 = left, 270 = up, 360 = right again). Output frames are spaced
           evenly in angle, so uneven Veo timing doesn't skew the mapping.
--skip     time ranges to never use (blinks); the nearest clean frame is used.
--neutral  time of a looking-at-camera frame, written as neutral.webp.

Keying un-mixes the background from every edge pixel
(fg = (pixel - (1 - a) * key) / a) instead of cutting it, which is what
removes the blue fringe from fuzzy hair.

Needs: ffmpeg on PATH, pip install numpy pillow
"""
import argparse
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


def read_frames(clip, t0, t1, crop):
    w, h, x, y = map(int, crop.split(":"))
    cmd = ["ffmpeg", "-v", "error", "-ss", f"{t0}", "-to", f"{t1}", "-i", clip,
           "-vf", f"crop={w}:{h}:{x}:{y}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, h, w, 3)


def key_colour(frame):
    corner = frame[4:24, 4:24].reshape(-1, 3).astype(np.float32)
    return np.median(corner, axis=0)


def key(frame, bg, lo, hi):
    f = frame.astype(np.float32)
    # Blueness relative to the strongest other channel; the key scores ~190,
    # skin, hair, black and green cloth all score near or below zero.
    s = f[..., 2] - np.maximum(f[..., 0], f[..., 1])
    s_bg = bg[2] - max(bg[0], bg[1])
    a = np.clip((s_bg - s - (s_bg - hi)) / (hi - lo), 0, 1)

    # Un-mix: remove the key colour's contribution from partially covered pixels.
    a3 = np.maximum(a[..., None], 1e-3)
    fg = (f - (1 - a[..., None]) * bg) / a3
    fg = np.clip(fg, 0, 255)
    # Residual spill: blue may not exceed the brighter of red/green.
    fg[..., 2] = np.minimum(fg[..., 2], np.maximum(fg[..., 0], fg[..., 1]) * 1.05)

    alpha = Image.fromarray((a * 255).astype(np.uint8))
    alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.6))
    rgba = np.dstack([fg.astype(np.uint8), np.asarray(alpha)])
    return Image.fromarray(rgba, "RGBA")


def main():
    p = argparse.ArgumentParser()
    p.add_argument("clip")
    p.add_argument("--keys", nargs="+", required=True)
    p.add_argument("--skip", nargs="*", default=[])
    p.add_argument("--neutral", type=float)
    p.add_argument("--crop", default="720:720:280:0")
    p.add_argument("--size", type=int, default=600)
    p.add_argument("--frames", type=int, default=72)
    p.add_argument("--fps", type=float, default=24)
    p.add_argument("--lo", type=float, default=25, help="blueness where alpha hits 1")
    p.add_argument("--hi", type=float, default=150, help="blueness where alpha hits 0")
    p.add_argument("--out", default="public/mascot")
    p.add_argument("--quality", type=int, default=80)
    a = p.parse_args()

    keys = sorted((float(t), float(ang)) for t, ang in (k.split(":") for k in a.keys))
    times, angles = zip(*keys)
    skips = [tuple(map(float, s.split("-"))) for s in a.skip]

    t0, t1 = times[0], times[-1] + 1 / a.fps
    src = read_frames(a.clip, t0, t1, a.crop)
    src_t = t0 + np.arange(len(src)) / a.fps
    usable = np.array([not any(s0 <= t <= s1 for s0, s1 in skips) for t in src_t])
    bg = key_colour(src[0])
    print(f"key colour #{''.join(f'{int(c):02x}' for c in bg)}, {len(src)} source frames, "
          f"{(~usable).sum()} skipped")

    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    for old in out.glob("*.webp"):
        old.unlink()

    def save(img, name):
        img = img.resize((a.size, a.size), Image.LANCZOS)
        img.save(out / name, "WEBP", quality=a.quality, method=6)

    a0, a1 = angles[0], angles[-1]
    for i in range(a.frames):
        ang = a0 + (a1 - a0) * i / a.frames
        t = float(np.interp(ang, angles, times))
        order = np.argsort(np.abs(src_t - t))
        j = next(k for k in order if usable[k])
        save(key(src[j], bg, a.lo, a.hi), f"f_{i:03d}.webp")

    if a.neutral is not None:
        nf = read_frames(a.clip, a.neutral, a.neutral + 1 / a.fps, a.crop)[0]
        save(key(nf, bg, a.lo, a.hi), "neutral.webp")

    total = sum(f.stat().st_size for f in out.glob("*.webp"))
    print(f"wrote {a.frames} frames + neutral to {out}, {total / 1e6:.2f} MB")


if __name__ == "__main__":
    main()

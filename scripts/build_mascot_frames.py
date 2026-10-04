#!/usr/bin/env python3
"""
Build public/mascot/ from a Flow clip shot on flat blue.

  python3 scripts/build_mascot_frames.py circle.mp4 \
      --keys 0.85:0 1.9:90 3.5:180 5.25:270 6.0:360 \
      --skip 5.42-5.58 --neutral 0.2 --crop 720:720:280:0 --size 600 --frames 72

--keys     time:angle pairs read off the clip (0 = looking right, 90 = down,
           180 = left, 270 = up, 360 = right again). Output frames are spaced
           evenly in angle, so uneven Veo timing doesn't skew the mapping.
--skip     time ranges to never use (blinks). Output frames are spaced by
           measured visual change, so skipping never duplicates frames.
--neutral  time of a looking-at-camera frame, written as neutral.webp.
--symmetric
           frames span the first to the last key angle inclusive (use keys
           90 -> 180 -> 270: down, left, up). WatchingMascot's `symmetric` prop
           mirrors them for the right half. Use when the clip's head turn is
           only convincing on one side.

  python3 scripts/build_mascot_frames.py circle.mp4 --symmetric \
      --keys 1.61:90 3.5:180 5.4:270 --skip 2.9-3.05 --neutral 0.2 --frames 61

Keying un-mixes the background from every edge pixel
(fg = (pixel - (1 - a) * key) / a) instead of cutting it, which is what
removes the blue fringe from fuzzy hair.

Current portfolio frames were built from a 96fps motion-interpolated copy of
the loop segment (the raw 24fps clip has big pose gaps where Veo moved fast):

  ffmpeg -ss 1.5 -t 4.0 -i circle.mp4 -vf "minterpolate=fps=96:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1" \
      -c:v libx264 -crf 12 -pix_fmt yuv420p interp96.mp4
  python3 scripts/build_mascot_frames.py interp96.mp4 --fps 96 --symmetric \
      --keys 0.11:90 2.0:180 3.9:270 --frames 91

Don't interpolate across frames you cut out (e.g. a blink mid head-turn): the
gap is too large and the in-betweens smear.

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
    p.add_argument("--symmetric", action="store_true")
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

    # Key every usable source frame once.
    keyed = {j: key(src[j], bg, a.lo, a.hi) for j in np.nonzero(usable)[0]}
    idx = np.array(sorted(keyed))

    # Veo's motion is uneven: some stretches barely move, others jump. Measure the
    # visual change between consecutive usable frames (head region, premultiplied)
    # and space output frames evenly by that change inside each key segment, so
    # every output step shows about the same amount of movement.
    def head(img):
        arr = np.asarray(img, np.float32)
        h = arr.shape[0] * 2 // 3
        return arr[:h, :, :3] * (arr[:h, :, 3:] / 255)

    heads = [head(keyed[j]) for j in idx]
    step = [0.0] + [float(np.abs(heads[k] - heads[k - 1]).mean()) for k in range(1, len(idx))]
    cum = np.cumsum(step)
    t_of = t0 + idx / a.fps

    a0, a1 = angles[0], angles[-1]
    span = (a.frames - 1) if a.symmetric else a.frames
    for i in range(a.frames):
        ang = a0 + (a1 - a0) * i / span
        seg = min(np.searchsorted(angles, ang, side="right") - 1, len(angles) - 2)
        ta, tb = times[seg], times[seg + 1]
        ca, cb = np.interp([ta, tb], t_of, cum)
        frac = (ang - angles[seg]) / (angles[seg + 1] - angles[seg])
        target_c = ca + (cb - ca) * frac
        k = int(np.argmin(np.abs(cum - target_c) + 1e6 * ((t_of < ta - 1e-6) | (t_of > tb + 1e-6))))
        save(keyed[idx[k]], f"f_{i:03d}.webp")

    if a.neutral is not None:
        nf = read_frames(a.clip, a.neutral, a.neutral + 1 / a.fps, a.crop)[0]
        save(key(nf, bg, a.lo, a.hi), "neutral.webp")

    total = sum(f.stat().st_size for f in out.glob("*.webp"))
    print(f"wrote {a.frames} frames + neutral to {out}, {total / 1e6:.2f} MB")


if __name__ == "__main__":
    main()
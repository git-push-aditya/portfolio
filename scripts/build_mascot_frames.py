#!/usr/bin/env python3
"""
Build the head-pose grid for components/WatchingMascot.tsx from Flow clips
shot on flat chroma blue.

Each row is a clip segment in which the head turns from facing the camera to
facing screen-left at one fixed tilt. Rows are given top to bottom (looking up
first). Columns are picked by *measured* head yaw (MediaPipe face mesh), not
by time, so Veo's uneven speed doesn't matter. The component mirrors the
columns for the right half of the screen.

  python3 scripts/build_mascot_grid.py \
      --row up=upper.mp4:4.5:6.1 \
      --row level=lower.mp4:0:2.3 \
      --row down=lower.mp4:4.3:5.75 \
      --cols 20 --yaw-max 0.8

Writes public/mascot/r{row}_c{col}.webp (r0 = top row, c00 = facing camera).

Segments are motion-interpolated to 96fps first so every column can find a
close match. Don't include blinks in a segment: interpolating across the
eyes closing smears the face.

Needs: ffmpeg on PATH, pip install numpy pillow opencv-python "mediapipe==0.10.14"
(0.10.14 still ships the bundled face-mesh model; newer releases need a
separate model download).
"""
import argparse
import os
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

os.environ.setdefault("GLOG_minloglevel", "3")


def read_segment(clip, t0, t1, crop, fps):
    w, h, x, y = map(int, crop.split(":"))
    vf = (f"minterpolate=fps={fps}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,"
          f"crop={w}:{h}:{x}:{y}")
    cmd = ["ffmpeg", "-v", "error", "-ss", f"{t0}", "-t", f"{t1 - t0}", "-i", clip,
           "-vf", vf, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, h, w, 3)


def measure_yaw(frames):
    import mediapipe as mp

    mesh = mp.solutions.face_mesh.FaceMesh(static_image_mode=True, max_num_faces=1,
                                           min_detection_confidence=0.3)
    yaw = np.full(len(frames), np.nan)
    for i, f in enumerate(frames):
        res = mesh.process(f)
        if not res.multi_face_landmarks:
            continue
        lm = res.multi_face_landmarks[0].landmark
        nose, lc, rc = lm[1].x, lm[234].x, lm[454].x
        yaw[i] = (nose - (lc + rc) / 2) / max(abs(rc - lc), 1e-3)
    # Fill misses, then smooth landmark jitter.
    idx = np.arange(len(yaw))
    ok = ~np.isnan(yaw)
    yaw = np.interp(idx, idx[ok], yaw[ok])
    k = 7
    pad = np.pad(yaw, k // 2, mode="edge")
    return np.array([np.median(pad[i:i + k]) for i in range(len(yaw))])


def key_colour(frame):
    return np.median(frame[4:24, 4:24].reshape(-1, 3).astype(np.float32), axis=0)


def key(frame, bg, lo=25.0, hi=150.0):
    f = frame.astype(np.float32)
    # Blueness relative to the strongest other channel: the key scores ~190;
    # skin, hair, black and green cloth score near or below zero.
    s = f[..., 2] - np.maximum(f[..., 0], f[..., 1])
    a = np.clip((hi - s) / (hi - lo), 0, 1)
    # Un-mix the key colour from partially covered edge pixels.
    fg = (f - (1 - a[..., None]) * bg) / np.maximum(a[..., None], 1e-3)
    fg = np.clip(fg, 0, 255)
    fg[..., 2] = np.minimum(fg[..., 2], np.maximum(fg[..., 0], fg[..., 1]) * 1.05)
    alpha = Image.fromarray((a * 255).astype(np.uint8))
    alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.6))
    return Image.fromarray(np.dstack([fg.astype(np.uint8), np.asarray(alpha)]), "RGBA")


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--row", action="append", required=True, help="name=clip:start:end, top row first")
    p.add_argument("--cols", type=int, default=20)
    p.add_argument("--yaw-max", type=float, default=0.8,
                   help="turn of the last column, in face-mesh yaw units (0 = facing camera)")
    p.add_argument("--crop", default="720:720:280:0")
    p.add_argument("--size", type=int, default=600)
    p.add_argument("--fps", type=int, default=96)
    p.add_argument("--quality", type=int, default=80)
    p.add_argument("--out", default="public/mascot")
    a = p.parse_args()

    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    for old in out.glob("*.webp"):
        old.unlink()

    # The component mirrors the grid around the canvas centre, so the body has to
    # sit exactly on it; otherwise every left/right switch also shifts the head
    # sideways. Measure the body on the middle row's first frame and shift the crop.
    w, h, x, y = map(int, a.crop.split(":"))
    mid = a.row[len(a.row) // 2].split("=", 1)[1].rsplit(":", 2)
    probe_cmd = ["ffmpeg", "-v", "error", "-ss", mid[1], "-i", mid[0], "-frames:v", "1",
                 "-vf", f"crop={w}:{h}:{x}:{y}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
    probe = np.frombuffer(subprocess.run(probe_cmd, capture_output=True, check=True).stdout,
                          np.uint8).reshape(h, w, 3)
    alpha = np.asarray(key(probe, key_colour(probe)))[..., 3].astype(np.float32)
    band = alpha[int(h * 0.75):]  # shoulders, below the head
    centre = (band.sum(0) * np.arange(w)).sum() / band.sum()
    x += int(round(centre - (w - 1) / 2))
    a.crop = f"{w}:{h}:{x}:{y}"
    print(f"body centred: crop {a.crop}")

    for r, spec in enumerate(a.row):
        name, rest = spec.split("=", 1)
        clip, t0, t1 = rest.rsplit(":", 2)
        frames = read_segment(clip, float(t0), float(t1), a.crop, a.fps)
        yaw = -measure_yaw(frames)  # positive = turned toward screen-left
        bg = key_colour(frames[0])
        if yaw.max() < a.yaw_max * 0.95:
            print(f"warning: row {name} only reaches yaw {yaw.max():.2f} < {a.yaw_max}")

        last = 0
        picks = []
        for c in range(a.cols):
            target = a.yaw_max * c / (a.cols - 1)
            # Monotonic in time, so noise can't make the row jump back and forth.
            cand = np.arange(last, len(frames))
            j = int(cand[np.argmin(np.abs(yaw[cand] - target))])
            picks.append(j)
            last = j
            img = key(frames[j], bg).resize((a.size, a.size), Image.LANCZOS)
            img.save(out / f"r{r}_c{c:02d}.webp", "WEBP", quality=a.quality, method=6)
        got = [round(float(yaw[j]), 2) for j in picks]
        print(f"row {r} ({name}): {len(frames)} frames, yaw of picks {got}")

    total = sum(f.stat().st_size for f in out.glob("*.webp"))
    print(f"{len(a.row)} rows x {a.cols} cols -> {out}, {total / 1e6:.2f} MB")


if __name__ == "__main__":
    main()
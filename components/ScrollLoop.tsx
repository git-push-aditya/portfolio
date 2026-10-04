"use client";
import { useEffect } from "react";

// Wheel-down at the page bottom jumps to the top and holds there until the wheel goes quiet.
// ponytail: wheel only (no touch/keyboard); add touchmove if mobile needs it.
export default function ScrollLoop() {
  useEffect(() => {
    let bottomSince = 0;
    let locked = false;
    let quiet: ReturnType<typeof setTimeout>;
    const atBottom = () =>
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    const onScroll = () => {
      if (locked) window.scrollTo({ top: 0, behavior: "instant" });
      else if (!atBottom()) bottomSince = 0;
      else if (!bottomSince) bottomSince = Date.now();
    };
    const onWheel = (e: WheelEvent) => {
      // 400ms grace so the scroll that reached the bottom doesn't also trigger the jump
      if (!locked && e.deltaY > 0 && atBottom() && bottomSince && Date.now() - bottomSince > 400) {
        locked = true;
        bottomSince = 0;
        window.scrollTo({ top: 0, behavior: "instant" });
      }
      if (locked) {
        e.preventDefault(); // swallow the rest of the gesture's momentum
        clearTimeout(quiet);
        quiet = setTimeout(() => (locked = false), 200);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", onWheel);
      clearTimeout(quiet);
    };
  }, []);
  return null;
}

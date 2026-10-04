"use client";
import { useEffect, useState } from "react";
import { profile } from "@/lib/data";

const ICONS: Record<string, string> = {
  Twitter:
    "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  LinkedIn:
    "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zM7.119 20.452H3.555V9h3.564v11.452z",
};

export default function ConnectToast() {
  const [show, setShow] = useState(false);
  const [closed, setClosed] = useState(false);

  // visible only while the Skills section is on screen
  useEffect(() => {
    const el = document.getElementById("skills");
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShow(e.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (!show || closed) return null;
  return (
    <div
      onMouseEnter={() => document.body.setAttribute("data-cursor-suspended", "true")}
      onMouseLeave={() => document.body.removeAttribute("data-cursor-suspended")}
      className="fixed bottom-16 right-4 z-30 flex cursor-auto items-center gap-2.5 rounded-lg border border-border bg-card py-2 pl-3 pr-6 shadow-xl"
    >
      <p className="text-xs">Like what you see?? Connect with me</p>
      {profile.links
        .filter((l) => ICONS[l.label])
        .map((l) => (
          <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" aria-label={l.label} className="text-muted hover:text-accent">
            <svg viewBox="0 0 24 24" className={`shrink-0 fill-current ${l.label === "LinkedIn" ? "h-[1.15rem] w-[1.15rem]" : "h-4 w-4"}`}><path d={ICONS[l.label]} /></svg>
          </a>
        ))}
      <button
        onClick={() => {
          document.body.removeAttribute("data-cursor-suspended");
          setClosed(true);
        }}
        aria-label="Close"
        className="absolute right-1.5 top-1 cursor-pointer text-[10px] leading-none text-muted hover:text-foreground"
      >
        ✕
      </button>
    </div>
  );
}

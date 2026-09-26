"use client";

import { useEffect, useMemo, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function ScrollReveal({
  children,
  baseOpacity = 0.1,
  baseRotation = 6,
  blurStrength = 10,
  className = "",
}: {
  children: string;
  baseOpacity?: number;
  baseRotation?: number;
  blurStrength?: number;
  className?: string;
}) {
  const containerRef = useRef<HTMLParagraphElement>(null);

  const words = useMemo(
    () => children.split(/(\s+)/).map((w) => (w.match(/^\s+$/) ? w : { word: w })),
    [children],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { transformOrigin: "0% 50%", rotate: baseRotation },
        {
          ease: "none",
          rotate: 0,
          scrollTrigger: { trigger: el, start: "top bottom-=20%", end: "bottom bottom", scrub: true },
        },
      );

      const wordEls = el.querySelectorAll(".word");

      gsap.fromTo(
        wordEls,
        { opacity: baseOpacity, willChange: "opacity" },
        {
          ease: "none",
          opacity: 1,
          stagger: 0.05,
          scrollTrigger: { trigger: el, start: "top bottom-=20%", end: "bottom bottom", scrub: true },
        },
      );

      gsap.fromTo(
        wordEls,
        { filter: `blur(${blurStrength}px)` },
        {
          ease: "none",
          filter: "blur(0px)",
          stagger: 0.05,
          scrollTrigger: { trigger: el, start: "top bottom-=20%", end: "bottom bottom", scrub: true },
        },
      );
    }, el);

    return () => ctx.revert();
  }, [baseOpacity, baseRotation, blurStrength]);

  return (
    <p
      ref={containerRef}
      className={`font-[family-name:var(--font-lexend)] text-3xl leading-tight font-bold text-foreground sm:text-4xl ${className}`}
    >
      {words.map((w, i) =>
        typeof w === "string" ? w : (
          <span className="word inline-block" key={i}>
            {w.word}
          </span>
        ),
      )}
    </p>
  );
}

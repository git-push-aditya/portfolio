import { experience } from "@/lib/data";

export default function Experience() {
  return (
    <section id="experience" className="scroll-mt-20 border-t border-border py-20">
      <h2 className="text-xl font-semibold text-foreground">Experience</h2>
      <div className="mt-8 space-y-10">
        {experience.map((e) => (
          <div key={e.org}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-medium text-foreground">
                {e.role} · {e.org}
              </h3>
              <span className="font-mono text-xs text-muted">{e.dates}</span>
            </div>
            <p className="text-sm text-muted">
              {e.sub} — {e.location}
            </p>
            <ul className="mt-3 space-y-1.5 text-sm">
              {e.points.map((pt) => (
                <li key={pt} className="flex gap-2 leading-relaxed text-foreground/80">
                  <span className="text-muted">—</span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

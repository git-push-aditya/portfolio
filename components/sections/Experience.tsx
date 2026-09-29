import { experience } from "@/lib/data";
import StrokeText from "@/components/StrokeText";

export default function Experience() {
  return (
    <section id="experience" className="scroll-mt-20 py-20">
      <div className="w-fit">
        <StrokeText
          text="Experience"
          strokeColor="var(--accent)"
          fillColor="var(--foreground)"
          fontSize={96}
          fontWeight={600}
          letterSpacing={0}
          trigger="scroll"
        />
      </div>
      <div className="mt-8 space-y-10">
        {experience.map((e) => (
          <div key={e.org}>
            <div className="flex items-start justify-between gap-2">
              <h3 className="min-w-0 font-medium text-foreground">
                {e.role} · {e.org}
              </h3>
              <span className="shrink-0 whitespace-nowrap font-mono text-xs text-muted">{e.dates}</span>
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
            {e.stack.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {e.stack.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-full border border-border px-2.5 py-0.5 font-mono text-[11px] text-muted"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

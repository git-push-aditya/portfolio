import { achievements } from "@/lib/data";
import StrokeText from "@/components/StrokeText";

export default function Achievements() {
  return (
    <section id="achievements" className="scroll-mt-20 py-20">
      <div className="w-fit">
        <StrokeText
          text="Achievements"
          strokeColor="var(--accent)"
          fillColor="var(--foreground)"
          fontSize={96}
          fontWeight={600}
          letterSpacing={0}
          trigger="scroll"
        />
      </div>
      <div className="mt-8 grid gap-6">
        {achievements.map((a) => (
          <article key={a.title} className="rounded-xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-lg font-medium text-foreground">{a.title}</h3>
              {a.links.length > 0 && (
                <div className="flex gap-3 text-sm">
                  {a.links.map((l) => (
                    <a
                      key={l.label}
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cursor-target text-accent hover:underline"
                    >
                      {l.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
            <p className="mt-1 text-sm text-muted">{a.event}</p>
            <p className="font-mono text-xs text-accent">{a.result}</p>

            <ul className="mt-4 space-y-1.5 text-sm">
              {a.points.map((pt) => (
                <li key={pt} className="flex gap-2 leading-relaxed text-foreground/80">
                  <span className="text-muted">—</span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>

            {a.stack.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {a.stack.map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-border px-2.5 py-1 font-mono text-xs text-muted"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

import { projects } from "@/lib/data";

export default function Projects() {
  return (
    <section id="projects" className="scroll-mt-20 border-t border-border py-20">
      <h2 className="text-xl font-semibold text-foreground">Projects</h2>
      <div className="mt-8 grid gap-6">
        {projects.map((p) => (
          <article key={p.slug} className="rounded-xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-lg font-medium text-foreground">{p.title}</h3>
              {p.links.length > 0 && (
                <div className="flex gap-3 text-sm">
                  {p.links.map((l) => (
                    <a key={l.label} href={l.href} className="text-accent hover:underline">
                      {l.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
            <p className="mt-1 text-sm text-muted">{p.subtitle}</p>

            <ul className="mt-4 space-y-1.5 text-sm">
              {p.points.map((pt) => (
                <li key={pt} className="flex gap-2 leading-relaxed text-foreground/80">
                  <span className="text-muted">—</span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {p.stack.map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-border px-2.5 py-1 font-mono text-xs text-muted"
                >
                  {s}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

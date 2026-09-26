import { skills } from "@/lib/data";

export default function Skills() {
  return (
    <section id="skills" className="scroll-mt-20 border-t border-border py-20">
      <h2 className="text-xl font-semibold text-foreground">Skills</h2>
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {Object.entries(skills).map(([group, items]) => (
          <div key={group}>
            <p className="font-mono text-xs uppercase tracking-wider text-accent">{group}</p>
            <p className="mt-2 text-sm leading-relaxed text-foreground/80">{items.join(" · ")}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

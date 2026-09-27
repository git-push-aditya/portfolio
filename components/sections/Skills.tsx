import { skills } from "@/lib/data";
import StrokeText from "@/components/StrokeText";

export default function Skills() {
  return (
    <section id="skills" className="scroll-mt-20 py-20">
      <div className="w-fit">
        <StrokeText
          text="Skills"
          strokeColor="var(--accent)"
          fillColor="var(--foreground)"
          fontSize={96}
          fontWeight={600}
          letterSpacing={0}
          trigger="scroll"
        />
      </div>
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

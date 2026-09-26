import { profile } from "@/lib/data";
import Nav from "@/components/Nav";
import About from "@/components/sections/About";
import Experience from "@/components/sections/Experience";
import Projects from "@/components/sections/Projects";
import Achievements from "@/components/sections/Achievements";
import Skills from "@/components/sections/Skills";
import ScrollReveal from "@/components/ScrollReveal";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-6">
        <About />
        <Experience />
        <ScrollReveal className="py-12">
          Most bugs I've shipped were trust boundary problems, not logic errors. I'd rather constrain what a system
          can do than trust it to behave.
        </ScrollReveal>
        <Projects />
        <ScrollReveal className="py-12">
          I don't think LLMs replace backend engineers, they just make the schema and the guardrails the actual
          product. Everything else is plumbing.
        </ScrollReveal>
        <Achievements />
        <ScrollReveal className="py-12">
          I care more about a system I can roll back than one I got right the first time. Rollback is the feature
          that lets me move fast.
        </ScrollReveal>
        <Skills />
      </main>
      <footer className="border-t border-border py-10">
        <div className="mx-auto max-w-3xl px-6 text-sm text-muted">
          <a href={`mailto:${profile.email}`} className="hover:text-foreground">
            {profile.email}
          </a>
          {profile.links.map((l) => (
            <span key={l.label}>
              <span className="mx-2">·</span>
              <a href={l.href} className="hover:text-foreground">
                {l.label}
              </a>
            </span>
          ))}
        </div>
      </footer>
    </>
  );
}

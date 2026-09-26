import { profile } from "@/lib/data";
import Nav from "@/components/Nav";
import About from "@/components/sections/About";
import Experience from "@/components/sections/Experience";
import Projects from "@/components/sections/Projects";
import Achievements from "@/components/sections/Achievements";
import Skills from "@/components/sections/Skills";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-6">
        <About />
        <Experience />
        <Projects />
        <Achievements />
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

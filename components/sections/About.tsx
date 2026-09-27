import { profile } from "@/lib/data";
import ResumeModal from "@/components/ResumeModal";
import Particles from "@/components/Particles";
import TargetCursor from "@/components/TargetCursor";
import ChatWidget from "@/components/ChatWidget";

export default function About() {
  return (
    <section
      id="about"
      className="relative -mx-6 flex min-h-screen scroll-mt-20 flex-col justify-center px-6 text-center"
    >
      <TargetCursor hideDefaultCursor />

      <div className="pointer-events-none absolute inset-y-0 left-1/2 w-screen -translate-x-1/2 opacity-60">
        <Particles />
      </div>

      <div className="flex justify-center">
        <ChatWidget />
      </div>

      <p className="mt-6 font-mono text-xs tracking-widest text-muted">{profile.role.toUpperCase()}</p>

      <h1 className="mt-4 text-[15vw] font-black uppercase leading-[0.85] tracking-tight text-foreground sm:text-8xl">
        {profile.name}
      </h1>

      <p className="mt-6 text-xs font-medium uppercase tracking-[0.3em] text-muted">
        I build systems that are
      </p>
      <p className="mt-2 font-serif text-3xl italic text-foreground sm:text-5xl">safe by construction.</p>

      <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm">
        <ResumeModal triggerClassName="cursor-target rounded-full bg-accent px-5 py-2.5 font-medium text-black transition-opacity hover:opacity-90" />
        <a
          href={`mailto:${profile.email}`}
          className="cursor-target rounded-full border border-border px-5 py-2.5 text-foreground transition-colors hover:border-accent/40"
        >
          Email
        </a>
        {profile.links.map((l) => (
          <a
            key={l.label}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-target rounded-full border border-border px-5 py-2.5 text-foreground transition-colors hover:border-accent/40"
          >
            {l.label}
          </a>
        ))}
      </div>
    </section>
  );
}

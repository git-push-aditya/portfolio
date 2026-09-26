import { profile, about } from "@/lib/data";
import ResumeModal from "@/components/ResumeModal";

export default function About() {
  return (
    <section id="about" className="scroll-mt-20 py-20">
      <p className="font-mono text-sm text-accent">{profile.role}</p>
      <h1 className="mt-3 text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
        {profile.name}
      </h1>
      <p className="mt-5 max-w-xl leading-relaxed text-muted">{about.summary}</p>

      <div className="mt-8 rounded-xl border border-border bg-card p-5 text-sm">
        <p className="font-medium text-foreground">{about.education.school}</p>
        <p className="mt-1 text-muted">{about.education.degree}</p>
        <p className="mt-1 font-mono text-xs text-muted">
          {about.education.dates} · {about.education.location}
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-4 text-sm">
        <ResumeModal
          triggerClassName="rounded-full bg-accent px-5 py-2.5 font-medium text-black transition-opacity hover:opacity-90"
        />
        <a
          href={`mailto:${profile.email}`}
          className="rounded-full border border-border px-5 py-2.5 text-foreground transition-colors hover:border-accent/40"
        >
          Email
        </a>
        {profile.links.map((l) => (
          <a
            key={l.label}
            href={l.href}
            className="rounded-full border border-border px-5 py-2.5 text-foreground transition-colors hover:border-accent/40"
          >
            {l.label}
          </a>
        ))}
      </div>
    </section>
  );
}

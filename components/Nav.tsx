import { profile } from "@/lib/data";
import ThemeToggle from "@/components/ThemeToggle";

const NAV = [
  { href: "#about", label: "About" },
  { href: "#experience", label: "Experience" },
  { href: "#projects", label: "Projects" },
  { href: "#achievements", label: "Achievements" },
  { href: "#skills", label: "Skills" },
];

export default function Nav() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
      <nav className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
        <a href="#about" className="font-mono text-sm text-foreground">
          {profile.name}
        </a>
        <div className="flex items-center gap-6 overflow-x-auto text-sm text-muted">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="whitespace-nowrap hover:text-foreground">
              {n.label}
            </a>
          ))}
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}

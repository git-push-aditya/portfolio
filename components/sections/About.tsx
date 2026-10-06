import { profile } from "@/lib/data";
import ChatWidget from "@/components/ChatWidget";
import Particles from "@/components/Particles";
import TargetCursor from "@/components/TargetCursor";
import LocationWidget from "@/components/LocationWidget";
import StrokeText from "@/components/StrokeText";
import WatchingMascot from "@/components/WatchingMascot";
import HeroDock from "@/components/HeroDock";

// Full-screen hero: the character's face and chest fill the viewport, pushed 10svh below the fold so the hair
// clears the top. Rendered outside page.tsx's max-w-3xl <main> so it spans the whole screen.
export default function About() {
  return (
    <section id="about" className="relative h-svh overflow-hidden">
      <TargetCursor hideDefaultCursor />

      <div className="pointer-events-none absolute inset-0 opacity-60">
        <Particles moveParticlesOnHover={false} />
      </div>

      <div data-mascot className="pointer-events-none absolute -bottom-[10svh] portrait:-bottom-[20svh] left-1/2 w-[min(92svh,160vw)] -translate-x-1/2">
        <WatchingMascot head={[0.5, 0.3]} className="aspect-square w-full" />
      </div>

      {/* Name + location, bottom-left beside the body. Landscape: the name is sized to the gap left of the
          jacket (box left edge 50vw-46svh, jacket starts ~11svh further in). Portrait: the body fills the
          width, so the block moves to the empty space above the head, below the theme toggle. */}
      <div className="absolute inset-x-0 top-0 pt-40 landscape:top-auto landscape:bottom-0 landscape:pt-0">
        <div className="w-fit">
        <p className="mb-3 px-6 text-right font-mono text-xs font-semibold tracking-widest text-foreground/80">{profile.role}</p>
        {/* --fs is the font size the plain h1 used. StrokeText sizes its SVG from its fontSize prop in unlayered CSS,
            so the height override needs ! to win. The negative margins trim the SVG padding: tighter lines and smaller
            gaps to the role line above and the location below. */}
        <h1 className="px-6 [--fs:min(18vw,8rem)] landscape:[--fs:min(8rem,calc((50vw-35svh-2rem)/3.2))]">
          {profile.name.toUpperCase().split(" ").map((w) => (
            <span key={w} className="block w-fit first:-mt-[calc(var(--fs)*0.33)] not-first:-mt-[calc(var(--fs)*0.45)] last:-mb-[calc(var(--fs)*0.3)] [&_svg]:h-[calc(var(--fs)*1.3)]!">
              <StrokeText
                text={w}
                strokeColor="var(--accent)"
                fillColor="var(--foreground)"
                fontSize={96}
                fontWeight={900}
                letterSpacing={-2.4}
                drawDuration={1.4}
                fillDelay={0.3}
                stagger={0.08}
              />
            </span>
          ))}
        </h1>
        </div>
        {/* LocationWidget positions itself absolute bottom-6 across the full width; this strip is its anchor.
            Its opacity-50 leaves muted text too faint on white, so light mode shows it at full opacity. */}
        <div className="relative h-12 [[data-theme=light]_&>div]:opacity-100">
          <LocationWidget />
        </div>
      </div>

      {/* Resume / Email / profile links as a dock, top centre */}
      <div className="pointer-events-none absolute inset-x-0 top-20 z-50 flex justify-center sm:top-6 [&>*]:pointer-events-auto native-cursor">
        <HeroDock />
      </div>

      {/* Same spot as the floating button on the main page. Not inside a <section>, so ChatWidget stays in
          its inline mode and this wrapper does the pinning. */}
      <div className="fixed bottom-4 right-4 z-30">
        <ChatWidget />
      </div>
    </section>
  );
}

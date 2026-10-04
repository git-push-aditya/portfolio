"use client";

import { useRef } from "react";
import { profile } from "@/lib/data";
import dynamic from "next/dynamic";
import ResumeModal from "@/components/ResumeModal";

// Client-only: the dock sizes itself from window, so a server render would hydrate with the wrong icon size.
const MacOSDock = dynamic(() => import("@/components/ui/mac-os-dock"), { ssr: false });

const ICON: Record<string, string> = { GitHub: "github", LinkedIn: "linkedin", Twitter: "x", LeetCode: "leetcode" };

const apps = [
  { id: "resume", name: "Resume", icon: "/dock/resume.svg" },
  { id: "email", name: "Email", icon: "/dock/email.svg" },
  ...profile.links.map((l) => ({ id: l.href, name: l.label, icon: `/dock/${ICON[l.label]}.svg` })),
];

// The old hero buttons as a dock. Link apps use their href as id.
export default function HeroDock() {
  const resumeRef = useRef<HTMLDivElement>(null);

  const openResume = () => {
    resumeRef.current?.querySelector("button")?.click();
    const dialog = resumeRef.current?.querySelector("dialog");
    const cursor = document.querySelector<HTMLElement>(".target-cursor-wrapper");
    if (!dialog || !cursor) return;
    // showModal() puts the dialog in the browser's top layer, which no z-index can beat, so the tracker
    // cursor vanished behind its backdrop. A manual popover is top layer too, and opened after the dialog
    // it stacks above it. The style reset undoes the popover UA styles (centring margin, border, background).
    // ponytail: patched from here because ResumeModal/TargetCursor are untouched; move into ResumeModal on integration.
    cursor.popover = "manual";
    Object.assign(cursor.style, { right: "auto", bottom: "auto", margin: "0", border: "0", padding: "0", background: "none", overflow: "visible" });
    cursor.showPopover();
    // A closed popover is display:none, so drop the attribute (and the reset) entirely on close.
    dialog.addEventListener(
      "close",
      () => {
        cursor.hidePopover();
        cursor.removeAttribute("popover");
        Object.assign(cursor.style, { right: "", bottom: "", margin: "", border: "", padding: "", background: "", overflow: "" });
      },
      { once: true },
    );
  };

  const open = (id: string) => {
    // ponytail: ResumeModal only opens from its own button, so click its hidden trigger.
    // Give ResumeModal an open prop if more callers need this.
    if (id === "resume") openResume();
    else if (id === "email") location.href = `mailto:${profile.email}`;
    else window.open(id, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      {/* Icons grow downward from the top edge instead of up off-screen */}
      <MacOSDock apps={apps} onAppClick={open} className="[&_[title]]:top-0 [&_[title]]:bottom-auto!" />
      <div ref={resumeRef}>
        <ResumeModal triggerClassName="hidden" />
      </div>
    </>
  );
}

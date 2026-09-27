import { profile } from "@/lib/data";
import StaggeredMenu from "@/components/StaggeredMenu";

const NAV = [
  { label: "About", link: "#about" },
  { label: "Experience", link: "#experience" },
  { label: "Projects", link: "#projects" },
  { label: "Achievements", link: "#achievements" },
  { label: "Skills", link: "#skills" },
];

export default function Nav() {
  return (
    <StaggeredMenu
      position="right"
      items={NAV}
      socialItems={profile.links.map((l) => ({ label: l.label, link: l.href }))}
      colors={["#111113", "#1f1f23"]}
      accentColor="#4ade80"
    />
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono, Lexend } from "next/font/google";
import Script from "next/script";
import { profile, about } from "@/lib/data";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const lexend = Lexend({ variable: "--font-lexend", subsets: ["latin"] });

export const metadata: Metadata = {
  title: `${profile.name} — ${profile.role}`,
  description: about.summary,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${lexend.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-foreground antialiased selection:bg-accent selection:text-black">
        <Script id="theme-init" strategy="beforeInteractive">
          {`try{var t=localStorage.getItem("theme");if(t==="light"||(!t&&!matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.dataset.theme="light"}catch(e){}`}
        </Script>
        {children}
      </body>
    </html>
  );
}

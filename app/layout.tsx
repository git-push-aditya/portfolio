import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { profile, about } from "@/lib/data";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: `${profile.name} — ${profile.role}`,
  description: about.summary,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full bg-background text-foreground antialiased selection:bg-accent selection:text-black">
        {children}
      </body>
    </html>
  );
}

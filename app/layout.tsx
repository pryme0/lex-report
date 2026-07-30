import type { Metadata } from "next";
import { IBM_Plex_Sans, Source_Serif_4 } from "next/font/google";
import "./globals.css";
// Loaded after globals so each area's rules win where they overlap.
import "./styles/primitives.css";
import "./styles/judgment.css";
import "./styles/search.css";
import "./styles/corpora.css";
import "./styles/admin.css";
import "./styles/workspace.css";

// Self-hosted by Next so the fonts are not a render-blocking third-party request.
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-plex-sans",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-source-serif",
});

export const metadata: Metadata = {
  title: "LexReport — Nigerian Law Intelligence",
  description: "Verified judgments, ratio tracking, and litigation intelligence for Nigerian legal practice.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plexSans.variable} ${sourceSerif.variable}`}>
      <body>{children}</body>
    </html>
  );
}

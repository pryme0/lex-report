import type { Metadata } from "next";
import { QueryProvider } from "@/lib/api/query-provider";
import "./globals.css";
// Loaded after globals so each area's rules win where they overlap.
import "./styles/primitives.css";
import "./styles/judgment.css";
import "./styles/search.css";
import "./styles/corpora.css";
import "./styles/admin.css";
import "./styles/workspace.css";
import "./styles/landing.css";
import "./styles/auth.css";
import "./styles/ai-chat.css";
import "./styles/chat-page.css";
// Cross-route responsive safeguards load last so desktop-focused feature styles
// cannot accidentally reintroduce horizontal overflow on small screens.
import "./styles/responsive.css";

export const metadata: Metadata = {
  title: "LexReport — Nigerian Law Intelligence",
  description: "Verified judgments, ratio tracking, and litigation intelligence for Nigerian legal practice.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}

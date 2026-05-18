import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk, Instrument_Serif } from "next/font/google";
import "./globals.css";

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const sans = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FinAlly — Finance Ally",
  description: "AI-powered trading workstation. Live markets, simulated portfolio, AI copilot.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${mono.variable} ${sans.variable} ${display.variable}`}>
      <body className="bg-bg-base text-ink font-mono antialiased selection:bg-accent-yellow/30 selection:text-ink">
        <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.04] mix-blend-overlay bg-[radial-gradient(circle_at_25%_15%,#209dd7_0,transparent_45%),radial-gradient(circle_at_85%_85%,#753991_0,transparent_50%)]" />
        <div className="pointer-events-none fixed inset-0 z-0 [background-image:linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] [background-size:48px_48px]" />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NeonGammon – Backgammon",
  description:
    "A sleek neon-glassmorphism backgammon game with AI opponent. Play against Easy, Medium, or Hard AI in this fully-featured browser game.",
  keywords: ["backgammon", "board game", "neon", "next.js", "AI opponent"],
  authors: [{ name: "NeonGammon" }],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "NeonGammon",
    description: "Play backgammon against a smart AI opponent",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#0a0a1a] text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({ subsets: ["latin"] });
const playfair = Playfair_Display({ subsets: ["latin"], variable: '--font-serif' });

export const metadata: Metadata = {
  title: "Pulse Tracker",
  description: "Elite Training Dashboard - Track workouts, analyze performance, and get AI-powered coaching",
  keywords: ["workout tracker", "fitness", "training", "AI coach", "performance analytics"],
  authors: [{ name: "Pulse Tracker" }],
  openGraph: {
    title: "Pulse Tracker",
    description: "Elite Training Dashboard",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${playfair.variable} bg-[#F5F5F4] text-foreground antialiased selection:bg-rose-500/20 selection:text-stone-900`}>
        <div className="min-h-screen flex flex-col relative overflow-hidden">
          {/* Subtle Texture/Grain Overlay (Global) */}
          <div
            className="fixed inset-0 pointer-events-none opacity-[0.03] z-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />

          <Navbar />

          <main className="flex-1 relative z-10 flex flex-col">
            {children}
          </main>
        </div>

        {/* Vercel Analytics & Speed Insights */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });
const playfair = Playfair_Display({ subsets: ["latin"], variable: '--font-serif' });

export const metadata: Metadata = {
  title: "Pulse Tracker",
  description: "Elite Training Dashboard",
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
          <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] z-0"></div>

          <Navbar />

          <main className="flex-1 relative z-10 flex flex-col">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

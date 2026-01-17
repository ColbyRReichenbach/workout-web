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
      <body className={`${inter.className} ${playfair.variable} bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary`}>
        {/* Global Pulse Border Container */}
        <div className="min-h-screen flex flex-col relative overflow-hidden">

          {/* Viewport Pulse Border */}
          <div className="fixed inset-4 border border-black/5 rounded-[40px] pointer-events-none z-[100] pulse-border-beam opacity-40"></div>

          <Navbar />

          <main className="flex-1 pt-32 pb-20 relative z-10">
            {/* Subtle Texture/Grain Overlay */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] z-0"></div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10 font-sans">
              {children}
            </div>
          </main>

          {/* Footer Branding */}
          <footer className="py-12 border-t border-black/[0.03] text-center">
            <p className="font-serif text-xl opacity-20 tracking-widest italic">Live by the Pulse.</p>
          </footer>
        </div>
      </body>
    </html>
  );
}

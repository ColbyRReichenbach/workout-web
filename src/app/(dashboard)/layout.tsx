import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { DEMO_USER_ID } from "@/lib/constants";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Check if the user has a completed profile (height/weight)
    if (user && user.id !== DEMO_USER_ID) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('height, weight_lbs')
            .eq('id', user.id)
            .single();

        if (!profile || !profile.height || !profile.weight_lbs) {
            // Profile is incomplete, force onboarding before showing dashboard shell
            redirect('/onboarding');
        }
    }

    return (
        <div className="flex-1 flex flex-col relative w-full">
            {/* Scanline Pulse Diagnostic Overlay - Background Layer */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                {/* Sweeping Laser Bar - Calibrated to Pulse Red (#ef4444) */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-[#ef4444]/40 shadow-[0_0_24px_rgba(239,68,68,0.8)] scan-line" />

                {/* Carbon Fibre Texture Overlay */}
                <div className="absolute inset-0 bg-carbon-fibre" />

                {/* High-Frequency Biometric Flicker */}
                <div className="absolute inset-0 bg-[#ef4444]/5 animate-biometric-flicker" />
            </div>

            {/* Main Content Area with Constraints */}
            <div className="flex-1 pt-32 pb-20 relative z-10 w-full">
                <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10 font-sans">
                    {children}
                </div>
            </div>

            {/* App Footer Branding */}
            <footer className="py-12 border-t border-black/[0.03] text-center">
                <p className="font-serif text-xl opacity-20 tracking-widest italic text-stone-900">Live by the Pulse.</p>
            </footer>
        </div>
    );
}

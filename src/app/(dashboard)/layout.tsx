export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex-1 flex flex-col relative w-full">
            {/* Viewport Pulse Border - Only for Dashboard pages */}
            <div className="fixed inset-4 border border-black/5 rounded-[40px] pointer-events-none z-[100] pulse-border-beam opacity-40"></div>

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

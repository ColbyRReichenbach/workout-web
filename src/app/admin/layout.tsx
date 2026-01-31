export const metadata = {
    title: 'AI Internal | Pulse Admin',
    description: 'Internal AI precision and performance dashboard',
};

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-[#0a0a0b] text-slate-200">
            {children}
        </div>
    );
}

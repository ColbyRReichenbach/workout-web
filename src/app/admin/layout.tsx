import { redirect } from 'next/navigation';
import { getUserSettingsServer } from '@/lib/userSettingsServer';

export const metadata = {
    title: 'AI Internal | Pulse Admin',
    description: 'Internal AI precision and performance dashboard',
};

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const settings = await getUserSettingsServer();

    if (!settings.is_admin) {
        redirect('/');
    }

    return (
        <div className="min-h-screen bg-[#0a0a0b] text-slate-200">
            {children}
        </div>
    );
}

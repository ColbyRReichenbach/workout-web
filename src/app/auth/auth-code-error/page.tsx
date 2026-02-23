import Link from 'next/link';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { NanoParticles } from "@/components/NanoParticles";

export default async function AuthCodeErrorPage(props: { searchParams: Promise<{ error?: string }> }) {
    const searchParams = await props.searchParams;
    const errorMsg = searchParams.error || "An error occurred during authentication.";

    return (
        <div className="relative min-h-screen w-full bg-[#f5f2ed] flex items-center justify-center overflow-hidden font-sans selection:bg-red-100">
            {/* Background Glows */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <div className="absolute top-[-5%] left-[-5%] w-[50%] h-[50%] bg-red-100/30 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-5%] right-[-5%] w-[50%] h-[50%] bg-[#ef4444]/5 blur-[120px] rounded-full" />
            </div>

            <NanoParticles intensity={0} heartDuration="4s" />

            <div className="relative z-20 w-full max-w-md px-6">
                <div className="bg-white/40 backdrop-blur-xl border border-white/20 shadow-xl p-10 rounded-[2.5rem] space-y-8 flex flex-col justify-center transition-all duration-500 relative">
                    <div className="text-center space-y-4 pt-4">
                        <div className="mx-auto w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
                            <AlertCircle className="w-8 h-8" />
                        </div>
                        <h1 className="text-3xl font-serif text-zinc-900 tracking-tight leading-tight">
                            Authentication Error
                        </h1>
                        <p className="text-zinc-500 text-sm font-medium">
                            {errorMsg}
                        </p>
                    </div>

                    <div className="pt-8">
                        <Link
                            href="/login"
                            className="w-full bg-zinc-900 text-white font-bold py-4 rounded-2xl hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/10 flex items-center justify-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

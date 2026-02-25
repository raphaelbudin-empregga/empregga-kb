import { Metadata } from 'next';
import Link from 'next/link';
import EvaChat from '../../components/EvaChat';

export const metadata: Metadata = {
    title: 'EVA Chat | Empregga',
    description: 'Converse com a Assistente Virtual da Empregga.',
};

export default function ChatPage() {
    return (
        <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-background">
            <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full border-x border-primary/5 shadow-2xl bg-white">
                {/* Chat Header */}
                <div className="flex items-center gap-4 px-6 py-4 bg-[#260A00] text-white shrink-0 shadow-md z-10 relative">
                    <Link href="/" className="absolute left-4 opacity-70 hover:opacity-100 transition-opacity flex items-center gap-1 text-sm font-medium">
                        ← Voltar
                    </Link>
                    <div className="relative ml-16">
                        <img
                            src="/eva-avatar.jpg"
                            alt="EVA"
                            className="w-12 h-12 rounded-full border-2 border-primary object-cover"
                        />
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#260A00] rounded-full"></div>
                    </div>
                    <div>
                        <h1 className="font-title text-xl tracking-wide">EVA</h1>
                        <p className="text-xs opacity-80 uppercase tracking-widest font-black text-primary">Inteligência Operacional</p>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-hidden relative">
                    <EvaChat />
                </div>
            </div>
        </div>
    );
}

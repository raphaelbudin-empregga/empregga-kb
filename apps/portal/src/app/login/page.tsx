'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (data.success) {
                router.push('/');
                router.refresh();
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Erro no servidor de autenticação.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FBF2EB] font-body text-[#260A00]">
            <div className="w-full max-w-md p-8 bg-white rounded-3xl shadow-xl shadow-primary/5 border border-primary/10">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-title text-primary mb-2">Empregga</h1>
                    <p className="text-sm font-bold opacity-60 uppercase tracking-widest text-[#260A00]">Orion Curadoria</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl font-bold border border-red-100 flex items-center justify-center">
                            ⚠ {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest opacity-50 mb-2 pl-1">E-mail Administrativo</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-[#FBF2EB]/50 border border-primary/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all font-medium text-sm"
                                placeholder="curador@empregga.com.br"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest opacity-50 mb-2 pl-1">Senha</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-[#FBF2EB]/50 border border-primary/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all font-medium text-sm"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:bg-[#DE2F04] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 flex justify-center items-center h-[56px]"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            'Acessar Dashboard'
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <button
                        onClick={() => router.push('/chat')}
                        className="text-xs uppercase tracking-widest font-black text-primary opacity-60 hover:opacity-100 transition-opacity"
                    >
                        Ir para a EVA (Público) →
                    </button>
                </div>
            </div>
        </div>
    );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import KnowledgeForm from "@/components/KnowledgeForm";
import KnowledgeManager from "@/components/KnowledgeManager";
import BlindSpotsList from "@/components/BlindSpotsList";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";

export default function Home() {
  const [activeTab, setActiveTab] = useState<'BASE' | 'INGEST' | 'BLIND_SPOTS' | 'ANALYTICS'>('ANALYTICS');
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen p-8 font-body bg-background selection:bg-primary/20">
      <header className="flex items-center justify-between mb-12 max-w-7xl mx-auto">
        <h1 className="text-3xl font-title text-primary tracking-tight">
          Empregga<span className="text-foreground">.</span>
        </h1>

        <nav className="flex bg-white p-1 rounded-xl shadow-sm border border-primary/5">
          <button
            onClick={() => setActiveTab('BASE')}
            className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'BASE' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-foreground/40 hover:text-primary'}`}
          >
            Base de Conhecimento
          </button>
          <button
            onClick={() => setActiveTab('ANALYTICS')}
            className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'ANALYTICS' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-foreground/40 hover:text-primary'}`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('INGEST')}
            className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'INGEST' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-foreground/40 hover:text-primary'}`}
          >
            Alimentar EVA
          </button>
          <button
            onClick={() => setActiveTab('BLIND_SPOTS')}
            className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'BLIND_SPOTS' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-foreground/40 hover:text-red-500'}`}
          >
            Blind Spots
          </button>
          <Link
            href="/chat"
            className="px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all text-foreground/40 hover:text-primary hover:bg-primary/5 flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            EVA Chat
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs font-bold uppercase opacity-40">Intelligence Hub</div>
            <div className="text-sm font-medium">Curadoria de Agentes</div>
          </div>
          <div className="w-10 h-10 bg-[#260A00] rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
            A
          </div>
          <button
            onClick={handleLogout}
            className="ml-2 text-xs font-bold text-red-500 hover:text-red-700 opacity-60 hover:opacity-100 transition-opacity"
            title="Sair do Sistema"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        {activeTab === 'INGEST' ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
            <section className="space-y-12">
              <div>
                <div className="mb-10">
                  <h2 className="text-4xl mb-4 font-title leading-tight">
                    Transforme Chamados em <span className="text-primary">Estratégia.</span>
                  </h2>
                  <p className="text-lg opacity-70 leading-relaxed max-w-xl italic">
                    "O conhecimento só gera valor quando é compartilhado e atualizado."
                  </p>
                </div>

                <KnowledgeForm />
              </div>
            </section>

            <aside className="space-y-6 lg:mt-32">
              <div className="bg-white p-6 rounded-2xl border border-primary/10 shadow-sm">
                <h3 className="font-title text-sm mb-4 uppercase tracking-widest text-primary">Diretrizes de Marca</h3>
                <ul className="space-y-4 text-sm opacity-80 leading-relaxed font-medium">
                  <li className="flex gap-3">
                    <span className="text-primary font-bold">1.</span>
                    Foco em Autonomia e Empreendedorismo.
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold">2.</span>
                    Linguagem Acolhedora mas Profissional.
                  </li>
                  <li className="flex gap-3 text-primary font-bold">
                    [!] Títulos em CAIXA ALTA são permitidos no manual.
                  </li>
                </ul>
              </div>
            </aside>
          </div>
        ) : activeTab === 'ANALYTICS' ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-10">
              <h2 className="text-4xl mb-2 font-title">Analytics & Saúde Global</h2>
              <p className="text-lg opacity-60">Visibilidade sobre as taxas de resolução da EVA e ranking de artigos a revisar.</p>
            </div>
            <AnalyticsDashboard />
          </div>
        ) : activeTab === 'BASE' ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-10">
              <h2 className="text-4xl mb-2 font-title">Explorar Inteligência</h2>
              <p className="text-lg opacity-60">Consulte e valide o cérebro da EVA em tempo real.</p>
            </div>
            <KnowledgeManager />
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-10">
              <h2 className="text-4xl mb-2 font-title text-red-600">Blind Spots</h2>
              <p className="text-lg opacity-60">Dúvidas dos usuários que a EVA ainda não consegue responder com certeza.</p>
            </div>
            <BlindSpotsList />
          </div>
        )}
      </main>

      <footer className="mt-20 py-8 border-t border-primary/5 text-center text-[10px] opacity-40 uppercase tracking-[0.4em] font-black">
        Empregga Technologies © 2026 | Sistema Orion de Curadoria RAG
      </footer>
    </div>
  );
}

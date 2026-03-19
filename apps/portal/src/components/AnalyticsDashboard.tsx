'use client';

import React, { useEffect, useState } from 'react';

interface AnalyticsData {
    totalQueries: number;
    totalHandoffs: number;
    resolutionRate: number;
    worstUnits: { id: string, title: string, negativeCount: number }[];
}

export default function AnalyticsDashboard() {
    const [stats, setStats] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch('/api/analytics');
                const result = await response.json();
                if (result.success) {
                    setStats(result.data);
                }
            } catch (error) {
                console.error('Failed to load analytics', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white rounded-2xl shadow-sm border border-primary/5"></div>)}
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Taxa de Resolução */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-primary/10 flex flex-col justify-center">
                    <div className="text-[10px] font-black uppercase tracking-widest text-primary opacity-60 mb-2 cursor-help" title="Percentual de perguntas respondidas diretamente pela IA sem necessidade de intervenção humana (Handoff).">Taxa de Resolução (RAG)</div>
                    <div className="flex items-end gap-2">
                        <span className="text-5xl font-title text-[#260A00] leading-none">{stats.resolutionRate}%</span>
                        <span className="text-sm font-bold text-green-600 mb-1">Retido</span>
                    </div>
                </div>

                {/* Volumes */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-primary/10 grid grid-cols-2 gap-4">
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1 cursor-help" title="Número total de interações únicas iniciadas pelos usuários no chat da EVA.">Sessões Totais</div>
                        <div className="text-3xl font-title text-[#260A00]">{stats.totalQueries}</div>
                    </div>
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-orange-600 opacity-60 mb-1 cursor-help" title="Número de vezes que a conversa foi transferida para um atendente humano ou a IA não soube responder.">Escalonamentos</div>
                        <div className="text-3xl font-title text-orange-600">{stats.totalHandoffs}</div>
                    </div>
                </div>

                {/* Qualidade e Menos Confiáveis */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-500/10 h-full flex flex-col">
                    <div className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-4 flex items-center gap-2 cursor-help" title="Unidades de conhecimento com maior número acumulado de feedbacks negativos.">
                        <span className="text-red-500">⚠</span> Artigos Menos Confiáveis
                    </div>
                    {stats.worstUnits.length === 0 ? (
                        <div className="text-xs opacity-50 italic">Nenhum feedback negativo registrado ainda. A base está super afiada!</div>
                    ) : (
                        <ul className="text-xs space-y-3 font-medium overflow-y-auto custom-scrollbar pr-2 flex-1">
                            {stats.worstUnits.map(wu => (
                                <li key={wu.id} className="flex justify-between items-start gap-3 border-b border-gray-50 pb-2 last:border-0">
                                    <span className="truncate opacity-80" title={wu.title}>{wu.title}</span>
                                    <span className="text-red-600 font-bold shrink-0 bg-red-50 px-2 rounded">👎 {wu.negativeCount}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}

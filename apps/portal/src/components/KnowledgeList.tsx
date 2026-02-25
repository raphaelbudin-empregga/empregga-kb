'use client';

import React, { useEffect, useState } from 'react';

interface KnowledgeUnit {
    id: string;
    title: string;
    category: string;
    author: string;
    createdAt: string;
    updatedAt: string;
    status: string;
    positiveFeedbacks: number;
    negativeFeedbacks: number;
}

function getHealthStatus(unit: KnowledgeUnit) {
    const daysSinceUpdate = Math.floor((new Date().getTime() - new Date(unit.updatedAt || unit.createdAt).getTime()) / (1000 * 3600 * 24));

    // Calcula o prazo alvo (Base 180 dias = 6 meses)
    let targetDays = 180;
    targetDays -= (unit.negativeFeedbacks * 45); // Punição de 45 dias por feedback ruim
    targetDays += (unit.positiveFeedbacks * 15); // Bônus de 15 dias por feedback bom

    // Limites de sanidade
    if (targetDays < 0) targetDays = 0;
    if (targetDays > 365) targetDays = 365;

    const daysRemaining = targetDays - daysSinceUpdate;

    if (daysRemaining <= 0) {
        return { label: 'Vencido / Crítico', color: 'bg-red-100 text-red-800 border border-red-200' };
    } else if (daysRemaining <= 30) {
        return { label: `Atenção: ${daysRemaining}d`, color: 'bg-yellow-100 text-yellow-800 border border-yellow-200' };
    } else {
        return { label: `Saudável: ${daysRemaining}d`, color: 'bg-green-100 text-green-800 border border-green-200' };
    }
}

export default function KnowledgeList() {
    const [units, setUnits] = useState<KnowledgeUnit[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchUnits = async () => {
        try {
            const response = await fetch('/api/knowledge');
            const result = await response.json();
            if (result.success) {
                setUnits(result.data);
            }
        } catch (error) {
            console.error('Error fetching units:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUnits();
        // Refresh a cada 30 segundos ou quando houver interação (simplificado)
        const interval = setInterval(fetchUnits, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-primary/10 overflow-hidden">
            <div className="p-6 border-b border-primary/5 bg-primary/5 flex justify-between items-center">
                <h3 className="font-title text-sm uppercase tracking-widest text-primary">Unidades Cadastradas</h3>
                <span className="text-[10px] font-bold opacity-50">{units.length} TOTAL</span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="bg-background text-[10px] font-bold uppercase tracking-tighter opacity-60">
                            <th className="px-6 py-4">Título</th>
                            <th className="px-6 py-4">Categoria</th>
                            <th className="px-6 py-4">Saúde (Revisão)</th>
                            <th className="px-6 py-4">Autor</th>
                            <th className="px-6 py-4">Data</th>
                            <th className="px-6 py-4 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-primary/5">
                        {units.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center opacity-40 italic">
                                    Nenhuma unidade cadastrada ainda.
                                </td>
                            </tr>
                        ) : (
                            units.map((unit) => (
                                <tr key={unit.id} className="hover:bg-primary/5 transition-colors cursor-pointer group">
                                    <td className="px-6 py-4 font-medium text-foreground group-hover:text-primary transition-colors">
                                        {unit.title}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="bg-secondary/10 text-secondary text-[10px] font-bold px-2 py-1 rounded">
                                            {unit.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {(() => {
                                            const health = getHealthStatus(unit);
                                            return (
                                                <div className="flex flex-col gap-1 items-start">
                                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${health.color}`}>
                                                        {health.label}
                                                    </span>
                                                    {(unit.positiveFeedbacks > 0 || unit.negativeFeedbacks > 0) && (
                                                        <div className="text-[10px] flex gap-2 opacity-70">
                                                            <span className="text-green-600">👍 {unit.positiveFeedbacks}</span>
                                                            <span className="text-red-600">👎 {unit.negativeFeedbacks}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </td>
                                    <td className="px-6 py-4 opacity-70 italic">{unit.author}</td>
                                    <td className="px-6 py-4 opacity-50 text-[10px]">
                                        {new Date(unit.createdAt).toLocaleDateString('pt-BR')}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="bg-green-100 text-green-700 text-[9px] font-bold px-2 py-0.5 rounded-full">
                                            {unit.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

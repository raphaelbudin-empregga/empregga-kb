'use client';

import React, { useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface KnowledgeUnit {
    id: string;
    title: string;
    category: string;
    problemDescription: string;
    officialResolution: string;
    author: string;
    createdAt: string;
    updatedAt: string;
    status: string;
    positiveFeedbacks: number;
    negativeFeedbacks: number;
}

type HealthStatus = 'GREAT' | 'WARNING' | 'CRITICAL';

export default function KnowledgeManager() {
    const [units, setUnits] = useState<KnowledgeUnit[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        category: 'ALL',
        health: 'ALL',
    });
    const [sortBy, setSortBy] = useState<'NEWEST' | 'HEALTH'>('HEALTH');
    const [selectedUnit, setSelectedUnit] = useState<KnowledgeUnit | null>(null);
    const [isSemanticSearch, setIsSemanticSearch] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

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
        if (!isSemanticSearch) {
            fetchUnits();
        }
    }, [isSemanticSearch]);

    useEffect(() => {
        const performSemanticSearch = async () => {
            if (!isSemanticSearch || !filters.search.trim()) {
                if (!filters.search.trim() && isSemanticSearch) {
                    fetchUnits();
                }
                return;
            }

            setIsSearching(true);
            try {
                const response = await fetch(`/api/knowledge/search?q=${encodeURIComponent(filters.search)}`);
                const result = await response.json();
                if (Array.isArray(result)) {
                    setUnits(result);
                }
            } catch (error) {
                console.error('Semantic search error:', error);
            } finally {
                setIsSearching(false);
            }
        };

        const timeout = setTimeout(performSemanticSearch, 500);
        return () => clearTimeout(timeout);
    }, [filters.search, isSemanticSearch]);

    const calculateHealth = (unit: KnowledgeUnit): HealthStatus => {
        const lastUpdate = new Date(unit.updatedAt || unit.createdAt).getTime();
        const now = new Date().getTime();
        const diffDays = (now - lastUpdate) / (1000 * 3600 * 24);

        // Se tem mais feedback negativo e taxa de aprovação ruim -> CRÍTICO
        const totalFeedbacks = (unit.positiveFeedbacks || 0) + (unit.negativeFeedbacks || 0);
        const approveRate = totalFeedbacks > 0 ? (unit.positiveFeedbacks || 0) / totalFeedbacks : 1;

        if ((unit.negativeFeedbacks || 0) >= 2 && approveRate < 0.5) return 'CRITICAL';
        if (diffDays > 180) return 'CRITICAL';
        if ((unit.negativeFeedbacks || 0) > 0 || diffDays > 90) return 'WARNING';

        return 'GREAT';
    };

    const filteredUnits = useMemo(() => {
        let result = units.filter(unit => {
            // Se for busca semântica, confiamos nos resultados da API e pulamos o filtro de match textual
            const matchesSearch = isSemanticSearch && filters.search.trim() !== ''
                ? true
                : (unit.title?.toLowerCase() || '').includes(filters.search.toLowerCase()) ||
                (unit.author?.toLowerCase() || '').includes(filters.search.toLowerCase());

            const matchesCategory = filters.category === 'ALL' || unit.category === filters.category;
            const health = calculateHealth(unit);
            const matchesHealth = filters.health === 'ALL' || health === filters.health;

            return matchesSearch && matchesCategory && matchesHealth;
        });

        if (sortBy === 'NEWEST') {
            result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } else {
            // Sort by critical health first
            const healthPriority = { CRITICAL: 0, WARNING: 1, GREAT: 2 };
            result.sort((a, b) => {
                const hA = calculateHealth(a);
                const hB = calculateHealth(b);
                return healthPriority[hA] - healthPriority[hB];
            });
        }

        return result;
    }, [units, filters, sortBy]);

    if (loading) return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Skeleton Header */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-primary/5">
                <div className="space-y-2">
                    <div className="h-6 w-48 bg-gray-100 rounded-md animate-pulse"></div>
                    <div className="h-3 w-32 bg-gray-50 rounded-md animate-pulse"></div>
                </div>
                <div className="flex gap-2">
                    <div className="h-9 w-28 bg-gray-100 rounded-lg animate-pulse"></div>
                    <div className="h-9 w-28 bg-gray-100 rounded-lg animate-pulse"></div>
                </div>
            </div>

            {/* Skeleton Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-xl shadow-sm border border-primary/5">
                <div className="md:col-span-2 h-11 bg-gray-100 rounded-lg animate-pulse"></div>
                <div className="h-11 bg-gray-100 rounded-lg animate-pulse"></div>
                <div className="h-11 bg-gray-100 rounded-lg animate-pulse"></div>
            </div>

            {/* Skeleton Tabela */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-primary/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-primary/[0.02] border-b border-primary/5">
                                <th className="px-6 py-5"><div className="h-3 w-20 bg-primary/10 rounded animate-pulse"></div></th>
                                <th className="px-6 py-5"><div className="h-3 w-32 bg-primary/10 rounded animate-pulse"></div></th>
                                <th className="px-6 py-5"><div className="h-3 w-16 bg-primary/10 rounded animate-pulse"></div></th>
                                <th className="px-6 py-5"><div className="h-3 w-24 bg-primary/10 rounded animate-pulse"></div></th>
                                <th className="px-6 py-5 text-right"><div className="h-3 w-12 bg-primary/10 ml-auto rounded animate-pulse"></div></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-primary/5">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <tr key={i}>
                                    <td className="px-6 py-6">
                                        <div className="h-6 w-24 bg-gray-100 rounded-full animate-pulse"></div>
                                    </td>
                                    <td className="px-6 py-6 space-y-2">
                                        <div className="h-4 w-48 bg-gray-100 rounded animate-pulse"></div>
                                        <div className="h-2 w-20 bg-gray-50 rounded animate-pulse"></div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="h-4 w-20 bg-gray-100 rounded animate-pulse"></div>
                                    </td>
                                    <td className="px-6 py-6 space-y-1">
                                        <div className="h-3 w-24 bg-gray-100 rounded animate-pulse"></div>
                                        <div className="h-2 w-12 bg-gray-50 rounded animate-pulse"></div>
                                    </td>
                                    <td className="px-6 py-6 text-right">
                                        <div className="h-6 w-20 bg-gray-100 rounded-lg animate-pulse ml-auto"></div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header Gestão */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-primary/5">
                <div>
                    <h2 className="text-xl font-title text-foreground">Gerenciamento de Base</h2>
                    <p className="text-xs opacity-50">Curadoria e Saúde do Conhecimento Empregga</p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setSortBy('HEALTH')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${sortBy === 'HEALTH' ? 'bg-primary text-white shadow-lg' : 'bg-primary/5 text-primary hover:bg-primary/10'}`}
                    >
                        Priorizar Saúde
                    </button>
                    <button
                        onClick={() => setSortBy('NEWEST')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${sortBy === 'NEWEST' ? 'bg-primary text-white shadow-lg' : 'bg-primary/5 text-primary hover:bg-primary/10'}`}
                    >
                        Mais Recentes
                    </button>
                </div>
            </div>

            {/* Filtros Estilo Directus */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-xl shadow-sm border border-primary/5">
                <div className="md:col-span-2 relative group">
                    <input
                        type="text"
                        placeholder={isSemanticSearch ? "Pergunte algo para a IA (ex: 'como funciona a reversa?')" : "Buscar no título ou autor..."}
                        className={`w-full p-3 bg-background border rounded-lg text-sm outline-none transition-all font-medium ${isSemanticSearch ? 'border-primary/40 ring-1 ring-primary/10' : 'border-gray-100 focus:ring-2 focus:ring-primary/20'}`}
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    />
                    {isSearching && (
                        <div className="absolute right-12 top-1/2 -translate-y-1/2">
                            <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                        </div>
                    )}
                    <button
                        onClick={() => setIsSemanticSearch(!isSemanticSearch)}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${isSemanticSearch ? 'bg-primary text-white shadow-md' : 'bg-primary/5 text-primary hover:bg-primary/10'}`}
                    >
                        {isSemanticSearch ? 'IA Ativa' : 'IA ✨'}
                    </button>
                </div>
                <select
                    className="p-3 bg-background border border-gray-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    value={filters.category}
                    onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                >
                    <option value="ALL">Todas Categorias</option>
                    <option value="PLATAFORMA">PLATAFORMA</option>
                    <option value="OPERACIONAL">OPERACIONAL</option>
                    <option value="PAGAMENTO">PAGAMENTO</option>
                </select>
                <select
                    className="p-3 bg-background border border-gray-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    value={filters.health}
                    onChange={(e) => setFilters(prev => ({ ...prev, health: e.target.value }))}
                >
                    <option value="ALL">Toda Saúde</option>
                    <option value="GREAT">Ótima (Verde)</option>
                    <option value="WARNING">Atenção (Amarela)</option>
                    <option value="CRITICAL">Crítica (Vermelha)</option>
                </select>
            </div>

            {/* Tabela de Dados */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-primary/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-primary/[0.02] text-[10px] font-bold uppercase tracking-widest text-primary/60 border-b border-primary/5">
                                <th className="px-6 py-5">Status Saúde</th>
                                <th className="px-6 py-5">Título da Unidade</th>
                                <th className="px-6 py-5">Categoria</th>
                                <th className="px-6 py-5">Última Revisão</th>
                                <th className="px-6 py-5 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-primary/5">
                            {filteredUnits.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-gray-400 italic font-medium">
                                        Nenhum registro encontrado para os filtros aplicados.
                                    </td>
                                </tr>
                            ) : (
                                filteredUnits.map((unit) => {
                                    const health = calculateHealth(unit);
                                    const healthStyles = {
                                        GREAT: { bg: 'bg-green-100', text: 'text-green-700', label: 'Saudável', icon: '●' },
                                        WARNING: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Necessita Revisão', icon: '⚠' },
                                        CRITICAL: { bg: 'bg-red-100', text: 'text-red-700', label: 'OBSOLETO / CRÍTICO', icon: '✖' },
                                    };

                                    return (
                                        <tr key={unit.id} className="hover:bg-primary/[0.02] transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col gap-2 items-start">
                                                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${healthStyles[health].bg} ${healthStyles[health].text}`}>
                                                        <span className="text-xs">{healthStyles[health].icon}</span>
                                                        {healthStyles[health].label}
                                                    </div>
                                                    {((unit.positiveFeedbacks || 0) > 0 || (unit.negativeFeedbacks || 0) > 0) && (
                                                        <div className="text-[10px] flex gap-2 font-bold px-1 rounded bg-gray-50 border border-gray-100 p-0.5">
                                                            <span className="text-green-600">👍 {unit.positiveFeedbacks || 0}</span>
                                                            <span className="text-red-600">👎 {unit.negativeFeedbacks || 0}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div
                                                    className="font-bold text-foreground mb-0.5 group-hover:text-primary transition-colors cursor-pointer"
                                                    onClick={() => setSelectedUnit(unit)}
                                                >
                                                    {unit.title}
                                                </div>
                                                <div className="text-[10px] opacity-40 uppercase font-black tracking-widest">Autor: {unit.author}</div>
                                            </td>
                                            <td className="px-6 py-5 italic text-gray-500 font-medium">
                                                {unit.category}
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="text-xs font-bold text-foreground">
                                                    {new Date(unit.updatedAt).toLocaleDateString('pt-BR')}
                                                </div>
                                                <div className="text-[10px] opacity-40">
                                                    Há {Math.floor((new Date().getTime() - new Date(unit.updatedAt).getTime()) / (1000 * 3600 * 24))} dias
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <button
                                                    onClick={() => setSelectedUnit(unit)}
                                                    className="text-primary font-black text-[10px] uppercase tracking-widest hover:underline px-4 py-2 rounded-lg hover:bg-primary/5 transition-all"
                                                >
                                                    Ver Detalhes
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Detalhes Estilo Directus */}
            {selectedUnit && (
                <div
                    className="fixed inset-0 bg-[#260A00]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300 pointer-events-auto"
                    onClick={() => setSelectedUnit(null)}
                >
                    <div
                        className="bg-[#FBF2EB] w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden border border-primary/10 animate-in zoom-in-95 duration-300 flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 md:p-8 flex flex-col h-full overflow-hidden">
                            {/* Modal Header */}
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">Detalhes da Unidade</div>
                                    <h3 className="text-2xl font-title text-[#260A00] leading-tight">{selectedUnit.title}</h3>
                                </div>
                                <button
                                    onClick={() => setSelectedUnit(null)}
                                    className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#260A00] hover:bg-primary hover:text-white transition-all shadow-sm border border-primary/5 shrink-0"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Meta Info Grid */}
                            <div className="grid grid-cols-3 gap-4 p-4 bg-white/50 rounded-2xl border border-primary/5 mb-6">
                                <div>
                                    <div className="text-[10px] uppercase font-bold opacity-40 mb-1">Categoria</div>
                                    <div className="text-xs font-bold">{selectedUnit.category}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] uppercase font-bold opacity-40 mb-1">Autor</div>
                                    <div className="text-xs font-bold">{selectedUnit.author}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] uppercase font-bold opacity-40 mb-1">Última Revisão</div>
                                    <div className="text-xs font-bold">{new Date(selectedUnit.updatedAt).toLocaleDateString('pt-BR')}</div>
                                </div>
                            </div>

                            {/* Content Sections - Scrollable Area */}
                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-4 bg-primary rounded-full"></div>
                                        <h4 className="text-xs font-black uppercase tracking-widest opacity-60">Problema / Descrição</h4>
                                    </div>
                                    <p className="text-sm leading-relaxed text-[#260A00]/80 bg-white p-5 rounded-2xl border border-primary/5 shadow-inner italic">
                                        "{selectedUnit.problemDescription}"
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-4 bg-primary rounded-full"></div>
                                        <h4 className="text-xs font-black uppercase tracking-widest opacity-60">Resolução Padronizada (RAG)</h4>
                                    </div>
                                    <div className="text-sm leading-relaxed text-[#260A00] bg-white p-6 rounded-2xl border border-primary/5 shadow-sm font-medium prose prose-sm max-w-none prose-p:leading-relaxed prose-headings:font-title prose-headings:text-primary prose-a:text-primary prose-a:font-bold prose-img:rounded-xl prose-img:shadow-md">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {selectedUnit.officialResolution}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="pt-6 mt-4 border-t border-primary/5 flex justify-end">
                                <button
                                    onClick={() => setSelectedUnit(null)}
                                    className="px-10 py-3 bg-[#260A00] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary transition-all shadow-lg hover:grow-1 active:scale-95"
                                >
                                    Entendido
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

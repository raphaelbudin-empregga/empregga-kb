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
    deletedAt?: string | null;
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
    
    const [isTrash, setIsTrash] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<KnowledgeUnit>>({});

    const fetchUnits = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/knowledge?trash=${isTrash}`);
            const result = await response.json();
            if (result.success) {
                setUnits(result.data);
                setSelectedIds([]); // Clear selection when switching views
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
    }, [isSemanticSearch, isTrash]);

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
                // Bulk search might need updates to handle trash, but for MVP we search active only
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

        const totalFeedbacks = (unit.positiveFeedbacks || 0) + (unit.negativeFeedbacks || 0);
        const approveRate = totalFeedbacks > 0 ? (unit.positiveFeedbacks || 0) / totalFeedbacks : 1;

        if ((unit.negativeFeedbacks || 0) >= 2 && approveRate < 0.5) return 'CRITICAL';
        if (diffDays > 180) return 'CRITICAL';
        if ((unit.negativeFeedbacks || 0) > 0 || diffDays > 90) return 'WARNING';

        return 'GREAT';
    };

    const handleBulkAction = async (action: 'delete' | 'restore') => {
        if (selectedIds.length === 0) return;
        const confirmMsg = action === 'delete' ? 'Deseja mover os itens selecionados para a lixeira?' : 'Deseja restaurar os itens selecionados?';
        if (!window.confirm(confirmMsg)) return;

        try {
            const res = await fetch('/api/knowledge/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedIds, action }),
            });
            const data = await res.json();
            if (data.success) {
                fetchUnits();
            } else {
                alert('Erro ao processar ação em massa.');
            }
        } catch (error) {
            console.error(error);
            alert('Erro de conexão ao executar ação em massa.');
        }
    };

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleAll = () => {
        if (selectedIds.length === filteredUnits.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredUnits.map(u => u.id));
        }
    };

    const handleDeleteSingle = async (id: string) => {
        if (!window.confirm('Deseja mover este item para a lixeira?')) return;
        try {
            const res = await fetch(`/api/knowledge/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setSelectedUnit(null);
                fetchUnits();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleSaveEdit = async () => {
        if (!selectedUnit) return;
        try {
            const res = await fetch(`/api/knowledge/${selectedUnit.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            });
            const data = await res.json();
            if (data.success) {
                setSelectedUnit(null);
                setIsEditing(false);
                fetchUnits();
            } else {
                alert('Erro ao salvar as edições.');
            }
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar as edições.');
        }
    };

    const filteredUnits = useMemo(() => {
        let result = units.filter(unit => {
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
            const healthPriority = { CRITICAL: 0, WARNING: 1, GREAT: 2 };
            result.sort((a, b) => {
                const hA = calculateHealth(a);
                const hB = calculateHealth(b);
                return healthPriority[hA] - healthPriority[hB];
            });
        }

        return result;
    }, [units, filters, sortBy, isSemanticSearch]);

    if (loading) return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-primary/5">
                <div className="space-y-2">
                    <div className="h-6 w-48 bg-gray-100 rounded-md animate-pulse"></div>
                    <div className="h-3 w-32 bg-gray-50 rounded-md animate-pulse"></div>
                </div>
            </div>
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-primary/5 h-64 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-primary/5">
                <div>
                    <h2 className="text-xl font-title text-foreground">
                        {isTrash ? 'Lixeira de Conhecimento' : 'Gerenciamento de Base'}
                    </h2>
                    <p className="text-xs opacity-50">
                        {isTrash ? 'Itens excluídos temporariamente' : 'Curadoria e Saúde do Conhecimento Empregga'}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    {selectedIds.length > 0 && (
                        <button
                            onClick={() => handleBulkAction(isTrash ? 'restore' : 'delete')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all text-white shadow-lg ${isTrash ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                        >
                            {isTrash ? `Restaurar Selecionados (${selectedIds.length})` : `Excluir Selecionados (${selectedIds.length})`}
                        </button>
                    )}
                    
                    <div className="w-px h-8 bg-gray-200 mx-2 hidden md:block"></div>

                    <button
                        onClick={() => setIsTrash(!isTrash)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${isTrash ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                    >
                        {isTrash ? 'Ver Ativos' : 'Ver Lixeira'}
                    </button>
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

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-xl shadow-sm border border-primary/5">
                <div className="md:col-span-2 relative group">
                    <input
                        type="text"
                        placeholder={isSemanticSearch ? "Pergunte algo para a IA..." : "Buscar no título ou autor..."}
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

            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-primary/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-primary/[0.02] text-[10px] font-bold uppercase tracking-widest text-primary/60 border-b border-primary/5">
                                <th className="px-6 py-5 w-10">
                                    <input 
                                        type="checkbox" 
                                        className="rounded border-gray-300 text-primary focus:ring-primary/20"
                                        checked={selectedIds.length > 0 && selectedIds.length === filteredUnits.length}
                                        onChange={toggleAll}
                                    />
                                </th>
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
                                    <td colSpan={6} className="px-6 py-20 text-center text-gray-400 italic font-medium">
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
                                        <tr key={unit.id} className={`hover:bg-primary/[0.02] transition-colors group ${selectedIds.includes(unit.id) ? 'bg-primary/5' : ''}`}>
                                            <td className="px-6 py-5">
                                                <input 
                                                    type="checkbox" 
                                                    className="rounded border-gray-300 text-primary focus:ring-primary/20"
                                                    checked={selectedIds.includes(unit.id)}
                                                    onChange={() => toggleSelection(unit.id)}
                                                />
                                            </td>
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
                                                    onClick={() => {
                                                        setSelectedUnit(unit);
                                                        setEditForm(unit);
                                                        setIsEditing(false);
                                                    }}
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
                                                    onClick={() => {
                                                        setSelectedUnit(unit);
                                                        setEditForm(unit);
                                                        setIsEditing(false);
                                                    }}
                                                    className="text-primary font-black text-[10px] uppercase tracking-widest hover:underline px-4 py-2 rounded-lg hover:bg-primary/5 transition-all"
                                                >
                                                    Detalhes
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
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">
                                        {isEditing ? 'Editar Unidade' : 'Detalhes da Unidade'}
                                    </div>
                                    {!isEditing ? (
                                        <h3 className="text-2xl font-title text-[#260A00] leading-tight">{selectedUnit.title}</h3>
                                    ) : (
                                        <input 
                                            type="text" 
                                            value={editForm.title || ''} 
                                            onChange={e => setEditForm({...editForm, title: e.target.value})}
                                            className="w-full text-xl font-title p-2 border border-primary/20 rounded-lg bg-white outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                    )}
                                </div>
                                <button
                                    onClick={() => setSelectedUnit(null)}
                                    className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#260A00] hover:bg-primary hover:text-white transition-all shadow-sm border border-primary/5 shrink-0 ml-4"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="grid grid-cols-3 gap-4 p-4 bg-white/50 rounded-2xl border border-primary/5 mb-6">
                                <div>
                                    <div className="text-[10px] uppercase font-bold opacity-40 mb-1">Categoria</div>
                                    {!isEditing ? (
                                        <div className="text-xs font-bold">{selectedUnit.category}</div>
                                    ) : (
                                        <select 
                                            value={editForm.category || ''}
                                            onChange={e => setEditForm({...editForm, category: e.target.value})}
                                            className="w-full text-xs font-bold p-1 border border-primary/20 rounded-md bg-white outline-none"
                                        >
                                            <option value="PLATAFORMA">PLATAFORMA</option>
                                            <option value="OPERACIONAL">OPERACIONAL</option>
                                            <option value="PAGAMENTO">PAGAMENTO</option>
                                        </select>
                                    )}
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

                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-4 bg-primary rounded-full"></div>
                                        <h4 className="text-xs font-black uppercase tracking-widest opacity-60">Problema / Descrição</h4>
                                    </div>
                                    {!isEditing ? (
                                        <p className="text-sm leading-relaxed text-[#260A00]/80 bg-white p-5 rounded-2xl border border-primary/5 shadow-inner italic">
                                            "{selectedUnit.problemDescription}"
                                        </p>
                                    ) : (
                                        <textarea
                                            value={editForm.problemDescription || ''}
                                            onChange={e => setEditForm({...editForm, problemDescription: e.target.value})}
                                            className="w-full h-24 text-sm leading-relaxed text-[#260A00]/80 bg-white p-4 rounded-xl border border-primary/20 outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                                        />
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-4 bg-primary rounded-full"></div>
                                        <h4 className="text-xs font-black uppercase tracking-widest opacity-60">Resolução Padronizada (RAG)</h4>
                                    </div>
                                    {!isEditing ? (
                                        <div className="text-sm leading-relaxed text-[#260A00] bg-white p-6 rounded-2xl border border-primary/5 shadow-sm font-medium prose prose-sm max-w-none prose-p:leading-relaxed prose-headings:font-title prose-headings:text-primary prose-a:text-primary prose-a:font-bold prose-img:rounded-xl prose-img:shadow-md">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {selectedUnit.officialResolution}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        <textarea
                                            value={editForm.officialResolution || ''}
                                            onChange={e => setEditForm({...editForm, officialResolution: e.target.value})}
                                            className="w-full h-40 text-sm leading-relaxed text-[#260A00] bg-white p-4 rounded-xl border border-primary/20 outline-none focus:ring-2 focus:ring-primary/20 font-mono resize-none"
                                        />
                                    )}
                                </div>
                            </div>

                            <div className="pt-6 mt-4 border-t border-primary/5 flex justify-between items-center">
                                <div className="flex gap-2">
                                    {!isTrash && !isEditing && (
                                        <>
                                            <button
                                                onClick={() => setIsEditing(true)}
                                                className="px-4 py-2 bg-white text-[#260A00] border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => handleDeleteSingle(selectedUnit.id)}
                                                className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all shadow-sm"
                                            >
                                                Excluir
                                            </button>
                                        </>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    {isEditing && (
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="px-6 py-3 bg-white text-gray-500 border border-gray-200 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-all"
                                        >
                                            Cancelar
                                        </button>
                                    )}
                                    <button
                                        onClick={isEditing ? handleSaveEdit : () => setSelectedUnit(null)}
                                        className="px-10 py-3 bg-[#260A00] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary transition-all shadow-lg hover:grow-1 active:scale-95"
                                    >
                                        {isEditing ? 'Salvar Alterações' : 'Entendido'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

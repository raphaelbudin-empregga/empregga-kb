'use client';

import React, { useState, useRef } from 'react';

const categories = [
    'PLATAFORMA',
    'OPERACIONAL',
    'UNIVERSIDADE',
    'PAGAMENTO',
    'CORPORATIVO',
    'OUTROS',
];

export default function KnowledgeForm() {
    const [improving, setImproving] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // States para os campos do formulário
    const [formData, setFormData] = useState({
        title: '',
        category: [] as string[],
        problemDescription: '',
        officialResolution: '',
        tags: '',
        author: '',
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImproveWithAI = async () => {
        setImproving(true);
        // Simulação de chamada para IA (Próximos passos incluirão integração real)
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setImproving(false);
        alert('✨ IA da Empregga: Texto polido e tags sugeridas com sucesso!');
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setUploadedUrl(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (result.url) {
                setUploadedUrl(result.url);
                // Opcional: já anexar o link ao final do texto ou copiar para clipboard
                navigator.clipboard.writeText(`![${file.name}](${result.url})`);
                alert('📎 Arquivo enviado! O link Markdown foi copiado para sua área de transferência.');
            } else {
                alert('❌ Erro no upload: ' + result.error);
            }
        } catch (error: any) {
            console.error('Upload Error:', error);
            alert('❌ Falha na conexão com o storage.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/knowledge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
                }),
            });

            const result = await response.json();

            if (result.success) {
                alert('✅ Conhecimento salvo com sucesso na Base da EVA!');
                setFormData({
                    title: '',
                    category: [],
                    problemDescription: '',
                    officialResolution: '',
                    tags: '',
                    author: '',
                });
            } else {
                alert('❌ Erro ao salvar: ' + result.error);
            }
        } catch (error: any) {
            console.error('Submission Error:', error);
            alert('❌ Erro na conexão com o servidor: ' + (error.message || 'Erro desconhecido'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-primary/10 max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-8 border-b pb-4">
                <h2 className="text-2xl font-title text-foreground">
                    Nova Unidade de Conhecimento
                </h2>
                <span className="bg-primary/5 text-primary text-[10px] font-bold px-2 py-1 rounded border border-primary/20">
                    PADRÃO 2025
                </span>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2 col-span-2">
                        <label className="text-xs font-bold uppercase tracking-wider opacity-60 text-foreground">Categorias</label>
                        <div className="grid grid-cols-3 gap-2 p-4 rounded-lg border border-gray-100 bg-gray-50/50">
                            {categories.map((cat) => (
                                <label key={cat} className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={formData.category.includes(cat)}
                                        onChange={(e) => {
                                            const checked = e.target.checked;
                                            setFormData(prev => ({
                                                ...prev,
                                                category: checked
                                                    ? [...prev.category, cat]
                                                    : prev.category.filter(c => c !== cat)
                                            }));
                                        }}
                                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <span className="text-[11px] font-medium text-gray-600 group-hover:text-primary transition-colors">{cat}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider opacity-60 text-foreground">Autor</label>
                        <input
                            name="author"
                            type="text"
                            value={formData.author}
                            onChange={handleInputChange}
                            placeholder="Seu nome"
                            className="w-full p-3 rounded-lg border border-gray-200 bg-background focus:ring-2 focus:ring-primary outline-none transition-all text-sm"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider opacity-60 text-foreground">Título do Conhecimento</label>
                    <input
                        name="title"
                        type="text"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="Ex: Como emitir nota fiscal para comissão de Agente"
                        className="w-full p-3 rounded-lg border border-gray-200 bg-background focus:ring-2 focus:ring-primary outline-none transition-all text-sm"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider opacity-60 text-foreground">Pergunta ou Chamado Original</label>
                    <textarea
                        name="problemDescription"
                        rows={3}
                        value={formData.problemDescription}
                        onChange={handleInputChange}
                        placeholder="Copie aqui a dúvida real recebida ou o texto do chamado no Zammad..."
                        className="w-full p-3 rounded-lg border border-gray-200 bg-background focus:ring-2 focus:ring-primary outline-none transition-all text-sm"
                        required
                    />
                </div>

                <div className="space-y-2 relative">
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-bold uppercase tracking-wider opacity-60 text-foreground">Resolução Padronizada (Markdown)</label>
                        <div className="flex gap-2">
                            <input
                                type="file"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                accept="image/*,application/pdf"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="flex items-center gap-2 text-[10px] font-bold bg-secondary/10 text-secondary border border-secondary/20 px-3 py-1.5 rounded-full hover:bg-secondary hover:text-white transition-all disabled:opacity-50"
                            >
                                {isUploading ? '📤 ENVIANDO...' : '📎 ANEXAR MÍDIA'}
                            </button>
                            <button
                                type="button"
                                onClick={handleImproveWithAI}
                                disabled={improving}
                                className="flex items-center gap-2 text-[10px] font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-full hover:bg-primary hover:text-white transition-all disabled:opacity-50 shadow-sm"
                            >
                                {improving ? '✨ MELHORANDO...' : '✨ MELHORAR COM IA'}
                            </button>
                        </div>
                    </div>
                    <textarea
                        name="officialResolution"
                        rows={6}
                        value={formData.officialResolution}
                        onChange={handleInputChange}
                        onKeyDown={(e) => {
                            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                                e.preventDefault();
                                const textarea = e.currentTarget;
                                const start = textarea.selectionStart;
                                const end = textarea.selectionEnd;
                                const selectedText = formData.officialResolution.substring(start, end);

                                const url = prompt('Insira a URL para o link:', 'https://');
                                if (url) {
                                    const markdownLink = `[${selectedText || 'Link'}](${url})`;
                                    const newValue =
                                        formData.officialResolution.substring(0, start) +
                                        markdownLink +
                                        formData.officialResolution.substring(end);

                                    setFormData(prev => ({ ...prev, officialResolution: newValue }));

                                    // Opcional: reposicionar cursor após o link
                                    setTimeout(() => {
                                        textarea.focus();
                                        const newCursorPos = start + markdownLink.length;
                                        textarea.setSelectionRange(newCursorPos, newCursorPos);
                                    }, 0);
                                }
                            }
                        }}
                        placeholder="DICA: Selecione um texto e use Ctrl + K para inserir um link. Suporte a Markdown ativo."
                        className="w-full p-3 rounded-lg border border-gray-200 bg-background focus:ring-2 focus:ring-primary outline-none transition-all text-sm leading-relaxed font-mono"
                        required
                    />
                    {uploadedUrl && (
                        <div className="text-[10px] bg-green-50 text-green-700 p-2 rounded-lg border border-green-100 flex justify-between items-center animate-in slide-in-from-top-1">
                            <span>Link gerado: <code className="font-bold">{uploadedUrl.substring(0, 50)}...</code></span>
                            <button
                                type="button"
                                onClick={() => navigator.clipboard.writeText(`![imagem](${uploadedUrl})`)}
                                className="font-black uppercase tracking-tighter hover:underline"
                            >
                                Copiar MD
                            </button>
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider opacity-60 text-foreground">Tags Semânticas</label>
                    <input
                        name="tags"
                        type="text"
                        value={formData.tags}
                        onChange={handleInputChange}
                        placeholder="Ex: #comissão, #meu-rh, #nota-fiscal, #prazo"
                        className="w-full p-3 rounded-lg border border-gray-200 bg-background focus:ring-2 focus:ring-primary outline-none transition-all text-sm"
                    />
                </div>

                <div className="pt-6 flex gap-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 bg-[#260A00] text-white font-bold py-4 rounded-xl hover:bg-primary transition-all shadow-lg hover:shadow-primary/20 uppercase tracking-widest text-xs disabled:opacity-50"
                    >
                        {isSubmitting ? 'SALVANDO NA VPS...' : 'Publicar na Base de IA'}
                    </button>
                    <button
                        type="button"
                        className="px-8 py-4 border-2 border-gray-200 rounded-xl font-bold hover:bg-gray-100 transition-all text-xs uppercase tracking-widest"
                    >
                        Salvar Rascunho
                    </button>
                </div>
            </form>
        </div>
    );
}

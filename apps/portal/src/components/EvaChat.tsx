'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type MessageRole = 'user' | 'assistant';

interface Message {
    id: string;
    role: MessageRole;
    content: string;
    sources?: Array<{ id: string; title: string }>;
    feedback?: 'up' | 'down';
}

export default function EvaChat() {
    const [messages, setMessages] = useState<Message[]>([{
        id: 'welcome',
        role: 'assistant',
        content: 'Olá! Eu sou a **EVA**, a Assistente Virtual da Empregga. Como posso ajudar você hoje com dúvidas sobre a plataforma ou processos operacionais?',
    }]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsgId = Date.now().toString();
        const newMsg: Message = { id: userMsgId, role: 'user', content: input };

        setMessages(prev => [...prev, newMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const currentMessages = [...messages, newMsg];
            const apiMessages = currentMessages.map(m => ({ role: m.role, content: m.content }));

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: apiMessages })
            });

            if (!response.ok) {
                throw new Error('Falha de comunicação com o Cérebro EVA');
            }

            const data = await response.json();

            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.response,
                sources: data.sources
            }]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Desculpe, encontrei um erro ao processar sua solicitação.'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFeedback = async (msgId: string, type: 'up' | 'down') => {
        const targetMsg = messages.find(m => m.id === msgId);

        // Atualiza a UI otimisticamente
        setMessages(prev => prev.map(msg =>
            msg.id === msgId ? { ...msg, feedback: type } : msg
        ));

        if (targetMsg && targetMsg.sources && targetMsg.sources.length > 0) {
            try {
                await fetch('/api/chat/feedback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        feedbackType: type,
                        sources: targetMsg.sources
                    })
                });
            } catch (error) {
                console.error("Erro ao registrar feedback no Cérebro.", error);
            }
        }
    };

    const [isHandoffLoading, setIsHandoffLoading] = useState(false);

    const handleHandoff = async () => {
        setIsHandoffLoading(true);
        try {
            const apiMessages = messages.map(m => ({ role: m.role, content: m.content }));
            const response = await fetch('/api/chat/handoff', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: apiMessages,
                    userName: "Raphael Budin", // TODO: Pegar do Auth Provider futuramente
                    userEmail: "raphael.budin@empregga.com.br"
                })
            });

            if (!response.ok) throw new Error('Erro ao transferir');

            const data = await response.json();

            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: `✅ **Chamado Aberto com Sucesso!**\n\nTodo o histórico da nossa conversa foi encaminhado para a equipe de Suporte Humano da Empregga no Zammad (Ticket \`#${data.ticketId}\`). Eles assumirão o atendimento em breve e um email de confirmação foi enviado para você.`
            }]);
        } catch (error) {
            console.error('Handoff error:', error);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: `❌ **Erro ao abrir chamado.**\n\nDesculpe, não consegui contatar o Zammad no momento. Por favor, tente novamente através do portal.`
            }]);
        } finally {
            setIsHandoffLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#FBF2EB]/50">
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                    >
                        {/* Avatar */}
                        {msg.role === 'assistant' && (
                            <img
                                src="/eva-avatar.jpg"
                                alt="EVA"
                                className="w-10 h-10 rounded-full border border-primary/20 shrink-0 object-cover shadow-sm mt-1"
                            />
                        )}

                        {/* Balloon */}
                        <div className={`space-y-2 ${msg.role === 'user' ? 'items-end flex flex-col' : 'items-start flex flex-col'}`}>
                            <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${msg.role === 'user'
                                ? 'bg-[#260A00] text-white rounded-tr-none'
                                : 'bg-white text-[#260A00] border border-primary/10 rounded-tl-none prose prose-sm max-w-none prose-p:leading-relaxed prose-a:text-primary prose-a:font-bold'
                                }`}>
                                {msg.role === 'assistant' ? (
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {msg.content}
                                    </ReactMarkdown>
                                ) : (
                                    msg.content
                                )}
                            </div>

                            {/* Assistant Metadata (Sources & Feedback) */}
                            {msg.role === 'assistant' && msg.id !== 'welcome' && (
                                <div className="flex flex-wrap items-center gap-3 pl-1">
                                    {msg.sources && msg.sources.length > 0 && (
                                        <div className="flex flex-wrap gap-2 text-[10px] items-center">
                                            <span className="font-bold text-gray-400 uppercase tracking-wider">Fontes:</span>
                                            {msg.sources.map(src => (
                                                <span key={src.id} className="bg-primary/5 text-primary border border-primary/20 px-2 py-1 rounded truncate max-w-[150px]" title={src.title}>
                                                    {src.title}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Vertical Divider */}
                                    {msg.sources && msg.sources.length > 0 && (
                                        <div className="w-px h-3 bg-gray-300"></div>
                                    )}

                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => handleFeedback(msg.id, 'up')}
                                            className={`p-1.5 rounded hover:bg-green-100 transition-colors ${msg.feedback === 'up' ? 'text-green-600 bg-green-50' : 'text-gray-400'}`}
                                            title="Resposta Útil"
                                        >
                                            👍
                                        </button>
                                        <button
                                            onClick={() => handleFeedback(msg.id, 'down')}
                                            className={`p-1.5 rounded hover:bg-red-100 transition-colors ${msg.feedback === 'down' ? 'text-red-600 bg-red-50' : 'text-gray-400'}`}
                                            title="Incorreta / Incompleta"
                                        >
                                            👎
                                        </button>
                                        <button
                                            onClick={handleHandoff}
                                            disabled={isHandoffLoading}
                                            className="ml-2 text-[10px] font-bold uppercase tracking-widest text-[#260A00] opacity-50 hover:opacity-100 hover:text-primary transition-colors flex items-center gap-1 p-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            {isHandoffLoading ? '⏳ Transferindo...' : '📞 Preciso de um Humano'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* Typing Indicator */}
                {isLoading && (
                    <div className="flex gap-4 max-w-[85%]">
                        <img
                            src="/eva-avatar.png"
                            alt="EVA"
                            className="w-10 h-10 rounded-full border border-primary/20 shrink-0 object-cover shadow-sm mt-1 opacity-50 animate-pulse"
                        />
                        <div className="bg-white border border-primary/10 p-4 rounded-2xl rounded-tl-none shadow-sm flex gap-1 items-center h-10">
                            <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce"></div>
                            <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-primary/10 shrink-0">
                <form
                    onSubmit={handleSubmit}
                    className="relative max-w-4xl mx-auto flex items-end gap-2"
                >
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                        placeholder="Como eu processo uma rescisão de corretor?"
                        className="w-full bg-background border border-gray-200 rounded-2xl pl-4 pr-12 py-4 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm h-14 min-h-[56px] max-h-32 custom-scrollbar shadow-inner"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="absolute right-2 bottom-2 w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-[#DE2F04] transition-all disabled:opacity-50 disabled:hover:bg-primary shadow-md active:scale-95"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 -rotate-90">
                            <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
                        </svg>
                    </button>
                </form>
                <div className="text-center mt-2">
                    <span className="text-[10px] text-gray-400">A EVA pode cometer erros. Considere verificar as fontes clicando nos links acima das respostas.</span>
                </div>
            </div>
        </div>
    );
}

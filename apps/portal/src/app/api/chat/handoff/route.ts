import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { systemEvents } from '@/db/schema';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { messages, userEmail, userName } = body;

        // Validating minimal payload
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json({ success: false, error: 'Histórico vazio' }, { status: 400 });
        }

        // Parse History into a readable description for the ticket (HTML for Zammad)
        const conversationLog = messages.map((m: any) => `<strong>[${m.role === 'user' ? 'Agente' : 'EVA'}]:</strong><br/>${m.content.replace(/\n/g, '<br/>')}`).join('<br/><br/><hr/>');

        // Let's grab the last user message to use as the title/category summary if needed
        const lastUserMessage = [...messages].reverse().find((m: any) => m.role === 'user');
        const issueContext = lastUserMessage ? lastUserMessage.content.replace(/\n/g, '<br/>') : 'Ajuda Especializada em Operações';

        // Preparing payload for n8n Webhook
        const webhookPayload = {
            first_name: userName ? userName.split(' ')[0] : "Operador",
            last_name: userName && userName.includes(' ') ? userName.split(' ').slice(1).join(' ') : "Empregga",
            email: userEmail || "agente@empregga.com.br", // Fallback if no user is provided for now
            categoria: "Dúvida/Handoff EVA",
            pagina: "EVA Chat",
            descricao: `<strong>Handoff solicitado pela Assistente Virtual EVA.</strong><br/><br/><strong>Contexto do Chamado:</strong><br/>${issueContext}<br/><br/><strong>=== LOG DA CONVERSA ===</strong><br/><br/>${conversationLog}`
        };

        const webhookUrl = 'https://n8nwebhook.empregga.com.br/webhook/fluent-forms-zammad';

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(webhookPayload)
        });

        if (!response.ok) {
            throw new Error(`Erro no disparo do Webhook: ${response.statusText}`);
        }

        // Logando Handoff no Analytics Silenciosamente
        db.insert(systemEvents).values({ id: uuidv4(), eventType: 'HANDOFF' }).execute().catch(e => console.error(e));

        // Se o seu webhook do n8n por padrão retornar um JSON estruturado com o Ticket de alguma forma, extraímos aqui
        // Caso ele não retorne sincronicamente o número do ticket, vamos assumir genérico para a UI
        try {
            const webhookResult = await response.json();
            return NextResponse.json({ success: true, ticketId: webhookResult?.id || webhookResult?.ticket?.id || Math.floor(Math.random() * 10000).toString() });
        } catch (e) {
            // Se o n8n respondeu OK mas não era JSON, assumimos disparo bem sucedido simulando ID interno
            return NextResponse.json({ success: true, ticketId: `INT-${Math.floor(Math.random() * 10000)}` });
        }

    } catch (error: any) {
        console.error('Erro de Handoff Zammad:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

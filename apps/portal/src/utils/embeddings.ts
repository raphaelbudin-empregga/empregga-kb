export async function getEmbedding(text: string): Promise<number[]> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error('OPENAI_API_KEY não configurada no ambiente');
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: text,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Erro na API da OpenAI: ${JSON.stringify(error)}`);
    }

    const result = await response.json();
    return result.data[0].embedding;
}

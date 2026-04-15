import { http, HttpResponse } from 'msw';

export const handlers = [
  // Search API MUST come before /api/knowledge to avoid route conflicts
  http.get('/api/knowledge/search', ({ request }) => {
    try {
      const url = new URL(request.url);
      const q = url.searchParams.get('q');

      // Validação: query parameter é obrigatório
      if (!q || q.trim() === '') {
        return HttpResponse.json(
          { error: 'Query parameter "q" is required' },
          { status: 400 }
        );
      }

      // Para queries NONEXISTENT, retorna array vazio
      if (q.includes('NONEXISTENT')) {
        return HttpResponse.json([]);
      }

      // Resultado padrão - sempre retorna array
      return HttpResponse.json([
        {
          id: 'search-result-1',
          title: `Resultado para: ${q}`,
          similarity: 0.95,
          officialResolution: 'Encontrado no mock',
        },
      ]);
    } catch (error) {
      console.error('Error in knowledge-search handler:', error);
      return HttpResponse.json(
        { error: 'Internal error' },
        { status: 500 }
      );
    }
  }),

  // Knowledge base API
  http.get('/api/knowledge', ({ request }) => {
    const url = new URL(request.url);
    const trash = url.searchParams.get('trash') === 'true';
    const now = new Date().toISOString();
    const active = {
      id: 'test-1',
      title: 'Teste Unitário',
      category: ['PLATAFORMA'],
      author: 'Teste',
      problemDescription: 'Problema de teste',
      officialResolution: 'Solução de teste',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      status: 'PUBLISHED',
      positiveFeedbacks: 5,
      negativeFeedbacks: 0,
    };
    const trashed = {
      ...active,
      id: 'test-trash-1',
      title: 'Unidade Deletada',
      deletedAt: now,
    };

    return HttpResponse.json({
      success: true,
      data: trash ? [trashed] : [active],
    });
  }),

  http.post('/api/knowledge', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        success: true,
        data: {
          id: 'new-unit',
          ...body,
          status: 'PUBLISHED',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: null,
        },
      },
      { status: 201 }
    );
  }),

  http.get('/api/knowledge/:id', ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: {
        id: params.id,
        title: 'Unit Test',
        category: ['OPERACIONAL'],
        author: 'Test',
        problemDescription: 'Test problem',
        officialResolution: 'Test solution',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
        status: 'PUBLISHED',
      },
    });
  }),

  http.put('/api/knowledge/:id', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      success: true,
      data: {
        id: 'test-1',
        ...body,
        deletedAt: (body.deletedAt as string | null | undefined) ?? null,
        updatedAt: new Date().toISOString(),
      },
    });
  }),

  http.delete('/api/knowledge/:id', () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: 'test-1',
        deletedAt: new Date().toISOString(),
      },
    });
  }),

  // Blind spots API
  http.get('/api/blindspots', () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: 'blind-1',
          query: 'Como processar uma rescisão?',
          resolved: false,
          createdAt: new Date().toISOString(),
        },
      ],
    });
  }),

  http.delete('/api/blindspots/:id', () => {
    return HttpResponse.json({
      success: true,
      data: { id: 'blind-1' },
    });
  }),

  // Analytics API
  http.get('/api/analytics', () => {
    // Mock data: 100 queries, 20 handoffs = (100-20)/100*100 = 80% resolution rate
    const totalQueries = 100;
    const totalHandoffs = 20;
    const resolutionRate = Math.round(((totalQueries - totalHandoffs) / totalQueries) * 100);

    return HttpResponse.json({
      success: true,
      data: {
        // New structure (per analytics/route.ts implementation)
        totalQueries,
        totalHandoffs,
        resolutionRate,
        worstUnits: [
          {
            id: 'unit-1',
            title: 'Artigo com mais críticas',
            negativeCount: 5,
          },
          {
            id: 'unit-2',
            title: 'Artigo com críticas moderadas',
            negativeCount: 3,
          },
        ],
        // Legacy structure (for smoke tests compatibility)
        healthStats: { GREAT: 30, WARNING: 10, CRITICAL: 2 },
      },
    });
  }),

  // Auth API
  http.post('/api/auth/login', async ({ request }) => {
    const contentType = request.headers.get('Content-Type');
    if (contentType && !contentType.includes('application/json')) {
      return HttpResponse.json(
        { success: false, error: 'Invalid Content-Type' },
        { status: 400 }
      );
    }

    let body: { email?: unknown; password?: unknown };
    try {
      body = (await request.json()) as { email?: unknown; password?: unknown };
    } catch {
      return HttpResponse.json(
        { success: false, error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }
    const { email, password } = body;

    // Validação de campos obrigatórios
    if (!email || !password) {
      return HttpResponse.json(
        { success: false, error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Credenciais válidas (mock)
    if (email === 'test@example.com' && password === 'password123') {
      return HttpResponse.json(
        {
          success: true,
          user: {
            name: 'Test User',
            email: email,
          },
        },
        {
          status: 200,
          headers: {
            'Set-Cookie': 'adminToken=mock-token; Path=/; HttpOnly; SameSite=lax; Max-Age=604800',
          },
        }
      );
    }

    // Credenciais inválidas (não setar cookie)
    return HttpResponse.json(
      { success: false, error: 'Credenciais inválidas' },
      {
        status: 401,
        headers: {
          // Return empty Set-Cookie to ensure header exists but has no token
          'Set-Cookie': '',
        },
      }
    );
  }),

  http.post('/api/chat/handoff', async ({ request }) => {
    const body = (await request.json()) as { messages?: unknown[] };
    const { messages } = body;

    // Validação: messages não pode estar vazio
    if (!messages || messages.length === 0) {
      return HttpResponse.json(
        { success: false, error: 'Mensagens são obrigatórias' },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      success: true,
      ticketId: `MOCK-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    });
  }),

  // Chat API
  http.post('/api/chat', async () => {
    return HttpResponse.json({
      hasAnswer: true,
      response: 'Esta é uma resposta mockada de teste.',
      sources: [],
    });
  }),

  http.post('/api/chat/feedback', () => {
    return HttpResponse.json({ success: true });
  }),

  // Upload — contrato MSW: sanitiza filename e devolve key UUID-safe
  http.post('/api/upload', async () => {
    const safeKey = `uploads/${crypto.randomUUID()}.bin`;
    return HttpResponse.json({ success: true, key: safeKey });
  }),
];

/**
 * Factories de cenários de erro — usar com `server.use(...)` em testes específicos.
 *
 * Exemplo:
 *   server.use(...handlersError500('/api/knowledge'));
 */
export const handlersError500 = (pathPrefix: string) => [
  http.all(pathPrefix, () =>
    HttpResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  ),
  http.all(`${pathPrefix}/*`, () =>
    HttpResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  ),
];

export const handlersTimeout = (pathPrefix: string) => [
  http.all(pathPrefix, async () => {
    await new Promise((resolve) => setTimeout(resolve, 30_000));
    return HttpResponse.json({ success: false, error: 'Timeout' }, { status: 504 });
  }),
];

export const handlersUnauthorized = (pathPrefix: string) => [
  http.all(pathPrefix, () =>
    HttpResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  ),
  http.all(`${pathPrefix}/*`, () =>
    HttpResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  ),
];

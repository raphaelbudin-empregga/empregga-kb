export type KnowledgeCategory = 
  | 'PLATAFORMA'   // Bugs, funcionalidades, como usar o sistema
  | 'OPERACIONAL'  // Processo seletivo, triagem, entrevista
  | 'UNIVERSIDADE' // Cursos, certificação, dúvidas técnicas RH
  | 'PAGAMENTO'    // Comissões, notas fiscais, prazos
  | 'CORPORATIVO'  // Regras da Empregga, parcerias
  | 'OUTROS';

export type TargetAudience = 'AGENTE' | 'CLIENTE' | 'INTERNO' | 'TODOS';

export type KnowledgeStatus = 'DRAFT' | 'PUBLISHED' | 'NEEDS_REVIEW' | 'ARCHIVED';

export interface KnowledgeUnit {
  id: string;               // UUID v4
  title: string;            // Título curto para visualização em listas
  category: KnowledgeCategory;
  problemDescription: string; // O "Chamado" ou "Pergunta" original
  officialResolution: string; // A resposta curada para o RAG
  tags: string[];           // Ex: ['#MEI', '#Login', '#Universidade']
  targetAudience: TargetAudience[];
  author: string;           // Nome ou ID do membro do time
  createdAt: string;        // ISO 8601
  updatedAt: string;        // ISO 8601
  status: KnowledgeStatus;
  version: number;          // Controle simples de versão (v1, v2...)
  zammadRef?: string;       // ID do chamado no Zammad (opcional para o futuro)
}

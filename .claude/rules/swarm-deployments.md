# Deployment Lessons Learned — Docker Swarm & Traefik

Esta documentação consolida os aprendizados e melhores práticas descobertos ao realizar o deploy de aplicações (como o Next.js) no ecossistema Docker Swarm gerenciado pelo Portainer, utilizando o Traefik como Ingress Controller. 

Qualquer agente `@devops` ou `@architect` DEVE consultar estas regras antes de preparar uma nova infraestrutura ou pipeline CI/CD.

## 1. Regras do Docker Swarm & Compose
- **Injeção de Variáveis:** As variáveis de ambiente configuradas na interface do Portainer (aba *Environment*) NÃO são passadas automaticamente para dentro do contêiner no modo Swarm. Elas DEVEM ser declaradas explicitamente no bloco `environment:` do serviço no `docker-compose.yml` (ex: `- DATABASE_URL`).
- **Redes do Traefik (Overlay):** O Traefik em ambiente Swarm exige que a rede seja do tipo `overlay` e `attachable`. Nunca crie redes isoladas; conecte os novos serviços à rede pública existente que o Traefik já monitora (ex: `network_public`). A rede deve ser declarada como `external: true`.

## 2. Regras de Roteamento (Traefik Labels)
- **Escopo das Labels no Swarm:** No Docker Swarm, as labels do Traefik DEVEM obrigatoriamente ficar dentro do bloco `deploy.labels:` do serviço. Se colocadas diretamente na raiz do serviço (`services.labels:`), o Swarm as aplica apenas ao contêiner isolado, tornando o Traefik "cego" para as rotas (resultando em erros 404).
- **Nome do CertResolver:** O nome do `certresolver` (`traefik.http.routers.<app>.tls.certresolver`) DEVE corresponder exatamento ao configurado globalmente no Traefik do servidor (ex: `letsencryptresolver` em vez do padrão `letsencrypt`).
- **Rede do Traefik:** Sempre inclua a label `traefik.docker.network=<nome_da_rede>` para garantir que o proxy saiba por qual rede rotear o tráfego interno até o contêiner.

## 3. Conexões de Banco de Dados (PostgreSQL / Drizzle)
- **URL Encoding de Senhas:** Se a senha do banco de dados possuir caracteres especiais (como `@`), ela DEVE ser codificada via URL Encode (ex: `@` vira `%40`) na *Connection String*. Caso contrário, a biblioteca `pg` do Node.js falhará silenciosamente no parser, quebrando a query.
- **Roteamento Interno (Gateway):** Para conectar contêineres a um banco de dados hospedado na mesma VPS (cujas portas estão expostas para o host), prefira utilizar o IP de Gateway interno do Docker (ex: `172.17.0.1`) em vez do IP Público. Isso evita problemas de bloqueio por NAT Loopback no firewall.

## 4. Build de Next.js em CI/CD (GitHub Actions)
- **Falhas de Pré-renderização:** Durante o `npm run build` na nuvem (GitHub Actions), o Next.js tentará compilar rotas de API e páginas estáticas. Variáveis de ambiente secretas não estarão disponíveis no momento do build.
- **Fallbacks Seguros:** Sempre forneça valores de "fallback" seguros nas inicializações de clientes externos (como AWS S3, Minio, ou Drizzle DB). Exemplo: `process.env.MINIO_ENDPOINT || 'localhost'`. Isso impede que erros como `Invalid endPoint` quebrem a pipeline de CI/CD.

## 5. Boas Práticas de Produto (Soft Delete)
- **Exclusão de Registros:** Nunca utilize *hard deletes* (exclusão definitiva `DELETE FROM`) em tabelas críticas (como unidades de conhecimento). Implemente sempre o padrão de **Soft Delete** via coluna `deletedAt: timestamp()`.
- **Lixeira:** As rotas de API `GET` devem, por padrão, filtrar itens que não foram excluídos (`deletedAt IS NULL`), permitindo a criação de uma interface de "Lixeira" para restauração (`deletedAt IS NOT NULL`).

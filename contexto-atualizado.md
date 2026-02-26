### 1. Objetivo geral

- **Subir apenas o portal de KB/EVA** (Next.js em `apps/portal`) no seu cluster **Docker Swarm via Portainer + Traefik**, usando o repositório GitHub `raphaelbudin-empregga/empregga-kb`, **sem subir o resto do AIOS**.
- **Padronizar o deploy** via imagem publicada no **GitHub Container Registry (GHCR)**, deixando variáveis e documentação já prontas no AIOS.

---

### 2. O que já foi feito

- **Git/GitHub**
  - O projeto local foi conectado ao repositório GitHub `empregga-kb` (remote `origin`).
  - Feito merge do scaffold inicial do GitHub com o código atual e `git push` da `main`.
- **Portal / Traefik / Portainer**
  - Confirmado que o compose “oficial” está em `apps/portal/docker-compose.yml` no GitHub.
  - Ajustado esse compose para:
    - Remover `env_file: .env` (que causava erro de arquivo ausente no Portainer).
    - Manter labels do Traefik (`intel.empregga.com.br`, `websecure`, `letsencrypt`, `traefik-proxy` network externa).
- **Registry & GHCR**
  - Adicionadas variáveis em `.env` e `.env.example`:
    - `GHCR_USERNAME`, `GHCR_TOKEN`, `GHCR_IMAGE_NAMESPACE`, `PORTAL_IMAGE_NAME=orion-portal`, `PORTAL_IMAGE_TAG=kb-v1`.
  - Criado doc `docs/ghcr-portal-deploy.md` explicando:
    - Como criar o PAT no GitHub.
    - Como fazer `docker login ghcr.io`.
    - Como `docker build` + `docker push` da imagem do portal.
  - Você já:
    - Criou um **registry GHCR** no Portainer.
    - Criou um PAT e preencheu as variáveis.
    - Conseguiu fazer `docker login ghcr.io` na VPS (problema de `username is empty` resolvido).
- **Correção de build**
  - O build Docker falhou na VPS porque `scripts/check-sync.ts` importava `./index` e `./schema` (que não existem nessa pasta).
  - Corrigi o script para importar de `../src/db/index` e `../src/db/schema`, que é onde o `db` e `knowledgeUnits` realmente estão.
  - Essa correção está committada na `main` do repo.

---

### 3. Em que etapa estamos AGORA

- Na VPS você:
  - Já está logado no GHCR.
  - Já clonou (ou está clonando) o repositório `empregga-kb`.
- **Falta concluir:**
  1. **`git pull` na VPS** para garantir que ela tem a versão mais recente (com o `check-sync.ts` corrigido).
  2. **Build da imagem do portal** em `~/empregga-kb/apps/portal`:
     - `docker build -t ghcr.io/$GHCR_IMAGE_NAMESPACE/$PORTAL_IMAGE_NAME:$PORTAL_IMAGE_TAG .`
  3. **Push da imagem** para o GHCR:
     - `docker push ghcr.io/$GHCR_IMAGE_NAMESPACE/$PORTAL_IMAGE_NAME:$PORTAL_IMAGE_TAG`
  4. **Atualizar o `apps/portal/docker-compose.yml`** (no repo) para usar essa imagem com:
     - `image: ghcr.io/$GHCR_IMAGE_NAMESPACE/$PORTAL_IMAGE_NAME:$PORTAL_IMAGE_TAG`
     - (em Swarm, `build`, `restart` e `container_name` são ignorados; a imagem é o que importa).
  5. **No Portainer (Swarm)**:
     - Stack apontando para `git@github.com:raphaelbudin-empregga/empregga-kb.git`, path `apps/portal/docker-compose.yml`.
     - Na aba de Environment, preencher as variáveis que o portal espera (copiadas do `.env` local).
     - Mandar **Pull and redeploy** da stack.

Se você passar esse resumo para a IA local, ela pode focar em:  
(1) garantir o `git pull` + build/push da imagem na VPS;  
(2) ajustar o `docker-compose.yml` para usar a imagem do GHCR;  
(3) acionar o redeploy da stack no Portainer.
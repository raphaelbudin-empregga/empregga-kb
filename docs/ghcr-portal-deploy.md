## Deploy do Portal KB/EVA no GitHub Container Registry (GHCR)

Este guia descreve como:

- Publicar a imagem Docker do portal de conhecimento (KB/EVA) no **GitHub Container Registry (GHCR)**.
- Usar essa imagem em um cluster **Docker Swarm** via Portainer, sem subir o restante do AIOS.

O código do portal está em `apps/portal/` deste repositório.

---

### 1. Variáveis de ambiente para o GHCR

No `.env.example` e no `.env` foram adicionadas as seguintes variáveis:

- `GHCR_USERNAME` — seu usuário do GitHub (ou o user/robot usado para o registry).
- `GHCR_TOKEN` — GitHub Personal Access Token com scopes:
  - `read:packages`
  - `write:packages`
  - `repo` (se as imagens forem ligadas a repositórios privados).
- `GHCR_IMAGE_NAMESPACE` — namespace no GHCR, por exemplo:
  - `raphaelbudin-empregga`
  - ou `raphaelbudin-empregga/algum-subgrupo` se você usar sub-namespaces.
- `PORTAL_IMAGE_NAME` — nome da imagem do portal (sugestão: `orion-portal`).
- `PORTAL_IMAGE_TAG` — tag da imagem (sugestão: `kb-v1`).

Formato sugerido da imagem final:

```text
ghcr.io/${GHCR_IMAGE_NAMESPACE}/${PORTAL_IMAGE_NAME}:${PORTAL_IMAGE_TAG}
```

Exemplo concreto:

```text
ghcr.io/raphaelbudin-empregga/orion-portal:kb-v1
```

---

### 2. Criando o token de acesso ao GHCR

1. Acesse `https://github.com/settings/tokens`.
2. Crie um **Personal Access Token** (classic ou fine-grained) com pelo menos:
   - `read:packages`
   - `write:packages`
   - `repo` (se necessário para repositórios privados).
3. Coloque:
   - `GHCR_USERNAME=<seu usuário ou bot do GitHub>`
   - `GHCR_TOKEN=<token gerado>`
   - `GHCR_IMAGE_NAMESPACE=<namespace desejado>` (ex.: `raphaelbudin-empregga`)
   - `PORTAL_IMAGE_NAME=orion-portal`
   - `PORTAL_IMAGE_TAG=kb-v1`
   no arquivo `.env` local (NUNCA commitar com valores reais).

---

### 3. Build e push da imagem do portal

No host com Docker (pode ser sua máquina de desenvolvimento ou um runner de CI/CD):

```bash
cd apps/portal

# Login no GHCR usando as variáveis do .env
echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USERNAME" --password-stdin

# Build da imagem do portal (Dockerfile em apps/portal/)
docker build -t ghcr.io/$GHCR_IMAGE_NAMESPACE/$PORTAL_IMAGE_NAME:$PORTAL_IMAGE_TAG .

# Push da imagem para o GHCR
docker push ghcr.io/$GHCR_IMAGE_NAMESPACE/$PORTAL_IMAGE_NAME:$PORTAL_IMAGE_TAG
```

Após o push, a imagem do **portal KB/EVA** estará disponível em:

```text
ghcr.io/$GHCR_IMAGE_NAMESPACE/$PORTAL_IMAGE_NAME:$PORTAL_IMAGE_TAG
```

---

### 4. Configurando o registry no Portainer

No Portainer (Admin → Registries):

1. Adicionar um novo registry:
   - **Type**: Docker registry (custom).
   - **Name**: `ghcr.io` (ou outro que faça sentido pra você).
   - **URL**: `https://ghcr.io`.
   - **Username**: mesmo valor de `GHCR_USERNAME`.
   - **Password/Token**: mesmo valor de `GHCR_TOKEN`.
2. Salvar.

Com isso, o cluster Swarm conseguirá puxar imagens do GHCR usando essas credenciais.

---

### 5. Ajustando a stack do portal no Swarm (Portainer)

No arquivo `apps/portal/docker-compose.yml`:

- O serviço `orion-portal` deve usar a imagem do GHCR:

```yaml
services:
  orion-portal:
    image: ghcr.io/${GHCR_IMAGE_NAMESPACE}/${PORTAL_IMAGE_NAME}:${PORTAL_IMAGE_TAG}
    # build: ... (opcional, só para uso local com docker compose)
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.orion.rule=Host(`intel.empregga.com.br`)"
      - "traefik.http.routers.orion.entrypoints=websecure"
      - "traefik.http.routers.orion.tls=true"
      - "traefik.http.routers.orion.tls.certresolver=letsencrypt"
      - "traefik.http.services.orion.loadbalancer.server.port=3000"
    networks:
      - traefik-proxy

networks:
  traefik-proxy:
    external: true
```

> **Observação:** Em modo Swarm, o `build`, `restart` e `container_name` são ignorados. O que importa é o `image:` e as labels.

No Portainer, ao criar/editar a stack:

1. Tipo: **Git repository**.
2. Repository URL: `git@github.com:raphaelbudin-empregga/empregga-kb.git`.
3. Branch: `main`.
4. Compose path: `apps/portal/docker-compose.yml`.
5. Na aba de **Environment**, defina as variáveis de ambiente reais esperadas pelo portal (copiadas do `.env` local, sem secretos no Git).
6. **Deploy** ou **Pull and redeploy**.

Assim, apenas o portal KB/EVA sobe como serviço no Swarm, usando a imagem publicada no GHCR, sem necessidade de subir o restante do AIOS.


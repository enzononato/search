# Plano de Execução — Pesquisa de Percepção da TI (Revalle)

> Documento de handoff para implementação. Stack, decisões e escopo já validados com o cliente.
> Implementação será feita por outro agente seguindo este plano.

## 1. Decisões já tomadas (não revisar sem alinhar)

| Tema | Decisão |
|---|---|
| **Stack** | Next.js full-stack (App Router) — API routes + frontend no mesmo projeto |
| **Banco** | Mesmo PostgreSQL da VPS. Nova tabela para respostas |
| **Validação CPF** | Só verifica se o CPF **existe** na tabela de colaboradores. NÃO puxa a unidade (colaborador escolhe manualmente) |
| **Privacidade** | **Anônimo.** CPF serve só como trava anti-duplicidade. Resposta NÃO fica vinculada ao colaborador |
| **Dashboard** | Incluído no escopo (tela admin com resultados por unidade, NPS, médias e comentários) |

## 2. Princípio central de privacidade (LER ANTES DE CODAR)

Para ser **anônimo** e ao mesmo tempo garantir **uma resposta por CPF**, separamos identidade de conteúdo em **duas tabelas sem relacionamento**:

- `respondentes` — guarda apenas `cpf_hash` (SHA-256 do CPF normalizado + *pepper* secreto). É a trava.
- `respostas` — guarda as respostas. **Nenhuma coluna de CPF, hash ou id de colaborador.**

No envio, dentro de **uma transação**:
1. Insere o hash em `respondentes` com `ON CONFLICT (cpf_hash) DO NOTHING`.
2. Se `rowcount == 0` → CPF já respondeu → aborta com erro.
3. Se inseriu → grava a resposta em `respostas` (sem hash).
4. Commit.

Como as tabelas não têm FK nem timestamp correlacionável de forma óbvia entre si, não há como reconstruir "quem respondeu o quê".

## 3. Fluxo do usuário

```
[Tela 1: CPF]  ->  POST /api/validar-cpf
     |               - valida formato (11 dígitos + dígitos verificadores)
     |               - existe em colaboradores?  (não  -> erro genérico)
     |               - já respondeu? (hash em respondentes -> erro "já respondida")
     |               - OK -> gera token JWT curto (~30min) contendo o cpf_hash
     v
[Tela 2..n: Questionário]  (15 perguntas, com perguntas condicionais)
     |
     v
[Envio]  ->  POST /api/enviar   (Authorization: Bearer <token>)
     |          - valida token, extrai cpf_hash
     |          - transação: trava + grava resposta
     v
[Tela final: agradecimento]
```

**Por que token?** Evita reenviar o CPF no submit e garante que o hash usado na trava é o mesmo que passou pela validação. O token é efêmero e **nunca** é gravado junto da resposta.

## 4. Perguntas e tipos de dado

| # | Pergunta | Tipo | Obrigatória | Observação |
|---|---|---|---|---|
| 1 | Unidade | select (7 opções fixas) | Sim | Validar contra lista no servidor |
| 2 | Equipamento principal | radio: notebook / desktop / ambos / nenhum | Sim | |
| 3 | Avaliação do equipamento | estrelas 1–5 | Sim | |
| 4 | Acessórios do notebook | radio: sim / parcialmente / não / não_utiliza | Sim | Só habilita se Q2 ∈ {notebook, ambos} |
| 5 | Usa celular corporativo? | radio: sim / não | Sim | |
| 6 | Avaliação do celular | estrelas 1–5 ou "não utilizo" | Condicional | Só se Q5 = sim |
| 7 | Atendimento da TI | estrelas 1–5 | Sim | |
| 8 | Presença/disponibilidade da TI | estrelas 1–5 | Sim | |
| 9 | Resolução em tempo adequado | radio: sempre / maioria / às_vezes / raramente / nunca | Sim | |
| 10 | Itens que precisam de melhoria | checkbox, **máx. 3** | Sim | Se marcar "Outro", habilita campo texto |
| 11 | Equipamento/recurso que atrapalha | texto aberto | Não | |
| 12 | NPS (recomendaria) | inteiro 0–10 | Sim | |
| 13 | O que a TI faz muito bem | texto aberto | Não | |
| 14 | Principal melhoria na unidade | texto aberto | Não | |
| 15 | Sugestão/crítica/elogio | texto aberto | Não | |

**Perguntas condicionais:** Q4 desabilitada/oculta se não usa notebook; Q6 oculta se Q5 = não. Persistir valor coerente (ex.: `acessorios_notebook = 'nao_utiliza'`, `avaliacao_celular = null`).

## 5. Schema do banco (DDL)

```sql
-- Trava anti-duplicidade (SEM ligação com respostas)
CREATE TABLE respondentes (
  cpf_hash      char(64) PRIMARY KEY,          -- SHA-256 hex do CPF normalizado + pepper
  respondido_em timestamptz NOT NULL DEFAULT now()
);

-- Respostas (SEM CPF / SEM hash / SEM id de colaborador)
CREATE TABLE respostas (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  criado_em              timestamptz NOT NULL DEFAULT now(),
  unidade                text NOT NULL,        -- validar contra lista fixa
  equipamento_principal  text NOT NULL,        -- notebook|desktop|ambos|nenhum
  avaliacao_equipamento  smallint NOT NULL CHECK (avaliacao_equipamento BETWEEN 1 AND 5),
  acessorios_notebook    text NOT NULL,        -- sim|parcialmente|nao|nao_utiliza
  usa_celular_corp       boolean NOT NULL,
  avaliacao_celular      smallint CHECK (avaliacao_celular BETWEEN 1 AND 5), -- null se não usa
  avaliacao_atendimento  smallint NOT NULL CHECK (avaliacao_atendimento BETWEEN 1 AND 5),
  avaliacao_presenca     smallint NOT NULL CHECK (avaliacao_presenca BETWEEN 1 AND 5),
  resolucao_tempo        text NOT NULL,        -- sempre|maioria|as_vezes|raramente|nunca
  itens_melhoria         text[] NOT NULL DEFAULT '{}', -- máx 3, validar no servidor
  item_melhoria_outro    text,
  equipamento_prejudica  text,
  nps                    smallint NOT NULL CHECK (nps BETWEEN 0 AND 10),
  ti_faz_bem             text,
  principal_melhoria     text,
  sugestao               text
);

CREATE INDEX idx_respostas_unidade ON respostas (unidade);
CREATE INDEX idx_respostas_criado_em ON respostas (criado_em);
```

> A tabela `colaboradores` já existe. **PENDÊNCIA:** confirmar nome real da tabela e da coluna de CPF, e como o CPF está armazenado (com ou sem máscara). Normalizar sempre para 11 dígitos antes de comparar.

## 6. Contratos de API

### `POST /api/validar-cpf`
```
req:  { "cpf": "12345678901" }
200:  { "token": "<jwt>" }
400:  { "error": "cpf_invalido" }        // formato/dígito verificador
403:  { "error": "nao_encontrado" }      // não existe em colaboradores (msg genérica p/ usuário)
409:  { "error": "ja_respondida" }
429:  { "error": "muitas_tentativas" }    // rate limit
```

### `POST /api/enviar`  (header `Authorization: Bearer <token>`)
```
req:  { ...todas as respostas... }
201:  { "ok": true }
400:  { "error": "validacao", "campos": [...] }
401:  { "error": "token_invalido" }       // expirado/inválido
409:  { "error": "ja_respondida" }        // corrida: travou entre validar e enviar
```

### `GET /api/admin/resultados`  (protegido — ver seção 8)
Retorna dados agregados para o dashboard (filtro opcional `?unidade=`).

## 7. Estrutura de arquivos sugerida (Next.js App Router)

```
/app
  /page.tsx                    -> tela de CPF
  /pesquisa/page.tsx           -> questionário (client component, multi-step)
  /obrigado/page.tsx           -> agradecimento
  /admin/page.tsx              -> dashboard (protegido)
  /api/validar-cpf/route.ts
  /api/enviar/route.ts
  /api/admin/resultados/route.ts
  /api/admin/export/route.ts   -> CSV opcional
/lib
  db.ts                        -> pool pg (ou Prisma)
  cpf.ts                       -> normaliza + valida dígito verificador
  hash.ts                      -> SHA-256 + pepper
  token.ts                     -> assina/verifica JWT
  perguntas.ts                 -> definição das 15 perguntas (fonte única, usada no front e na validação)
  ratelimit.ts
/components
  StarRating.tsx
  StepProgress.tsx
  ...
```

**Recomendação:** definir as perguntas/opções em `lib/perguntas.ts` como fonte única de verdade, e a validação do servidor reusar essa definição (evita divergência front/back).

## 8. Dashboard admin

- **Auth:** simples para MVP — senha única de admin via variável de ambiente, protegendo `/admin` e `/api/admin/*` (middleware). *(Confirmar com o cliente se querem algo mais robusto.)*
- **Métricas por unidade (com filtro global):**
  - Nº de respostas por unidade.
  - **NPS:** `% promotores (9–10) − % detratores (0–6)`.
  - Médias das estrelas: equipamento, celular, atendimento, presença.
  - Distribuição da Q9 (resolução em tempo).
  - **Top itens de melhoria (Q10):** agregar com `unnest(itens_melhoria)` e contar.
  - Listagem dos textos abertos (Q11, Q13, Q14, Q15) por unidade.
- **Export CSV** das respostas (`/api/admin/export`).

Exemplo de agregação da Q10:
```sql
SELECT item, count(*) AS total
FROM respostas, unnest(itens_melhoria) AS item
GROUP BY item ORDER BY total DESC;
```

## 9. Segurança

- Validação de CPF (formato + dígitos verificadores) no cliente **e** no servidor.
- **Rate limiting** em `/api/validar-cpf` por IP (a tela de CPF revela se um CPF existe — mitiga enumeração). Mensagem de "não encontrado" genérica.
- `pepper` do hash e segredo do JWT em variáveis de ambiente, nunca no código.
- Conexão ao Postgres via `localhost` na VPS (banco não exposto à internet).
- Validar no servidor: unidade ∈ lista, `itens_melhoria` ≤ 3 e ∈ opções válidas, faixas dos ratings.
- Nunca logar CPF em claro.

## 10. Variáveis de ambiente

```
DATABASE_URL=postgres://user:pass@localhost:5432/db
CPF_PEPPER=<segredo aleatório longo>
JWT_SECRET=<segredo aleatório longo>
ADMIN_PASSWORD=<senha do dashboard>
COLABORADORES_TABLE=colaboradores   # confirmar
COLABORADORES_CPF_COLUMN=cpf        # confirmar
```

## 11. Deploy na VPS

- `next build` + `next start` gerenciado por **PM2** (ou Docker), atrás de **nginx** como reverse proxy com HTTPS (Let's Encrypt).
- Definir subdomínio para o link (ex.: `pesquisa.revalle.com.br`). **PENDÊNCIA:** domínio/subdomínio.
- Rodar o DDL da seção 5 no Postgres antes do primeiro deploy.
- `.env` de produção na VPS (fora do repositório).

## 12. Fases de implementação (ordem sugerida p/ o Sonnet)

1. **Setup** — projeto Next.js, `lib/db.ts`, conexão Postgres, rodar DDL.
2. **Núcleo CPF** — `cpf.ts`, `hash.ts`, `token.ts`, `/api/validar-cpf` + rate limit.
3. **Questionário** — `lib/perguntas.ts`, tela de CPF, questionário multi-step com condicionais, `StarRating`.
4. **Envio** — `/api/enviar` com transação de trava + gravação; tela de agradecimento.
5. **Dashboard** — auth admin, `/api/admin/resultados`, tela `/admin`, export CSV.
6. **Deploy** — build, PM2/nginx/HTTPS, `.env` de produção.

## 13. Pendências a confirmar com o cliente antes/durante a implementação

- [ ] Nome real da tabela de colaboradores + coluna de CPF + formato de armazenamento (com/sem máscara).
- [ ] Credenciais/DSN do Postgres da VPS.
- [ ] Quais perguntas de estrelas são obrigatórias (o plano assume todas obrigatórias exceto textos abertos).
- [ ] Nível de autenticação do dashboard (senha única basta?).
- [ ] Domínio/subdomínio para o link público.
- [ ] Identidade visual (logo Revalle, cores) para a tela.
```
# ProTarefa

Gerenciador de tarefas organizadas por projeto. PWA em português (pt-BR).

## Stack

- **Framework**: Quasar v2 (`@quasar/app-vite` v2) sobre Vue 3 (`<script setup>`), Vite v8
- **Estado**: Pinia (stores em `src/stores/`)
- **Backend**: Supabase (auth + Postgres com RLS) — project ref `qjhyxmpytsgbnemtthzd`
- **Build**: PWA (`quasar build -m pwa`), Workbox `GenerateSW` com `skipWaiting`/`clientsClaim`
- **Deploy**: Vercel (`protarefa.vercel.app`), conectado ao GitHub `fred512/protarefa` — push na `main` = deploy de produção automático

## Comandos

```bash
npm run dev      # dev server em http://localhost:3002 (cai para 3003 se ocupada)
npm run build    # build PWA de produção -> dist/pwa
npm run preview  # serve o build localmente
```

## Arquitetura

- `src/lib/supabase.js` — cliente Supabase. URL e anon key ficam **hardcoded de propósito** (vão no bundle do PWA); a proteção real dos dados é o RLS nas tabelas.
- `src/lib/constants.js` — metadados de status de tarefa (`a_fazer`/`fazendo`/`feito`, com label/cor/ícone) e paleta de cores de projeto. Os valores de status precisam bater com o CHECK do banco.
- `src/stores/auth.js` — sessão, login e-mail/senha, login Google (OAuth), logout.
- `src/stores/tarefas.js` — CRUD de projetos e tarefas; o dashboard traz a contagem de tarefas por status junto de cada projeto.
- `src/router/index.js` — guard de rota: sem sessão só acessa `/login`.
- `src/boot/auth.js` — exibe erros de OAuth (que voltam no hash da URL) via Notify após `router.isReady()`, e redireciona `/login` → `/` no evento `SIGNED_IN`.
- Páginas: `LoginPage`, `DashboardPage` (lista de projetos), `ProjetoPage` (tarefas de um projeto, com filtro por status).
- Diálogos: `ProjetoDialog`, `TarefaDialog`.

## Modelo de dados (Supabase)

- `projeto` — `id`, `nome`, `descricao`, `cor`, `created_at`
- `tarefa` — `id`, `projeto_id` (FK), `titulo`, `descricao`, `status`, `created_at`, `updated_at`
- RLS ativo nas duas tabelas (inserção anônima é bloqueada).

## Design

Direção estética **"Estúdio Noturno"** — tema escuro, definida em `src/css/app.css`:

- Fontes: **Bricolage Grotesque** (display/títulos) + **Figtree** (corpo), via Google Fonts em `index.html`
- Cores: tinta `#0D0F14`, violeta `#7C6FFF` (primária), sinais lima `#A3E635` / âmbar `#FFB454` / aço `#8A93A6`
- Atmosfera: aurora animada de fundo + grão sutil; fio de luz nas bordas; glow em botões primários e pills
- Animações respeitam `prefers-reduced-motion`
- Convenção: classes utilitárias `anim-1`..`anim-5` para entradas escalonadas

## Convenções

- **Todo o código e UI em português** (nomes de variáveis, funções, comentários, textos).
- Idioma dos commits: português.
- Erros de operação são mostrados ao usuário via `$q.notify({ type: 'negative', ... })`.

## Próximos passos / ideias (backlog)

Melhorias propostas para os **anexos** (feature já no ar), a retomar depois da
atualização da IDE:

- **Miniatura das imagens**: nos anexos que são imagem, mostrar um preview
  (thumbnail) em vez de só o ícone genérico. Provavelmente via link assinado
  curto para a imagem, exibido num `<img>` pequeno na lista do TarefaDialog.
- **Abrir anexo direto da lista de tarefas**: permitir baixar/visualizar o
  anexo a partir do item na `ProjetoPage`, sem precisar abrir o diálogo de
  edição (hoje o 📎 é só um indicador de contagem).

## Configuração externa (fora do código)

Estas dependem do dashboard e **não** estão versionadas:

- **Supabase → Auth**: provider Google habilitado (cliente OAuth "Protarefa Web" no Google Cloud). Signups por e-mail podem estar desabilitados — nesse caso usuários são criados manualmente no dashboard.
- **Google Cloud**: tela de consentimento OAuth em modo "Teste" (só e-mails cadastrados como test users conseguem logar). URIs autorizados incluem `http://localhost:3002`, `https://protarefa.vercel.app` e o callback `https://qjhyxmpytsgbnemtthzd.supabase.co/auth/v1/callback`.

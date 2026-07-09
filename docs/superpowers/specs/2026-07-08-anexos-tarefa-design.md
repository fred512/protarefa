# Anexos em tarefas — design

Data: 2026-07-08

## Objetivo

Permitir anexar arquivos (imagens e PDF) às tarefas do ProTarefa, com
armazenamento seguro e privado no Supabase Storage.

## Decisões

- **Vários anexos** por tarefa (tabela `anexo` separada).
- Tipos: **imagem e PDF**, tamanho **≤ 10 MB** (validado no cliente e reforçado
  no bucket via restrições de tamanho/MIME).
- Bucket **privado**; download por **link assinado** de 60s.

## Armazenamento

- Bucket `anexos` (privado).
- Caminho: `{user_id}/{tarefa_id}/{uuid}-{nome-sanitizado}`.
- O prefixo `{user_id}` permite política de Storage simples: o usuário só acessa
  a própria pasta (`(storage.foldername(name))[1] = auth.uid()`).

## Banco — tabela `anexo`

| coluna | tipo | notas |
|---|---|---|
| id | bigint identity | PK |
| tarefa_id | bigint | FK → tarefa(id) ON DELETE CASCADE |
| user_id | uuid | default `auth.uid()` |
| nome | text | nome original (para exibir/baixar) |
| caminho | text | chave no Storage |
| tamanho | bigint | bytes |
| tipo | text | mime |
| created_at | timestamptz | default now() |

RLS `dono_anexo`: `auth.uid() = user_id` (mesmo padrão de `projeto`/`tarefa`,
que têm `user_id` + policy `dono_*`).

## App

### Store (`stores/tarefas.js`)
- `carregarTarefas` passa a trazer a contagem de anexos por tarefa
  (`select('*, anexo(count)')` → `tarefa.num_anexos`).
- `carregarAnexos(tarefaId)`, `enviarAnexo(tarefaId, file)`,
  `removerAnexo(anexo)`, `linkAnexo(anexo)` (URL assinada 60s).
- `enviarAnexo` faz rollback do arquivo no Storage se o insert da linha falhar.
- Contador local (`num_anexos`) é ajustado ao enviar/remover.
- `excluirTarefa` e `excluirProjeto` apagam os arquivos do Storage antes de
  excluir (cascade remove as linhas). Limpeza best-effort no cliente.

### Diálogo (`components/TarefaDialog.vue`)
- Seção "Anexos": botão **Anexar arquivo** (input oculto, `accept`
  imagem/PDF, múltiplo), validação de tipo/tamanho no cliente.
- Lista: ícone por tipo, nome, tamanho, baixar, remover.
- **Editar**: upload/remoção imediatos.
- **Criar**: arquivos ficam pendentes e sobem após `criarTarefa`.

### Lista (`pages/ProjetoPage.vue`)
- Chip discreto (📎 + contagem) nos itens com anexos.

## Constantes (`lib/constants.js`)
- `MAX_ANEXO_MB` / `MAX_ANEXO_BYTES`, `tipoAnexoValido(tipo)`,
  `formatarTamanho(bytes)`.

## Fora do código (feito no dashboard pelo usuário)
- Criar bucket `anexos` (privado, restrição de 10 MB e MIME image/PDF).
- Rodar o SQL: tabela `anexo` + RLS + políticas de Storage.

## Não incluído (v1)
- Pré-visualização inline de imagens (só ícone + download).
- Limpeza server-side de órfãos (trigger/edge function).
- Reordenar anexos.

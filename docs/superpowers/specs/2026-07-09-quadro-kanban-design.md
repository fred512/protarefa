# Quadro (kanban) estilo Trello — design

Data: 2026-07-09

## Objetivo

Oferecer uma visão em quadro (colunas por status) na página do projeto,
tornando a mudança de status mais fácil e visível — sobretudo no celular, onde
o menu de status atual é pouco descoberto.

## Decisões (aprovadas)

- **Alternar Lista / Quadro** (as duas visões coexistem; escolha persistida).
- **Mover cartão de duas formas**: arrastar-e-soltar **e** tocar → menu.

## Navegação

- `ProjetoPage` ganha um seletor **Lista / Quadro** (segmented) junto aos
  filtros. Escolha salva em `localStorage` (`visao_projeto`), default `quadro`.
- Os filtros por status aparecem só na **Lista** (no Quadro as colunas já
  separam por status).

## Layout do quadro

- Três colunas: A fazer · Fazendo · Feito. Cabeçalho de cada coluna: bolinha da
  cor do status + label + contagem.
- Desktop: colunas lado a lado (flex). Celular: rolagem horizontal com
  `scroll-snap`, colunas ~80vw (espiando a próxima).
- Cartão: título, descrição curta (2 linhas), indicador 📎 de anexos.

## Interações

- **Arrastar** cartão para outra coluna → muda o status. Biblioteca
  `vuedraggable@next` (SortableJS), com `group` compartilhado entre as colunas.
  Toque: `delay ~200ms` + `delayOnTouchOnly` para não atrapalhar a rolagem.
- **Tocar** no corpo do cartão → abre `TarefaDialog` (editar).
- Botão **⋮** no cartão → menu: **Mover para ▸** (3 status), **Editar**,
  **Excluir**.
- **FAB ＋** continua criando tarefa (entra em "A fazer").

## Dados

- Colunas derivadas do `status` (sem coluna nova no banco). Mover =
  `atualizarTarefa({ status })` (já existe).
- Ordem dentro da coluna **não** persiste (não há campo de ordem); ao recarregar
  volta à ordem por `created_at`. Só o status persiste. (v2: coluna de ordem.)

## Componentes

- Novo `components/TarefaQuadro.vue`: recebe `tarefas` (prop), monta as colunas
  locais, cuida do arrastar e do menu do cartão. Emite `editar(tarefa)`,
  `excluir(tarefa)` e `mudar-status(tarefa, status)` — `ProjetoPage` liga esses
  eventos aos handlers que já tem.
- `ProjetoPage.vue`: adiciona o toggle e renderiza a lista atual **ou**
  `<TarefaQuadro>`; mantém diálogos (`ProjetoDialog`, `TarefaDialog`) e o FAB.

## Dependência

- `vuedraggable@next` (v4, wrapper Vue 3 do SortableJS).

## Não incluído (v1)

- Persistir a ordem dos cartões.
- Arrastar entre projetos.
- Colunas customizáveis (fixas nos 3 status).

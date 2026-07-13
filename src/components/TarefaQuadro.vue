<template>
  <div class="quadro">
    <div
      v-for="s in LISTA_STATUS"
      :key="s.valor"
      class="quadro-coluna"
      :style="{ '--cor': s.cor }"
    >
      <div class="coluna-cabecalho">
        <span class="dot" :style="{ backgroundColor: s.cor }" />
        <span class="coluna-nome">{{ s.label }}</span>
        <span class="coluna-contagem">{{ colunas[s.valor].length }}</span>
      </div>

      <draggable
        v-model="colunas[s.valor]"
        :group="{ name: 'tarefas' }"
        item-key="id"
        class="coluna-lista"
        :animation="180"
        :delay="180"
        :delay-on-touch-only="true"
        ghost-class="card-ghost"
        @change="e => aoMover(e, s.valor)"
      >
        <template #item="{ element: tarefa }">
          <div
            class="quadro-card"
            :class="{ 'card-feito': tarefa.status === 'feito' }"
            @click="emit('editar', tarefa)"
          >
            <div class="card-topo">
              <div class="card-titulo">{{ tarefa.titulo }}</div>
              <q-btn flat round dense size="sm" icon="more_vert" class="card-menu-btn" @click.stop>
                <q-menu auto-close anchor="bottom right" self="top right">
                  <q-list style="min-width: 180px">
                    <q-item-label header class="text-caption text-grey-5">Mover para</q-item-label>
                    <q-item
                      v-for="alvo in LISTA_STATUS"
                      :key="alvo.valor"
                      clickable
                      :disable="alvo.valor === tarefa.status"
                      @click="moverPorMenu(tarefa, alvo.valor)"
                    >
                      <q-item-section avatar>
                        <q-icon :name="alvo.icon" :style="{ color: alvo.cor }" />
                      </q-item-section>
                      <q-item-section>{{ alvo.label }}</q-item-section>
                    </q-item>
                    <q-separator class="q-my-xs" />
                    <q-item clickable @click="emit('editar', tarefa)">
                      <q-item-section avatar><q-icon name="edit" /></q-item-section>
                      <q-item-section>Editar</q-item-section>
                    </q-item>
                    <q-item clickable class="text-negative" @click="emit('excluir', tarefa)">
                      <q-item-section avatar><q-icon name="delete" /></q-item-section>
                      <q-item-section>Excluir</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-btn>
            </div>

            <div v-if="tarefa.descricao" class="card-desc">{{ tarefa.descricao }}</div>
            <div v-if="tarefa.num_anexos" class="card-anexos">
              <q-icon name="attach_file" size="12px" />
              {{ tarefa.num_anexos }}
            </div>
          </div>
        </template>

        <template #footer>
          <div v-if="!colunas[s.valor].length" class="coluna-vazia">Solte tarefas aqui</div>
        </template>
      </draggable>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import draggable from 'vuedraggable'
import { LISTA_STATUS } from 'src/lib/constants'

const props = defineProps({
  tarefas: { type: Array, default: () => [] }
})
const emit = defineEmits(['editar', 'excluir', 'mudar-status'])

const colunas = ref({ a_fazer: [], fazendo: [], feito: [] })

function reconstruir () {
  const nova = { a_fazer: [], fazendo: [], feito: [] }
  for (const t of props.tarefas) {
    if (nova[t.status]) nova[t.status].push(t)
  }
  colunas.value = nova
}

// Reconstrói as colunas quando muda o conjunto de tarefas (id/status/título/anexos)
watch(
  () => props.tarefas.map(t => `${t.id}:${t.status}:${t.titulo}:${t.num_anexos || 0}`).join('|'),
  reconstruir,
  { immediate: true }
)

function aoMover (evento, statusDestino) {
  // Só interessa quando um card entra nesta coluna (arrastado de outra)
  if (evento.added) {
    const tarefa = evento.added.element
    tarefa.status = statusDestino // feedback imediato antes do persist
    emit('mudar-status', tarefa, statusDestino)
  }
}

function moverPorMenu (tarefa, statusDestino) {
  if (tarefa.status === statusDestino) return
  // Move local para dar resposta imediata; o persist vem pelo evento
  colunas.value[tarefa.status] = colunas.value[tarefa.status].filter(t => t.id !== tarefa.id)
  tarefa.status = statusDestino
  colunas.value[statusDestino] = [tarefa, ...colunas.value[statusDestino]]
  emit('mudar-status', tarefa, statusDestino)
}
</script>

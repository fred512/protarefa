<template>
  <q-page padding>
    <div v-if="projeto" class="q-mx-auto" style="max-width: 800px; padding-bottom: 96px">
      <!-- Cabeçalho do projeto -->
      <div class="row items-center q-mb-xs no-wrap anim-1">
        <q-btn flat round dense icon="arrow_back" to="/" class="q-mr-sm" />
        <span
          class="pc-dot q-mr-sm"
          :style="{ backgroundColor: projeto.cor || '#7C6FFF' }"
        />
        <div class="pagina-titulo ellipsis">{{ projeto.nome }}</div>
        <q-space />
        <q-btn flat round dense icon="more_vert">
          <q-menu auto-close>
            <q-list style="min-width: 180px">
              <q-item clickable @click="dialogProjeto = true">
                <q-item-section avatar><q-icon name="edit" /></q-item-section>
                <q-item-section>Editar projeto</q-item-section>
              </q-item>
              <q-item clickable class="text-negative" @click="confirmarExclusaoProjeto">
                <q-item-section avatar><q-icon name="delete" /></q-item-section>
                <q-item-section>Excluir projeto</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </div>

      <div v-if="projeto.descricao" class="pagina-sub q-mb-md q-ml-xl anim-2">
        {{ projeto.descricao }}
      </div>

      <!-- Alternador Lista / Quadro -->
      <div class="row items-center q-mb-md anim-2">
        <q-btn-toggle
          v-model="visao"
          no-caps
          unelevated
          dense
          toggle-color="primary"
          color="dark"
          text-color="grey-5"
          :options="[
            { label: 'Lista', value: 'lista', icon: 'view_list' },
            { label: 'Quadro', value: 'quadro', icon: 'view_kanban' }
          ]"
          class="visao-toggle"
        />
      </div>

      <!-- Filtro por status (só na lista) -->
      <div v-if="visao === 'lista'" class="row q-gutter-xs q-mb-md">
        <button
          class="filtro-pill"
          :class="{ ativo: filtro === null }"
          @click="filtro = null"
        >
          Todas ({{ store.tarefas.length }})
        </button>
        <button
          v-for="s in LISTA_STATUS"
          :key="s.valor"
          class="filtro-pill"
          :class="{ ativo: filtro === s.valor }"
          :style="{ '--cor-pill': s.cor }"
          @click="filtro = filtro === s.valor ? null : s.valor"
        >
          <span class="dot" />
          {{ s.label }} ({{ contagem[s.valor] }})
        </button>
      </div>

      <!-- Carregando -->
      <div v-if="store.carregando && !store.tarefas.length" class="row justify-center q-pa-xl">
        <q-spinner size="40px" color="primary" />
      </div>

      <!-- Quadro -->
      <TarefaQuadro
        v-else-if="visao === 'quadro'"
        :tarefas="store.tarefas"
        class="anim-3 q-pb-xl"
        @editar="editarTarefa"
        @excluir="confirmarExclusaoTarefa"
        @mudar-status="(t, s) => mudarStatus(t, s)"
      />

      <!-- Lista -->
      <div v-else-if="!tarefasFiltradas.length" class="estado-vazio column items-center q-pa-xl anim-3">
        <q-icon name="checklist" size="56px" />
        <div class="text-body1 q-mt-md">
          {{ store.tarefas.length ? 'Nenhuma tarefa com esse status.' : 'Nenhuma tarefa ainda. Crie a primeira!' }}
        </div>
      </div>

      <div v-else class="anim-3 q-pb-xl">
        <div
          v-for="tarefa in tarefasFiltradas"
          :key="tarefa.id"
          class="tarefa-item"
          :class="{ 'tarefa-feita': tarefa.status === 'feito' }"
          :style="{ '--cor-status': STATUS[tarefa.status].cor }"
        >
          <q-btn
            flat
            round
            dense
            :icon="STATUS[tarefa.status].icon"
            :style="{ color: STATUS[tarefa.status].cor }"
          >
            <q-tooltip>Mudar status</q-tooltip>
            <q-menu auto-close>
              <q-list style="min-width: 160px">
                <q-item
                  v-for="s in LISTA_STATUS"
                  :key="s.valor"
                  clickable
                  :active="tarefa.status === s.valor"
                  @click="mudarStatus(tarefa, s.valor)"
                >
                  <q-item-section avatar>
                    <q-icon :name="s.icon" :style="{ color: s.cor }" />
                  </q-item-section>
                  <q-item-section>{{ s.label }}</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>

          <div class="col">
            <div class="tarefa-titulo">{{ tarefa.titulo }}</div>
            <div v-if="tarefa.descricao" class="tarefa-desc">{{ tarefa.descricao }}</div>
            <div v-if="tarefa.num_anexos" class="tarefa-anexos">
              <q-icon name="attach_file" size="13px" />
              {{ tarefa.num_anexos }} anexo{{ tarefa.num_anexos === 1 ? '' : 's' }}
            </div>
          </div>

          <div class="tarefa-acoes row no-wrap items-center">
            <q-btn flat round dense size="sm" icon="edit" color="grey-6" @click="editarTarefa(tarefa)" />
            <q-btn flat round dense size="sm" icon="delete" color="grey-6" @click="confirmarExclusaoTarefa(tarefa)" />
          </div>
        </div>
      </div>
    </div>

    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn fab icon="add" color="primary" @click="novaTarefa">
        <q-tooltip>Nova tarefa</q-tooltip>
      </q-btn>
    </q-page-sticky>

    <ProjetoDialog v-model="dialogProjeto" :projeto="projeto" @saved="p => (projeto = p)" />
    <TarefaDialog v-model="dialogTarefa" :projeto-id="projetoId" :tarefa="tarefaEmEdicao" />
  </q-page>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import { useTarefasStore } from 'src/stores/tarefas'
import { STATUS, LISTA_STATUS } from 'src/lib/constants'
import ProjetoDialog from 'src/components/ProjetoDialog.vue'
import TarefaDialog from 'src/components/TarefaDialog.vue'
import TarefaQuadro from 'src/components/TarefaQuadro.vue'

defineOptions({ name: 'ProjetoPage' })

const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const store = useTarefasStore()

const projetoId = route.params.id
const projeto = ref(null)
const filtro = ref(null)
const dialogProjeto = ref(false)
const dialogTarefa = ref(false)
const tarefaEmEdicao = ref(null)

// Visão Lista/Quadro, lembrada no aparelho
const visao = ref($q.localStorage.getItem('visao_projeto') || 'quadro')
watch(visao, v => $q.localStorage.set('visao_projeto', v))

const contagem = computed(() => {
  const c = { a_fazer: 0, fazendo: 0, feito: 0 }
  for (const t of store.tarefas) {
    if (c[t.status] !== undefined) c[t.status]++
  }
  return c
})

const tarefasFiltradas = computed(() =>
  filtro.value ? store.tarefas.filter(t => t.status === filtro.value) : store.tarefas
)

onMounted(async () => {
  try {
    const [p] = await Promise.all([
      store.buscarProjeto(projetoId),
      store.carregarTarefas(projetoId)
    ])
    projeto.value = p
  } catch (erro) {
    $q.notify({ type: 'negative', message: `Erro ao carregar projeto: ${erro.message}` })
    router.push('/')
  }
})

function novaTarefa () {
  tarefaEmEdicao.value = null
  dialogTarefa.value = true
}

function editarTarefa (tarefa) {
  tarefaEmEdicao.value = tarefa
  dialogTarefa.value = true
}

async function mudarStatus (tarefa, status) {
  if (tarefa.status === status) return
  try {
    await store.atualizarTarefa(tarefa.id, { status })
  } catch (erro) {
    $q.notify({ type: 'negative', message: `Erro ao mudar status: ${erro.message}` })
  }
}

function confirmarExclusaoTarefa (tarefa) {
  $q.dialog({
    title: 'Excluir tarefa',
    message: `Excluir "${tarefa.titulo}"?`,
    cancel: { flat: true, label: 'Cancelar' },
    ok: { color: 'negative', label: 'Excluir', unelevated: true }
  }).onOk(async () => {
    try {
      await store.excluirTarefa(tarefa.id)
    } catch (erro) {
      $q.notify({ type: 'negative', message: `Erro ao excluir tarefa: ${erro.message}` })
    }
  })
}

function confirmarExclusaoProjeto () {
  $q.dialog({
    title: 'Excluir projeto',
    message: `Excluir "${projeto.value.nome}" e todas as suas tarefas? Essa ação não pode ser desfeita.`,
    cancel: { flat: true, label: 'Cancelar' },
    ok: { color: 'negative', label: 'Excluir', unelevated: true }
  }).onOk(async () => {
    try {
      await store.excluirProjeto(Number(projetoId))
      router.push('/')
    } catch (erro) {
      $q.notify({ type: 'negative', message: `Erro ao excluir projeto: ${erro.message}` })
    }
  })
}
</script>

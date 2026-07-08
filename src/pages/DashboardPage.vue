<template>
  <q-page padding>
    <div class="q-mx-auto" style="max-width: 1100px">
      <div class="row items-end q-mb-lg anim-1">
        <div>
          <div class="pagina-titulo">Meus projetos</div>
          <div class="pagina-sub">
            {{ store.projetos.length }} projeto{{ store.projetos.length === 1 ? '' : 's' }}
          </div>
        </div>
        <q-space />
        <q-btn
          unelevated
          color="primary"
          icon="add"
          label="Projeto"
          @click="dialogAberto = true"
        />
      </div>

      <div v-if="store.carregando && !store.projetos.length" class="row justify-center q-pa-xl">
        <q-spinner size="40px" color="primary" />
      </div>

      <div v-else-if="!store.projetos.length" class="estado-vazio column items-center q-pa-xl anim-2">
        <q-icon name="folder_open" size="64px" />
        <div class="text-h6 q-mt-md display">Nenhum projeto ainda</div>
        <div class="text-body2">Crie seu primeiro projeto para começar a organizar as tarefas.</div>
      </div>

      <div v-else class="row q-col-gutter-md">
        <div
          v-for="(projeto, i) in store.projetos"
          :key="projeto.id"
          class="col-12 col-sm-6 col-md-4"
          :class="`anim-${Math.min(i + 2, 5)}`"
        >
          <q-card
            flat
            class="projeto-card"
            :style="{ '--cor-projeto': projeto.cor || '#7C6FFF' }"
            @click="abrirProjeto(projeto)"
          >
            <q-card-section>
              <div class="row items-center no-wrap q-gutter-sm">
                <span class="pc-dot" :style="{ backgroundColor: projeto.cor || '#7C6FFF' }" />
                <div class="pc-nome ellipsis">{{ projeto.nome }}</div>
              </div>
              <div class="pc-desc ellipsis-2-lines q-mt-xs">
                {{ projeto.descricao || 'Sem descrição' }}
              </div>
            </q-card-section>

            <q-card-section class="q-pt-none">
              <div class="pc-barra">
                <template v-if="totalTarefas(projeto)">
                  <div
                    v-for="s in LISTA_STATUS"
                    :key="s.valor"
                    :style="{
                      width: (projeto.contagem[s.valor] / totalTarefas(projeto) * 100) + '%',
                      backgroundColor: s.cor
                    }"
                  />
                </template>
              </div>
              <div class="pc-contagens">
                <span v-for="s in LISTA_STATUS" :key="s.valor" class="pc-contagem">
                  <span class="dot" :style="{ backgroundColor: s.cor }" />
                  {{ s.label }} <b>{{ projeto.contagem[s.valor] }}</b>
                </span>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>

    <ProjetoDialog v-model="dialogAberto" />
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { useTarefasStore } from 'src/stores/tarefas'
import { LISTA_STATUS } from 'src/lib/constants'
import ProjetoDialog from 'src/components/ProjetoDialog.vue'

defineOptions({ name: 'DashboardPage' })

const $q = useQuasar()
const router = useRouter()
const store = useTarefasStore()

const dialogAberto = ref(false)

onMounted(async () => {
  try {
    await store.carregarProjetos()
  } catch (erro) {
    $q.notify({ type: 'negative', message: `Erro ao carregar projetos: ${erro.message}` })
  }
})

function totalTarefas (projeto) {
  const c = projeto.contagem
  return c.a_fazer + c.fazendo + c.feito
}

function abrirProjeto (projeto) {
  router.push(`/projetos/${projeto.id}`)
}
</script>

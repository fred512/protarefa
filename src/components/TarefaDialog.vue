<template>
  <q-dialog :model-value="modelValue" @update:model-value="v => emit('update:modelValue', v)">
    <q-card class="dialogo-card" style="width: 90vw; max-width: 460px;">
      <q-card-section>
        <div class="text-h6 display">{{ tarefa ? 'Editar tarefa' : 'Nova tarefa' }}</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-form ref="formRef" class="q-gutter-y-md">
          <q-input
            v-model="titulo"
            label="Título"
            outlined
            autofocus
            :rules="[v => !!v?.trim() || 'Informe o título']"
            @keyup.enter="salvar"
          />
          <q-input
            v-model="descricao"
            label="Descrição / anotações (opcional)"
            outlined
            type="textarea"
            autogrow
          />
        </q-form>

        <!-- Anexos -->
        <div class="q-mt-md">
          <div class="row items-center q-mb-sm">
            <div class="text-caption text-grey-5">Anexos</div>
            <q-space />
            <q-btn
              flat
              dense
              no-caps
              size="sm"
              icon="attach_file"
              label="Anexar arquivo"
              color="primary"
              :loading="enviando"
              @click="abrirSeletor"
            />
            <input
              ref="inputFile"
              type="file"
              accept="image/*,application/pdf"
              multiple
              class="hidden"
              @change="aoEscolher"
            >
          </div>

          <div v-if="listaAnexos.length" class="anexo-lista">
            <div
              v-for="(a, i) in listaAnexos"
              :key="a.id ?? `pend-${i}`"
              class="anexo-item"
            >
              <q-icon :name="iconeAnexo(a.tipo)" size="20px" class="anexo-icone" />
              <div class="col anexo-info">
                <div class="anexo-nome ellipsis">{{ a.nome }}</div>
                <div class="anexo-meta">
                  {{ formatarTamanho(a.tamanho) }}
                  <span v-if="!a.id" class="anexo-pendente">· pendente</span>
                </div>
              </div>
              <q-btn
                v-if="a.id"
                flat
                round
                dense
                size="sm"
                icon="download"
                color="grey-5"
                @click="baixar(a)"
              >
                <q-tooltip>Baixar</q-tooltip>
              </q-btn>
              <q-btn
                flat
                round
                dense
                size="sm"
                icon="close"
                color="grey-5"
                @click="remover(a, i)"
              >
                <q-tooltip>Remover</q-tooltip>
              </q-btn>
            </div>
          </div>
          <div v-else class="anexo-vazio">
            Imagens e PDF, até {{ MAX_ANEXO_MB }} MB cada.
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="Cancelar" v-close-popup />
        <q-btn
          unelevated
          color="primary"
          :label="tarefa ? 'Salvar' : 'Criar'"
          :loading="salvando"
          @click="salvar"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useTarefasStore } from 'src/stores/tarefas'
import {
  MAX_ANEXO_MB, MAX_ANEXO_BYTES, tipoAnexoValido, iconeAnexo, formatarTamanho
} from 'src/lib/constants'

const props = defineProps({
  modelValue: Boolean,
  projetoId: { type: [Number, String], required: true },
  tarefa: { type: Object, default: null }
})
const emit = defineEmits(['update:modelValue'])

const $q = useQuasar()
const store = useTarefasStore()

const formRef = ref(null)
const inputFile = ref(null)
const titulo = ref('')
const descricao = ref('')
const salvando = ref(false)
const enviando = ref(false)

// Anexos já salvos (modo edição) e arquivos escolhidos antes de salvar (modo criação)
const anexos = ref([])
const pendentes = ref([])

// Lista unificada exibida: salvos têm .id; pendentes guardam o File em .file
const listaAnexos = computed(() => [
  ...anexos.value,
  ...pendentes.value.map(p => ({ nome: p.file.name, tamanho: p.file.size, tipo: p.file.type, file: p.file }))
])

watch(() => props.modelValue, async (aberto) => {
  if (!aberto) return
  titulo.value = props.tarefa?.titulo ?? ''
  descricao.value = props.tarefa?.descricao ?? ''
  anexos.value = []
  pendentes.value = []
  if (props.tarefa) {
    try {
      anexos.value = await store.carregarAnexos(props.tarefa.id)
    } catch (erro) {
      $q.notify({ type: 'negative', message: `Erro ao carregar anexos: ${erro.message}` })
    }
  }
})

function abrirSeletor () {
  inputFile.value?.click()
}

async function aoEscolher (evento) {
  const arquivos = [...evento.target.files]
  evento.target.value = '' // permite reescolher o mesmo arquivo

  for (const file of arquivos) {
    if (!tipoAnexoValido(file.type)) {
      $q.notify({ type: 'negative', message: `"${file.name}" não é imagem nem PDF.` })
      continue
    }
    if (file.size > MAX_ANEXO_BYTES) {
      $q.notify({ type: 'negative', message: `"${file.name}" passa de ${MAX_ANEXO_MB} MB.` })
      continue
    }
    if (props.tarefa) {
      // Editando: sobe na hora
      enviando.value = true
      try {
        const salvo = await store.enviarAnexo(props.tarefa.id, file)
        anexos.value.push(salvo)
      } catch (erro) {
        $q.notify({ type: 'negative', message: `Erro ao enviar "${file.name}": ${erro.message}` })
      } finally {
        enviando.value = false
      }
    } else {
      // Criando: guarda para subir depois
      pendentes.value.push({ file })
    }
  }
}

async function baixar (anexo) {
  try {
    const url = await store.linkAnexo(anexo)
    window.open(url, '_blank', 'noopener')
  } catch (erro) {
    $q.notify({ type: 'negative', message: `Erro ao abrir anexo: ${erro.message}` })
  }
}

async function remover (item, indice) {
  if (!item.id) {
    // Pendente: só tira da lista (indice é sobre a lista unificada)
    const posPendente = indice - anexos.value.length
    pendentes.value.splice(posPendente, 1)
    return
  }
  try {
    await store.removerAnexo(item)
    anexos.value = anexos.value.filter(a => a.id !== item.id)
  } catch (erro) {
    $q.notify({ type: 'negative', message: `Erro ao remover anexo: ${erro.message}` })
  }
}

async function salvar () {
  const valido = await formRef.value.validate()
  if (!valido) return

  salvando.value = true
  try {
    const campos = {
      titulo: titulo.value.trim(),
      descricao: descricao.value.trim() || null
    }
    if (props.tarefa) {
      await store.atualizarTarefa(props.tarefa.id, campos)
    } else {
      const nova = await store.criarTarefa({ ...campos, projeto_id: Number(props.projetoId) })
      // Sobe os anexos pendentes na tarefa recém-criada
      for (const p of pendentes.value) {
        try {
          await store.enviarAnexo(nova.id, p.file)
        } catch (erro) {
          $q.notify({ type: 'negative', message: `Erro ao enviar "${p.file.name}": ${erro.message}` })
        }
      }
    }
    emit('update:modelValue', false)
  } catch (erro) {
    $q.notify({ type: 'negative', message: `Erro ao salvar tarefa: ${erro.message}` })
  } finally {
    salvando.value = false
  }
}
</script>

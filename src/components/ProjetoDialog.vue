<template>
  <q-dialog :model-value="modelValue" @update:model-value="v => emit('update:modelValue', v)">
    <q-card class="dialogo-card" style="width: 90vw; max-width: 420px;">
      <q-card-section>
        <div class="text-h6 display">{{ projeto ? 'Editar projeto' : 'Novo projeto' }}</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-form ref="formRef" class="q-gutter-md">
          <q-input
            v-model="nome"
            label="Nome do projeto"
            outlined
            autofocus
            :rules="[v => !!v?.trim() || 'Informe o nome']"
          />
          <q-input
            v-model="descricao"
            label="Descrição (opcional)"
            outlined
            type="textarea"
            autogrow
          />

          <div>
            <div class="text-caption text-grey-5 q-mb-xs">Cor do card</div>
            <div class="row q-gutter-sm">
              <q-btn
                v-for="c in CORES_PROJETO"
                :key="c"
                round
                unelevated
                size="md"
                :style="{ backgroundColor: c }"
                :icon="cor === c ? 'check' : undefined"
                @click="cor = c"
              />
            </div>
          </div>
        </q-form>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="Cancelar" v-close-popup />
        <q-btn
          unelevated
          color="primary"
          :label="projeto ? 'Salvar' : 'Criar'"
          :loading="salvando"
          @click="salvar"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useTarefasStore } from 'src/stores/tarefas'
import { CORES_PROJETO } from 'src/lib/constants'

const props = defineProps({
  modelValue: Boolean,
  projeto: { type: Object, default: null }
})
const emit = defineEmits(['update:modelValue', 'saved'])

const $q = useQuasar()
const store = useTarefasStore()

const formRef = ref(null)
const nome = ref('')
const descricao = ref('')
const cor = ref(CORES_PROJETO[0])
const salvando = ref(false)

watch(() => props.modelValue, (aberto) => {
  if (aberto) {
    nome.value = props.projeto?.nome ?? ''
    descricao.value = props.projeto?.descricao ?? ''
    cor.value = props.projeto?.cor ?? CORES_PROJETO[0]
  }
})

async function salvar () {
  const valido = await formRef.value.validate()
  if (!valido) return

  salvando.value = true
  try {
    const campos = {
      nome: nome.value.trim(),
      descricao: descricao.value.trim() || null,
      cor: cor.value
    }
    const salvo = props.projeto
      ? await store.atualizarProjeto(props.projeto.id, campos)
      : await store.criarProjeto(campos)

    emit('saved', salvo)
    emit('update:modelValue', false)
  } catch (erro) {
    $q.notify({ type: 'negative', message: `Erro ao salvar projeto: ${erro.message}` })
  } finally {
    salvando.value = false
  }
}
</script>

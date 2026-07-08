<template>
  <q-dialog :model-value="modelValue" @update:model-value="v => emit('update:modelValue', v)">
    <q-card class="dialogo-card" style="width: 90vw; max-width: 420px;">
      <q-card-section>
        <div class="text-h6 display">{{ tarefa ? 'Editar tarefa' : 'Nova tarefa' }}</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-form ref="formRef" class="q-gutter-md">
          <q-input
            v-model="titulo"
            label="Título"
            outlined
            autofocus
            :rules="[v => !!v?.trim() || 'Informe o título']"
          />
          <q-input
            v-model="descricao"
            label="Descrição / anotações (opcional)"
            outlined
            type="textarea"
            autogrow
          />
        </q-form>
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
import { ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useTarefasStore } from 'src/stores/tarefas'

const props = defineProps({
  modelValue: Boolean,
  projetoId: { type: [Number, String], required: true },
  tarefa: { type: Object, default: null }
})
const emit = defineEmits(['update:modelValue'])

const $q = useQuasar()
const store = useTarefasStore()

const formRef = ref(null)
const titulo = ref('')
const descricao = ref('')
const salvando = ref(false)

watch(() => props.modelValue, (aberto) => {
  if (aberto) {
    titulo.value = props.tarefa?.titulo ?? ''
    descricao.value = props.tarefa?.descricao ?? ''
  }
})

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
      await store.criarTarefa({ ...campos, projeto_id: Number(props.projetoId) })
    }
    emit('update:modelValue', false)
  } catch (erro) {
    $q.notify({ type: 'negative', message: `Erro ao salvar tarefa: ${erro.message}` })
  } finally {
    salvando.value = false
  }
}
</script>

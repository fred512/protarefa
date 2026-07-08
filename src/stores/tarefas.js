import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from 'src/lib/supabase'

function contarPorStatus (tarefas) {
  const contagem = { a_fazer: 0, fazendo: 0, feito: 0 }
  for (const t of tarefas || []) {
    if (contagem[t.status] !== undefined) contagem[t.status]++
  }
  return contagem
}

export const useTarefasStore = defineStore('tarefas', () => {
  const projetos = ref([])
  const tarefas = ref([])
  const carregando = ref(false)

  // ---- Projetos ----

  async function carregarProjetos () {
    carregando.value = true
    try {
      const { data, error } = await supabase
        .from('projeto')
        .select('id, nome, descricao, cor, created_at, tarefa(status)')
        .order('nome')
      if (error) throw error
      projetos.value = data.map(({ tarefa, ...p }) => ({
        ...p,
        contagem: contarPorStatus(tarefa)
      }))
    } finally {
      carregando.value = false
    }
  }

  async function criarProjeto ({ nome, descricao, cor }) {
    const { data, error } = await supabase
      .from('projeto')
      .insert({ nome, descricao, cor })
      .select()
      .single()
    if (error) throw error
    projetos.value.push({ ...data, contagem: contarPorStatus([]) })
    projetos.value.sort((a, b) => a.nome.localeCompare(b.nome))
    return data
  }

  async function atualizarProjeto (id, campos) {
    const { data, error } = await supabase
      .from('projeto')
      .update(campos)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    const idx = projetos.value.findIndex(p => p.id === id)
    if (idx !== -1) projetos.value[idx] = { ...projetos.value[idx], ...data }
    return data
  }

  async function excluirProjeto (id) {
    const { error } = await supabase.from('projeto').delete().eq('id', id)
    if (error) throw error
    projetos.value = projetos.value.filter(p => p.id !== id)
  }

  async function buscarProjeto (id) {
    const { data, error } = await supabase
      .from('projeto')
      .select()
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  }

  // ---- Tarefas ----

  async function carregarTarefas (projetoId) {
    carregando.value = true
    try {
      const { data, error } = await supabase
        .from('tarefa')
        .select()
        .eq('projeto_id', projetoId)
        .order('created_at', { ascending: false })
      if (error) throw error
      tarefas.value = data
    } finally {
      carregando.value = false
    }
  }

  async function criarTarefa ({ projeto_id, titulo, descricao }) {
    const { data, error } = await supabase
      .from('tarefa')
      .insert({ projeto_id, titulo, descricao })
      .select()
      .single()
    if (error) throw error
    tarefas.value.unshift(data)
    return data
  }

  async function atualizarTarefa (id, campos) {
    const { data, error } = await supabase
      .from('tarefa')
      .update({ ...campos, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    const idx = tarefas.value.findIndex(t => t.id === id)
    if (idx !== -1) tarefas.value[idx] = data
    return data
  }

  async function excluirTarefa (id) {
    const { error } = await supabase.from('tarefa').delete().eq('id', id)
    if (error) throw error
    tarefas.value = tarefas.value.filter(t => t.id !== id)
  }

  return {
    projetos,
    tarefas,
    carregando,
    carregarProjetos,
    criarProjeto,
    atualizarProjeto,
    excluirProjeto,
    buscarProjeto,
    carregarTarefas,
    criarTarefa,
    atualizarTarefa,
    excluirTarefa
  }
})

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
    // Remove arquivos do Storage de todas as tarefas do projeto antes de excluir
    const { data: anexos } = await supabase
      .from('anexo')
      .select('caminho, tarefa!inner(projeto_id)')
      .eq('tarefa.projeto_id', id)
    if (anexos?.length) {
      await supabase.storage.from('anexos').remove(anexos.map(a => a.caminho)).catch(() => {})
    }
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
      let { data, error } = await supabase
        .from('tarefa')
        .select('*, anexo(count)')
        .eq('projeto_id', projetoId)
        .order('created_at', { ascending: false })

      if (error) {
        // Fallback: tabela de anexos ainda não criada — carrega sem contagem
        ;({ data, error } = await supabase
          .from('tarefa')
          .select()
          .eq('projeto_id', projetoId)
          .order('created_at', { ascending: false }))
        if (error) throw error
        tarefas.value = data.map(t => ({ ...t, num_anexos: 0 }))
        return
      }

      tarefas.value = data.map(({ anexo, ...t }) => ({
        ...t,
        num_anexos: anexo?.[0]?.count ?? 0
      }))
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
    tarefas.value.unshift({ ...data, num_anexos: 0 })
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
    if (idx !== -1) tarefas.value[idx] = { ...data, num_anexos: tarefas.value[idx].num_anexos ?? 0 }
    return data
  }

  async function excluirTarefa (id) {
    // Remove os arquivos do Storage antes (o cascade apaga as linhas de anexo)
    const anexos = await carregarAnexos(id).catch(() => [])
    if (anexos.length) {
      await supabase.storage.from('anexos').remove(anexos.map(a => a.caminho)).catch(() => {})
    }
    const { error } = await supabase.from('tarefa').delete().eq('id', id)
    if (error) throw error
    tarefas.value = tarefas.value.filter(t => t.id !== id)
  }

  // ---- Anexos ----

  function ajustarContagemAnexos (tarefaId, delta) {
    const t = tarefas.value.find(t => t.id === tarefaId)
    if (t) t.num_anexos = Math.max(0, (t.num_anexos || 0) + delta)
  }

  function sanitizarNome (nome) {
    // Só o nome legível no caminho; o original fica salvo em anexo.nome
    return nome.replace(/[^A-Za-z0-9._-]+/g, '_')
  }

  async function carregarAnexos (tarefaId) {
    const { data, error } = await supabase
      .from('anexo')
      .select()
      .eq('tarefa_id', tarefaId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return data
  }

  async function enviarAnexo (tarefaId, file) {
    const { data: { user } } = await supabase.auth.getUser()
    const caminho = `${user.id}/${tarefaId}/${crypto.randomUUID()}-${sanitizarNome(file.name)}`

    const { error: erroUpload } = await supabase.storage
      .from('anexos')
      .upload(caminho, file, { contentType: file.type, upsert: false })
    if (erroUpload) throw erroUpload

    const { data, error } = await supabase
      .from('anexo')
      .insert({ tarefa_id: tarefaId, nome: file.name, caminho, tamanho: file.size, tipo: file.type })
      .select()
      .single()
    if (error) {
      // Desfaz o upload se a linha não gravou
      await supabase.storage.from('anexos').remove([caminho]).catch(() => {})
      throw error
    }

    ajustarContagemAnexos(tarefaId, 1)
    return data
  }

  async function removerAnexo (anexo) {
    await supabase.storage.from('anexos').remove([anexo.caminho]).catch(() => {})
    const { error } = await supabase.from('anexo').delete().eq('id', anexo.id)
    if (error) throw error
    ajustarContagemAnexos(anexo.tarefa_id, -1)
  }

  async function linkAnexo (anexo) {
    const { data, error } = await supabase.storage
      .from('anexos')
      .createSignedUrl(anexo.caminho, 60)
    if (error) throw error
    return data.signedUrl
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
    excluirTarefa,
    carregarAnexos,
    enviarAnexo,
    removerAnexo,
    linkAnexo
  }
})

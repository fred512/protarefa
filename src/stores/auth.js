import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from 'src/lib/supabase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)

  async function init () {
    const { data: { session } } = await supabase.auth.getSession()
    user.value = session?.user ?? null

    supabase.auth.onAuthStateChange((_evento, sessao) => {
      user.value = sessao?.user ?? null
    })
  }

  async function login (email, senha) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) throw error
    user.value = data.user
  }

  async function loginGoogle () {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
    if (error) throw error
  }

  async function logout () {
    await supabase.auth.signOut()
    user.value = null
  }

  return { user, init, login, loginGoogle, logout }
})

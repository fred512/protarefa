import { defineBoot } from '#q-app/wrappers'
import { Notify } from 'quasar'
import { supabase } from 'src/lib/supabase'

export default defineBoot(({ router }) => {
  // Erros de OAuth voltam no hash da URL (ex.: "Signups not allowed")
  // e o app redireciona antes de qualquer tela conseguir exibi-los.
  const hash = new URLSearchParams(window.location.hash.slice(1))
  const erro = hash.get('error_description') || hash.get('error')
  if (erro) {
    // Boot roda antes do app montar; Notify só exibe após a montagem
    router.isReady().then(() => {
      Notify.create({
        type: 'negative',
        timeout: 12000,
        message: `Erro no login: ${erro}`
      })
    })
  }

  // Sessão criada via OAuth chega depois do guard da rota inicial;
  // sem isso o usuário fica parado no /login mesmo autenticado.
  supabase.auth.onAuthStateChange((evento) => {
    if (evento === 'SIGNED_IN' && router.currentRoute.value.path === '/login') {
      router.push('/')
    }
  })
})

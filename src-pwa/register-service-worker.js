import { register } from 'register-service-worker'

// O ciclo de vida do service worker do PWA
register(process.env.SERVICE_WORKER_FILE, {
  registrationOptions: { scope: './' },

  ready (/* registration */) {},
  registered (/* registration */) {},
  cached (/* registration */) {},
  updatefound (/* registration */) {},

  updated (/* registration */) {
    // Nova versão disponível — recarrega para atualizar
    window.location.reload()
  },

  offline () {},
  error (/* err */) {}
})

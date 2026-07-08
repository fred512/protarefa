import { defineRouter } from '#q-app/wrappers'
import { createRouter, createMemoryHistory, createWebHistory, createWebHashHistory } from 'vue-router'
import routes from './routes'
import { supabase } from 'src/lib/supabase'

export default defineRouter(function () {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory)

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE)
  })

  // Guard de autenticação: sem sessão só acessa /login
  Router.beforeEach(async (to) => {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session && to.path !== '/login') {
      return '/login'
    }
    if (session && to.path === '/login') {
      return '/'
    }
  })

  return Router
})

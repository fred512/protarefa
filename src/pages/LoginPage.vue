<template>
  <div class="login-bg column flex-center q-pa-md">
    <div class="login-marca q-mb-lg anim-1">
      <div class="login-check q-mb-md">
        <q-icon name="task_alt" size="40px" color="white" />
      </div>
      <div class="login-titulo">
        Pro<span class="destaque">Tarefa</span>
      </div>
      <div class="login-sub q-mt-xs">Suas tarefas, projeto por projeto</div>
    </div>

    <q-card flat class="login-card q-pa-md anim-3">
      <q-card-section>
        <q-form class="q-gutter-y-md" @submit.prevent="entrar">
          <q-input
            v-model="email"
            type="email"
            label="E-mail"
            outlined
            autocomplete="email"
            :rules="[v => !!v || 'Informe o e-mail']"
          >
            <template #prepend><q-icon name="mail" /></template>
          </q-input>

          <q-input
            v-model="senha"
            :type="mostrarSenha ? 'text' : 'password'"
            label="Senha"
            outlined
            autocomplete="current-password"
            :rules="[v => !!v || 'Informe a senha']"
          >
            <template #prepend><q-icon name="lock" /></template>
            <template #append>
              <q-icon
                :name="mostrarSenha ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="mostrarSenha = !mostrarSenha"
              />
            </template>
          </q-input>

          <q-btn
            type="submit"
            color="primary"
            label="Entrar"
            class="full-width"
            size="lg"
            unelevated
            :loading="carregando"
          />
        </q-form>

        <div class="row items-center q-my-md">
          <q-separator class="col" />
          <span class="text-caption text-grey-6 q-px-sm">ou</span>
          <q-separator class="col" />
        </div>

        <q-btn
          outline
          color="grey-4"
          class="full-width"
          size="lg"
          :loading="carregandoGoogle"
          @click="entrarComGoogle"
        >
          <svg width="18" height="18" viewBox="0 0 48 48" class="q-mr-sm">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Entrar com Google
        </q-btn>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'

defineOptions({ name: 'LoginPage' })

const $q = useQuasar()
const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const senha = ref('')
const mostrarSenha = ref(false)
const carregando = ref(false)
const carregandoGoogle = ref(false)

async function entrarComGoogle () {
  carregandoGoogle.value = true
  try {
    await auth.loginGoogle()
    // O Supabase redireciona para o Google; a volta cai no guard já autenticado
  } catch (erro) {
    carregandoGoogle.value = false
    $q.notify({ type: 'negative', message: `Erro no login com Google: ${erro.message}` })
  }
}

async function entrar () {
  carregando.value = true
  try {
    await auth.login(email.value.trim(), senha.value)
    router.push('/')
  } catch (erro) {
    $q.notify({
      type: 'negative',
      message: erro.message === 'Invalid login credentials'
        ? 'E-mail ou senha inválidos'
        : `Erro ao entrar: ${erro.message}`
    })
  } finally {
    carregando.value = false
  }
}
</script>

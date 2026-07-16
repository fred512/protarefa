<template>
  <q-layout view="hHh lpR fFf">
    <q-header class="pt-header">
      <q-toolbar>
        <div class="pt-logo q-mr-sm">
          <q-icon name="task_alt" size="20px" color="white" />
        </div>
        <q-toolbar-title>
          Pro<span class="text-primary">Tarefa</span>
          <span class="pt-versao q-ml-sm">v{{ versao }}</span>
        </q-toolbar-title>

        <q-btn
          flat
          round
          :icon="$q.dark.isActive ? 'light_mode' : 'dark_mode'"
          @click="alternarTema"
        >
          <q-tooltip>Alternar tema</q-tooltip>
        </q-btn>

        <q-btn flat round icon="logout" @click="sair">
          <q-tooltip>Sair</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'
import { version } from '../../package.json'

defineOptions({ name: 'MainLayout' })

const $q = useQuasar()
const router = useRouter()
const auth = useAuthStore()

const versao = version

// Restaura preferência de tema salva
const temaSalvo = $q.localStorage.getItem('tema')
if (temaSalvo) {
  $q.dark.set(temaSalvo === 'escuro')
}

function alternarTema () {
  $q.dark.toggle()
  $q.localStorage.set('tema', $q.dark.isActive ? 'escuro' : 'claro')
}

async function sair () {
  await auth.logout()
  router.push('/login')
}
</script>

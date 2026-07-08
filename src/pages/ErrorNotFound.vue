<template>
  <div class="fullscreen bg-dark text-white text-center q-pa-md flex flex-center">
    <div>
      <div style="font-size: 20vh">404</div>
      <div class="text-h5 text-grey-5" style="opacity: 0.6">Ops. Página não encontrada...</div>
      <q-btn class="q-mt-xl" color="primary" label="Voltar ao início" to="/" unelevated />
    </div>
  </div>
</template>

<script setup>
defineOptions({ name: 'ErrorNotFound' })
</script>

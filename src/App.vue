<template>
  <div id="app">
    <!-- Header/Navigation -->
    <Header v-if="isAuthenticated" :user="currentUser" @logout="handleLogout" />
    <!-- Main Content -->
    <router-view />
  </div>
</template>
<script setup>
  import { computed } from 'vue'
  import { useAuthStore } from '@/stores/auth'
  import Header from './components/Header.vue'

  const authStore = useAuthStore()

  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const currentUser = computed(() => authStore.user)

  const handleLogout = () => {
    authStore.logout()
    $router.push('/login')
  }
</script>

<style scoped>
  #app {
    min-height: 100vh;
  }
</style>
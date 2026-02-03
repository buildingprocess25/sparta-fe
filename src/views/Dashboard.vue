<template>
  <div class="container mx-auto p-6">
    <h1 class="mb-6 text-3xl font-bold text-gray-800">Dashboard Utama</h1>
    <div class="text-gray-600 mb-8">Halo, {{ user?.email }} ({{ userRole }})</div>

    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      <router-link 
        v-for="menu in filteredMenus" 
        :key="menu.path" 
        :to="menu.path"
        class="flex flex-col items-center rounded-lg bg-white p-6 shadow-md transition hover:-translate-y-1 hover:shadow-xl"
      >
        <div class="mb-4 text-4xl">{{ menu.icon }}</div> <h3 class="text-xl font-semibold">{{ menu.title }}</h3>
        <p class="text-center text-sm text-gray-500">{{ menu.desc }}</p>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const user = computed(() => authStore.user)
const userRole = computed(() => authStore.userRole)

// Definisi Menu & Akses Role
const allMenus = [
  { 
    title: 'Gantt Chart', 
    path: '/gantt', 
    desc: 'Monitoring progress proyek', 
    icon: '📊', 
    roles: ['kontraktor', 'pic', 'admin'] 
  },
  { 
    title: 'RAB', 
    path: '/rab', 
    desc: 'Rencana Anggaran Biaya', 
    icon: '💰', 
    roles: ['kontraktor', 'admin'] // PIC biasanya hanya view, sesuaikan
  },
  { 
    title: 'Instruksi Lapangan', 
    path: '/instruksi-lapangan', 
    desc: 'Catatan instruksi kerja', 
    icon: '📝', 
    roles: ['pic', 'admin'] 
  },
  { 
    title: 'Foto Dokumen', 
    path: '/foto-dokumen', 
    desc: 'Upload dokumentasi proyek', 
    icon: '📷', 
    roles: ['kontraktor', 'pic', 'admin'] 
  },
  // Tambahkan menu lainnya...
]

// Filter menu berdasarkan role yang login
const filteredMenus = computed(() => {
  return allMenus.filter(menu => menu.roles.includes(userRole.value) || userRole.value === 'admin')
})
</script>
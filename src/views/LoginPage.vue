<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-100">
    <div class="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
      <div class="mb-6 text-center">
        <h2 class="text-2xl font-bold text-gray-800">Login SPARTA</h2>
        <p class="text-gray-600">Masuk untuk melanjutkan</p>
      </div>
      
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Email</label>
          <input 
            v-model="email" 
            type="email" 
            required 
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
            placeholder="nama@alfamart.co.id"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700">Password</label>
          <input 
            v-model="password" 
            type="password" 
            required 
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div v-if="errorMsg" class="text-sm text-red-500 text-center">
          {{ errorMsg }}
        </div>

        <button 
          type="submit" 
          :disabled="loading"
          class="w-full rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
        >
          {{ loading ? 'Memproses...' : 'Masuk' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

const handleLogin = async () => {
  loading.value = true
  errorMsg.value = ''
  
  try {
    await authStore.login({ email: email.value, password: password.value })
    router.push('/dashboard')
  } catch (err) {
    errorMsg.value = 'Login gagal. Periksa email dan password.'
  } finally {
    loading.value = false
  }
}
</script>
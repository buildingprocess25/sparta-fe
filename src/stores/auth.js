import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiCall, API_ENDPOINTS } from '@/utils/api'
import router from '@/router'

export const useAuthStore = defineStore('auth', () => {
    // State
    const user = ref(JSON.parse(sessionStorage.getItem('user')) || null)
    const token = ref(sessionStorage.getItem('authToken') || null)

    // Getters
    const isAuthenticated = computed(() => !!token.value)
    const userRole = computed(() => user.value?.role || '')

    // Actions
    async function login(credentials) {
        try {
            // Sesuaikan endpoint ini dengan backend Python Anda
            const response = await apiCall('POST', API_ENDPOINTS.AUTH_LOGIN, credentials)
            
            // Asumsi response backend: { token: '...', user: { email: '...', role: '...' } }
            token.value = response.token
            user.value = response.user

            // Simpan ke Session Storage agar tahan refresh
            sessionStorage.setItem('authToken', response.token)
            sessionStorage.setItem('user', JSON.stringify(response.user))

            return true
        } catch (error) {
            console.error('Login failed:', error)
            throw error
        }
    }

    function logout() {
        token.value = null
        user.value = null
        sessionStorage.clear()
        router.push('/login')
    }

    return { user, token, isAuthenticated, userRole, login, logout }
})
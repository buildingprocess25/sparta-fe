import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiCall } from '@/utils/api'

export const useAuthStore = defineStore('auth', () => {
  // State
    const user = ref(null)
    const isAuthenticated = ref(false)
    const loading = ref(false)
    const error = ref(null)
    // Computed
    const userRole = computed(() => user.value?.role || null)
    const userCabang = computed(() => user.value?.cabang || null)
    // Actions
    const login = async (username, password) => {
        loading.value = true
        error.value = null
        try {
        const response = await apiCall('POST', '/auth/login', {
            username,
            password
        })
        user.value = response.user
        isAuthenticated.value = true
        // Simpan ke sessionStorage
        sessionStorage.setItem('user', JSON.stringify(response.user))
        sessionStorage.setItem('loggedInUserEmail', response.user.email)
        sessionStorage.setItem('loggedInUserCabang', response.user.cabang)
        sessionStorage.setItem('authenticated', 'true')
        return response
        } catch (err) {
        error.value = err.message
        throw err
        } finally {
        loading.value = false
        }
    }
    const logout = () => {
        user.value = null
        isAuthenticated.value = false
        sessionStorage.clear()
    }
    const initAuth = () => {
        const savedUser = sessionStorage.getItem('user')
        if (savedUser) {
        try {
            user.value = JSON.parse(savedUser)
            isAuthenticated.value = true
        } catch {
            sessionStorage.clear()
        }
        }
    }

    return {
        user,
        isAuthenticated,
        loading,
        error,
        userRole,
        userCabang,
        login,
        logout,
        initAuth
    }
})
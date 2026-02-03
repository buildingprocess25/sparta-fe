const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://sparta-backend-5hdj.onrender.com'

export const apiCall = async (method, endpoint, data = null) => {
    const options = {
        method,
        headers: {
        'Content-Type': 'application/json'
        }
    }
    // Add auth token if available
    const token = sessionStorage.getItem('authToken')
    if (token) {
        options.headers.Authorization = `Bearer ${token}`
    }
    if (data) {
        options.body = JSON.stringify(data)
    }
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options)
    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'API Error')
    }
    return response.json()
    }
    // Export API constants
    export const API_ENDPOINTS = {
    AUTH_LOGIN: '/auth/login',
    AUTH_LOGOUT: '/auth/logout',
    DOCUMENTS_GET: '/documents',
    DOCUMENTS_UPDATE: (id) => `/documents/${id}`,
    SPK_GET: '/spk',
    SPK_CREATE: '/spk',
    // ... add more endpoints as needed
}
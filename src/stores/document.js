import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiCall } from '@/utils/api'

export const useDocumentStore = defineStore('document', () => {
    const documents = ref([])
    const loading = ref(false)
    const error = ref(null)
    const fetchDocuments = async (cabang) => {
        loading.value = true
        error.value = null
        try {
        const response = await apiCall('GET', `/documents?cabang=${cabang}`)
        documents.value = response.documents
        } catch (err) {
        error.value = err.message
        } finally {
        loading.value = false
        }
    }
    const updateDocument = async (id, data) => {
        try {
        await apiCall('PUT', `/documents/${id}`, data)
        // Update local state
        const index = documents.value.findIndex(d => d.id === id)
        if (index > -1) {
            documents.value[index] = { ...documents.value[index], ...data }
        }
        } catch (err) {
        error.value = err.message
        throw err
        }
    }
    return {
        documents,
        loading,
        error,
        fetchDocuments,
        updateDocument
    }
})
<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import Header from '@/components/Header.vue' // Pastikan punya komponen Header atau sesuaikan
import jsPDF from 'jspdf'
import 'jspdf-autotable'

// --- KONFIGURASI ---
const API_BASE_URL = "https://sparta-backend-5hdj.onrender.com" // Sesuaikan jika ada di .env
const authStore = useAuthStore()

const UPLOAD_CATEGORIES = [
  { key: "fotoExisting", label: "Foto Toko Existing" },
  { key: "fotoRenovasi", label: "Foto Proses Renovasi" },
  { key: "me", label: "Gambar ME" },
  { key: "sipil", label: "Gambar Sipil" },
  { key: "sketsaAwal", label: "Sketsa Awal (Layout)" },
  { key: "spk", label: "Dokumen SPK" },
  { key: "rab", label: "Dokumen RAB & Penawaran" },
  { key: "instruksiLapangan", label: "Instruksi Lapangan" },
  { key: "pengawasan", label: "Berkas Pengawasan" },
  { key: "aanwijzing", label: "Aanwijzing" },
  { key: "kerjaTambahKurang", label: "Kerja Tambah Kurang" },
  { key: "pendukung", label: "Dokumen Pendukung (NIDI, SLO, dll)" },
]

// --- STATE ---
const viewMode = ref('table') // 'table' | 'form'
const documents = ref([])
const filteredDocuments = ref([])
const isLoading = ref(false)
const searchQuery = ref('')
const filterCabang = ref('')
const filterStatus = ref('')
const isEditing = ref(false)
const currentEditId = ref(null)

// Form Data
const formData = reactive({
  kodeToko: '',
  namaToko: '',
  luasSales: '',
  luasParkir: '',
  luasGudang: '',
  luasBangunanLantai1: '',
  luasBangunanLantai2: '',
  luasBangunanLantai3: '',
  totalLuasBangunan: '',
  luasAreaTerbuka: '',
  tinggiPlafon: ''
})

// File Handling
const newFilesBuffer = reactive({}) 
const deletedFilesList = ref([])
const existingFiles = ref([]) // Untuk menyimpan link file dari backend saat edit

// Pagination
const currentPage = ref(1)
const itemsPerPage = 10

// --- COMPUTED ---
const totalPages = computed(() => Math.ceil(filteredDocuments.value.length / itemsPerPage))
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredDocuments.value.slice(start, start + itemsPerPage)
})
const isHeadOffice = computed(() => authStore.user?.role === 'HEAD OFFICE' || authStore.user?.cabang === 'HEAD OFFICE')

// --- LIFECYCLE ---
onMounted(() => {
  // Inisialisasi buffer file
  UPLOAD_CATEGORIES.forEach(cat => newFilesBuffer[cat.key] = [])
  fetchDocuments()
})

// --- METHODS: DATA FETCHING ---
const fetchDocuments = async () => {
  isLoading.value = true
  try {
    let url = `${API_BASE_URL}/api/doc/list`
    if (authStore.user?.cabang && !isHeadOffice.value) {
      url += `?cabang=${encodeURIComponent(authStore.user.cabang)}`
    }
    
    const res = await fetch(url)
    const data = await res.json()
    
    // Normalisasi data (handle struktur beda dari backend)
    const rawItems = Array.isArray(data) ? data : (data.items || data.data || [])
    documents.value = rawItems
    handleSearch() // Apply filter awal
  } catch (err) {
    alert("Gagal memuat data: " + err.message)
  } finally {
    isLoading.value = false
  }
}

// --- METHODS: SEARCH & FILTER ---
const handleSearch = () => {
  const term = searchQuery.value.toLowerCase()
  
  filteredDocuments.value = documents.value.filter(doc => {
    const kode = (doc.kode_toko || "").toString().toLowerCase()
    const nama = (doc.nama_toko || "").toString().toLowerCase()
    const cabang = (doc.cabang || "").toString()
    
    const matchText = kode.includes(term) || nama.includes(term)
    const matchCabang = filterCabang.value === "" || cabang === filterCabang.value
    
    // Status Logic
    let matchStatus = true
    const statusCheck = checkCompleteness(doc.file_links)
    if (filterStatus.value === 'complete') matchStatus = statusCheck.complete
    if (filterStatus.value === 'incomplete') matchStatus = !statusCheck.complete
    
    return matchText && matchCabang && matchStatus
  }).reverse()
  
  currentPage.value = 1
}

const checkCompleteness = (fileLinks) => {
    const mandatory = UPLOAD_CATEGORIES.map(c => c.key)
    if (!fileLinks) return { complete: false, missing: mandatory }
    
    const uploadedLower = fileLinks.toLowerCase()
    const missing = mandatory.filter(key => !uploadedLower.includes(key.toLowerCase()))
    
    return {
        complete: missing.length === 0,
        missingCount: missing.length,
        missingList: missing
    }
}

// --- METHODS: FORM HANDLING ---
const showForm = (doc = null) => {
  resetForm()
  viewMode.value = 'form'
  
  if (doc) {
    isEditing.value = true
    currentEditId.value = doc._id || doc.id || doc.kode_toko
    
    // Populate Form
    formData.kodeToko = doc.kode_toko
    formData.namaToko = doc.nama_toko
    formData.luasSales = doc.luas_sales
    formData.luasParkir = doc.luas_parkir
    formData.luasGudang = doc.luas_gudang
    formData.luasBangunanLantai1 = doc.luas_bangunan_lantai_1
    formData.luasBangunanLantai2 = doc.luas_bangunan_lantai_2
    formData.luasBangunanLantai3 = doc.luas_bangunan_lantai_3
    formData.totalLuasBangunan = doc.total_luas_bangunan
    formData.luasAreaTerbuka = doc.luas_area_terbuka
    formData.tinggiPlafon = doc.tinggi_plafon

    // Parse Existing Files
    if (doc.file_links) {
        existingFiles.value = doc.file_links.split(",").map(s => s.trim()).filter(Boolean).map(entry => {
            const parts = entry.split("|")
            if (parts.length === 3) return { category: parts[0].trim(), name: parts[1].trim(), url: parts[2].trim() }
            if (parts.length === 2) return { category: 'pendukung', name: parts[0].trim(), url: parts[1].trim() }
            return { category: 'pendukung', name: 'File', url: entry.trim() }
        })
    }
  }
}

const resetForm = () => {
  isEditing.value = false
  currentEditId.value = null
  Object.keys(formData).forEach(k => formData[k] = '')
  UPLOAD_CATEGORIES.forEach(cat => newFilesBuffer[cat.key] = [])
  deletedFilesList.value = []
  existingFiles.value = []
}

const autoCalculateTotal = () => {
    const l1 = parseFloat(formData.luasBangunanLantai1?.replace(',', '.') || 0)
    const l2 = parseFloat(formData.luasBangunanLantai2?.replace(',', '.') || 0)
    const l3 = parseFloat(formData.luasBangunanLantai3?.replace(',', '.') || 0)
    formData.totalLuasBangunan = (l1 + l2 + l3).toFixed(2).replace('.', ',')
}

// Watchers untuk kalkulasi otomatis
watch(() => [formData.luasBangunanLantai1, formData.luasBangunanLantai2, formData.luasBangunanLantai3], autoCalculateTotal)

// --- METHODS: FILE UPLOAD ---
const handleFileSelect = (event, categoryKey) => {
    const files = Array.from(event.target.files)
    files.forEach(file => {
        // Cek duplikasi
        if (!newFilesBuffer[categoryKey].some(f => f.name === file.name)) {
            newFilesBuffer[categoryKey].push(file)
        }
    })
    event.target.value = '' // Reset input
}

const removeNewFile = (categoryKey, index) => {
    newFilesBuffer[categoryKey].splice(index, 1)
}

const markExistingForDeletion = (file, index) => {
    if(confirm(`Hapus file "${file.name}"?`)) {
        deletedFilesList.value.push({ ...file, deleted: true })
        existingFiles.value.splice(index, 1) // Hapus dari UI
    }
}

// --- METHODS: SUBMIT ---
const submitForm = async () => {
    isLoading.value = true
    try {
        const payload = {
            ...formData, // Spread semua field form
            kode_toko: formData.kodeToko, // Mapping ke snake_case backend
            nama_toko: formData.namaToko,
            luas_sales: formData.luasSales,
            luas_parkir: formData.luasParkir,
            luas_gudang: formData.luasGudang,
            luas_bangunan_lantai_1: formData.luasBangunanLantai1,
            luas_bangunan_lantai_2: formData.luasBangunanLantai2,
            luas_bangunan_lantai_3: formData.luasBangunanLantai3,
            total_luas_bangunan: formData.totalLuasBangunan,
            luas_area_terbuka: formData.luasAreaTerbuka,
            tinggi_plafon: formData.tinggiPlafon,
            
            cabang: authStore.user?.cabang || "",
            email: authStore.user?.email || "",
            pic_name: authStore.user?.email || "",
            files: []
        }

        // 1. Tambahkan file yang dihapus
        deletedFilesList.value.forEach(f => payload.files.push({ category: f.category, filename: f.name, deleted: true, url: f.url }))

        // 2. Convert File Baru ke Base64
        const filePromises = []
        UPLOAD_CATEGORIES.forEach(cat => {
            newFilesBuffer[cat.key].forEach(file => {
                const p = new Promise((resolve, reject) => {
                    const reader = new FileReader()
                    reader.onload = () => resolve({
                        category: cat.key,
                        filename: file.name,
                        type: file.type,
                        data: reader.result
                    })
                    reader.onerror = reject
                    reader.readAsDataURL(file)
                })
                filePromises.push(p)
            })
        })

        const newFilesData = await Promise.all(filePromises)
        payload.files = [...payload.files, ...newFilesData]

        // 3. Kirim API
        let url = `${API_BASE_URL}/api/doc/save`
        let method = 'POST'
        if (isEditing.value && currentEditId.value) {
            url = `${API_BASE_URL}/api/doc/update/${currentEditId.value}`
            method = 'PUT'
        }

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        
        const result = await res.json()
        if (!res.ok) throw new Error(result.message || "Gagal menyimpan")

        alert("Berhasil menyimpan data!")
        viewMode.value = 'table'
        fetchDocuments()

    } catch (err) {
        alert("Error: " + err.message)
    } finally {
        isLoading.value = false
    }
}

const deleteDocument = async (kodeToko) => {
    if(!confirm(`Hapus data toko ${kodeToko}?`)) return
    isLoading.value = true
    try {
        const res = await fetch(`${API_BASE_URL}/api/doc/delete/${encodeURIComponent(kodeToko)}`, { method: 'DELETE' })
        if(!res.ok) throw new Error("Gagal menghapus")
        alert("Terhapus")
        fetchDocuments()
    } catch(e) {
        alert(e.message)
    } finally {
        isLoading.value = false
    }
}

// --- EXPORT PDF ---
const exportPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4')
    const rows = filteredDocuments.value.map((d, i) => {
        const status = checkCompleteness(d.file_links)
        return [
            i + 1,
            d.kode_toko,
            d.nama_toko,
            d.cabang,
            status.complete ? "Lengkap" : "Belum",
            status.complete ? "-" : status.missingList.join(", "),
            d.timestamp || "-"
        ]
    })

    doc.text("Laporan Dokumen Toko", 14, 15)
    doc.autoTable({
        startY: 20,
        head: [['No', 'Kode', 'Nama', 'Cabang', 'Status', 'Kekurangan', 'Update']],
        body: rows,
    })
    doc.save(`Laporan_Dokumen_${new Date().toISOString().slice(0,10)}.pdf`)
}
</script>

<template>
  <div class="p-6 bg-gray-50 min-h-screen">
    <div class="mb-6 flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Penyimpanan Dokumen Toko</h1>
        <p class="text-gray-600">Kelola berkas digital toko dan monitoring kelengkapan.</p>
      </div>
      <router-link to="/dashboard" class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
        Kembali ke Dashboard
      </router-link>
    </div>

    <div v-if="isLoading" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 text-white">
        <div class="text-xl font-semibold">Memuat...</div>
    </div>

    <div v-if="viewMode === 'table'" class="bg-white rounded-lg shadow p-6">
      <div class="flex flex-col md:flex-row gap-4 mb-6">
        <input 
          v-model="searchQuery" 
          @input="handleSearch" 
          placeholder="Cari Kode / Nama Toko..." 
          class="flex-1 p-2 border rounded"
        >
        <select v-model="filterStatus" @change="handleSearch" class="p-2 border rounded">
          <option value="">Semua Status</option>
          <option value="incomplete">Belum Lengkap</option>
          <option value="complete">Sudah Lengkap</option>
        </select>
        
        <div class="flex gap-2">
            <button @click="showForm()" v-if="!isHeadOffice" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                + Tambah
            </button>
            <button @click="exportPDF" class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                PDF
            </button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-100 text-gray-700">
              <th class="p-3 border-b">No</th>
              <th class="p-3 border-b">Kode</th>
              <th class="p-3 border-b">Nama Toko</th>
              <th class="p-3 border-b">Cabang</th>
              <th class="p-3 border-b">Status</th>
              <th class="p-3 border-b">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="paginatedData.length === 0">
                <td colspan="6" class="p-6 text-center text-gray-500">Tidak ada data.</td>
            </tr>
            <tr v-for="(doc, index) in paginatedData" :key="doc._id" class="hover:bg-gray-50 border-b">
              <td class="p-3">{{ (currentPage - 1) * itemsPerPage + index + 1 }}</td>
              <td class="p-3 font-medium">{{ doc.kode_toko }}</td>
              <td class="p-3">{{ doc.nama_toko }}</td>
              <td class="p-3">{{ doc.cabang }}</td>
              <td class="p-3">
                <span v-if="checkCompleteness(doc.file_links).complete" class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Lengkap</span>
                <span v-else class="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                    Kurang {{ checkCompleteness(doc.file_links).missingCount }}
                </span>
              </td>
              <td class="p-3 flex gap-2">
                <button @click="showForm(doc)" class="text-blue-600 hover:underline">Detail</button>
                <button v-if="!isHeadOffice" @click="deleteDocument(doc.kode_toko)" class="text-red-600 hover:underline">Hapus</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-4 flex justify-between items-center text-sm text-gray-600">
        <span>Halaman {{ currentPage }} dari {{ totalPages || 1 }}</span>
        <div class="flex gap-2">
            <button :disabled="currentPage === 1" @click="currentPage--" class="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
            <button :disabled="currentPage === totalPages" @click="currentPage++" class="px-3 py-1 border rounded disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>

    <div v-if="viewMode === 'form'" class="bg-white rounded-lg shadow p-6 max-w-4xl mx-auto">
        <button @click="viewMode = 'table'" class="mb-4 text-gray-500 hover:text-gray-800">← Kembali</button>
        <h2 class="text-xl font-bold mb-6 border-b pb-2">{{ isEditing ? 'Edit Data Toko' : 'Tambah Toko Baru' }}</h2>

        <form @submit.prevent="submitForm" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium mb-1">Kode Toko</label>
                    <input v-model="formData.kodeToko" :disabled="isEditing && !isHeadOffice" class="w-full p-2 border rounded bg-gray-50" required>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Nama Toko</label>
                    <input v-model="formData.namaToko" class="w-full p-2 border rounded" required>
                </div>
                <div v-for="field in ['luasSales', 'luasParkir', 'luasGudang', 'luasAreaTerbuka', 'tinggiPlafon']" :key="field">
                    <label class="block text-sm font-medium mb-1 capitalize">{{ field.replace(/([A-Z])/g, ' $1') }}</label>
                    <input v-model="formData[field]" class="w-full p-2 border rounded" placeholder="0,00">
                </div>
            </div>

            <div class="bg-blue-50 p-4 rounded-md">
                <h3 class="font-semibold text-blue-800 mb-3">Detail Bangunan</h3>
                <div class="grid grid-cols-3 gap-4">
                    <input v-model="formData.luasBangunanLantai1" placeholder="Lantai 1" class="p-2 border rounded">
                    <input v-model="formData.luasBangunanLantai2" placeholder="Lantai 2" class="p-2 border rounded">
                    <input v-model="formData.luasBangunanLantai3" placeholder="Lantai 3" class="p-2 border rounded">
                </div>
                <div class="mt-3 flex items-center gap-2">
                    <span class="font-medium">Total:</span>
                    <input v-model="formData.totalLuasBangunan" readonly class="bg-gray-200 p-2 rounded w-32 font-bold">
                </div>
            </div>

            <div class="border-t pt-6">
                <h3 class="text-lg font-bold mb-4">Upload Dokumen</h3>
                
                <div v-for="cat in UPLOAD_CATEGORIES" :key="cat.key" class="mb-6 p-4 border rounded-lg bg-gray-50">
                    <div class="font-semibold mb-2">{{ cat.label }}</div>
                    
                    <div v-if="existingFiles.filter(f => f.category === cat.key).length > 0" class="mb-3 space-y-2">
                        <div v-for="(file, idx) in existingFiles.filter(f => f.category === cat.key)" :key="idx" class="flex items-center justify-between bg-white p-2 rounded border">
                            <a :href="file.url" target="_blank" class="text-blue-600 text-sm hover:underline truncate max-w-[200px]">{{ file.name }}</a>
                            <button type="button" @click="markExistingForDeletion(file, existingFiles.indexOf(file))" class="text-red-500 text-xs">Hapus</button>
                        </div>
                    </div>

                    <input type="file" multiple @change="(e) => handleFileSelect(e, cat.key)" class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                    
                    <div class="mt-2 flex flex-wrap gap-2">
                        <div v-for="(file, idx) in newFilesBuffer[cat.key]" :key="idx" class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center gap-2">
                            {{ file.name }}
                            <button type="button" @click="removeNewFile(cat.key, idx)" class="hover:text-red-600">&times;</button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex justify-end pt-4 border-t">
                <button type="button" @click="viewMode='table'" class="mr-4 px-6 py-2 text-gray-600 hover:text-gray-800">Batal</button>
                <button type="submit" :disabled="isLoading" class="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                    {{ isLoading ? 'Menyimpan...' : 'Simpan Data' }}
                </button>
            </div>
        </form>
    </div>
  </div>
</template>

<style scoped>
/* Styling tambahan minimal karena sudah pakai Tailwind utility classes di template */
</style>
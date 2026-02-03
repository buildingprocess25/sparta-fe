<template>
    <div class="landing">
        <header class="main-header">
        <img src="@/assets/Alfamart-Emblem.png" alt="Alfamart Logo" class="header-logo" />
        <h1>SPARTA</h1>
        <img src="@/assets/Building-Logo.png" alt="Building & Maintenance Logo" class="building-logo" />
        </header>
        <main class="container">
        <div class="welcome-message">
            <h2>System for Property Administration, Reporting, Tracking & Approval</h2>
            <p>Silakan pilih menu di bawah ini untuk mengakses SPARTA</p>
        </div>
        <nav class="menu-container">
            <!-- Login Card -->
            <router-link to="/login" class="menu-item">
            <div class="card-icons">
                <img src="@/assets/worker.png" alt="Kontraktor" title="Kontraktor" />
                <img src="@/assets/scientist.png" alt="SAT/PIC" title="SAT/PIC" />
            </div>
            <h3>Dashboard</h3>
            <p>Login Dashboard SPARTA</p>
            </router-link>
            <!-- User Manual Card -->
            <a href="#" class="menu-item" @click.prevent="showAlert('User Manual belum tersedia')">
            <img src="@/assets/book.png" alt="User Manual" />
            <h3>User Manual</h3>
            <p>Panduan penggunaan sistem & alur kerja</p>
            </a>
            <!-- About Card -->
            <a href="#" class="menu-item" @click.prevent="showAlert('Halaman Tentang SPARTA belum tersedia')">
            <img src="@/assets/about.png" alt="Tentang SPARTA" />
            <h3>Tentang SPARTA</h3>
            <p>Informasi versi dan pengembang aplikasi</p>
            </a>
        </nav>
        </main>
    </div>
</template>

<script setup>
const showAlert = (message) => {
  alert(message)
}
</script>

<style scoped>
.landing {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.main-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
  background-color: #fff;
  border-bottom: 1px solid #e0e0e0;
}

.header-logo, .building-logo {
  height: 50px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.welcome-message {
  text-align: center;
  margin-bottom: 3rem;
}

.welcome-message h2 {
  font-size: 1.75rem;
  margin-bottom: 0.5rem;
}

.menu-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.menu-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  background-color: #fff;
  border-radius: 8px;
  text-decoration: none;
  color: inherit;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.menu-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.card-icons {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.menu-item img {
  max-height: 60px;
}

.menu-item h3 {
  margin: 1rem 0 0.5rem 0;
  font-size: 1.25rem;
}

.menu-item p {
  color: #666;
  text-align: center;
}
</style>
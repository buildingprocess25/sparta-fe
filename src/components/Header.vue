<script setup>
// Script setup kosong tidak masalah, yang penting ada tag <template>
</script>

<template>
  <header class="main-header">
    <img src="./assets/Alfamart-Emblem.png" alt="Alfamart Logo" class="header-logo"/>
    <h1>SPARTA</h1>
    <img src="./assets/Building-Logo.png" alt="Building & Maintenance Logo" class="building-logo"/>
  </header>
</template>

<style scoped>
/* Style diambil dan disesuaikan dari style.css Vanilla JS sebelumnya */
.main-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  color: white;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  width: 100%;
}

.header-logo, .building-logo {
  height: 60px; /* Disesuaikan agar tidak terlalu besar di Vue layout */
  width: auto;
  transition: transform 0.3s ease;
}

.header-logo {
  margin-right: 1rem;
}

.building-logo {
  margin-left: 1rem;
}

.main-header h1 {
  font-size: 1.8rem;
  font-weight: 700;
  color: white;
  text-align: center;
  margin: 0;
  font-family: 'Inter', sans-serif;
}

/* Responsive adjustment */
@media (max-width: 600px) {
  .main-header {
    flex-direction: column;
    text-align: center;
  }
  
  .header-logo, .building-logo {
    margin: 0.5rem 0;
    height: 40px;
  }
  
  .main-header h1 {
    font-size: 1.5rem;
    margin: 0.5rem 0;
  }
}
</style>
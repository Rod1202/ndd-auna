<template>
  <v-app class="app-shell">
    <header class="topbar">
      <div class="topbar__brand">
        <img
          class="brand-logo"
          src="/logoMT.avif"
          alt="Mision Tecnologica"
        >
      </div>

      <div />
    </header>

    <aside class="sidebar">
      <div class="sidebar__section">
        <nav class="sidebar__nav">
          <RouterLink class="sidebar__link" to="/">
            <v-icon icon="mdi-view-dashboard-outline" />
            Dashboard
          </RouterLink>
          <RouterLink class="sidebar__link" to="/upload">
            <v-icon icon="mdi-cloud-upload-outline" />
            Carga CSV
          </RouterLink>
          <RouterLink class="sidebar__link" to="/impresoras">
            <v-icon icon="mdi-printer-outline" />
            Impresoras
          </RouterLink>
          <RouterLink class="sidebar__link" to="/usuarios">
            <v-icon icon="mdi-account-group-outline" />
            Usuarios
          </RouterLink>
          <RouterLink class="sidebar__link" to="/sedes">
            <v-icon icon="mdi-domain" />
            Sedes
          </RouterLink>
        </nav>
      </div>

      <div class="sidebar__footer">
        <div class="system-status">
          <v-icon icon="mdi-cloud-check-outline" color="#10b981" />
          Power by : Rodrigo Carbonel
        </div>
      </div>
    </aside>

    <v-main class="main-shell">
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup>
</script>

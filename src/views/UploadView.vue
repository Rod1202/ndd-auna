<template>
  <section class="upload-shell">
    <div class="page-header">
      <div>
        <h1 class="page-title">Carga de CSV</h1>
        <p class="page-subtitle">Sube archivos NDD para procesar, normalizar e insertar en Supabase.</p>
      </div>
    </div>

    <section class="dashboard-card">
      <div class="dashboard-card__inner">
        <div class="card-header">
          <div>
            <h3 class="card-title">Nuevo archivo de impresion</h3>
            <p class="card-subtitle">Formato esperado: CSV separado por punto y coma.</p>
          </div>
          <span class="status-chip">NDD CSV</span>
        </div>

        <div class="upload-dropzone">
          <v-file-input
            v-model="file"
            label="Selecciona archivo CSV"
            accept=".csv"
            clearable
            prepend-icon="mdi-paperclip"
            variant="underlined"
            density="comfortable"
          />

          <div class="page-actions mt-6">
            <button
              class="primary-button"
              type="button"
              :disabled="!file || loading"
              @click="handleUpload"
            >
              <v-icon icon="mdi-cloud-upload-outline" size="18" />
              {{ loading ? 'Procesando...' : 'Subir archivo' }}
            </button>
            <button
              class="soft-button"
              type="button"
              :disabled="loading"
              @click="file = null"
            >
              <v-icon icon="mdi-close-circle-outline" size="18" />
              Limpiar
            </button>
          </div>

          <div v-if="status" class="upload-status">
            <v-icon
              :icon="statusIcon"
              :color="statusColor"
              size="20"
            />
            <span>{{ status }}</span>
          </div>

          <v-progress-linear
            v-if="loading"
            :model-value="progress"
            height="8"
            class="mt-5"
            color="primary"
            rounded
            striped
          />

          <div v-if="total" class="upload-metrics">
            <div>
              <span>Registros procesados</span>
              <strong>{{ Number(total).toLocaleString('es-PE') }}</strong>
            </div>
            <div>
              <span>Estado</span>
              <strong>{{ status }}</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useUpload } from '../composables/useUpload'

const file = ref(null)

const { upload, loading, progress, status, total } = useUpload()

const statusIcon = computed(() => {
  if (status.value?.toLowerCase().includes('error')) return 'mdi-alert-circle-outline'
  if (status.value?.toLowerCase().includes('completado')) return 'mdi-check-circle-outline'
  return 'mdi-progress-upload'
})

const statusColor = computed(() => {
  if (status.value?.toLowerCase().includes('error')) return '#e11d48'
  if (status.value?.toLowerCase().includes('completado')) return '#10b981'
  return '#0050cb'
})

const handleUpload = () => {
  if (file.value) {
    upload(Array.isArray(file.value) ? file.value[0] : file.value)
  }
}
</script>

<style scoped>
.upload-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 22px;
}

.upload-metrics div {
  padding: 16px;
  border-radius: 10px;
  background: #f8fafc;
}

.upload-metrics span {
  display: block;
  color: #64748b;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.upload-metrics strong {
  display: block;
  margin-top: 4px;
  color: #1a1c1c;
  font-size: 18px;
}
</style>

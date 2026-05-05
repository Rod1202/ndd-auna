<template>
  <section class="dashboard-card">
    <div class="dashboard-card__inner">
      <div class="card-header">
        <div>
          <h3 class="card-title">Top usuarios por volumen</h3>
          <p class="card-subtitle">Consumo de paginas por usuario.</p>
        </div>
      </div>

      <div v-if="items.length" class="ranking-list">
        <div
          v-for="item in items"
          :key="item.logon_nombre"
          class="ranking-row"
        >
          <div class="ranking-row__meta">
            <span>{{ item.logon_nombre || 'Sin usuario' }}</span>
            <strong>{{ formatNumber(item.total_paginas) }} paginas</strong>
          </div>
          <div class="ranking-row__track">
            <div class="ranking-row__bar ranking-row__bar--blue" :style="{ width: `${item.percent}%` }" />
          </div>
        </div>
      </div>

      <div v-else class="empty-state">No hay usuarios para mostrar.</div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ data: Array })

const formatNumber = (value) => Number(value || 0).toLocaleString('es-PE')

const items = computed(() => {
  const rows = props.data || []
  const max = Math.max(...rows.map((row) => Number(row.total_paginas || 0)), 1)

  return rows.slice(0, 5).map((row) => ({
    ...row,
    percent: Math.max((Number(row.total_paginas || 0) / max) * 100, 6)
  }))
})
</script>

<style scoped>
.ranking-list {
  display: grid;
  gap: 20px;
}

.ranking-row {
  display: grid;
  gap: 8px;
}

.ranking-row__meta {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  color: #334155;
  font-size: 12px;
  font-weight: 700;
}

.ranking-row__meta strong {
  color: #94a3b8;
  font-weight: 800;
  white-space: nowrap;
}

.ranking-row__track {
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: #f8fafc;
}

.ranking-row__bar {
  height: 100%;
  border-radius: inherit;
}

.ranking-row__bar--blue {
  background: var(--primary);
}
</style>

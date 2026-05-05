<template>
  <section class="dashboard-card">
    <div class="dashboard-card__inner">
      <div class="card-header">
        <div>
          <h3 class="card-title">{{ title }}</h3>
          <p class="card-subtitle">{{ subtitle }}</p>
        </div>
      </div>

      <div v-if="items.length" class="distribution-list">
        <div
          v-for="item in items"
          :key="item.label"
          class="distribution-row"
        >
          <div class="distribution-row__meta">
            <span>{{ item.label }}</span>
            <strong>{{ formatNumber(item.value) }} · {{ item.percent.toFixed(2) }}%</strong>
          </div>
          <div class="distribution-row__track">
            <div
              class="distribution-row__bar"
              :class="`distribution-row__bar--${tone}`"
              :style="{ width: `${Math.max(item.percent, 4)}%` }"
            />
          </div>
        </div>
      </div>

      <div v-else class="empty-state">No hay datos para mostrar.</div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: String,
  subtitle: String,
  data: {
    type: Array,
    default: () => []
  },
  tone: {
    type: String,
    default: 'blue'
  }
})

const items = computed(() => props.data || [])
const formatNumber = (value) => Number(value || 0).toLocaleString('es-PE')
</script>

<style scoped>
.distribution-list {
  display: grid;
  gap: 18px;
}

.distribution-row {
  display: grid;
  gap: 8px;
}

.distribution-row__meta {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  color: #334155;
  font-size: 12px;
  font-weight: 700;
}

.distribution-row__meta strong {
  color: #64748b;
  font-weight: 800;
  white-space: nowrap;
}

.distribution-row__track {
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: #f1f5f9;
}

.distribution-row__bar {
  height: 100%;
  border-radius: inherit;
}

.distribution-row__bar--blue {
  background: var(--primary);
}

.distribution-row__bar--teal {
  background: #14b8a6;
}

.distribution-row__bar--amber {
  background: #f59e0b;
}

.distribution-row__bar--slate {
  background: #94a3b8;
}
</style>

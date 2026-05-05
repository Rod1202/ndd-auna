<template>
  <section class="dashboard-card">
    <div class="dashboard-card__inner">
      <div class="card-header">
        <div>
          <h3 class="card-title">Duplex vs Simplex</h3>
          <p class="card-subtitle">Porcentaje por cantidad de trabajos.</p>
        </div>
      </div>

      <div class="ratio-card">
        <div class="ratio-card__main">
          <strong>{{ duplexPercent.toFixed(2) }}%</strong>
          <span>Duplex</span>
        </div>
        <div class="ratio-card__bars">
          <div>
            <div class="ratio-card__meta">
              <span>Duplex</span>
              <strong>{{ formatNumber(data?.duplex) }}</strong>
            </div>
            <div class="ratio-card__track">
              <div class="ratio-card__bar ratio-card__bar--blue" :style="{ width: `${duplexPercent}%` }" />
            </div>
          </div>
          <div>
            <div class="ratio-card__meta">
              <span>Simplex</span>
              <strong>{{ formatNumber(data?.simplex) }}</strong>
            </div>
            <div class="ratio-card__track">
              <div class="ratio-card__bar ratio-card__bar--slate" :style="{ width: `${simplexPercent}%` }" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  data: Object
})

const duplexPercent = computed(() => Number(props.data?.duplexPercent || 0))
const simplexPercent = computed(() => Number(props.data?.simplexPercent || 0))
const formatNumber = (value) => Number(value || 0).toLocaleString('es-PE')
</script>

<style scoped>
.ratio-card {
  display: grid;
  gap: 22px;
}

.ratio-card__main {
  display: grid;
  width: 164px;
  height: 164px;
  place-items: center;
  align-content: center;
  justify-self: center;
  border: 18px solid #dbeafe;
  border-radius: 999px;
  background: #fff;
}

.ratio-card__main strong {
  color: #1a1c1c;
  font-size: 28px;
  font-weight: 900;
}

.ratio-card__main span {
  color: #64748b;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.ratio-card__bars {
  display: grid;
  gap: 16px;
}

.ratio-card__meta {
  display: flex;
  justify-content: space-between;
  color: #475569;
  font-size: 12px;
  font-weight: 800;
}

.ratio-card__track {
  height: 8px;
  margin-top: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: #f1f5f9;
}

.ratio-card__bar {
  height: 100%;
}

.ratio-card__bar--blue {
  background: var(--primary);
}

.ratio-card__bar--slate {
  background: #94a3b8;
}
</style>

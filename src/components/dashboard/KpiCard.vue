<template>
  <article class="kpi-card">
    <div class="kpi-card__top">
      <div class="kpi-card__icon" :class="`kpi-card__icon--${tone}`">
        <v-icon :icon="icon" size="22" />
      </div>
      <span v-if="delta" class="kpi-card__delta" :class="{ 'kpi-card__delta--down': deltaDown }">
        {{ delta }}
      </span>
    </div>
    <p class="kpi-card__label">{{ title }}</p>
    <h4 class="kpi-card__value">{{ value }}</h4>
  </article>
</template>

<script setup>
defineProps({
  title: String,
  value: [String, Number],
  icon: {
    type: String,
    default: 'mdi-chart-box-outline'
  },
  tone: {
    type: String,
    default: 'blue'
  },
  delta: String,
  deltaDown: Boolean
})
</script>

<style scoped>
.kpi-card {
  min-height: 164px;
  padding: 24px;
  border: 1px solid transparent;
  border-radius: 12px;
  background: #fff;
  box-shadow: var(--shadow);
  transition: border-color 0.2s ease, transform 0.2s ease;
}

.kpi-card:hover {
  border-color: #dbeafe;
  transform: translateY(-1px);
}

.kpi-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 18px;
}

.kpi-card__icon {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border-radius: 8px;
}

.kpi-card__icon--blue {
  color: var(--primary);
  background: #eff6ff;
}

.kpi-card__icon--slate {
  color: #475569;
  background: #f8fafc;
}

.kpi-card__icon--teal {
  color: #0f766e;
  background: #f0fdfa;
}

.kpi-card__icon--amber {
  color: #d97706;
  background: #fffbeb;
}

.kpi-card__icon--rose {
  color: #e11d48;
  background: #fff1f2;
}

.kpi-card__delta {
  color: #10b981;
  font-size: 12px;
  font-weight: 800;
}

.kpi-card__delta--down {
  color: #e11d48;
}

.kpi-card__label {
  margin: 0 0 4px;
  color: #64748b;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.kpi-card__value {
  margin: 0;
  color: #1a1c1c;
  font-size: 24px;
  font-weight: 800;
  line-height: 32px;
}
</style>

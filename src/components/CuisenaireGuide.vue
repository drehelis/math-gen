<template>
  <div
    class="cuisenaire-guide relative rounded-2xl p-4 sm:p-5 border-4 cursor-pointer"
    :style="{
      background: 'linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%)',
      borderColor: 'var(--color-deep)',
      ...cellStyle
    }"
    @click="toggleExpanded"
  >
    <!-- Badge -->
    <div class="badge">💡</div>

    <!-- Header -->
    <div 
      class="flex items-center justify-between pt-2 mb-3"
      :dir="$i18n.locale === 'he' ? 'rtl' : 'ltr'"
    >
      <h3 class="title">
        {{ $t('cuisenaireGuide.title') }}
      </h3>
      <button
        class="toggle-btn"
        @click.stop="toggleExpanded"
      >
        {{ isExpanded ? $t('cuisenaireGuide.hideGuide') : $t('cuisenaireGuide.showGuide') }}
      </button>
    </div>

    <!-- Collapsed preview -->
    <div v-if="!isExpanded" class="preview">
      <div class="rod" :style="{ '--rod-color': getColor(num1), '--text-color': getTextColor(num1), '--separator-color': getSeparatorColor(num1) }">
        <span v-for="i in num1" :key="i" class="cell">{{ i }}</span>
      </div>
      <span class="operator">+</span>
      <div class="rod" :style="{ '--rod-color': getColor(num2), '--text-color': getTextColor(num2), '--separator-color': getSeparatorColor(num2) }">
        <span v-for="i in num2" :key="i" class="cell">{{ i }}</span>
      </div>
    </div>

    <!-- Expanded -->
    <div v-if="isExpanded" class="expanded">
      <!-- Problem -->
      <div class="step">
        <div class="rod" :style="{ '--rod-color': getColor(num1), '--text-color': getTextColor(num1), '--separator-color': getSeparatorColor(num1) }">
          <span v-for="i in num1" :key="i" class="cell">{{ i }}</span>
        </div>
        <span class="operator">+</span>
        <div class="rod" :style="{ '--rod-color': getColor(num2), '--text-color': getTextColor(num2), '--separator-color': getSeparatorColor(num2) }">
          <span v-for="i in num2" :key="i" class="cell">{{ i }}</span>
        </div>
      </div>

      <!-- Tip -->
      <!-- Tip -->
      <div 
        class="tip" 
        :dir="$i18n.locale === 'he' ? 'rtl' : 'ltr'"
      >
        {{ $t('cuisenaireGuide.tip') }}
      </div>

      <!-- Answer -->
      <div class="answer-section">
        <div class="combined-rods">
          <div class="rod" :style="{ '--rod-color': getColor(num1), '--text-color': getTextColor(num1), '--separator-color': getSeparatorColor(num1) }">
            <span v-for="i in num1" :key="'c1-'+i" class="cell">{{ i }}</span>
          </div>
          <div class="rod" :style="{ '--rod-color': getColor(num2), '--text-color': getTextColor(num2), '--separator-color': getSeparatorColor(num2) }">
            <span v-for="i in num2" :key="'c2-'+i" class="cell">{{ num1 + i }}</span>
          </div>
        </div>
        <div class="answer-text">= {{ answer }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  num1: { type: Number, default: 5 },
  num2: { type: Number, default: 3 },
  answer: { type: Number, default: 8 }
})

const isExpanded = ref(false)
const toggleExpanded = () => { isExpanded.value = !isExpanded.value }

const colors = {
  1: '#E0E0E0', 2: '#EF5350', 3: '#66BB6A', 4: '#AB47BC', 5: '#FFEE58',
  6: '#26A69A', 7: '#424242', 8: '#8D6E63', 9: '#42A5F5', 10: '#FFA726'
}
const getColor = (n) => colors[n] || colors[10]

// Dark colors need white text
const isDark = (n) => [6, 7, 8].includes(n)
const getTextColor = (n) => isDark(n) ? '#fff' : '#333'
const getSeparatorColor = (n) => isDark(n) ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)'

// Dynamic cell width based on answer size (wrapping is OK now, so larger sizes)
const cellWidth = computed(() => {
  if (props.answer <= 10) return 36
  if (props.answer <= 15) return 30
  return 26
})

const cellStyle = computed(() => ({
  '--cell-width': `${cellWidth.value}px`,
  '--cell-font': props.answer <= 10 ? '16px' : '13px'
}))
</script>

<style scoped>
.cuisenaire-guide {
  transition: all 0.2s ease;
}
.cuisenaire-guide:hover {
  box-shadow: 0 6px 20px rgba(0,0,0,0.12);
}

.badge {
  position: absolute;
  top: -12px;
  left: -12px;
  width: 40px;
  height: 40px;
  background: var(--color-sunshine);
  border: 3px solid var(--color-deep);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  z-index: 10;
}

.title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-deep);
}

.toggle-btn {
  padding: 6px 14px;
  background: var(--color-deep);
  color: white;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: transform 0.15s;
}
.toggle-btn:hover {
  transform: scale(1.05);
}

.preview, .step {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 8px 0;
}

.expanded {
  animation: fadeIn 0.25s ease;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* === THE RODS === */
.rod {
  display: inline-flex;
  background: linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(0,0,0,0.05) 100%);
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 
    0 2px 4px rgba(0,0,0,0.15),
    inset 0 1px 0 rgba(255,255,255,0.4);
}

.cell {
  width: var(--cell-width, 36px);
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--cell-font, 13px);
  font-weight: 700;
  background: var(--rod-color);
  border-right: 1px solid var(--separator-color, rgba(0,0,0,0.15));
  color: var(--text-color, #333);
  text-shadow: 0 1px 0 rgba(255,255,255,0.3);
}
.cell:last-child {
  border-right: none;
}

/* Two rods side by side with small gap */
.combined-rods {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
}

.operator {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--color-deep);
}

.question {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--color-deep);
}

.tip {
  text-align: center;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-deep);
  margin: 12px 0 8px;
  opacity: 0.85;
}

.answer-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.answer-text {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--color-mint);
}

@media print {
  .cuisenaire-guide { display: none !important; }
}
</style>

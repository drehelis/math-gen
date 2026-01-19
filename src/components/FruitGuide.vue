<template>
  <div
    class="fruit-guide relative rounded-2xl p-4 sm:p-5 border-4"
    :class="{ 'cursor-move': true, 'active': isDragging }"
    :style="{
      position: 'fixed',
      left: `${position.x}px`,
      top: `${position.y}px`,
      zIndex: 50,
      background: isMinimized ? 'transparent' : 'linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%)',
      borderColor: isMinimized ? 'transparent' : 'var(--color-deep)',
      pointerEvents: isMinimized ? 'none' : 'auto'
    }"
    @mousedown="startDrag"
    @touchstart="startDrag"
  >
    <!-- Badge -->
    <div 
      class="badge cursor-pointer"
      style="pointer-events: auto;"
      @click="toggleMinimize"
    >
      {{ isMinimized ? '❓' : '💡' }}
    </div>

    <div v-show="!isMinimized">
      <!-- Header -->
      <div 
        class="flex items-center justify-between pt-2 mb-3"
        :dir="$i18n.locale === 'he' ? 'rtl' : 'ltr'"
      >
        <h3 class="title">
          {{ $t('fruitGuide.title') }}
        </h3>
      </div>

      <!-- Tip (Moved below title) -->
      <div 
        class="tip" 
        :dir="$i18n.locale === 'he' ? 'rtl' : 'ltr'"
      >
        {{ $t('fruitGuide.tip') }}
      </div>

      <!-- Content (Always Visible) -->
      <div class="expanded">
        <!-- Problem -->
        <div class="step">
          <div class="fruit-start-group flex gap-1">
            <div 
              v-for="i in num1" 
              :key="`n1-${i}`" 
              class="fruit-item flex flex-col items-center"
            >
              <span class="text-[10px] font-bold opacity-60 leading-none mb-1">{{ i }}</span>
              <span class="fruit">{{ getFruit(num1) }}</span>
            </div>
          </div>
        
          <span class="operator">+</span>

          <div class="fruit-end-group flex gap-1">
            <div 
              v-for="i in num2" 
              :key="`n2-${i}`" 
              class="fruit-item flex flex-col items-center"
            >
              <span class="text-[10px] font-bold opacity-60 leading-none mb-1">{{ i }}</span>
              <span class="fruit">{{ getFruit(num2) }}</span>
            </div>
          </div>
        
          <div class="flex items-center gap-2">
            <span class="operator">=</span>
            <div class="answer-text">
              {{ answer }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const position = ref({ x: 20, y: 150 }) // Default position
const isDragging = ref(false)
const hasMoved = ref(false)
const isMinimized = ref(false)
const dragOffset = ref({ x: 0, y: 0 })

const startDrag = (e) => {
  isDragging.value = true
  hasMoved.value = false
  const clientX = e.touches ? e.touches[0].clientX : e.clientX
  const clientY = e.touches ? e.touches[0].clientY : e.clientY
  
  dragOffset.value = {
    x: clientX - position.value.x,
    y: clientY - position.value.y
  }
}

const onDrag = (e) => {
  if (!isDragging.value) return
  
  const clientX = e.touches ? e.touches[0].clientX : e.clientX
  const clientY = e.touches ? e.touches[0].clientY : e.clientY
  
  // Check if actually moved
  const newX = clientX - dragOffset.value.x
  const newY = clientY - dragOffset.value.y
  
  if (Math.abs(newX - position.value.x) > 2 || Math.abs(newY - position.value.y) > 2) {
    hasMoved.value = true
  }

  position.value = { x: newX, y: newY }
}

const stopDrag = () => {
  isDragging.value = false
}

const toggleMinimize = () => {
  if (!hasMoved.value) {
    isMinimized.value = !isMinimized.value
  }
}

onMounted(() => {
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', stopDrag)
  window.addEventListener('touchmove', onDrag)
  window.addEventListener('touchend', stopDrag)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', stopDrag)
  window.removeEventListener('touchmove', onDrag)
  window.removeEventListener('touchend', stopDrag)
})

defineProps({
  num1: { type: Number, default: 5 },
  num2: { type: Number, default: 3 },
  answer: { type: Number, default: 8 }
})

const fruitEmojis = {
  1: '🍓', // Strawberry
  2: '🍌', // Banana
  3: '🍎', // Apple
  4: '🍐', // Pear
  5: '🍊', // Orange
  6: '🍇', // Grapes
  7: '🍉', // Watermelon
  8: '🍒', // Cherry
  9: '🍍', // Pineapple
  10: '🥥' // Coconut
}

const getFruit = (n) => fruitEmojis[n] || fruitEmojis[10]

</script>

<style scoped>
.fruit-guide {
  transition: transform 0.1s ease, box-shadow 0.2s ease;
  user-select: none;
  touch-action: none;
  width: 330px;
  max-width: 90vw;
}

.fruit-guide:active, .fruit-guide.active {
  cursor: grabbing;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  transform: scale(1.02);
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

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0px;
  padding: 8px 0;
}

.expanded {
  animation: fadeIn 0.25s ease;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* === FRUITS === */
/* .fruit-group removed, using Tailwind classes */

.fruit {
  font-size: 28px;
  line-height: 1;
  filter: drop-shadow(0 2px 2px rgba(0,0,0,0.1));
}

.operator {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--color-deep);
}

.tip {
  text-align: center;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-deep);
  margin: 0 0 12px;
  opacity: 0.85;
}
.answer-text {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--color-mint);
}

@media print {
  .fruit-guide { display: none !important; }
}
</style>

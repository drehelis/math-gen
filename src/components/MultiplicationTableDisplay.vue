<template>
  <div class="multiplication-table-container">
    <CompletionOverlay
      :show="showCompletionOverlay"
      :stats="completionStats"
      @close="showCompletionOverlay = false"
    />

    <div class="print:hidden">
      <!-- Interactive 12x12 Grid -->
      <div class="no-print relative mb-12" dir="ltr">
        <div class="table-wrapper">
            <!-- Grid -->
            <div class="table-grid" :style="gridStyle">
              <!-- Top-left corner cell (×) -->
              <div class="corner-cell">
                <span class="text-2xl md:text-3xl font-bold" style="color: white;">×</span>
              </div>

              <!-- Column headers (1-tableSize) -->
              <div
                v-for="col in tableSize"
                :key="`header-${col}`"
                class="col-header"
              >
                <span class="text-lg md:text-xl font-bold" style="color: var(--color-deep);">{{ col }}</span>
              </div>

              <!-- Data rows -->
              <template v-for="row in tableSize" :key="`row-${row}`">
                <!-- Row header -->
                <div class="row-header">
                  <span class="text-lg md:text-xl font-bold" style="color: var(--color-deep);">{{ row }}</span>
                </div>

                <!-- Data cells -->
                <div
                  v-for="col in tableSize"
                  :key="`cell-${row}-${col}`"
                  class="data-cell"
                  :class="{
                    'cell-diagonal': row === col,
                    'cell-correct': !showAnswers && isCorrect(row, col),
                    'cell-incorrect': !showAnswers && isIncorrect(row, col),
                    'cell-focused': !showAnswers && focusedCell === getCellKey(row, col) && !isCorrect(row, col) && !isIncorrect(row, col)
                  }"
                >
                  <input
                    :ref="el => setCellRef(el, row, col)"
                    v-model="cellValues[getCellKey(row, col)]"
                    @input="(e) => handleInput(row, col, e.target.value)"
                    @keydown="(e) => handleKeydown(e, row, col)"
                    @focus="focusedCell = getCellKey(row, col)"
                    @blur="focusedCell = null"
                    type="text"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    maxlength="3"
                    class="cell-input"
                    :class="{ 'hidden': showAnswers }"
                  />
                  <span class="cell-answer" :class="{ 'hidden': !showAnswers }">{{ getAnswer(row, col) }}</span>
                </div>
              </template>
            </div>
          </div>

        <!-- Clear button at bottom -->
        <div v-if="!showAnswers && (correctCount > 0 || incorrectCount > 0)" class="mt-6 text-center">
          <button
            @click="clearTable"
            class="clear-button"
          >
            Clear All
          </button>
        </div>
      </div>

      <div class="text-center py-8">
        <a href="https://github.com/drehelis/math-gen" target="_blank" rel="noopener noreferrer" class="inline-block hover:opacity-70 transition-opacity" style="color: var(--color-purple);" :title="$t('emptyState.github')">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        </a>
      </div>
    </div>

    <!-- Print Layout -->
    <div class="hidden print:block" dir="ltr">
      <div class="print-page">
        <h2 class="text-xl font-bold mb-6 text-center" style="color: black;">{{ $t('tabs.table') }}</h2>
        <div class="print-table" style="font-family: 'Space Mono', monospace;">
          <table class="multiplication-print-table">
            <thead>
              <tr>
                <th class="print-header-cell">×</th>
                <th v-for="col in tableSize" :key="`print-header-${col}`" class="print-header-cell">{{ col }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in tableSize" :key="`print-row-${row}`">
                <th class="print-header-cell">{{ row }}</th>
                <td v-for="col in tableSize" :key="`print-cell-${row}-${col}`" class="print-data-cell">
                  <span v-if="showAnswers">{{ getAnswer(row, col) }}</span>
                  <span v-else>&nbsp;</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, inject } from 'vue'
import CompletionOverlay from './CompletionOverlay.vue'

const props = defineProps({
  showAnswers: {
    type: Boolean,
    default: false
  },
  tableSize: {
    type: Number,
    default: 10
  }
})

// Injected from parent
const multiplicationTableTab = inject('multiplicationTableTab', null)

const cellRefs = ref({})
const focusedCell = ref(null)
const cellValues = ref({})
const showCompletionOverlay = ref(false)
const completionStats = ref({
  total: 0,
  timeInSeconds: 0
})
const startTime = ref(null)

const getCellKey = (row, col) => `${row}-${col}`
const getAnswer = (row, col) => row * col

const setCellRef = (el, row, col) => {
  if (el) {
    const key = getCellKey(row, col)
    cellRefs.value[key] = el
  }
}

// Load saved answers
watch(() => multiplicationTableTab?.userAnswers.value, (newAnswers) => {
  if (newAnswers) {
    cellValues.value = { ...newAnswers }
  }
}, { immediate: true, deep: true })

const handleInput = (row, col, value) => {
  const key = getCellKey(row, col)

  // Start timer on first input
  if (!startTime.value && !props.showAnswers) {
    startTime.value = Date.now()
  }

  // Only allow numbers
  const sanitized = value.replace(/[^0-9]/g, '')
  cellValues.value[key] = sanitized

  if (multiplicationTableTab) {
    multiplicationTableTab.setUserAnswer(row, col, sanitized)
  }
}

const isCorrect = (row, col) => {
  const key = getCellKey(row, col)
  const userAnswer = cellValues.value[key]
  if (!userAnswer) return false
  const correctAnswer = getAnswer(row, col)
  const correctAnswerLength = String(correctAnswer).length
  // Only validate if the user has typed the expected number of digits
  if (userAnswer.length !== correctAnswerLength) return false
  return parseInt(userAnswer) === correctAnswer
}

const isIncorrect = (row, col) => {
  const key = getCellKey(row, col)
  const userAnswer = cellValues.value[key]
  if (!userAnswer) return false
  const correctAnswer = getAnswer(row, col)
  const correctAnswerLength = String(correctAnswer).length
  // Only validate if the user has typed the expected number of digits
  if (userAnswer.length !== correctAnswerLength) return false
  return parseInt(userAnswer) !== correctAnswer
}

const totalCells = computed(() => props.tableSize * props.tableSize)

const correctCount = computed(() => {
  let count = 0
  for (let row = 1; row <= props.tableSize; row++) {
    for (let col = 1; col <= props.tableSize; col++) {
      if (isCorrect(row, col)) count++
    }
  }
  return count
})

const incorrectCount = computed(() => {
  let count = 0
  for (let row = 1; row <= props.tableSize; row++) {
    for (let col = 1; col <= props.tableSize; col++) {
      if (isIncorrect(row, col)) count++
    }
  }
  return count
})

const handleKeydown = (e, row, col) => {
  const key = e.key

  let nextRow = row
  let nextCol = col

  if (key === 'ArrowRight' || key === 'Tab') {
    e.preventDefault()
    if (col < props.tableSize) {
      nextCol = col + 1
    } else if (row < props.tableSize) {
      nextRow = row + 1
      nextCol = 1
    }
  } else if (key === 'ArrowLeft') {
    e.preventDefault()
    if (col > 1) {
      nextCol = col - 1
    } else if (row > 1) {
      nextRow = row - 1
      nextCol = props.tableSize
    }
  } else if (key === 'ArrowDown') {
    e.preventDefault()
    nextRow = row < props.tableSize ? row + 1 : row
  } else if (key === 'ArrowUp') {
    e.preventDefault()
    nextRow = row > 1 ? row - 1 : row
  } else if (key === 'Enter') {
    e.preventDefault()
    // Move to next cell (right, then down)
    if (col < props.tableSize) {
      nextCol = col + 1
    } else if (row < props.tableSize) {
      nextRow = row + 1
      nextCol = 1
    }
  }

  if (nextRow !== row || nextCol !== col) {
    const nextKey = getCellKey(nextRow, nextCol)
    const nextInput = cellRefs.value[nextKey]
    if (nextInput) {
      nextTick(() => {
        nextInput.focus()
        nextInput.select()
      })
    }
  }
}

const clearTable = () => {
  cellValues.value = {}
  if (multiplicationTableTab) {
    multiplicationTableTab.clearAllAnswers()
  }
}

const gridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${props.tableSize + 1}, minmax(0, 1fr))`,
  gap: '0'
}))

// Watch for completion
watch(correctCount, (newCount) => {
  const total = totalCells.value
  if (newCount === total && total > 0 && !props.showAnswers && startTime.value) {
    const timeInSeconds = Math.floor((Date.now() - startTime.value) / 1000)
    completionStats.value = {
      total: total,
      timeInSeconds: timeInSeconds
    }
    setTimeout(() => {
      showCompletionOverlay.value = true
    }, 500)
  }
})

// Reset timer when cellValues are cleared
watch(cellValues, (newValues) => {
  const hasAnyValue = Object.keys(newValues).some(key => newValues[key])
  if (!hasAnyValue) {
    startTime.value = null
    showCompletionOverlay.value = false
  }
}, { deep: true })
</script>

<style scoped>
.table-wrapper {
  background: white;
  border-radius: 1.5rem;
  padding: 2rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  border: 8px solid var(--color-deep);
}

.table-grid {
  font-family: var(--font-mono);
}

.corner-cell,
.col-header,
.row-header,
.data-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border: 2px solid var(--color-deep);
  min-height: 2.5rem;
  font-family: var(--font-mono);
}

@media (min-width: 768px) {
  .corner-cell,
  .col-header,
  .row-header,
  .data-cell {
    min-height: 3.5rem;
    padding: 0.75rem;
  }
}

.corner-cell {
  background: var(--color-coral);
}

.col-header {
  background: var(--color-sky);
}

.row-header {
  background: #ffd7ba;
}

.data-cell {
  background: white;
  transition: all 0.15s ease;
  cursor: text !important;
  position: relative;
}

.data-cell.cell-diagonal {
  background: #fef3c7;
}

.data-cell:hover {
  background: #fef3c7;
}

.data-cell.cell-correct {
  background: var(--color-mint);
  animation: pop 0.3s ease;
}

.data-cell.cell-incorrect {
  background: var(--color-coral);
  animation: shake 0.3s ease;
}

.data-cell.cell-focused {
  background: var(--color-sunshine);
  transform: scale(1.05);
  z-index: 10;
  box-shadow: 0 0 0 4px var(--color-deep);
}

.cell-input,
.cell-answer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  text-align: center;
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-deep);
  font-family: var(--font-mono);
  line-height: 1.5;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin: 0;
  box-sizing: border-box;
}

.cell-input {
  border: none;
  background: transparent;
  outline: none;
  cursor: text !important;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

.cell-answer {
  opacity: 0.4;
  pointer-events: none;
}

.cell-input.hidden,
.cell-answer.hidden {
  visibility: hidden;
}

@media (min-width: 768px) {
  .cell-input,
  .cell-answer {
    font-size: 1.25rem;
  }
}

.progress-card-compact {
  background: var(--color-sunshine);
  border: 4px solid var(--color-deep);
  border-radius: 1.5rem;
  padding: 0.75rem 1.5rem;
  display: inline-block;
  height: 4rem;
  display: flex;
  align-items: center;
}

.stat-badge-compact {
  min-width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  border: 3px solid var(--color-deep);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 700;
  color: white;
  padding: 0 0.5rem;
}

.correct-badge {
  background: #10b981;
}

.incorrect-badge {
  background: #ef4444;
}

.clear-button {
  background: var(--color-coral);
  color: white;
  border: 4px solid var(--color-deep);
  border-radius: 1.5rem;
  padding: 0.75rem 2rem;
  font-size: 1.125rem;
  font-weight: 700;
  transition: all 0.15s ease;
  cursor: pointer !important;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.clear-button:hover {
  opacity: 0.9;
}

.clear-button:active {
  opacity: 0.8;
}

@keyframes pop {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-4px);
  }
  75% {
    transform: translateX(4px);
  }
}

/* Print styles */
@media print {
  .print-table {
    width: 100%;
    display: flex;
    justify-content: center;
    padding: 2rem;
  }

  .multiplication-print-table {
    border-collapse: collapse;
    font-size: 14px;
  }

  .print-header-cell {
    border: 2px solid black;
    padding: 0.5rem 0.75rem;
    background: #f3f4f6;
    font-weight: bold;
    text-align: center;
    min-width: 3rem;
  }

  .print-data-cell {
    border: 2px solid black;
    padding: 0.5rem 0.75rem;
    text-align: center;
    min-width: 3rem;
    min-height: 2.5rem;
  }
}
</style>

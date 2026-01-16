<template>
  <div class="multiplication-table-container">
    <CompletionOverlay
      :show="showCompletionOverlay"
      :stats="completionStats"
      @close="showCompletionOverlay = false"
    />

    <div class="print:hidden">
      <!-- Interactive Scrollable Table -->
      <div
        class="no-print relative mb-12"
        dir="ltr"
      >
        <div class="table-wrapper">
          <div class="scroll-container">
            <table class="interactive-table">
              <thead>
                <tr>
                  <!-- Corner cell (×) -->
                  <th class="corner-cell">
                    <span class="header-text">×</span>
                  </th>
                  <!-- Column headers (1-tableSize) -->
                  <th
                    v-for="col in tableSize"
                    :key="`header-${col}`"
                    class="col-header"
                    :class="{ 'col-highlighted': highlightedCol === col }"
                  >
                    <span class="header-text">{{ col }}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in tableSize"
                  :key="`row-${row}`"
                  :class="{ 'row-highlighted': highlightedRow === row }"
                >
                  <!-- Row header -->
                  <th
                    class="row-header"
                    :class="{ 'row-header-highlighted': highlightedRow === row }"
                  >
                    <span class="header-text">{{ row }}</span>
                  </th>
                  <!-- Data cells -->
                  <td
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
                      v-show="!showAnswers"
                      :ref="el => setCellRef(el, row, col)"
                      v-model="cellValues[getCellKey(row, col)]"
                      type="text"
                      inputmode="numeric"
                      pattern="[0-9]*"
                      maxlength="3"
                      class="cell-input"
                      @input="(e) => handleInput(row, col, e.target.value)"
                      @keydown="(e) => handleKeydown(e, row, col)"
                      @focus="handleCellFocus(row, col)"
                      @blur="handleCellBlur()"
                    >
                    <span
                      v-show="showAnswers"
                      class="cell-answer"
                    >{{ getAnswer(row, col) }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Clear button at bottom -->
        <div
          v-if="!showAnswers && (correctCount > 0 || incorrectCount > 0)"
          class="mt-6 text-center"
        >
          <button
            class="clear-button"
            @click="clearTable"
          >
            Clear All
          </button>
        </div>
      </div>

      <div class="text-center py-8">
        <a
          href="https://github.com/drehelis/math-gen"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-block hover:opacity-70 transition-opacity"
          style="color: var(--color-purple);"
          :title="$t('emptyState.github')"
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
        </a>
      </div>
    </div>

    <!-- Print Layout -->
    <div
      class="hidden print:block"
      dir="ltr"
    >
      <div class="print-page">
        <h2
          class="text-xl font-bold mb-6 text-center"
          style="color: black;"
        >
          {{ $t('tabs.table') }}
        </h2>
        <div
          class="print-table"
          style="font-family: 'Space Mono', monospace;"
        >
          <table class="multiplication-print-table">
            <thead>
              <tr>
                <th class="print-header-cell">
                  ×
                </th>
                <th
                  v-for="col in tableSize"
                  :key="`print-header-${col}`"
                  class="print-header-cell"
                >
                  {{ col }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in tableSize"
                :key="`print-row-${row}`"
              >
                <th class="print-header-cell">
                  {{ row }}
                </th>
                <td
                  v-for="col in tableSize"
                  :key="`print-cell-${row}-${col}`"
                  class="print-data-cell"
                >
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
const highlightedRow = ref(null)
const highlightedCol = ref(null)
const cellValues = ref({})
const showCompletionOverlay = ref(false)
const completionStats = ref({
  total: 0,
  timeInSeconds: 0
})
const startTime = ref(null)

const handleCellFocus = (row, col) => {
  focusedCell.value = getCellKey(row, col)
  highlightedRow.value = row
  highlightedCol.value = col
}

const handleCellBlur = () => {
  focusedCell.value = null
  highlightedRow.value = null
  highlightedCol.value = null
}

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
/* Container */
.table-wrapper {
  background: white;
  border-radius: 1rem;
  padding: 0.75rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  border: 4px solid var(--color-deep);
}

@media (min-width: 640px) {
  .table-wrapper {
    border-radius: 1.5rem;
    padding: 1.5rem;
    border-width: 6px;
  }
}

@media (min-width: 1024px) {
  .table-wrapper {
    padding: 2rem;
    border-width: 8px;
  }
}

/* Scroll container */
.scroll-container {
  overflow-x: auto;
  overflow-y: auto;
  max-height: 80vh;
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
  position: relative;
}

/* Hide scrollbar for cleaner look but keep functionality */
.scroll-container::-webkit-scrollbar {
  height: 8px;
  width: 8px;
}

.scroll-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.scroll-container::-webkit-scrollbar-thumb {
  background: var(--color-sky);
  border-radius: 4px;
}

.scroll-container::-webkit-scrollbar-thumb:hover {
  background: var(--color-purple);
}

/* Table structure */
.interactive-table {
  border-collapse: separate;
  border-spacing: 0;
  font-family: var(--font-mono);
  width: max-content;
  min-width: 100%;
}

/* All cells base styling */
.corner-cell,
.col-header,
.row-header,
.data-cell {
  min-width: 30px;
  min-height: 30px;
  padding: 0.125rem;
  border: 1px solid var(--color-deep);
  text-align: center;
  vertical-align: middle;
  font-family: var(--font-mono);
  box-sizing: border-box;
}

@media (min-width: 640px) {
  .corner-cell,
  .col-header,
  .row-header,
  .data-cell {
    min-width: 48px;
    min-height: 48px;
    padding: 0.5rem;
  }
}

@media (min-width: 1024px) {
  .corner-cell,
  .col-header,
  .row-header,
  .data-cell {
    min-width: 56px;
    min-height: 56px;
    padding: 0.75rem;
  }
}

/* Header text styling */
.header-text {
  font-weight: 700;
  color: var(--color-deep);
  font-size: 0.6875rem;
}

@media (min-width: 640px) {
  .header-text {
    font-size: 1rem;
  }
}

@media (min-width: 1024px) {
  .header-text {
    font-size: 1.25rem;
  }
}

/* Corner cell - sticky in both directions */
.corner-cell {
  position: sticky;
  top: 0;
  left: 0;
  z-index: 30;
  background: var(--color-coral);
}

.corner-cell .header-text {
  color: white;
  font-size: 0.875rem;
}

@media (min-width: 1024px) {
  .corner-cell .header-text {
    font-size: 1.75rem;
  }
}

/* Column headers - sticky at top */
.col-header {
  position: sticky;
  top: 0;
  z-index: 20;
  background: var(--color-sky);
}

.col-header.col-highlighted {
  background: var(--color-sunshine);
  box-shadow: inset 0 -3px 0 var(--color-orange);
}

/* Row headers - sticky at left */
.row-header {
  position: sticky;
  left: 0;
  z-index: 20;
  background: #ffd7ba;
}

.row-header-highlighted {
  background: var(--color-sunshine) !important;
  box-shadow: inset -3px 0 0 var(--color-orange);
}

/* Row highlighting */
.row-highlighted td {
  background: rgba(255, 217, 61, 0.15);
}

/* Data cells */
.data-cell {
  background: white;
  transition: background-color 0.15s ease, transform 0.15s ease;
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
  box-shadow: 0 0 0 3px var(--color-deep);
}

/* Input and answer styling */
.cell-input,
.cell-answer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  text-align: center;
  font-size: 0.6875rem;
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

@media (min-width: 640px) {
  .cell-input,
  .cell-answer {
    font-size: 1rem;
  }
}

@media (min-width: 1024px) {
  .cell-input,
  .cell-answer {
    font-size: 1.25rem;
  }
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

/* Clear button */
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

/* Animations */
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

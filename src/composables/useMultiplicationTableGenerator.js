import { ref, watch } from 'vue'
import { useLocalStorage } from './useLocalStorage'

const settingsStorage = useLocalStorage('math-gen-table-settings')
const answersStorage = useLocalStorage('math-gen-table-answers', {})

export function useMultiplicationTableGenerator() {
  const userAnswers = ref(answersStorage.load())
  const savedSettings = settingsStorage.load()
  const settings = ref(savedSettings || {
    showAnswers: false,
    prefillPercentage: 0,
    tableSize: 10
  })

  // We don't use a "questions" array like other tabs
  // Instead, we just track the grid state
  const questions = ref([]) // Keep for compatibility with ControlPanel

  watch(settings, (newSettings) => {
    settingsStorage.save(newSettings)
  }, { deep: true })

  watch(userAnswers, (newAnswers) => {
    answersStorage.save(newAnswers)
  }, { deep: true })

  const generateQuestions = () => {
    // For the multiplication table, we don't "generate" questions
    // The table size is dynamic based on settings
    // Clear all answers first
    userAnswers.value = {}

    const size = settings.value.tableSize || 10

    // Prefill based on percentage
    const percentage = settings.value.prefillPercentage || 0
    if (percentage > 0) {
      const totalCells = size * size
      const cellsToFill = Math.floor((percentage / 100) * totalCells)
      const allCells = []

      // Create array of all possible cells
      for (let row = 1; row <= size; row++) {
        for (let col = 1; col <= size; col++) {
          allCells.push({ row, col })
        }
      }

      // Shuffle and pick random cells to prefill
      for (let i = allCells.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allCells[i], allCells[j]] = [allCells[j], allCells[i]]
      }

      // Fill the selected cells
      for (let i = 0; i < cellsToFill; i++) {
        const { row, col } = allCells[i]
        const key = getCellKey(row, col)
        userAnswers.value[key] = String(row * col)
      }
    }

    questions.value = [] // Dummy to satisfy interface
  }

  const updateSettings = (newSettings) => {
    settings.value = { ...settings.value, ...newSettings }
  }

  const getCellKey = (row, col) => `${row}-${col}`

  const getAnswer = (row, col) => row * col

  const getUserAnswer = (row, col) => {
    const key = getCellKey(row, col)
    return userAnswers.value[key] || ''
  }

  const setUserAnswer = (row, col, value) => {
    const key = getCellKey(row, col)
    if (value === '') {
      delete userAnswers.value[key]
    } else {
      userAnswers.value[key] = value
    }
    // Trigger reactivity
    userAnswers.value = { ...userAnswers.value }
  }

  const clearAllAnswers = () => {
    userAnswers.value = {}
  }

  return {
    questions,
    settings,
    userAnswers,
    generateQuestions,
    updateSettings,
    getAnswer,
    getUserAnswer,
    setUserAnswer,
    clearAllAnswers
  }
}

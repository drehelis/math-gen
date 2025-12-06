import { ref, watch } from 'vue'

let idCounter = 0

const STORAGE_KEY_SETTINGS = 'math-gen-comparison-settings'
const STORAGE_KEY_QUESTIONS = 'math-gen-comparison-questions'

const loadSettings = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_SETTINGS)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (error) {
    console.error('Failed to load settings:', error)
  }
  return null
}

const saveSettings = (settings) => {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings))
  } catch (error) {
    console.error('Failed to save settings:', error)
  }
}

const loadQuestions = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_QUESTIONS)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (error) {
    console.error('Failed to load questions:', error)
  }
  return []
}

const saveQuestions = (questions) => {
  try {
    localStorage.setItem(STORAGE_KEY_QUESTIONS, JSON.stringify(questions))
  } catch (error) {
    console.error('Failed to save questions:', error)
  }
}

export function useComparisonQuestionGenerator() {
  const savedQuestions = loadQuestions()
  const questions = ref(savedQuestions)
  const savedSettings = loadSettings()

  let initialSettings = {
    count: 20,
    difficulty: 'beginners',
    operation: 'none',
    operations: ['none'],
    showAnswers: false
  }

  if (savedSettings) {
    initialSettings = {
      ...initialSettings,
      ...savedSettings
    }
  }

  const settings = ref(initialSettings)

  watch(settings, (newSettings) => {
    saveSettings(newSettings)
  }, { deep: true })

  watch(questions, (newQuestions) => {
    saveQuestions(newQuestions)
  }, { deep: true })

  const getRandomNumber = () => {
    let min = 0
    let max = 10

    if (settings.value.difficulty === 'beginners') {
      min = 0
      max = 10
    } else if (settings.value.difficulty === 'easy') {
      min = 1
      max = 10
    } else if (settings.value.difficulty === 'medium') {
      min = 1
      max = 20
    } else if (settings.value.difficulty === 'hard') {
      min = 1
      max = 100
    }

    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  const getComparisonOperator = (num1, num2) => {
    if (num1 < num2) return '<'
    if (num1 > num2) return '>'
    return '='
  }

  const generateQuestion = () => {
    const num1 = getRandomNumber()
    const num2 = getRandomNumber()
    const correctOperator = getComparisonOperator(num1, num2)

    return {
      id: `q-${Date.now()}-${++idCounter}`,
      num1,
      num2,
      correctOperator,
      answer: correctOperator,
      userAnswer: ''
    }
  }

  const generateQuestions = () => {
    const newQuestions = []
    const seen = new Set()
    const maxAttempts = settings.value.count * 10
    let attempts = 0

    while (newQuestions.length < settings.value.count && attempts < maxAttempts) {
      attempts++
      const question = generateQuestion()
      const key = `${question.num1}:${question.num2}:${question.correctOperator}`

      if (!seen.has(key)) {
        seen.add(key)
        newQuestions.push(question)
      }
    }

    questions.value = newQuestions
  }

  const updateSettings = (newSettings) => {
    settings.value = { ...settings.value, ...newSettings }
  }

  return {
    questions,
    settings,
    generateQuestions,
    updateSettings
  }
}

import { ref, watch, computed } from 'vue'

let idCounter = 0

const STORAGE_KEY_SETTINGS = 'math-gen-missing-settings'
const STORAGE_KEY_QUESTIONS = 'math-gen-missing-questions'

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

export function useMissingQuestionGenerator() {
  const savedQuestions = loadQuestions()
  const questions = ref(savedQuestions)
  const savedSettings = loadSettings()

  let initialSettings = {
    count: 20,
    difficulty: 'easy',
    operation: 'addition',
    operations: ['addition'],
    showAnswers: false
  }

  if (savedSettings) {
    const validOps = (savedSettings.operations || []).filter(op =>
      op === 'addition' || op === 'subtraction'
    )

    initialSettings = {
      ...initialSettings,
      ...savedSettings,
      operations: validOps.length > 0 ? validOps : ['addition']
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

    if (settings.value.difficulty === 'easy') {
      min = 0
      max = 10
    } else if (settings.value.difficulty === 'medium1') {
      min = 1
      max = 20
    } else if (settings.value.difficulty === 'medium') {
      min = 10
      max = 100
    } else if (settings.value.difficulty === 'hard') {
      min = 100
      max = 900
    }

    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  const generateQuestion = () => {
    const availableOperations = settings.value.operations || [settings.value.operation]
    const operation = availableOperations[Math.floor(Math.random() * availableOperations.length)]

    if (operation === 'addition') {
      const num1 = getRandomNumber()
      const num2 = getRandomNumber()
      const result = num1 + num2
      const missingPosition = Math.random() < 0.5 ? 'first' : 'second'

      return {
        id: `q-${Date.now()}-${++idCounter}`,
        num1,
        num2,
        result,
        answer: missingPosition === 'first' ? num1 : num2,
        operation: '+',
        missingPosition,
        userAnswer: ''
      }
    } else if (operation === 'subtraction') {
      const missingPosition = Math.random() < 0.5 ? 'first' : 'second'

      if (missingPosition === 'first') {
        const num2 = getRandomNumber()
        const result = getRandomNumber()
        const num1 = result + num2

        return {
          id: `q-${Date.now()}-${++idCounter}`,
          num1,
          num2,
          result,
          answer: num1,
          operation: '-',
          missingPosition,
          userAnswer: ''
        }
      } else {
        const result = getRandomNumber()
        const num1 = result + getRandomNumber()
        const num2 = num1 - result

        return {
          id: `q-${Date.now()}-${++idCounter}`,
          num1,
          num2,
          result,
          answer: num2,
          operation: '-',
          missingPosition,
          userAnswer: ''
        }
      }
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
      const key = `${question.num1}${question.operation}${question.num2}=${question.result}:${question.missingPosition}`

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

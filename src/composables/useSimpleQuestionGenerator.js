import { ref, watch } from 'vue'
import { edgeCaseRules, checkEdgeCases } from './useEdgeCaseRules'

let idCounter = 0

const STORAGE_KEY_SETTINGS = 'math-gen-simple-settings'
const STORAGE_KEY_QUESTIONS = 'math-gen-simple-questions'

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

export function useSimpleQuestionGenerator() {
  const savedQuestions = loadQuestions()
  const questions = ref(savedQuestions)
  const savedSettings = loadSettings()
  const settings = ref(savedSettings || {
    count: 20,
    difficulty: 'easy',
    operation: 'addition',
    operations: ['addition'],
    showAnswers: false,
    varySecondNumber: false,
    inputMode: 'native'
  })

  watch(settings, (newSettings) => {
    saveSettings(newSettings)
  }, { deep: true })

  watch(questions, (newQuestions) => {
    saveQuestions(newQuestions)
  }, { deep: true })

  const getRandomNumber = (isSecondNumber = false) => {
    let min = 0
    let max = 10

    if (settings.value.difficulty === 'easy') {
      min = 0
      max = 10
    } else if (settings.value.difficulty === 'beginners') {
      min = 0
      max = 10
    } else if (settings.value.difficulty === 'basic') {
      min = 1
      max = 20

      if (isSecondNumber && settings.value.varySecondNumber) {
        const useSmaller = Math.random() < 0.5
        if (useSmaller) {
          min = 1
          max = 10
        }
      }
    } else if (settings.value.difficulty === 'medium') {
      min = 10
      max = 100

      if (isSecondNumber && settings.value.varySecondNumber) {
        const useSmaller = Math.random() < 0.5
        if (useSmaller) {
          min = 1
          max = 10
        }
      }
    } else if (settings.value.difficulty === 'hard') {
      min = 100
      max = 900

      if (isSecondNumber && settings.value.varySecondNumber) {
        const rand = Math.random()
        if (rand < 0.5) {
          min = 1
          max = 10
        } else {
          min = 10
          max = 100
        }
      }
    }

    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  const generateQuestion = () => {
    const availableOperations = settings.value.operations || [settings.value.operation]
    const selectedOperation = availableOperations[Math.floor(Math.random() * availableOperations.length)]

    const varyFirst = Math.random() < 0.5
    let num1 = getRandomNumber(settings.value.varySecondNumber && varyFirst)
    let num2 = getRandomNumber(settings.value.varySecondNumber && !varyFirst)
    let answer
    let operation

    if (selectedOperation === 'subtraction') {
      if (num1 < num2) {
        [num1, num2] = [num2, num1]
      }
      answer = num1 - num2
      operation = '-'
    } else if (selectedOperation === 'multiplication') {
      answer = num1 * num2
      operation = '×'
    } else if (selectedOperation === 'division') {
      let divisorMax = 12
      if (settings.value.difficulty === 'easy') {
        divisorMax = 10
      }

      num2 = Math.floor(Math.random() * divisorMax) + 1

      if (num1 % num2 !== 0) {
        num1 = num2 * Math.floor(num1 / num2)
        if (num1 === 0) num1 = num2
      }

      answer = num1 / num2
      operation = '÷'
    } else {
      answer = num1 + num2
      operation = '+'
    }

    return {
      id: `q-${Date.now()}-${++idCounter}`,
      num1,
      num2,
      answer,
      operation,
      userAnswer: ''
    }
  }

  const generateQuestions = () => {
    const newQuestions = []
    const seen = new Set()
    const maxAttempts = settings.value.count * 10
    let attempts = 0

    const availableOperations = settings.value.operations || [settings.value.operation]
    const edgeCaseTracker = {}

    while (newQuestions.length < settings.value.count && attempts < maxAttempts) {
      attempts++
      const question = generateQuestion()
      const key = `${question.num1}${question.operation}${question.num2}`

      const result = checkEdgeCases(question, availableOperations, edgeCaseTracker)
      if (result.shouldSkip) continue

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

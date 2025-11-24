import { ref } from 'vue'

export function useMissingQuestionGenerator() {
  const questions = ref([])
  const settings = ref({
    count: 20,
    difficulty: 'easy',
    operation: 'addition',
    operations: ['addition'],
    showAnswers: false
  })

  const getRandomNumber = () => {
    let min = 0
    let max = 10

    if (settings.value.difficulty === 'easy') {
      min = 0
      max = 10
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
        id: Date.now() + Math.random(),
        num1,
        num2,
        result,
        answer: missingPosition === 'first' ? num1 : num2,
        operation: '+',
        missingPosition
      }
    } else if (operation === 'subtraction') {
      const missingPosition = Math.random() < 0.5 ? 'first' : 'second'

      if (missingPosition === 'first') {
        const num2 = getRandomNumber()
        const result = getRandomNumber()
        const num1 = result + num2

        return {
          id: Date.now() + Math.random(),
          num1,
          num2,
          result,
          answer: num1,
          operation: '-',
          missingPosition
        }
      } else {
        const result = getRandomNumber()
        const num1 = result + getRandomNumber()
        const num2 = num1 - result

        return {
          id: Date.now() + Math.random(),
          num1,
          num2,
          result,
          answer: num2,
          operation: '-',
          missingPosition
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

import { ref } from 'vue'

let idCounter = 0

export function useQuestionGenerator() {
  const questions = ref([])
  const settings = ref({
    count: 20,
    difficulty: 'easy',
    operation: 'addition',
    showAnswers: false
  })

  const getRandomNumber = () => {
    let min = 0
    let max = 10

      case 'easy':
  max = 10;
  break;
      case 'beginners':
  min = 0;
  max = 10;
  break;
      case 'basic':
  max = 20;
  break;
      case 'medium':
  max = 100;
  break;
      case 'hard':
  max = 1000;
  break; return Math.floor(Math.random() * (max - min + 1)) + min
}

const generateQuestion = () => {
  let num1 = getRandomNumber()
  let num2 = getRandomNumber()
  let answer
  let operation

  if (settings.value.operation === 'subtraction') {
    if (num1 < num2) {
      [num1, num2] = [num2, num1]
    }
    answer = num1 - num2
    operation = '-'
  } else if (settings.value.operation === 'multiplication') {
    answer = num1 * num2
    operation = '×'
  } else if (settings.value.operation === 'division') {
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
    operation
  }
}

const generateQuestions = () => {
  const newQuestions = []
  const seen = new Set()
  const maxAttempts = settings.value.count * 10
  let attempts = 0
  let hasZeroDivision = false
  let hasOneDivision = false

  while (newQuestions.length < settings.value.count && attempts < maxAttempts) {
    attempts++
    const question = generateQuestion()
    const key = `${question.num1}${question.operation}${question.num2}`

    if (settings.value.operation === 'division' && question.num1 === 0) {
      if (hasZeroDivision) continue
      hasZeroDivision = true
    }

    if (settings.value.operation === 'division' && question.num1 === question.num2) {
      if (hasOneDivision) continue
      hasOneDivision = true
    }

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

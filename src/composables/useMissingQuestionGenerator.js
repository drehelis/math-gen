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
    showAnswers: false,
    questionFormat: 'standard' // 'standard', 'both-sides', 'missing-both'
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

  const getRandomNumber = (isSecondNumber = false) => {
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

  const generateStandardQuestion = (operation) => {
    if (operation === 'addition') {
      const varyFirst = Math.random() < 0.5
      const num1 = getRandomNumber(settings.value.varySecondNumber && varyFirst)
      const num2 = getRandomNumber(settings.value.varySecondNumber && !varyFirst)
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
        format: 'standard',
        userAnswer: ''
      }
    } else if (operation === 'subtraction') {
      const missingPosition = Math.random() < 0.5 ? 'first' : 'second'

      if (missingPosition === 'first') {
        const varyFirst = Math.random() < 0.5
        const num2 = getRandomNumber(settings.value.varySecondNumber && !varyFirst)
        const result = getRandomNumber(settings.value.varySecondNumber && varyFirst)
        const num1 = result + num2

        return {
          id: `q-${Date.now()}-${++idCounter}`,
          num1,
          num2,
          result,
          answer: num1,
          operation: '-',
          missingPosition,
          format: 'standard',
          userAnswer: ''
        }
      } else {
        const varyFirst = Math.random() < 0.5
        const result = getRandomNumber(settings.value.varySecondNumber && varyFirst)
        const num1 = result + getRandomNumber(settings.value.varySecondNumber && !varyFirst)
        const num2 = num1 - result

        return {
          id: `q-${Date.now()}-${++idCounter}`,
          num1,
          num2,
          result,
          answer: num2,
          operation: '-',
          missingPosition,
          format: 'standard',
          userAnswer: ''
        }
      }
    }
  }

  const generateMixedOperatorsBothSidesQuestion = () => {
    // Mix addition and subtraction operators across both sides
    // Format possibilities with mixed operators:
    // ___ + num2 = num3 - num4 (left +, right -)
    // num1 + ___ = num3 - num4 (left +, right -)
    // num1 + num2 = ___ - num4 (left +, right -)
    // num1 + num2 = num3 - ___ (left +, right -)
    // ___ - num2 = num3 + num4 (left -, right +)
    // num1 - ___ = num3 + num4 (left -, right +)
    // num1 - num2 = ___ + num4 (left -, right +)
    // num1 - num2 = num3 + ___ (left -, right +)

    const leftOp = Math.random() < 0.5 ? '+' : '-'
    const rightOp = leftOp === '+' ? '-' : '+'
    const positions = ['left-first', 'left-second', 'right-first', 'right-second']
    const missingPosition = positions[Math.floor(Math.random() * positions.length)]

    if (leftOp === '+' && rightOp === '-') {
      // Left: addition, Right: subtraction
      if (missingPosition === 'right-second') {
        // Format: num1 + num2 = num3 - ___
        const varyFirst = Math.random() < 0.5
        const num1 = getRandomNumber(settings.value.varySecondNumber && varyFirst)
        const num2 = getRandomNumber(settings.value.varySecondNumber && !varyFirst)
        const total = num1 + num2
        const num3 = getRandomNumber()
        const answer = num3 - total

        if (answer < 0) {
          return generateMixedOperatorsBothSidesQuestion()
        }

        return {
          id: `q-${Date.now()}-${++idCounter}`,
          num1, num2, num3,
          answer,
          operation: '+',
          operation2: '-',
          format: 'both-sides',
          missingPosition: 'right-second',
          userAnswer: ''
        }
      } else if (missingPosition === 'right-first') {
        // Format: num1 + num2 = ___ - num4
        const varyFirst = Math.random() < 0.5
        const num1 = getRandomNumber(settings.value.varySecondNumber && varyFirst)
        const num2 = getRandomNumber(settings.value.varySecondNumber && !varyFirst)
        const total = num1 + num2
        const num4 = getRandomNumber()
        const answer = total + num4

        return {
          id: `q-${Date.now()}-${++idCounter}`,
          num1, num2, num4,
          answer,
          operation: '+',
          operation2: '-',
          format: 'both-sides',
          missingPosition: 'right-first',
          userAnswer: ''
        }
      } else if (missingPosition === 'left-second') {
        // Format: num1 + ___ = num3 - num4
        const num1 = getRandomNumber()
        const varyFirst = Math.random() < 0.5
        const num3 = getRandomNumber(settings.value.varySecondNumber && varyFirst)
        const num4 = Math.min(num3, getRandomNumber(settings.value.varySecondNumber && !varyFirst))
        const result = num3 - num4
        const answer = result - num1

        if (answer < 0) {
          return generateMixedOperatorsBothSidesQuestion()
        }

        return {
          id: `q-${Date.now()}-${++idCounter}`,
          num1, num3, num4,
          answer,
          operation: '+',
          operation2: '-',
          format: 'both-sides',
          missingPosition: 'left-second',
          userAnswer: ''
        }
      } else {
        // Format: ___ + num2 = num3 - num4
        const num2 = getRandomNumber()
        const varyFirst = Math.random() < 0.5
        const num3 = getRandomNumber(settings.value.varySecondNumber && varyFirst)
        const num4 = Math.min(num3, getRandomNumber(settings.value.varySecondNumber && !varyFirst))
        const result = num3 - num4
        const answer = result - num2

        if (answer < 0) {
          return generateMixedOperatorsBothSidesQuestion()
        }

        return {
          id: `q-${Date.now()}-${++idCounter}`,
          num2, num3, num4,
          answer,
          operation: '+',
          operation2: '-',
          format: 'both-sides',
          missingPosition: 'left-first',
          userAnswer: ''
        }
      }
    } else {
      // Left: subtraction, Right: addition
      if (missingPosition === 'right-second') {
        // Format: num1 - num2 = num3 + ___
        const varyFirst = Math.random() < 0.5
        const num1 = getRandomNumber(settings.value.varySecondNumber && varyFirst)
        const num2 = Math.min(num1, getRandomNumber(settings.value.varySecondNumber && !varyFirst))
        const result = num1 - num2
        const num3 = getRandomNumber()
        const answer = result - num3

        if (answer < 0) {
          return generateMixedOperatorsBothSidesQuestion()
        }

        return {
          id: `q-${Date.now()}-${++idCounter}`,
          num1, num2, num3,
          answer,
          operation: '-',
          operation2: '+',
          format: 'both-sides',
          missingPosition: 'right-second',
          userAnswer: ''
        }
      } else if (missingPosition === 'right-first') {
        // Format: num1 - num2 = ___ + num4
        const varyFirst = Math.random() < 0.5
        const num1 = getRandomNumber(settings.value.varySecondNumber && varyFirst)
        const num2 = Math.min(num1, getRandomNumber(settings.value.varySecondNumber && !varyFirst))
        const result = num1 - num2
        const num4 = getRandomNumber()
        const answer = result - num4

        if (answer < 0) {
          return generateMixedOperatorsBothSidesQuestion()
        }

        return {
          id: `q-${Date.now()}-${++idCounter}`,
          num1, num2, num4,
          answer,
          operation: '-',
          operation2: '+',
          format: 'both-sides',
          missingPosition: 'right-first',
          userAnswer: ''
        }
      } else if (missingPosition === 'left-second') {
        // Format: num1 - ___ = num3 + num4
        const num1 = getRandomNumber()
        const varyFirst = Math.random() < 0.5
        const num3 = getRandomNumber(settings.value.varySecondNumber && varyFirst)
        const num4 = getRandomNumber(settings.value.varySecondNumber && !varyFirst)
        const total = num3 + num4
        const answer = num1 - total

        if (answer < 0) {
          return generateMixedOperatorsBothSidesQuestion()
        }

        return {
          id: `q-${Date.now()}-${++idCounter}`,
          num1, num3, num4,
          answer,
          operation: '-',
          operation2: '+',
          format: 'both-sides',
          missingPosition: 'left-second',
          userAnswer: ''
        }
      } else {
        // Format: ___ - num2 = num3 + num4
        const num2 = getRandomNumber()
        const varyFirst = Math.random() < 0.5
        const num3 = getRandomNumber(settings.value.varySecondNumber && varyFirst)
        const num4 = getRandomNumber(settings.value.varySecondNumber && !varyFirst)
        const total = num3 + num4
        const answer = total + num2

        return {
          id: `q-${Date.now()}-${++idCounter}`,
          num2, num3, num4,
          answer,
          operation: '-',
          operation2: '+',
          format: 'both-sides',
          missingPosition: 'left-first',
          userAnswer: ''
        }
      }
    }
  }

  const generateBothSidesQuestion = (operation) => {
    // Format possibilities:
    // ___ + num2 = num3 + num4 (left-first)
    // num1 + ___ = num3 + num4 (left-second)
    // num1 + num2 = ___ + num4 (right-first)
    // num1 + num2 = num3 + ___ (right-second)
    const positions = ['left-first', 'left-second', 'right-first', 'right-second']
    const missingPosition = positions[Math.floor(Math.random() * positions.length)]

    if (operation === 'addition') {
      if (missingPosition === 'right-second') {
        // Format: num1 + num2 = num3 + ___
        const varyFirst = Math.random() < 0.5
        const num1 = getRandomNumber(settings.value.varySecondNumber && varyFirst)
        const num2 = getRandomNumber(settings.value.varySecondNumber && !varyFirst)
        const total = num1 + num2
        const num3 = getRandomNumber()
        const answer = total - num3

        if (answer < 0) {
          return generateBothSidesQuestion(operation)
        }

        return {
          id: `q-${Date.now()}-${++idCounter}`,
          num1, num2, num3,
          answer,
          operation: '+',
          format: 'both-sides',
          missingPosition: 'right-second',
          userAnswer: ''
        }
      } else if (missingPosition === 'right-first') {
        // Format: num1 + num2 = ___ + num4
        const varyFirst = Math.random() < 0.5
        const num1 = getRandomNumber(settings.value.varySecondNumber && varyFirst)
        const num2 = getRandomNumber(settings.value.varySecondNumber && !varyFirst)
        const total = num1 + num2
        const num4 = getRandomNumber()
        const answer = total - num4

        if (answer < 0) {
          return generateBothSidesQuestion(operation)
        }

        return {
          id: `q-${Date.now()}-${++idCounter}`,
          num1, num2, num4,
          answer,
          operation: '+',
          format: 'both-sides',
          missingPosition: 'right-first',
          userAnswer: ''
        }
      } else if (missingPosition === 'left-second') {
        // Format: num1 + ___ = num3 + num4
        const num1 = getRandomNumber()
        const varyFirst = Math.random() < 0.5
        const num3 = getRandomNumber(settings.value.varySecondNumber && varyFirst)
        const num4 = getRandomNumber(settings.value.varySecondNumber && !varyFirst)
        const total = num3 + num4
        const answer = total - num1

        if (answer < 0) {
          return generateBothSidesQuestion(operation)
        }

        return {
          id: `q-${Date.now()}-${++idCounter}`,
          num1, num3, num4,
          answer,
          operation: '+',
          format: 'both-sides',
          missingPosition: 'left-second',
          userAnswer: ''
        }
      } else {
        // Format: ___ + num2 = num3 + num4
        const num2 = getRandomNumber()
        const varyFirst = Math.random() < 0.5
        const num3 = getRandomNumber(settings.value.varySecondNumber && varyFirst)
        const num4 = getRandomNumber(settings.value.varySecondNumber && !varyFirst)
        const total = num3 + num4
        const answer = total - num2

        if (answer < 0) {
          return generateBothSidesQuestion(operation)
        }

        return {
          id: `q-${Date.now()}-${++idCounter}`,
          num2, num3, num4,
          answer,
          operation: '+',
          format: 'both-sides',
          missingPosition: 'left-first',
          userAnswer: ''
        }
      }
    } else if (operation === 'subtraction') {
      if (missingPosition === 'right-second') {
        // Format: num1 - num2 = num3 - ___
        const varyFirst = Math.random() < 0.5
        const num1 = getRandomNumber(settings.value.varySecondNumber && varyFirst)
        const num2 = Math.min(num1, getRandomNumber(settings.value.varySecondNumber && !varyFirst))
        const result = num1 - num2
        const num3 = getRandomNumber()
        const answer = num3 - result

        if (answer < 0) {
          return generateBothSidesQuestion(operation)
        }

        return {
          id: `q-${Date.now()}-${++idCounter}`,
          num1, num2, num3,
          answer,
          operation: '-',
          format: 'both-sides',
          missingPosition: 'right-second',
          userAnswer: ''
        }
      } else if (missingPosition === 'right-first') {
        // Format: num1 - num2 = ___ - num4
        const varyFirst = Math.random() < 0.5
        const num1 = getRandomNumber(settings.value.varySecondNumber && varyFirst)
        const num2 = Math.min(num1, getRandomNumber(settings.value.varySecondNumber && !varyFirst))
        const result = num1 - num2
        const num4 = getRandomNumber()
        const answer = result + num4

        return {
          id: `q-${Date.now()}-${++idCounter}`,
          num1, num2, num4,
          answer,
          operation: '-',
          format: 'both-sides',
          missingPosition: 'right-first',
          userAnswer: ''
        }
      } else if (missingPosition === 'left-second') {
        // Format: num1 - ___ = num3 - num4
        const num1 = getRandomNumber()
        const varyFirst = Math.random() < 0.5
        const num3 = getRandomNumber(settings.value.varySecondNumber && varyFirst)
        const num4 = Math.min(num3, getRandomNumber(settings.value.varySecondNumber && !varyFirst))
        const result = num3 - num4
        const answer = num1 - result

        if (answer < 0) {
          return generateBothSidesQuestion(operation)
        }

        return {
          id: `q-${Date.now()}-${++idCounter}`,
          num1, num3, num4,
          answer,
          operation: '-',
          format: 'both-sides',
          missingPosition: 'left-second',
          userAnswer: ''
        }
      } else {
        // Format: ___ - num2 = num3 - num4
        const num2 = getRandomNumber()
        const varyFirst = Math.random() < 0.5
        const num3 = getRandomNumber(settings.value.varySecondNumber && varyFirst)
        const num4 = Math.min(num3, getRandomNumber(settings.value.varySecondNumber && !varyFirst))
        const result = num3 - num4
        const answer = result + num2

        return {
          id: `q-${Date.now()}-${++idCounter}`,
          num2, num3, num4,
          answer,
          operation: '-',
          format: 'both-sides',
          missingPosition: 'left-first',
          userAnswer: ''
        }
      }
    }
  }

  const generateQuestion = () => {
    const availableOperations = settings.value.operations || [settings.value.operation]
    const operation = availableOperations[Math.floor(Math.random() * availableOperations.length)]
    const format = settings.value.questionFormat || 'standard'

    if (format === 'both-sides' || format === 'both-sides-mixed') {
      // If both addition and subtraction are selected, randomly mix operators
      if (availableOperations.length === 2 &&
          availableOperations.includes('addition') &&
          availableOperations.includes('subtraction')) {
        return generateMixedOperatorsBothSidesQuestion()
      }
      return generateBothSidesQuestion(operation)
    } else {
      return generateStandardQuestion(operation)
    }
  }

  const edgeCaseRules = [
    // Answer is 0
    {
      check: (q) => q.answer === 0,
      key: 'answerZero'
    },
    // Standard format: result is 0 (e.g., ___ + 5 = 0)
    {
      check: (q) => q.format === 'standard' && q.result === 0,
      key: 'resultZero'
    },
    // Both-sides format: left side equals 0 (e.g., 25 - 25 = ___ + 5)
    {
      check: (q) => {
        if (q.format !== 'both-sides') return false
        const leftOp = q.operation
        let leftValue

        if (q.missingPosition === 'left-first') {
          leftValue = leftOp === '+' ? q.answer + q.num2 : q.answer - q.num2
        } else if (q.missingPosition === 'left-second') {
          leftValue = leftOp === '+' ? q.num1 + q.answer : q.num1 - q.answer
        } else {
          leftValue = leftOp === '+' ? q.num1 + q.num2 : q.num1 - q.num2
        }

        return leftValue === 0
      },
      key: 'leftSideZero'
    },
    // Both-sides format: right side equals 0 (e.g., 5 + ___ = 100 - 100)
    {
      check: (q) => {
        if (q.format !== 'both-sides') return false
        const rightOp = q.operation2 || q.operation
        let rightValue

        if (q.missingPosition === 'right-first') {
          rightValue = rightOp === '+' ? q.answer + q.num4 : q.answer - q.num4
        } else if (q.missingPosition === 'right-second') {
          rightValue = rightOp === '+' ? q.num3 + q.answer : q.num3 - q.answer
        } else {
          rightValue = rightOp === '+' ? q.num3 + q.num4 : q.num3 - q.num4
        }

        return rightValue === 0
      },
      key: 'rightSideZero'
    }
  ]

  const generateQuestions = () => {
    const newQuestions = []
    const seen = new Set()
    const edgeCaseTracker = {}
    const maxAttempts = settings.value.count * 10
    let attempts = 0

    while (newQuestions.length < settings.value.count && attempts < maxAttempts) {
      attempts++
      const question = generateQuestion()

      // Check edge cases
      let shouldSkip = false
      for (const rule of edgeCaseRules) {
        if (rule.check(question)) {
          if (rule.skip) {
            shouldSkip = true
            break
          }
          if (edgeCaseTracker[rule.key]) {
            shouldSkip = true
            break
          }
          edgeCaseTracker[rule.key] = true
        }
      }

      if (shouldSkip) continue

      // Generate deduplication key based on format
      let key
      if (question.format === 'standard') {
        key = `${question.num1}${question.operation}${question.num2}=${question.result}:${question.missingPosition}`
      } else if (question.format === 'both-sides') {
        if (question.missingPosition === 'right-second') {
          key = `${question.num1}${question.operation}${question.num2}=${question.num3}${question.operation2 || question.operation}?:rs`
        } else if (question.missingPosition === 'right-first') {
          key = `${question.num1}${question.operation}${question.num2}=?${question.operation2 || question.operation}${question.num4}:rf`
        } else if (question.missingPosition === 'left-second') {
          key = `${question.num1}${question.operation}?=${question.num3}${question.operation2 || question.operation}${question.num4}:ls`
        } else {
          key = `?${question.operation}${question.num2}=${question.num3}${question.operation2 || question.operation}${question.num4}:lf`
        }
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

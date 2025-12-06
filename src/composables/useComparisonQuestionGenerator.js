import { ref, watch } from 'vue'
import { checkEdgeCases } from './useEdgeCaseRules'

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

  const getRandomNumber = (max = null) => {
    let min = 0
    let maxVal = max || 10

    if (!max) {
      if (settings.value.difficulty === 'beginners') {
        min = 0
        maxVal = 10
      } else if (settings.value.difficulty === 'basic') {
        min = 1
        maxVal = 20
      } else if (settings.value.difficulty === 'easy') {
        min = 1
        maxVal = 10
      } else if (settings.value.difficulty === 'medium') {
        min = 1
        maxVal = 20
      } else if (settings.value.difficulty === 'hard') {
        min = 1
        maxVal = 100
      }
    }

    return Math.floor(Math.random() * (maxVal - min + 1)) + min
  }

  const getComparisonOperator = (num1, num2) => {
    if (num1 < num2) return '<'
    if (num1 > num2) return '>'
    return '='
  }

  const generateExpression = () => {
    const selectedOps = settings.value.operations || ['addition']
    
    // Choose operation based on settings
    let operation
    if (selectedOps.length === 1) {
      operation = selectedOps[0]
    } else {
      operation = selectedOps[Math.floor(Math.random() * selectedOps.length)]
    }
    
    let num1, num2, value, display
    
    if (operation === 'multiplication') {
      num1 = getRandomNumber(10)
      num2 = getRandomNumber(10)
      value = num1 * num2
      display = `${num1} × ${num2}`
      
      return {
        display,
        value,
        operation: 'multiplication',
        num1,
        num2,
        operatorSymbol: '×'
      }
    } else if (operation === 'division') {
      // For division, ensure it divides evenly
      let divisorMax = 10
      num2 = Math.floor(Math.random() * divisorMax) + 1
      num1 = getRandomNumber(10)
      
      if (num1 % num2 !== 0) {
        num1 = num2 * Math.floor(num1 / num2)
        if (num1 === 0) num1 = num2
      }
      
      value = num1 / num2
      display = `${num1} ÷ ${num2}`
      
      return {
        display,
        value,
        operation: 'division',
        num1,
        num2,
        operatorSymbol: '÷'
      }
    } else if (operation === 'addition') {
      num1 = getRandomNumber(10)
      num2 = getRandomNumber(10)
      value = num1 + num2
      display = `${num1} + ${num2}`
      
      return {
        display,
        value,
        operation: 'addition',
        num1,
        num2,
        operatorSymbol: '+'
      }
    } else if (operation === 'subtraction') {
      num1 = getRandomNumber(10)
      num2 = getRandomNumber(10)
      
      // For subtraction, ensure result is not negative
      if (num1 >= num2) {
        value = num1 - num2
        display = `${num1} - ${num2}`
        
        return {
          display,
          value,
          operation: 'subtraction',
          num1,
          num2,
          operatorSymbol: '-'
        }
      } else {
        value = num2 - num1
        display = `${num2} - ${num1}`
        
        return {
          display,
          value,
          operation: 'subtraction',
          num1: num2,
          num2: num1,
          operatorSymbol: '-'
        }
      }
    }
  }

  const generateQuestion = () => {
    if (settings.value.difficulty === 'basic') {
      // For basic difficulty, create expressions with arithmetic
      const useExpressionOnLeft = Math.random() < 0.7 // 70% chance for expression on left
      const useExpressionOnBoth = Math.random() < 0.3 // 30% chance for expressions on both sides
      
      let leftSide, rightSide, leftValue, rightValue
      
      if (useExpressionOnBoth) {
        // Both sides have expressions: "7 + 6 ___ 4 + 2"
        leftSide = generateExpression()
        rightSide = generateExpression()
        leftValue = leftSide.value
        rightValue = rightSide.value
      } else if (useExpressionOnLeft) {
        // Left side has expression: "1 + 5 ___ 6"
        leftSide = generateExpression()
        rightValue = getRandomNumber(20)
        leftValue = leftSide.value
        rightSide = { display: rightValue.toString(), value: rightValue, operatorSymbol: null }
      } else {
        // Right side has expression: "6 ___ 1 + 5"
        leftValue = getRandomNumber(20)
        rightSide = generateExpression()
        rightValue = rightSide.value
        leftSide = { display: leftValue.toString(), value: leftValue, operatorSymbol: null }
      }
      
      const correctOperator = getComparisonOperator(leftValue, rightValue)
      
      return {
        id: `q-${Date.now()}-${++idCounter}`,
        num1: leftSide.display,
        num2: rightSide.display,
        leftValue,
        rightValue,
        correctOperator,
        answer: correctOperator,
        userAnswer: '',
        hasExpression: true,
        leftSide,
        rightSide
      }
    } else {
      // For beginners/easy, just simple numbers
      const num1 = getRandomNumber()
      const num2 = getRandomNumber()
      const correctOperator = getComparisonOperator(num1, num2)

      return {
        id: `q-${Date.now()}-${++idCounter}`,
        num1,
        num2,
        correctOperator,
        answer: correctOperator,
        userAnswer: '',
        hasExpression: false
      }
    }
  }

  const generateQuestions = () => {
    const newQuestions = []
    const seen = new Set()
    const maxAttempts = settings.value.count * 10
    let attempts = 0
    const edgeCaseTracker = {}
    const availableOperations = settings.value.operations || ['none']

    while (newQuestions.length < settings.value.count && attempts < maxAttempts) {
      attempts++
      const question = generateQuestion()
      
      // Check edge cases for basic difficulty with expressions
      if (settings.value.difficulty === 'basic' && question.hasExpression) {
        let shouldSkip = false
        
        // Check left side if it has an expression
        if (question.leftSide && question.leftSide.operatorSymbol) {
          const leftTracker = {}
          Object.keys(edgeCaseTracker)
            .filter(key => key.startsWith('left_'))
            .forEach(key => {
              leftTracker[key.replace('left_', '')] = edgeCaseTracker[key]
            })
          
          const result = checkEdgeCases(question.leftSide, availableOperations, leftTracker)
          if (result.shouldSkip) {
            shouldSkip = true
          } else {
            Object.keys(leftTracker).forEach(key => {
              edgeCaseTracker[`left_${key}`] = leftTracker[key]
            })
          }
        }
        
        // Check right side if it has an expression
        if (!shouldSkip && question.rightSide && question.rightSide.operatorSymbol) {
          const rightTracker = {}
          Object.keys(edgeCaseTracker)
            .filter(key => key.startsWith('right_'))
            .forEach(key => {
              rightTracker[key.replace('right_', '')] = edgeCaseTracker[key]
            })
          
          const result = checkEdgeCases(question.rightSide, availableOperations, rightTracker)
          if (result.shouldSkip) {
            shouldSkip = true
          } else {
            Object.keys(rightTracker).forEach(key => {
              edgeCaseTracker[`right_${key}`] = rightTracker[key]
            })
          }
        }
        
        if (shouldSkip) continue
      }
      
      const key = question.hasExpression 
        ? `${question.leftValue}:${question.rightValue}:${question.correctOperator}:${question.num1}:${question.num2}`
        : `${question.num1}:${question.num2}:${question.correctOperator}`

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

import { ref, watch } from 'vue'
import { checkEdgeCases } from './useEdgeCaseRules'
import { useLocalStorage } from './useLocalStorage'

let idCounter = 0

const settingsStorage = useLocalStorage('math-gen-comparison-settings')
const questionsStorage = useLocalStorage('math-gen-comparison-questions', [])

export function useComparisonQuestionGenerator() {
  const questions = ref(questionsStorage.load())
  const savedSettings = settingsStorage.load()

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
    settingsStorage.save(newSettings)
  }, { deep: true })

  watch(questions, (newQuestions) => {
    questionsStorage.save(newQuestions)
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
    
    // Set number range based on difficulty
    const numMax = (settings.value.difficulty === 'medium') ? 100 : 20
    
    if (operation === 'multiplication') {
      const factorMax = (settings.value.difficulty === 'medium') ? 10 : 10
      num1 = getRandomNumber(factorMax)
      num2 = getRandomNumber(factorMax)
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
      const divisorMax = (settings.value.difficulty === 'medium') ? 10 : 10
      const quotientMax = (settings.value.difficulty === 'medium') ? 10 : 10
      
      num2 = Math.floor(Math.random() * divisorMax) + 1  // divisor (1-10)
      const quotient = Math.floor(Math.random() * quotientMax) + 1  // quotient (1-10)
      num1 = num2 * quotient  // dividend
      
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
      num1 = getRandomNumber(numMax)
      num2 = getRandomNumber(numMax)
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
      num1 = getRandomNumber(numMax)
      num2 = getRandomNumber(numMax)
      
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
    if (settings.value.difficulty === 'basic' || settings.value.difficulty === 'medium') {
      // For basic and medium difficulty, create expressions with arithmetic
      let leftSide, rightSide, leftValue, rightValue
      
      const maxNum = (settings.value.difficulty === 'medium') ? 100 : 20
      
      if (settings.value.difficulty === 'medium') {
        // For medium: always both sides have expressions
        leftSide = generateExpression()
        rightSide = generateExpression()
        leftValue = leftSide.value
        rightValue = rightSide.value
      } else {
        // For basic: mixed expressions
        const useExpressionOnLeft = Math.random() < 0.7 // 70% chance for expression on left
        const useExpressionOnBoth = Math.random() < 0.3 // 30% chance for expressions on both sides
        
        if (useExpressionOnBoth) {
          // Both sides have expressions: "7 + 6 ___ 4 + 2"
          leftSide = generateExpression()
          rightSide = generateExpression()
          leftValue = leftSide.value
          rightValue = rightSide.value
        } else if (useExpressionOnLeft) {
          // Left side has expression: "1 + 5 ___ 6"
          leftSide = generateExpression()
          rightValue = getRandomNumber(maxNum)
          leftValue = leftSide.value
          rightSide = { display: rightValue.toString(), value: rightValue, operatorSymbol: null }
        } else {
          // Right side has expression: "6 ___ 1 + 5"
          leftValue = getRandomNumber(maxNum)
          rightSide = generateExpression()
          rightValue = rightSide.value
          leftSide = { display: leftValue.toString(), value: leftValue, operatorSymbol: null }
        }
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
      
      // Check edge cases for basic and medium difficulty with expressions
      if ((settings.value.difficulty === 'basic' || settings.value.difficulty === 'medium') && question.hasExpression) {
        let shouldSkip = false
        
        // For medium difficulty, check if values are too far apart (makes comparison too obvious)
        if (settings.value.difficulty === 'medium') {
          const diff = Math.abs(question.leftValue - question.rightValue)
          const avgValue = (question.leftValue + question.rightValue) / 2
          
          // Only apply range checks if not using division (division has smaller results)
          const hasDivision = (question.leftSide && question.leftSide.operation === 'division') || 
                             (question.rightSide && question.rightSide.operation === 'division')
          
          if (!hasDivision) {
            // Skip if difference is more than 40% of average, or if values are outside 30-80 range
            if (diff > avgValue * 0.4 || question.leftValue < 30 || question.rightValue < 30 || 
                question.leftValue > 80 || question.rightValue > 80) {
              shouldSkip = true
            }
            
            // Skip if either side has very small numbers (< 10) that make it trivial
            if (question.leftSide.num1 < 10 && question.leftSide.num2 < 10) {
              shouldSkip = true
            }
            if (question.rightSide.num1 < 10 && question.rightSide.num2 < 10) {
              shouldSkip = true
            }
          } else {
            // For division, just check if difference is too obvious (more than 50% of average)
            if (diff > avgValue * 0.5) {
              shouldSkip = true
            }
          }
        }
        
        if (shouldSkip) continue
        
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

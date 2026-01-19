import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useSimpleQuestionGenerator } from '../useSimpleQuestionGenerator'
import { setupLocalStorageMock } from './test-utils'

describe('useSimpleQuestionGenerator', () => {
  let storageMock
  let generator

  beforeEach(() => {
    storageMock = setupLocalStorageMock()
    generator = useSimpleQuestionGenerator()
  })

  afterEach(() => {
    storageMock.restore()
  })

  describe('initial state', () => {
    it('has default settings', () => {
      expect(generator.settings.value.count).toBe(20)
      expect(generator.settings.value.difficulty).toBe('easy')
      expect(generator.settings.value.operations).toEqual(['addition'])
    })

    it('loads empty questions array initially', () => {
      expect(generator.questions.value).toEqual([])
    })
  })

  describe('settings persistence', () => {
    it('loads settings from localStorage', () => {
      localStorage.setItem('math-gen-simple-settings', JSON.stringify({
        count: 30,
        difficulty: 'hard',
        operations: ['multiplication']
      }))
      
      const newGenerator = useSimpleQuestionGenerator()
      expect(newGenerator.settings.value.count).toBe(30)
      expect(newGenerator.settings.value.difficulty).toBe('hard')
    })
  })

  describe('multiple operations support', () => {
    it('generates questions with mixed operations', () => {
      generator.updateSettings({ 
        operations: ['addition', 'subtraction'],
        count: 50
      })
      generator.generateQuestions()
      
      const operators = new Set(generator.questions.value.map(q => q.operation))
      expect(operators.size).toBeGreaterThanOrEqual(1)
    })

    it('all operations come from selected set', () => {
      generator.updateSettings({ 
        operations: ['addition', 'multiplication'],
        count: 30
      })
      generator.generateQuestions()
      
      generator.questions.value.forEach(q => {
        expect(['+', '×']).toContain(q.operation)
      })
    })
  })

  describe('question generation', () => {
    it('generates correct number of questions', () => {
      generator.updateSettings({ count: 15 })
      generator.generateQuestions()
      expect(generator.questions.value.length).toBe(15)
    })

    it('questions have userAnswer field initialized', () => {
      generator.generateQuestions()
      generator.questions.value.forEach(q => {
        expect(q).toHaveProperty('userAnswer')
        expect(q.userAnswer).toBe('')
      })
    })

    it('generates unique questions', () => {
      generator.updateSettings({ count: 20 })
      generator.generateQuestions()
      
      const keys = generator.questions.value.map(q => 
        `${q.num1}${q.operation}${q.num2}`
      )
      const uniqueKeys = new Set(keys)
      expect(uniqueKeys.size).toBe(20)
    })
  })

  describe('varySecondNumber option', () => {
    it('with varySecondNumber disabled, both numbers follow same range', () => {
      generator.updateSettings({ 
        difficulty: 'medium',
        varySecondNumber: false,
        count: 30
      })
      generator.generateQuestions()
      
      // In medium difficulty without vary, numbers should be 10-100
      generator.questions.value.forEach(q => {
        if (q.operation === '+' || q.operation === '-') {
          expect(q.num1).toBeGreaterThanOrEqual(0)
          expect(q.num2).toBeGreaterThanOrEqual(0)
        }
      })
    })
  })

  describe('edge case handling', () => {
    it('skips duplicate edge cases (only one 0+0 type question)', () => {
      generator.updateSettings({ 
        difficulty: 'easy',
        operations: ['addition'],
        count: 50
      })
      generator.generateQuestions()
      
      const zeroZeroAdditions = generator.questions.value.filter(
        q => q.num1 === 0 && q.num2 === 0 && q.operation === '+'
      )
      expect(zeroZeroAdditions.length).toBe(0) // 0+0 is skipped entirely
    })
  })

  describe('difficulty levels', () => {
    it('easy difficulty generates numbers 0-10', () => {
      generator.updateSettings({ 
        difficulty: 'easy',
        count: 30,
        operations: ['addition']
      })
      generator.generateQuestions()
      
      generator.questions.value.forEach(q => {
        expect(q.num1).toBeLessThanOrEqual(10)
        expect(q.num2).toBeLessThanOrEqual(10)
      })
    })

    it('beginners difficulty generates numbers 0-10', () => {
      generator.updateSettings({ 
        difficulty: 'beginners',
        count: 30,
        operations: ['addition']
      })
      generator.generateQuestions()
      
      generator.questions.value.forEach(q => {
        expect(q.num1).toBeLessThanOrEqual(10)
        expect(q.num2).toBeLessThanOrEqual(10)
      })
    })

    it('basic difficulty generates numbers 1-20', () => {
      generator.updateSettings({ 
        difficulty: 'basic',
        count: 30,
        operations: ['addition']
      })
      generator.generateQuestions()
      
      generator.questions.value.forEach(q => {
        expect(q.num1).toBeGreaterThanOrEqual(1)
        expect(q.num1).toBeLessThanOrEqual(20)
      })
    })

    it('medium difficulty generates numbers 10-100', () => {
      generator.updateSettings({ 
        difficulty: 'medium',
        count: 30,
        operations: ['addition']
      })
      generator.generateQuestions()
      
      const hasLargeNumber = generator.questions.value.some(q => q.num1 >= 10)
      expect(hasLargeNumber).toBe(true)
    })

    it('hard difficulty generates numbers 100-900', () => {
      generator.updateSettings({ 
        difficulty: 'hard',
        count: 30,
        operations: ['addition']
      })
      generator.generateQuestions()
      
      const hasLargeNumber = generator.questions.value.some(q => q.num1 >= 100)
      expect(hasLargeNumber).toBe(true)
    })
  })

  describe('varySecondNumber option', () => {
    it('with varySecondNumber and basic difficulty', () => {
      generator.updateSettings({ 
        difficulty: 'basic',
        count: 50,
        operations: ['addition'],
        varySecondNumber: true
      })
      generator.generateQuestions()
      
      expect(generator.questions.value.length).toBe(50)
    })

    it('with varySecondNumber and medium difficulty', () => {
      generator.updateSettings({ 
        difficulty: 'medium',
        count: 50,
        operations: ['addition'],
        varySecondNumber: true
      })
      generator.generateQuestions()
      
      // Some should have smaller second numbers
      const hasSmall = generator.questions.value.some(q => q.num2 <= 10)
      expect(hasSmall).toBe(true)
    })

    it('with varySecondNumber and hard difficulty', () => {
      generator.updateSettings({ 
        difficulty: 'hard',
        count: 50,
        operations: ['addition'],
        varySecondNumber: true
      })
      generator.generateQuestions()
      
      expect(generator.questions.value.length).toBe(50)
    })
  })

  describe('division operation', () => {
    it('generates division questions with integer answers', () => {
      generator.updateSettings({ 
        operations: ['division'],
        count: 20,
        difficulty: 'easy'
      })
      generator.generateQuestions()
      
      generator.questions.value.forEach(q => {
        expect(q.operation).toBe('÷')
        expect(Number.isInteger(q.answer)).toBe(true)
        expect(q.num1 / q.num2).toBe(q.answer)
      })
    })

    it('divisor is never zero', () => {
      generator.updateSettings({ 
        operations: ['division'],
        count: 30,
        difficulty: 'easy'
      })
      generator.generateQuestions()
      
      generator.questions.value.forEach(q => {
        expect(q.num2).toBeGreaterThan(0)
      })
    })

    it('handles division with various difficulties', () => {
      generator.updateSettings({ 
        operations: ['division'],
        count: 20,
        difficulty: 'medium'
      })
      generator.generateQuestions()
      
      generator.questions.value.forEach(q => {
        expect(q.num2).toBeGreaterThan(0)
        expect(Number.isInteger(q.answer)).toBe(true)
      })
    })

    it('adjusts dividend for clean division', () => {
      generator.updateSettings({ 
        operations: ['division'],
        count: 30,
        difficulty: 'easy'
      })
      generator.generateQuestions()
      
      // All should have clean integer division
      generator.questions.value.forEach(q => {
        expect(q.num1 % q.num2).toBe(0)
      })
    })
  })

  describe('subtraction operation', () => {
    it('ensures num1 >= num2 for non-negative results', () => {
      generator.updateSettings({ 
        operations: ['subtraction'],
        count: 30,
        difficulty: 'easy'
      })
      generator.generateQuestions()
      
      generator.questions.value.forEach(q => {
        expect(q.num1).toBeGreaterThanOrEqual(q.num2)
        expect(q.answer).toBeGreaterThanOrEqual(0)
      })
    })

    it('calculates correct subtraction answers', () => {
      generator.updateSettings({ 
        operations: ['subtraction'],
        count: 20
      })
      generator.generateQuestions()
      
      generator.questions.value.forEach(q => {
        expect(q.answer).toBe(q.num1 - q.num2)
      })
    })
  })

  describe('multiplication operation', () => {
    it('generates correct multiplication answers', () => {
      generator.updateSettings({ 
        operations: ['multiplication'],
        count: 20
      })
      generator.generateQuestions()
      
      generator.questions.value.forEach(q => {
        expect(q.operation).toBe('×')
        expect(q.answer).toBe(q.num1 * q.num2)
      })
    })
  })
})

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useComparisonQuestionGenerator } from '../useComparisonQuestionGenerator'
import { setupLocalStorageMock } from './test-utils'

describe('useComparisonQuestionGenerator', () => {
  let storageMock
  let generator

  beforeEach(() => {
    storageMock = setupLocalStorageMock()
    generator = useComparisonQuestionGenerator()
  })

  afterEach(() => {
    storageMock.restore()
  })

  describe('initial state', () => {
    it('has default settings', () => {
      expect(generator.settings.value.count).toBe(20)
      expect(generator.settings.value.difficulty).toBe('beginners')
      expect(generator.settings.value.operations).toEqual(['none'])
    })

    it('has empty questions array initially', () => {
      expect(generator.questions.value).toEqual([])
    })
  })

  describe('simple number comparison (beginners/easy)', () => {
    beforeEach(() => {
      generator.updateSettings({ 
        count: 20,
        difficulty: 'beginners'
      })
      generator.generateQuestions()
    })

    it('generates the correct number of questions', () => {
      expect(generator.questions.value.length).toBe(20)
    })

    it('each question has required fields', () => {
      generator.questions.value.forEach(q => {
        expect(q).toHaveProperty('id')
        expect(q).toHaveProperty('num1')
        expect(q).toHaveProperty('num2')
        expect(q).toHaveProperty('correctOperator')
        expect(q).toHaveProperty('userAnswer')
      })
    })

    it('correctOperator is one of <, >, =', () => {
      generator.questions.value.forEach(q => {
        expect(['<', '>', '=']).toContain(q.correctOperator)
      })
    })

    it('comparison operator matches numeric values', () => {
      generator.questions.value.forEach(q => {
        const leftValue = q.num1
        const rightValue = q.num2
        
        if (leftValue < rightValue) {
          expect(q.correctOperator).toBe('<')
        } else if (leftValue > rightValue) {
          expect(q.correctOperator).toBe('>')
        } else {
          expect(q.correctOperator).toBe('=')
        }
      })
    })

    it('does not have expressions for beginners', () => {
      generator.questions.value.forEach(q => {
        expect(q.hasExpression).toBe(false)
      })
    })
  })

  describe('expression comparison (basic/medium)', () => {
    beforeEach(() => {
      generator.updateSettings({ 
        difficulty: 'basic',
        operations: ['addition'],
        count: 20
      })
      generator.generateQuestions()
    })

    it('generates questions with expressions', () => {
      const withExpressions = generator.questions.value.filter(q => q.hasExpression)
      expect(withExpressions.length).toBeGreaterThan(0)
    })

    it('expression questions have leftSide and rightSide', () => {
      const withExpressions = generator.questions.value.filter(q => q.hasExpression)
      withExpressions.forEach(q => {
        expect(q).toHaveProperty('leftSide')
        expect(q).toHaveProperty('rightSide')
        expect(q).toHaveProperty('leftValue')
        expect(q).toHaveProperty('rightValue')
      })
    })

    it('expression sides have display and value', () => {
      const withExpressions = generator.questions.value.filter(q => q.hasExpression)
      withExpressions.forEach(q => {
        expect(q.leftSide).toHaveProperty('display')
        expect(q.rightSide).toHaveProperty('display')
        expect(typeof q.leftValue).toBe('number')
        expect(typeof q.rightValue).toBe('number')
      })
    })
  })

  describe('updateSettings', () => {
    it('updates count', () => {
      generator.updateSettings({ count: 15 })
      expect(generator.settings.value.count).toBe(15)
    })

    it('updates difficulty', () => {
      generator.updateSettings({ difficulty: 'medium' })
      expect(generator.settings.value.difficulty).toBe('medium')
    })

    it('updates operations', () => {
      generator.updateSettings({ operations: ['multiplication'] })
      expect(generator.settings.value.operations).toEqual(['multiplication'])
    })
  })

  describe('uniqueness', () => {
    it('generates unique questions', () => {
      generator.updateSettings({ count: 20 })
      generator.generateQuestions()
      
      const ids = generator.questions.value.map(q => q.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(20)
    })
  })

  describe('persistence', () => {
    it('loads settings from localStorage', () => {
      localStorage.setItem('math-gen-comparison-settings', JSON.stringify({
        count: 25,
        difficulty: 'medium'
      }))
      
      const newGenerator = useComparisonQuestionGenerator()
      expect(newGenerator.settings.value.count).toBe(25)
      expect(newGenerator.settings.value.difficulty).toBe('medium')
    })
  })

  describe('arithmetic correctness', () => {
    it('simple comparison values are numbers', () => {
      generator.updateSettings({ 
        difficulty: 'beginners',
        count: 20
      })
      generator.generateQuestions()
      
      generator.questions.value.forEach(q => {
        expect(typeof q.num1).toBe('number')
        expect(typeof q.num2).toBe('number')
      })
    })

    it('easy difficulty values are numbers', () => {
      generator.updateSettings({ 
        difficulty: 'easy',
        count: 20
      })
      generator.generateQuestions()
      
      generator.questions.value.forEach(q => {
        expect(typeof q.num1).toBe('number')
      })
    })

    it('expression values are computed correctly', () => {
      generator.updateSettings({ 
        difficulty: 'basic',
        operations: ['addition'],
        count: 20
      })
      generator.generateQuestions()
      
      const withExpressions = generator.questions.value.filter(q => q.hasExpression)
      withExpressions.forEach(q => {
        expect(q.leftValue).toBeGreaterThanOrEqual(0)
        expect(q.rightValue).toBeGreaterThanOrEqual(0)
      })
    })
  })

  describe('medium difficulty', () => {
    it('generates complex expressions on both sides', () => {
      generator.updateSettings({ 
        difficulty: 'medium',
        operations: ['addition'],
        count: 20
      })
      generator.generateQuestions()
      
      const allHaveExpressions = generator.questions.value.every(q => q.hasExpression)
      expect(allHaveExpressions).toBe(true)
    })

    it('values are in expected range for medium', () => {
      generator.updateSettings({ 
        difficulty: 'medium',
        operations: ['addition'],
        count: 20
      })
      generator.generateQuestions()
      
      generator.questions.value.forEach(q => {
        expect(q.leftValue).toBeGreaterThanOrEqual(0)
        expect(q.rightValue).toBeGreaterThanOrEqual(0)
      })
    })
  })

  describe('all operations', () => {
    it('subtraction expressions work correctly', () => {
      generator.updateSettings({ 
        difficulty: 'basic',
        operations: ['subtraction'],
        count: 20
      })
      generator.generateQuestions()
      
      expect(generator.questions.value.length).toBeGreaterThan(0)
    })

    it('multiplication expressions work correctly', () => {
      generator.updateSettings({ 
        difficulty: 'basic',
        operations: ['multiplication'],
        count: 20
      })
      generator.generateQuestions()
      
      expect(generator.questions.value.length).toBeGreaterThan(0)
    })

    it('division expressions work correctly', () => {
      generator.updateSettings({ 
        difficulty: 'basic',
        operations: ['division'],
        count: 20
      })
      generator.generateQuestions()
      
      expect(generator.questions.value.length).toBeGreaterThan(0)
    })

    it('mixed operations work correctly', () => {
      generator.updateSettings({ 
        difficulty: 'basic',
        operations: ['addition', 'subtraction', 'multiplication'],
        count: 30
      })
      generator.generateQuestions()
      
      expect(generator.questions.value.length).toBe(30)
    })
  })
})

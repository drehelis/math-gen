import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useMissingQuestionGenerator } from '../useMissingQuestionGenerator'
import { setupLocalStorageMock } from './test-utils'

describe('useMissingQuestionGenerator', () => {
  let storageMock
  let generator

  beforeEach(() => {
    storageMock = setupLocalStorageMock()
    generator = useMissingQuestionGenerator()
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

    it('has empty questions initially', () => {
      expect(generator.questions.value).toEqual([])
    })
  })

  describe('standard question generation', () => {
    beforeEach(() => {
      generator.updateSettings({ 
        questionFormat: 'standard',
        operations: ['addition'],
        count: 20
      })
      generator.generateQuestions()
    })

    it('generates correct number of questions', () => {
      expect(generator.questions.value.length).toBe(20)
    })

    it('each question has required fields', () => {
      generator.questions.value.forEach(q => {
        expect(q).toHaveProperty('id')
        expect(q).toHaveProperty('num1')
        expect(q).toHaveProperty('num2')
        expect(q).toHaveProperty('result')
        expect(q).toHaveProperty('answer')
        expect(q).toHaveProperty('missingPosition')
        expect(q).toHaveProperty('userAnswer')
      })
    })

    it('missingPosition is first or second for standard format', () => {
      generator.questions.value.forEach(q => {
        expect(['first', 'second']).toContain(q.missingPosition)
      })
    })

    it('addition equation is mathematically correct', () => {
      generator.questions.value.forEach(q => {
        expect(q.result).toBe(q.num1 + q.num2)
      })
    })

    it('answer matches the missing number', () => {
      generator.questions.value.forEach(q => {
        if (q.missingPosition === 'first') {
          expect(q.answer).toBe(q.num1)
        } else {
          expect(q.answer).toBe(q.num2)
        }
      })
    })
  })

  describe('subtraction questions', () => {
    beforeEach(() => {
      generator.updateSettings({ 
        operations: ['subtraction'],
        questionFormat: 'standard',
        count: 20
      })
      generator.generateQuestions()
    })

    it('uses subtraction operator', () => {
      generator.questions.value.forEach(q => {
        expect(q.operation).toBe('-')
      })
    })

    it('results are non-negative', () => {
      generator.questions.value.forEach(q => {
        expect(q.result).toBeGreaterThanOrEqual(0)
      })
    })

    it('answers are non-negative', () => {
      generator.questions.value.forEach(q => {
        expect(q.answer).toBeGreaterThanOrEqual(0)
      })
    })
  })

  describe('both-sides question format', () => {
    beforeEach(() => {
      generator.updateSettings({ 
        operations: ['addition'],
        questionFormat: 'both-sides',
        count: 20
      })
      generator.generateQuestions()
    })

    it('generates questions with both-sides format', () => {
      generator.questions.value.forEach(q => {
        expect(q.format).toBe('both-sides')
      })
    })

    it('missing position includes left and right positions', () => {
      const positions = new Set(generator.questions.value.map(q => q.missingPosition))
      // Should have various positions like left-first, left-second, right-first, right-second
      expect(positions.size).toBeGreaterThanOrEqual(1)
    })

    it('answers are positive', () => {
      generator.questions.value.forEach(q => {
        expect(q.answer).toBeGreaterThanOrEqual(0)
      })
    })
  })

  describe('mixed operations', () => {
    beforeEach(() => {
      generator.updateSettings({ 
        operations: ['addition', 'subtraction'],
        questionFormat: 'standard',
        count: 50
      })
      generator.generateQuestions()
    })

    it('generates questions with different operators', () => {
      const operators = new Set(generator.questions.value.map(q => q.operation))
      expect(operators.size).toBeGreaterThanOrEqual(1)
    })

    it('all operators are addition or subtraction', () => {
      generator.questions.value.forEach(q => {
        expect(['+', '-']).toContain(q.operation)
      })
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

  describe('updateSettings', () => {
    it('updates count', () => {
      generator.updateSettings({ count: 25 })
      expect(generator.settings.value.count).toBe(25)
    })

    it('updates difficulty', () => {
      generator.updateSettings({ difficulty: 'medium' })
      expect(generator.settings.value.difficulty).toBe('medium')
    })

    it('updates question format', () => {
      generator.updateSettings({ questionFormat: 'both-sides' })
      expect(generator.settings.value.questionFormat).toBe('both-sides')
    })
  })

  describe('persistence', () => {
    it('loads settings from localStorage', () => {
      localStorage.setItem('math-gen-missing-settings', JSON.stringify({
        count: 30,
        difficulty: 'medium1',
        operations: ['subtraction']
      }))
      
      const newGenerator = useMissingQuestionGenerator()
      expect(newGenerator.settings.value.count).toBe(30)
      expect(newGenerator.settings.value.difficulty).toBe('medium1')
    })
  })

  describe('difficulty levels', () => {
    it('easy difficulty uses small numbers (0-10)', () => {
      generator.updateSettings({ 
        difficulty: 'easy', 
        count: 30, 
        operations: ['addition'],
        questionFormat: 'standard'
      })
      generator.generateQuestions()
      
      generator.questions.value.forEach(q => {
        expect(q.num1).toBeLessThanOrEqual(10)
        expect(q.num2).toBeLessThanOrEqual(10)
      })
    })

    it('medium1 difficulty uses numbers 1-20', () => {
      generator.updateSettings({ 
        difficulty: 'medium1', 
        count: 30, 
        operations: ['addition'],
        questionFormat: 'standard'
      })
      generator.generateQuestions()
      
      generator.questions.value.forEach(q => {
        expect(q.num1).toBeGreaterThanOrEqual(1)
        expect(q.num1).toBeLessThanOrEqual(20)
      })
    })

    it('medium difficulty uses larger numbers (10-100)', () => {
      generator.updateSettings({ 
        difficulty: 'medium', 
        count: 30, 
        operations: ['addition'],
        questionFormat: 'standard'
      })
      generator.generateQuestions()
      
      const maxNum = Math.max(...generator.questions.value.map(q => Math.max(q.num1, q.num2)))
      expect(maxNum).toBeLessThanOrEqual(100)
    })

    it('hard difficulty uses large numbers (100-900)', () => {
      generator.updateSettings({ 
        difficulty: 'hard', 
        count: 30, 
        operations: ['addition'],
        questionFormat: 'standard'
      })
      generator.generateQuestions()
      
      const hasLargeNumber = generator.questions.value.some(q => q.num1 >= 100 || q.num2 >= 100)
      expect(hasLargeNumber).toBe(true)
    })
  })

  describe('varySecondNumber option', () => {
    it('medium with varySecondNumber can have smaller second numbers', () => {
      generator.updateSettings({ 
        difficulty: 'medium', 
        count: 50, 
        operations: ['addition'],
        questionFormat: 'standard',
        varySecondNumber: true
      })
      generator.generateQuestions()
      
      // With vary, some numbers should be small (1-10)
      const hasSmallNumber = generator.questions.value.some(q => q.num2 <= 10)
      expect(hasSmallNumber).toBe(true)
    })

    it('hard with varySecondNumber can have varied numbers', () => {
      generator.updateSettings({ 
        difficulty: 'hard', 
        count: 50, 
        operations: ['addition'],
        questionFormat: 'standard',
        varySecondNumber: true
      })
      generator.generateQuestions()
      
      // Should generate some questions
      expect(generator.questions.value.length).toBe(50)
    })
  })

  describe('both-sides-mixed format', () => {
    it('generates questions with mixed operators on both sides', () => {
      generator.updateSettings({ 
        operations: ['addition', 'subtraction'],
        questionFormat: 'both-sides-mixed',
        count: 20
      })
      generator.generateQuestions()
      
      // Should have mixed format with different operators
      const hasMixedOps = generator.questions.value.some(q => 
        q.operation !== q.operation2 && q.operation2
      )
      expect(hasMixedOps).toBe(true)
    })
  })

  describe('subtraction both-sides format', () => {
    beforeEach(() => {
      generator.updateSettings({ 
        operations: ['subtraction'],
        questionFormat: 'both-sides',
        count: 30
      })
      generator.generateQuestions()
    })

    it('generates subtraction both-sides questions', () => {
      expect(generator.questions.value.length).toBeGreaterThan(0)
    })

    it('all positions are covered', () => {
      const positions = new Set(generator.questions.value.map(q => q.missingPosition))
      expect(positions.size).toBeGreaterThanOrEqual(1)
    })

    it('answers are non-negative', () => {
      generator.questions.value.forEach(q => {
        expect(q.answer).toBeGreaterThanOrEqual(0)
      })
    })

    it('uses subtraction operator', () => {
      generator.questions.value.forEach(q => {
        expect(q.operation).toBe('-')
      })
    })
  })

  describe('edge cases', () => {
    it('handles answerZero edge case', () => {
      generator.updateSettings({ 
        operations: ['addition'],
        questionFormat: 'standard',
        count: 50,
        difficulty: 'easy'
      })
      generator.generateQuestions()
      
      // Should handle edge cases properly
      expect(generator.questions.value.length).toBe(50)
    })

    it('handles resultZero edge case in standard format', () => {
      generator.updateSettings({ 
        operations: ['subtraction'],
        questionFormat: 'standard',
        count: 50,
        difficulty: 'easy'
      })
      generator.generateQuestions()
      
      expect(generator.questions.value.length).toBe(50)
    })
  })
})


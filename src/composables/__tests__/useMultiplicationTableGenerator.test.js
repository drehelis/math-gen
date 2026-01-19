import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useMultiplicationTableGenerator } from '../useMultiplicationTableGenerator'
import { setupLocalStorageMock } from './test-utils'

describe('useMultiplicationTableGenerator', () => {
  let storageMock
  let generator

  beforeEach(() => {
    storageMock = setupLocalStorageMock()
    generator = useMultiplicationTableGenerator()
  })

  afterEach(() => {
    storageMock.restore()
  })

  describe('initial state', () => {
    it('has default settings', () => {
      expect(generator.settings.value.showAnswers).toBe(false)
      expect(generator.settings.value.prefillPercentage).toBe(0)
      expect(generator.settings.value.tableSize).toBe(10)
    })

    it('has empty userAnswers initially', () => {
      expect(generator.userAnswers.value).toEqual({})
    })
  })

  describe('getAnswer', () => {
    it('returns correct product for any cell', () => {
      expect(generator.getAnswer(3, 4)).toBe(12)
      expect(generator.getAnswer(7, 8)).toBe(56)
      expect(generator.getAnswer(1, 1)).toBe(1)
      expect(generator.getAnswer(10, 10)).toBe(100)
    })

    it('handles edge cases', () => {
      expect(generator.getAnswer(0, 5)).toBe(0)
      expect(generator.getAnswer(1, 0)).toBe(0)
    })
  })

  describe('getUserAnswer / setUserAnswer', () => {
    it('returns empty string for unanswered cells', () => {
      expect(generator.getUserAnswer(3, 4)).toBe('')
    })

    it('stores and retrieves user answers', () => {
      generator.setUserAnswer(3, 4, '12')
      expect(generator.getUserAnswer(3, 4)).toBe('12')
    })

    it('overwrites previous answers', () => {
      generator.setUserAnswer(3, 4, '10')
      generator.setUserAnswer(3, 4, '12')
      expect(generator.getUserAnswer(3, 4)).toBe('12')
    })

    it('removes answer when set to empty string', () => {
      generator.setUserAnswer(3, 4, '12')
      generator.setUserAnswer(3, 4, '')
      expect(generator.getUserAnswer(3, 4)).toBe('')
    })

    it('different cells are independent', () => {
      generator.setUserAnswer(3, 4, '12')
      generator.setUserAnswer(5, 6, '30')
      expect(generator.getUserAnswer(3, 4)).toBe('12')
      expect(generator.getUserAnswer(5, 6)).toBe('30')
    })
  })

  describe('clearAllAnswers', () => {
    it('clears all user answers', () => {
      generator.setUserAnswer(3, 4, '12')
      generator.setUserAnswer(5, 6, '30')
      generator.setUserAnswer(7, 8, '56')
      
      generator.clearAllAnswers()
      
      expect(generator.getUserAnswer(3, 4)).toBe('')
      expect(generator.getUserAnswer(5, 6)).toBe('')
      expect(generator.getUserAnswer(7, 8)).toBe('')
    })
  })

  describe('generateQuestions with prefill', () => {
    it('clears existing answers on generate', () => {
      generator.setUserAnswer(3, 4, '12')
      generator.generateQuestions()
      expect(generator.getUserAnswer(3, 4)).toBe('')
    })

    it('prefills correct percentage of cells', () => {
      generator.updateSettings({ prefillPercentage: 50, tableSize: 10 })
      generator.generateQuestions()
      
      const totalCells = 100 // 10x10
      const filledCells = Object.keys(generator.userAnswers.value).length
      const expectedFilled = Math.floor(totalCells * 0.5)
      
      expect(filledCells).toBe(expectedFilled)
    })

    it('prefilled answers are correct', () => {
      generator.updateSettings({ prefillPercentage: 100, tableSize: 5 })
      generator.generateQuestions()
      
      for (let row = 1; row <= 5; row++) {
        for (let col = 1; col <= 5; col++) {
          const userAnswer = generator.getUserAnswer(row, col)
          const correctAnswer = generator.getAnswer(row, col)
          expect(parseInt(userAnswer)).toBe(correctAnswer)
        }
      }
    })

    it('with 0% prefill, no cells are filled', () => {
      generator.updateSettings({ prefillPercentage: 0, tableSize: 10 })
      generator.generateQuestions()
      
      expect(Object.keys(generator.userAnswers.value).length).toBe(0)
    })
  })

  describe('updateSettings', () => {
    it('updates table size', () => {
      generator.updateSettings({ tableSize: 12 })
      expect(generator.settings.value.tableSize).toBe(12)
    })

    it('updates prefill percentage', () => {
      generator.updateSettings({ prefillPercentage: 25 })
      expect(generator.settings.value.prefillPercentage).toBe(25)
    })

    it('preserves other settings when updating one', () => {
      generator.updateSettings({ tableSize: 12 })
      expect(generator.settings.value.prefillPercentage).toBe(0)
    })
  })

  describe('settings persistence', () => {
    it('loads settings from localStorage', () => {
      localStorage.setItem('math-gen-table-settings', JSON.stringify({
        tableSize: 12,
        prefillPercentage: 30
      }))
      
      const newGenerator = useMultiplicationTableGenerator()
      expect(newGenerator.settings.value.tableSize).toBe(12)
      expect(newGenerator.settings.value.prefillPercentage).toBe(30)
    })

    it('loads user answers from localStorage', () => {
      localStorage.setItem('math-gen-table-answers', JSON.stringify({
        '3-4': '12',
        '5-6': '30'
      }))
      
      const newGenerator = useMultiplicationTableGenerator()
      expect(newGenerator.getUserAnswer(3, 4)).toBe('12')
      expect(newGenerator.getUserAnswer(5, 6)).toBe('30')
    })
  })
})

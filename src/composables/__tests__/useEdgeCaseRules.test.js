import { describe, it, expect } from 'vitest'
import { edgeCaseRules, checkEdgeCases } from '../useEdgeCaseRules'

describe('edgeCaseRules', () => {
  describe('division rules', () => {
    it('detects zero division (0 ÷ x)', () => {
      const rule = edgeCaseRules.find(r => r.key === 'zeroDivision')
      expect(rule.check({ num1: 0, num2: 5, operation: '÷' })).toBe(true)
      expect(rule.check({ num1: 5, num2: 0, operation: '÷' })).toBe(false)
    })

    it('detects divide by one (x ÷ 1)', () => {
      const rule = edgeCaseRules.find(r => r.key === 'divideByOne')
      expect(rule.check({ num1: 10, num2: 1, operation: '÷' })).toBe(true)
      expect(rule.check({ num1: 10, num2: 2, operation: '÷' })).toBe(false)
    })

    it('detects self division (x ÷ x)', () => {
      const rule = edgeCaseRules.find(r => r.key === 'oneDivision')
      expect(rule.check({ num1: 5, num2: 5, operation: '÷' })).toBe(true)
      expect(rule.check({ num1: 5, num2: 3, operation: '÷' })).toBe(false)
    })

    it('works with operatorSymbol alternative', () => {
      const rule = edgeCaseRules.find(r => r.key === 'zeroDivision')
      expect(rule.check({ num1: 0, num2: 5, operatorSymbol: '÷' })).toBe(true)
    })
  })

  describe('multiplication rules', () => {
    it('skips 0 × 0', () => {
      const rule = edgeCaseRules.find(r => r.key === 'zeroZeroMultiplication')
      expect(rule.check({ num1: 0, num2: 0, operation: '×' })).toBe(true)
      expect(rule.skip).toBe(true)
    })

    it('detects zero multiplication (0 × x or x × 0)', () => {
      const rule = edgeCaseRules.find(r => r.key === 'zeroMultiplication')
      expect(rule.check({ num1: 0, num2: 5, operation: '×' })).toBe(true)
      expect(rule.check({ num1: 5, num2: 0, operation: '×' })).toBe(true)
      expect(rule.check({ num1: 5, num2: 3, operation: '×' })).toBe(false)
    })

    it('detects one multiplication (1 × x or x × 1)', () => {
      const rule = edgeCaseRules.find(r => r.key === 'oneMultiplication')
      expect(rule.check({ num1: 1, num2: 5, operation: '×' })).toBe(true)
      expect(rule.check({ num1: 5, num2: 1, operation: '×' })).toBe(true)
      expect(rule.check({ num1: 5, num2: 3, operation: '×' })).toBe(false)
    })
  })

  describe('addition rules', () => {
    it('skips 0 + 0', () => {
      const rule = edgeCaseRules.find(r => r.key === 'zeroZeroAddition')
      expect(rule.check({ num1: 0, num2: 0, operation: '+' })).toBe(true)
      expect(rule.skip).toBe(true)
    })

    it('detects zero addition (0 + x or x + 0)', () => {
      const rule = edgeCaseRules.find(r => r.key === 'zeroAddition')
      expect(rule.check({ num1: 0, num2: 5, operation: '+' })).toBe(true)
      expect(rule.check({ num1: 5, num2: 0, operation: '+' })).toBe(true)
    })

    it('detects one addition (1 + x or x + 1)', () => {
      const rule = edgeCaseRules.find(r => r.key === 'oneAddition')
      expect(rule.check({ num1: 1, num2: 5, operation: '+' })).toBe(true)
      expect(rule.check({ num1: 5, num2: 1, operation: '+' })).toBe(true)
    })
  })

  describe('subtraction rules', () => {
    it('skips 0 - 0', () => {
      const rule = edgeCaseRules.find(r => r.key === 'zeroZeroSubtraction')
      expect(rule.check({ num1: 0, num2: 0, operation: '-' })).toBe(true)
      expect(rule.skip).toBe(true)
    })

    it('detects subtracting zero (x - 0)', () => {
      const rule = edgeCaseRules.find(r => r.key === 'zeroSubtraction')
      expect(rule.check({ num1: 5, num2: 0, operation: '-' })).toBe(true)
      expect(rule.check({ num1: 5, num2: 3, operation: '-' })).toBe(false)
    })

    it('detects subtracting one (x - 1)', () => {
      const rule = edgeCaseRules.find(r => r.key === 'oneSubtraction')
      expect(rule.check({ num1: 5, num2: 1, operation: '-' })).toBe(true)
    })

    it('detects equal subtraction (x - x)', () => {
      const rule = edgeCaseRules.find(r => r.key === 'equalSubtraction')
      expect(rule.check({ num1: 5, num2: 5, operation: '-' })).toBe(true)
      expect(rule.check({ num1: 0, num2: 0, operation: '-' })).toBe(false) // 0-0 handled separately
    })
  })
})

describe('checkEdgeCases', () => {
  it('returns shouldSkip: true for skip-flagged rules', () => {
    const tracker = {}
    const result = checkEdgeCases(
      { num1: 0, num2: 0, operation: '×' },
      ['multiplication'],
      tracker
    )
    expect(result.shouldSkip).toBe(true)
  })

  it('allows first occurrence of edge case', () => {
    const tracker = {}
    const result = checkEdgeCases(
      { num1: 0, num2: 5, operation: '÷' },
      ['division'],
      tracker
    )
    expect(result.shouldSkip).toBe(false)
    expect(tracker.zeroDivision).toBe(true)
  })

  it('skips second occurrence of same edge case', () => {
    const tracker = { zeroDivision: true }
    const result = checkEdgeCases(
      { num1: 0, num2: 3, operation: '÷' },
      ['division'],
      tracker
    )
    expect(result.shouldSkip).toBe(true)
  })

  it('ignores rules for operations not in availableOperations', () => {
    const tracker = {}
    const result = checkEdgeCases(
      { num1: 0, num2: 5, operation: '÷' },
      ['addition'], // division not available
      tracker
    )
    expect(result.shouldSkip).toBe(false)
    expect(tracker.zeroDivision).toBeUndefined()
  })

  it('allows different edge cases independently', () => {
    const tracker = {}
    
    // First: zero division
    checkEdgeCases({ num1: 0, num2: 5, operation: '÷' }, ['division'], tracker)
    expect(tracker.zeroDivision).toBe(true)
    
    // Second: divide by one (different edge case)
    const result = checkEdgeCases(
      { num1: 10, num2: 1, operation: '÷' },
      ['division'],
      tracker
    )
    expect(result.shouldSkip).toBe(false)
    expect(tracker.divideByOne).toBe(true)
  })
})

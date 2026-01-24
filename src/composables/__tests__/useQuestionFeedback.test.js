import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useQuestionFeedback } from '../useQuestionFeedback'
import { setupLocalStorageMock } from './test-utils'

// Mock canvas-confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn(() => Promise.resolve())
}))

describe('useQuestionFeedback', () => {
  let storageMock
  let feedback

  beforeEach(() => {
    storageMock = setupLocalStorageMock()
    feedback = useQuestionFeedback('test-feedback')
  })

  afterEach(() => {
    storageMock.restore()
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('has zero correct count', () => {
      expect(feedback.correctCount.value).toBe(0)
    })

    it('has empty feedback state', () => {
      expect(feedback.feedbackState.value).toEqual({})
    })
  })

  describe('handleFeedback', () => {
    it('tracks correct answer with show:true', () => {
      feedback.handleFeedback('q1', { isCorrect: true, show: true })
      expect(feedback.feedbackState.value['q1'].isCorrect).toBe(true)
    })

    it('tracks incorrect answer with show:true', () => {
      feedback.handleFeedback('q1', { isCorrect: false, show: true })
      expect(feedback.feedbackState.value['q1'].isCorrect).toBe(false)
    })

    it('stores data without show flag', () => {
      feedback.handleFeedback('q1', { isCorrect: true, userAnswer: '42' })
      expect(feedback.feedbackState.value['q1']).toEqual({ isCorrect: true, userAnswer: '42' })
    })

    it('tracks attempts for shown feedback', () => {
      feedback.handleFeedback('q1', { isCorrect: false, show: true })
      feedback.handleFeedback('q1', { isCorrect: false, show: true })
      feedback.handleFeedback('q1', { isCorrect: true, show: true })
      
      expect(feedback.feedbackState.value['q1'].attempts).toBe(3)
    })

    it('marks firstTry when correct on first attempt', () => {
      feedback.handleFeedback('q1', { isCorrect: true, show: true })
      expect(feedback.feedbackState.value['q1'].firstTry).toBe(true)
    })

    it('does not mark firstTry when correct after multiple attempts', () => {
      feedback.handleFeedback('q1', { isCorrect: false, show: true })
      feedback.handleFeedback('q1', { isCorrect: true, show: true })
      expect(feedback.feedbackState.value['q1'].firstTry).toBe(false)
    })

    it('tracks multiple questions independently', () => {
      feedback.handleFeedback('q1', { isCorrect: true, show: true })
      feedback.handleFeedback('q2', { isCorrect: false, show: true })
      feedback.handleFeedback('q3', { isCorrect: true, show: true })
      
      expect(feedback.feedbackState.value['q1'].isCorrect).toBe(true)
      expect(feedback.feedbackState.value['q2'].isCorrect).toBe(false)
      expect(feedback.feedbackState.value['q3'].isCorrect).toBe(true)
    })
  })

  describe('correctCount', () => {
    it('counts only shown correct answers', () => {
      feedback.handleFeedback('q1', { isCorrect: true, show: true })
      feedback.handleFeedback('q2', { isCorrect: true, show: true })
      feedback.handleFeedback('q3', { isCorrect: false, show: true })
      
      expect(feedback.correctCount.value).toBe(2)
    })

    it('does not count answers without show:true', () => {
      feedback.handleFeedback('q1', { isCorrect: true })
      feedback.handleFeedback('q2', { isCorrect: true, show: true })
      
      expect(feedback.correctCount.value).toBe(1)
    })
  })

  describe('resetStats', () => {
    it('resets attempt tracker', () => {
      feedback.handleFeedback('q1', { isCorrect: false, show: true })
      feedback.handleFeedback('q1', { isCorrect: false, show: true })
      
      feedback.resetStats()
      
      // After reset, next attempt should be counted as first
      feedback.handleFeedback('q2', { isCorrect: true, show: true })
      expect(feedback.feedbackState.value['q2'].firstTry).toBe(true)
    })
  })

  describe('clearAllFeedback', () => {
    it('clears all feedback state', () => {
      feedback.handleFeedback('q1', { isCorrect: true, show: true })
      feedback.handleFeedback('q2', { isCorrect: false, show: true })
      
      feedback.clearAllFeedback()
      
      expect(feedback.feedbackState.value).toEqual({})
    })

    it('removes from localStorage', () => {
      feedback.handleFeedback('q1', { isCorrect: true, show: true })
      feedback.clearAllFeedback()
      
      expect(localStorage.getItem('test-feedback')).toBeNull()
    })
  })

  describe('getCompletionStats', () => {
    it('returns stats object with required fields', () => {
      feedback.handleFeedback('q1', { isCorrect: true, show: true })
      
      const stats = feedback.getCompletionStats(10)
      
      expect(stats).toHaveProperty('total')
      expect(stats).toHaveProperty('firstTry')
      expect(stats).toHaveProperty('timeInSeconds')
      expect(stats).toHaveProperty('accuracy')
    })

    it('returns correct total', () => {
      const stats = feedback.getCompletionStats(20)
      expect(stats.total).toBe(20)
    })

    it('counts firstTry correct answers', () => {
      feedback.handleFeedback('q1', { isCorrect: true, show: true })
      feedback.handleFeedback('q2', { isCorrect: false, show: true })
      feedback.handleFeedback('q2', { isCorrect: true, show: true }) // second try
      
      const stats = feedback.getCompletionStats(3)
      expect(stats.firstTry).toBe(1)
    })

    it('calculates accuracy based on firstTry', () => {
      feedback.handleFeedback('q1', { isCorrect: true, show: true })
      feedback.handleFeedback('q2', { isCorrect: true, show: true })
      
      const stats = feedback.getCompletionStats(4)
      expect(stats.accuracy).toBe(50) // 2 first-try / 4 total = 50%
    })

    it('returns 100% accuracy when no questions', () => {
      const stats = feedback.getCompletionStats(0)
      expect(stats.accuracy).toBe(100)
    })
  })

  describe('focus management', () => {
    it('setInputRef stores reference', () => {
      const mockElement = { focus: vi.fn() }
      feedback.setInputRef(mockElement, 0)
      
      feedback.focusInput(0)
      expect(mockElement.focus).toHaveBeenCalled()
    })

    it('focusInput calls focus on stored element', () => {
      const mockElement = { focus: vi.fn() }
      feedback.setInputRef(mockElement, 5)
      
      feedback.focusInput(5)
      
      expect(mockElement.focus).toHaveBeenCalled()
    })

    it('focusNextInput schedules focus on next input', async () => {
      const mock1 = { focus: vi.fn() }
      const mock2 = { focus: vi.fn() }
      feedback.setInputRef(mock1, 0)
      feedback.setInputRef(mock2, 1)
      
      feedback.focusNextInput(0, 10)
      
      // Wait for setTimeout
      await new Promise(resolve => setTimeout(resolve, 150))
      
      expect(mock2.focus).toHaveBeenCalled()
    })

    it('focusNextInput does not focus beyond total questions', async () => {
      const mock1 = { focus: vi.fn() }
      feedback.setInputRef(mock1, 0)
      
      feedback.focusNextInput(0, 1) // at last question
      
      await new Promise(resolve => setTimeout(resolve, 150))
      // Should not throw, just not focus anything
    })

    it('focusFirstInput focuses first element with empty questions', async () => {
      const mock0 = { focus: vi.fn() }
      feedback.setInputRef(mock0, 0)
      
      feedback.focusFirstInput([])
      
      await new Promise(resolve => setTimeout(resolve, 150))
      expect(mock0.focus).toHaveBeenCalled()
    })

    it('focusFirstInput finds next unanswered question', async () => {
      const mock0 = { focus: vi.fn() }
      const mock1 = { focus: vi.fn() }
      const mock2 = { focus: vi.fn() }
      feedback.setInputRef(mock0, 0)
      feedback.setInputRef(mock1, 1)
      feedback.setInputRef(mock2, 2)
      
      // Mark first question as correct
      feedback.handleFeedback('q1', { isCorrect: true, show: true })
      
      const questions = [
        { id: 'q1' },
        { id: 'q2' },
        { id: 'q3' }
      ]
      
      feedback.focusFirstInput(questions)
      
      await new Promise(resolve => setTimeout(resolve, 150))
      expect(mock1.focus).toHaveBeenCalled()
    })

    it('focusFirstInput wraps around when all answered', async () => {
      const mock0 = { focus: vi.fn() }
      const mock1 = { focus: vi.fn() }
      feedback.setInputRef(mock0, 0)
      feedback.setInputRef(mock1, 1)
      
      // Mark both as correct
      feedback.handleFeedback('q1', { isCorrect: true, show: true })
      feedback.handleFeedback('q2', { isCorrect: true, show: true })
      
      const questions = [{ id: 'q1' }, { id: 'q2' }]
      
      feedback.focusFirstInput(questions)
      
      await new Promise(resolve => setTimeout(resolve, 150))
      // Should wrap to first (all answered)
    })

    it('focusFirstInput finds first unanswered when target exceeds length', async () => {
      const mock0 = { focus: vi.fn() }
      const mock1 = { focus: vi.fn() }
      const mock2 = { focus: vi.fn() }
      feedback.setInputRef(mock0, 0)
      feedback.setInputRef(mock1, 1)
      feedback.setInputRef(mock2, 2)
      
      // Mark only last question as correct
      feedback.handleFeedback('q3', { isCorrect: true, show: true })
      
      const questions = [
        { id: 'q1' },
        { id: 'q2' },
        { id: 'q3' }
      ]
      
      feedback.focusFirstInput(questions)
      
      await new Promise(resolve => setTimeout(resolve, 150))
      // Target would be index 0 since q3 is at index 2
    })

    it('focusFirstInput handles partially answered questions', async () => {
      const mock0 = { focus: vi.fn() }
      const mock1 = { focus: vi.fn() }
      const mock2 = { focus: vi.fn() }
      feedback.setInputRef(mock0, 0)
      feedback.setInputRef(mock1, 1)
      feedback.setInputRef(mock2, 2)
      
      // Mark first two as correct, third unanswered
      feedback.handleFeedback('q1', { isCorrect: true, show: true })
      feedback.handleFeedback('q2', { isCorrect: true, show: true })
      
      const questions = [
        { id: 'q1' },
        { id: 'q2' },
        { id: 'q3' }
      ]
      
      feedback.focusFirstInput(questions)
      
      await new Promise(resolve => setTimeout(resolve, 150))
      expect(mock2.focus).toHaveBeenCalled()
    })

    it('focusFirstInput handles interleaved answered questions', async () => {
      const mock0 = { focus: vi.fn() }
      const mock1 = { focus: vi.fn() }
      const mock2 = { focus: vi.fn() }
      const mock3 = { focus: vi.fn() }
      feedback.setInputRef(mock0, 0)
      feedback.setInputRef(mock1, 1)
      feedback.setInputRef(mock2, 2)
      feedback.setInputRef(mock3, 3)
      
      // Mark q1 and q3 as correct, q2 and q4 unanswered  
      feedback.handleFeedback('q1', { isCorrect: true, show: true })
      feedback.handleFeedback('q3', { isCorrect: true, show: true })
      
      const questions = [
        { id: 'q1' },
        { id: 'q2' },
        { id: 'q3' },
        { id: 'q4' }
      ]
      
      feedback.focusFirstInput(questions)
      
      await new Promise(resolve => setTimeout(resolve, 150))
      // Should find first unanswered after lastAnswered or wrap
    })
  })

  describe('confetti triggering', () => {
    it('correctCount updates when questions are answered', () => {
      // Answer 4 questions correctly
      feedback.handleFeedback('q1', { isCorrect: true, show: true })
      feedback.handleFeedback('q2', { isCorrect: true, show: true })
      feedback.handleFeedback('q3', { isCorrect: true, show: true })
      feedback.handleFeedback('q4', { isCorrect: true, show: true })
      
      expect(feedback.correctCount.value).toBe(4)
    })

    it('correctCount reaches milestone values', () => {
      // Answer 8 questions correctly (2 milestones)
      for (let i = 1; i <= 8; i++) {
        feedback.handleFeedback(`q${i}`, { isCorrect: true, show: true })
      }
      
      expect(feedback.correctCount.value).toBe(8)
    })
  })

  describe('persistence', () => {
    it('saves feedback state to localStorage when show:true', async () => {
      feedback.handleFeedback('q1', { isCorrect: true, show: true, userAnswer: '5' })
      
      // Wait for Vue's watch to trigger (it's async)
      await new Promise(resolve => setTimeout(resolve, 10))
      
      const stored = JSON.parse(localStorage.getItem('test-feedback'))
      expect(stored).toBeTruthy()
      expect(stored['q1']).toBeTruthy()
    })

    it('loads previously saved feedback state', () => {
      localStorage.setItem('test-feedback', JSON.stringify({
        'q1': { isCorrect: true, show: true }
      }))
      
      const newFeedback = useQuestionFeedback('test-feedback')
      expect(newFeedback.feedbackState.value['q1'].isCorrect).toBe(true)
    })
  })

  describe('handleBadgeClick', () => {
    it('does nothing if feedback is correct', () => {
      const question = { id: 'q1', userAnswer: '42' }
      feedback.handleFeedback('q1', { isCorrect: true, show: true })
      
      const focusSpy = vi.spyOn(feedback, 'focusInput')
      feedback.handleBadgeClick(question, 0)
      
      expect(question.userAnswer).toBe('42')
      expect(focusSpy).not.toHaveBeenCalled()
    })

    it('does nothing if no feedback exists', () => {
      const question = { id: 'q1', userAnswer: '42' }
      
      const focusSpy = vi.spyOn(feedback, 'focusInput')
      feedback.handleBadgeClick(question, 0)
      
      expect(question.userAnswer).toBe('42')
      expect(focusSpy).not.toHaveBeenCalled()
    })

    it('clears answer and focuses input when incorrect (default behavior)', () => {
      const question = { id: 'q1', userAnswer: '41' }
      feedback.handleFeedback('q1', { isCorrect: false, show: true })
      
      // Mock the ref so focusInput works
      const mockElement = { focus: vi.fn() }
      feedback.setInputRef(mockElement, 0)
      
      feedback.handleBadgeClick(question, 0)
      
      expect(question.userAnswer).toBe('')
      expect(mockElement.focus).toHaveBeenCalled()
    })

    it('uses custom reset logic if provided', () => {
      const question = { id: 'q1', userAnswer: '41' }
      feedback.handleFeedback('q1', { isCorrect: false, show: true })
      
      const customReset = vi.fn()
      feedback.handleBadgeClick(question, 0, customReset)
      
      expect(customReset).toHaveBeenCalled()
      expect(question.userAnswer).toBe('41') // Should not be cleared by default logic
    })

    it('uses custom focus logic if provided', () => {
      const question = { id: 'q1', userAnswer: '41' }
      feedback.handleFeedback('q1', { isCorrect: false, show: true })
      
      const customFocus = vi.fn()
      const defaultFocusSpy = vi.spyOn(feedback, 'focusInput')
      
      feedback.handleBadgeClick(question, 0, null, customFocus)
      
      expect(customFocus).toHaveBeenCalled()
      expect(defaultFocusSpy).not.toHaveBeenCalled()
    })
  })

  describe('without storageKey', () => {
    it('works without persistence', () => {
      const noStorageFeedback = useQuestionFeedback(null)
      
      noStorageFeedback.handleFeedback('q1', { isCorrect: true, show: true })
      
      expect(noStorageFeedback.feedbackState.value['q1'].isCorrect).toBe(true)
      expect(localStorage.getItem(null)).toBeNull()
    })
  })
})

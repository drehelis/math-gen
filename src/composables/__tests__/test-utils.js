/**
 * Test utilities for math-gen composables
 */

/**
 * Creates a mock localStorage for testing
 */
export function createLocalStorageMock() {
  let store = {}
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = String(value) },
    removeItem: (key) => { delete store[key] },
    clear: () => { store = {} },
    get length() { return Object.keys(store).length },
    key: (i) => Object.keys(store)[i] ?? null,
    // Test helper to inspect store
    _getStore: () => ({ ...store })
  }
}

/**
 * Creates a question object for testing
 */
export function createTestQuestion(overrides = {}) {
  return {
    id: `q-test-${Date.now()}-${Math.random()}`,
    num1: 5,
    num2: 3,
    answer: 8,
    operation: '+',
    userAnswer: '',
    ...overrides
  }
}

/**
 * Settings presets for different difficulties
 */
export const settingsPresets = {
  easy: {
    count: 10,
    difficulty: 'easy',
    operation: 'addition',
    operations: ['addition'],
    showAnswers: false
  },
  medium: {
    count: 20,
    difficulty: 'medium',
    operation: 'addition',
    operations: ['addition', 'subtraction'],
    showAnswers: false
  },
  hard: {
    count: 30,
    difficulty: 'hard',
    operation: 'multiplication',
    operations: ['multiplication', 'division'],
    showAnswers: false
  }
}

/**
 * Setup and teardown helpers for localStorage tests
 */
export function setupLocalStorageMock() {
  const mock = createLocalStorageMock()
  const original = globalThis.localStorage
  
  Object.defineProperty(globalThis, 'localStorage', {
    value: mock,
    writable: true,
    configurable: true
  })
  
  return {
    mock,
    restore: () => {
      Object.defineProperty(globalThis, 'localStorage', {
        value: original,
        writable: true,
        configurable: true
      })
    }
  }
}

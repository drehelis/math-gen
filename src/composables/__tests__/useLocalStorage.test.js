import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useLocalStorage } from '../useLocalStorage'
import { setupLocalStorageMock } from './test-utils'

describe('useLocalStorage', () => {
  let storageMock

  beforeEach(() => {
    storageMock = setupLocalStorageMock()
  })

  afterEach(() => {
    storageMock.restore()
  })

  describe('load()', () => {
    it('returns default value when key does not exist', () => {
      const storage = useLocalStorage('nonexistent', 'default')
      expect(storage.load()).toBe('default')
    })

    it('returns default value when key is empty', () => {
      const storage = useLocalStorage('empty-key', { count: 10 })
      expect(storage.load()).toEqual({ count: 10 })
    })

    it('parses and returns stored JSON object', () => {
      localStorage.setItem('test-object', JSON.stringify({ name: 'test', value: 42 }))
      const storage = useLocalStorage('test-object')
      expect(storage.load()).toEqual({ name: 'test', value: 42 })
    })

    it('parses and returns stored JSON array', () => {
      localStorage.setItem('test-array', JSON.stringify([1, 2, 3]))
      const storage = useLocalStorage('test-array')
      expect(storage.load()).toEqual([1, 2, 3])
    })

    it('returns null as default when no default provided', () => {
      const storage = useLocalStorage('nonexistent')
      expect(storage.load()).toBeNull()
    })

    it('returns default on JSON parse error', () => {
      localStorage.setItem('invalid-json', '{invalid json}')
      const storage = useLocalStorage('invalid-json', 'fallback')
      expect(storage.load()).toBe('fallback')
    })
  })

  describe('save()', () => {
    it('saves object as JSON string', () => {
      const storage = useLocalStorage('save-test')
      storage.save({ name: 'test', count: 5 })
      expect(localStorage.getItem('save-test')).toBe('{"name":"test","count":5}')
    })

    it('saves array as JSON string', () => {
      const storage = useLocalStorage('array-test')
      storage.save([1, 2, 3])
      expect(localStorage.getItem('array-test')).toBe('[1,2,3]')
    })

    it('saves primitive values', () => {
      const storage = useLocalStorage('primitive-test')
      storage.save(42)
      expect(localStorage.getItem('primitive-test')).toBe('42')
      
      storage.save('hello')
      expect(localStorage.getItem('primitive-test')).toBe('"hello"')
      
      storage.save(true)
      expect(localStorage.getItem('primitive-test')).toBe('true')
    })

    it('saves null value', () => {
      const storage = useLocalStorage('null-test')
      storage.save(null)
      expect(localStorage.getItem('null-test')).toBe('null')
    })
  })

  describe('remove()', () => {
    it('removes the key from storage', () => {
      localStorage.setItem('remove-test', '"value"')
      const storage = useLocalStorage('remove-test')
      
      storage.remove()
      
      expect(localStorage.getItem('remove-test')).toBeNull()
    })

    it('does not throw when removing nonexistent key', () => {
      const storage = useLocalStorage('nonexistent-key')
      expect(() => storage.remove()).not.toThrow()
    })
  })

  describe('integration', () => {
    it('can save and load the same data', () => {
      const storage = useLocalStorage('roundtrip')
      const data = { 
        settings: { difficulty: 'hard' },
        questions: [{ id: 1, answer: 42 }]
      }
      
      storage.save(data)
      expect(storage.load()).toEqual(data)
    })

    it('uses different keys independently', () => {
      const storage1 = useLocalStorage('key1', 'default1')
      const storage2 = useLocalStorage('key2', 'default2')
      
      storage1.save('value1')
      storage2.save('value2')
      
      expect(storage1.load()).toBe('value1')
      expect(storage2.load()).toBe('value2')
    })
  })
})

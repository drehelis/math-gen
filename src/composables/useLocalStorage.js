/**
 * Composable for localStorage operations with JSON serialization
 * @param {string} key - The localStorage key
 * @param {*} defaultValue - Default value if nothing is stored
 */
export function useLocalStorage(key, defaultValue = null) {
  const load = () => {
    try {
      const saved = localStorage.getItem(key)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (error) {
      console.error(`Failed to load ${key}:`, error)
    }
    return defaultValue
  }

  const save = (value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Failed to save ${key}:`, error)
    }
  }

  const remove = () => {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error(`Failed to remove ${key}:`, error)
    }
  }

  return { load, save, remove }
}

import { ref, watch } from "vue";
import { useLocalStorage } from "./useLocalStorage";

/**
 * A reactive ref that persists its value to localStorage
 * @param {string} key - localStorage key
 * @param {*} defaultValue - Initial value if nothing is saved
 * @returns {Ref} A Vue ref object
 */
export function usePersistentRef(key, defaultValue = null) {
  const storage = useLocalStorage(key, defaultValue);
  const data = ref(storage.load());

  watch(
    data,
    (newValue) => {
      storage.save(newValue);
    },
    { deep: true },
  );

  return data;
}

<template>
  <div class="relative" ref="dropdownRef">
    <button
      @click="toggleDropdown"
      class="w-full px-4 py-3 font-semibold rounded-2xl border-2 focus:outline-none transition-all flex items-center justify-between"
      :class="isOpen ? 'scale-105' : 'hover:scale-105'"
      :style="buttonStyle"
    >
      <span>{{ selectedLabel }}</span>
      <span class="text-xl transition-transform duration-300" :class="{ 'rotate-180': isOpen }">▼</span>
    </button>

    <transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="absolute z-50 w-full mt-2 rounded-2xl border-2 shadow-2xl overflow-hidden"
        :style="dropdownStyle"
      >
        <div
          v-for="option in options"
          :key="option.value"
          @click="selectOption(option)"
          class="px-4 py-3 font-semibold cursor-pointer transition-all hover:scale-105 hover:translate-x-1"
          :class="{ 'opacity-50': modelValue === option.value }"
          :style="optionStyle"
        >
          {{ option.label }}
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    required: true
  },
  options: {
    type: Array,
    required: true
  },
  borderColor: {
    type: String,
    default: 'var(--color-sunshine)'
  },
  backgroundColor: {
    type: String,
    default: 'var(--color-sunshine)'
  },
  textColor: {
    type: String,
    default: 'var(--color-deep)'
  }
})

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const dropdownRef = ref(null)

const selectedLabel = computed(() => {
  const option = props.options.find(opt => opt.value === props.modelValue)
  return option ? option.label : ''
})

const buttonStyle = computed(() => ({
  borderColor: props.borderColor,
  background: props.backgroundColor,
  color: props.textColor
}))

const dropdownStyle = computed(() => ({
  borderColor: props.borderColor,
  background: props.backgroundColor
}))

const optionStyle = computed(() => ({
  color: props.textColor
}))

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const selectOption = (option) => {
  emit('update:modelValue', option.value)
  isOpen.value = false
}

const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

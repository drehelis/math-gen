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
        <template v-for="option in options" :key="option.value">
          <!-- Parent option with children -->
          <div v-if="option.children">
            <div
              @click="toggleParent(option.value)"
              class="px-4 py-3 font-semibold cursor-pointer transition-all hover:scale-105 flex items-center justify-between"
              :class="[
                { 'opacity-50': modelValue === option.value },
                isRTL ? 'hover:-translate-x-1' : 'hover:translate-x-1'
              ]"
              :style="optionStyle"
            >
              <span>{{ option.label }}</span>
              <span class="text-sm transition-transform duration-200" :class="{ 'rotate-90': expandedParents[option.value] }">▶</span>
            </div>
            <!-- Nested children with slide animation -->
            <transition
              enter-active-class="transition-all duration-200 ease-out"
              enter-from-class="max-h-0 opacity-0"
              enter-to-class="max-h-96 opacity-100"
              leave-active-class="transition-all duration-200 ease-in"
              leave-from-class="max-h-96 opacity-100"
              leave-to-class="max-h-0 opacity-0"
            >
              <div v-if="expandedParents[option.value]" class="overflow-hidden">
                <div
                  v-for="child in option.children"
                  :key="child.value"
                  @click="selectOption(child)"
                  class="px-4 py-3 font-semibold cursor-pointer transition-all hover:scale-105"
                  :class="[
                    { 'opacity-50': modelValue === child.value },
                    isRTL ? 'pr-8 hover:-translate-x-1' : 'pl-8 hover:translate-x-1'
                  ]"
                  :style="{ ...optionStyle, opacity: modelValue === child.value ? '0.5' : '0.9' }"
                >
                  {{ child.label }}
                </div>
              </div>
            </transition>
          </div>
          <!-- Regular option without children -->
          <div
            v-else
            @click="selectOption(option)"
            class="px-4 py-3 font-semibold cursor-pointer transition-all hover:scale-105"
            :class="[
              { 'opacity-50': modelValue === option.value },
              isRTL ? 'hover:-translate-x-1' : 'hover:translate-x-1'
            ]"
            :style="optionStyle"
          >
            {{ option.label }}
          </div>
        </template>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, reactive } from 'vue'

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
const expandedParents = reactive({})

const isRTL = computed(() => {
  return document.documentElement.dir === 'rtl' || document.documentElement.getAttribute('lang') === 'he'
})

const selectedLabel = computed(() => {
  let option = props.options.find(opt => opt.value === props.modelValue)
  if (option) return option.label
  
  for (const parent of props.options) {
    if (parent.children) {
      const child = parent.children.find(c => c.value === props.modelValue)
      if (child) return child.label
    }
  }
  
  return ''
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

const toggleParent = (parentValue) => {
  expandedParents[parentValue] = !expandedParents[parentValue]
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

<template>
  <div class="flex gap-2 border-b-4 mb-8 justify-center" style="border-color: var(--color-deep);">
    <button
      v-for="tab in tabs"
      :key="tab.value"
      @click="$emit('update:modelValue', tab.value)"
      class="px-4 sm:px-8 py-3 font-bold text-base sm:text-lg rounded-t-2xl transition-all transform hover:scale-105 whitespace-nowrap"
      :class="modelValue === tab.value ? 'translate-y-1' : ''"
      :style="getTabStyle(tab.value)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    required: true
  },
  tabs: {
    type: Array,
    required: true
  }
})

defineEmits(['update:modelValue'])

const tabColors = {
  simple: 'var(--color-orange)',
  complex: 'var(--color-purple)'
}

const getTabStyle = (tabValue) => {
  const isActive = props.modelValue === tabValue
  const backgroundColor = tabColors[tabValue] || 'var(--color-sky)'

  return {
    background: backgroundColor,
    borderWidth: '4px 4px 0 4px',
    borderStyle: 'solid',
    borderColor: 'var(--color-deep)',
    color: 'white',
    marginBottom: '-4px',
    opacity: isActive ? '1' : '0.6'
  }
}
</script>

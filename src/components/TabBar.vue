<template>
  <!-- Mobile: Compact 2-column grid -->
  <div class="md:hidden mb-8 px-4">
    <div class="grid grid-cols-2 gap-3">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        class="px-4 py-3 font-bold text-sm rounded-xl transition-all"
        :style="getMobileTabStyle(tab.value)"
        @click="$emit('update:modelValue', tab.value)"
      >
        {{ tab.label }}
      </button>
    </div>
  </div>

  <!-- Desktop: Overlapping tabs -->
  <div
    class="hidden md:flex gap-0 border-b-4 mb-8 justify-center"
    style="border-color: var(--color-deep);"
  >
    <button
      v-for="tab in tabs"
      :key="tab.value"
      class="px-6 py-3 font-bold text-lg rounded-t-2xl transition-all whitespace-nowrap relative"
      :class="modelValue === tab.value ? 'z-10' : 'z-0'"
      :style="getTabStyle(tab.value)"
      @click="$emit('update:modelValue', tab.value)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<script setup>

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
  complex: 'var(--color-purple)',
  comparison: 'var(--color-mint)',
  table: 'var(--color-coral)'
}

const getMobileTabStyle = (tabValue) => {
  const isActive = props.modelValue === tabValue
  const backgroundColor = tabColors[tabValue] || 'var(--color-sky)'

  if (isActive) {
    return {
      background: backgroundColor,
      borderWidth: '4px',
      borderStyle: 'solid',
      borderColor: 'var(--color-deep)',
      color: 'white',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)'
    }
  } else {
    return {
      background: backgroundColor,
      borderWidth: '3px',
      borderStyle: 'solid',
      borderColor: 'var(--color-deep)',
      color: 'white',
      opacity: '0.5'
    }
  }
}

const getTabStyle = (tabValue) => {
  const isActive = props.modelValue === tabValue
  const backgroundColor = tabColors[tabValue] || 'var(--color-sky)'

  if (isActive) {
    return {
      background: backgroundColor,
      borderWidth: '4px 4px 0 4px',
      borderStyle: 'solid',
      borderColor: 'var(--color-deep)',
      color: 'white',
      marginBottom: '-4px',
      transform: 'scale(1.1) translateY(-4px)',
      marginLeft: '-0.75rem',
      marginRight: '-0.75rem',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
    }
  } else {
    return {
      background: backgroundColor,
      borderWidth: '4px 4px 0 4px',
      borderStyle: 'solid',
      borderColor: 'var(--color-deep)',
      color: 'white',
      marginBottom: '-4px',
      opacity: '0.65',
      transform: 'scale(0.88) translateY(0px)',
      marginLeft: '-0.0rem',
      marginRight: '-0.75rem'
    }
  }
}
</script>

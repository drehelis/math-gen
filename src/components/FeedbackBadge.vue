<template>
  <div
    class="absolute -top-3 -right-3 w-10 h-10 rounded-lg flex items-center justify-center font-bold border-4"
    :class="{ 'cursor-pointer hover:scale-110 transition-transform': !isCorrect }"
    :style="{
      backgroundColor: isCorrect ? '#15803d' : '#b91c1c',
      borderColor: 'var(--color-deep)',
      color: 'white'
    }"
    @click.stop="onClick"
  >
    <span class="text-xl">{{ isCorrect ? '✓' : '✗' }}</span>
  </div>
</template>

<script setup>
const props = defineProps({
  isCorrect: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['click'])

const onClick = () => {
  if (!props.isCorrect) {
    emit('click')
  }
}
</script>

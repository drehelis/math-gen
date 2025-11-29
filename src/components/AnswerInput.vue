<template>
  <span class="relative inline-block border-b-4 w-[4rem] sm:w-[4.5rem]" :style="{ borderColor: borderColor }">
    <input
      ref="inputElement"
      v-model="userAnswer"
      @input="validateAnswer"
      type="text"
      inputmode="numeric"
      maxlength="6"
      class="w-full bg-transparent text-center font-bold outline-none appearance-none px-0 leading-none border-0 focus:outline-none focus:ring-0 answer-input"
      :class="inputClasses"
      style="color: var(--color-deep);"
    />
  </span>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  correctAnswer: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['feedback', 'correctAnswer'])

const inputElement = ref(null)
const userAnswer = ref('')
const isCorrect = ref(false)
const showFeedback = ref(false)

const validateAnswer = () => {
  // Only allow digits and minus sign at the start
  const cleaned = userAnswer.value.replace(/[^\d-]/g, '')
  if (cleaned !== userAnswer.value) {
    userAnswer.value = cleaned
  }

  // Ensure minus sign only at start
  if (userAnswer.value.includes('-')) {
    const parts = userAnswer.value.split('-')
    userAnswer.value = '-' + parts.join('')
  }

  const answer = parseInt(userAnswer.value, 10)

  if (userAnswer.value === '' || isNaN(answer)) {
    showFeedback.value = false
    isCorrect.value = false
    emit('feedback', { show: false, isCorrect: false })
    return
  }

  showFeedback.value = true
  isCorrect.value = answer === props.correctAnswer
  emit('feedback', { show: true, isCorrect: isCorrect.value })

  if (isCorrect.value) {
    emit('correctAnswer')
  }
}

const feedbackIcon = computed(() => {
  return isCorrect.value ? '✔' : '✖'
})

const inputClasses = computed(() => {
  if (!showFeedback.value) return ''
  return isCorrect.value ? 'text-green-600' : 'text-red-600'
})

const feedbackColor = computed(() => {
  return isCorrect.value ? '#15803d' : '#b91c1c' // green-700 / red-700 - darker for better contrast
})

const borderColor = computed(() => {
  if (!showFeedback.value) return 'var(--color-deep)'
  return isCorrect.value ? '#15803d' : '#b91c1c'
})

// Reset when correctAnswer changes (new question set)
watch(() => props.correctAnswer, () => {
  userAnswer.value = ''
  isCorrect.value = false
  showFeedback.value = false
  emit('feedback', { show: false, isCorrect: false })
})

// Expose focus method for parent components
defineExpose({
  focus: () => {
    inputElement.value?.focus()
  }
})
</script>

<style scoped>
/* Remove number input spinners */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}

/* Override global cursor style for answer inputs */
.answer-input {
  cursor: default !important;
}
</style>

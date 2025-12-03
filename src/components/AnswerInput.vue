<template>
  <span class="relative inline-block" :class="[{ 'border-b-4': showBorder }, customWidth || 'w-[4rem] sm:w-[4.5rem]']" :style="{ borderColor: showBorder ? borderColor : 'transparent' }">
    <input
      ref="inputElement"
      :value="userAnswer"
      @input="handleInput"
      @focus="emit('focus')"
      @blur="emit('blur')"
      type="text"
      inputmode="numeric"
      :maxlength="maxLength"
      class="w-full bg-transparent font-bold outline-none appearance-none px-0 leading-none border-0 focus:outline-none focus:ring-0 answer-input"
      :class="[inputClasses, `text-${textAlign}`]"
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
  },
  modelValue: {
    type: String,
    default: ''
  },
  showBorder: {
    type: Boolean,
    default: true
  },
  textAlign: {
    type: String,
    default: 'center'
  },
  reverseInput: {
    type: Boolean,
    default: false
  },
  maxLength: {
    type: Number,
    default: 6
  },
  customWidth: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['feedback', 'update:modelValue', 'correctAnswer', 'focus', 'blur'])

const inputElement = ref(null)
const userAnswer = ref(props.modelValue)
const isCorrect = ref(false)
const showFeedback = ref(false)
const lastLength = ref(0)

watch(() => props.modelValue, (newValue) => {
  if (newValue !== userAnswer.value) {
    userAnswer.value = newValue
    lastLength.value = newValue.length
    validateAnswer()
  }
})

const handleInput = (event) => {
  if (!props.reverseInput) {
    userAnswer.value = event.target.value
    validateAnswer()
    return
  }

  const input = event.target
  const newValue = input.value
  const currentLength = newValue.length

  if (currentLength > lastLength.value) {
    // User typed character(s) - prepend each character individually
    const numNewChars = currentLength - lastLength.value
    const newChars = newValue.slice(-numNewChars)

    // Prepend each new character to build right-to-left
    for (let i = 0; i < newChars.length; i++) {
      userAnswer.value = newChars[i] + userAnswer.value
    }
  } else if (currentLength < lastLength.value) {
    // User deleted character(s) - remove from the beginning
    const numDeleted = lastLength.value - currentLength
    userAnswer.value = userAnswer.value.slice(numDeleted)
  }

  lastLength.value = userAnswer.value.length
  input.value = userAnswer.value

  // Move cursor to the end
  setTimeout(() => {
    input.setSelectionRange(input.value.length, input.value.length)
  }, 0)

  validateAnswer()
}

const validateAnswer = () => {
  const cleaned = userAnswer.value.replace(/[^\d-]/g, '')
  if (cleaned !== userAnswer.value) {
    userAnswer.value = cleaned
  }

  if (userAnswer.value.includes('-')) {
    const parts = userAnswer.value.split('-')
    userAnswer.value = '-' + parts.join('')
  }

  emit('update:modelValue', userAnswer.value)

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
  return isCorrect.value ? '#15803d' : '#b91c1c'
})

const borderColor = computed(() => {
  if (!showFeedback.value) return 'var(--color-deep)'
  return isCorrect.value ? '#15803d' : '#b91c1c'
})

watch(() => props.correctAnswer, () => {
  userAnswer.value = ''
  isCorrect.value = false
  showFeedback.value = false
  emit('feedback', { show: false, isCorrect: false })
})

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

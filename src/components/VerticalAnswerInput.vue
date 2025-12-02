<template>
  <div class="inline-flex flex-row-reverse gap-0">
    <input
      v-for="(field, index) in fields"
      :key="index"
      :ref="el => setInputRef(el, index)"
      :value="fields[index]"
      @beforeinput="(e) => handleBeforeInput(e, index)"
      @keydown="(e) => handleKeydown(e, index)"
      @focus="emit('focus')"
      @blur="emit('blur')"
      type="text"
      inputmode="numeric"
      :class="['bg-transparent text-right font-bold outline-none appearance-none px-0 leading-none border-0 focus:outline-none focus:ring-0 answer-input', inputClasses]"
      :style="{
        width: index === fields.length - 1 ? `${(answerLength - 1) * 0.7}em` : '0.7em',
        color: 'var(--color-deep)',
        fontFamily: '\'Courier New\', monospace'
      }"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'

const props = defineProps({
  correctAnswer: {
    type: Number,
    required: true
  },
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['feedback', 'update:modelValue', 'correctAnswer', 'focus', 'blur'])

const inputRefs = ref([])
const answerLength = computed(() => Math.abs(props.correctAnswer).toString().length)
// Create fields: rightmost field for ones digit, leftmost field for remaining digits
const numFields = computed(() => answerLength.value === 1 ? 1 : 2)
const fields = ref(Array(numFields.value).fill(''))
const isCorrect = ref(false)
const showFeedback = ref(false)

const setInputRef = (el, index) => {
  if (el) {
    inputRefs.value[index] = el
  }
}

watch(() => props.modelValue, (newValue) => {
  if (newValue === '') {
    fields.value = Array(numFields.value).fill('')
  } else if (numFields.value === 1) {
    fields.value[0] = newValue
  } else {
    // Split answer: last digit in field 0, rest in field 1
    const digits = newValue.split('')
    fields.value[0] = digits[digits.length - 1] || ''
    fields.value[1] = digits.slice(0, -1).join('')
  }
})

watch(() => props.correctAnswer, () => {
  fields.value = Array(numFields.value).fill('')
  isCorrect.value = false
  showFeedback.value = false
  emit('feedback', { show: false, isCorrect: false })

  // Focus first field
  nextTick(() => {
    if (inputRefs.value[0]) {
      inputRefs.value[0].focus()
    }
  })
})

const handleBeforeInput = (event, index) => {
  const data = event.data

  // Allow deletion
  if (event.inputType === 'deleteContentBackward' || event.inputType === 'deleteContentForward') {
    event.preventDefault()
    const currentValue = fields.value[index]
    if (currentValue.length > 0) {
      fields.value[index] = currentValue.slice(0, -1)
      validateAnswer()
    }
    return
  }

  // Only allow digits
  if (!data || !/^\d$/.test(data)) {
    event.preventDefault()
    return
  }

  event.preventDefault()

  const currentValue = fields.value[index]
  const isLastField = index === fields.value.length - 1

  if (isLastField) {
    // Leftmost field: allow multiple digits (answerLength - 1)
    const maxDigits = answerLength.value - 1
    if (currentValue.length < maxDigits) {
      fields.value[index] = currentValue + data
      validateAnswer()
    }
  } else {
    // Rightmost field (ones place): single digit only
    if (currentValue.length === 0) {
      fields.value[index] = data
      validateAnswer()

      // Auto-advance to next field
      nextTick(() => {
        focusField(index + 1)
      })
    }
  }
}

const handleKeydown = (event, index) => {
  if (event.key === 'Backspace') {
    const currentValue = fields.value[index]
    if (currentValue === '' && index > 0) {
      // Field is empty, move to previous field
      event.preventDefault()
      focusField(index - 1)
    }
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault()
    if (index < fields.value.length - 1) {
      focusField(index + 1)
    }
  } else if (event.key === 'ArrowRight') {
    event.preventDefault()
    if (index > 0) {
      focusField(index - 1)
    }
  }
}

const focusField = (index) => {
  if (inputRefs.value[index]) {
    inputRefs.value[index].focus()
  }
}

const validateAnswer = () => {
  // Combine fields: field[1] (leftmost) + field[0] (rightmost)
  let answer = ''
  if (numFields.value === 1) {
    answer = fields.value[0]
  } else {
    answer = fields.value[1] + fields.value[0]
  }

  answer = answer.trim()

  emit('update:modelValue', answer)

  if (answer === '') {
    showFeedback.value = false
    isCorrect.value = false
    emit('feedback', { show: false, isCorrect: false })
    return
  }

  const parsedAnswer = parseInt(answer, 10)

  if (isNaN(parsedAnswer)) {
    showFeedback.value = false
    isCorrect.value = false
    emit('feedback', { show: false, isCorrect: false })
    return
  }

  showFeedback.value = true
  isCorrect.value = parsedAnswer === props.correctAnswer
  emit('feedback', { show: true, isCorrect: isCorrect.value })

  if (isCorrect.value) {
    emit('correctAnswer')
  }
}

const inputClasses = computed(() => {
  if (!showFeedback.value) return ''
  return isCorrect.value ? 'text-green-600' : 'text-red-600'
})

defineExpose({
  focus: () => {
    focusField(0)
  }
})
</script>

<style scoped>
.answer-input {
  cursor: default !important;
}
</style>

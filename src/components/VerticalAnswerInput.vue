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
      class="bg-transparent text-right font-bold outline-none appearance-none px-0 leading-none border-0 focus:outline-none focus:ring-0 answer-input"
      :class="inputClasses"
      :style="{
        width: index === fields.length - 1 ? `${Math.min(Math.max(1, fields[index].length) * 0.7, 6.6)}em` : '0.7em',
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
const numFields = computed(() => {
  if (answerLength.value === 1) return 1
  if (answerLength.value === 2) return 2
  return 3
})
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
  } else if (numFields.value === 2) {
    const digits = newValue.split('')
    fields.value[0] = digits[digits.length - 1] || ''
    fields.value[1] = digits.slice(0, -1).join('')
  } else {
    // 3 fields: rightmost (ones), middle (tens), leftmost (hundreds+)
    const digits = newValue.split('')
    fields.value[0] = digits[digits.length - 1] || ''
    fields.value[1] = digits[digits.length - 2] || ''
    fields.value[2] = digits.slice(0, -2).join('')
  }
})

watch(() => props.correctAnswer, () => {
  fields.value = Array(numFields.value).fill('')
  isCorrect.value = false
  showFeedback.value = false
  emit('feedback', { show: false, isCorrect: false })

  nextTick(() => {
    if (inputRefs.value[0]) {
      inputRefs.value[0].focus()
    }
  })
})

const handleBeforeInput = (event, index) => {
  const data = event.data

  if (event.inputType === 'deleteContentBackward' || event.inputType === 'deleteContentForward') {
    event.preventDefault()
    const currentValue = fields.value[index]
    if (currentValue.length > 0) {
      fields.value[index] = currentValue.slice(0, -1)
      validateAnswer()
    }
    return
  }

  if (!data || !/^\d$/.test(data)) {
    event.preventDefault()
    return
  }

  // Calculate total digits
  const totalDigits = fields.value.reduce((sum, field) => sum + field.length, 0)
  if (totalDigits >= 12) {
    event.preventDefault()
    return
  }

  event.preventDefault()

  const currentValue = fields.value[index]
  const isLastField = index === fields.value.length - 1

  if (isLastField) {
    // Leftmost field can have multiple digits
    fields.value[index] = currentValue + data
    validateAnswer()
  } else {
    // Non-last fields (ones and tens place) are single-digit only
    if (currentValue.length === 0) {
      fields.value[index] = data
      validateAnswer()

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
      event.preventDefault()
      // Clear the previous field and focus it
      fields.value[index - 1] = ''
      validateAnswer()
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
  let answer = ''
  if (numFields.value === 1) {
    answer = fields.value[0]
  } else if (numFields.value === 2) {
    answer = fields.value[1] + fields.value[0]
  } else {
    // 3 fields: concatenate leftmost + middle + rightmost
    answer = fields.value[2] + fields.value[1] + fields.value[0]
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

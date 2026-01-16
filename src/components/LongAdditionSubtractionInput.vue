<template>
  <div
    class="long-addition-subtraction"
    style="font-family: 'Space Mono', monospace;"
    dir="ltr"
  >
    <!-- Carry digits row (above num1) - always rendered for consistent height -->
    <div
      class="carry-row"
      :style="{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.1em' }"
    >
      <span
        v-for="(carry, index) in carryDigits"
        :key="`carry-${index}`"
        class="carry-digit"
        :style="{ 
          width: digitBoxSize,
          height: '1em',
          color: (carry && isAddition) ? 'var(--color-orange)' : 'transparent',
          fontSize: '0.6em',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold'
        }"
      >{{ carry || '' }}</span>
    </div>

    <!-- First number (num1) -->
    <div
      class="number-row"
      :style="{ display: 'flex', justifyContent: 'flex-end' }"
    >
      <span
        v-for="(digit, index) in num1Digits"
        :key="`num1-${index}`"
        class="number-digit"
        :style="{ 
          width: digitBoxSize, 
          display: 'inline-flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          fontWeight: 'bold'
        }"
      >{{ digit }}</span>
    </div>

    <!-- Second number (num2) with operator -->
    <div
      class="number-row"
      :style="{ display: 'flex', justifyContent: 'flex-end' }"
    >
      <span
        class="operator"
        :style="{ width: digitBoxSize, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }"
      >{{ operator }}</span>
      <span
        v-for="(digit, index) in num2Digits"
        :key="`num2-${index}`"
        class="number-digit"
        :style="{ 
          width: digitBoxSize, 
          display: 'inline-flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          fontWeight: 'bold'
        }"
      >{{ digit }}</span>
    </div>

    <!-- Separator line -->
    <div
      class="separator"
      :style="{ 
        width: `calc(${digitBoxSize} * ${maxWidth})`,
        borderBottom: '3px solid var(--color-deep)', 
        marginTop: '0.3em', 
        marginBottom: '0.4em',
        marginLeft: 'auto'
      }"
    />

    <!-- Answer row -->
    <div
      class="answer-row"
      :style="{ display: 'flex', justifyContent: 'flex-end' }"
    >
      <div 
        v-for="(_, index) in answerFields"
        :key="`ans-box-${index}`"
        class="input-box"
        :class="{ 
          'active': !isComplete,
          'correct': showFeedback && isCorrect,
          'incorrect': showFeedback && !isCorrect,
          'answers-shown': showAnswers
        }"
        :style="{ 
          width: digitBoxSize, 
          height: digitBoxSize,
        }"
        @click="focusAnswer(answerFields.length - 1 - index)"
      >
        <input
          :ref="el => setAnswerRef(el, index)"
          :value="answerFields[answerFields.length - 1 - index]"
          type="text"
          inputmode="numeric"
          maxlength="1"
          :disabled="showAnswers"
          class="digit-input"
          :style="{ cursor: showAnswers ? 'default' : 'text' }"
          @beforeinput="(e) => handleAnswerInput(e, answerFields.length - 1 - index)"
          @keydown="(e) => handleKeydown(e, answerFields.length - 1 - index)"
          @click.stop="focusAnswer(answerFields.length - 1 - index)"
          @focus="handleFocus"
          @blur="emit('blur')"
        >
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'

const props = defineProps({
  num1: {
    type: Number,
    required: true
  },
  num2: {
    type: Number,
    required: true
  },
  correctAnswer: {
    type: Number,
    required: true
  },
  operation: {
    type: String,
    required: true
  },
  modelValue: {
    type: String,
    default: ''
  },
  showAnswers: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['feedback', 'update:modelValue', 'correctAnswer', 'focus', 'blur'])

// Size constants
const digitBoxSize = '1.8em'

// Refs for input elements
const answerRefs = ref([])

// Field values
const answerFields = ref([])

// Carry digits to display above num1
const carryDigits = ref([])

// Feedback states
const isCorrect = ref(false)
const showFeedback = ref(false)
const isComplete = ref(false)

// Computed values
const num1Digits = computed(() => String(props.num1).split(''))
const num2Digits = computed(() => String(props.num2).split(''))
const isAddition = computed(() => props.operation === '+')
const operator = computed(() => props.operation)

// Calculate max width needed for alignment
const maxWidth = computed(() => {
  const answerLen = String(props.correctAnswer).length
  const num1Len = num1Digits.value.length
  const num2Len = num2Digits.value.length + 1 // +1 for operator
  return Math.max(answerLen, num1Len, num2Len) + 1
})

// Initialize fields based on expected length
const initializeFields = () => {
  const answerLength = String(props.correctAnswer).length
  const carryLength = Math.max(num1Digits.value.length, num2Digits.value.length)

  // Check if the question is already solved correctly
  const isSolved = props.modelValue === String(props.correctAnswer)

  if (props.showAnswers || isSolved) {
    // Fill answer fields with correct answer
    const answerStr = String(props.correctAnswer)
    answerFields.value = answerStr.split('').reverse()
    isComplete.value = true
    isCorrect.value = true
    showFeedback.value = false
  } else {
    answerFields.value = Array(answerLength).fill('')
    isComplete.value = false
    isCorrect.value = false
    showFeedback.value = false
  }
  
  carryDigits.value = Array(carryLength).fill('')
  
  // Reset refs
  answerRefs.value = []
}

// Set refs
const setAnswerRef = (el, index) => {
  if (el) answerRefs.value[index] = el
}

// Focus helpers
const focusAnswer = (fieldIndex) => {
  updateCarryDigits()
  // Refs are indexed by visual position (0=leftmost, n-1=rightmost)
  // Field index 0 = ones digit = rightmost visual box = refIndex n-1
  const refIndex = answerFields.value.length - 1 - fieldIndex
  if (answerRefs.value[refIndex]) {
    answerRefs.value[refIndex].focus()
  }
}

// Handle focus
const handleFocus = () => {
  emit('focus')
}

// Handle input for answer
const handleAnswerInput = (event, index) => {
  const data = event.data

  if (event.inputType === 'deleteContentBackward' || event.inputType === 'deleteContentForward') {
    event.preventDefault()
    if (answerFields.value[index] !== '') {
      answerFields.value[index] = ''
      validateAnswer()
      updateCarryDigits()
    }
    return
  }

  if (!data || !/^\d$/.test(data)) {
    event.preventDefault()
    return
  }

  event.preventDefault()
  answerFields.value[index] = data
  validateAnswer()
  updateCarryDigits()

  nextTick(() => {
    // Count how many empty boxes remain
    const emptyCount = answerFields.value.filter(f => f === '').length
    
    if (emptyCount === 0) {
      // All boxes filled - stay in place
      return
    } else if (emptyCount === 2) {
      // Exactly 2 empty boxes remain: jump to leftmost empty
      for (let i = answerFields.value.length - 1; i >= 0; i--) {
        if (answerFields.value[i] === '') {
          const refIndex = answerFields.value.length - 1 - i
          if (answerRefs.value[refIndex]) {
            answerRefs.value[refIndex].focus()
          }
          break
        }
      }
    } else if (emptyCount === 1) {
      // Only 1 empty box left: focus on it
      for (let i = 0; i < answerFields.value.length; i++) {
        if (answerFields.value[i] === '') {
          const refIndex = answerFields.value.length - 1 - i
          if (answerRefs.value[refIndex]) {
            answerRefs.value[refIndex].focus()
          }
          break
        }
      }
    } else if (emptyCount > 2 && index < answerFields.value.length - 1) {
      // More than 2 empty: continue right-to-left
      const nextRefIndex = answerFields.value.length - 2 - index
      if (answerRefs.value[nextRefIndex]) {
        answerRefs.value[nextRefIndex].focus()
      }
    }
  })
}

// Handle keydown for navigation
const handleKeydown = (event, index) => {
  if (event.key === 'Backspace') {
    if (answerFields.value[index] === '' && index > 0) {
      event.preventDefault()
      answerFields.value[index - 1] = ''
      validateAnswer()
      updateCarryDigits()
      nextTick(() => {
        // Move focus to the right (lower field index)
        const refIndex = answerFields.value.length - index
        if (answerRefs.value[refIndex]) answerRefs.value[refIndex].focus()
      })
    }
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault()
    // Move to higher field index (visually left)
    if (index < answerFields.value.length - 1) {
      const refIndex = answerFields.value.length - 2 - index
      if (answerRefs.value[refIndex]) answerRefs.value[refIndex].focus()
    }
  } else if (event.key === 'ArrowRight') {
    event.preventDefault()
    // Move to lower field index (visually right)
    if (index > 0) {
      const refIndex = answerFields.value.length - index
      if (answerRefs.value[refIndex]) answerRefs.value[refIndex].focus()
    }
  }
}

// Update carry digits based on user input (only for addition)
const updateCarryDigits = () => {
  if (!isAddition.value) {
    carryDigits.value = Array(carryDigits.value.length).fill('')
    return
  }

  const newCarries = Array(carryDigits.value.length).fill('')
  const maxLen = Math.max(num1Digits.value.length, num2Digits.value.length)
  
  let carry = 0
  const num1Str = String(props.num1).padStart(maxLen, '0')
  const num2Str = String(props.num2).padStart(maxLen, '0')
  
  for (let i = maxLen - 1; i >= 0; i--) {
    const d1 = parseInt(num1Str[i], 10)
    const d2 = parseInt(num2Str[i], 10)
    const sum = d1 + d2 + carry
    carry = Math.floor(sum / 10)
    
    // Only show carry if the corresponding input field is filled
    const fieldIndex = maxLen - 1 - i
    const isFieldFilled = answerFields.value[fieldIndex] !== '' && answerFields.value[fieldIndex] !== undefined
    
    if (carry > 0 && i > 0 && isFieldFilled) {
      newCarries[i - 1] = String(carry)
    }
  }
  
  carryDigits.value = newCarries
}

// Validate answer
const validateAnswer = () => {
  const hasEmptyField = answerFields.value.some(f => f === '')
  const answer = [...answerFields.value].reverse().join('')
  emit('update:modelValue', answer)
  
  if (answer === '' || hasEmptyField) {
    showFeedback.value = false
    emit('feedback', { show: false, isCorrect: false })
    return
  }
  
  const parsed = parseInt(answer, 10)
  showFeedback.value = true
  isCorrect.value = parsed === props.correctAnswer
  isComplete.value = isCorrect.value
  emit('feedback', { show: true, isCorrect: isCorrect.value })
  
  if (isCorrect.value) {
    emit('correctAnswer')
  }
}

// Watch for prop changes to reinitialize
watch(() => [props.num1, props.num2, props.showAnswers], () => {
  initializeFields()
  nextTick(() => {
    // Focus rightmost box (refs are visual: 0=left, n-1=right)
    if (!props.showAnswers) {
      const rightmost = answerFields.value.length - 1
      if (answerRefs.value[rightmost]) {
        answerRefs.value[rightmost].focus()
      }
    }
  })
}, { immediate: true })

// Expose focus method
defineExpose({
  focus: () => {
    const rightmost = answerFields.value.length - 1
    if (answerRefs.value[rightmost]) answerRefs.value[rightmost].focus()
  }
})
</script>

<style>
@import '../styles/digit-input.css';
</style>

<style scoped>
.long-addition-subtraction {
  font-size: 1.1em;
  line-height: 1.2;
  color: var(--color-deep);
}
</style>

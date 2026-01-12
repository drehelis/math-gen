<template>
  <div class="long-multiplication" style="font-family: 'Space Mono', monospace;" dir="ltr">
    <!-- Carry digits row (above multiplicand) -->
    <div class="carry-row" :style="{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.1em' }">
      <span
        v-for="(carry, index) in carryDigits"
        :key="`carry-${index}`"
        class="carry-digit"
        :style="{ 
          width: digitBoxSize,
          height: '1em',
          color: carry ? 'var(--color-orange)' : 'transparent',
          fontSize: '0.6em',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold'
        }"
      >{{ carry || '' }}</span>
    </div>

    <!-- Multiplicand (top number) -->
    <div class="number-row" :style="{ display: 'flex', justifyContent: 'flex-end' }">
      <span
        v-for="(digit, index) in multiplicandDigits"
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

    <!-- Multiplier (bottom number with operator) -->
    <div class="number-row" :style="{ display: 'flex', justifyContent: 'flex-end' }">
      <span class="operator" :style="{ width: digitBoxSize, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }">×</span>
      <span
        v-for="(digit, index) in multiplierDigits"
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

    <!-- First separator line -->
    <div class="separator" :style="{ 
      width: `calc(${digitBoxSize} * ${maxWidth})`,
      borderBottom: '3px solid var(--color-deep)', 
      marginTop: '0.3em', 
      marginBottom: '0.4em',
      marginLeft: 'auto'
    }"></div>

    <!-- Partial product 1 (multiplicand × ones digit of multiplier) -->
    <div class="partial-product-row" :style="{ display: 'flex', justifyContent: 'flex-end' }">
      <div 
        v-for="(_, index) in partialProduct1Fields"
        :key="`pp1-box-${index}`"
        class="input-box"
        :class="{ 
          'active': currentStep === 1,
          'completed': currentStep > 1,
          'correct': currentStep > 1 && partialProduct1Correct,
          'incorrect': showFeedback[1] && !partialProduct1Correct
        }"
        :style="{ 
          width: digitBoxSize, 
          height: digitBoxSize,
        }"
        @click="focusPartialProduct1(partialProduct1Fields.length - 1 - index)"
      >
        <input
          :ref="el => setPartialProduct1Ref(el, index)"
          :value="partialProduct1Fields[partialProduct1Fields.length - 1 - index]"
          @beforeinput="(e) => handlePartialProduct1Input(e, partialProduct1Fields.length - 1 - index)"
          @keydown="(e) => handleKeydown(e, 1, partialProduct1Fields.length - 1 - index)"
          @click.stop="focusPartialProduct1(partialProduct1Fields.length - 1 - index)"
          @focus="handleFocus"
          @blur="emit('blur')"
          type="text"
          inputmode="numeric"
          maxlength="1"
          :disabled="currentStep > 1"
          class="digit-input"
          :style="{ cursor: currentStep === 1 ? 'text' : 'default' }"
        />
      </div>
    </div>

    <!-- Partial product 2 (multiplicand × tens digit of multiplier, shifted) -->
    <div v-if="multiplierDigits.length > 1" class="partial-product-row" :style="{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.2em' }">
      <div 
        v-for="(_, index) in partialProduct2Fields"
        :key="`pp2-box-${index}`"
        class="input-box"
        :class="{ 
          'active': currentStep === 2,
          'completed': currentStep > 2,
          'correct': currentStep > 2 && partialProduct2Correct,
          'incorrect': showFeedback[2] && !partialProduct2Correct
        }"
        :style="{ 
          width: digitBoxSize, 
          height: digitBoxSize,
        }"
        @click="focusPartialProduct2(partialProduct2Fields.length - 1 - index)"
      >
        <input
          :ref="el => setPartialProduct2Ref(el, index)"
          :value="partialProduct2Fields[partialProduct2Fields.length - 1 - index]"
          @beforeinput="(e) => handlePartialProduct2Input(e, partialProduct2Fields.length - 1 - index)"
          @keydown="(e) => handleKeydown(e, 2, partialProduct2Fields.length - 1 - index)"
          @click.stop="focusPartialProduct2(partialProduct2Fields.length - 1 - index)"
          @focus="handleFocus"
          @blur="emit('blur')"
          type="text"
          inputmode="numeric"
          maxlength="1"
          :disabled="currentStep !== 2"
          class="digit-input"
          :style="{ cursor: currentStep === 2 ? 'text' : 'default' }"
        />
      </div>
      <!-- Shift placeholder (ones place) -->
      <div class="shift-placeholder" :style="{ width: digitBoxSize, height: digitBoxSize }"></div>
    </div>

    <!-- Second separator line (before final answer) - only show for multi-digit multipliers -->
    <div v-if="multiplierDigits.length > 1" class="separator" :style="{ 
      width: `calc(${digitBoxSize} * ${maxWidth})`,
      borderBottom: '3px solid var(--color-deep)', 
      marginTop: '0.4em', 
      marginBottom: '0.4em',
      marginLeft: 'auto'
    }"></div>

    <!-- Final answer row - only show for multi-digit multipliers -->
    <div v-if="multiplierDigits.length > 1" class="final-answer-row" :style="{ display: 'flex', justifyContent: 'flex-end' }">
      <div 
        v-for="(_, index) in finalAnswerFields"
        :key="`final-box-${index}`"
        class="input-box"
        :class="{ 
          'active': currentStep === 3,
          'correct': showFeedback[3] && finalAnswerCorrect,
          'incorrect': showFeedback[3] && !finalAnswerCorrect
        }"
        :style="{ 
          width: digitBoxSize, 
          height: digitBoxSize,
        }"
        @click="focusFinalAnswer(finalAnswerFields.length - 1 - index)"
      >
        <input
          :ref="el => setFinalAnswerRef(el, index)"
          :value="finalAnswerFields[finalAnswerFields.length - 1 - index]"
          @beforeinput="(e) => handleFinalAnswerInput(e, finalAnswerFields.length - 1 - index)"
          @keydown="(e) => handleKeydown(e, 3, finalAnswerFields.length - 1 - index)"
          @click.stop="focusFinalAnswer(finalAnswerFields.length - 1 - index)"
          @focus="handleFocus"
          @blur="emit('blur')"
          type="text"
          inputmode="numeric"
          maxlength="1"
          :disabled="currentStep !== 3"
          class="digit-input"
          :style="{ cursor: currentStep === 3 ? 'text' : 'default' }"
        />
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
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['feedback', 'update:modelValue', 'correctAnswer', 'focus', 'blur'])

// Size constants
const digitBoxSize = '1.8em'

// Refs for input elements
const partialProduct1Refs = ref([])
const partialProduct2Refs = ref([])
const finalAnswerRefs = ref([])

// Current step: 1 = partial product 1, 2 = partial product 2, 3 = final answer
const currentStep = ref(1)

// Carry digits to display above multiplicand
const carryDigits = ref([])

// Field values
const partialProduct1Fields = ref([])
const partialProduct2Fields = ref([])
const finalAnswerFields = ref([])

// Feedback states
const partialProduct1Correct = ref(false)
const partialProduct2Correct = ref(false)
const finalAnswerCorrect = ref(false)
const showFeedback = ref({ 1: false, 2: false, 3: false })

// Computed values
const multiplicandDigits = computed(() => String(props.num1).split(''))
const multiplierDigits = computed(() => String(props.num2).split(''))

// Calculate max width needed for alignment
const maxWidth = computed(() => {
  const answerLen = String(props.correctAnswer).length
  const num1Len = multiplicandDigits.value.length
  const num2Len = multiplierDigits.value.length + 1 // +1 for operator
  return Math.max(answerLen, num1Len, num2Len) + 1
})

// Expected partial products
const expectedPartialProduct1 = computed(() => {
  const onesDigit = props.num2 % 10
  return props.num1 * onesDigit
})

const expectedPartialProduct2 = computed(() => {
  if (multiplierDigits.value.length < 2) return 0
  const tensDigit = Math.floor(props.num2 / 10) % 10
  return props.num1 * tensDigit
})

// Initialize fields based on expected lengths
const initializeFields = () => {
  const pp1Length = String(expectedPartialProduct1.value).length
  const pp2Length = multiplierDigits.value.length > 1 ? String(expectedPartialProduct2.value).length : 0
  const finalLength = String(props.correctAnswer).length
  const carryLength = multiplicandDigits.value.length

  partialProduct1Fields.value = Array(pp1Length).fill('')
  partialProduct2Fields.value = pp2Length > 0 ? Array(pp2Length).fill('') : []
  finalAnswerFields.value = Array(finalLength).fill('')
  carryDigits.value = Array(carryLength).fill('')
  
  currentStep.value = 1
  partialProduct1Correct.value = false
  partialProduct2Correct.value = false
  finalAnswerCorrect.value = false
  showFeedback.value = { 1: false, 2: false, 3: false }
  
  // Reset refs
  partialProduct1Refs.value = []
  partialProduct2Refs.value = []
  finalAnswerRefs.value = []
}

// Set refs
const setPartialProduct1Ref = (el, index) => {
  if (el) partialProduct1Refs.value[index] = el
}

const setPartialProduct2Ref = (el, index) => {
  if (el) partialProduct2Refs.value[index] = el
}

const setFinalAnswerRef = (el, index) => {
  if (el) finalAnswerRefs.value[index] = el
}

// Focus helpers
const focusPartialProduct1 = (fieldIndex) => {
  // Refs are indexed by visual position (0=leftmost, n-1=rightmost)
  // Field index 0 = ones digit = rightmost visual box = refIndex n-1
  const refIndex = partialProduct1Fields.value.length - 1 - fieldIndex
  if (partialProduct1Refs.value[refIndex]) {
    partialProduct1Refs.value[refIndex].focus()
  }
}

const focusPartialProduct2 = (fieldIndex) => {
  const refIndex = partialProduct2Fields.value.length - 1 - fieldIndex
  if (partialProduct2Refs.value[refIndex]) {
    partialProduct2Refs.value[refIndex].focus()
  }
}

const focusFinalAnswer = (fieldIndex) => {
  const refIndex = finalAnswerFields.value.length - 1 - fieldIndex
  if (finalAnswerRefs.value[refIndex]) {
    finalAnswerRefs.value[refIndex].focus()
  }
}

// Handle focus
const handleFocus = () => {
  emit('focus')
}

// Handle input for partial product 1
const handlePartialProduct1Input = (event, index) => {
  handleGenericInput(event, index, partialProduct1Fields, partialProduct1Refs, () => {
    validatePartialProduct1()
    updateCarryDigits()
  })
}

// Handle input for partial product 2
const handlePartialProduct2Input = (event, index) => {
  handleGenericInput(event, index, partialProduct2Fields, partialProduct2Refs, () => {
    validatePartialProduct2()
  })
}

// Handle input for final answer
const handleFinalAnswerInput = (event, index) => {
  handleGenericInput(event, index, finalAnswerFields, finalAnswerRefs, validateFinalAnswer)
}

// Generic input handler - RIGHT TO LEFT
// Field indices: 0 = ones (rightmost), 1 = tens, 2 = hundreds...
// Ref indices: 0 = leftmost visual, n-1 = rightmost visual
const handleGenericInput = (event, index, fields, refs, validateFn) => {
  const data = event.data

  if (event.inputType === 'deleteContentBackward' || event.inputType === 'deleteContentForward') {
    event.preventDefault()
    if (fields.value[index] !== '') {
      fields.value[index] = ''
      validateFn()
    }
    return
  }

  if (!data || !/^\d$/.test(data)) {
    event.preventDefault()
    return
  }

  event.preventDefault()
  fields.value[index] = data
  validateFn()

  // Move to next field to the left (higher field index = more significant digit)
  // Field index -> ref index: refIndex = length - 1 - fieldIndex
  // So moving to field index+1 means refIndex = length - 1 - (index + 1) = length - 2 - index
  nextTick(() => {
    if (index < fields.value.length - 1) {
      const nextRefIndex = fields.value.length - 2 - index
      if (refs.value[nextRefIndex]) {
        refs.value[nextRefIndex].focus()
      }
    }
  })
}

// Handle keydown for navigation
const handleKeydown = (event, step, index) => {
  const fields = step === 1 ? partialProduct1Fields : step === 2 ? partialProduct2Fields : finalAnswerFields
  const refs = step === 1 ? partialProduct1Refs : step === 2 ? partialProduct2Refs : finalAnswerRefs

  if (event.key === 'Backspace') {
    if (fields.value[index] === '' && index > 0) {
      event.preventDefault()
      fields.value[index - 1] = ''
      nextTick(() => {
        // Move focus to the right (lower index)
        const refIndex = fields.value.length - index
        if (refs.value[refIndex]) refs.value[refIndex].focus()
      })
    }
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault()
    // Move to higher index (visually left)
    if (index < fields.value.length - 1) {
      const refIndex = fields.value.length - 2 - index
      if (refs.value[refIndex]) refs.value[refIndex].focus()
    }
  } else if (event.key === 'ArrowRight') {
    event.preventDefault()
    // Move to lower index (visually right)
    if (index > 0) {
      const refIndex = fields.value.length - index
      if (refs.value[refIndex]) refs.value[refIndex].focus()
    }
  }
}

// Update carry digits based on current multiplication step
const updateCarryDigits = () => {
  const multiplierDigit = props.num2 % 10
  const newCarries = Array(carryDigits.value.length).fill('')
  
  let carry = 0
  const multiplicandStr = String(props.num1)
  
  for (let i = multiplicandStr.length - 1; i >= 0; i--) {
    const digit = parseInt(multiplicandStr[i], 10)
    const product = digit * multiplierDigit + carry
    carry = Math.floor(product / 10)
    
    if (carry > 0 && i > 0) {
      newCarries[i - 1] = String(carry)
    }
  }
  
  carryDigits.value = newCarries
}

// Validate partial product 1
const validatePartialProduct1 = () => {
  // Check if any field is empty
  const hasEmptyField = partialProduct1Fields.value.some(f => f === '')
  // Reverse because fields[0]=ones, fields[1]=tens, etc - need to join as hundreds-tens-ones
  const answer = [...partialProduct1Fields.value].reverse().join('')
  
  if (answer === '' || hasEmptyField) {
    showFeedback.value[1] = false
    return
  }
  
  const parsed = parseInt(answer, 10)
  showFeedback.value[1] = true
  partialProduct1Correct.value = parsed === expectedPartialProduct1.value
  
  if (partialProduct1Correct.value) {
    nextTick(() => {
      if (multiplierDigits.value.length > 1) {
        // Multi-digit multiplier: move to partial product 2
        currentStep.value = 2
        // Clear carry digits for step 2
        carryDigits.value = Array(carryDigits.value.length).fill('')
        nextTick(() => {
          // Focus rightmost box of partial product 2
          const rightmost = partialProduct2Fields.value.length - 1
          if (partialProduct2Refs.value[rightmost]) partialProduct2Refs.value[rightmost].focus()
        })
      } else {
        // Single-digit multiplier: partial product 1 IS the final answer
        // Emit the final answer directly
        emit('update:modelValue', answer)
        emit('feedback', { show: true, isCorrect: true })
        emit('correctAnswer')
      }
    })
  }
}

// Validate partial product 2
const validatePartialProduct2 = () => {
  // Check if any field is empty
  const hasEmptyField = partialProduct2Fields.value.some(f => f === '')
  // Reverse because fields[0]=ones, fields[1]=tens, etc
  const answer = [...partialProduct2Fields.value].reverse().join('')
  
  if (answer === '' || hasEmptyField) {
    showFeedback.value[2] = false
    return
  }
  
  const parsed = parseInt(answer, 10)
  showFeedback.value[2] = true
  partialProduct2Correct.value = parsed === expectedPartialProduct2.value
  
  if (partialProduct2Correct.value) {
    nextTick(() => {
      currentStep.value = 3
      nextTick(() => {
        const rightmost = finalAnswerFields.value.length - 1
        if (finalAnswerRefs.value[rightmost]) finalAnswerRefs.value[rightmost].focus()
      })
    })
  }
}

// Validate final answer
const validateFinalAnswer = () => {
  // Check if any field is empty
  const hasEmptyField = finalAnswerFields.value.some(f => f === '')
  // Reverse because fields[0]=ones, fields[1]=tens, etc
  const answer = [...finalAnswerFields.value].reverse().join('')
  emit('update:modelValue', answer)
  
  if (answer === '' || hasEmptyField) {
    showFeedback.value[3] = false
    emit('feedback', { show: false, isCorrect: false })
    return
  }
  
  const parsed = parseInt(answer, 10)
  showFeedback.value[3] = true
  finalAnswerCorrect.value = parsed === props.correctAnswer
  emit('feedback', { show: true, isCorrect: finalAnswerCorrect.value })
  
  if (finalAnswerCorrect.value) {
    emit('correctAnswer')
  }
}

// Watch for prop changes to reinitialize
watch(() => [props.num1, props.num2], () => {
  initializeFields()
  nextTick(() => {
    // Focus rightmost box of partial product 1 (refs are visual: 0=left, n-1=right)
    const rightmost = partialProduct1Fields.value.length - 1
    if (partialProduct1Refs.value[rightmost]) {
      partialProduct1Refs.value[rightmost].focus()
    }
  })
}, { immediate: true })

// Expose focus method
defineExpose({
  focus: () => {
    // Focus rightmost box of current step (refs indexed by visual position)
    if (currentStep.value === 1) {
      const rightmost = partialProduct1Fields.value.length - 1
      if (partialProduct1Refs.value[rightmost]) partialProduct1Refs.value[rightmost].focus()
    } else if (currentStep.value === 2) {
      const rightmost = partialProduct2Fields.value.length - 1
      if (partialProduct2Refs.value[rightmost]) partialProduct2Refs.value[rightmost].focus()
    } else if (currentStep.value === 3) {
      const rightmost = finalAnswerFields.value.length - 1
      if (finalAnswerRefs.value[rightmost]) finalAnswerRefs.value[rightmost].focus()
    }
  }
})
</script>

<style scoped>
.long-multiplication {
  font-size: 1.1em;
  line-height: 1.2;
  color: var(--color-deep);
}

.input-box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--color-deep);
  border-radius: 4px;
  margin: 0 1px;
  opacity: 0.4;
  background: transparent;
  transition: all 0.2s ease;
}

.input-box.active {
  opacity: 1;
  border-color: var(--color-deep);
  background: rgba(255, 255, 255, 0.3);
  cursor: text;
}

.input-box.completed {
  opacity: 0.6;
  background: rgba(16, 185, 129, 0.1);
}

.input-box.correct {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.2);
}

.input-box.incorrect {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.digit-input {
  width: 100%;
  height: 100%;
  border: none;
  background: transparent;
  text-align: center;
  font-weight: bold;
  font-size: inherit;
  font-family: inherit;
  color: var(--color-deep);
  outline: none;
  padding: 0;
  margin: 0;
}

.digit-input:disabled {
  color: var(--color-deep);
  cursor: default;
}

.digit-input:focus {
  outline: none;
}

.shift-placeholder {
  opacity: 0;
}

.number-digit {
  font-weight: bold;
}

.carry-digit {
  font-weight: bold;
}
</style>

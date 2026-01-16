<template>
  <div
    class="long-multiplication"
    style="font-family: 'Space Mono', monospace;"
    dir="ltr"
  >
    <!-- Carry digits row (above multiplicand) -->
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
    <div
      class="number-row"
      :style="{ display: 'flex', justifyContent: 'flex-end' }"
    >
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
    <div
      class="number-row"
      :style="{ display: 'flex', justifyContent: 'flex-end' }"
    >
      <span
        class="operator"
        :style="{ width: digitBoxSize, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }"
      >×</span>
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

    <!-- Partial product 1 (multiplicand × ones digit of multiplier) -->
    <div
      class="partial-product-row"
      :style="{ display: 'flex', justifyContent: 'flex-end' }"
    >
      <div 
        v-for="(_, index) in partialProduct1Fields"
        :key="`pp1-box-${index}`"
        class="input-box"
        :class="{ 
          'active': currentStep === 1,
          'completed': currentStep > 1,
          'correct': currentStep > 1 && partialProduct1Correct,
          'incorrect': showFeedback[1] && !partialProduct1Correct,
          'answers-shown': showAnswers
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
          type="text"
          inputmode="numeric"
          maxlength="1"
          :disabled="showAnswers"
          class="digit-input"
          :style="{ cursor: showAnswers ? 'default' : 'text' }"
          @beforeinput="(e) => handlePartialProduct1Input(e, partialProduct1Fields.length - 1 - index)"
          @keydown="(e) => handleKeydown(e, 1, partialProduct1Fields.length - 1 - index)"
          @click.stop="focusPartialProduct1(partialProduct1Fields.length - 1 - index)"
          @focus="handleFocus"
          @blur="emit('blur')"
        >
      </div>
    </div>

    <!-- Partial product 2 (multiplicand × tens digit of multiplier, shifted) -->
    <div
      v-if="multiplierDigits.length > 1"
      class="partial-product-row"
      :style="{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.2em' }"
    >
      <div 
        v-for="(_, index) in partialProduct2Fields"
        :key="`pp2-box-${index}`"
        class="input-box"
        :class="{ 
          'active': currentStep === 2,
          'completed': currentStep > 2,
          'correct': currentStep > 2 && partialProduct2Correct,
          'incorrect': showFeedback[2] && !partialProduct2Correct,
          'answers-shown': showAnswers
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
          type="text"
          inputmode="numeric"
          maxlength="1"
          :disabled="showAnswers"
          class="digit-input"
          :style="{ cursor: showAnswers ? 'default' : 'text' }"
          @beforeinput="(e) => handlePartialProduct2Input(e, partialProduct2Fields.length - 1 - index)"
          @keydown="(e) => handleKeydown(e, 2, partialProduct2Fields.length - 1 - index)"
          @click.stop="focusPartialProduct2(partialProduct2Fields.length - 1 - index)"
          @focus="handleFocus"
          @blur="emit('blur')"
        >
      </div>
      <!-- Shift placeholder (ones place) -->
      <div
        class="shift-placeholder"
        :style="{ width: digitBoxSize, height: digitBoxSize }"
      />
    </div>

    <!-- Partial product 3 (multiplicand × hundreds digit of multiplier, shifted 2 places) -->
    <div
      v-if="multiplierDigits.length > 2"
      class="partial-product-row"
      :style="{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.2em' }"
    >
      <div 
        v-for="(_, index) in partialProduct3Fields"
        :key="`pp3-box-${index}`"
        class="input-box"
        :class="{ 
          'active': currentStep === 3,
          'completed': currentStep > 3,
          'correct': currentStep > 3 && partialProduct3Correct,
          'incorrect': showFeedback[3] && !partialProduct3Correct,
          'answers-shown': showAnswers
        }"
        :style="{ 
          width: digitBoxSize, 
          height: digitBoxSize,
        }"
        @click="focusPartialProduct3(partialProduct3Fields.length - 1 - index)"
      >
        <input
          :ref="el => setPartialProduct3Ref(el, index)"
          :value="partialProduct3Fields[partialProduct3Fields.length - 1 - index]"
          type="text"
          inputmode="numeric"
          maxlength="1"
          :disabled="showAnswers"
          class="digit-input"
          :style="{ cursor: showAnswers ? 'default' : 'text' }"
          @beforeinput="(e) => handlePartialProduct3Input(e, partialProduct3Fields.length - 1 - index)"
          @keydown="(e) => handleKeydown(e, 3, partialProduct3Fields.length - 1 - index)"
          @click.stop="focusPartialProduct3(partialProduct3Fields.length - 1 - index)"
          @focus="handleFocus"
          @blur="emit('blur')"
        >
      </div>
      <!-- Shift placeholders (ones and tens places) -->
      <div
        class="shift-placeholder"
        :style="{ width: digitBoxSize, height: digitBoxSize }"
      />
      <div
        class="shift-placeholder"
        :style="{ width: digitBoxSize, height: digitBoxSize }"
      />
    </div>

    <!-- Second separator line (before final answer) - only show for multi-digit multipliers -->
    <div
      v-if="multiplierDigits.length > 1"
      class="separator"
      :style="{ 
        width: `calc(${digitBoxSize} * ${maxWidth})`,
        borderBottom: '3px solid var(--color-deep)', 
        marginTop: '0.4em', 
        marginBottom: '0.4em',
        marginLeft: 'auto'
      }"
    />

    <!-- Final answer row - only show for multi-digit multipliers -->
    <div
      v-if="multiplierDigits.length > 1"
      class="final-answer-row"
      :style="{ display: 'flex', justifyContent: 'flex-end' }"
    >
      <div 
        v-for="(_, index) in finalAnswerFields"
        :key="`final-box-${index}`"
        class="input-box"
        :class="{ 
          'active': currentStep === (multiplierDigits.length > 2 ? 4 : 3),
          'correct': showFeedback[multiplierDigits.length > 2 ? 4 : 3] && finalAnswerCorrect,
          'incorrect': showFeedback[multiplierDigits.length > 2 ? 4 : 3] && !finalAnswerCorrect,
          'answers-shown': showAnswers
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
          type="text"
          inputmode="numeric"
          maxlength="1"
          :disabled="showAnswers"
          class="digit-input"
          :style="{ cursor: showAnswers ? 'default' : 'text' }"
          @beforeinput="(e) => handleFinalAnswerInput(e, finalAnswerFields.length - 1 - index)"
          @keydown="(e) => handleKeydown(e, multiplierDigits.length > 2 ? 4 : 3, finalAnswerFields.length - 1 - index)"
          @click.stop="focusFinalAnswer(finalAnswerFields.length - 1 - index)"
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
const partialProduct1Refs = ref([])
const partialProduct2Refs = ref([])
const partialProduct3Refs = ref([])
const finalAnswerRefs = ref([])

// Current step: 1 = PP1, 2 = PP2, 3 = PP3 (if 3-digit), 4 = final answer
const currentStep = ref(1)

// Carry digits to display above multiplicand
const carryDigits = ref([])

// Field values
const partialProduct1Fields = ref([])
const partialProduct2Fields = ref([])
const partialProduct3Fields = ref([])
const finalAnswerFields = ref([])

// Feedback states
const partialProduct1Correct = ref(false)
const partialProduct2Correct = ref(false)
const partialProduct3Correct = ref(false)
const finalAnswerCorrect = ref(false)
const showFeedback = ref({ 1: false, 2: false, 3: false, 4: false })

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

const expectedPartialProduct3 = computed(() => {
  if (multiplierDigits.value.length < 3) return 0
  const hundredsDigit = Math.floor(props.num2 / 100) % 10
  return props.num1 * hundredsDigit
})

// Initialize fields based on expected lengths
const initializeFields = () => {
  const pp1Length = String(expectedPartialProduct1.value).length
  const pp2Length = multiplierDigits.value.length > 1 ? String(expectedPartialProduct2.value).length : 0
  const pp3Length = multiplierDigits.value.length > 2 ? String(expectedPartialProduct3.value).length : 0
  const finalLength = String(props.correctAnswer).length
  const carryLength = multiplicandDigits.value.length

  // Check if the question is already solved correctly
  const isSolved = props.modelValue === String(props.correctAnswer)

  // When showAnswers is true OR the question is already solved correctly, pre-fill all the answer boxes
  if (props.showAnswers || isSolved) {
    // Fill partial product 1
    const pp1Str = String(expectedPartialProduct1.value)
    partialProduct1Fields.value = pp1Str.split('').reverse()
    
    // Fill partial product 2 (if multi-digit multiplier)
    if (pp2Length > 0) {
      const pp2Str = String(expectedPartialProduct2.value)
      partialProduct2Fields.value = pp2Str.split('').reverse()
    } else {
      partialProduct2Fields.value = []
    }
    
    // Fill partial product 3 (if 3-digit multiplier)
    if (pp3Length > 0) {
      const pp3Str = String(expectedPartialProduct3.value)
      partialProduct3Fields.value = pp3Str.split('').reverse()
    } else {
      partialProduct3Fields.value = []
    }
    
    // Fill final answer (if multi-digit multiplier)
    if (multiplierDigits.value.length > 1) {
      const finalStr = String(props.correctAnswer)
      finalAnswerFields.value = finalStr.split('').reverse()
    } else {
      finalAnswerFields.value = []
    }
    
    // Set all steps as complete
    const totalSteps = multiplierDigits.value.length > 2 ? 5 : (multiplierDigits.value.length > 1 ? 4 : 2)
    currentStep.value = totalSteps // Past all steps
    partialProduct1Correct.value = true
    partialProduct2Correct.value = true
    partialProduct3Correct.value = true
    finalAnswerCorrect.value = true
    showFeedback.value = { 1: false, 2: false, 3: false, 4: false } // Don't show feedback indicators
  } else {
    partialProduct1Fields.value = Array(pp1Length).fill('')
    partialProduct2Fields.value = pp2Length > 0 ? Array(pp2Length).fill('') : []
    partialProduct3Fields.value = pp3Length > 0 ? Array(pp3Length).fill('') : []
    finalAnswerFields.value = Array(finalLength).fill('')
    currentStep.value = 1
    partialProduct1Correct.value = false
    partialProduct2Correct.value = false
    partialProduct3Correct.value = false
    finalAnswerCorrect.value = false
    showFeedback.value = { 1: false, 2: false, 3: false, 4: false }
  }
  
  carryDigits.value = Array(carryLength).fill('')
  
  // Reset refs
  partialProduct1Refs.value = []
  partialProduct2Refs.value = []
  partialProduct3Refs.value = []
  finalAnswerRefs.value = []
}

// Set refs
const setPartialProduct1Ref = (el, index) => {
  if (el) partialProduct1Refs.value[index] = el
}

const setPartialProduct2Ref = (el, index) => {
  if (el) partialProduct2Refs.value[index] = el
}

const setPartialProduct3Ref = (el, index) => {
  if (el) partialProduct3Refs.value[index] = el
}

const setFinalAnswerRef = (el, index) => {
  if (el) finalAnswerRefs.value[index] = el
}

// Focus helpers
const focusPartialProduct1 = (fieldIndex) => {
  // Switch to step 1 when clicking on partial product 1
  currentStep.value = 1
  updateCarryDigits()
  // Refs are indexed by visual position (0=leftmost, n-1=rightmost)
  // Field index 0 = ones digit = rightmost visual box = refIndex n-1
  const refIndex = partialProduct1Fields.value.length - 1 - fieldIndex
  if (partialProduct1Refs.value[refIndex]) {
    partialProduct1Refs.value[refIndex].focus()
  }
}

const focusPartialProduct2 = (fieldIndex) => {
  // Switch to step 2 when clicking on partial product 2
  currentStep.value = 2
  updateCarryDigits()
  const refIndex = partialProduct2Fields.value.length - 1 - fieldIndex
  if (partialProduct2Refs.value[refIndex]) {
    partialProduct2Refs.value[refIndex].focus()
  }
}

const focusPartialProduct3 = (fieldIndex) => {
  // Switch to step 3 when clicking on partial product 3
  currentStep.value = 3
  updateCarryDigits()
  const refIndex = partialProduct3Fields.value.length - 1 - fieldIndex
  if (partialProduct3Refs.value[refIndex]) {
    partialProduct3Refs.value[refIndex].focus()
  }
}

const focusFinalAnswer = (fieldIndex) => {
  // Final answer step: 3 for 2-digit multiplier, 4 for 3-digit multiplier
  currentStep.value = multiplierDigits.value.length > 2 ? 4 : 3
  updateCarryDigits()
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
    updateCarryDigits()
  })
}

// Handle input for partial product 3
const handlePartialProduct3Input = (event, index) => {
  handleGenericInput(event, index, partialProduct3Fields, partialProduct3Refs, () => {
    validatePartialProduct3()
    updateCarryDigits()
  })
}

// Handle input for final answer
const handleFinalAnswerInput = (event, index) => {
  handleGenericInput(event, index, finalAnswerFields, finalAnswerRefs, validateFinalAnswer)
}

// Generic input handler - HYBRID: Start at rightmost (ones)
// Only jump to leftmost if exactly 2 empty boxes remain, then type left-to-right
// Otherwise continue right-to-left
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

  nextTick(() => {
    // Count how many empty boxes remain
    const emptyCount = fields.value.filter(f => f === '').length
    
    if (emptyCount === 0) {
      // All boxes filled - editing mode, stay in place (don't move focus)
      return
    } else if (emptyCount === 2) {
      // Exactly 2 empty boxes remain: jump to leftmost empty, then left-to-right
      // Find the leftmost empty box (highest field index that's empty)
      for (let i = fields.value.length - 1; i >= 0; i--) {
        if (fields.value[i] === '') {
          const refIndex = fields.value.length - 1 - i
          if (refs.value[refIndex]) {
            refs.value[refIndex].focus()
          }
          break
        }
      }
    } else if (emptyCount === 1) {
      // Only 1 empty box left: focus on it
      for (let i = 0; i < fields.value.length; i++) {
        if (fields.value[i] === '') {
          const refIndex = fields.value.length - 1 - i
          if (refs.value[refIndex]) {
            refs.value[refIndex].focus()
          }
          break
        }
      }
    } else if (emptyCount > 2 && index < fields.value.length - 1) {
      // More than 2 empty: continue right-to-left (move to higher field index / left visually)
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
        // Move focus to the right (lower field index)
        const refIndex = fields.value.length - index
        if (refs.value[refIndex]) refs.value[refIndex].focus()
      })
    }
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault()
    // Move to higher field index (visually left)
    if (index < fields.value.length - 1) {
      const refIndex = fields.value.length - 2 - index
      if (refs.value[refIndex]) refs.value[refIndex].focus()
    }
  } else if (event.key === 'ArrowRight') {
    event.preventDefault()
    // Move to lower field index (visually right)
    if (index > 0) {
      const refIndex = fields.value.length - index
      if (refs.value[refIndex]) refs.value[refIndex].focus()
    }
  }
}

// Update carry digits based on current multiplication step
const updateCarryDigits = () => {
  let multiplierDigit = 0
  let currentFields = []
  
  if (currentStep.value === 1) {
    multiplierDigit = props.num2 % 10
    currentFields = partialProduct1Fields.value
  } else if (currentStep.value === 2) {
    multiplierDigit = Math.floor(props.num2 / 10) % 10
    currentFields = partialProduct2Fields.value
  } else if (currentStep.value === 3) {
    multiplierDigit = Math.floor(props.num2 / 100) % 10
    currentFields = partialProduct3Fields.value
  } else {
    // No carry digits for final answer step
    carryDigits.value = Array(carryDigits.value.length).fill('')
    return
  }
  const newCarries = Array(carryDigits.value.length).fill('')
  
  let carry = 0
  const multiplicandStr = String(props.num1)
  
  for (let i = multiplicandStr.length - 1; i >= 0; i--) {
    const digit = parseInt(multiplicandStr[i], 10)
    const product = digit * multiplierDigit + carry
    carry = Math.floor(product / 10)
    
    // Only show carry if the corresponding input field (to the right) is filled
    // i corresponds to the position generating the carry
    // Formula for field index: multiplicandStr.length - 1 - i
    const fieldIndex = multiplicandStr.length - 1 - i
    const isFieldFilled = currentFields[fieldIndex] !== '' && currentFields[fieldIndex] !== undefined
    
    if (carry > 0 && i > 0 && isFieldFilled) {
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
        updateCarryDigits()
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
      if (multiplierDigits.value.length > 2) {
        // 3-digit multiplier: move to partial product 3
        currentStep.value = 3
        updateCarryDigits()
        nextTick(() => {
          const rightmost = partialProduct3Fields.value.length - 1
          if (partialProduct3Refs.value[rightmost]) partialProduct3Refs.value[rightmost].focus()
        })
      } else {
        // 2-digit multiplier: move to final answer
        currentStep.value = 3
        updateCarryDigits()
        nextTick(() => {
          const rightmost = finalAnswerFields.value.length - 1
          if (finalAnswerRefs.value[rightmost]) finalAnswerRefs.value[rightmost].focus()
        })
      }
    })
  }
}

// Validate partial product 3
const validatePartialProduct3 = () => {
  const hasEmptyField = partialProduct3Fields.value.some(f => f === '')
  const answer = [...partialProduct3Fields.value].reverse().join('')
  
  if (answer === '' || hasEmptyField) {
    showFeedback.value[3] = false
    return
  }
  
  const parsed = parseInt(answer, 10)
  showFeedback.value[3] = true
  partialProduct3Correct.value = parsed === expectedPartialProduct3.value
  
  if (partialProduct3Correct.value) {
    nextTick(() => {
      currentStep.value = 4
      updateCarryDigits()
      nextTick(() => {
        const rightmost = finalAnswerFields.value.length - 1
        if (finalAnswerRefs.value[rightmost]) finalAnswerRefs.value[rightmost].focus()
      })
    })
  }
}

// Validate final answer
const validateFinalAnswer = () => {
  const hasEmptyField = finalAnswerFields.value.some(f => f === '')
  const answer = [...finalAnswerFields.value].reverse().join('')
  emit('update:modelValue', answer)
  
  // Use feedback index 4 for 3-digit, 3 for 2-digit
  const feedbackIndex = multiplierDigits.value.length > 2 ? 4 : 3
  
  if (answer === '' || hasEmptyField) {
    showFeedback.value[feedbackIndex] = false
    emit('feedback', { show: false, isCorrect: false })
    return
  }
  
  const parsed = parseInt(answer, 10)
  showFeedback.value[feedbackIndex] = true
  finalAnswerCorrect.value = parsed === props.correctAnswer
  emit('feedback', { show: true, isCorrect: finalAnswerCorrect.value })
  
  if (finalAnswerCorrect.value) {
    emit('correctAnswer')
  }
}

// Watch for prop changes to reinitialize
watch(() => [props.num1, props.num2, props.showAnswers], () => {
  initializeFields()
  nextTick(() => {
    // Focus rightmost box of partial product 1 (refs are visual: 0=left, n-1=right)
    // Only focus if not showing answers
    if (!props.showAnswers) {
      const rightmost = partialProduct1Fields.value.length - 1
      if (partialProduct1Refs.value[rightmost]) {
        partialProduct1Refs.value[rightmost].focus()
      }
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

<style>
@import '../styles/digit-input.css';
</style>

<style scoped>
.long-multiplication {
  font-size: 1.1em;
  line-height: 1.2;
  color: var(--color-deep);
}
</style>

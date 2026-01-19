<template>
  <div class="no-print relative mb-12">
    <div 
      class="rounded-3xl shadow-2xl relative transition-all duration-300 md:bg-white md:p-8 md:border-8"
      :class="{
        'bg-transparent p-0 shadow-none border-0': isCollapsed,
        'bg-white p-8 border-8': !isCollapsed
      }"
      :style="'border-color: var(--color-deep);'"
    >
      <!-- Mobile: Collapse badge on bottom border -->
      <button
        class="md:hidden absolute left-1/2 -translate-x-1/2 -bottom-5 z-20 px-4 py-1 rounded-full border-4 transition-all shadow-lg"
        style="background: var(--color-deep); border-color: var(--color-deep); color: white;"
        @click="isCollapsed = !isCollapsed"
      >
        <svg
          class="w-5 h-5 transition-transform duration-300"
          :class="{ 'rotate-180': !isCollapsed }"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      <!-- Collapsible content wrapper for mobile -->
      <div
        class="transition-all duration-300 ease-in-out md:!max-h-none md:!opacity-100 md:!overflow-visible"
        :class="{
          'max-h-0 opacity-0 overflow-hidden': isCollapsed,
          'max-h-[2000px] opacity-100 overflow-visible': !isCollapsed
        }"
      >
        <div class="relative text-center mb-8">
          <div
            class="mb-4 lg:mb-0 lg:absolute lg:top-0 flex justify-center"
            :style="{ [currentLocale === 'he' ? 'right' : 'left']: currentLocale === 'he' ? '0' : '0' }"
          >
            <slot name="language-switcher" />
          </div>

          <h1
            class="text-5xl md:text-6xl font-bold mb-2"
            style="color: var(--color-deep); letter-spacing: -0.02em;"
          >
            {{ $t('app.title') }}
          </h1>
          <div class="flex items-center justify-center gap-3 text-4xl font-bold">
            <span
              class="animate-pulse"
              style="color: var(--color-orange);"
            >+</span>
            <span
              class="animate-pulse"
              style="color: var(--color-coral); animation-delay: 0.2s;"
            >-</span>
            <span
              class="animate-pulse"
              style="color: var(--color-sky); animation-delay: 0.4s;"
            >×</span>
            <span
              class="animate-pulse"
              style="color: var(--color-mint); animation-delay: 0.6s;"
            >÷</span>
          </div>
        </div>

        <slot name="tabs" />

        <div
          v-if="showControls"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <div v-if="!tableMode">
            <label
              class="block text-sm font-bold mb-3"
              style="color: var(--color-deep); text-transform: uppercase; letter-spacing: 0.05em;"
            >
              {{ $t('controls.howMany') }}
            </label>
            <CustomDropdown
              v-if="!showCustomCount"
              v-model="localSettings.count"
              :options="countOptions"
              border-color="var(--color-sunshine)"
              background-color="var(--color-sunshine)"
              text-color="var(--color-deep)"
            />
            <input
              v-else
              v-model.number="customCountValue"
              type="number"
              min="1"
              max="500"
              autofocus
              class="w-full px-4 py-3 font-semibold rounded-2xl border-2 focus:outline-none transition-all"
              style="border-color: var(--color-sunshine); background: var(--color-sunshine); color: var(--color-deep);"
              :placeholder="$t('controls.enterNumber')"
              @blur="handleCustomCountBlur"
              @keyup.enter="handleCustomCountBlur"
            >
          </div>

          <div v-if="tableMode">
            <label
              class="block text-sm font-bold mb-3"
              style="color: var(--color-deep); text-transform: uppercase; letter-spacing: 0.05em;"
            >
              {{ $t('table.tableSize') }}
            </label>
            <CustomDropdown
              v-model="localSettings.tableSize"
              :options="tableSizeOptions"
              border-color="var(--color-sunshine)"
              background-color="var(--color-sunshine)"
              text-color="var(--color-deep)"
            />
          </div>

          <div v-if="tableMode">
            <label
              class="block text-sm font-bold mb-3"
              style="color: var(--color-deep); text-transform: uppercase; letter-spacing: 0.05em;"
            >
              {{ $t('table.prefillPercentage') }}
            </label>
            <CustomDropdown
              v-model="localSettings.prefillPercentage"
              :options="prefillOptions"
              border-color="var(--color-sky)"
              background-color="var(--color-sky)"
              text-color="white"
            />
          </div>

          <div v-if="!tableMode">
            <label
              class="block text-sm font-bold mb-3"
              style="color: var(--color-deep); text-transform: uppercase; letter-spacing: 0.05em;"
            >
              {{ $t('controls.operation') }}
            </label>
            <MultiSelectDropdown
              v-model="localSettings.operations"
              :options="comparisonMode ? comparisonOperationOptions : hideOperation ? [
                { value: 'addition', label: $t('missingOperation.addition') },
                { value: 'subtraction', label: $t('missingOperation.subtraction') }
              ] : operationOptions"
              border-color="var(--color-sky)"
              background-color="var(--color-sky)"
              text-color="white"
            />
          </div>

          <div v-if="!tableMode">
            <label
              class="block text-sm font-bold mb-3"
              style="color: var(--color-deep); text-transform: uppercase; letter-spacing: 0.05em;"
            >
              {{ $t('controls.difficulty') }}
            </label>
            <CustomDropdown
              v-model="localSettings.difficulty"
              :options="difficultyOptions"
              border-color="var(--color-coral)"
              background-color="var(--color-coral)"
              text-color="white"
            />
          </div>

          <div>
            <label
              class="block text-sm font-bold mb-3"
              style="color: var(--color-deep); text-transform: uppercase; letter-spacing: 0.05em;"
            >
              {{ $t('controls.options') }}
            </label>
            <MultiSelectDropdown
              v-model="localSettings.selectedOptions"
              :options="optionsOptions"
              border-color="var(--color-mint)"
              background-color="var(--color-mint)"
              text-color="white"
              :allow-empty="true"
            />
          </div>
        </div>

        <div
          v-if="showControls"
          class="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <button
            :disabled="tableMode && localSettings.prefillPercentage === 0"
            class="py-5 px-8 font-bold text-xl rounded-2xl border-4 transition-all transform hover:scale-105 hover:-translate-y-1 active:translate-y-0 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0"
            :style="(tableMode && localSettings.prefillPercentage === 0) ? 'background: #ccc; border-color: #999; color: #666;' : 'background: var(--color-sky); border-color: var(--color-deep); color: white;'"
            @click="handleGenerate"
          >
            {{ tableMode ? $t('controls.prefillTable') : $t('controls.generateQuestions') }}
          </button>

          <button
            :disabled="!hasQuestions"
            class="py-5 px-8 font-bold text-xl rounded-2xl border-4 transition-all transform hover:scale-105 hover:-translate-y-1 active:translate-y-0 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0"
            :style="hasQuestions ? 'background: var(--color-purple); border-color: var(--color-deep); color: white;' : 'background: #ccc; border-color: #999; color: #666;'"
            @click="handlePrint"
          >
            {{ $t('controls.printMe') }}
          </button>
        </div>
      </div> <!-- End Collapsible content wrapper -->
    </div>

    <div
      class="absolute -top-4 -right-4 w-24 h-24 rounded-full -z-10"
      style="background: var(--color-sunshine);"
    />
    <div
      class="absolute -bottom-4 -left-4 w-20 h-20 rotate-45 -z-10"
      style="background: var(--color-coral);"
    />
  </div>
</template>

<script setup>
import { reactive, watch, computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import CustomDropdown from './CustomDropdown.vue'
import MultiSelectDropdown from './MultiSelectDropdown.vue'

const { locale, t } = useI18n()
const currentLocale = computed(() => locale.value)

const props = defineProps({
  settings: {
    type: Object,
    required: true
  },
  hasQuestions: {
    type: Boolean,
    default: false
  },
  showControls: {
    type: Boolean,
    default: true
  },
  hideOperation: {
    type: Boolean,
    default: false
  },
  comparisonMode: {
    type: Boolean,
    default: false
  },
  tableMode: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:settings', 'generate', 'print'])

const localSettings = reactive({
  ...props.settings,
  operations: props.settings.operations || ['addition'],
  varySecondNumber: props.settings.varySecondNumber || false,
  showAnswers: props.settings.showAnswers || false,
  showGuide: props.settings.showGuide || false,
  inputMode: props.settings.inputMode || 'native',
  questionFormat: props.settings.questionFormat || 'standard',
  missingPosition: props.settings.missingPosition || 'random',
  prefillPercentage: props.settings.prefillPercentage || 0,
  tableSize: props.settings.tableSize || 10,
  selectedOptions: []
})

// Mobile collapse state - start expanded if no questions
const isCollapsed = ref(props.hasQuestions)

// Auto-expand menu when there are no questions
watch(() => props.hasQuestions, (hasQuestions) => {
  if (!hasQuestions) {
    isCollapsed.value = false
  }
})

watch(() => props.hideOperation, (isHidden) => {
  if (isHidden) {
    const validOps = localSettings.operations.filter(op =>
      op === 'addition' || op === 'subtraction'
    )
    if (validOps.length === 0) {
      localSettings.operations = ['addition']
    } else {
      localSettings.operations = validOps
    }
  }
}, { immediate: true })

watch(() => props.comparisonMode, (isComparison) => {
  if (isComparison) {
    // If switching to comparison mode with hard difficulty, reset to medium
    if (localSettings.difficulty === 'hard') {
      localSettings.difficulty = 'medium'
    }
    
    if (localSettings.difficulty === 'basic' || localSettings.difficulty === 'medium') {
      // For basic/medium difficulty, default to addition if not already set
      if (!localSettings.operations.includes('addition') && !localSettings.operations.includes('subtraction')) {
        localSettings.operations = ['addition']
      }
    } else if (!localSettings.operations.includes('none')) {
      localSettings.operations = ['none']
    }
  } else if (!isComparison && localSettings.operations.includes('none')) {
    // When leaving comparison mode, reset to default operations
    localSettings.operations = ['addition']
  }
}, { immediate: true })

watch(() => localSettings.difficulty, (newDifficulty) => {
  if (props.comparisonMode) {
    if (newDifficulty === 'beginners' || newDifficulty === 'easy') {
      localSettings.operations = ['none']
    } else if (newDifficulty === 'basic' || newDifficulty === 'medium') {
      // Switch to addition for basic/medium difficulty
      if (localSettings.operations.includes('none')) {
        localSettings.operations = ['addition']
      }
    }
  }
})

const showCustomCount = ref(false)
const customCountValue = ref(null)

watch(localSettings, (newValue) => {
  emit('update:settings', newValue)
}, { deep: true })

watch(() => localSettings.count, () => {
  if (props.hasQuestions) {
    emit('generate')
  }
})

watch(() => localSettings.operation, () => {
  if (props.hasQuestions) {
    emit('generate')
  }
})

watch(() => localSettings.operations, () => {
  if (props.hasQuestions) {
    emit('generate')
  }
}, { deep: true })

watch(() => localSettings.difficulty, () => {
  if (props.hasQuestions) {
    emit('generate')
  }
})

watch(() => localSettings.varySecondNumber, () => {
  if (props.hasQuestions) {
    emit('generate')
  }
})

watch(() => localSettings.questionFormat, () => {
  if (props.hasQuestions) {
    emit('generate')
  }
})

watch(() => localSettings.missingPosition, () => {
  if (props.hasQuestions) {
    emit('generate')
  }
})

watch(() => localSettings.prefillPercentage, () => {
  if (props.tableMode) {
    // For table mode, always regenerate immediately when prefill changes
    emit('generate')
  } else if (props.hasQuestions) {
    emit('generate')
  }
})

watch(() => localSettings.tableSize, () => {
  if (props.tableMode) {
    // For table mode, always regenerate immediately when size changes
    emit('generate')
  } else if (props.hasQuestions) {
    emit('generate')
  }
})

const handleGenerate = () => {
  emit('generate')
}

const handlePrint = () => {
  window.print()
}

const handleCustomCountBlur = () => {
  if (customCountValue.value && customCountValue.value >= 1 && customCountValue.value <= 500) {
    localSettings.count = customCountValue.value
    showCustomCount.value = false
  } else {
    customCountValue.value = 20
    localSettings.count = 20
    showCustomCount.value = false
  }
}

const countOptions = computed(() => {
  const baseOptions = [
    { value: 10, label: t('questions.count.10') },
    { value: 20, label: t('questions.count.20') },
    { value: 30, label: t('questions.count.30') },
    { value: 50, label: t('questions.count.50') }
  ]

  if (typeof localSettings.count === 'number' && ![10, 20, 30, 50].includes(localSettings.count)) {
    baseOptions.push({
      value: localSettings.count,
      label: `${localSettings.count} ${t('questions.count.10').includes('Questions') ? 'Questions' : 'תרגילים'}`
    })
  }

  baseOptions.push({ value: 'custom', label: t('questions.count.custom') })
  return baseOptions
})

watch(() => localSettings.count, (newValue) => {
  if (newValue === 'custom') {
    showCustomCount.value = true
    customCountValue.value = null
  }
})

const operationOptions = computed(() => [
  { value: 'addition', label: t('operation.addition') },
  { value: 'subtraction', label: t('operation.subtraction') },
  { value: 'multiplication', label: t('operation.multiplication') },
  { value: 'division', label: t('operation.division') }
])

const comparisonOperationOptions = computed(() => {
  if (localSettings.difficulty === 'basic' || localSettings.difficulty === 'medium') {
    return [
      { value: 'addition', label: t('operation.addition') },
      { value: 'subtraction', label: t('operation.subtraction') },
      { value: 'multiplication', label: t('operation.multiplication') },
      { value: 'division', label: t('operation.division') }
    ]
  } else {
    return [
      { value: 'none', label: t('controls.none') }
    ]
  }
})



const tableSizeOptions = computed(() => [
  { value: 10, label: t('table.size.10') },
  { value: 12, label: t('table.size.12') },
  { value: 15, label: t('table.size.15') }
])

const prefillOptions = computed(() => [
  { value: 0, label: t('table.prefill.0') },
  { value: 25, label: t('table.prefill.25') },
  { value: 45, label: t('table.prefill.45') },
  { value: 75, label: t('table.prefill.75') }
])

const difficultyOptions = computed(() => {
  const options = [
    { 
      value: 'easy', 
      label: t('difficulty.easy'),
      children: [
        { value: 'beginners', label: t('difficulty.beginners') },
        { value: 'basic', label: t('difficulty.basic') }
      ]
    },
    { value: 'medium', label: t('difficulty.medium') }
  ]
  
  // Only exclude hard for comparison mode
  if (!props.comparisonMode) {
    options.push({ value: 'hard', label: t('difficulty.hard') })
  }
  
  return options
})

const optionsOptions = computed(() => {
  const options = [
    { value: 'showAnswers', label: t('controls.showAnswers') }
  ]

  // For table mode, only show answers option is relevant
  if (props.tableMode) {
    return options
  }

  // For Simple tab (not hideOperation)
  if (!props.hideOperation && !props.comparisonMode) {
    // Show guide option for Addition + (Beginners or Easy)
    const isAdditionSimple = localSettings.operations.includes('addition') && 
      (localSettings.difficulty === 'beginners' || localSettings.difficulty === 'easy')
      
    if (isAdditionSimple) {
      options.push({ value: 'showGuide', label: t('controls.showGuide') })
    }
    
    if (localSettings.difficulty === 'medium' || localSettings.difficulty === 'hard') {
      options.push({ value: 'varySecondNumber', label: t('controls.varySecondNumber') })
      // Only show Vertical Entry for non-multiplication operations
      const hasNonMultiplication = localSettings.operations.some(op => op !== 'multiplication')
      if (hasNonMultiplication) {
        options.push({ value: 'columnByColumn', label: t('controls.columnByColumn') })
      }
    }
  }

  // For Missing Number tab (hideOperation)
  if (props.hideOperation) {
    // Show Uneven Digits for medium and hard difficulty
    if (localSettings.difficulty === 'medium' || localSettings.difficulty === 'hard') {
      options.push({ value: 'varySecondNumber', label: t('controls.varySecondNumber') })
    }
    // Only show Both Sides for medium and hard difficulty
    if (localSettings.difficulty !== 'beginners' && localSettings.difficulty !== 'basic') {
      options.push({ value: 'bothSides', label: t('questionFormat.bothSides') })
    }
  }

  return options
})

const initializeOptions = () => {
  const selected = []
  if (localSettings.showAnswers) selected.push('showAnswers')
  if (localSettings.showGuide) selected.push('showGuide')

  // Add options for medium or hard difficulty
  if (localSettings.difficulty === 'medium' || localSettings.difficulty === 'hard') {
    if (localSettings.varySecondNumber) selected.push('varySecondNumber')
    // Only add columnByColumn for Simple tab
    if (!props.hideOperation && localSettings.inputMode === 'column-by-column') {
      selected.push('columnByColumn')
    }
  }

  // Add format options for Missing Number tab
  if (props.hideOperation) {
    if (localSettings.questionFormat === 'both-sides-mixed') {
      selected.push('bothSides')
    }
  }

  localSettings.selectedOptions = selected
}

initializeOptions()

watch(() => localSettings.selectedOptions, (newOptions) => {
  localSettings.showAnswers = newOptions.includes('showAnswers')
  localSettings.showGuide = newOptions.includes('showGuide')
  localSettings.varySecondNumber = newOptions.includes('varySecondNumber')
  localSettings.inputMode = newOptions.includes('columnByColumn') ? 'column-by-column' : 'native'

  // Handle format options for Missing Number tab
  if (newOptions.includes('bothSides')) {
    localSettings.questionFormat = 'both-sides-mixed'
  } else if (props.hideOperation) {
    // Only reset to standard if on Missing Number tab
    localSettings.questionFormat = 'standard'
  }
}, { deep: true })

watch(() => localSettings.difficulty, () => {
  // When difficulty changes, remove options that are no longer available
  const availableValues = optionsOptions.value.map(opt => opt.value)
  localSettings.selectedOptions = localSettings.selectedOptions.filter(opt => availableValues.includes(opt))
})

watch(() => props.hideOperation, () => {
  // When switching tabs, remove options that are no longer available
  const availableValues = optionsOptions.value.map(opt => opt.value)
  localSettings.selectedOptions = localSettings.selectedOptions.filter(opt => availableValues.includes(opt))
})

watch(() => props.tableMode, () => {
  // When switching to/from table mode, remove options that are no longer available
  const availableValues = optionsOptions.value.map(opt => opt.value)
  localSettings.selectedOptions = localSettings.selectedOptions.filter(opt => availableValues.includes(opt))
})

watch(() => localSettings.operations, () => {
  // When operations change, remove options that are no longer available (e.g., columnByColumn for multiplication)
  const availableValues = optionsOptions.value.map(opt => opt.value)
  localSettings.selectedOptions = localSettings.selectedOptions.filter(opt => availableValues.includes(opt))
}, { deep: true })
</script>

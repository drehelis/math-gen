<template>
  <div v-if="questions.length > 0">
    <CompletionOverlay
      :show="showCompletionOverlay"
      :stats="completionStats"
      @close="showCompletionOverlay = false"
    />

    <div class="print:hidden">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6" dir="ltr">
        <div
          v-for="(question, index) in questions"
          :key="question.id"
          class="question-card relative rounded-2xl p-3 sm:p-4 border-4 cursor-pointer"
          :style="getCardStyle(index)"
          @click="focusInput(index)"
        >
          <div class="absolute -top-3 -left-3 w-10 h-10 rounded-full flex items-center justify-center font-bold border-4 z-10"
               :style="getBadgeStyle(index)">
            <span>{{ index + 1 }}</span>
          </div>

          <div
            v-if="!showAnswers && feedbackState[question.id]?.show"
            class="absolute -top-3 -right-3 w-10 h-10 rounded-lg flex items-center justify-center font-bold border-4"
            :style="{
              backgroundColor: feedbackState[question.id]?.isCorrect ? '#15803d' : '#b91c1c',
              borderColor: 'var(--color-deep)',
              color: 'white'
            }"
          >
            <span class="text-xl">{{ feedbackState[question.id]?.isCorrect ? '✓' : '✗' }}</span>
          </div>

          <div v-if="!useVerticalFormat" class="flex items-center justify-center pt-2" style="font-family: 'Space Mono', monospace;" dir="ltr">
            <span class="text-base sm:text-lg md:text-xl lg:text-2xl font-bold whitespace-nowrap" style="color: var(--color-deep);">
              {{ question.num1 }} {{ question.operation }} {{ question.num2 }} =
              <AnswerInput
                v-if="!showAnswers"
                v-model="question.userAnswer"
                :ref="el => setInputRef(el, index)"
                :correct-answer="question.answer"
                @feedback="(data) => handleFeedback(question.id, data)"
                @correct-answer="() => focusNextInput(index, questions.length)"
                @focus="focusedIndex = index"
                @blur="focusedIndex = -1"
              />
              <span v-else class="inline-block align-bottom border-b-4 min-w-[4rem] sm:min-w-[4.5rem] text-center" :style="{ borderColor: 'var(--color-deep)' }">
                <span class="opacity-40">{{ question.answer }}</span>
              </span>
            </span>
          </div>

          <div v-else class="flex flex-col items-center justify-center pt-4 pb-2" style="font-family: 'Courier New', monospace;" dir="ltr">
            <div class="text-2xl sm:text-3xl md:text-4xl font-bold" style="color: var(--color-deep); line-height: 0.75;">
              <div class="text-right">{{ question.num1 }}</div>
              <div class="text-left" :style="{ marginLeft: operatorMarginLeft, marginTop: '-0.3em', marginBottom: '-0.3em' }">{{ question.operation }}</div>
              <div class="text-right" style="border-bottom: 4px solid var(--color-deep); padding-bottom: 0.2em; min-width: 3ch;">{{ question.num2 }}</div>
              <div class="text-right" style="margin-top: 0.3em;">
                <AnswerInput
                  v-if="!showAnswers"
                  v-model="question.userAnswer"
                  :ref="el => setInputRef(el, index)"
                  :correct-answer="question.answer"
                  :show-border="false"
                  @feedback="(data) => handleFeedback(question.id, data)"
                  @correct-answer="() => focusNextInput(index, questions.length)"
                  @focus="focusedIndex = index"
                  @blur="focusedIndex = -1"
                  style="text-align: right; font-family: 'Courier New', monospace;"
                />
                <span v-else class="opacity-60">{{ question.answer }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="text-center py-8">
        <a href="https://github.com/drehelis/math-gen" target="_blank" rel="noopener noreferrer" class="inline-block hover:opacity-70 transition-opacity" style="color: var(--color-purple);" :title="$t('emptyState.github')">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        </a>
      </div>
    </div>

    <PrintLayout :items="questions" :title="$t('app.title')" page-key-prefix="question">
      <template #item="{ item }">
        <div
          class="print:text-base print:text-black print:p-2"
          style="font-family: 'Space Mono', monospace; direction: ltr; white-space: pre;"
        >{{ formatPrintQuestion(item.displayIndex, item.num1, item.num2, item.operation) }}</div>
      </template>
    </PrintLayout>

    <PrintLayout v-if="showAnswers" :items="questions" :title="$t('answerKey.title')" page-key-prefix="answer" gap-class="print:gap-x-8 print:gap-y-1" :force-page-break="true">
      <template #item="{ item }">
        <div
          class="print:text-base print:text-black"
          style="font-family: 'Space Mono', monospace; direction: ltr; white-space: pre;"
        >{{ formatPrintAnswer(item.displayIndex, item.num1, item.num2, item.operation, item.answer) }}</div>
      </template>
    </PrintLayout>
  </div>

  <div v-else class="text-center py-20 no-print">
    <h3 class="text-3xl font-bold mb-3" style="color: var(--color-deep);">{{ $t('emptyState.title') }}</h3>
    <p class="text-xl mb-8" style="color: var(--color-orange);">{{ $t('emptyState.message') }}</p>
    <a href="https://github.com/drehelis/math-gen" target="_blank" rel="noopener noreferrer" class="inline-block hover:opacity-70 transition-opacity" style="color: var(--color-purple);" :title="$t('emptyState.github')">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
      </svg>
    </a>
  </div>
</template>

<script setup>
import { watch, onMounted, ref, computed } from 'vue'
import PrintLayout from './PrintLayout.vue'
import AnswerInput from './AnswerInput.vue'
import CompletionOverlay from './CompletionOverlay.vue'
import { useQuestionFeedback } from '../composables/useQuestionFeedback'

const props = defineProps({
  questions: {
    type: Array,
    required: true
  },
  showAnswers: {
    type: Boolean,
    default: false
  },
  difficulty: {
    type: String,
    default: 'easy'
  }
})

const { feedbackState, handleFeedback, setInputRef, focusNextInput, focusFirstInput, focusInput, resetStats, clearAllFeedback, getCompletionStats, correctCount } = useQuestionFeedback('math-gen-simple-feedback')

const showCompletionOverlay = ref(false)
const completionStats = ref({ total: 0, firstTry: 0, timeInSeconds: 0, accuracy: 100 })
const focusedIndex = ref(-1)

const useVerticalFormat = computed(() => {
  return props.difficulty === 'medium' || props.difficulty === 'hard'
})

const operatorMarginLeft = computed(() => {
  return props.difficulty === 'hard' ? '-1.5rem' : '-0.5rem'
})

const currentQuestionIndex = computed(() => {
  for (let i = 0; i < props.questions.length; i++) {
    const questionId = props.questions[i].id
    const feedback = feedbackState.value[questionId]
    if (!feedback || !feedback.isCorrect) {
      return i
    }
  }
  return -1
})

onMounted(() => {
  if (props.questions.length > 0 && !props.showAnswers) {
    focusFirstInput(props.questions)
  }
})

watch(() => props.questions, (newQuestions, oldQuestions) => {
  if (newQuestions.length > 0 && !props.showAnswers) {
    if (!oldQuestions || newQuestions.length !== oldQuestions.length || 
        newQuestions[0]?.id !== oldQuestions[0]?.id) {
      clearAllFeedback()
      showCompletionOverlay.value = false
    }
    focusFirstInput(newQuestions)
  }
})

watch(correctCount, (newCount) => {
  if (newCount === props.questions.length && props.questions.length > 0 && !props.showAnswers) {
    completionStats.value = getCompletionStats(props.questions.length)
    setTimeout(() => {
      showCompletionOverlay.value = true
    }, 500)
  }
})

const cardColors = [
  'var(--color-sunshine)',
  'var(--color-coral)',
  'var(--color-mint)',
  'var(--color-sky)',
]

const getCardStyle = (index) => {
  const color = cardColors[index % cardColors.length]
  const questionId = props.questions[index]?.id
  const feedback = feedbackState.value[questionId]
  const isAnsweredCorrectly = feedback && feedback.isCorrect
  const isFocused = index === focusedIndex.value
  const isUnanswered = !feedback || !feedback.isCorrect
  
  if (isAnsweredCorrectly && !props.showAnswers) {
    return {
      background: '#d1fae5',
      borderColor: 'var(--color-deep)',
      opacity: '0.7',
      transition: 'all 0.3s ease'
    }
  }
  
  if (isFocused && !isAnsweredCorrectly && !props.showAnswers) {
    return {
      background: color,
      borderColor: 'var(--color-deep)',
      opacity: '1',
      transform: 'scale(1.02)',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
    }
  }
  
  if (isUnanswered && !isFocused && !props.showAnswers) {
    return {
      background: color,
      borderColor: 'var(--color-deep)',
      opacity: '0.4',
      transition: 'all 0.3s ease'
    }
  }
  
  return {
    background: color,
    borderColor: 'var(--color-deep)',
  }
}

const getBadgeStyle = (index) => {
  const bgColors = ['var(--color-orange)', 'var(--color-purple)', 'var(--color-sky)', 'var(--color-mint)']
  const bg = bgColors[index % bgColors.length]
  const questionId = props.questions[index]?.id
  const feedback = feedbackState.value[questionId]
  const isAnsweredCorrectly = feedback && feedback.isCorrect
  const isFocused = index === focusedIndex.value
  
  if (isAnsweredCorrectly && !props.showAnswers) {
    return {
      background: '#10b981',
      borderColor: 'var(--color-deep)',
      color: 'white',
      opacity: '1'
    }
  }
  
  if (isFocused && !props.showAnswers) {
    return {
      background: bg,
      borderColor: 'var(--color-deep)',
      color: 'white',
      opacity: '1'
    }
  }
  
  if (!isAnsweredCorrectly && !isFocused && !props.showAnswers) {
    return {
      background: bg,
      borderColor: 'var(--color-deep)',
      color: 'white',
      opacity: '1',
      filter: 'brightness(0.7)'
    }
  }
  
  return {
    background: bg,
    borderColor: 'var(--color-deep)',
    color: 'white',
    opacity: '1'
  }
}

const formatPrintQuestion = (questionNum, num1, num2, operation) => {
  const numStr = String(questionNum).padStart(3, ' ')

  if (useVerticalFormat.value) {
    const num1Str = String(num1).padStart(6, ' ')
    const num2Str = String(num2).padStart(5, ' ')
    const line = '______'.padStart(6, ' ')
    return `${numStr})  ${num1Str}\n    ${operation}${num2Str}\n    ${line}`
  }

  const num1Str = String(num1).padStart(3, ' ')
  const num2Str = String(num2).padStart(3, ' ')
  return `${numStr})  ${num1Str} ${operation} ${num2Str}  =  __________`
}

const formatPrintAnswer = (questionNum, num1, num2, operation, answer) => {
  const numStr = String(questionNum).padStart(3, ' ')

  if (useVerticalFormat.value) {
    const num1Str = String(num1).padStart(6, ' ')
    const num2Str = String(num2).padStart(5, ' ')
    const answerStr = String(answer).padStart(6, ' ')
    return `${numStr})  ${num1Str}\n    ${operation}${num2Str}\n    ${answerStr}`
  }

  const num1Str = String(num1).padStart(3, ' ')
  const num2Str = String(num2).padStart(3, ' ')
  const answerStr = String(answer).padStart(4, ' ')
  return `${numStr})  ${num1Str} ${operation} ${num2Str}  =  ${answerStr}`
}
</script>

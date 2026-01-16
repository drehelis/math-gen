<template>
  <div v-if="questions.length > 0">
    <CompletionOverlay
      :show="showCompletionOverlay"
      :stats="completionStats"
      @close="showCompletionOverlay = false"
    />

    <div class="print:hidden">
      <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
        dir="ltr"
      >
        <div
          v-for="(question, index) in questions"
          :key="question.id"
          class="question-card relative rounded-2xl p-3 sm:p-4 border-4 cursor-pointer"
          :style="getCardStyle(index)"
          @click="focusedIndex = index"
        >
          <div
            class="absolute -top-3 -left-3 w-10 h-10 rounded-full flex items-center justify-center font-bold border-4"
            :style="getBadgeStyle(index)"
          >
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

          <div
            class="flex items-center justify-center pt-2"
            style="font-family: 'Space Mono', monospace;"
            dir="ltr"
          >
            <div
              class="text-base sm:text-lg md:text-xl lg:text-2xl font-bold whitespace-nowrap flex items-baseline"
              style="color: var(--color-deep);"
            >
              <template v-if="!showAnswers">
                <button
                  class="hover:opacity-70 transition-opacity cursor-pointer inline-block p-0 m-0 bg-transparent border-0"
                  style="color: var(--color-deep); font-family: inherit; font-size: inherit; font-weight: inherit; line-height: inherit;"
                  @click="handleAnswer(question.id, 'num1', question, index)"
                >
                  {{ question.num1 }}
                </button>
                <button
                  class="inline-block border-b-4 min-w-[3rem] text-center mx-2 hover:opacity-70 transition-opacity cursor-pointer p-0 bg-transparent border-x-0 border-t-0"
                  :style="{ borderBottomColor: 'var(--color-deep)', color: 'var(--color-deep)', fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 'inherit', lineHeight: 'inherit' }"
                  @click="handleAnswer(question.id, 'equal', question, index)"
                >
                  <span :class="feedbackState[question.id]?.show ? '' : 'opacity-0'">{{ feedbackState[question.id]?.value || '_' }}</span>
                </button>
                <button
                  class="hover:opacity-70 transition-opacity cursor-pointer inline-block p-0 m-0 bg-transparent border-0"
                  style="color: var(--color-deep); font-family: inherit; font-size: inherit; font-weight: inherit; line-height: inherit;"
                  @click="handleAnswer(question.id, 'num2', question, index)"
                >
                  {{ question.num2 }}
                </button>
              </template>
              <template v-else>
                <span class="inline-block p-0 m-0 relative">
                  <span
                    v-if="question.hasExpression"
                    class="absolute -top-4 left-1/2 transform -translate-x-1/2 text-sm opacity-40"
                  >{{ question.leftValue }}</span>
                  {{ question.num1 }}
                </span>
                <span
                  class="inline-block relative mx-2 min-w-[3rem] text-center border-b-4 p-0"
                  :style="{ borderBottomColor: 'var(--color-deep)' }"
                >
                  <span class="opacity-40">{{ feedbackState[question.id]?.value || question.correctOperator }}</span>
                </span>
                <span class="inline-block p-0 m-0 relative">
                  <span
                    v-if="question.hasExpression"
                    class="absolute -top-4 left-1/2 transform -translate-x-1/2 text-sm opacity-40"
                  >{{ question.rightValue }}</span>
                  {{ question.num2 }}
                </span>
              </template>
            </div>
          </div>
        </div>
      </div>

      <PageFooter />
    </div>

    <div class="hidden print:block">
      <template
        v-for="(page, pageIndex) in paginateQuestions(questions, 30)"
        :key="`comparison-page-${pageIndex}`"
      >
        <div
          class="print-page"
          :class="{ 'print:break-before-page': pageIndex > 0 }"
        >
          <h2
            class="text-xl font-bold mb-4"
            style="color: black;"
          >
            {{ $t('app.title') }}
          </h2>
          <div
            class="print-horizontal-grid"
            dir="ltr"
          >
            <div
              v-for="question in page"
              :key="question.id"
              class="print-horizontal-item"
            >
              <span class="equation-number">{{ question.displayIndex }})</span>
              <span class="equation">
                <span class="number">{{ question.num1 }}</span>
                <span class="answer-blank">_______</span>
                <span class="number">{{ question.num2 }}</span>
              </span>
            </div>
          </div>
        </div>
      </template>

      <template v-if="showAnswers">
        <template
          v-for="(page, pageIndex) in paginateQuestions(questions, 30)"
          :key="`comparison-answer-page-${pageIndex}`"
        >
          <div class="print-page print:break-before-page">
            <h2
              class="text-xl font-bold mb-4"
              style="color: black;"
            >
              {{ $t('answerKey.title') }}
            </h2>
            <div
              class="print-horizontal-grid"
              dir="ltr"
            >
              <div
                v-for="question in page"
                :key="question.id"
                class="print-horizontal-item"
              >
                <span class="equation-number">{{ question.displayIndex }})</span>
                <span class="equation">
                  <span class="number">{{ question.num1 }}</span>
                  <span class="operator">{{ question.correctOperator }}</span>
                  <span class="number">{{ question.num2 }}</span>
                </span>
              </div>
            </div>
          </div>
        </template>
      </template>
    </div>
  </div>

  <PageFooter
    v-else
    :show-empty-message="true"
  />
</template>

<script setup>
import { watch, ref, onMounted } from 'vue'
import CompletionOverlay from './CompletionOverlay.vue'
import PageFooter from './PageFooter.vue'
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

const { feedbackState, handleFeedback, clearAllFeedback, getCompletionStats, correctCount } = useQuestionFeedback('math-gen-comparison-feedback')

const showCompletionOverlay = ref(false)
const completionStats = ref({ total: 0, firstTry: 0, timeInSeconds: 0, accuracy: 100 })
const focusedIndex = ref(0)

const handleAnswer = (questionId, clickedNumber, question, index) => {
  // Get the actual values to compare (either simple numbers or calculated expression values)
  const leftValue = question.hasExpression ? question.leftValue : question.num1
  const rightValue = question.hasExpression ? question.rightValue : question.num2
  
  // Determine the displayed operator based on which number/area was clicked
  let displayedOperator
  let isCorrect = false

  if (clickedNumber === 'equal') {
    // User clicked the middle (equal sign)
    displayedOperator = '='
    isCorrect = leftValue === rightValue
  } else if (clickedNumber === 'num1') {
    // User clicked first number, so show num1 > num2
    displayedOperator = '>'
    isCorrect = leftValue > rightValue
  } else {
    // User clicked second number, so show num1 < num2
    displayedOperator = '<'
    isCorrect = rightValue > leftValue
  }

  handleFeedback(questionId, {
    show: true,
    isCorrect: isCorrect,
    value: displayedOperator
  })

  // Auto-advance to next question if correct
  if (isCorrect) {
    const nextIndex = index + 1
    if (nextIndex < props.questions.length) {
      setTimeout(() => {
        focusedIndex.value = nextIndex
      }, 300)
    }
  }
}

watch(() => props.questions, (newQuestions, oldQuestions) => {
  if (newQuestions.length > 0 && !props.showAnswers) {
    if (!oldQuestions || newQuestions.length !== oldQuestions.length ||
        newQuestions[0]?.id !== oldQuestions[0]?.id) {
      clearAllFeedback()
      showCompletionOverlay.value = false
      focusedIndex.value = 0
    }
  }
}, { deep: true })

watch(correctCount, (newCount) => {
  if (newCount === props.questions.length && props.questions.length > 0 && !props.showAnswers) {
    completionStats.value = getCompletionStats(props.questions.length)
    setTimeout(() => {
      showCompletionOverlay.value = true
    }, 500)
  }
})

onMounted(() => {
  if (props.questions.length > 0 && !props.showAnswers) {
    let firstUnsolvedIndex = 0
    for (let i = 0; i < props.questions.length; i++) {
      const questionId = props.questions[i].id
      if (!feedbackState.value[questionId]?.isCorrect) {
        firstUnsolvedIndex = i
        break
      }
    }
    focusedIndex.value = firstUnsolvedIndex
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

const paginateQuestions = (questions, itemsPerPage) => {
  const pages = []
  const questionsWithIndex = questions.map((question, index) => ({
    ...question,
    displayIndex: index + 1
  }))

  for (let i = 0; i < questionsWithIndex.length; i += itemsPerPage) {
    pages.push(questionsWithIndex.slice(i, i + itemsPerPage))
  }

  return pages
}
</script>

<style scoped>
@media print {
  .print-horizontal-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-auto-flow: column;
    grid-template-rows: repeat(15, auto);
    gap: 2em 4em;
    width: 100%;
  }

  .print-horizontal-item {
    display: flex;
    align-items: center;
  }

  .print-horizontal-item .equation-number {
    display: inline-block;
    font-family: 'Space Mono', monospace;
    font-size: 14px;
    width: 2.5em;
    text-align: right;
    margin-right: 0.5em;
  }

  .equation {
    display: inline-block;
    font-family: 'Space Mono', monospace;
    font-size: 14px;
  }

  .equation .number {
    display: inline-block;
    text-align: right;
    min-width: 2ch;
  }

  .equation .operator {
    display: inline-block;
    margin: 0 0.3em;
  }

  .equation .answer-blank {
    display: inline-block;
    min-width: 4em;
    margin-left: 0.3em;
    margin-right: 0.3em;
  }
}
</style>

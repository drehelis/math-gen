<template>
  <div v-if="questions.length > 0">
    <CompletionOverlay
      :show="showCompletionOverlay"
      :stats="completionStats"
      @close="showCompletionOverlay = false"
    />

    <div class="print:hidden relative">
      <!-- Fruit Guide (Floating) -->
      <FruitGuide
        v-if="showGuide && questions.length > 0"
        :num1="guideExample.num1"
        :num2="guideExample.num2"
        :answer="guideExample.answer"
        :operation="guideExample.operation"
      />

      <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
        dir="ltr"
      >
        <!-- Fruit Guide (Moved outside grid) -->

        <div
          v-for="(question, index) in questions"
          :key="question.id"
          class="question-card relative rounded-2xl p-3 sm:p-4 border-4 cursor-pointer"
          :style="getCardStyle(index)"
          @click="focusInput(index)"
        >
          <div
            class="absolute -top-3 -left-3 w-10 h-10 rounded-full flex items-center justify-center font-bold border-4 z-10"
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
            v-if="!useVerticalFormat"
            class="flex items-center justify-center pt-2"
            style="font-family: 'Space Mono', monospace;"
            dir="ltr"
          >
            <span
              class="text-base sm:text-lg md:text-xl lg:text-2xl font-bold whitespace-nowrap"
              style="color: var(--color-deep);"
            >
              {{ question.num1 }} {{ question.operation }} {{ question.num2 }} =
              <AnswerInput
                v-if="!showAnswers"
                :ref="el => setInputRef(el, index)"
                v-model="question.userAnswer"
                :correct-answer="question.answer"
                @feedback="(data) => handleFeedback(question.id, data)"
                @correct-answer="() => focusNextInput(index, questions.length)"
                @focus="focusedIndex = index"
                @blur="focusedIndex = -1"
              />
              <span
                v-else
                class="inline-block align-bottom border-b-4 min-w-[4rem] sm:min-w-[4.5rem] text-center"
                :style="{ borderColor: 'var(--color-deep)' }"
              >
                <span class="opacity-40">{{ question.answer }}</span>
              </span>
            </span>
          </div>

          <!-- Long Multiplication Layout for multiplication operations -->
          <div
            v-else-if="isMultiplication(question)"
            class="flex flex-col items-center justify-center pt-2 pb-2"
            dir="ltr"
          >
            <LongMultiplicationInput
              :ref="el => setInputRef(el, index)"
              v-model="question.userAnswer"
              :num1="question.num1"
              :num2="question.num2"
              :correct-answer="question.answer"
              :show-answers="showAnswers"
              @feedback="(data) => handleFeedback(question.id, data)"
              @correct-answer="() => focusNextInput(index, questions.length)"
              @focus="focusedIndex = index"
              @blur="focusedIndex = -1"
            />
          </div>

          <!-- Long Addition/Subtraction Layout for addition/subtraction operations -->
          <div
            v-else-if="isAdditionOrSubtraction(question)"
            class="flex flex-col items-center justify-center pt-2 pb-2"
            dir="ltr"
          >
            <LongAdditionSubtractionInput
              :ref="el => setInputRef(el, index)"
              v-model="question.userAnswer"
              :num1="question.num1"
              :num2="question.num2"
              :correct-answer="question.answer"
              :operation="question.operation"
              :show-answers="showAnswers"
              @feedback="(data) => handleFeedback(question.id, data)"
              @correct-answer="() => focusNextInput(index, questions.length)"
              @focus="focusedIndex = index"
              @blur="focusedIndex = -1"
            />
          </div>

          <!-- Fallback Vertical Layout for other operations -->
          <div
            v-else
            class="flex flex-col items-center justify-center pt-4 pb-2"
            style="font-family: 'Space Mono', monospace;"
            dir="ltr"
          >
            <div
              class="w-full max-w-[12rem] sm:max-w-none sm:w-full text-base sm:text-lg md:text-xl lg:text-2xl font-bold"
              style="color: var(--color-deep); line-height: 0.75;"
            >
              <div class="text-right">
                {{ question.num1 }}
              </div>
              <div
                class="text-left"
                :style="{ marginLeft: operatorMarginLeft, marginTop: '-0.3em', marginBottom: '-0.3em' }"
              >
                {{ question.operation }}
              </div>
              <div
                class="text-right"
                style="border-bottom: 4px solid var(--color-deep); padding-bottom: 0.2em; min-width: 3ch;"
              >
                {{ question.num2 }}
              </div>
              <div
                class="flex justify-end"
                style="margin-top: 0.3em;"
              >
                <VerticalAnswerInput
                  v-if="!showAnswers && inputMode === 'column-by-column'"
                  :ref="el => setInputRef(el, index)"
                  v-model="question.userAnswer"
                  :correct-answer="question.answer"
                  :difficulty="difficulty"
                  @feedback="(data) => handleFeedback(question.id, data)"
                  @correct-answer="() => focusNextInput(index, questions.length)"
                  @focus="focusedIndex = index"
                  @blur="focusedIndex = -1"
                />
                <AnswerInput
                  v-else-if="!showAnswers && inputMode === 'native'"
                  :ref="el => setInputRef(el, index)"
                  v-model="question.userAnswer"
                  :correct-answer="question.answer"
                  :show-border="false"
                  :max-length="12"
                  custom-width="w-[8.4em]"
                  text-align="right"
                  @feedback="(data) => handleFeedback(question.id, data)"
                  @correct-answer="() => focusNextInput(index, questions.length)"
                  @focus="focusedIndex = index"
                  @blur="focusedIndex = -1"
                />
                <span
                  v-else
                  class="text-right opacity-60"
                >{{ question.answer }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PageFooter />
    </div>

    <!-- Print Layout for Vertical Format -->
    <div
      v-if="useVerticalFormat"
      class="hidden print:block"
    >
      <div class="print-page">
        <h2
          class="text-xl font-bold mb-4"
          style="color: black;"
        >
          {{ $t('app.title') }}
        </h2>
        <div
          class="print-vertical-grid"
          dir="ltr"
        >
          <div
            v-for="(question, index) in questions"
            :key="question.id"
            class="print-vertical-item"
          >
            <span class="equation-number">{{ index + 1 }})</span>
            <span class="equation stacked">
              <span class="number">{{ question.num1 }}</span>
              <span class="operator">{{ question.operation }}</span>
              <span class="number">{{ question.num2 }}</span>
              <span class="equals">=</span>
            </span>
          </div>
        </div>
      </div>

      <div
        v-if="showAnswers"
        class="print-page print:break-before-page"
      >
        <h2
          class="text-xl font-bold mb-4"
          style="color: black;"
        >
          {{ $t('answerKey.title') }}
        </h2>
        <div
          class="print-vertical-grid"
          dir="ltr"
        >
          <div
            v-for="(question, index) in questions"
            :key="question.id"
            class="print-vertical-item"
          >
            <span class="equation-number">{{ index + 1 }})</span>
            <span class="equation stacked">
              <span class="number">{{ question.num1 }}</span>
              <span class="operator">{{ question.operation }}</span>
              <span class="number">{{ question.num2 }}</span>
              <span class="equals">=</span>
              <span class="number">{{ question.answer }}</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Print Layout for Horizontal Format (Easy) -->
    <template v-else>
      <div class="hidden print:block">
        <template
          v-for="(page, pageIndex) in paginateQuestions(questions, 30)"
          :key="`page-${pageIndex}`"
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
                  <span class="operator">{{ question.operation }}</span>
                  <span class="number">{{ question.num2 }}</span>
                  <span class="equals">=</span>
                  <span class="answer-blank">_______</span>
                </span>
              </div>
            </div>
          </div>
        </template>

        <template v-if="showAnswers">
          <template
            v-for="(page, pageIndex) in paginateQuestions(questions, 30)"
            :key="`answer-page-${pageIndex}`"
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
                    <span class="operator">{{ question.operation }}</span>
                    <span class="number">{{ question.num2 }}</span>
                    <span class="equals">=</span>
                    <span class="answer-shown">{{ question.answer }}</span>
                  </span>
                </div>
              </div>
            </div>
          </template>
        </template>
      </div>
    </template>
  </div>

  <PageFooter
    v-else
    :show-empty-message="true"
  />
</template>

<script setup>
import { watch, onMounted, ref, computed } from 'vue'
import AnswerInput from './AnswerInput.vue'
import VerticalAnswerInput from './VerticalAnswerInput.vue'
import LongMultiplicationInput from './LongMultiplicationInput.vue'
import LongAdditionSubtractionInput from './LongAdditionSubtractionInput.vue'
import CompletionOverlay from './CompletionOverlay.vue'
import PageFooter from './PageFooter.vue'
import FruitGuide from './FruitGuide.vue'
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
  showGuide: {
    type: Boolean,
    default: false
  },
  difficulty: {
    type: String,
    default: 'easy'
  },
  inputMode: {
    type: String,
    default: 'native'
  }
})

const { feedbackState, handleFeedback, setInputRef, focusNextInput, focusFirstInput, focusInput, clearAllFeedback, getCompletionStats, correctCount } = useQuestionFeedback('math-gen-simple-feedback')

const showCompletionOverlay = ref(false)
const completionStats = ref({ total: 0, firstTry: 0, timeInSeconds: 0, accuracy: 100 })
const focusedIndex = ref(-1)

const useVerticalFormat = computed(() => {
  return props.difficulty === 'medium' || props.difficulty === 'hard'
})

// Example for the Fruit guide
const guideExample = computed(() => {
  // Try to find an addition question first
  let validQuestion = props.questions.find(q => 
    q.operation === '+' && q.num1 > 0 && q.num2 > 0
  )
  
  // If no addition, try subtraction
  if (!validQuestion) {
    validQuestion = props.questions.find(q => 
      q.operation === '-' && q.num1 > 0 && q.num2 > 0
    )
  }
  
  if (validQuestion) {
    return { 
      num1: validQuestion.num1, 
      num2: validQuestion.num2, 
      answer: validQuestion.answer,
      operation: validQuestion.operation
    }
  }
  
  // Fallback
  return { num1: 5, num2: 3, answer: 8, operation: '+' }
})

// Check if a question is a multiplication operation
const isMultiplication = (question) => {
  return question.operation === '×'
}

// Check if a question is addition or subtraction
const isAdditionOrSubtraction = (question) => {
  return question.operation === '+' || question.operation === '-'
}

const operatorMarginLeft = computed(() => {
  return props.difficulty === 'hard' ? '-0.8rem' : '-0.5rem'
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
  .print-vertical-grid {
    width: 100%;
    overflow: hidden;
  }

  .print-vertical-grid::after {
    content: "";
    display: table;
    clear: both;
  }

  .print-vertical-item {
    float: left;
    width: 25%;
    margin-bottom: 3.5em;
    box-sizing: border-box;
  }

  /* Clear floats after every 4th item */
  .print-vertical-item:nth-child(4n+1) {
    clear: left;
  }

  /* Stacked equation styling from StackOverflow */
  .equation-number {
    display: inline-block;
    margin-right: 3em;
    font-family: 'Space Mono', monospace;
    font-size: 14px;
  }

  .equation.stacked {
    display: inline-block;
    font-family: 'Space Mono', monospace;
    font-size: 14px;
    position: relative;
    padding-left: 1em;
  }

  .equation.stacked .number {
    display: block;
    margin-left: 1em;
    text-align: right;
    min-width: 3ch;
  }

  .equation.stacked .operator {
    position: absolute;
    left: 0;
    width: 1em;
    text-align: left;
  }

  .equation.stacked .equals {
    display: block;
    height: 0;
    border-bottom: solid 2px black;
    overflow: hidden;
    margin-right: 0;
  }

  /* Horizontal (non-stacked) equation styling for easy difficulty */
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

  .equation .equals {
    display: inline-block;
    margin: 0 0.3em;
  }

  .equation .answer-blank {
    display: inline-block;
    min-width: 4em;
    margin-left: 0.3em;
  }

  .equation .answer-shown {
    display: inline-block;
    text-align: right;
    min-width: 2ch;
    margin-left: 0.3em;
  }
}
</style>

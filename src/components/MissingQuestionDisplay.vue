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
          @click="focusInput(index)"
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
            <span
              class="text-base sm:text-lg md:text-lg lg:text-xl font-bold whitespace-nowrap"
              style="color: var(--color-deep);"
            >
              <!-- Standard format: ___ + 5 = 10 or 2 + ___ = 7 -->
              <template v-if="!question.format || question.format === 'standard'">
                <template v-if="question.missingPosition === 'first'">
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
                  {{ ' ' + question.operation + ' ' + question.num2 + ' = ' + question.result }}
                </template>
                <template v-else>
                  {{ question.num1 + ' ' + question.operation + ' ' }}
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
                  {{ ' = ' + question.result }}
                </template>
              </template>

              <!-- Both-sides format: various positions -->
              <template v-else-if="question.format === 'both-sides'">
                <template v-if="question.missingPosition === 'right-second'">
                  {{ question.num1 + ' ' + question.operation + ' ' + question.num2 + ' = ' + question.num3 + ' ' + (question.operation2 || question.operation) + ' ' }}
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
                </template>
                <template v-else-if="question.missingPosition === 'right-first'">
                  {{ question.num1 + ' ' + question.operation + ' ' + question.num2 + ' = ' }}
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
                  {{ ' ' + (question.operation2 || question.operation) + ' ' + question.num4 }}
                </template>
                <template v-else-if="question.missingPosition === 'left-second'">
                  {{ question.num1 + ' ' + question.operation + ' ' }}
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
                  {{ ' = ' + question.num3 + ' ' + (question.operation2 || question.operation) + ' ' + question.num4 }}
                </template>
                <template v-else-if="question.missingPosition === 'left-first'">
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
                  {{ ' ' + question.operation + ' ' + question.num2 + ' = ' + question.num3 + ' ' + (question.operation2 || question.operation) + ' ' + question.num4 }}
                </template>
              </template>
            </span>
          </div>
        </div>
      </div>

      <PageFooter />
    </div>

    <div class="hidden print:block">
      <template
        v-for="(page, pageIndex) in paginateQuestions(questions, 30)"
        :key="`missing-page-${pageIndex}`"
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
                <!-- Standard format -->
                <template v-if="!question.format || question.format === 'standard'">
                  <template v-if="question.missingPosition === 'first'">
                    <span class="answer-blank">_______</span>
                    <span class="operator">{{ question.operation }}</span>
                    <span class="number">{{ question.num2 }}</span>
                    <span class="equals">=</span>
                    <span class="number">{{ question.result }}</span>
                  </template>
                  <template v-else>
                    <span class="number">{{ question.num1 }}</span>
                    <span class="operator">{{ question.operation }}</span>
                    <span class="answer-blank">_______</span>
                    <span class="equals">=</span>
                    <span class="number">{{ question.result }}</span>
                  </template>
                </template>

                <!-- Both-sides format -->
                <template v-else-if="question.format === 'both-sides'">
                  <template v-if="question.missingPosition === 'right-second'">
                    <span class="number">{{ question.num1 }}</span>
                    <span class="operator">{{ question.operation }}</span>
                    <span class="number">{{ question.num2 }}</span>
                    <span class="equals">=</span>
                    <span class="number">{{ question.num3 }}</span>
                    <span class="operator">{{ question.operation2 || question.operation }}</span>
                    <span class="answer-blank">_______</span>
                  </template>
                  <template v-else-if="question.missingPosition === 'right-first'">
                    <span class="number">{{ question.num1 }}</span>
                    <span class="operator">{{ question.operation }}</span>
                    <span class="number">{{ question.num2 }}</span>
                    <span class="equals">=</span>
                    <span class="answer-blank">_______</span>
                    <span class="operator">{{ question.operation2 || question.operation }}</span>
                    <span class="number">{{ question.num4 }}</span>
                  </template>
                  <template v-else-if="question.missingPosition === 'left-second'">
                    <span class="number">{{ question.num1 }}</span>
                    <span class="operator">{{ question.operation }}</span>
                    <span class="answer-blank">_______</span>
                    <span class="equals">=</span>
                    <span class="number">{{ question.num3 }}</span>
                    <span class="operator">{{ question.operation2 || question.operation }}</span>
                    <span class="number">{{ question.num4 }}</span>
                  </template>
                  <template v-else-if="question.missingPosition === 'left-first'">
                    <span class="answer-blank">_______</span>
                    <span class="operator">{{ question.operation }}</span>
                    <span class="number">{{ question.num2 }}</span>
                    <span class="equals">=</span>
                    <span class="number">{{ question.num3 }}</span>
                    <span class="operator">{{ question.operation2 || question.operation }}</span>
                    <span class="number">{{ question.num4 }}</span>
                  </template>
                </template>
              </span>
            </div>
          </div>
        </div>
      </template>

      <template v-if="showAnswers">
        <template
          v-for="(page, pageIndex) in paginateQuestions(questions, 30)"
          :key="`missing-answer-page-${pageIndex}`"
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
                  <!-- Standard format answer key -->
                  <template v-if="!question.format || question.format === 'standard'">
                    <span class="number">{{ question.num1 }}</span>
                    <span class="operator">{{ question.operation }}</span>
                    <span class="number">{{ question.num2 }}</span>
                    <span class="equals">=</span>
                    <span class="number">{{ question.result }}</span>
                  </template>

                  <!-- Both-sides format answer key -->
                  <template v-else-if="question.format === 'both-sides'">
                    <template v-if="question.missingPosition === 'right-second'">
                      <span class="number">{{ question.num1 }}</span>
                      <span class="operator">{{ question.operation }}</span>
                      <span class="number">{{ question.num2 }}</span>
                      <span class="equals">=</span>
                      <span class="number">{{ question.num3 }}</span>
                      <span class="operator">{{ question.operation2 || question.operation }}</span>
                      <span class="number">{{ question.answer }}</span>
                    </template>
                    <template v-else-if="question.missingPosition === 'right-first'">
                      <span class="number">{{ question.num1 }}</span>
                      <span class="operator">{{ question.operation }}</span>
                      <span class="number">{{ question.num2 }}</span>
                      <span class="equals">=</span>
                      <span class="number">{{ question.answer }}</span>
                      <span class="operator">{{ question.operation2 || question.operation }}</span>
                      <span class="number">{{ question.num4 }}</span>
                    </template>
                    <template v-else-if="question.missingPosition === 'left-second'">
                      <span class="number">{{ question.num1 }}</span>
                      <span class="operator">{{ question.operation }}</span>
                      <span class="number">{{ question.answer }}</span>
                      <span class="equals">=</span>
                      <span class="number">{{ question.num3 }}</span>
                      <span class="operator">{{ question.operation2 || question.operation }}</span>
                      <span class="number">{{ question.num4 }}</span>
                    </template>
                    <template v-else-if="question.missingPosition === 'left-first'">
                      <span class="number">{{ question.answer }}</span>
                      <span class="operator">{{ question.operation }}</span>
                      <span class="number">{{ question.num2 }}</span>
                      <span class="equals">=</span>
                      <span class="number">{{ question.num3 }}</span>
                      <span class="operator">{{ question.operation2 || question.operation }}</span>
                      <span class="number">{{ question.num4 }}</span>
                    </template>
                  </template>
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
import { watch, onMounted, ref } from 'vue'
import AnswerInput from './AnswerInput.vue'
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

const { feedbackState, handleFeedback, setInputRef, focusNextInput, focusFirstInput, focusInput, clearAllFeedback, getCompletionStats, correctCount } = useQuestionFeedback('math-gen-missing-feedback')

const showCompletionOverlay = ref(false)
const completionStats = ref({ total: 0, firstTry: 0, timeInSeconds: 0, accuracy: 100 })
const focusedIndex = ref(-1)

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
}
</style>

<template>
  <div v-if="questions.length > 0">
    <div class="print:hidden">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6" dir="ltr">
        <div
          v-for="(question, index) in questions"
          :key="question.id"
          class="question-card relative rounded-2xl p-3 sm:p-4 border-4"
          :style="getCardStyle(index)"
        >
          <div class="absolute -top-3 -left-3 w-10 h-10 rounded-full flex items-center justify-center font-bold border-4"
               :style="getBadgeStyle(index)">
            <span>{{ index + 1 }}</span>
          </div>

          <div class="flex items-center justify-center pt-2" style="font-family: 'Space Mono', monospace;" dir="ltr">
            <span class="text-base sm:text-lg md:text-xl lg:text-2xl font-bold whitespace-nowrap" style="color: var(--color-deep);">
              {{ question.num1 }} {{ question.operation }} {{ question.num2 }} = <span class="inline-block align-bottom border-b-4 min-w-[3rem] sm:min-w-[3.5rem]" :style="{ borderColor: 'var(--color-deep)' }"><span v-if="showAnswers" class="opacity-40">{{ question.answer }}</span><span v-else>&#8203;</span></span>
            </span>
          </div>
        </div>
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
    <p class="text-xl" style="color: var(--color-orange);">{{ $t('emptyState.message') }}</p>
  </div>
</template>

<script setup>
import PrintLayout from './PrintLayout.vue'

const props = defineProps({
  questions: {
    type: Array,
    required: true
  },
  showAnswers: {
    type: Boolean,
    default: false
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
  return {
    background: color,
    borderColor: 'var(--color-deep)',
  }
}

const getBadgeStyle = (index) => {
  const bgColors = ['var(--color-orange)', 'var(--color-purple)', 'var(--color-sky)', 'var(--color-mint)']
  const bg = bgColors[index % bgColors.length]
  return {
    background: bg,
    borderColor: 'var(--color-deep)',
    color: 'white',
  }
}

const formatPrintQuestion = (questionNum, num1, num2, operation) => {
  const numStr = String(questionNum).padStart(3, ' ')
  const num1Str = String(num1).padStart(3, ' ')
  const num2Str = String(num2).padStart(3, ' ')
  return `${numStr})  ${num1Str} ${operation} ${num2Str}  =  __________`
}

const formatPrintAnswer = (questionNum, num1, num2, operation, answer) => {
  const numStr = String(questionNum).padStart(3, ' ')
  const num1Str = String(num1).padStart(3, ' ')
  const num2Str = String(num2).padStart(3, ' ')
  const answerStr = String(answer).padStart(4, ' ')
  return `${numStr})  ${num1Str} ${operation} ${num2Str}  =  ${answerStr}`
}
</script>

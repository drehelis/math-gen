<template>
  <div v-if="questions.length > 0">
    <div class="hidden print:block print:mb-4">
      <h2 class="text-xl font-bold" style="color: black;">{{ $t('app.title') }}</h2>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 print:grid-cols-2 print:gap-4" dir="ltr">
      <div
        v-for="(question, index) in questions"
        :key="question.id"
        class="question-card relative rounded-2xl p-3 sm:p-4 border-4 print:border-0 print:rounded-none print:bg-transparent print:p-2"
        :style="getCardStyle(index)"
      >
        <div class="absolute -top-3 -left-3 w-10 h-10 rounded-full flex items-center justify-center font-bold border-4 print:hidden"
             :style="getBadgeStyle(index)">
          <span class="print:text-black print:text-sm">{{ index + 1 }}</span>
        </div>

        <div class="flex items-center justify-center pt-2 print:justify-start print:pt-0" style="font-family: 'Space Mono', monospace;" dir="ltr">
          <span class="hidden print:inline print:text-base print:text-black print:font-normal" style="white-space: pre;">{{ formatPrintQuestion(index + 1, question) }}</span>

          <span class="text-base sm:text-lg md:text-xl lg:text-2xl font-bold print:hidden whitespace-nowrap" style="color: var(--color-deep);">
            <template v-if="question.missingPosition === 'first'">
              <span class="inline-block align-bottom border-b-4 min-w-[3rem] sm:min-w-[3.5rem]" :style="{ borderColor: 'var(--color-deep)' }">
                <span v-if="showAnswers" class="opacity-40">{{ question.answer }}</span>
                <span v-else>&#8203;</span>
              </span>
              {{ ' ' + question.operation + ' ' + question.num2 + ' = ' + question.result }}
            </template>
            <template v-else>
              {{ question.num1 + ' ' + question.operation + ' ' }}
              <span class="inline-block align-bottom border-b-4 min-w-[3rem] sm:min-w-[3.5rem]" :style="{ borderColor: 'var(--color-deep)' }">
                <span v-if="showAnswers" class="opacity-40">{{ question.answer }}</span>
                <span v-else>&#8203;</span>
              </span>
              {{ ' = ' + question.result }}
            </template>
          </span>
        </div>
      </div>
    </div>

    <div v-if="showAnswers" class="hidden print:block print:break-before-page print:mt-0">
      <div class="print:mb-4">
        <h2 class="text-xl font-bold" style="color: black;">{{ $t('answerKey.title') }}</h2>
      </div>

      <div class="print:grid print:grid-cols-2 print:gap-x-8 print:gap-y-1">
        <div
          v-for="(question, index) in questions"
          :key="'answer-print-' + question.id"
          class="print:text-base print:text-black"
          style="font-family: 'Space Mono', monospace; direction: ltr; white-space: pre;"
        >{{ formatPrintAnswer(index + 1, question) }}</div>
      </div>
    </div>
  </div>

  <div v-else class="text-center py-20 no-print">
    <h3 class="text-3xl font-bold mb-3" style="color: var(--color-deep);">{{ $t('emptyState.title') }}</h3>
    <p class="text-xl" style="color: var(--color-orange);">{{ $t('emptyState.message') }}</p>
  </div>
</template>

<script setup>
defineProps({
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

const operatorColors = [
  'var(--color-orange)',
  'var(--color-purple)',
  'var(--color-sky)',
  'var(--color-mint)',
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

const formatPrintQuestion = (questionNum, question) => {
  const numStr = String(questionNum).padStart(3, ' ')
  if (question.missingPosition === 'first') {
    const num2Str = String(question.num2).padStart(3, ' ')
    const resultStr = String(question.result).padStart(4, ' ')
    return `${numStr})  __________ ${question.operation} ${num2Str}  =  ${resultStr}`
  } else {
    const num1Str = String(question.num1).padStart(3, ' ')
    const resultStr = String(question.result).padStart(4, ' ')
    return `${numStr})  ${num1Str} ${question.operation} __________  =  ${resultStr}`
  }
}

const formatPrintAnswer = (questionNum, question) => {
  const numStr = String(questionNum).padStart(3, ' ')
  const num1Str = String(question.num1).padStart(3, ' ')
  const num2Str = String(question.num2).padStart(3, ' ')
  const resultStr = String(question.result).padStart(4, ' ')
  return `${numStr})  ${num1Str} ${question.operation} ${num2Str}  =  ${resultStr}`
}
</script>

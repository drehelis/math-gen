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

          <div class="flex items-center justify-center pt-2" style="font-family: 'Space Mono', monospace;" dir="ltr">
            <span class="text-base sm:text-lg md:text-xl lg:text-2xl font-bold whitespace-nowrap" style="color: var(--color-deep);">
              <template v-if="question.missingPosition === 'first'">
                <AnswerInput v-if="!showAnswers" :correct-answer="question.answer" @feedback="(data) => handleFeedback(question.id, data)" />
                <span v-else class="inline-block align-bottom border-b-4 min-w-[4rem] sm:min-w-[4.5rem]" :style="{ borderColor: 'var(--color-deep)' }">
                  <span class="opacity-40">{{ question.answer }}</span>
                </span>
                {{ ' ' + question.operation + ' ' + question.num2 + ' = ' + question.result }}
              </template>
              <template v-else>
                {{ question.num1 + ' ' + question.operation + ' ' }}
                <AnswerInput v-if="!showAnswers" :correct-answer="question.answer" @feedback="(data) => handleFeedback(question.id, data)" />
                <span v-else class="inline-block align-bottom border-b-4 min-w-[4rem] sm:min-w-[4.5rem]" :style="{ borderColor: 'var(--color-deep)' }">
                  <span class="opacity-40">{{ question.answer }}</span>
                </span>
                {{ ' = ' + question.result }}
              </template>
            </span>
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

    <PrintLayout :items="questions" :title="$t('app.title')" page-key-prefix="missing-question">
      <template #item="{ item }">
        <div
          class="print:text-base print:text-black print:p-2"
          style="font-family: 'Space Mono', monospace; direction: ltr; white-space: pre;"
        >{{ formatPrintQuestion(item.displayIndex, item) }}</div>
      </template>
    </PrintLayout>

    <PrintLayout v-if="showAnswers" :items="questions" :title="$t('answerKey.title')" page-key-prefix="missing-answer" gap-class="print:gap-x-8 print:gap-y-1" :force-page-break="true">
      <template #item="{ item }">
        <div
          class="print:text-base print:text-black"
          style="font-family: 'Space Mono', monospace; direction: ltr; white-space: pre;"
        >{{ formatPrintAnswer(item.displayIndex, item) }}</div>
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
import { ref, computed, watch } from 'vue'
import PrintLayout from './PrintLayout.vue'
import AnswerInput from './AnswerInput.vue'
import confetti from 'canvas-confetti'

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

const feedbackState = ref({})
const confettiCount = ref(0)
const lastCorrectCount = ref(0)

const correctCount = computed(() => {
  return Object.values(feedbackState.value).filter(
    state => state.show && state.isCorrect
  ).length
})

const handleFeedback = (questionId, data) => {
  feedbackState.value[questionId] = data
}

// Watch for multiples of 4 correct answers and trigger different confetti effects
watch(correctCount, (newCount) => {
  const newMilestone = Math.floor(newCount / 4)
  const oldMilestone = Math.floor(lastCorrectCount.value / 4)

  if (newMilestone > oldMilestone && newCount % 4 === 0) {
    confettiCount.value = newMilestone
    triggerConfetti(newMilestone)
  }

  lastCorrectCount.value = newCount
})

const triggerConfetti = (milestone) => {
  const effects = [
    // Effect 1: Classic burst from sides
    () => {
      const duration = 3000
      const animationEnd = Date.now() + duration
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }

      function randomInRange(min, max) {
        return Math.random() * (max - min) + min
      }

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now()
        if (timeLeft <= 0) return clearInterval(interval)

        const particleCount = 50 * (timeLeft / duration)
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        })
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        })
      }, 250)
    },

    // Effect 2: Fireworks
    () => {
      const duration = 2000
      const animationEnd = Date.now() + duration

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now()
        if (timeLeft <= 0) return clearInterval(interval)

        confetti({
          particleCount: 100,
          startVelocity: 45,
          spread: 360,
          zIndex: 9999,
          origin: {
            x: Math.random(),
            y: Math.random() * 0.6
          },
          colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A']
        })
      }, 400)
    },

    // Effect 3: Confetti cannon from bottom
    () => {
      const count = 200
      const defaults = {
        origin: { y: 0.9 },
        zIndex: 9999
      }

      function fire(particleRatio, opts) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio)
        })
      }

      fire(0.25, { spread: 26, startVelocity: 55 })
      fire(0.2, { spread: 60 })
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 })
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 })
      fire(0.1, { spread: 120, startVelocity: 45 })
    },

    // Effect 4: Stars from center
    () => {
      const duration = 2500
      const animationEnd = Date.now() + duration

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now()
        if (timeLeft <= 0) return clearInterval(interval)

        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0.5, y: 0.5 },
          colors: ['#bb0000', '#ffffff'],
          shapes: ['star'],
          scalar: 1.5,
          zIndex: 9999
        })
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 0.5, y: 0.5 },
          colors: ['#bb0000', '#ffffff'],
          shapes: ['star'],
          scalar: 1.5,
          zIndex: 9999
        })
      }, 100)
    },

    // Effect 5: Rainbow cascade
    () => {
      const duration = 3000
      const animationEnd = Date.now() + duration

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now()
        if (timeLeft <= 0) return clearInterval(interval)

        const particleCount = 3
        confetti({
          particleCount,
          startVelocity: 30,
          spread: 360,
          ticks: 100,
          zIndex: 9999,
          origin: {
            x: Math.random(),
            y: 0
          },
          colors: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3']
        })
      }, 100)
    }
  ]

  // Cycle through effects based on milestone
  const effectIndex = (milestone - 1) % effects.length
  effects[effectIndex]()
}

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

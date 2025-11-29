import { ref, computed, watch } from 'vue'
import confetti from 'canvas-confetti'

export function useQuestionFeedback() {
  const feedbackState = ref({})
  const confettiCount = ref(0)
  const lastCorrectCount = ref(0)
  const inputRefs = ref([])

  const correctCount = computed(() => {
    return Object.values(feedbackState.value).filter(
      state => state.show && state.isCorrect
    ).length
  })

  const handleFeedback = (questionId, data) => {
    feedbackState.value[questionId] = data
  }

  const setInputRef = (el, index) => {
    if (el) {
      inputRefs.value[index] = el
    }
  }

  const focusNextInput = (currentIndex, totalQuestions) => {
    const nextIndex = currentIndex + 1
    if (nextIndex < totalQuestions) {
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => {
        inputRefs.value[nextIndex]?.focus()
      }, 100)
    }
  }

  const focusFirstInput = () => {
    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      inputRefs.value[0]?.focus()
    }, 100)
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

  return {
    feedbackState,
    handleFeedback,
    setInputRef,
    focusNextInput,
    focusFirstInput
  }
}

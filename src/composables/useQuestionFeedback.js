import { ref, computed, watch } from 'vue'
import confetti from 'canvas-confetti'

export function useQuestionFeedback(storageKey) {
  const loadFeedbackState = () => {
    if (!storageKey) return {}
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (error) {
      console.error('Failed to load feedback state:', error)
    }
    return {}
  }

  const saveFeedbackState = (state) => {
    if (!storageKey) return
    try {
      localStorage.setItem(storageKey, JSON.stringify(state))
    } catch (error) {
      console.error('Failed to save feedback state:', error)
    }
  }

  const feedbackState = ref(loadFeedbackState())
  const confettiCount = ref(0)
  const lastCorrectCount = ref(0)
  const inputRefs = ref([])
  const startTime = ref(Date.now())
  const attemptTracker = ref({})

  if (storageKey) {
    watch(feedbackState, (newState) => {
      saveFeedbackState(newState)
    }, { deep: true })
  }

  const correctCount = computed(() => {
    return Object.values(feedbackState.value).filter(
      state => state.show && state.isCorrect
    ).length
  })

  const handleFeedback = (questionId, data) => {
    if (data.show) {
      if (!attemptTracker.value[questionId]) {
        attemptTracker.value[questionId] = 0
      }

      const previousState = feedbackState.value[questionId]
      if (!previousState || !previousState.isCorrect) {
        attemptTracker.value[questionId]++
      }

      feedbackState.value[questionId] = {
        ...data,
        attempts: attemptTracker.value[questionId],
        firstTry: attemptTracker.value[questionId] === 1 && data.isCorrect
      }
    } else {
      feedbackState.value[questionId] = data
    }
  }

  const resetStats = () => {
    startTime.value = Date.now()
    attemptTracker.value = {}
  }

  const clearAllFeedback = () => {
    feedbackState.value = {}
    attemptTracker.value = {}
    startTime.value = Date.now()
    if (storageKey) {
      try {
        localStorage.removeItem(storageKey)
      } catch (error) {
        console.error('Failed to clear feedback state:', error)
      }
    }
  }

  const getCompletionStats = (totalQuestions) => {
    const timeInSeconds = Math.floor((Date.now() - startTime.value) / 1000)
    const firstTryCorrect = Object.values(feedbackState.value).filter(
      state => state.firstTry
    ).length
    const accuracy = totalQuestions > 0 ? Math.round((firstTryCorrect / totalQuestions) * 100) : 100

    return {
      total: totalQuestions,
      firstTry: firstTryCorrect,
      timeInSeconds,
      accuracy
    }
  }

  const setInputRef = (el, index) => {
    if (el) {
      inputRefs.value[index] = el
    }
  }

  const focusNextInput = (currentIndex, totalQuestions) => {
    const nextIndex = currentIndex + 1
    if (nextIndex < totalQuestions) {
      setTimeout(() => {
        inputRefs.value[nextIndex]?.focus()
      }, 100)
    }
  }

  const focusFirstInput = (questions = []) => {
    setTimeout(() => {
      let targetIndex = 0

      if (questions.length > 0) {
        let lastAnsweredIndex = -1
        for (let i = 0; i < questions.length; i++) {
          const questionId = questions[i].id
          const feedback = feedbackState.value[questionId]

          if (feedback && feedback.isCorrect) {
            lastAnsweredIndex = i
          }
        }

        targetIndex = lastAnsweredIndex + 1

        if (targetIndex >= questions.length) {
          targetIndex = 0
          for (let i = 0; i < questions.length; i++) {
            const questionId = questions[i].id
            const feedback = feedbackState.value[questionId]

            if (!feedback || !feedback.isCorrect) {
              targetIndex = i
              break
            }
          }
        }
      }

      inputRefs.value[targetIndex]?.focus()
    }, 100)
  }

  const focusInput = (index) => {
    inputRefs.value[index]?.focus()
  }

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

        const interval = setInterval(function () {
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

        const interval = setInterval(function () {
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

        const interval = setInterval(function () {
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

        const interval = setInterval(function () {
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
    focusFirstInput,
    focusInput,
    resetStats,
    clearAllFeedback,
    getCompletionStats,
    correctCount,
    handleBadgeClick: (question, index, customReset = null, customFocus = null) => {
      const feedback = feedbackState.value[question.id]
      
      if (feedback && !feedback.isCorrect) {
        if (customReset) {
          customReset()
        } else {
          question.userAnswer = ''
        }
        
        if (customFocus) {
          customFocus()
        } else {
          focusInput(index)
        }
      }
    }
  }
}

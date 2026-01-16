<template>
  <transition
    enter-active-class="transition ease-out duration-300"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition ease-in duration-200"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="show"
      class="fixed inset-0 flex items-center justify-center z-50 p-4"
      style="background: rgba(26, 26, 46, 0.8);"
      @click="handleClose"
    >
      <transition
        enter-active-class="transition ease-out duration-300 delay-100"
        enter-from-class="transform scale-90 opacity-0"
        enter-to-class="transform scale-100 opacity-100"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="transform scale-100 opacity-100"
        leave-to-class="transform scale-90 opacity-0"
      >
        <div
          v-if="show"
          class="bg-white rounded-3xl p-8 md:p-12 shadow-2xl border-8 max-w-md w-full relative"
          style="border-color: var(--color-deep);"
          @click.stop
        >
          <div class="text-center mb-8">
            <h2
              class="text-4xl md:text-5xl font-bold mb-2"
              style="color: var(--color-deep);"
            >
              {{ $t('completion.title') }}
            </h2>
            <p
              class="text-xl font-semibold"
              style="color: var(--color-orange);"
            >
              {{ $t('completion.subtitle') }}
            </p>
          </div>

          <div class="space-y-4 mb-8">
            <div
              class="flex justify-between items-center p-4 rounded-2xl border-4"
              style="background: var(--color-sunshine); border-color: var(--color-deep);"
            >
              <span
                class="font-bold text-lg"
                style="color: var(--color-deep);"
              >{{ $t('completion.total') }}:</span>
              <span
                class="font-bold text-2xl"
                style="color: var(--color-deep);"
              >{{ stats.total }}</span>
            </div>

            <div
              class="flex justify-between items-center p-4 rounded-2xl border-4"
              style="background: var(--color-sky); border-color: var(--color-deep);"
            >
              <span class="font-bold text-lg text-white">{{ $t('completion.time') }}:</span>
              <span class="font-bold text-2xl text-white">{{ formattedTime }}</span>
            </div>
          </div>

          <div class="flex justify-center">
            <button
              class="px-6 py-2 font-semibold text-base rounded-xl border-3 transition-all transform hover:scale-105 active:scale-95"
              style="background: var(--color-purple); border-color: var(--color-deep); color: white;"
              @click="handleClose"
            >
              {{ $t('completion.close') }}
            </button>
          </div>
        </div>
      </transition>
    </div>
  </transition>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  stats: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close'])

const formattedTime = computed(() => {
  const seconds = props.stats.timeInSeconds
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  
  if (mins > 0) {
    return `${mins}m ${secs}s`
  }
  return `${secs}s`
})

const handleClose = () => {
  emit('close')
}
</script>

<template>
  <div class="no-print">
    <div class="flex gap-1 sm:gap-2 items-center" dir="ltr">
      <button
        v-for="lang in languages"
        :key="lang.code"
        @click="$emit('change-locale', lang.code)"
        class="px-2 sm:px-4 py-1 sm:py-2 text-sm sm:text-base font-bold rounded-lg sm:rounded-xl transition-all transform hover:scale-105 min-w-[60px] sm:min-w-[100px]"
        :class="currentLocale === lang.code ? 'scale-105' : 'opacity-60'"
        :style="getButtonStyle(lang.code)"
      >
        <span class="inline-block">{{ lang.label }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

defineEmits(['change-locale'])

const languages = [
  { code: 'en', label: 'English' },
  { code: 'he', label: 'עברית' }
]

const currentLocale = computed(() => locale.value)

const getButtonStyle = (langCode) => {
  const isActive = currentLocale.value === langCode
  return {
    background: isActive ? 'var(--color-sky)' : 'var(--color-bg)',
    borderColor: 'var(--color-deep)',
    color: isActive ? 'white' : 'var(--color-deep)',
    borderWidth: '3px'
  }
}
</script>

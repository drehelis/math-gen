<template>
  <div class="min-h-screen p-4 md:p-8 print:bg-white print:p-0" style="background: var(--color-bg);">
    <div class="no-print fixed inset-0 overflow-hidden pointer-events-none opacity-20">
      <div class="absolute top-10 left-10 font-bold" style="color: var(--color-orange); animation: float 6s ease-in-out infinite; font-size: 15rem;">+</div>
      <div class="absolute top-40 right-20 font-bold" style="color: var(--color-coral); animation: float 8s ease-in-out infinite 1s; font-size: 12rem;">-</div>
      <div class="absolute bottom-20 left-1/4 font-bold" style="color: var(--color-sky); animation: float 7s ease-in-out infinite 2s; font-size: 16rem;">×</div>
      <div class="absolute bottom-40 right-1/3 font-bold" style="color: var(--color-mint); animation: float 9s ease-in-out infinite 0.5s; font-size: 11rem;">÷</div>
      <div class="absolute top-1/2 right-10 font-bold" style="color: var(--color-purple); animation: float 10s ease-in-out infinite 1.5s; font-size: 13rem;">=</div>
      <div class="absolute top-1/3 left-1/3 font-bold" style="color: var(--color-sunshine); animation: float 11s ease-in-out infinite 2.5s; font-size: 10rem;">+</div>
    </div>

    <div class="max-w-7xl mx-auto relative z-10">
      <ControlPanel
        :settings="currentTabData.settings.value"
        :has-questions="currentTabData.questions.value.length > 0"
        :show-controls="true"
        :hide-operation="activeTab === 'complex'"
        @update:settings="currentTabData.updateSettings"
        @generate="currentTabData.generateQuestions"
      >
        <template #language-switcher>
          <LanguageSwitcher @change-locale="changeLocale" />
        </template>
        <template #tabs>
          <TabBar v-model="activeTab" :tabs="tabs" />
        </template>
      </ControlPanel>

      <QuestionDisplay
        v-show="activeTab === 'simple'"
        :questions="simpleTab.questions.value"
        :show-answers="simpleTab.settings.value.showAnswers"
      />

      <MissingQuestionDisplay
        v-show="activeTab === 'complex'"
        :questions="missingTab.questions.value"
        :show-answers="missingTab.settings.value.showAnswers"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSimpleQuestionGenerator } from './composables/useSimpleQuestionGenerator'
import { useMissingQuestionGenerator } from './composables/useMissingQuestionGenerator'
import ControlPanel from './components/ControlPanel.vue'
import QuestionDisplay from './components/QuestionDisplay.vue'
import MissingQuestionDisplay from './components/MissingQuestionDisplay.vue'
import LanguageSwitcher from './components/LanguageSwitcher.vue'
import TabBar from './components/TabBar.vue'
import { useI18n } from 'vue-i18n'

const { locale, t } = useI18n()

const simpleTab = useSimpleQuestionGenerator()
const missingTab = useMissingQuestionGenerator()

const activeTab = ref('simple')

const currentTabData = computed(() => {
  return activeTab.value === 'simple' ? simpleTab : missingTab
})

const tabs = computed(() => [
  { value: 'simple', label: t('tabs.simple') },
  { value: 'complex', label: t('tabs.complex') }
])

const changeLocale = (lang) => {
  locale.value = lang
  localStorage.setItem('locale', lang)
  document.documentElement.setAttribute('dir', lang === 'he' ? 'rtl' : 'ltr')
}
</script>

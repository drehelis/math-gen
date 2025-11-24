import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import he from './locales/he.json'

const savedLocale = localStorage.getItem('locale') || 'en'

const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'en',
  messages: {
    en,
    he
  }
})

document.documentElement.setAttribute('dir', savedLocale === 'he' ? 'rtl' : 'ltr')

export default i18n

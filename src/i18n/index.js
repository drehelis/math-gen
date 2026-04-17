import { createI18n } from "vue-i18n";
import en from "./locales/en.json";
import he from "./locales/he.json";

let savedLocale = "en";
try {
  savedLocale = localStorage.getItem("locale") || "en";
} catch (error) {
  console.error("Failed to load locale from localStorage:", error);
}

const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: "en",
  messages: {
    en,
    he,
  },
});

document.documentElement.setAttribute(
  "dir",
  savedLocale === "he" ? "rtl" : "ltr",
);

export default i18n;

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { en } from "./locales/en";
import { am } from "./locales/am";
import { om } from "./locales/om"; // <--- Import Oromo
import { ti } from "./locales/ti"; // <--- Import Tigrinya

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: en,
      am: am,
      om: om, // <--- Add here
      ti: ti  // <--- Add here
    },
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n;
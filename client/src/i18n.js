import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { en } from "./locales/en";
import { am } from "./locales/am";
import { om } from "./locales/om"; 
import { ti } from "./locales/ti"; 
import { so } from "./locales/so";
import { af } from "./locales/af";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: en,
      am: am,
      om: om,
      ti: ti,
      so:so,
      af:af
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
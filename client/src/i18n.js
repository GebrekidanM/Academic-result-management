import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { en } from "@shared/locales/en";
import { am } from "@shared/locales/am";
import { om } from "@shared/locales/om"; 
import { ti } from "@shared/locales/ti"; 
import { so } from "@shared/locales/so";
import { af } from "@shared/locales/af";

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
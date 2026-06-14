import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { en } from "./src/locales/en";
import { am } from "./src/locales/am";
import { om } from "./src/locales/om";
import { ti } from "./src/locales/ti";
import { so } from "./src/locales/so";
import { af } from "./src/locales/af";

i18n
  .use(initReactI18next)
  .init({
    resources: {en, am, om, ti, so, af },
    lng: "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
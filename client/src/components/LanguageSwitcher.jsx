import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = ({ closeMenu }) => {
  const { i18n } = useTranslation();

  const handleLanguageChange = (e) => {
    i18n.changeLanguage(e.target.value);
    if (closeMenu) {
      closeMenu();
    }
  };

  // Define languages to avoid code duplication
  const languages = [
    { code: 'en', flag: '🇺🇸', full: 'English', short: 'Eng' },
    { code: 'am', flag: '🇪🇹', full: 'አማርኛ', short: 'አማ' },
    { code: 'om', flag: '🌳', full: 'Afaan Oromoo', short: 'Oro' },
    { code: 'ti', flag: '⛰️', full: 'ትግርኛ', short: 'ትግ' },
    { code: 'so', flag: '🇸🇴', full: 'Soomaali', short: 'Som' },
    { code: 'af', flag: '🇩🇯', full: 'Qafaraf', short: 'Qaf' },
  ];

  return (
    <div className="relative print:hidden">
      
      {/* --- 1. MOBILE VERSION (Short Text) --- */}
      {/* Visible only on small screens (md:hidden) */}
      <select
        onChange={handleLanguageChange}
        value={i18n.language}
        className="md:hidden appearance-none bg-gray-800 text-white border border-gray-600 px-2 py-1 pr-6 rounded focus:outline-none text-xs font-bold w-full"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.short}
          </option>
        ))}
      </select>

      {/* --- 2. DESKTOP VERSION (Full Text) --- */}
      {/* Hidden on small screens, visible on medium+ (hidden md:block) */}
      <select
        onChange={handleLanguageChange}
        value={i18n.language}
        className="hidden md:block appearance-none bg-gray-800 text-white border border-gray-600 hover:border-gray-400 px-4 py-1 pr-8 rounded focus:outline-none focus:shadow-outline text-sm font-bold cursor-pointer"
        style={{ textAlignLast: 'center' }}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.full}
          </option>
        ))}
      </select>
      
      {/* Custom Arrow Icon */}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
        <svg className="fill-current h-3 w-3 md:h-4 md:w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
        </svg>
      </div>
    </div>
  );
};

export default LanguageSwitcher;
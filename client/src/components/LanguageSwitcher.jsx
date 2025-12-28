import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = ({closeMenu}) => {
  const { i18n } = useTranslation();

  const changeLanguage = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <div className="relative print:hidden">
      <select
        onChange={changeLanguage}
        value={i18n.language}
        className="appearance-none bg-gray-800 text-white border border-gray-600 hover:border-gray-400 px-4 py-1 pr-8 rounded leading-tight focus:outline-none focus:shadow-outline text-sm font-bold cursor-pointer"
        style={{ textAlignLast: 'center' }}
      >
        <option value="en"onClick={closeMenu}>🇺🇸 English</option>
        <option value="am" onClick={closeMenu}>🇪🇹 አማርኛ</option>
        <option value="om" onClick={closeMenu}>🌳 Afaan Oromoo</option>
        <option value="ti" onClick={closeMenu}>⛰️ ትግርኛ</option>
      </select>
      
      {/* Custom Arrow Icon for the select box */}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
        </svg>
      </div>
    </div>
  );
};

export default LanguageSwitcher;
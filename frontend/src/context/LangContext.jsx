import React, { createContext, useContext, useState, useCallback } from 'react';
import { translations } from '../i18n/index.js';

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('marketplace_lang') || 'ru';
  });

  const changeLang = useCallback((newLang) => {
    if (translations[newLang]) {
      setLang(newLang);
      localStorage.setItem('marketplace_lang', newLang);
    }
  }, []);

  const t = useCallback((key) => {
    const dict = translations[lang] || translations.ru;
    return dict[key] || translations.ru[key] || key;
  }, [lang]);

  const getCatName = useCallback((cat) => {
    if (!cat) return '';
    switch (lang) {
      case 'uz': return cat.name_uz || cat.name_ru;
      case 'en': return cat.name_en || cat.name_ru;
      default: return cat.name_ru;
    }
  }, [lang]);

  return (
    <LangContext.Provider value={{ lang, changeLang, t, getCatName }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within LangProvider');
  return ctx;
}

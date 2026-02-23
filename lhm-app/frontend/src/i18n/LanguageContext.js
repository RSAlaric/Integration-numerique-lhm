import React, { createContext, useContext, useState, useCallback } from 'react';
import { translations } from './translations';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lhm-lang') || 'fr');

  const changeLang = useCallback((l) => {
    setLang(l);
    localStorage.setItem('lhm-lang', l);
  }, []);

  // t('personnel.title') -> translations[lang].personnel.title
  const t = useCallback((key) => {
    const parts = key.split('.');
    let val = translations[lang];
    for (const p of parts) {
      if (val == null) return key;
      val = val[p];
    }
    return val ?? key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang: changeLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be inside LanguageProvider');
  return ctx;
}

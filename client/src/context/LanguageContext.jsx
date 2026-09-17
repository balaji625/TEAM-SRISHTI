/**
 * LanguageContext — CarePath AI
 *
 * Provides current language + t() translation helper to the entire app.
 * Persists selection to localStorage under 'cp_lang'.
 * Supports: English (en), Hindi (hi), Telugu (te)
 */

import { createContext, useContext, useState, useCallback } from 'react';
import { TRANSLATIONS } from '../utils/translations';

const LanguageContext = createContext(null);

const LANG_KEY = 'cp_lang';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English',  nativeName: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi',    nativeName: 'हिन्दी',   flag: '🇮🇳' },
  { code: 'te', name: 'Telugu',   nativeName: 'తెలుగు',   flag: '🇮🇳' },
];

export const LanguageProvider = ({ children }) => {
  const [lang, setLangState] = useState(() => {
    const saved = localStorage.getItem(LANG_KEY);
    return SUPPORTED_LANGUAGES.some((l) => l.code === saved) ? saved : 'en';
  });

  const setLang = useCallback((code) => {
    if (SUPPORTED_LANGUAGES.some((l) => l.code === code)) {
      localStorage.setItem(LANG_KEY, code);
      setLangState(code);
    }
  }, []);

  /**
   * t(key) — resolves dot-notation key in the current language pack,
   * with automatic fallback to English.
   */
  const t = useCallback(
    (key) => {
      const keys = key.split('.');
      const resolve = (pack) =>
        pack ? keys.reduce((acc, k) => (acc && typeof acc === 'object' ? acc[k] : undefined), pack) : undefined;
      return resolve(TRANSLATIONS[lang]) ?? resolve(TRANSLATIONS.en) ?? key;
    },
    [lang]
  );

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === lang) ?? SUPPORTED_LANGUAGES[0];

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, currentLang, SUPPORTED_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
  return ctx;
};

export default LanguageContext;

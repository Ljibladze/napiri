'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { type Lang, type TKey, getT, LANGS } from '@/lib/translations';

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TKey) => string;
}

const LangContext = createContext<LangCtx>({
  lang: 'ka',
  setLang: () => {},
  t: (k) => k,
});

const VALID: Lang[] = LANGS.map((l) => l.code);
const STORAGE_KEY = 'napiri_lang';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ka');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (saved && VALID.includes(saved)) setLangState(saved);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const t = useCallback(getT(lang), [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}

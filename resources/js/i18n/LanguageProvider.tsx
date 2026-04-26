import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { LANGUAGES, translations  } from './translations';
import type {Language} from './translations';

const STORAGE_KEY = 'mr-lang';

interface LanguageContextValue {
  lang: Language;
  setLang: (next: Language) => void;
  t: (path: string, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function readInitialLang(): Language {
  if (typeof window === 'undefined') {
return 'en';
}

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (stored === 'en' || stored === 'fr') {
return stored;
}
  } catch {
    /* localStorage unavailable */
  }

  const nav = window.navigator?.language?.toLowerCase() ?? '';

  return nav.startsWith('fr') ? 'fr' : 'en';
}

function resolve(
  lang: Language,
  path: string,
  vars?: Record<string, string | number>,
): string {
  const [section, key] = path.split('.', 2);
  const value =
    translations[lang]?.[section]?.[key] ??
    translations.en[section]?.[key] ??
    path;

  if (!vars) {
return value;
}

  return value.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => readInitialLang());

  useEffect(() => {
    if (typeof document === 'undefined') {
return;
}

    document.documentElement.setAttribute('lang', lang);
  }, [lang]);

  const setLang = useCallback((next: Language) => {
    setLangState(next);

    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* noop */
    }
  }, []);

  const t = useCallback(
    (path: string, vars?: Record<string, string | number>) =>
      resolve(lang, path, vars),
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(LanguageContext);

  if (!ctx) {
    throw new Error('useTranslation must be used inside <LanguageProvider>');
  }

  return ctx;
}

export { LANGUAGES };
export type { Language };

import { useCallback, useEffect, useState } from 'react';
import type { Theme, ThemePreference } from '@/types';

const STORAGE_KEY = 'mr-theme';

function readStoredPreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  return 'system';
}

function systemTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function resolve(pref: ThemePreference): Theme {
  return pref === 'system' ? systemTheme() : pref;
}

export function useTheme(): {
  theme: Theme;
  preference: ThemePreference;
  setPreference: (next: ThemePreference) => void;
  toggle: () => void;
} {
  const [preference, setPreferenceState] = useState<ThemePreference>(
    readStoredPreference,
  );
  const [theme, setTheme] = useState<Theme>(() => resolve(readStoredPreference()));

  // Apply the effective theme to <html> and persist the user preference.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, preference);
    setTheme(resolve(preference));
  }, [preference]);

  // Follow the OS when the user's preference is 'system'.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      if (preference !== 'system') return;
      setTheme(e.matches ? 'dark' : 'light');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [preference]);

  const setPreference = useCallback(
    (next: ThemePreference) => setPreferenceState(next),
    [],
  );

  // Explicit toggle — forces a concrete light/dark pick (drops 'system').
  const toggle = useCallback(() => {
    setPreferenceState((p) => {
      const current = p === 'system' ? systemTheme() : p;
      return current === 'dark' ? 'light' : 'dark';
    });
  }, []);

  return { theme, preference, setPreference, toggle };
}

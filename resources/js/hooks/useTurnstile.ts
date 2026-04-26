import { useEffect, useRef, useState } from 'react';

/**
 * Minimal Cloudflare Turnstile binding.
 *
 * - Loads the Turnstile script on demand (one time per page load).
 * - Renders the widget into `ref.current` when the element mounts.
 * - Exposes the latest token via `token`, plus `reset()` to clear it after
 *   a successful submit (Turnstile tokens are single-use).
 *
 * If no site key is configured we render nothing and `token` stays null;
 * the backend's TurnstileVerifier decides whether that's acceptable.
 */

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'error-callback'?: () => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
          action?: string;
          appearance?: 'always' | 'execute' | 'interaction-only';
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

const SCRIPT_ID = 'cf-turnstile-script';
const SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Turnstile script failed to load')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Turnstile script failed to load'));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export interface UseTurnstileOptions {
  siteKey: string | undefined;
  theme?: 'light' | 'dark' | 'auto';
  action?: string;
}

export interface UseTurnstileResult {
  ref: React.RefObject<HTMLDivElement | null>;
  token: string | null;
  ready: boolean;
  error: string | null;
  reset: () => void;
}

export function useTurnstile({
  siteKey,
  theme = 'auto',
  action = 'contact',
}: UseTurnstileOptions): UseTurnstileResult {
  const ref = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!siteKey || !ref.current) return;

    let cancelled = false;
    const container = ref.current;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !window.turnstile || !container) return;

        widgetIdRef.current = window.turnstile.render(container, {
          sitekey: siteKey,
          theme,
          action,
          callback: (t: string) => setToken(t),
          'expired-callback': () => setToken(null),
          'error-callback': () => {
            setToken(null);
            setError('Bot check failed to load. Please refresh.');
          },
        });
        setReady(true);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          /* widget already gone */
        }
      }
      widgetIdRef.current = null;
    };
  }, [siteKey, theme, action]);

  const reset = () => {
    setToken(null);
    if (widgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.reset(widgetIdRef.current);
      } catch {
        /* widget already gone */
      }
    }
  };

  return { ref, token, ready, error, reset };
}

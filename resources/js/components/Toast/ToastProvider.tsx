import { useEffect, useState } from 'react';
import { Toaster as SonnerToaster, toast as sonnerToast } from 'sonner';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastOptions {
  title?: string;
  duration?: number;
}

interface ToastApi {
  show: (
    message: string,
    options?: ToastOptions & { variant?: ToastVariant },
  ) => void;
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
  dismiss: (id?: string | number) => void;
}

// When a caller passes `{ title }`, that's the heading and the first arg is
// the description. With no title, the message itself is the heading.
function splitMessage(message: string, options?: ToastOptions) {
  if (options?.title) {
    return {
      heading: options.title,
      opts: {
        description: message,
        duration: options.duration,
      },
    };
  }
  return {
    heading: message,
    opts: {
      duration: options?.duration,
    },
  };
}

// Mirror the data-theme attribute on <html> — useTheme is used per-page, so
// observing the DOM keeps the Toaster's theme in sync with any source that
// flips the attribute.
function useHtmlTheme(): 'light' | 'dark' {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof document === 'undefined') return 'dark';
    return document.documentElement.getAttribute('data-theme') === 'light'
      ? 'light'
      : 'dark';
  });

  useEffect(() => {
    const read = () =>
      document.documentElement.getAttribute('data-theme') === 'light'
        ? 'light'
        : 'dark';

    setTheme(read());

    const observer = new MutationObserver(() => setTheme(read()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
  }, []);

  return theme;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const theme = useHtmlTheme();

  return (
    <>
      {children}
      <SonnerToaster
        theme={theme}
        position="top-center"
        richColors
        closeButton
        offset={90}
        toastOptions={{
          classNames: {
            toast: 'app-toast',
          },
        }}
      />
    </>
  );
}

export function useToast(): ToastApi {
  return {
    show: (message, options) => {
      const variant = options?.variant ?? 'info';
      const { heading, opts } = splitMessage(message, options);

      if (variant === 'success') {
        sonnerToast.success(heading, opts);
      } else if (variant === 'error') {
        sonnerToast.error(heading, opts);
      } else {
        sonnerToast(heading, opts);
      }
    },
    success: (message, options) => {
      const { heading, opts } = splitMessage(message, options);
      sonnerToast.success(heading, opts);
    },
    error: (message, options) => {
      const { heading, opts } = splitMessage(message, options);
      sonnerToast.error(heading, opts);
    },
    info: (message, options) => {
      const { heading, opts } = splitMessage(message, options);
      sonnerToast(heading, opts);
    },
    dismiss: (id) => {
      sonnerToast.dismiss(id);
    },
  };
}

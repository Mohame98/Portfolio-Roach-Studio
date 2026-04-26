import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { ToastProvider } from '@/components/Toast/ToastProvider';
import { LanguageProvider } from '@/i18n/LanguageProvider';

const appName = import.meta.env.VITE_APP_NAME || 'Mohame Roach';

createInertiaApp({
  title: (title) => (title ? `${title} | ${appName}` : appName),
  resolve: (name) =>
    resolvePageComponent(
      `./pages/${name}.tsx`,
      import.meta.glob('./pages/**/*.tsx'),
    ),
  setup({ el, App, props }) {
    createRoot(el).render(
      <LanguageProvider>
        <ToastProvider>
          <App {...props} />
        </ToastProvider>
      </LanguageProvider>,
    );
  },
  progress: {
    color: '#4B5563',
  },
});

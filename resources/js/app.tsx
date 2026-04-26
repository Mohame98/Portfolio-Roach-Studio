import '../css/app.css';

import { createInertiaApp, type ResolvedComponent } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { ToastProvider } from '@/components/Toast/ToastProvider';
import { LanguageProvider } from '@/i18n/LanguageProvider';

const appName = import.meta.env.VITE_APP_NAME || 'Mohame Roach';

type PageModule = { default: ResolvedComponent };
const pages = import.meta.glob<PageModule>('./pages/**/*.tsx');

createInertiaApp({
  title: (title) => (title ? `${title} | ${appName}` : appName),
  resolve: async (name) => {
    const page = await resolvePageComponent<PageModule>(
      `./pages/${name}.tsx`,
      pages,
    );

    return page.default;
  },
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

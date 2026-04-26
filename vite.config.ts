// import inertia from '@inertiajs/vite';
// import { wayfinder } from '@laravel/vite-plugin-wayfinder';
// import tailwindcss from '@tailwindcss/vite';
// import react from '@vitejs/plugin-react';
// import laravel from 'laravel-vite-plugin';
// import { defineConfig } from 'vite';

// export default defineConfig({
//     plugins: [
//         laravel({
//             input: ['resources/css/app.css', 'resources/js/app.tsx'],
//             refresh: true,
//         }),
//         inertia(),
//         react({
//             babel: {
//                 plugins: ['babel-plugin-react-compiler'],
//             },
//         }),
//         tailwindcss(),
//         wayfinder({
//             formVariants: true,
//         }),
//     ],
// });

import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [
    laravel({
      input: ['resources/css/app.css', 'resources/js/app.tsx'],
      refresh: true,
    }),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'resources/js'),
    },
  },
  build: {
    target: 'es2020',
    sourcemap: true,
    cssCodeSplit: true,
  },
});

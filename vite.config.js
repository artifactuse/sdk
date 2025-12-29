import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import vue3 from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [
    vue3(),
    svelte(),
  ],
  build: {
    lib: {
      entry: {
        'index': path.resolve(__dirname, 'src/index.js'),
        'vue/index': path.resolve(__dirname, 'src/vue/index.js'),
        'react/index': path.resolve(__dirname, 'src/react/index.jsx'),
        'svelte/index': path.resolve(__dirname, 'src/svelte/index.js'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        'vue',
        'react',
        'react-dom',
        'svelte',
        /^svelte\//,
      ],
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
});
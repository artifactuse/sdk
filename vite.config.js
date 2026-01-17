import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import vue3 from '@vitejs/plugin-vue';
import path from 'path';
import { cpSync, existsSync, mkdirSync } from 'fs';

export default defineConfig({
  plugins: [
    vue3(),
    svelte(),
    {
      name: 'copy-styles',
      closeBundle() {
        const srcStyles = path.resolve(__dirname, 'src/styles');
        const distStyles = path.resolve(__dirname, 'dist/styles');
        
        if (existsSync(srcStyles)) {
          // Create dist/styles directory and copy all files
          mkdirSync(distStyles, { recursive: true });
          cpSync(srcStyles, distStyles, { recursive: true });
          console.log('✓ Styles copied to dist/styles/');
        } else {
          console.warn('⚠ src/styles/ not found');
        }
      }
    }
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
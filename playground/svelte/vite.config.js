import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import path from 'path'

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
        artifactuse: path.resolve(__dirname, '../../src'),
        'artifactuse/styles': path.resolve(
        __dirname,
        '../../src/styles/artifactuse.css'
        ),
    },
  },
})

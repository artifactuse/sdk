import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
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

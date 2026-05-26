import { defineConfig } from 'vite'
import vue2 from '@vitejs/plugin-vue2'
import path from 'path'

export default defineConfig({
  plugins: [vue2()],
  resolve: {
      alias: {
          artifactuse: path.resolve(__dirname, '../../src'),
          'artifactuse/styles': path.resolve(
          __dirname,
          '../../src/styles/artifactuse.css'
          ),
          'portal-vue': path.resolve(__dirname, 'node_modules/portal-vue'),
      },
  },
})

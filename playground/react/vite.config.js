import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
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


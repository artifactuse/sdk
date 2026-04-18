import vue from 'rollup-plugin-vue';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
  input: path.resolve(__dirname, 'src/vue2/index.js'),
  output: {
    file: path.resolve(__dirname, 'dist/vue2/index.js'),
    format: 'es',
  },
  external: ['vue', 'portal-vue'],
  onwarn(warning, warn) {
    if (warning.code === 'CIRCULAR_DEPENDENCY' && warning.ids?.some(id => id.includes('node_modules'))) return;
    warn(warning);
  },
  plugins: [
    resolve({
      extensions: ['.js', '.vue'],
    }),
    commonjs(),
    vue({
      css: true,
      compileTemplate: true,
    }),
  ],
};

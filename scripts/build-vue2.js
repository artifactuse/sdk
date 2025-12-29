import { execSync } from 'child_process';
import { existsSync, renameSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const vueDir = path.join(root, 'node_modules/vue');
const vue3Backup = path.join(root, 'node_modules/vue3-backup');
const vue2Dir = path.join(root, 'node_modules/vue2');

try {
  // Swap Vue 3 with Vue 2
  if (existsSync(vueDir)) {
    renameSync(vueDir, vue3Backup);
  }
  renameSync(vue2Dir, vueDir);

  // Run Rollup build
  execSync('rollup -c rollup.config.vue2.js', { stdio: 'inherit', cwd: root });

} finally {
  // Restore Vue 3
  if (existsSync(vueDir)) {
    renameSync(vueDir, vue2Dir);
  }
  if (existsSync(vue3Backup)) {
    renameSync(vue3Backup, vueDir);
  }
}
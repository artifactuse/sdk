<template>
  <Teleport to="body">
    <Transition name="artifactuse-panel">
      <div 
        v-if="state.isPanelOpen && activeArtifact"
        class="artifactuse-panel"
        :class="{ 
          'artifactuse-panel--fullscreen': state.isFullscreen
        }"
      >
        <!-- Panel header -->
        <div class="artifactuse-panel-header">
          <div class="artifactuse-panel-title">
            <span class="artifactuse-panel-language">{{ languageDisplay }}</span>
            <span class="artifactuse-panel-name">{{ activeArtifact.title }}</span>
          </div>
          
          <div class="artifactuse-panel-tabs">
            <button 
              class="artifactuse-panel-tab"
              :class="{ active: state.viewMode === 'preview' }"
              @click="setViewMode('preview')"
              :disabled="!activeArtifact.isPreviewable"
            >
              Preview
            </button>
            <button 
              class="artifactuse-panel-tab"
              :class="{ active: state.viewMode === 'code' }"
              @click="setViewMode('code')"
            >
              Code
            </button>
            <button 
              class="artifactuse-panel-tab"
              :class="{ active: state.viewMode === 'split' }"
              @click="setViewMode('split')"
              :disabled="!activeArtifact.isPreviewable"
            >
              Split
            </button>
          </div>
          
          <div class="artifactuse-panel-actions">
            <button 
              class="artifactuse-panel-action"
              title="Copy code"
              @click="handleCopy"
            >
              <svg v-if="!copied" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </button>
            
            <button 
              class="artifactuse-panel-action"
              title="Download"
              @click="handleDownload"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </button>
            
            <button 
              class="artifactuse-panel-action"
              :title="state.isFullscreen ? 'Exit fullscreen' : 'Fullscreen'"
              @click="toggleFullscreen"
            >
              <svg v-if="!state.isFullscreen" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 3 21 3 21 9"></polyline>
                <polyline points="9 21 3 21 3 15"></polyline>
                <line x1="21" y1="3" x2="14" y2="10"></line>
                <line x1="3" y1="21" x2="10" y2="14"></line>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="4 14 10 14 10 20"></polyline>
                <polyline points="20 10 14 10 14 4"></polyline>
                <line x1="14" y1="10" x2="21" y2="3"></line>
                <line x1="3" y1="21" x2="10" y2="14"></line>
              </svg>
            </button>
            
            <button 
              class="artifactuse-panel-action artifactuse-panel-close"
              title="Close"
              @click="closePanel"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
        
        <!-- Panel content -->
        <div 
          class="artifactuse-panel-content"
          :class="`artifactuse-panel-content--${state.viewMode}`"
        >
          <!-- Preview pane -->
          <div 
            v-if="state.viewMode === 'preview' || state.viewMode === 'split'"
            class="artifactuse-panel-preview"
          >
            <iframe
              v-if="panelUrl"
              ref="iframeRef"
              :src="panelUrl"
              class="artifactuse-panel-iframe"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
              @load="handleIframeLoad"
            ></iframe>
            <div v-else class="artifactuse-panel-no-preview">
              <p>Preview not available for this artifact type.</p>
            </div>
          </div>
          
          <!-- Code pane -->
          <div 
            v-if="state.viewMode === 'code' || state.viewMode === 'split'"
            class="artifactuse-panel-code"
          >
            <pre><code>{{ activeArtifact.code }}</code></pre>
          </div>
        </div>
      </div>
    </Transition>
    
    <!-- Backdrop -->
    <Transition name="artifactuse-backdrop">
      <div 
        v-if="state.isPanelOpen && state.isFullscreen"
        class="artifactuse-panel-backdrop"
        @click="closePanel"
      ></div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { useArtifactuse } from './index.js';
import { getLanguageDisplayName, getFileExtension } from '../core/detector.js';

const emit = defineEmits(['close', 'ai-request', 'save', 'export']);

const { 
  state, 
  activeArtifact, 
  closePanel, 
  toggleFullscreen, 
  setViewMode,
  getPanelUrl,
  instance,
} = useArtifactuse();

const iframeRef = ref(null);
const copied = ref(false);

const languageDisplay = computed(() => {
  if (!activeArtifact.value) return '';
  return getLanguageDisplayName(activeArtifact.value.language);
});

const panelUrl = computed(() => {
  if (!activeArtifact.value) return null;
  return getPanelUrl(activeArtifact.value);
});

function handleIframeLoad() {
  if (iframeRef.value && activeArtifact.value) {
    instance.bridge.setIframe(iframeRef.value);
    instance.bridge.loadArtifact(activeArtifact.value);
  }
}

watch(activeArtifact, (artifact) => {
  if (artifact && iframeRef.value) {
    nextTick(() => {
      instance.bridge.loadArtifact(artifact);
    });
  }
});

instance.on('ai:request', (data) => emit('ai-request', data));
instance.on('save:request', (data) => emit('save', data));
instance.on('export:complete', (data) => emit('export', data));

async function handleCopy() {
  if (!activeArtifact.value) return;
  
  try {
    await navigator.clipboard.writeText(activeArtifact.value.code);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  } catch (error) {
    console.error('Failed to copy:', error);
  }
}

function handleDownload() {
  if (!activeArtifact.value) return;
  
  const { code, language, title } = activeArtifact.value;
  const extension = getFileExtension(language);
  const filename = `${title.toLowerCase().replace(/\s+/g, '-')}.${extension}`;
  
  const blob = new Blob([code], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
</script>

<style>
.artifactuse-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 50%;
  min-width: 400px;
  max-width: 800px;
  height: 100vh;
  background: rgb(var(--artifactuse-background));
  border-left: 1px solid rgb(var(--artifactuse-border));
  display: flex;
  flex-direction: column;
  z-index: 1000;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.2);
}

.artifactuse-panel--fullscreen {
  width: 100%;
  max-width: none;
  border-left: none;
}

.artifactuse-panel-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  border-bottom: 1px solid rgb(var(--artifactuse-border));
  background: rgb(var(--artifactuse-surface));
}

.artifactuse-panel-title {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.artifactuse-panel-language {
  padding: 4px 8px;
  background: rgba(var(--artifactuse-primary), 0.15);
  color: rgb(var(--artifactuse-primary));
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.artifactuse-panel-name {
  font-weight: 600;
  font-size: 14px;
  color: rgb(var(--artifactuse-text));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.artifactuse-panel-tabs {
  display: flex;
  gap: 4px;
  background: rgba(var(--artifactuse-background), 0.5);
  padding: 4px;
  border-radius: 8px;
}

.artifactuse-panel-tab {
  padding: 6px 12px;
  background: transparent;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: rgb(var(--artifactuse-text-secondary));
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.artifactuse-panel-tab:hover:not(:disabled) {
  background: rgba(var(--artifactuse-text), 0.1);
  color: rgb(var(--artifactuse-text));
}

.artifactuse-panel-tab.active {
  background: rgb(var(--artifactuse-primary));
  color: white;
}

.artifactuse-panel-tab:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.artifactuse-panel-actions {
  display: flex;
  gap: 4px;
}

.artifactuse-panel-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: rgb(var(--artifactuse-text-secondary));
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.artifactuse-panel-action:hover {
  background: rgba(var(--artifactuse-text), 0.1);
  color: rgb(var(--artifactuse-text));
}

.artifactuse-panel-action svg {
  width: 18px;
  height: 18px;
}

.artifactuse-panel-close:hover {
  background: rgba(239, 68, 68, 0.15);
  color: rgb(239, 68, 68);
}

.artifactuse-panel-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.artifactuse-panel-content--preview .artifactuse-panel-preview,
.artifactuse-panel-content--code .artifactuse-panel-code {
  width: 100%;
}

.artifactuse-panel-content--split {
  flex-direction: row;
}

.artifactuse-panel-content--split .artifactuse-panel-preview,
.artifactuse-panel-content--split .artifactuse-panel-code {
  width: 50%;
}

.artifactuse-panel-content--split .artifactuse-panel-code {
  border-left: 1px solid rgb(var(--artifactuse-border));
}

.artifactuse-panel-preview {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.artifactuse-panel-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: white;
}

.artifactuse-panel-no-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: rgb(var(--artifactuse-text-muted));
}

.artifactuse-panel-code {
  overflow: auto;
  background: rgb(var(--artifactuse-surface));
}

.artifactuse-panel-code pre {
  margin: 0;
  padding: 16px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.5;
  color: rgb(var(--artifactuse-text));
  white-space: pre-wrap;
  word-break: break-word;
}

.artifactuse-panel-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

/* Transitions */
.artifactuse-panel-enter-active,
.artifactuse-panel-leave-active {
  transition: transform 0.3s ease;
}

.artifactuse-panel-enter-from,
.artifactuse-panel-leave-to {
  transform: translateX(100%);
}

.artifactuse-backdrop-enter-active,
.artifactuse-backdrop-leave-active {
  transition: opacity 0.3s ease;
}

.artifactuse-backdrop-enter-from,
.artifactuse-backdrop-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .artifactuse-panel {
    width: 100%;
    min-width: 0;
    max-width: none;
  }
  
  .artifactuse-panel-tabs {
    display: none;
  }
}
</style>

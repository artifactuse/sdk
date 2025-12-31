<template>
  <div v-if="state.isPanelOpen && activeArtifact">
    <!-- Panel -->
    <transition name="artifactuse-panel">
      <div 
        class="artifactuse-panel"
        :class="{ 'artifactuse-panel--fullscreen': state.isFullscreen }"
        :style="!state.isFullscreen ? { width: panelWidth + '%' } : null"
      >
        <!-- Resize handle -->
        <div 
          v-if="!state.isFullscreen"
          class="artifactuse-panel__resize-handle"
          @mousedown.prevent="startPanelResize"
        >
          <div class="artifactuse-panel__resize-handle-line"></div>
        </div>
        
        <!-- Header -->
        <header class="artifactuse-panel__header">
          <div class="artifactuse-panel__title">
            <span class="artifactuse-panel__icon" v-html="languageIconHtml"></span>
            <div class="artifactuse-panel__title-content">
              <span class="artifactuse-panel__name">{{ activeArtifact.title || 'Untitled' }}</span>
              <span class="artifactuse-panel__meta">
                {{ languageDisplay }}
                <template v-if="activeArtifact.lineCount"> • {{ activeArtifact.lineCount }} lines</template>
              </span>
            </div>
          </div>
          
          <!-- View mode tabs -->
          <div class="artifactuse-panel__tabs">
            <button 
              class="artifactuse-panel__tab"
              :class="{ 'artifactuse-panel__tab--active': state.viewMode === 'preview' }"
              :disabled="!activeArtifact.isPreviewable"
              title="Preview"
              @click="setViewMode('preview')"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
            <button 
              class="artifactuse-panel__tab"
              :class="{ 'artifactuse-panel__tab--active': state.viewMode === 'code' }"
              title="Code"
              @click="setViewMode('code')"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="16 18 22 12 16 6"></polyline>
                <polyline points="8 6 2 12 8 18"></polyline>
              </svg>
            </button>
            <button 
              class="artifactuse-panel__tab"
              :class="{ 'artifactuse-panel__tab--active': state.viewMode === 'split' }"
              :disabled="!activeArtifact.isPreviewable"
              title="Split view"
              @click="setViewMode('split')"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                <line x1="12" y1="3" x2="12" y2="21"></line>
              </svg>
            </button>
          </div>
          
          <!-- Actions -->
          <div class="artifactuse-panel__actions">
            <button 
              class="artifactuse-panel__action"
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
              class="artifactuse-panel__action artifactuse-panel__action--close"
              title="Close"
              @click="closePanel"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </header>
        
        <!-- Content -->
        <div 
          ref="contentRef"
          class="artifactuse-panel__content"
          :class="`artifactuse-panel__content--${state.viewMode}`"
        >
          <!-- Preview pane -->
          <div 
            v-if="state.viewMode === 'preview' || state.viewMode === 'split'"
            class="artifactuse-panel__preview"
            :style="state.viewMode === 'split' ? { width: splitPosition + '%' } : null"
          >
            <!-- Loading spinner -->
            <div v-if="iframeLoading && panelUrl" class="artifactuse-panel__loading">
              <div class="artifactuse-panel__spinner"></div>
            </div>
            
            <iframe
              v-if="panelUrl"
              ref="iframeRef"
              :src="panelUrl"
              class="artifactuse-panel__iframe"
              :class="{ 'artifactuse-panel__iframe--loading': iframeLoading }"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
              @load="handleIframeLoad"
              @error="handleIframeError"
            ></iframe>
            <div v-else class="artifactuse-panel__no-preview">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M9 17H7A5 5 0 0 1 7 7h2"></path>
                <path d="M15 7h2a5 5 0 1 1 0 10h-2"></path>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
              <p>Preview not available for {{ languageDisplay }}</p>
            </div>
          </div>
          
          <!-- Code pane -->
          <div 
            v-if="state.viewMode === 'code' || state.viewMode === 'split'"
            class="artifactuse-panel__code"
            :style="state.viewMode === 'split' ? { width: (100 - splitPosition) + '%' } : null"
          >
            <!-- Split resize handle -->
            <div 
              v-if="state.viewMode === 'split'"
              class="artifactuse-panel__split-handle"
              @mousedown.prevent="startSplitResize"
            >
              <div class="artifactuse-panel__split-handle-line"></div>
            </div>
            
            <div ref="codeScrollRef" class="artifactuse-panel__code-scroll">
              <div ref="lineNumbersRef" class="artifactuse-panel__line-numbers"></div>
              <pre class="artifactuse-panel__code-block"><code 
                ref="codeRef"
                :class="`language-${normalizedLanguage}`"
              >{{ activeArtifact.code }}</code></pre>
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <footer class="artifactuse-panel__footer">
          <div class="artifactuse-panel__footer-left">
            <!-- Branding -->
            <a 
              v-if="showBranding"
              href="https://artifactuse.com"
              target="_blank"
              rel="noopener noreferrer"
              class="artifactuse-panel__branding"
              title="Powered by Artifactuse"
            >
              <svg width="16" height="16" viewBox="0 0 32 32" fill="currentColor">
                <path d="M16 2L2 9l14 7 14-7-14-7zM2 23l14 7 14-7M2 16l14 7 14-7"></path>
              </svg>
              <span>Artifactuse</span>
            </a>
            
            <!-- Size badge -->
            <span v-if="activeArtifact.code" class="artifactuse-panel__badge artifactuse-panel__badge--secondary">
              {{ formatBytes(new Blob([activeArtifact.code]).size) }}
            </span>
          </div>
          
          <div class="artifactuse-panel__footer-right">
            <!-- Copy button -->
            <button 
              class="artifactuse-panel__footer-action"
              :class="{ 'artifactuse-panel__footer-action--success': copied }"
              :title="copied ? 'Copied!' : 'Copy code'"
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
            
            <!-- Download button -->
            <button 
              class="artifactuse-panel__footer-action"
              title="Download"
              @click="handleDownload"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </button>
            
            <!-- Navigation -->
            <div v-if="artifactCount > 1" class="artifactuse-panel__nav">
              <button 
                class="artifactuse-panel__nav-btn"
                :disabled="currentArtifactIndex <= 0"
                title="Previous artifact"
                @click="navigatePrev"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              
              <button 
                class="artifactuse-panel__nav-trigger"
                @click="showArtifactList = !showArtifactList"
              >
                <span>{{ currentArtifactIndex + 1 }} / {{ artifactCount }}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              
              <button 
                class="artifactuse-panel__nav-btn"
                :disabled="currentArtifactIndex >= state.artifacts.length - 1"
                title="Next artifact"
                @click="navigateNext"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
              
              <!-- Artifact list popup -->
              <transition name="artifactuse-popup">
                <div v-if="showArtifactList" class="artifactuse-panel__artifact-list">
                  <div class="artifactuse-panel__artifact-list-header">
                    <span>All Artifacts ({{ artifactCount }})</span>
                    <button 
                      class="artifactuse-panel__artifact-list-close"
                      @click="showArtifactList = false"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                  <div class="artifactuse-panel__artifact-list-items">
                    <button 
                      v-for="(artifact, index) in nonInlineArtifacts"
                      :key="artifact.id"
                      class="artifactuse-panel__artifact-item"
                      :class="{ 'artifactuse-panel__artifact-item--active': artifact.id === activeArtifact.id }"
                      @click="selectArtifact(artifact.id)"
                    >
                      <span class="artifactuse-panel__artifact-item-icon" v-html="getArtifactIconHtml(artifact)"></span>
                      <div class="artifactuse-panel__artifact-item-content">
                        <span class="artifactuse-panel__artifact-item-title">{{ artifact.title || 'Untitled' }}</span>
                        <span class="artifactuse-panel__artifact-item-meta">
                          {{ getLanguageDisplayName(artifact.language) }}
                          <template v-if="artifact.lineCount"> • {{ artifact.lineCount }} lines</template>
                        </span>
                      </div>
                      <span class="artifactuse-panel__artifact-item-index">{{ index + 1 }}</span>
                    </button>
                  </div>
                </div>
              </transition>
            </div>
          </div>
        </footer>
      </div>
    </transition>
    
    <!-- Backdrop (fullscreen/mobile only - uses portal) -->
    <portal to="artifactuse-portal" :disabled="!usePortal">
      <transition name="artifactuse-backdrop">
        <div 
          v-if="state.isFullscreen"
          class="artifactuse-panel__backdrop"
          @click="closePanel"
        ></div>
      </transition>
    </portal>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, onUnmounted, nextTick, defineComponent } from 'vue';
import { useArtifactuse } from './composables.js';
import { getLanguageDisplayName, getFileExtension, getLanguageIcon, formatBytes } from '../core/detector.js';
import { normalizeLanguage as normalizeLang, isPrismAvailable } from '../core/highlight.js';

export default defineComponent({
  name: 'ArtifactusePanel',
  
  props: {
    // Use portal-vue for rendering backdrop to body (fullscreen/mobile only)
    usePortal: {
      type: Boolean,
      default: true,
    },
  },
  
  setup(props, { emit }) {
    const { 
      state, 
      activeArtifact,
      artifactCount,
      closePanel, 
      toggleFullscreen, 
      setViewMode,
      getPanelUrl,
      openArtifact,
      instance,
    } = useArtifactuse();
    
    // Refs
    const iframeRef = ref(null);
    const codeRef = ref(null);
    const contentRef = ref(null);
    const lineNumbersRef = ref(null);
    const codeScrollRef = ref(null);
    
    // State
    const copied = ref(false);
    const showArtifactList = ref(false);
    const iframeLoading = ref(true);
    const isStreaming = ref(false);
    
    // Panel/split resize state
    const panelWidth = ref(50);
    const splitPosition = ref(50);
    let panelResizeState = null;
    let splitResizeState = null;
    
    // Timers
    let updateTimer = null;
    let streamEndTimer = null;
    let iframeLoadTimer = null;
    
    // Computed
    const languageDisplay = computed(() => {
      if (!activeArtifact.value) return '';
      return getLanguageDisplayName(activeArtifact.value.language);
    });
    
    const languageIcon = computed(() => {
      if (!activeArtifact.value) return '';
      return getLanguageIcon(activeArtifact.value.language) || '';
    });
    
    const languageIconHtml = computed(() => {
      if (!languageIcon.value) return '';
      return `<svg viewBox="0 0 24 24" fill="currentColor">${languageIcon.value}</svg>`;
    });
    
    const panelUrl = computed(() => {
      if (!activeArtifact.value) return null;
      return getPanelUrl(activeArtifact.value);
    });
    
    const normalizedLanguage = computed(() => {
      if (!activeArtifact.value) return 'plaintext';
      return normalizeLang(activeArtifact.value.language);
    });
    
    const currentArtifactIndex = computed(() => {
      if (!activeArtifact.value || !state.artifacts.length) return -1;
      return state.artifacts.findIndex(a => a.id === activeArtifact.value.id);
    });
    
    const nonInlineArtifacts = computed(() => {
      return state.artifacts.filter(a => !a.inline);
    });
    
    const showBranding = computed(() => {
      return instance.config?.branding !== false;
    });
    
    // Methods
    function generateLineNumbers() {
      if (!lineNumbersRef.value || !activeArtifact.value?.code) return;
      
      const lines = activeArtifact.value.code.split('\n').length;
      const html = Array.from({ length: lines }, (_, i) => `<div>${i + 1}</div>`).join('');
      lineNumbersRef.value.innerHTML = html;
    }
    
    function highlightCode() {
      if (codeRef.value && isPrismAvailable()) {
        window.Prism.highlightElement(codeRef.value);
        
        nextTick(() => {
          syncPrismBackground();
        });
      }
    }
    
    function syncPrismBackground() {
      const pre = codeRef.value?.closest('pre');
      if (pre && codeScrollRef.value && lineNumbersRef.value) {
        const computedStyle = window.getComputedStyle(pre);
        const bgColor = computedStyle.backgroundColor;
        if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
          codeScrollRef.value.style.backgroundColor = bgColor;
          lineNumbersRef.value.style.backgroundColor = bgColor;
        }
      }
    }
    
    function updateCodeView() {
      nextTick(() => {
        generateLineNumbers();
        if (!isStreaming.value) {
          highlightCode();
        }
      });
    }
    
    function handleIframeLoad() {
      clearTimeout(iframeLoadTimer);
      iframeLoading.value = false;
      if (iframeRef.value && activeArtifact.value) {
        instance.bridge.setIframe(iframeRef.value);
        instance.bridge.loadArtifact(activeArtifact.value);
      }
    }
    
    function handleIframeError() {
      clearTimeout(iframeLoadTimer);
      iframeLoading.value = false;
    }
    
    function startIframeLoadTimeout() {
      clearTimeout(iframeLoadTimer);
      iframeLoadTimer = setTimeout(() => {
        iframeLoading.value = false;
      }, 10000);
    }
    
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
    
    function navigatePrev() {
      if (currentArtifactIndex.value > 0) {
        openArtifact(state.artifacts[currentArtifactIndex.value - 1].id);
      }
    }
    
    function navigateNext() {
      if (currentArtifactIndex.value < state.artifacts.length - 1) {
        openArtifact(state.artifacts[currentArtifactIndex.value + 1].id);
      }
    }
    
    function selectArtifact(id) {
      openArtifact(id);
      showArtifactList.value = false;
    }
    
    function getArtifactIconHtml(artifact) {
      const icon = getLanguageIcon(artifact.language) || '';
      return `<svg viewBox="0 0 24 24" fill="currentColor">${icon}</svg>`;
    }
    
    // Panel resize handlers
    function startPanelResize(e) {
      panelResizeState = {
        startX: e.clientX,
        startWidth: panelWidth.value,
      };
      
      document.addEventListener('mousemove', handlePanelResize);
      document.addEventListener('mouseup', stopPanelResize);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
      
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach(iframe => iframe.style.pointerEvents = 'none');
    }
    
    function handlePanelResize(e) {
      if (!panelResizeState) return;
      
      const windowWidth = window.innerWidth;
      const deltaX = panelResizeState.startX - e.clientX;
      const deltaPercent = (deltaX / windowWidth) * 100;
      const newWidth = panelResizeState.startWidth + deltaPercent;
      
      panelWidth.value = Math.min(Math.max(newWidth, 25), 75);
    }
    
    function stopPanelResize() {
      panelResizeState = null;
      
      document.removeEventListener('mousemove', handlePanelResize);
      document.removeEventListener('mouseup', stopPanelResize);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach(iframe => iframe.style.pointerEvents = '');
    }
    
    // Split resize handlers
    function startSplitResize(e) {
      if (!contentRef.value) return;
      
      const rect = contentRef.value.getBoundingClientRect();
      splitResizeState = {
        startX: e.clientX,
        containerLeft: rect.left,
        containerWidth: rect.width,
      };
      
      document.addEventListener('mousemove', handleSplitResize);
      document.addEventListener('mouseup', stopSplitResize);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach(iframe => iframe.style.pointerEvents = 'none');
    }
    
    function handleSplitResize(e) {
      if (!splitResizeState) return;
      
      const { containerLeft, containerWidth } = splitResizeState;
      const relativeX = e.clientX - containerLeft;
      const newPosition = (relativeX / containerWidth) * 100;
      
      splitPosition.value = Math.min(Math.max(newPosition, 20), 80);
    }
    
    function stopSplitResize() {
      splitResizeState = null;
      
      document.removeEventListener('mousemove', handleSplitResize);
      document.removeEventListener('mouseup', stopSplitResize);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach(iframe => iframe.style.pointerEvents = '');
    }
    
    // Handle click outside artifact list
    function handleClickOutside(e) {
      if (showArtifactList.value && !e.target.closest('.artifactuse-panel__nav')) {
        showArtifactList.value = false;
      }
    }
    
    // Watch for artifact changes with streaming support
    watch(activeArtifact, (newArtifact, oldArtifact) => {
      if (newArtifact) {
        // Set iframe loading when artifact changes
        if (!oldArtifact || newArtifact.id !== oldArtifact.id) {
          iframeLoading.value = true;
          startIframeLoadTimeout();
        }
        
        // Check if code changed
        if (!oldArtifact || newArtifact.code !== oldArtifact.code) {
          isStreaming.value = true;
          
          clearTimeout(updateTimer);
          updateTimer = setTimeout(() => {
            generateLineNumbers();
          }, 100);
          
          clearTimeout(streamEndTimer);
          streamEndTimer = setTimeout(() => {
            isStreaming.value = false;
            nextTick(() => {
              highlightCode();
              
              if (iframeRef.value && newArtifact.isPreviewable) {
                iframeLoading.value = true;
                startIframeLoadTimeout();
                instance.bridge.loadArtifact(newArtifact);
              }
            });
          }, 500);
        } else {
          if (iframeRef.value && newArtifact.isPreviewable) {
            iframeLoading.value = true;
            startIframeLoadTimeout();
            nextTick(() => {
              instance.bridge.loadArtifact(newArtifact);
            });
          }
        }
      }
    }, { deep: true });
    
    // Watch viewMode changes
    watch(() => state.viewMode, (mode) => {
      if (mode === 'code' || mode === 'split') {
        updateCodeView();
      }
    });
    
    onMounted(() => {
      instance.on('ai:request', (data) => emit('ai-request', data));
      instance.on('save:request', (data) => emit('save', data));
      instance.on('export:complete', (data) => emit('export', data));
      
      document.addEventListener('click', handleClickOutside);
      
      if (state.isPanelOpen && activeArtifact.value) {
        updateCodeView();
      }
    });
    
    onUnmounted(() => {
      stopPanelResize();
      stopSplitResize();
      document.removeEventListener('click', handleClickOutside);
      clearTimeout(updateTimer);
      clearTimeout(streamEndTimer);
      clearTimeout(iframeLoadTimer);
    });
    
    return {
      state,
      activeArtifact,
      artifactCount,
      closePanel,
      toggleFullscreen,
      setViewMode,
      openArtifact,
      
      // Refs
      iframeRef,
      codeRef,
      contentRef,
      lineNumbersRef,
      codeScrollRef,
      
      // State
      copied,
      showArtifactList,
      iframeLoading,
      panelWidth,
      splitPosition,
      
      // Computed
      languageDisplay,
      languageIconHtml,
      panelUrl,
      normalizedLanguage,
      currentArtifactIndex,
      nonInlineArtifacts,
      showBranding,
      
      // Methods
      handleIframeLoad,
      handleIframeError,
      handleCopy,
      handleDownload,
      navigatePrev,
      navigateNext,
      selectArtifact,
      getArtifactIconHtml,
      startPanelResize,
      startSplitResize,
      
      // Utils
      getLanguageDisplayName,
      formatBytes,
    };
  },
});
</script>
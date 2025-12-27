// artifactuse/vue2/index.js
// Vue 2 / Nuxt 2 integration for Artifactuse SDK
// Requires: @vue/composition-api or @nuxtjs/composition-api

import Vue from 'vue';
import createArtifactuse from '../core/index.js';

// Check for Composition API
let compositionApi;
try {
  compositionApi = require('@vue/composition-api');
} catch (e) {
  try {
    compositionApi = require('@nuxtjs/composition-api');
  } catch (e2) {
    console.error('Artifactuse: @vue/composition-api or @nuxtjs/composition-api is required for Vue 2');
  }
}

const { 
  ref, 
  reactive, 
  computed, 
  onMounted, 
  onUnmounted, 
  provide, 
  inject,
  defineComponent 
} = compositionApi || {};

// Injection key
const ARTIFACTUSE_KEY = 'artifactuse';

/**
 * Create and provide Artifactuse instance
 */
export function provideArtifactuse(config = {}) {
  const instance = createArtifactuse(config);
  
  // Create reactive state
  const state = reactive({
    artifacts: [],
    activeArtifactId: null,
    isPanelOpen: false,
    viewMode: 'preview',
    isFullscreen: false,
  });
  
  // Subscribe to state changes
  instance.state.subscribe((newState) => {
    state.artifacts = newState.artifacts;
    state.activeArtifactId = newState.activeArtifactId;
    state.isPanelOpen = newState.isPanelOpen;
    state.viewMode = newState.viewMode;
    state.isFullscreen = newState.isFullscreen;
  });
  
  // Computed
  const activeArtifact = computed(() => {
    if (!state.activeArtifactId) return null;
    return state.artifacts.find(a => a.id === state.activeArtifactId) || null;
  });
  
  const artifactCount = computed(() => state.artifacts.length);
  
  const hasArtifacts = computed(() => state.artifacts.length > 0);
  
  // Provide value
  const provided = {
    instance,
    state,
    activeArtifact,
    artifactCount,
    hasArtifacts,
    
    // Methods
    processMessage: instance.processMessage,
    openArtifact: instance.openArtifact,
    closePanel: instance.closePanel,
    togglePanel: instance.togglePanel,
    toggleFullscreen: instance.toggleFullscreen,
    setViewMode: instance.setViewMode,
    getPanelUrl: instance.getPanelUrl,
    sendToPanel: instance.sendToPanel,
    
    // Events
    on: instance.on,
    off: instance.off,
    
    // Theme
    applyTheme: instance.applyTheme,
    setTheme: instance.setTheme,
  };
  
  provide(ARTIFACTUSE_KEY, provided);
  
  return provided;
}

/**
 * Use Artifactuse composable
 */
export function useArtifactuse() {
  const injected = inject(ARTIFACTUSE_KEY);
  
  if (!injected) {
    console.warn('useArtifactuse() called without provideArtifactuse(). Creating standalone instance.');
    return provideArtifactuse();
  }
  
  return injected;
}

/**
 * Create standalone composable (without provider)
 */
export function createArtifactuseComposable(config = {}) {
  const instance = createArtifactuse(config);
  
  // Create reactive state
  const state = reactive({
    artifacts: [],
    activeArtifactId: null,
    isPanelOpen: false,
    viewMode: 'preview',
    isFullscreen: false,
  });
  
  // Subscribe to state changes
  let unsubscribe;
  
  onMounted(() => {
    unsubscribe = instance.state.subscribe((newState) => {
      state.artifacts = newState.artifacts;
      state.activeArtifactId = newState.activeArtifactId;
      state.isPanelOpen = newState.isPanelOpen;
      state.viewMode = newState.viewMode;
      state.isFullscreen = newState.isFullscreen;
    });
    
    // Apply theme
    instance.applyTheme();
  });
  
  onUnmounted(() => {
    if (unsubscribe) unsubscribe();
    instance.destroy();
  });
  
  // Computed
  const activeArtifact = computed(() => {
    if (!state.activeArtifactId) return null;
    return state.artifacts.find(a => a.id === state.activeArtifactId) || null;
  });
  
  const artifactCount = computed(() => state.artifacts.length);
  
  const hasArtifacts = computed(() => state.artifacts.length > 0);
  
  return {
    instance,
    state,
    activeArtifact,
    artifactCount,
    hasArtifacts,
    
    // Methods
    processMessage: instance.processMessage,
    openArtifact: instance.openArtifact,
    closePanel: instance.closePanel,
    togglePanel: instance.togglePanel,
    toggleFullscreen: instance.toggleFullscreen,
    setViewMode: instance.setViewMode,
    getPanelUrl: instance.getPanelUrl,
    sendToPanel: instance.sendToPanel,
    
    // Events
    on: instance.on,
    off: instance.off,
    
    // Theme
    applyTheme: instance.applyTheme,
    setTheme: instance.setTheme,
  };
}

// Export defineComponent for convenience
export { defineComponent };

// Export components
export { default as ArtifactuseAgentMessage } from './ArtifactuseAgentMessage.vue';
export { default as ArtifactusePanel } from './ArtifactusePanel.vue';
export { default as ArtifactusePanelToggle } from './ArtifactusePanelToggle.vue';
export { default as ArtifactuseCard } from './ArtifactuseCard.vue';
export { default as ArtifactuseViewer } from './ArtifactuseViewer.vue';
export { default as ArtifactuseInlineForm } from './ArtifactuseInlineForm.vue';
export { default as ArtifactuseSocialPreview } from './ArtifactuseSocialPreview.vue';

// Default export
export default {
  provideArtifactuse,
  useArtifactuse,
  createArtifactuseComposable,
};

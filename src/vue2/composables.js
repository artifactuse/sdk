// src/vue2/composables.js
import createArtifactuse from '../core/index.js';
import {
  reactive,
  computed,
  onMounted,
  onUnmounted,
  provide,
  inject,
  defineComponent
} from 'vue';

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
  
  // Apply theme immediately on initialization
  instance.applyTheme();
  
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
    
    // Theme - wrap setTheme to also apply
    applyTheme: instance.applyTheme,
    setTheme: (theme) => {
      instance.setTheme(theme);
      instance.applyTheme();
    },
    getTheme: instance.getTheme,
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
    
    // Theme - wrap setTheme to also apply
    applyTheme: instance.applyTheme,
    setTheme: (theme) => {
      instance.setTheme(theme);
      instance.applyTheme();
    },
    getTheme: instance.getTheme,
  };
}

// Export defineComponent for convenience
export { defineComponent };

// Export the injection key for advanced use cases
export { ARTIFACTUSE_KEY };
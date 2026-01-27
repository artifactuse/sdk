// artifactuse/svelte/index.js
// Svelte / SvelteKit integration for Artifactuse SDK

import { writable, derived } from 'svelte/store';
import { setContext, getContext, onMount, onDestroy } from 'svelte';
import createArtifactuse, { DEFAULT_PANELS } from '../core/index.js';

// Context key
const ARTIFACTUSE_KEY = 'artifactuse';

/**
 * Create Artifactuse stores and instance
 * 
 * @param {object} config - Configuration options
 * @param {string} config.cdnUrl - Base CDN URL for panels
 * @param {object} config.panels - Panel configuration (add/override/disable)
 * @param {string} config.theme - Theme: 'dark' | 'light' | 'auto'
 * @param {object} config.colors - Custom theme colors
 * @param {object} config.processors - Enable/disable processors
 * @param {boolean} config.branding - Show branding
 * 
 * @example
 * // Basic usage
 * const stores = createArtifactuseStores();
 * 
 * @example
 * // With custom panels
 * const stores = createArtifactuseStores({
 *   panels: {
 *     'chart': 'chart-panel',
 *     'video': 'https://my-cdn.com/video-panel',
 *     'canvas': null, // disable
 *   }
 * });
 */
export function createArtifactuseStores(config = {}) {
  const instance = createArtifactuse(config);
  
  // Create Svelte stores
  const artifacts = writable([]);
  const activeArtifactId = writable(null);
  const isPanelOpen = writable(false);
  const viewMode = writable('preview');
  const isFullscreen = writable(false);
  
  // Panel types store (for reactivity when registering/unregistering)
  const panelTypes = writable(instance.getPanelTypes());
  
  // Subscribe to core state changes
  const unsubscribe = instance.state.subscribe((state) => {
    artifacts.set(state.artifacts);
    activeArtifactId.set(state.activeArtifactId);
    isPanelOpen.set(state.isPanelOpen);
    viewMode.set(state.viewMode);
    isFullscreen.set(state.isFullscreen);
  });
  
  // Derived stores
  const activeArtifact = derived(
    [artifacts, activeArtifactId],
    ([$artifacts, $activeArtifactId]) => {
      if (!$activeArtifactId) return null;
      return $artifacts.find(a => a.id === $activeArtifactId) || null;
    }
  );
  
  const artifactCount = derived(artifacts, ($artifacts) => $artifacts.length);
  
  const hasArtifacts = derived(artifacts, ($artifacts) => $artifacts.length > 0);
  
  // Panel URL for active artifact
  const activePanelUrl = derived(activeArtifact, ($activeArtifact) => {
    if (!$activeArtifact) return null;
    return instance.getPanelUrl($activeArtifact);
  });
  
  // Cleanup function
  const destroy = () => {
    unsubscribe();
    instance.destroy();
  };
  
  // Wrap setTheme to also apply
  const setTheme = (theme) => {
    instance.setTheme(theme);
    instance.applyTheme();
  };
  
  // Wrap panel registration to update panelTypes store
  const registerPanel = (type, panel) => {
    instance.registerPanel(type, panel);
    panelTypes.set(instance.getPanelTypes());
  };
  
  const unregisterPanel = (type) => {
    instance.unregisterPanel(type);
    panelTypes.set(instance.getPanelTypes());
  };
  
  return {
    // Instance
    instance,
    
    // Stores
    artifacts,
    activeArtifactId,
    isPanelOpen,
    viewMode,
    isFullscreen,
    activeArtifact,
    artifactCount,
    hasArtifacts,
    
    // Panel stores
    panelTypes,
    activePanelUrl,
    
    // Methods
    processMessage: instance.processMessage,
    initializeContent: instance.initializeContent,
    openArtifact: instance.openArtifact,
    closePanel: instance.closePanel,
    togglePanel: instance.togglePanel,
    toggleFullscreen: instance.toggleFullscreen,
    setViewMode: instance.setViewMode,
    getPanelUrl: instance.getPanelUrl,
    sendToPanel: instance.sendToPanel,
    
    // Panel management
    hasPanel: instance.hasPanel,
    registerPanel,
    unregisterPanel,
    getPanelTypes: instance.getPanelTypes,
    
    // Events
    on: instance.on,
    off: instance.off,
    
    // State management
    clearArtifacts: () => instance.state.clear(),

    // Theme
    applyTheme: instance.applyTheme,
    setTheme,
    getTheme: instance.getTheme,

    // Cleanup
    destroy,
  };
}

/**
 * Set Artifactuse context (call in parent component)
 * 
 * @example
 * <script>
 *   import { setArtifactuseContext } from 'artifactuse/svelte';
 *   
 *   const stores = setArtifactuseContext({
 *     panels: {
 *       'chart': 'chart-panel'
 *     }
 *   });
 * </script>
 */
export function setArtifactuseContext(config = {}) {
  const stores = createArtifactuseStores(config);
  setContext(ARTIFACTUSE_KEY, stores);
  
  // Apply theme immediately (works in both SSR and client)
  if (typeof window !== 'undefined') {
    stores.applyTheme();
  }
  
  // Also apply on mount to ensure it's applied after hydration
  onMount(() => {
    stores.applyTheme();
  });
  
  // Cleanup on destroy
  onDestroy(() => {
    stores.destroy();
  });
  
  return stores;
}

/**
 * Get Artifactuse context (call in child components)
 */
export function getArtifactuseContext() {
  const context = getContext(ARTIFACTUSE_KEY);
  
  if (!context) {
    throw new Error('getArtifactuseContext must be used within a component that has called setArtifactuseContext');
  }
  
  return context;
}

/**
 * Create standalone stores (without context)
 */
export function useArtifactuse(config = {}) {
  const stores = createArtifactuseStores(config);
  
  // Apply theme immediately
  if (typeof window !== 'undefined') {
    stores.applyTheme();
  }
  
  onMount(() => {
    stores.applyTheme();
  });
  
  onDestroy(() => {
    stores.destroy();
  });
  
  return stores;
}

// Export DEFAULT_PANELS for reference
export { DEFAULT_PANELS };

// Export components
export { default as ArtifactuseAgentMessage } from './ArtifactuseAgentMessage.svelte';
export { default as ArtifactusePanel } from './ArtifactusePanel.svelte';
export { default as ArtifactusePanelToggle } from './ArtifactusePanelToggle.svelte';
export { default as ArtifactuseCard } from './ArtifactuseCard.svelte';
export { default as ArtifactuseViewer } from './ArtifactuseViewer.svelte';
export { default as ArtifactuseInlineForm } from './ArtifactuseInlineForm.svelte';
export { default as ArtifactuseSocialPreview } from './ArtifactuseSocialPreview.svelte';

// Default export
export default {
  createArtifactuseStores,
  setArtifactuseContext,
  getArtifactuseContext,
  useArtifactuse,
  DEFAULT_PANELS,
};
// artifactuse/svelte/index.js
// Svelte / SvelteKit integration for Artifactuse SDK

import { writable, derived } from 'svelte/store';
import { setContext, getContext, onMount, onDestroy } from 'svelte';
import createArtifactuse from '../core/index.js';

// Context key
const ARTIFACTUSE_KEY = 'artifactuse';

/**
 * Create Artifactuse stores and instance
 */
export function createArtifactuseStores(config = {}) {
  const instance = createArtifactuse(config);
  
  // Create Svelte stores
  const artifacts = writable([]);
  const activeArtifactId = writable(null);
  const isPanelOpen = writable(false);
  const viewMode = writable('preview');
  const isFullscreen = writable(false);
  
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
    setTheme,
    getTheme: instance.getTheme,
    
    // Cleanup
    destroy,
  };
}

/**
 * Set Artifactuse context (call in parent component)
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
};
// artifactuse/react/index.jsx
// React integration for Artifactuse SDK

import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback,
  useMemo,
  useRef 
} from 'react';
import createArtifactuse, { DEFAULT_PANELS } from '../core/index.js';

// Context
const ArtifactuseContext = createContext(null);

/**
 * Artifactuse Provider Component
 * 
 * @param {object} props
 * @param {React.ReactNode} props.children - Child components
 * @param {object} props.config - Configuration options
 * @param {string} props.config.cdnUrl - Base CDN URL for panels
 * @param {object} props.config.panels - Panel configuration (add/override/disable)
 * @param {string} props.config.theme - Theme: 'dark' | 'light' | 'auto'
 * @param {object} props.config.colors - Custom theme colors
 * @param {object} props.config.processors - Enable/disable processors
 * @param {boolean} props.config.branding - Show branding
 * 
 * @example
 * // Basic usage
 * <ArtifactuseProvider>
 *   <App />
 * </ArtifactuseProvider>
 * 
 * @example
 * // With custom panels
 * <ArtifactuseProvider config={{
 *   panels: {
 *     'chart': 'chart-panel',
 *     'video': 'https://my-cdn.com/video-panel',
 *     'canvas': null, // disable
 *   }
 * }}>
 *   <App />
 * </ArtifactuseProvider>
 */
export function ArtifactuseProvider({ children, config = {} }) {
  const instanceRef = useRef(null);
  
  // Create instance once
  if (!instanceRef.current) {
    instanceRef.current = createArtifactuse(config);
  }
  
  const instance = instanceRef.current;
  
  // Reactive state
  const [state, setState] = useState({
    artifacts: [],
    activeArtifactId: null,
    isPanelOpen: false,
    viewMode: 'preview',
    isFullscreen: false,
    openTabs: [],
    tabViewModes: {},
    forceEmptyView: false,
  });

  // Panel types state (for reactivity when registering/unregistering)
  const [panelTypes, setPanelTypes] = useState(() => instance.getPanelTypes());

  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = instance.state.subscribe((newState) => {
      setState({
        artifacts: newState.artifacts,
        activeArtifactId: newState.activeArtifactId,
        isPanelOpen: newState.isPanelOpen,
        viewMode: newState.viewMode,
        isFullscreen: newState.isFullscreen,
        openTabs: newState.openTabs,
        tabViewModes: newState.tabViewModes,
        forceEmptyView: newState.forceEmptyView,
      });
    });
    
    // Apply theme immediately
    instance.applyTheme();
    
    return () => {
      unsubscribe();
      instance.destroy();
    };
  }, [instance]);
  
  // Computed values
  const activeArtifact = useMemo(() => {
    if (!state.activeArtifactId) return null;
    return state.artifacts.find(a => a.id === state.activeArtifactId) || null;
  }, [state.artifacts, state.activeArtifactId]);
  
  // Only count non-inline artifacts (inline artifacts render in message content)
  const artifactCount = state.artifacts.filter(a => !a.isInline).length;
  const hasArtifacts = artifactCount > 0;
  
  // Panel URL for active artifact
  const activePanelUrl = useMemo(() => {
    if (!activeArtifact) return null;
    return instance.getPanelUrl(activeArtifact);
  }, [activeArtifact, instance]);
  
  // Wrap setTheme to also apply
  const setTheme = useCallback((theme) => {
    instance.setTheme(theme);
    instance.applyTheme();
  }, [instance]);
  
  // Wrap panel registration to update panelTypes state
  const registerPanel = useCallback((type, panel) => {
    instance.registerPanel(type, panel);
    setPanelTypes(instance.getPanelTypes());
  }, [instance]);
  
  const unregisterPanel = useCallback((type) => {
    instance.unregisterPanel(type);
    setPanelTypes(instance.getPanelTypes());
  }, [instance]);
  
  // Context value
  const value = useMemo(() => ({
    instance,
    state,
    activeArtifact,
    artifactCount,
    hasArtifacts,
    
    // Panel computed
    panelTypes,
    activePanelUrl,
    
    // Methods
    processMessage: instance.processMessage,
    initializeContent: instance.initializeContent,
    openArtifact: instance.openArtifact,
    openFile: instance.openFile,
    openCode: instance.openCode,
    updateFile: instance.updateFile,
    openPanel: instance.openPanel,
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

    // Multi-tab
    closeTab: instance.closeTab,
    closeOtherTabs: instance.closeOtherTabs,
    closeAllTabs: instance.closeAllTabs,

    // Events
    on: instance.on,
    off: instance.off,

    // State management
    clearArtifacts: () => instance.state.clear(),

    // Theme
    applyTheme: instance.applyTheme,
    setTheme,
    getTheme: instance.getTheme,
  }), [
    instance, 
    state, 
    activeArtifact, 
    artifactCount, 
    hasArtifacts, 
    panelTypes,
    activePanelUrl,
    setTheme,
    registerPanel,
    unregisterPanel,
  ]);
  
  return (
    <ArtifactuseContext.Provider value={value}>
      {children}
    </ArtifactuseContext.Provider>
  );
}

/**
 * useArtifactuse Hook
 */
export function useArtifactuse() {
  const context = useContext(ArtifactuseContext);
  
  if (!context) {
    throw new Error('useArtifactuse must be used within an ArtifactuseProvider');
  }
  
  return context;
}

/**
 * Custom hook for event subscription
 */
export function useArtifactuseEvent(event, callback) {
  const { on, off } = useArtifactuse();
  
  useEffect(() => {
    const unsubscribe = on(event, callback);
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      } else {
        off(event, callback);
      }
    };
  }, [event, callback, on, off]);
}

/**
 * Custom hook for panel management
 * 
 * @example
 * const { register, unregister, isRegistered, types } = usePanelRegistry();
 * 
 * // Register a custom panel
 * register('chart', 'https://charts.example.com/panel');
 */
export function usePanelRegistry() {
  const { 
    registerPanel, 
    unregisterPanel, 
    hasPanel, 
    panelTypes,
    instance 
  } = useArtifactuse();
  
  const isRegistered = useCallback((type) => {
    return hasPanel({ type });
  }, [hasPanel]);
  
  const getPanelUrl = useCallback((type, options = {}) => {
    return instance.panelResolver?.resolve(type, options) || null;
  }, [instance]);
  
  return {
    register: registerPanel,
    unregister: unregisterPanel,
    isRegistered,
    getPanelUrl,
    types: panelTypes,
    defaults: DEFAULT_PANELS,
  };
}

// Export DEFAULT_PANELS for reference
export { DEFAULT_PANELS };

// Export components
export { default as ArtifactuseAgentMessage } from './ArtifactuseAgentMessage.jsx';
export { default as ArtifactusePanel } from './ArtifactusePanel.jsx';
export { default as ArtifactusePanelToggle } from './ArtifactusePanelToggle.jsx';
export { default as ArtifactuseCard } from './ArtifactuseCard.jsx';
export { default as ArtifactuseViewer } from './ArtifactuseViewer.jsx';
export { default as ArtifactuseInlineForm } from './ArtifactuseInlineForm.jsx';
export { default as ArtifactuseSocialPreview } from './ArtifactuseSocialPreview.jsx';

// Default export
export default {
  ArtifactuseProvider,
  useArtifactuse,
  useArtifactuseEvent,
  usePanelRegistry,
  DEFAULT_PANELS,
};
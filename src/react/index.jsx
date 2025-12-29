// artifactuse/react/index.js
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
import createArtifactuse from '../core/index.js';

// Context
const ArtifactuseContext = createContext(null);

/**
 * Artifactuse Provider Component
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
  });
  
  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = instance.state.subscribe((newState) => {
      setState({
        artifacts: newState.artifacts,
        activeArtifactId: newState.activeArtifactId,
        isPanelOpen: newState.isPanelOpen,
        viewMode: newState.viewMode,
        isFullscreen: newState.isFullscreen,
      });
    });
    
    // Apply theme
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
  
  const artifactCount = state.artifacts.length;
  const hasArtifacts = artifactCount > 0;
  
  // Context value
  const value = useMemo(() => ({
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
  }), [instance, state, activeArtifact, artifactCount, hasArtifacts]);
  
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
};

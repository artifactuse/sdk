// artifactuse/core/state.js
// Framework-agnostic state management for Artifactuse

/**
 * Create state manager
 */
export function createState() {
  // Initial state
  let state = {
    artifacts: [],
    activeArtifactId: null,
    isPanelOpen: false,
    viewMode: 'preview', // 'preview' | 'code' | 'split'
    isFullscreen: false,
  };
  
  // Subscribers
  const subscribers = new Set();
  
  /**
   * Notify all subscribers of state change
   */
  function notify() {
    subscribers.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('Artifactuse state subscriber error:', error);
      }
    });
  }
  
  /**
   * Subscribe to state changes
   */
  function subscribe(callback) {
    subscribers.add(callback);
    
    // Call immediately with current state
    callback(state);
    
    // Return unsubscribe function
    return () => {
      subscribers.delete(callback);
    };
  }
  
  /**
   * Get current state (immutable copy)
   */
  function getState() {
    return { ...state };
  }
  
  /**
   * Add artifact
   */
  function addArtifact(artifact) {
    const existingIndex = state.artifacts.findIndex(a => a.id === artifact.id);
    
    if (existingIndex === -1) {
      state = {
        ...state,
        artifacts: [...state.artifacts, artifact],
      };
    } else {
      // Update existing
      const newArtifacts = [...state.artifacts];
      newArtifacts[existingIndex] = { ...newArtifacts[existingIndex], ...artifact };
      state = {
        ...state,
        artifacts: newArtifacts,
      };
    }
    
    notify();
  }
  
  /**
   * Add multiple artifacts
   */
  function addArtifacts(artifacts) {
    artifacts.forEach(addArtifact);
  }
  
  /**
   * Remove artifact
   */
  function removeArtifact(artifactId) {
    state = {
      ...state,
      artifacts: state.artifacts.filter(a => a.id !== artifactId),
      activeArtifactId: state.activeArtifactId === artifactId ? null : state.activeArtifactId,
      isPanelOpen: state.activeArtifactId === artifactId ? false : state.isPanelOpen,
    };
    
    notify();
  }
  
  /**
   * Get artifact by ID
   */
  function getArtifact(artifactId) {
    return state.artifacts.find(a => a.id === artifactId) || null;
  }
  
  /**
   * Get active artifact
   */
  function getActiveArtifact() {
    if (!state.activeArtifactId) return null;
    return getArtifact(state.activeArtifactId);
  }
  
  /**
   * Set active artifact
   */
  function setActiveArtifact(artifactId) {
    const artifact = getArtifact(artifactId);

    let viewMode = artifact?.isPreviewable === false ? 'code' : 'preview';
    if (artifact?.tabs && !artifact.tabs.includes(viewMode)) {
      viewMode = artifact.tabs[0];
    }

    state = {
      ...state,
      activeArtifactId: artifactId,
      viewMode,
    };

    notify();
  }
  
  /**
   * Clear active artifact (return to list view)
   */
  function clearActiveArtifact() {
    state = {
      ...state,
      activeArtifactId: null,
    };
    
    notify();
  }
  
  /**
   * Set panel open state
   */
  function setPanelOpen(isOpen) {
    state = {
      ...state,
      isPanelOpen: isOpen,
      isFullscreen: isOpen ? state.isFullscreen : false,
    };
    
    notify();
  }
  
  /**
   * Set view mode
   */
  function setViewMode(mode) {
    if (!['preview', 'code', 'split', 'edit'].includes(mode)) {
      console.warn(`Invalid view mode: ${mode}`);
      return;
    }
    
    state = {
      ...state,
      viewMode: mode,
    };
    
    notify();
  }
  
  /**
   * Set fullscreen state
   */
  function setFullscreen(isFullscreen) {
    state = {
      ...state,
      isFullscreen,
    };
    
    notify();
  }
  
  /**
   * Get artifacts by message ID
   */
  function getArtifactsByMessageId(messageId) {
    return state.artifacts.filter(a => a.messageId === messageId);
  }
  
  /**
   * Get artifacts by type
   */
  function getArtifactsByType(type) {
    return state.artifacts.filter(a => a.type === type);
  }
  
  /**
   * Get artifact count
   */
  function getArtifactCount() {
    return state.artifacts.length;
  }
  
  /**
   * Clear all state
   */
  function clear() {
    state = {
      artifacts: [],
      activeArtifactId: null,
      isPanelOpen: false,
      viewMode: 'preview',
      isFullscreen: false,
    };
    
    notify();
  }
  
  /**
   * Batch update (for performance)
   */
  function batch(updateFn) {
    const oldNotify = notify;
    let notifyPending = false;
    
    // Suppress notifications during batch
    const suppressedNotify = () => {
      notifyPending = true;
    };
    
    try {
      // Replace notify temporarily
      Object.defineProperty(window, '__artifactuse_notify__', {
        value: suppressedNotify,
        configurable: true,
      });
      
      updateFn();
    } finally {
      delete window.__artifactuse_notify__;
      
      // Notify once at end if needed
      if (notifyPending) {
        oldNotify();
      }
    }
  }
  
  // Public API
  return {
    // State access
    getState,
    subscribe,
    
    // Artifacts
    addArtifact,
    addArtifacts,
    removeArtifact,
    getArtifact,
    getActiveArtifact,
    getArtifactsByMessageId,
    getArtifactsByType,
    getArtifactCount,
    
    // Panel state
    setActiveArtifact,
    clearActiveArtifact,
    setPanelOpen,
    setViewMode,
    setFullscreen,
    
    // Utilities
    clear,
    batch,
  };
}

/**
 * Create a reactive state (for frameworks that need reactivity)
 */
export function createReactiveState(reactivityFn) {
  const state = createState();
  
  // Wrap state in reactivity
  return reactivityFn(state);
}

export default {
  createState,
  createReactiveState,
};
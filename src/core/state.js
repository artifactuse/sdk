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
    // Multi-tab support
    openTabs: [],        // Array of artifact IDs open as tabs (ordered)
    tabViewModes: {},    // { [artifactId]: 'preview' | 'code' | 'split' | 'edit' }
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
    const newTabs = state.openTabs.filter(id => id !== artifactId);
    const { [artifactId]: _, ...remainingViewModes } = state.tabViewModes;

    state = {
      ...state,
      artifacts: state.artifacts.filter(a => a.id !== artifactId),
      activeArtifactId: state.activeArtifactId === artifactId ? null : state.activeArtifactId,
      isPanelOpen: state.activeArtifactId === artifactId ? false : state.isPanelOpen,
      openTabs: newTabs,
      tabViewModes: remainingViewModes,
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

    // Try tab-specific viewMode first, then compute from artifact
    let viewMode = state.tabViewModes[artifactId];
    if (!viewMode) {
      viewMode = artifact?.isPreviewable === false ? 'code' : 'preview';
      if (artifact?.tabs && !artifact.tabs.includes(viewMode)) {
        viewMode = artifact.tabs[0];
      }
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

    // Also store per-tab viewMode for the active artifact
    const newTabViewModes = state.activeArtifactId
      ? { ...state.tabViewModes, [state.activeArtifactId]: mode }
      : state.tabViewModes;

    state = {
      ...state,
      viewMode: mode,
      tabViewModes: newTabViewModes,
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

  // ============================================
  // Multi-tab methods
  // ============================================

  /**
   * Open artifact in a new tab (or focus if already open)
   */
  function openTab(artifactId) {
    const artifact = getArtifact(artifactId);
    if (!artifact) return;

    const alreadyOpen = state.openTabs.includes(artifactId);
    const newTabs = alreadyOpen ? state.openTabs : [...state.openTabs, artifactId];

    // Determine view mode for this tab
    let viewMode = state.tabViewModes[artifactId];
    if (!viewMode) {
      viewMode = artifact.isPreviewable === false ? 'code' : 'preview';
      if (artifact.tabs && !artifact.tabs.includes(viewMode)) {
        viewMode = artifact.tabs[0];
      }
    }

    state = {
      ...state,
      openTabs: newTabs,
      activeArtifactId: artifactId,
      tabViewModes: { ...state.tabViewModes, [artifactId]: viewMode },
      viewMode,
    };
    notify();
  }

  /**
   * Close a tab
   */
  function closeTab(artifactId) {
    const idx = state.openTabs.indexOf(artifactId);
    if (idx === -1) return;

    const newTabs = state.openTabs.filter(id => id !== artifactId);
    const { [artifactId]: _, ...remainingViewModes } = state.tabViewModes;

    // If closing the active tab, switch to adjacent
    let newActiveId = state.activeArtifactId;
    if (state.activeArtifactId === artifactId) {
      if (newTabs.length === 0) {
        newActiveId = null;
      } else if (idx >= newTabs.length) {
        newActiveId = newTabs[newTabs.length - 1];
      } else {
        newActiveId = newTabs[idx];
      }
    }

    const newViewMode = newActiveId ? (remainingViewModes[newActiveId] || 'preview') : 'preview';

    state = {
      ...state,
      openTabs: newTabs,
      activeArtifactId: newActiveId,
      tabViewModes: remainingViewModes,
      viewMode: newViewMode,
    };
    notify();
  }

  /**
   * Close all tabs except one
   */
  function closeOtherTabs(keepArtifactId) {
    const artifact = getArtifact(keepArtifactId);
    if (!artifact) return;

    const viewMode = state.tabViewModes[keepArtifactId] || state.viewMode;

    state = {
      ...state,
      openTabs: [keepArtifactId],
      activeArtifactId: keepArtifactId,
      tabViewModes: { [keepArtifactId]: viewMode },
      viewMode,
    };
    notify();
  }

  /**
   * Close all tabs
   */
  function closeAllTabs() {
    state = {
      ...state,
      openTabs: [],
      activeArtifactId: null,
      tabViewModes: {},
    };
    notify();
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
      openTabs: [],
      tabViewModes: {},
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

    // Multi-tab
    openTab,
    closeTab,
    closeOtherTabs,
    closeAllTabs,

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

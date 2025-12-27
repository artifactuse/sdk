// artifactuse/core/index.js
// Main entry point for Artifactuse SDK

import { parseArtifacts, extractCodeBlockArtifacts, isInlineArtifact } from './detector.js';
import { createState } from './state.js';
import { createBridge } from './bridge.js';
import { createTheme } from './theme.js';
import * as processors from './processors.js';

/**
 * Artifactuse SDK Configuration
 */
const DEFAULT_CONFIG = {
  // CDN URL for panel artifacts (video editor, canvas, etc.)
  cdnUrl: 'https://cdn.artifactuse.com',
  
  // Theme: 'dark' | 'light' | 'auto'
  theme: 'auto',
  
  // Custom theme colors
  colors: {
    primary: '99, 102, 241',      // Indigo
    background: '17, 24, 39',     // Gray-900
    surface: '31, 41, 55',        // Gray-800
    text: '243, 244, 246',        // Gray-100
    border: '75, 85, 99',         // Gray-600
  },
  
  // Processor options
  processors: {
    codeBlocks: true,
    images: true,
    videos: true,
    audio: true,
    maps: true,
    social: true,
    documents: true,
    codeEmbeds: true,
    dataViz: true,
    design: true,
    interactive: true,
    tables: true,
    math: true,
    mermaid: true,
  },
  
  // Minimum lines/length for code block extraction
  codeExtraction: {
    minLines: 3,
    minLength: 50,
  },
};

/**
 * Panel URL mapping by artifact type/language
 */
const PANEL_URL_MAP = {
  // By type
  form: 'form-panel',
  
  // By language
  video: 'editor-panel/video',
  videoeditor: 'editor-panel/video',
  timeline: 'editor-panel/video',
  canvas: 'editor-panel/canvas',
  whiteboard: 'editor-panel/canvas',
  drawing: 'editor-panel/canvas',
  json: 'json-panel',
  svg: 'svg-panel',
  diff: 'diff-panel',
  patch: 'diff-panel',
  javascript: 'code-panel',
  js: 'code-panel',
  python: 'code-panel',
  py: 'code-panel',
  jsx: 'react-panel',
  react: 'react-panel',
  vue: 'vue-panel',
  html: 'html-panel',
  htm: 'html-panel',
  markdown: 'html-panel',
  md: 'html-panel',
};

/**
 * Create Artifactuse instance
 */
export function createArtifactuse(userConfig = {}) {
  const config = mergeConfig(DEFAULT_CONFIG, userConfig);
  const state = createState();
  const bridge = createBridge(config.cdnUrl);
  const theme = createTheme(config.theme, config.colors);
  
  /**
   * Process AI agent message content
   * Returns processed HTML with artifact placeholders
   */
  function processMessage(content, messageId) {
    let html = content;
    const artifacts = [];
    
    // Extract all code block artifacts (code, form, social)
    if (config.processors.codeBlocks) {
      const result = extractCodeBlockArtifacts(html, messageId, config.codeExtraction);
      html = result.html;
      artifacts.push(...result.artifacts);
    }
    
    // Apply inline processors for media embeds
    if (config.processors.images) {
      html = processors.processImages(html);
    }
    if (config.processors.videos) {
      html = processors.processVideos(html);
    }
    if (config.processors.audio) {
      html = processors.processAudio(html);
    }
    if (config.processors.maps) {
      html = processors.processMaps(html);
    }
    if (config.processors.social) {
      html = processors.processSocialEmbeds(html);
    }
    if (config.processors.documents) {
      html = processors.processPdfs(html);
      html = processors.processGoogleDocs(html);
      html = processors.processOfficeDocuments(html);
    }
    if (config.processors.codeEmbeds) {
      html = processors.processCodeEmbeds(html);
    }
    if (config.processors.dataViz) {
      html = processors.processDataViz(html);
    }
    if (config.processors.design) {
      html = processors.process3DEmbeds(html);
    }
    if (config.processors.interactive) {
      html = processors.processInteractiveEmbeds(html);
    }
    if (config.processors.tables) {
      html = processors.processTables(html);
    }
    if (config.processors.math) {
      html = processors.processMath(html);
    }
    
    // Add artifacts to state
    artifacts.forEach(artifact => {
      state.addArtifact(artifact);
    });
    
    return {
      html,
      artifacts,
    };
  }
  
  /**
   * Open artifact in panel
   */
  function openArtifact(artifact) {
    // Don't open inline artifacts in panel
    if (artifact.isInline) {
      console.warn('Attempted to open inline artifact in panel:', artifact.id);
      return;
    }
    
    state.setActiveArtifact(artifact.id);
    state.setPanelOpen(true);
    
    emit('artifact:opened', artifact);
  }
  
  /**
   * Close panel
   */
  function closePanel() {
    state.setPanelOpen(false);
    state.setFullscreen(false);
    
    emit('panel:closed');
  }
  
  /**
   * Toggle panel
   */
  function togglePanel() {
    const isOpen = !state.getState().isPanelOpen;
    state.setPanelOpen(isOpen);
    
    if (!isOpen) {
      state.setFullscreen(false);
    }
    
    emit('panel:toggled', { isOpen });
  }
  
  /**
   * Toggle fullscreen
   */
  function toggleFullscreen() {
    const isFullscreen = !state.getState().isFullscreen;
    state.setFullscreen(isFullscreen);
    
    emit('fullscreen:toggled', { isFullscreen });
  }
  
  /**
   * Set view mode
   */
  function setViewMode(mode) {
    state.setViewMode(mode);
    
    emit('viewMode:changed', { mode });
  }
  
  /**
   * Get panel iframe URL for artifact
   * Handles all artifact types: code, form, etc.
   */
  function getPanelUrl(artifact, options = {}) {
    if (!artifact) return null;
    
    const { type, language } = artifact;
    const lang = language?.toLowerCase();
    
    // Find panel type from map
    let panelType = PANEL_URL_MAP[type] || PANEL_URL_MAP[lang];
    
    if (!panelType) return null;
    
    // Build URL with theme params
    const baseUrl = `${config.cdnUrl}/${panelType}/`;
    const params = new URLSearchParams();
    
    params.set('theme', options.theme || theme.resolved);
    if (config.colors?.primary) {
      params.set('accent', config.colors.primary);
    }
    
    return `${baseUrl}?${params.toString()}`;
  }
  
  /**
   * Send data to panel iframe
   */
  function sendToPanel(action, data) {
    bridge.send(action, data);
  }
  
  /**
   * Event handling
   */
  const listeners = new Map();
  
  function on(event, callback) {
    if (!listeners.has(event)) {
      listeners.set(event, new Set());
    }
    listeners.get(event).add(callback);
    
    return () => {
      listeners.get(event)?.delete(callback);
    };
  }
  
  function off(event, callback) {
    listeners.get(event)?.delete(callback);
  }
  
  function emit(event, data) {
    listeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Artifactuse event handler error (${event}):`, error);
      }
    });
  }
  
  // Listen for bridge events (from iframe panels)
  bridge.on('ai:request', (data) => emit('ai:request', data));
  bridge.on('save:request', (data) => emit('save:request', data));
  bridge.on('export:complete', (data) => emit('export:complete', data));
  bridge.on('form:submit', (data) => emit('form:submit', data));
  bridge.on('form:cancel', (data) => emit('form:cancel', data));
  bridge.on('form:step', (data) => emit('form:step', data));
  bridge.on('social:copy', (data) => emit('social:copy', data));
  
  /**
   * Apply theme to document
   */
  function applyTheme() {
    theme.apply();
  }
  
  /**
   * Set theme
   */
  function setTheme(newTheme) {
    theme.set(newTheme);
  }
  
  /**
   * Get resolved theme
   */
  function getTheme() {
    return theme.resolved;
  }
  
  /**
   * Destroy instance
   */
  function destroy() {
    bridge.destroy();
    listeners.clear();
    state.clear();
  }
  
  // Public API
  return {
    // Config
    config,
    
    // State
    state,
    getState: () => state.getState(),
    subscribe: state.subscribe,
    
    // Processing
    processMessage,
    
    // Panel control
    openArtifact,
    closePanel,
    togglePanel,
    toggleFullscreen,
    setViewMode,
    getPanelUrl,
    sendToPanel,
    
    // Theme
    applyTheme,
    setTheme,
    getTheme,
    
    // Events
    on,
    off,
    emit,
    
    // Bridge (for advanced use)
    bridge,
    
    // Cleanup
    destroy,
  };
}

/**
 * Deep merge configuration
 */
function mergeConfig(defaults, overrides) {
  const result = { ...defaults };
  
  for (const key in overrides) {
    if (overrides[key] !== undefined) {
      if (typeof overrides[key] === 'object' && !Array.isArray(overrides[key])) {
        result[key] = mergeConfig(defaults[key] || {}, overrides[key]);
      } else {
        result[key] = overrides[key];
      }
    }
  }
  
  return result;
}

// Export utilities
export { parseArtifacts, extractCodeBlockArtifacts, isInlineArtifact } from './detector.js';
export { createState } from './state.js';
export { createBridge } from './bridge.js';
export { createTheme } from './theme.js';
export * from './processors.js';
export * from './highlight.js';

// Default export
export default createArtifactuse;

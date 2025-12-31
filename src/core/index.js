// artifactuse/core/index.js
// Main entry point for Artifactuse SDK

import { parseArtifacts, extractCodeBlockArtifacts, getIsInline } from './detector.js';
import { createState } from './state.js';
import { createBridge } from './bridge.js';
import { createTheme } from './theme.js';
import { marked } from 'marked';

// Import from modular processors
import {
  // Image
  processImages,
  processImageGalleries,
  renderImageHtml,
  
  // Video
  processVideos,
  
  // Audio
  processAudio,
  
  // Maps
  processMaps,
  
  // Social
  processSocialEmbeds,
  
  // Documents
  processPdfs,
  processGoogleDocs,
  processOfficeDocuments,
  
  // Code embeds
  processCodeEmbeds,
  
  // Data visualization
  processDataViz,
  
  // Design/3D
  process3DEmbeds,
  
  // Interactive
  processInteractiveEmbeds,
  
  // Mermaid
  processMermaid,
  initializeMermaid,
  
  // Tables
  processTables,
  initializeTables,
  
  // Math
  processMath,
  initializeMath,
} from './processors/index.js';

// Import highlight utilities
import { highlightAll } from './highlight.js';

// Re-export processors for external use
export * from './processors/index.js';

/**
 * Escape HTML for safe embedding in attributes/content
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Configure marked with custom renderers
 * Note: marked v5+ passes an object with properties, not individual arguments
 */
function configureMarked() {
  // Custom renderer for images - uses SDK's renderImageHtml
  const imageRenderer = {
    image(token) {
      // Handle both old API (href, title, text) and new API (token object)
      const href = typeof token === 'string' ? token : token.href;
      const title = typeof token === 'string' ? arguments[1] : token.title;
      const text = typeof token === 'string' ? arguments[2] : token.text;
      return renderImageHtml(href || '', title || '', text || '');
    }
  };
  
  // Custom renderer for links - opens external links in new tab
  const linkRenderer = {
    link(token) {
      // Handle both old API (href, title, text) and new API (token object)
      const href = typeof token === 'string' ? token : token.href;
      const title = typeof token === 'string' ? arguments[1] : token.title;
      const text = typeof token === 'string' ? arguments[2] : token.text;
      const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
      return `<a href="${escapeHtml(href || '')}" target="_blank" rel="noopener noreferrer"${titleAttr}>${text || ''}</a>`;
    }
  };
  
  // Custom renderer for code blocks - preserves language class for Prism
  const codeRenderer = {
    code(token) {
      // Handle both old API (code, language) and new API (token object)
      const code = typeof token === 'string' ? token : token.text;
      const language = typeof token === 'string' ? arguments[1] : token.lang;
      const lang = language || '';
      const escapedCode = escapeHtml(code || '');
      if (lang) {
        return `<pre><code class="language-${escapeHtml(lang)}">${escapedCode}</code></pre>`;
      }
      return `<pre><code>${escapedCode}</code></pre>`;
    }
  };
  
  // Apply custom renderers
  marked.use({
    renderer: {
      ...imageRenderer,
      ...linkRenderer,
      ...codeRenderer,
    },
    gfm: true,
    breaks: true,
  });
}

// Initialize marked configuration
configureMarked();

/**
 * Artifactuse SDK Configuration
 */
const DEFAULT_CONFIG = {
  // CDN URL for panel artifacts (video editor, canvas, etc.)
  cdnUrl: 'https://cdn.artifactuse.com',
  
  // Theme: 'dark' | 'light' | 'auto'
  theme: 'auto',
  
  // Custom theme colors (optional - theme.js has defaults)
  // Can be flat (applies to both) or nested { dark: {...}, light: {...} }
  colors: null,
  
  // Show "Powered by Artifactuse" branding in panel footer
  // Set to false to hide (requires paid license)
  branding: true,
  
  // Processor options
  processors: {
    codeBlocks: true,
    images: true,
    imageGalleries: true,
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
  
  // Syntax highlighting (requires Prism.js)
  syntaxHighlight: true,
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
  mermaid: 'mermaid-panel',
};

/**
 * Create Artifactuse instance
 */
export function createArtifactuse(userConfig = {}) {
  const config = mergeConfig(DEFAULT_CONFIG, userConfig);
  const state = createState();
  const bridge = createBridge(config.cdnUrl);
  
  // Create theme - only pass colors if user provided them
  const theme = createTheme(config.theme, config.colors || {});
  
  /**
   * Process AI agent message content
   * Returns processed HTML with artifact placeholders
   */
  function processMessage(content, messageId) {
    // First, convert markdown to HTML
    let html = marked.parse(content);
    
    const artifacts = [];
    
    // Extract all code block artifacts (code, form, social)
    if (config.processors.codeBlocks) {
      const result = extractCodeBlockArtifacts(html, messageId, config.codeExtraction);
      html = result.html;
      artifacts.push(...result.artifacts);
    }
    
    // Apply inline processors for media embeds
    if (config.processors.images) {
      html = processImages(html);
    }
    
    // Group consecutive images into galleries (after image processing)
    if (config.processors.imageGalleries) {
      html = processImageGalleries(html);
    }
    
    if (config.processors.videos) {
      html = processVideos(html);
    }
    
    if (config.processors.audio) {
      html = processAudio(html);
    }
    
    if (config.processors.maps) {
      html = processMaps(html);
    }
    
    if (config.processors.social) {
      html = processSocialEmbeds(html);
    }
    
    if (config.processors.documents) {
      html = processPdfs(html);
      html = processGoogleDocs(html);
      html = processOfficeDocuments(html);
    }
    
    if (config.processors.codeEmbeds) {
      html = processCodeEmbeds(html);
    }
    
    if (config.processors.dataViz) {
      html = processDataViz(html);
    }
    
    if (config.processors.design) {
      html = process3DEmbeds(html);
    }
    
    if (config.processors.interactive) {
      html = processInteractiveEmbeds(html);
    }
    
    if (config.processors.tables) {
      html = processTables(html);
    }
    
    if (config.processors.math) {
      html = processMath(html);
    }
    
    if (config.processors.mermaid) {
      html = processMermaid(html);
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
   * Initialize dynamic content (call after DOM is ready)
   * This renders math equations, mermaid diagrams, sets up table interactivity,
   * and applies syntax highlighting
   */
  async function initializeContent(container = document) {
    const promises = [];
    
    if (config.processors.math) {
      promises.push(initializeMath());
    }
    
    if (config.processors.mermaid) {
      promises.push(initializeMermaid());
    }
    
    if (config.processors.tables) {
      initializeTables();
    }
    
    // Apply syntax highlighting if enabled
    if (config.syntaxHighlight) {
      highlightAll(container);
    }
    
    await Promise.all(promises);
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
    
    // Get primary color from current theme
    const colors = theme.colors;
    if (colors?.primary) {
      params.set('accent', colors.primary);
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
    initializeContent,
    
    // Panel control
    openArtifact,
    closePanel,
    togglePanel,
    toggleFullscreen,
    setViewMode,
    getPanelUrl,
    sendToPanel,
    
    // Theme
    theme,
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
    if (overrides[key] !== undefined && overrides[key] !== null) {
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
export { parseArtifacts, extractCodeBlockArtifacts, getIsInline as isInlineArtifact } from './detector.js';
export { createState } from './state.js';
export { createBridge } from './bridge.js';
export { createTheme } from './theme.js';
export * from './highlight.js';

// Default export
export default createArtifactuse;
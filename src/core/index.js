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
  processVideoGalleries,
  isVideoUrl,
  renderVideoHtml,
  
  // Audio
  processAudio,
  initializeAudioPlayers,
  destroyAllPlayers,
  
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
  
  // Custom renderer for links - handles video URLs specially
  const linkRenderer = {
    link(token) {
      // Handle both old API (href, title, text) and new API (token object)
      const href = typeof token === 'string' ? token : token.href;
      const title = typeof token === 'string' ? arguments[1] : token.title;
      const text = typeof token === 'string' ? arguments[2] : token.text;
      
      // Check if this is a video URL - render as video embed
      if (isVideoUrl(href)) {
        return renderVideoHtml(href);
      }
      
      // Otherwise, render as normal link (opens in new tab)
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
 * Default panel mappings
 * Maps artifact type/language to panel path (relative to cdnUrl)
 * 
 * Users can override these or add custom panels in config.panels
 */
const DEFAULT_PANELS = {
  // Structured artifact types
  form: 'form-panel',
  
  // Visual editors
  video: 'editor-panel/video',
  videoeditor: 'editor-panel/video',
  timeline: 'editor-panel/video',
  canvas: 'editor-panel/canvas',
  whiteboard: 'editor-panel/canvas',
  drawing: 'editor-panel/canvas',
  
  // Data/config formats
  json: 'json-panel',
  
  // Graphics
  svg: 'svg-panel',
  
  // Diff/patches
  diff: 'diff-panel',
  patch: 'diff-panel',
  
  // Programming languages
  javascript: 'code-panel',
  js: 'code-panel',
  python: 'code-panel',
  py: 'code-panel',
  
  // Frontend frameworks
  jsx: 'react-panel',
  react: 'react-panel',
  vue: 'vue-panel',
  
  // Markup
  html: 'html-panel',
  htm: 'html-panel',
  markdown: 'html-panel',
  md: 'html-panel',
  
  // Diagrams
  mermaid: 'mermaid-panel',
};

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
  
  // Panel configuration
  // Users can add/override/disable panels here
  // 
  // Format:
  //   'type': 'panel-path'           - Uses default cdnUrl
  //   'type': 'https://...'          - Full URL (different CDN)
  //   'type': null                   - Disable this panel type
  //   'type': { path: '...', cdn: '...' } - Explicit path + cdn
  //
  // Example:
  //   panels: {
  //     'my-custom': 'custom-panel',                    // Uses cdnUrl
  //     'video': 'https://my-cdn.com/video-panel',      // Full URL override
  //     'canvas': null,                                  // Disable canvas panel
  //     'chart': { path: 'chart-panel', cdn: 'https://charts.example.com' }
  //   }
  panels: {},
  
  // Processor options
  processors: {
    codeBlocks: true,
    images: true,
    imageGalleries: true,
    videos: true,
    videoGalleries: true,
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
 * Extract origin URL from a panel configuration
 * 
 * @param {string|object|null} panelConfig - Panel configuration
 * @param {string} defaultCdn - Default CDN URL
 * @returns {string|null} - Origin URL or null
 */
function extractOriginFromPanelConfig(panelConfig, defaultCdn) {
  if (panelConfig === null || panelConfig === undefined) {
    return null;
  }
  
  try {
    if (typeof panelConfig === 'string') {
      // Full URL - extract origin
      if (panelConfig.startsWith('http://') || panelConfig.startsWith('https://')) {
        return new URL(panelConfig).origin;
      }
      // Relative path - use default CDN
      return new URL(defaultCdn).origin;
    }
    
    if (typeof panelConfig === 'object' && panelConfig.path) {
      // Object with explicit cdn
      const cdn = panelConfig.cdn || defaultCdn;
      return new URL(cdn).origin;
    }
  } catch (error) {
    console.warn('Artifactuse: Failed to extract origin from panel config:', error);
  }
  
  return null;
}

/**
 * Collect all unique origins from panel configurations
 * 
 * @param {object} panels - Panel configuration object
 * @param {string} defaultCdn - Default CDN URL
 * @returns {string[]} - Array of unique origin URLs
 */
function collectOriginsFromPanels(panels, defaultCdn) {
  const origins = new Set();
  
  // Always include default CDN
  try {
    origins.add(new URL(defaultCdn).origin);
  } catch (error) {
    console.warn('Artifactuse: Invalid default CDN URL:', defaultCdn);
  }
  
  // Collect origins from all panel configs
  for (const panelConfig of Object.values(panels)) {
    const origin = extractOriginFromPanelConfig(panelConfig, defaultCdn);
    if (origin) {
      origins.add(origin);
    }
  }
  
  return [...origins];
}

/**
 * Create panel resolver from config
 * Merges default panels with user-provided panels
 * 
 * @param {object} config - SDK configuration
 * @param {object} bridge - Bridge instance for origin registration
 * @returns {object} - Panel resolver with lookup method
 */
function createPanelResolver(config, bridge) {
  // Start with default panels
  const panels = { ...DEFAULT_PANELS };
  
  // Merge user panels (supports array keys)
  if (config.panels) {
    for (const [key, value] of Object.entries(config.panels)) {
      // Handle array keys like ['python', 'py']
      if (Array.isArray(key)) {
        key.forEach(k => {
          const normalizedKey = k?.toLowerCase();
          if (normalizedKey) panels[normalizedKey] = value;
        });
      } else {
        const normalizedKey = key?.toLowerCase();
        if (normalizedKey) panels[normalizedKey] = value;
      }
    }
  }
  
  /**
   * Resolve panel URL for an artifact type/language
   * 
   * @param {string} typeOrLang - Artifact type or language
   * @param {object} options - Additional options (theme, etc.)
   * @returns {string|null} - Full panel URL or null if not found/disabled
   */
  function resolve(typeOrLang, options = {}) {
    const key = typeOrLang?.toLowerCase();
    if (!key) return null;
    
    const panelConfig = panels[key];
    
    // Panel explicitly disabled
    if (panelConfig === null) return null;
    
    // Panel not found
    if (panelConfig === undefined) return null;
    
    let baseUrl;
    
    if (typeof panelConfig === 'string') {
      // String value - check if it's a full URL or relative path
      if (panelConfig.startsWith('http://') || panelConfig.startsWith('https://')) {
        // Full URL provided
        baseUrl = panelConfig;
      } else {
        // Relative path - use default cdnUrl
        baseUrl = `${config.cdnUrl}/${panelConfig}`;
      }
    } else if (typeof panelConfig === 'object' && panelConfig.path) {
      // Object with explicit path and optional cdn
      const cdn = panelConfig.cdn || config.cdnUrl;
      baseUrl = `${cdn}/${panelConfig.path}`;
    } else {
      return null;
    }
    
    // Ensure trailing slash for consistency
    if (!baseUrl.endsWith('/')) {
      baseUrl += '';
    }
    
    // Append query parameters
    const params = new URLSearchParams();
    
    if (options.theme) {
      params.set('theme', options.theme);
    }
    
    if (options.accent) {
      params.set('accent', options.accent);
    }
    
    // Add any custom params
    if (options.params) {
      Object.entries(options.params).forEach(([k, v]) => {
        params.set(k, v);
      });
    }
    
    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }
  
  /**
   * Check if a panel exists for the given type/language
   */
  function has(typeOrLang) {
    const key = typeOrLang?.toLowerCase();
    return key && panels[key] !== undefined && panels[key] !== null;
  }
  
  /**
   * Get all registered panel types
   */
  function getTypes() {
    return Object.keys(panels).filter(k => panels[k] !== null);
  }
  
  /**
   * Register a new panel (at runtime)
   * Also registers the panel's origin with the bridge for message verification
   * 
   * @param {string|string[]} typesOrLang - Type/language or array of types/languages
   * @param {string|object} panelConfig - Panel path, full URL, or config object
   * 
   * @example
   * // Single type
   * register('chart', 'chart-panel');
   * 
   * // Multiple types/aliases at once
   * register(['python', 'py'], 'code-panel');
   * 
   * // Full URL (different CDN)
   * register('video', 'https://video-cdn.com/editor-panel/video');
   * 
   * // Explicit CDN configuration
   * register('chart', { path: 'chart-panel', cdn: 'https://charts.example.com' });
   */
  function register(typesOrLang, panelConfig) {
    const types = Array.isArray(typesOrLang) ? typesOrLang : [typesOrLang];
    
    // Register the panel for each type
    types.forEach(t => {
      const key = t?.toLowerCase();
      if (key) {
        panels[key] = panelConfig;
      }
    });
    
    // Extract and register the origin with the bridge
    const origin = extractOriginFromPanelConfig(panelConfig, config.cdnUrl);
    if (origin && bridge) {
      bridge.addAllowedOrigin(origin);
    }
  }
  
  /**
   * Unregister/disable a panel (at runtime)
   * Note: Does not remove the origin from the bridge (other panels may use it)
   * 
   * @param {string|string[]} typesOrLang - Type/language or array of types/languages
   * 
   * @example
   * // Single type
   * unregister('canvas');
   * 
   * // Multiple types at once
   * unregister(['canvas', 'whiteboard', 'drawing']);
   */
  function unregister(typesOrLang) {
    const types = Array.isArray(typesOrLang) ? typesOrLang : [typesOrLang];
    types.forEach(t => {
      const key = t?.toLowerCase();
      if (key) {
        panels[key] = null;
      }
    });
  }
  
  return {
    resolve,
    has,
    getTypes,
    register,
    unregister,
    
    // Expose raw panels for debugging
    get panels() { return { ...panels }; },
  };
}

/**
 * Create Artifactuse instance
 */
export function createArtifactuse(userConfig = {}) {
  const config = mergeConfig(DEFAULT_CONFIG, userConfig);
  const state = createState();
  
  // Collect all origins from initial panel configuration
  const allPanels = { ...DEFAULT_PANELS, ...config.panels };
  const initialOrigins = collectOriginsFromPanels(allPanels, config.cdnUrl);
  
  // Create bridge with all known origins
  const bridge = createBridge(initialOrigins);
  
  // Create theme - only pass colors if user provided them
  const theme = createTheme(config.theme, config.colors || {});
  
  // Create panel resolver (pass bridge for runtime origin registration)
  const panelResolver = createPanelResolver(config, bridge);
  
  /**
   * Process AI agent message content
   * Returns processed HTML with artifact placeholders
   */
  function processMessage(content, messageId) {
    // First, convert markdown to HTML
    let html = marked.parse(content);
    
    const artifacts = [];
    
    // Get current resolved theme for processors that need it
    const processorOptions = { theme: theme.resolved };
    
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

    // Group consecutive videos into galleries (after video processing)
    if (config.processors.videoGalleries) {
      html = processVideoGalleries(html);
    }
    
    if (config.processors.audio) {
      html = processAudio(html, processorOptions);
    }
    
    if (config.processors.maps) {
      html = processMaps(html);
    }
    
    if (config.processors.social) {
      html = processSocialEmbeds(html, processorOptions);
    }
    
    if (config.processors.documents) {
      html = processPdfs(html);
      html = processGoogleDocs(html);
      html = processOfficeDocuments(html);
    }
    
    if (config.processors.codeEmbeds) {
      html = processCodeEmbeds(html, processorOptions);
    }
    
    if (config.processors.dataViz) {
      html = processDataViz(html);
    }
    
    if (config.processors.design) {
      html = process3DEmbeds(html, processorOptions);
    }
    
    if (config.processors.interactive) {
      html = processInteractiveEmbeds(html, processorOptions);
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
   * audio players, and applies syntax highlighting
  */
  async function initializeContent(container = document) {
    const promises = [];
    
    // Get current resolved theme for initializers that need it
    const initOptions = { theme: theme.resolved };
    
    if (config.processors.math) {
      promises.push(initializeMath());
    }
    
    if (config.processors.mermaid) {
      promises.push(initializeMermaid(initOptions));
    }
    
    if (config.processors.tables) {
      initializeTables();
    }

    if (config.processors.audio) {
      initializeAudioPlayers(container); 
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
    state.clearActiveArtifact();
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
   * 
   * Uses the configurable panel resolver
   */
  function getPanelUrl(artifact, options = {}) {
    if (!artifact) return null;
    
    const { type, language } = artifact;
    
    // Build options for panel URL
    const resolveOptions = {
      theme: options.theme || theme.resolved,
    };
    
    // Get primary color from current theme
    const colors = theme.colors;
    if (colors?.primary) {
      resolveOptions.accent = colors.primary;
    }
    
    // Try to resolve by type first, then by language
    let url = panelResolver.resolve(type, resolveOptions);
    
    if (!url && language) {
      url = panelResolver.resolve(language, resolveOptions);
    }
    
    return url;
  }
  
  /**
   * Check if artifact has a panel available
   */
  function hasPanel(artifact) {
    if (!artifact) return false;
    return panelResolver.has(artifact.type) || panelResolver.has(artifact.language);
  }
  
  /**
   * Register a custom panel at runtime
   * Also registers the panel's origin with the bridge for message verification
   * 
   * @param {string|string[]} typesOrLang - Type/language or array of types/languages
   * @param {string|object} panel - Panel path, full URL, or config object
   * 
   * @example
   * // Single type - relative path (uses cdnUrl)
   * sdk.registerPanel('chart', 'chart-panel');
   * 
   * // Single type - full URL
   * sdk.registerPanel('chart', 'https://charts.example.com/panel');
   * 
   * // Single type - with custom CDN
   * sdk.registerPanel('chart', { path: 'chart-panel', cdn: 'https://charts.example.com' });
   * 
   * // Multiple types/aliases at once
   * sdk.registerPanel(['python', 'py'], 'code-panel');
   * sdk.registerPanel(['javascript', 'js'], 'code-panel');
   */
  function registerPanel(typesOrLang, panel) {
    panelResolver.register(typesOrLang, panel);
  }
  
  /**
   * Unregister/disable a panel at runtime
   * 
   * @param {string|string[]} typesOrLang - Type/language or array of types/languages
   * 
   * @example
   * // Single type
   * sdk.unregisterPanel('canvas');
   * 
   * // Multiple types at once
   * sdk.unregisterPanel(['canvas', 'whiteboard', 'drawing']);
   */
  function unregisterPanel(typesOrLang) {
    panelResolver.unregister(typesOrLang);
  }
  
  /**
   * Get all available panel types
   */
  function getPanelTypes() {
    return panelResolver.getTypes();
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
    destroyAllPlayers();
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
    
    // Panel management (new)
    hasPanel,
    registerPanel,
    unregisterPanel,
    getPanelTypes,
    panelResolver, // Expose for advanced use
    
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
 * Handles circular references and special objects
 */
function mergeConfig(defaults, overrides, seen = new WeakSet()) {
  // Handle null/undefined
  if (!overrides) return defaults;
  if (!defaults) return overrides;
  
  // Prevent circular references
  if (typeof overrides === 'object' && overrides !== null) {
    if (seen.has(overrides)) {
      return overrides; // Return as-is to prevent infinite loop
    }
    seen.add(overrides);
  }
  
  const result = { ...defaults };
  
  for (const key in overrides) {
    const value = overrides[key];
    
    // Skip undefined
    if (value === undefined) continue;
    
    // Handle null - explicit null means "unset"
    if (value === null) {
      result[key] = null;
      continue;
    }
    
    // Handle arrays - replace, don't merge
    if (Array.isArray(value)) {
      result[key] = [...value];
      continue;
    }
    
    // Handle plain objects - recurse
    if (typeof value === 'object' && value.constructor === Object) {
      result[key] = mergeConfig(defaults[key] || {}, value, seen);
      continue;
    }
    
    // Handle primitives and special objects (Date, RegExp, Vue refs, etc.)
    result[key] = value;
  }
  
  return result;
}

// Export utilities
export { parseArtifacts, extractCodeBlockArtifacts, getIsInline as isInlineArtifact } from './detector.js';
export { createState } from './state.js';
export { createBridge } from './bridge.js';
export { createTheme } from './theme.js';
export * from './highlight.js';

// Export panel utilities
export { DEFAULT_PANELS };

// Default export
export default createArtifactuse;
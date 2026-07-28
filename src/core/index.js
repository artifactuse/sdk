// artifactuse/core/index.js
// Main entry point for Artifactuse SDK

import { parseArtifacts, extractCodeBlockArtifacts, getIsInline, getLanguageFromExtension, createArtifact, generateArtifactId, BINARY_EXT_LANGUAGE } from './detector.js';
import { createState } from './state.js';

// Binary categories render inside the panel component — no CDN panel URL needed.
const BINARY_PANEL_LANGS = new Set(Object.values(BINARY_EXT_LANGUAGE));
import { createBridge } from './bridge.js';
import { createTheme } from './theme.js';
import { createShareService } from './share.js';
import { createEditorManager } from './editor.js';
import { normalizeWidgetSizing } from './widgetSizing.js';
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
  csv: 'sheet-panel',
  tsv: 'sheet-panel',
  
  // Graphics
  svg: 'svg-panel',
  
  // Diff/patches
  diff: 'diff-panel',
  patch: 'diff-panel',
  smartdiff: 'diff-panel',
  
  // Plain text
  txt: 'code-panel',

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

  // Initial panel width as percentage (25-75)
  // Can be overridden per-component via props
  panelWidth: 65,

  // Initial split view position as percentage (20-80)
  // Can be overridden per-component via props
  splitPosition: 50,

  // Show "Open in new tab" button in panel header to open preview URL externally
  // Can be overridden per-artifact via openFile/openCode options or per-component via props
  externalPreview: false,

  // Show console panel footer for runtime logs/errors from HTML artifacts
  // When false, footer UI is hidden but console:log events still emit
  consolePanel: true,

  // Enable multi-tab mode (open multiple artifacts as tabs)
  multiTab: false,

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

  // Widget registry
  // Users can register trusted widget templates here or at runtime.
  //
  // Format:
  //   'template-id': {
  //     url: 'https://cdn.example.com/widgets/template/v1/index.html',
  //     propsSchema: { ... },
  //     actions: ['approve', 'reject'],
  //     permissions: ['state', 'actions'],
  //     defaultDisplay: 'panel'
  //   }
  widgets: {},
  
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

  // Sharing configuration
  sharing: {
    // Enable share/save functionality
    enabled: true,
    // API URL for share endpoints
    apiUrl: 'https://api.artifactuse.com',
    // App URL for auth popup (login/signup)
    appUrl: 'https://app.artifactuse.com',
    // localStorage key for auth data
    storageKey: 'artifactuse_auth',
    // Allow anonymous sharing (without account)
    allowAnonymous: true,
    // Days until anonymous shares expire
    expiryDays: 30,
  },
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
 * Extract origin URL from a widget registry entry.
 */
function extractOriginFromWidgetConfig(widgetConfig) {
  if (!widgetConfig) return null;

  try {
    const url = typeof widgetConfig === 'string' ? widgetConfig : widgetConfig.url;
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      return new URL(url).origin;
    }
  } catch (error) {
    console.warn('Artifactuse: Failed to extract origin from widget config:', error);
  }

  return null;
}

/**
 * Collect all unique origins from widget registry entries.
 */
function collectOriginsFromWidgets(widgets = {}) {
  const origins = new Set();

  for (const widgetConfig of Object.values(widgets || {})) {
    const origin = extractOriginFromWidgetConfig(widgetConfig);
    if (origin) origins.add(origin);
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
 * Create widget registry from config.
 */
function createWidgetRegistry(config, bridge) {
  const widgets = { ...(config.widgets || {}) };

  function normalizeId(id) {
    return id?.toString?.().trim().toLowerCase();
  }

  function normalizeEntry(id, entry) {
    if (!entry) return null;
    const normalized = typeof entry === 'string'
      ? { id, url: entry }
      : (typeof entry === 'object' ? { id, ...entry } : null);

    if (!normalized) return null;

    return {
      ...normalized,
      sizing: normalizeWidgetSizing(normalized),
    };
  }

  function get(template) {
    const key = normalizeId(template);
    return key ? normalizeEntry(key, widgets[key]) : null;
  }

  function has(template) {
    const key = normalizeId(template);
    return !!(key && widgets[key]);
  }

  function register(template, entry) {
    const key = normalizeId(template);
    if (!key || !entry) return;

    widgets[key] = normalizeEntry(key, entry);

    const origin = extractOriginFromWidgetConfig(widgets[key]);
    if (origin && bridge) {
      bridge.addAllowedOrigin(origin);
    }
  }

  function unregister(template) {
    const key = normalizeId(template);
    if (key) delete widgets[key];
  }

  function resolve(template) {
    const entry = get(template);
    return entry?.url || null;
  }

  function getTypes() {
    return Object.keys(widgets).filter(key => !!widgets[key]);
  }

  function validateProps(props, schema) {
    if (!schema || typeof schema !== 'object') {
      return { valid: true, errors: [] };
    }

    const errors = [];
    const value = props || {};

    if (schema.type && schema.type !== 'object') {
      errors.push('Widget props schema must be an object schema');
    }

    if (Array.isArray(schema.required)) {
      schema.required.forEach(key => {
        if (value[key] === undefined || value[key] === null) {
          errors.push(`Missing required prop: ${key}`);
        }
      });
    }

    if (schema.properties && typeof schema.properties === 'object') {
      Object.entries(schema.properties).forEach(([key, propSchema]) => {
        if (value[key] === undefined || value[key] === null || !propSchema?.type) return;
        const expected = propSchema.type;
        const actual = Array.isArray(value[key]) ? 'array' : typeof value[key];
        if (expected !== actual) {
          errors.push(`Invalid prop type for ${key}: expected ${expected}, received ${actual}`);
        }
      });
    }

    return { valid: errors.length === 0, errors };
  }

  function validateArtifact(artifact) {
    if (!artifact || artifact.type !== 'widget') {
      return { valid: true, errors: [], entry: null };
    }

    const errors = [];
    const template = normalizeId(artifact.template);
    const entry = get(template);

    if (!template) errors.push('Widget artifact is missing template');
    if (template && !entry) errors.push(`Unknown widget template: ${template}`);

    if (entry) {
      const propsValidation = validateProps(artifact.props, entry.propsSchema);
      errors.push(...propsValidation.errors);

      if (Array.isArray(artifact.actions) && Array.isArray(entry.actions)) {
        artifact.actions.forEach(action => {
          const actionId = typeof action === 'string' ? action : action?.id;
          if (actionId && !entry.actions.includes(actionId)) {
            errors.push(`Action is not registered for widget ${template}: ${actionId}`);
          }
        });
      }

      if (Array.isArray(artifact.permissions) && Array.isArray(entry.permissions)) {
        artifact.permissions.forEach(permission => {
          if (!entry.permissions.includes(permission)) {
            errors.push(`Permission is not registered for widget ${template}: ${permission}`);
          }
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      entry,
    };
  }

  return {
    get,
    has,
    register,
    unregister,
    resolve,
    getTypes,
    validateArtifact,
    get widgets() { return { ...widgets }; },
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
  const initialOrigins = [
    ...collectOriginsFromPanels(allPanels, config.cdnUrl),
    ...collectOriginsFromWidgets(config.widgets),
  ];
  
  // Create bridge with all known origins
  const bridge = createBridge(initialOrigins);
  
  // Create theme - only pass colors if user provided them
  const theme = createTheme(config.theme, config.colors || {});
  
  // Create panel resolver (pass bridge for runtime origin registration)
  const panelResolver = createPanelResolver(config, bridge);

  // Create widget registry
  const widgetRegistry = createWidgetRegistry(config, bridge);

  // Create share service
  const share = createShareService(config.sharing);

  // Create editor manager (CodeMirror integration — optional)
  const editor = createEditorManager(config.editor);

  /**
   * Process AI agent message content
   * Returns processed HTML with artifact placeholders
   */
  function processMessage(content, messageId, overrides = {}) {
    // First, convert markdown to HTML
    let html = marked.parse(content);

    const artifacts = [];

    // Get current resolved theme for processors that need it
    const processorOptions = { theme: theme.resolved };

    // Merge overrides with global config (component prop → global config → default)
    const inlinePreview = overrides.inlinePreview ?? config.inlinePreview ?? null;
    const inlineCode = overrides.inlineCode ?? config.inlineCode ?? null;
    const tabs = overrides.tabs ?? config.tabs ?? null;
    const viewMode = overrides.viewMode ?? config.viewMode ?? null;

    function prepareArtifact(artifact) {
      if (artifact.type !== 'widget') return;

      const validation = widgetRegistry.validateArtifact(artifact);
      artifact.widget = validation.entry || null;
      artifact.validation = {
        valid: validation.valid,
        errors: validation.errors,
      };
      artifact.isInline = true;
      artifact.isPanelArtifact = false;
    }

    // Extract all code block artifacts (code, form, social)
    if (config.processors.codeBlocks) {
      const result = extractCodeBlockArtifacts(html, messageId, {
        ...config.codeExtraction,
        inlinePreview,
        inlineCode,
        tabs,
        viewMode,
        prepareArtifact,
      });
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
      prepareArtifact(artifact);

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

      // Post-process smartdiff inline previews:
      // Prism highlighted the code with the actual language grammar.
      // Now wrap each line in .token.deleted / .token.inserted based on markers.
      const el = container === document ? document : container;
      const smartdiffPreviews = el.querySelectorAll('.artifactuse-inline-preview[data-smartdiff]');
      smartdiffPreviews.forEach(preview => {
        const codeEl = preview.querySelector('code');
        if (!codeEl || codeEl.dataset.smartdiffProcessed) return;
        const markers = preview.dataset.smartdiffMarkers?.split(',') || [];
        const lines = codeEl.innerHTML.split('\n');
        codeEl.innerHTML = lines.map((line, i) => {
          const marker = markers[i];
          if (marker === '-') return `<span class="token deleted">${line}</span>`;
          if (marker === '+') return `<span class="token inserted">${line}</span>`;
          return line;
        }).join('\n');
        codeEl.dataset.smartdiffProcessed = 'true';
      });
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
    
    if (config.multiTab) {
      state.openTab(artifact.id);
    } else {
      state.setActiveArtifact(artifact.id);
    }

    state.setForceEmptyView(false);
    state.setPanelOpen(true);
    if (artifact.viewMode) {
      state.setViewMode(artifact.viewMode);
    }

    emit('artifact:opened', artifact);
  }

  /**
   * Open a file by name — auto-detects language from extension
   */
  function openFile(filename, code, options = {}) {
    const ext = filename.split('.').pop().toLowerCase();
    const language = options.language || getLanguageFromExtension(ext) || ext;
    const title = options.title || filename;

    // Deduplicate: if an artifact with the same title already exists, update + focus it
    const existing = state.getState().artifacts.find(a => a.title === title && !a.isInline);
    if (existing) {
      updateFile(existing.id, code, { ...options, title });
      openArtifact(existing);
      if (options.viewMode) state.setViewMode(options.viewMode);
      else if (options.tabs) state.setViewMode(options.tabs[0]);
      return state.getArtifact(existing.id);
    }

    return openCode(code, language, { ...options, title, fileExtension: ext });
  }

  /**
   * Open code with explicit language
   */
  function openCode(code, language, options = {}) {
    const msgId = options.messageId || generateArtifactId('open');
    const resolvedLang = (hasPanel({ type: language, language }) || BINARY_PANEL_LANGS.has(language)) ? language : 'txt';
    const artifact = createArtifact(code, resolvedLang, msgId, 0);
    artifact.title = options.title || artifact.title;
    artifact.isInline = false;
    artifact.editorLanguage = language;
    if (options.fileExtension) artifact.fileExtension = options.fileExtension;
    if (options.tabs) artifact.tabs = options.tabs;
    if (options.panelUrl) artifact.panelUrl = options.panelUrl;
    if (options.externalPreview !== undefined) artifact.externalPreview = options.externalPreview;
    state.addArtifact(artifact);
    openArtifact(artifact);
    if (options.viewMode) state.setViewMode(options.viewMode);
    else if (options.tabs) state.setViewMode(options.tabs[0]);
    return artifact;
  }

  /**
   * Update an existing artifact's code and refresh the panel
   */
  function updateFile(artifactOrId, code, options = {}) {
    const id = typeof artifactOrId === 'string' ? artifactOrId : artifactOrId?.id;
    const existing = state.getArtifact(id);
    if (!existing) return null;

    const updates = { ...existing, code, _refreshToken: Date.now() };
    if (options.title !== undefined) updates.title = options.title;
    if (options.tabs !== undefined) updates.tabs = options.tabs;
    if (options.panelUrl !== undefined) updates.panelUrl = options.panelUrl;
    if (options.externalPreview !== undefined) updates.externalPreview = options.externalPreview;

    state.addArtifact(updates);
    emit('artifact:updated', { artifactId: id, artifact: state.getArtifact(id) });
    return state.getArtifact(id);
  }

  /**
   * Open panel in empty state
   */
  function openPanel() {
    state.clearActiveArtifact();
    state.setForceEmptyView(true);
    state.setPanelOpen(true);

    emit('panel:opened');
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

    // Opening with nothing selected: land on the most recent artifact rather
    // than an empty panel (there is no list view to fall back to).
    if (isOpen && !state.getState().activeArtifactId) {
      const openable = state.getState().artifacts.filter(a => !a.isInline);
      const mostRecent = openable[openable.length - 1];

      if (mostRecent) {
        openArtifact(mostRecent);
      } else {
        state.setForceEmptyView(true);
      }
    }

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
    if (artifact.type === 'widget') return null;

    // Custom panel URL takes priority over registry lookup
    if (artifact.panelUrl) return artifact.panelUrl;

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
    if (artifact.type === 'widget') return false;
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
   * Register a trusted widget template at runtime.
   */
  function registerWidget(template, widget) {
    widgetRegistry.register(template, widget);
  }

  /**
   * Unregister a widget template at runtime.
   */
  function unregisterWidget(template) {
    widgetRegistry.unregister(template);
  }

  /**
   * Get all registered widget templates.
   */
  function getWidgetTypes() {
    return widgetRegistry.getTypes();
  }

  /**
   * Check if a widget template is registered.
   */
  function hasWidget(template) {
    return widgetRegistry.has(template);
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
  bridge.on('widget:action', (data) => emit('widget:action', data));
  bridge.on('widget:state', (data) => emit('widget:state', data));
  bridge.on('widget:height', (data) => emit('widget:height', data));
  bridge.on('widget:followup', (data) => emit('widget:followup', data));
  bridge.on('social:copy', (data) => emit('social:copy', data));
  bridge.on('edit:save', (data) => {
    if (data?.artifactId && data?.code !== undefined) {
      updateFile(data.artifactId, data.code);
    }
    emit('edit:save', data);
  });
  bridge.on('console:log', (data) => {
    const artifactId = state.getState().activeArtifactId;
    emit('console:log', { artifactId, ...data });
  });

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
    openFile,
    openCode,
    updateFile,
    openPanel,
    closePanel,
    togglePanel,
    toggleFullscreen,
    setViewMode,
    getPanelUrl,
    sendToPanel,
    
    // Multi-tab
    closeTab: (artifactId) => state.closeTab(artifactId),
    closeOtherTabs: (artifactId) => state.closeOtherTabs(artifactId),
    closeAllTabs: () => state.closeAllTabs(),

    // Panel management (new)
    hasPanel,
    registerPanel,
    unregisterPanel,
    getPanelTypes,
    panelResolver, // Expose for advanced use

    // Widget management
    hasWidget,
    registerWidget,
    unregisterWidget,
    getWidgetTypes,
    widgetRegistry,
    
    // Theme
    theme,
    applyTheme,
    setTheme,
    getTheme,
    
    // Events
    on,
    off,
    emit,
    
    // Editor (CodeMirror integration)
    editor,

    // Bridge (for advanced use)
    bridge,

    // Sharing
    share,

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
export { manifestToWidgetRegistryEntry } from './widgetManifest.js';
export { createWidgetRegistryFromHostedManifest, fetchHostedWidgetRegistry } from './hostedWidgets.js';
export * from './highlight.js';
export { createEditorManager } from './editor.js';

// Export panel utilities
export { DEFAULT_PANELS };

// Default export
export default createArtifactuse;

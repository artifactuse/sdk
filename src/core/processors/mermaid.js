// processors/mermaid.js
// Handles Mermaid diagram rendering

// Track loading state to prevent duplicate loads
let mermaidLoadingPromise = null;
let mermaidLoadFailed = false;
let mermaidInitialized = false;

/**
 * Process mermaid code blocks in HTML
 */
export function processMermaid(html) {
  // Match code blocks with language mermaid
  const mermaidCodeBlockRegex = /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/gi;
  
  html = html.replace(mermaidCodeBlockRegex, (match, content) => {
    // Decode HTML entities
    const diagram = decodeHtmlEntities(content).trim();
    return createMermaidBlock(diagram);
  });
  
  return html;
}

/**
 * Decode HTML entities in mermaid content
 */
function decodeHtmlEntities(text) {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

/**
 * Create mermaid diagram placeholder
 */
export function createMermaidBlock(diagram) {
  const escapedDiagram = escapeForAttribute(diagram);
  const uniqueId = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  return `
    <div class="artifactuse-mermaid-container" data-mermaid-id="${uniqueId}" data-mermaid-diagram="${escapedDiagram}">
      <div class="artifactuse-mermaid-loading">Loading diagram...</div>
    </div>
  `;
}

/**
 * Escape content for use in HTML attribute
 */
function escapeForAttribute(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Unescape content from HTML attribute
 */
function unescapeFromAttribute(text) {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

/**
 * Initialize Mermaid rendering (call after DOM is ready)
 */
export function initializeMermaid(config = {}) {
  // Check if Mermaid is available
  if (typeof mermaid === 'undefined') {
    if (mermaidLoadFailed) {
      console.warn('Mermaid loading previously failed. Diagram rendering disabled.');
      return Promise.resolve();
    }
    
    console.debug('Mermaid library not loaded. Attempting to load...');
    
    return loadMermaid()
      .then(() => {
        console.log('Mermaid loaded, rendering diagrams...');
        initMermaidConfig(config);
        return renderAllMermaid();
      })
      .catch((error) => {
        console.error('Failed to load Mermaid library:', error);
        mermaidLoadFailed = true;
        showMermaidFallback();
      });
  }
  
  if (!mermaidInitialized) {
    initMermaidConfig(config);
  }
  
  return renderAllMermaid();
}

/**
 * Initialize Mermaid configuration
 */
function initMermaidConfig(config = {}) {
  if (typeof mermaid === 'undefined') return;
  
  const defaultConfig = {
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    flowchart: {
      useMaxWidth: true,
      htmlLabels: true,
      curve: 'basis',
    },
    sequence: {
      useMaxWidth: true,
      diagramMarginX: 50,
      diagramMarginY: 10,
    },
    gantt: {
      useMaxWidth: true,
    },
    ...config,
  };
  
  mermaid.initialize(defaultConfig);
  mermaidInitialized = true;
}

/**
 * Render all mermaid containers
 */
async function renderAllMermaid() {
  if (typeof mermaid === 'undefined') {
    console.warn('renderAllMermaid called but Mermaid is not available');
    return;
  }
  
  const containers = document.querySelectorAll('.artifactuse-mermaid-container');
  
  for (const container of containers) {
    if (container.dataset.rendered === 'true') continue;
    
    const diagram = unescapeFromAttribute(container.dataset.mermaidDiagram);
    const id = container.dataset.mermaidId;
    
    try {
      // Validate the diagram syntax first
      const isValid = await mermaid.parse(diagram);
      
      if (isValid) {
        const { svg } = await mermaid.render(id, diagram);
        container.innerHTML = svg;
        container.classList.add('artifactuse-mermaid-rendered');
        container.dataset.rendered = 'true';
      }
    } catch (error) {
      console.error('Mermaid rendering error:', error);
      container.innerHTML = `
        <div class="artifactuse-mermaid-error">
          <div class="artifactuse-mermaid-error-title">Diagram Error</div>
          <pre class="artifactuse-mermaid-error-message">${escapeHtml(error.message || 'Invalid diagram syntax')}</pre>
          <details class="artifactuse-mermaid-error-details">
            <summary>View source</summary>
            <pre>${escapeHtml(diagram)}</pre>
          </details>
        </div>
      `;
      container.dataset.rendered = 'true';
      container.classList.add('artifactuse-mermaid-error-container');
    }
  }
}

/**
 * Show fallback content for mermaid containers when library fails to load
 */
function showMermaidFallback() {
  document.querySelectorAll('.artifactuse-mermaid-container').forEach(container => {
    if (container.dataset.rendered === 'true') return;
    
    const diagram = unescapeFromAttribute(container.dataset.mermaidDiagram);
    container.innerHTML = `
      <div class="artifactuse-mermaid-fallback">
        <div class="artifactuse-mermaid-fallback-title">Mermaid Diagram</div>
        <pre class="artifactuse-mermaid-fallback-source">${escapeHtml(diagram)}</pre>
      </div>
    `;
    container.dataset.rendered = 'true';
    container.classList.add('artifactuse-mermaid-fallback-container');
  });
}

/**
 * Escape HTML for safe display
 */
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Dynamically load Mermaid library
 */
export function loadMermaid() {
  // Return existing promise if already loading
  if (mermaidLoadingPromise) {
    return mermaidLoadingPromise;
  }
  
  // Check if already loaded
  if (typeof mermaid !== 'undefined') {
    return Promise.resolve();
  }
  
  mermaidLoadingPromise = new Promise((resolve, reject) => {
    // Set a timeout for the loading process
    const loadTimeout = setTimeout(() => {
      mermaidLoadingPromise = null;
      reject(new Error('Mermaid loading timed out after 15 seconds'));
    }, 15000);
    
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
    script.crossOrigin = 'anonymous';
    
    script.onload = () => {
      clearTimeout(loadTimeout);
      console.log('Mermaid script loaded successfully');
      resolve();
    };
    
    script.onerror = (event) => {
      clearTimeout(loadTimeout);
      mermaidLoadingPromise = null;
      console.error('Mermaid script failed to load:', event);
      reject(new Error('Failed to load Mermaid script from CDN'));
    };
    
    document.head.appendChild(script);
  });
  
  return mermaidLoadingPromise;
}

/**
 * Reset the Mermaid loading state (useful for testing)
 */
export function resetMermaidLoadState() {
  mermaidLoadingPromise = null;
  mermaidLoadFailed = false;
  mermaidInitialized = false;
}

/**
 * Check if Mermaid is currently available
 */
export function isMermaidAvailable() {
  return typeof mermaid !== 'undefined';
}

/**
 * Check if Mermaid loading has failed
 */
export function hasMermaidLoadFailed() {
  return mermaidLoadFailed;
}

/**
 * Process and render mermaid in a specific element
 */
export function processMermaidInElement(element, config = {}) {
  if (!element) return Promise.resolve();
  
  // Get HTML content
  let html = element.innerHTML;
  
  // Process mermaid
  html = processMermaid(html);
  
  // Update element
  element.innerHTML = html;
  
  // Initialize rendering
  return initializeMermaid(config);
}

/**
 * Re-render a specific mermaid container
 */
export async function rerenderMermaid(containerId) {
  const container = document.querySelector(`[data-mermaid-id="${containerId}"]`);
  if (!container) return;
  
  // Reset rendered state
  container.dataset.rendered = 'false';
  container.innerHTML = '<div class="artifactuse-mermaid-loading">Loading diagram...</div>';
  
  // Re-render
  await renderAllMermaid();
}

/**
 * Update diagram content and re-render
 */
export async function updateMermaidDiagram(containerId, newDiagram) {
  const container = document.querySelector(`[data-mermaid-id="${containerId}"]`);
  if (!container) return;
  
  // Update the diagram data
  container.dataset.mermaidDiagram = escapeForAttribute(newDiagram);
  container.dataset.rendered = 'false';
  container.innerHTML = '<div class="artifactuse-mermaid-loading">Loading diagram...</div>';
  
  // Re-render
  await renderAllMermaid();
}

export default {
  processMermaid,
  createMermaidBlock,
  initializeMermaid,
  loadMermaid,
  resetMermaidLoadState,
  isMermaidAvailable,
  hasMermaidLoadFailed,
  processMermaidInElement,
  rerenderMermaid,
  updateMermaidDiagram,
};
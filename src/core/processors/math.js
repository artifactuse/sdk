// processors/math.js
// Handles LaTeX/KaTeX math equation rendering

// Track loading state to prevent duplicate loads
let katexLoadingPromise = null;
let katexLoadFailed = false;

/**
 * Process all math expressions in HTML
 * Supports:
 * - Display math: $$ ... $$ or \[ ... \]
 * - Inline math: $ ... $ or \( ... \)
 * - Code blocks with language "math" or "latex"
 */
export function processMath(html) {
  // Process code blocks with math/latex language first
  html = processMathCodeBlocks(html);
  
  // Process display math: $$ ... $$
  html = html.replace(/\$\$([\s\S]*?)\$\$/g, (match, tex) => {
    return createMathBlock(tex.trim(), true);
  });
  
  // Process display math: \[ ... \]
  html = html.replace(/\\\[([\s\S]*?)\\\]/g, (match, tex) => {
    return createMathBlock(tex.trim(), true);
  });
  
  // Process inline math: $ ... $ (but not $$ or escaped \$)
  // Use negative lookbehind/lookahead to avoid matching $$
  html = html.replace(/(?<!\$)\$(?!\$)((?:[^$\\]|\\.)+?)\$(?!\$)/g, (match, tex) => {
    return createMathBlock(tex.trim(), false);
  });
  
  // Process inline math: \( ... \)
  html = html.replace(/\\\(([\s\S]*?)\\\)/g, (match, tex) => {
    return createMathBlock(tex.trim(), false);
  });
  
  return html;
}

/**
 * Process code blocks marked as math or latex
 */
function processMathCodeBlocks(html) {
  const mathCodeBlockRegex = /<pre><code class="language-(math|latex)">([\s\S]*?)<\/code><\/pre>/gi;
  
  html = html.replace(mathCodeBlockRegex, (match, lang, content) => {
    const tex = decodeHtmlEntities(content).trim();
    return createMathBlock(tex, true);
  });
  
  return html;
}

/**
 * Decode HTML entities in math content
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
 * Create math block HTML with KaTeX rendering
 */
export function createMathBlock(tex, isDisplay = false) {
  const escapedTex = escapeForAttribute(tex);
  const displayClass = isDisplay ? 'artifactuse-math-display' : 'artifactuse-math-inline';
  const displayMode = isDisplay ? 'true' : 'false';
  
  return `<span class="artifactuse-math-container ${displayClass}" data-tex="${escapedTex}" data-display="${displayMode}"></span>`;
}

/**
 * Escape TeX for use in HTML attribute
 */
function escapeForAttribute(tex) {
  return tex
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Unescape TeX from HTML attribute
 */
function unescapeFromAttribute(tex) {
  return tex
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

/**
 * Initialize KaTeX rendering (call after DOM is ready)
 * Requires KaTeX library to be loaded
 */
export function initializeMath() {
  if (typeof katex === 'undefined') {
    if (katexLoadFailed) {
      console.warn('KaTeX loading previously failed. Math rendering disabled.');
      return Promise.resolve();
    }
    
    console.debug('KaTeX library not loaded. Attempting to load...');
    
    return loadKaTeX()
      .then(() => {
        console.log('KaTeX loaded, rendering math...');
        renderAllMath();
      })
      .catch((error) => {
        console.error('Failed to load KaTeX library:', error);
        katexLoadFailed = true;
        showMathFallback();
      });
  }
  
  renderAllMath();
  return Promise.resolve();
}

/**
 * Show fallback content for math containers when KaTeX fails to load
 */
function showMathFallback() {
  document.querySelectorAll('.artifactuse-math-container').forEach(container => {
    if (container.dataset.rendered === 'true') return;
    
    const tex = unescapeFromAttribute(container.dataset.tex);
    container.innerHTML = `<code class="artifactuse-math-fallback" title="Math rendering unavailable">${escapeHtml(tex)}</code>`;
    container.dataset.rendered = 'true';
    container.classList.add('artifactuse-math-fallback-container');
  });
}

/**
 * Render all math containers
 */
function renderAllMath() {
  if (typeof katex === 'undefined') {
    console.warn('renderAllMath called but KaTeX is not available');
    return;
  }
  
  document.querySelectorAll('.artifactuse-math-container').forEach(container => {
    if (container.dataset.rendered === 'true') return;
    
    const tex = unescapeFromAttribute(container.dataset.tex);
    const displayMode = container.dataset.display === 'true';
    
    try {
      katex.render(tex, container, {
        displayMode: displayMode,
        throwOnError: false,
        errorColor: '#dc2626',
        trust: true,
        strict: false,
        macros: {
          // Common macros
          '\\R': '\\mathbb{R}',
          '\\N': '\\mathbb{N}',
          '\\Z': '\\mathbb{Z}',
          '\\Q': '\\mathbb{Q}',
          '\\C': '\\mathbb{C}',
          '\\vec': '\\mathbf',
          '\\norm': '\\left\\|#1\\right\\|',
          '\\abs': '\\left|#1\\right|',
        },
      });
      container.dataset.rendered = 'true';
    } catch (error) {
      console.error('KaTeX rendering error:', error);
      container.innerHTML = `<span class="artifactuse-math-error" title="${escapeHtml(error.message)}">${escapeHtml(tex)}</span>`;
      container.dataset.rendered = 'true';
    }
  });
}

/**
 * Escape HTML for display
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
 * Dynamically load KaTeX library
 */
export function loadKaTeX() {
  // Return existing promise if already loading
  if (katexLoadingPromise) {
    return katexLoadingPromise;
  }
  
  // Check if already loaded
  if (typeof katex !== 'undefined') {
    return Promise.resolve();
  }
  
  katexLoadingPromise = new Promise((resolve, reject) => {
    // Set a timeout for the entire loading process
    const loadTimeout = setTimeout(() => {
      katexLoadingPromise = null;
      reject(new Error('KaTeX loading timed out after 10 seconds'));
    }, 10000);
    
    // Load CSS first
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css';
    cssLink.crossOrigin = 'anonymous';
    
    // Handle CSS load errors gracefully
    cssLink.onerror = () => {
      console.warn('KaTeX CSS failed to load, math may not render correctly');
    };
    
    document.head.appendChild(cssLink);
    
    // Load JS
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js';
    script.crossOrigin = 'anonymous';
    
    script.onload = () => {
      clearTimeout(loadTimeout);
      console.log('KaTeX script loaded successfully');
      resolve();
    };
    
    script.onerror = (event) => {
      clearTimeout(loadTimeout);
      katexLoadingPromise = null;
      console.error('KaTeX script failed to load:', event);
      reject(new Error('Failed to load KaTeX script from CDN'));
    };
    
    document.head.appendChild(script);
  });
  
  return katexLoadingPromise;
}

/**
 * Reset the KaTeX loading state (useful for testing)
 */
export function resetKaTeXLoadState() {
  katexLoadingPromise = null;
  katexLoadFailed = false;
}

/**
 * Check if KaTeX is currently available
 */
export function isKaTeXAvailable() {
  return typeof katex !== 'undefined';
}

/**
 * Check if KaTeX loading has failed
 */
export function hasKaTeXLoadFailed() {
  return katexLoadFailed;
}

/**
 * Process and render math in a specific element
 */
export function processMathInElement(element) {
  if (!element) return Promise.resolve();
  
  // Get HTML content
  let html = element.innerHTML;
  
  // Process math
  html = processMath(html);
  
  // Update element
  element.innerHTML = html;
  
  // Initialize rendering
  return initializeMath();
}

/**
 * Common math expressions helper
 */
export const mathPatterns = {
  // Fractions
  fraction: (num, den) => `\\frac{${num}}{${den}}`,
  
  // Square root
  sqrt: (expr, n = null) => n ? `\\sqrt[${n}]{${expr}}` : `\\sqrt{${expr}}`,
  
  // Exponents and subscripts
  power: (base, exp) => `${base}^{${exp}}`,
  subscript: (base, sub) => `${base}_{${sub}}`,
  
  // Greek letters (common ones)
  alpha: '\\alpha',
  beta: '\\beta',
  gamma: '\\gamma',
  delta: '\\delta',
  theta: '\\theta',
  lambda: '\\lambda',
  pi: '\\pi',
  sigma: '\\sigma',
  omega: '\\omega',
  
  // Operators
  sum: (lower, upper, expr) => `\\sum_{${lower}}^{${upper}} ${expr}`,
  product: (lower, upper, expr) => `\\prod_{${lower}}^{${upper}} ${expr}`,
  integral: (lower, upper, expr) => `\\int_{${lower}}^{${upper}} ${expr}`,
  limit: (variable, to, expr) => `\\lim_{${variable} \\to ${to}} ${expr}`,
  
  // Matrices
  matrix: (rows) => `\\begin{pmatrix} ${rows.map(r => r.join(' & ')).join(' \\\\ ')} \\end{pmatrix}`,
  determinant: (rows) => `\\begin{vmatrix} ${rows.map(r => r.join(' & ')).join(' \\\\ ')} \\end{vmatrix}`,
  
  // Common equations
  quadratic: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
  pythagorean: 'a^2 + b^2 = c^2',
  euler: 'e^{i\\pi} + 1 = 0',
  derivative: (f, x) => `\\frac{d${f}}{d${x}}`,
  partialDerivative: (f, x) => `\\frac{\\partial ${f}}{\\partial ${x}}`,
};

export default {
  processMath,
  createMathBlock,
  initializeMath,
  loadKaTeX,
  resetKaTeXLoadState,
  isKaTeXAvailable,
  hasKaTeXLoadFailed,
  processMathInElement,
  mathPatterns,
};
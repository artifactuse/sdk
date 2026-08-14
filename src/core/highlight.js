// artifactuse/core/highlight.js
// Optional Prism.js integration for syntax highlighting
// Users must provide Prism.js themselves

/**
 * Check if Prism is available
 */
export function isPrismAvailable() {
  return typeof window !== 'undefined' && window.Prism;
}

/**
 * Parse a computed CSS color into [r, g, b], or null if it isn't opaque.
 * getComputedStyle always returns rgb()/rgba(), never hex or named colors.
 */
function parseComputedRgb(value) {
  if (!value) return null;

  const match = value.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)\s*(?:[,/]\s*([\d.]+)\s*)?\)$/);
  if (!match) return null;

  // Fully transparent means Prism's stylesheet isn't styling this element
  const alpha = match[4] === undefined ? 1 : parseFloat(match[4]);
  if (alpha === 0) return null;

  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/**
 * Perceived brightness (ITU-R BT.601). Used to decide whether the host's
 * Prism theme is light or dark, so chrome layered on top can adapt.
 */
function isLightColor([r, g, b]) {
  return (0.299 * r + 0.587 * g + 0.114 * b) > 128;
}

/**
 * Publish the host's actual Prism theme colors as CSS variables.
 *
 * The code block's background and text come from whichever Prism stylesheet
 * the host loaded, which does not change when the SDK theme changes. Anything
 * layered on a code block — the inline preview's fade, its action chip, the
 * smartdiff line tints — has to match Prism rather than the SDK theme, so we
 * measure Prism at runtime and let CSS key off the result.
 *
 * Sets on <html>:
 *   --artifactuse-code-bg / --artifactuse-code-fg
 *   data-artifactuse-code-scheme="light" | "dark"
 *
 * @param {object} options
 * @param {string} options.sdkTheme - Resolved SDK theme, used only as the
 *   scheme fallback when Prism isn't present
 * @returns {boolean} true if colors were measured from Prism
 */
export function syncPrismColors(options = {}) {
  if (typeof document === 'undefined' || !document.documentElement) return false;

  const root = document.documentElement;
  const pre = document.querySelector('pre[class*="language-"]');
  const styles = pre && typeof window !== 'undefined' && window.getComputedStyle
    ? window.getComputedStyle(pre)
    : null;
  const bg = styles ? parseComputedRgb(styles.backgroundColor) : null;

  if (!bg) {
    // No Prism (or its CSS hasn't loaded). Remove the variables rather than
    // writing a fallback, so the CSS falls through to the SDK theme tokens and
    // stays live when the SDK theme changes.
    root.style.removeProperty('--artifactuse-code-bg');
    root.style.removeProperty('--artifactuse-code-fg');
    root.setAttribute('data-artifactuse-code-scheme', options.sdkTheme === 'light' ? 'light' : 'dark');
    return false;
  }

  root.style.setProperty('--artifactuse-code-bg', `rgb(${bg[0]}, ${bg[1]}, ${bg[2]})`);

  const fg = parseComputedRgb(styles.color);
  if (fg) {
    root.style.setProperty('--artifactuse-code-fg', `rgb(${fg[0]}, ${fg[1]}, ${fg[2]})`);
  } else {
    root.style.removeProperty('--artifactuse-code-fg');
  }

  root.setAttribute('data-artifactuse-code-scheme', isLightColor(bg) ? 'light' : 'dark');
  return true;
}

/**
 * Highlight all code blocks in a container
 * @param {HTMLElement|string} container - Container element or selector
 */
export function highlightAll(container) {
  if (!isPrismAvailable()) {
    console.warn('Artifactuse: Prism.js not found. Install and include Prism.js for syntax highlighting.');
    return;
  }
  
  const element = typeof container === 'string' 
    ? document.querySelector(container) 
    : container;
  
  if (!element) return;
  
  // Find all code blocks
  const codeBlocks = element.querySelectorAll('pre code');
  
  codeBlocks.forEach(block => {
    // Skip if already highlighted
    if (block.classList.contains('prism-highlighted')) return;
    
    // Detect language from class
    const language = detectLanguage(block);
    
    if (language) {
      // Add language class if not present
      if (!block.className.includes(`language-${language}`)) {
        block.classList.add(`language-${language}`);
      }
      
      // Highlight
      window.Prism.highlightElement(block);
      block.classList.add('prism-highlighted');
    }
  });
}

/**
 * Highlight a single code block
 * @param {HTMLElement} element - Code element to highlight
 * @param {string} language - Language identifier
 */
export function highlightElement(element, language) {
  if (!isPrismAvailable()) return;
  
  if (language && !element.className.includes(`language-${language}`)) {
    element.classList.add(`language-${language}`);
  }
  
  window.Prism.highlightElement(element);
  element.classList.add('prism-highlighted');
}

/**
 * Highlight code string and return HTML
 * @param {string} code - Code to highlight
 * @param {string} language - Language identifier
 * @returns {string} - Highlighted HTML
 */
export function highlightCode(code, language) {
  if (!isPrismAvailable()) return escapeHtml(code);
  
  const grammar = window.Prism.languages[language];
  
  if (!grammar) {
    return escapeHtml(code);
  }
  
  return window.Prism.highlight(code, grammar, language);
}

/**
 * Detect language from element classes
 * @param {HTMLElement} element - Code element
 * @returns {string|null} - Detected language or null
 */
export function detectLanguage(element) {
  // Check element classes
  const classes = element.className.split(/\s+/);
  
  for (const cls of classes) {
    // Match language-xxx or lang-xxx
    const match = cls.match(/^(?:language-|lang-)(.+)$/);
    if (match) {
      return normalizeLanguage(match[1]);
    }
  }
  
  // Check parent <pre> classes
  const pre = element.closest('pre');
  if (pre) {
    const preClasses = pre.className.split(/\s+/);
    for (const cls of preClasses) {
      const match = cls.match(/^(?:language-|lang-)(.+)$/);
      if (match) {
        return normalizeLanguage(match[1]);
      }
    }
  }
  
  // Check data-language attribute
  const dataLang = element.dataset.language || pre?.dataset.language;
  if (dataLang) {
    return normalizeLanguage(dataLang);
  }
  
  return null;
}

/**
 * Normalize language identifier to Prism-compatible name
 */
export function normalizeLanguage(lang) {
  const aliases = {
    'js': 'javascript',
    'ts': 'typescript',
    'py': 'python',
    'rb': 'ruby',
    'sh': 'bash',
    'shell': 'bash',
    'zsh': 'bash',
    'yml': 'yaml',
    'md': 'markdown',
    'html': 'markup',
    'xml': 'markup',
    'svg': 'markup',
    'vue': 'markup',
    'jsx': 'jsx',
    'tsx': 'tsx',
    'c++': 'cpp',
    'c#': 'csharp',
    'cs': 'csharp',
    'f#': 'fsharp',
    'objective-c': 'objectivec',
    'objc': 'objectivec',
  };
  
  const normalized = lang.toLowerCase();
  return aliases[normalized] || normalized;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Create a mutation observer to auto-highlight new code blocks
 * @param {HTMLElement} container - Container to observe
 * @returns {MutationObserver} - Observer instance
 */
export function createAutoHighlighter(container) {
  if (!isPrismAvailable()) {
    console.warn('Artifactuse: Prism.js not found. Auto-highlighting disabled.');
    return null;
  }
  
  const observer = new MutationObserver((mutations) => {
    let shouldHighlight = false;
    
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.matches('pre code') || node.querySelector('pre code')) {
              shouldHighlight = true;
              break;
            }
          }
        }
      }
    }
    
    if (shouldHighlight) {
      highlightAll(container);
    }
  });
  
  observer.observe(container, {
    childList: true,
    subtree: true,
  });
  
  return observer;
}

/**
 * Get list of supported languages (if Prism is available)
 */
export function getSupportedLanguages() {
  if (!isPrismAvailable()) return [];
  return Object.keys(window.Prism.languages).filter(
    lang => typeof window.Prism.languages[lang] === 'object'
  );
}

export default {
  isPrismAvailable,
  syncPrismColors,
  highlightAll,
  highlightElement,
  highlightCode,
  detectLanguage,
  normalizeLanguage,
  createAutoHighlighter,
  getSupportedLanguages,
};

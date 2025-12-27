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
  highlightAll,
  highlightElement,
  highlightCode,
  detectLanguage,
  normalizeLanguage,
  createAutoHighlighter,
  getSupportedLanguages,
};

// artifactuse/core/theme.js
// Theme management for Artifactuse

/**
 * Convert hex color to RGB string
 * Accepts: '#rgb', '#rrggbb', 'rgb', 'rrggbb'
 * Returns: 'r, g, b' string for CSS variables
 */
export function hexToRgb(hex) {
  if (!hex) return null;
  
  // Already in RGB format (contains comma)
  if (typeof hex === 'string' && hex.includes(',')) {
    return hex.trim();
  }
  
  // Remove # if present
  let h = String(hex).replace(/^#/, '');
  
  // Expand shorthand (e.g., 'f0c' -> 'ff00cc')
  if (h.length === 3) {
    h = h.split('').map(c => c + c).join('');
  }
  
  // Validate
  if (h.length !== 6 || !/^[0-9a-fA-F]+$/.test(h)) {
    console.warn(`Invalid color format: ${hex}`);
    return null;
  }
  
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  
  return `${r}, ${g}, ${b}`;
}

/**
 * Convert RGB string to hex
 * Accepts: 'r, g, b' or 'r,g,b'
 * Returns: '#rrggbb'
 */
export function rgbToHex(rgb) {
  if (!rgb) return null;
  
  // Already hex format
  if (typeof rgb === 'string' && rgb.startsWith('#')) {
    return rgb;
  }
  
  const parts = String(rgb).split(',').map(p => parseInt(p.trim(), 10));
  
  if (parts.length !== 3 || parts.some(isNaN)) {
    console.warn(`Invalid RGB format: ${rgb}`);
    return null;
  }
  
  const [r, g, b] = parts;
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

/**
 * Normalize color to RGB string
 * Accepts hex or RGB, returns RGB string
 */
export function normalizeColor(color) {
  if (!color) return null;
  return hexToRgb(color);
}

/**
 * Normalize a colors object (convert all hex to RGB)
 */
function normalizeColors(colors) {
  if (!colors || typeof colors !== 'object') return {};
  
  const normalized = {};
  for (const [key, value] of Object.entries(colors)) {
    // Skip non-color values like 'gradientOpacity'
    if (key === 'gradientOpacity' || typeof value === 'number') {
      normalized[key] = value;
    } else {
      const rgb = normalizeColor(value);
      if (rgb) {
        normalized[key] = rgb;
      }
    }
  }
  return normalized;
}

/**
 * Default theme colors (stored as RGB for rgba() compatibility)
 */
export const DEFAULT_COLORS = {
  // Dark theme
  dark: {
    primary: '99, 102, 241',         // #6366f1 Indigo-500
    primaryHover: '79, 70, 229',     // #4f46e5 Indigo-600
    background: '17, 24, 39',        // #111827 Gray-900
    surface: '31, 41, 55',           // #1f2937 Gray-800
    surfaceHover: '55, 65, 81',      // #374151 Gray-700
    text: '243, 244, 246',           // #f3f4f6 Gray-100
    textSecondary: '156, 163, 175',  // #9ca3af Gray-400
    textMuted: '107, 114, 128',      // #6b7280 Gray-500
    border: '75, 85, 99',            // #4b5563 Gray-600
    borderLight: '55, 65, 81',       // #374151 Gray-700
    success: '34, 197, 94',          // #22c55e Green-500
    warning: '234, 179, 8',          // #eab308 Yellow-500
    error: '239, 68, 68',            // #ef4444 Red-500
    info: '59, 130, 246',            // #3b82f6 Blue-500
    gradient: '99, 102, 241',        // Indigo for gradients
    gradientOpacity: '0.38',
  },
  
  // Light theme
  light: {
    primary: '79, 70, 229',          // #4f46e5 Indigo-600
    primaryHover: '67, 56, 202',     // #4338ca Indigo-700
    background: '255, 255, 255',     // #ffffff White
    surface: '249, 250, 251',        // #f9fafb Gray-50
    surfaceHover: '243, 244, 246',   // #f3f4f6 Gray-100
    text: '17, 24, 39',              // #111827 Gray-900
    textSecondary: '75, 85, 99',     // #4b5563 Gray-600
    textMuted: '156, 163, 175',      // #9ca3af Gray-400
    border: '229, 231, 235',         // #e5e7eb Gray-200
    borderLight: '243, 244, 246',    // #f3f4f6 Gray-100
    success: '22, 163, 74',          // #16a34a Green-600
    warning: '202, 138, 4',          // #ca8a04 Yellow-600
    error: '220, 38, 38',            // #dc2626 Red-600
    info: '37, 99, 235',             // #2563eb Blue-600
    gradient: '79, 70, 229',         // Indigo for gradients
    gradientOpacity: '0.25',
  },
};

/**
 * Create theme manager
 * 
 * @param {string} initialTheme - 'dark' | 'light' | 'auto'
 * @param {object} customColors - Custom colors (hex or RGB format accepted)
 * 
 * @example
 * // Both formats work:
 * createTheme('dark', { primary: '#6366f1' })
 * createTheme('dark', { primary: '99, 102, 241' })
 */
export function createTheme(initialTheme = 'auto', customColors = {}) {
  let currentTheme = initialTheme;
  let colors = { 
    dark: { ...DEFAULT_COLORS.dark },
    light: { ...DEFAULT_COLORS.light }
  };
  
  // Merge custom colors (normalize hex to RGB)
  if (customColors.dark) {
    colors.dark = { ...colors.dark, ...normalizeColors(customColors.dark) };
  }
  if (customColors.light) {
    colors.light = { ...colors.light, ...normalizeColors(customColors.light) };
  }
  
  // Handle flat custom colors (apply to both themes)
  const flatColors = { ...customColors };
  delete flatColors.dark;
  delete flatColors.light;
  
  if (Object.keys(flatColors).length > 0) {
    const normalized = normalizeColors(flatColors);
    colors.dark = { ...colors.dark, ...normalized };
    colors.light = { ...colors.light, ...normalized };
  }
  
  /**
   * Get resolved theme (handles 'auto')
   */
  function getResolvedTheme() {
    if (currentTheme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return currentTheme;
  }
  
  /**
   * Get current colors
   */
  function getColors() {
    return colors[getResolvedTheme()];
  }
  
  /**
   * Generate CSS variables
   */
  function getCSSVariables() {
    const themeColors = getColors();
    
    return Object.entries(themeColors)
      .map(([key, value]) => `--artifactuse-${camelToKebab(key)}: ${value};`)
      .join('\n');
  }
  
  /**
   * Apply theme to document
   */
  function apply(container = document.documentElement) {
    const themeColors = getColors();
    const resolvedTheme = getResolvedTheme();
    
    // Set CSS variables
    Object.entries(themeColors).forEach(([key, value]) => {
      container.style.setProperty(`--artifactuse-${camelToKebab(key)}`, value);
    });
    
    // Set theme attribute
    container.setAttribute('data-artifactuse-theme', resolvedTheme);
    
    // Add/remove class
    container.classList.remove('artifactuse-dark', 'artifactuse-light');
    container.classList.add(`artifactuse-${resolvedTheme}`);
  }
  
  /**
   * Set theme
   */
  function set(theme) {
    if (!['dark', 'light', 'auto'].includes(theme)) {
      console.warn(`Invalid theme: ${theme}`);
      return;
    }
    
    currentTheme = theme;
    apply();
  }
  
  /**
   * Toggle between dark and light
   */
  function toggle() {
    const resolved = getResolvedTheme();
    set(resolved === 'dark' ? 'light' : 'dark');
  }
  
  /**
   * Set custom colors (accepts hex or RGB)
   */
  function setColors(newColors, theme = null) {
    const normalized = normalizeColors(newColors);
    
    if (theme) {
      colors[theme] = { ...colors[theme], ...normalized };
    } else {
      // Apply to both themes
      colors.dark = { ...colors.dark, ...normalized };
      colors.light = { ...colors.light, ...normalized };
    }
    
    apply();
  }
  
  /**
   * Listen for system theme changes
   */
  function watchSystemTheme(callback) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handler = (e) => {
      if (currentTheme === 'auto') {
        apply();
        if (callback) {
          callback(e.matches ? 'dark' : 'light');
        }
      }
    };
    
    mediaQuery.addEventListener('change', handler);
    
    // Return cleanup function
    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }
  
  /**
   * Get CSS for embedding
   */
  function getCSS() {
    return `
      :root,
      [data-artifactuse-theme="dark"] {
        ${Object.entries(colors.dark)
          .map(([key, value]) => `--artifactuse-${camelToKebab(key)}: ${value};`)
          .join('\n        ')}
      }
      
      [data-artifactuse-theme="light"] {
        ${Object.entries(colors.light)
          .map(([key, value]) => `--artifactuse-${camelToKebab(key)}: ${value};`)
          .join('\n        ')}
      }
      
      @media (prefers-color-scheme: light) {
        :root:not([data-artifactuse-theme]) {
          ${Object.entries(colors.light)
            .map(([key, value]) => `--artifactuse-${camelToKebab(key)}: ${value};`)
            .join('\n          ')}
        }
      }
    `;
  }
  
  // Public API
  return {
    get current() { return currentTheme; },
    get resolved() { return getResolvedTheme(); },
    get colors() { return getColors(); },
    
    getResolvedTheme,
    getColors,
    getCSSVariables,
    getCSS,
    apply,
    set,
    toggle,
    setColors,
    watchSystemTheme,
  };
}

/**
 * Convert camelCase to kebab-case
 */
function camelToKebab(str) {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Inject theme CSS into document
 */
export function injectThemeCSS(theme) {
  const styleId = 'artifactuse-theme-css';
  
  // Remove existing
  const existing = document.getElementById(styleId);
  if (existing) {
    existing.remove();
  }
  
  // Create new style element
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = theme.getCSS();
  
  document.head.appendChild(style);
}

export default {
  DEFAULT_COLORS,
  createTheme,
  injectThemeCSS,
  hexToRgb,
  rgbToHex,
  normalizeColor,
};
// artifactuse/core/detector.js
// Artifact detection and extraction from AI responses

/**
 * Artifact type definitions
 */
export const ARTIFACT_TYPES = {
  CODE: 'code',
  FORM: 'form',
  SOCIAL: 'social',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  DOCUMENT: 'document',
  EMBED: 'embed',
  MAP: 'map',
  CHART: 'chart',
};

/**
 * Supported social platforms
 */
export const SOCIAL_PLATFORMS = [
  'twitter', 'linkedin', 'instagram', 
  'facebook', 'threads', 'tiktok', 'youtube'
];

/**
 * Languages/types that support live preview
 */
export const PREVIEWABLE_LANGUAGES = [
  // Code languages
  'html', 'htm', 'svg', 'markdown', 'md', 'jsx', 'vue',
  'diff', 'patch', 'json',
  'javascript', 'js', 'python', 'py',
  // Visual editors
  'canvas', 'whiteboard', 'drawing',
  'video', 'videoeditor', 'timeline',
  // Structured artifacts
  'form', 'social',
];

/**
 * Languages/types that open in panel (vs inline)
 */
export const PANEL_LANGUAGES = [
  // Visual editors (always panel)
  'video', 'videoeditor', 'timeline',
  'canvas', 'whiteboard', 'drawing',
  // Code (panel for preview)
  'json', 'svg', 'diff', 'patch',
  'javascript', 'js', 'python', 'py',
  'jsx', 'vue', 'html', 'htm',
  // Structured artifacts (form can be panel based on complexity)
  'form',
];

/**
 * Generate unique artifact ID
 */
export function generateArtifactId(prefix = 'artifact') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if language/type supports preview
 */
export function isPreviewable(language) {
  return PREVIEWABLE_LANGUAGES.includes(language?.toLowerCase());
}

/**
 * Check if language/type should open in panel by default
 */
export function isPanelArtifact(language) {
  return PANEL_LANGUAGES.includes(language?.toLowerCase());
}

/**
 * Check if platform is supported for social previews
 */
export function isSupportedSocialPlatform(platform) {
  return SOCIAL_PLATFORMS.includes(platform?.toLowerCase());
}

/**
 * Get display name for language/type
 */
export function getLanguageDisplayName(language) {
  const names = {
    // Code languages
    html: 'HTML',
    htm: 'HTML',
    css: 'CSS',
    javascript: 'JavaScript',
    js: 'JavaScript',
    typescript: 'TypeScript',
    ts: 'TypeScript',
    jsx: 'React JSX',
    tsx: 'React TSX',
    vue: 'Vue Component',
    python: 'Python',
    py: 'Python',
    java: 'Java',
    csharp: 'C#',
    cs: 'C#',
    cpp: 'C++',
    c: 'C',
    go: 'Go',
    rust: 'Rust',
    ruby: 'Ruby',
    rb: 'Ruby',
    php: 'PHP',
    swift: 'Swift',
    kotlin: 'Kotlin',
    scala: 'Scala',
    sql: 'SQL',
    bash: 'Bash',
    shell: 'Shell',
    sh: 'Shell',
    powershell: 'PowerShell',
    ps1: 'PowerShell',
    json: 'JSON',
    xml: 'XML',
    yaml: 'YAML',
    yml: 'YAML',
    markdown: 'Markdown',
    md: 'Markdown',
    svg: 'SVG',
    graphql: 'GraphQL',
    dockerfile: 'Dockerfile',
    docker: 'Docker',
    diff: 'Diff',
    patch: 'Patch',
    // Visual editors
    canvas: 'Canvas',
    video: 'Video Editor',
    videoeditor: 'Video Editor',
    timeline: 'Timeline',
    whiteboard: 'Whiteboard',
    drawing: 'Drawing',
    // Structured artifacts
    form: 'Form',
    social: 'Social Preview',
    txt: 'Plain Text',
  };
  return names[language?.toLowerCase()] || language?.toUpperCase() || 'Code';
}

/**
 * Get file extension for language/type
 */
export function getFileExtension(language) {
  const extensions = {
    html: 'html',
    htm: 'html',
    css: 'css',
    javascript: 'js',
    js: 'js',
    typescript: 'ts',
    ts: 'ts',
    jsx: 'jsx',
    tsx: 'tsx',
    vue: 'vue',
    python: 'py',
    py: 'py',
    java: 'java',
    csharp: 'cs',
    cs: 'cs',
    cpp: 'cpp',
    c: 'c',
    go: 'go',
    rust: 'rs',
    ruby: 'rb',
    rb: 'rb',
    php: 'php',
    swift: 'swift',
    kotlin: 'kt',
    scala: 'scala',
    sql: 'sql',
    bash: 'sh',
    shell: 'sh',
    sh: 'sh',
    json: 'json',
    xml: 'xml',
    yaml: 'yml',
    yml: 'yml',
    markdown: 'md',
    md: 'md',
    svg: 'svg',
    form: 'json',
    social: 'json',
  };
  return extensions[language?.toLowerCase()] || 'txt';
}

/**
 * Get language from file extension (reverse of getFileExtension)
 */
export function getLanguageFromExtension(ext) {
  const map = {
    html: 'html', htm: 'html',
    css: 'css',
    js: 'javascript', mjs: 'javascript',
    ts: 'typescript',
    jsx: 'jsx', tsx: 'tsx',
    vue: 'vue',
    py: 'python',
    java: 'java',
    cs: 'csharp',
    cpp: 'cpp', c: 'c', h: 'c',
    go: 'go',
    rs: 'rust',
    rb: 'ruby',
    php: 'php',
    swift: 'swift',
    kt: 'kotlin',
    scala: 'scala',
    sql: 'sql',
    sh: 'bash',
    json: 'json',
    xml: 'xml',
    yaml: 'yaml', yml: 'yaml',
    md: 'markdown',
    svg: 'svg',
    diff: 'diff',
    patch: 'patch',
  };
  return map[ext?.toLowerCase()] || null;
}

/**
 * Get language/type icon SVG path
 */
export function getLanguageIcon(language) {
  const icons = {
    html: '<path d="M12 17.56l4.07-1.13.55-6.1H9.38l-.16-1.7h7.78l.16-1.7H6.85l.48 5.1h6.3l-.25 2.9-2.38.63-2.38-.63-.15-1.7H6.76l.3 3.2L12 17.56M4.07 3h15.86L18.5 19.2 12 21l-6.5-1.8L4.07 3z"/>',
    htm: '<path d="M12 17.56l4.07-1.13.55-6.1H9.38l-.16-1.7h7.78l.16-1.7H6.85l.48 5.1h6.3l-.25 2.9-2.38.63-2.38-.63-.15-1.7H6.76l.3 3.2L12 17.56M4.07 3h15.86L18.5 19.2 12 21l-6.5-1.8L4.07 3z"/>',
    css: '<path d="M5 3l.65 3.34h12.59l-.44 2.16H6.11l.65 3.34h11.04l-.78 3.86-5.02 1.67-4.96-1.67-.33-1.69H4.38l.65 3.35L12 19.31l7.02-2.31L20.93 3H5z"/>',
    javascript: '<path d="M3 3h18v18H3V3m4.73 15.04c.4.85 1.19 1.55 2.54 1.55 1.5 0 2.53-.8 2.53-2.55v-5.78h-1.7V17c0 .86-.35 1.08-.9 1.08-.58 0-.82-.4-1.09-.87l-1.38.83m5.98-.18c.5.98 1.51 1.73 3.09 1.73 1.6 0 2.8-.83 2.8-2.36 0-1.41-.81-2.04-2.25-2.66l-.42-.18c-.73-.31-1.04-.52-1.04-1.02 0-.41.31-.73.81-.73.48 0 .8.21 1.09.73l1.31-.87c-.55-.96-1.33-1.33-2.4-1.33-1.51 0-2.48.96-2.48 2.23 0 1.38.81 2.03 2.03 2.55l.42.18c.78.34 1.24.55 1.24 1.13 0 .48-.45.83-1.15.83-.83 0-1.31-.43-1.67-1.03l-1.38.8z"/>',
    js: '<path d="M3 3h18v18H3V3m4.73 15.04c.4.85 1.19 1.55 2.54 1.55 1.5 0 2.53-.8 2.53-2.55v-5.78h-1.7V17c0 .86-.35 1.08-.9 1.08-.58 0-.82-.4-1.09-.87l-1.38.83m5.98-.18c.5.98 1.51 1.73 3.09 1.73 1.6 0 2.8-.83 2.8-2.36 0-1.41-.81-2.04-2.25-2.66l-.42-.18c-.73-.31-1.04-.52-1.04-1.02 0-.41.31-.73.81-.73.48 0 .8.21 1.09.73l1.31-.87c-.55-.96-1.33-1.33-2.4-1.33-1.51 0-2.48.96-2.48 2.23 0 1.38.81 2.03 2.03 2.55l.42.18c.78.34 1.24.55 1.24 1.13 0 .48-.45.83-1.15.83-.83 0-1.31-.43-1.67-1.03l-1.38.8z"/>',
    typescript: '<path d="M3 3h18v18H3V3m10.71 14.86c.5.98 1.51 1.73 3.09 1.73 1.6 0 2.8-.83 2.8-2.36 0-1.41-.81-2.04-2.25-2.66l-.42-.18c-.73-.31-1.04-.52-1.04-1.02 0-.41.31-.73.81-.73.48 0 .8.21 1.09.73l1.31-.87c-.55-.96-1.33-1.33-2.4-1.33-1.51 0-2.48.96-2.48 2.23 0 1.38.81 2.03 2.03 2.55l.42.18c.78.34 1.24.55 1.24 1.13 0 .48-.45.83-1.15.83-.83 0-1.31-.43-1.67-1.03l-1.38.8M10 17V9H6v8"/>',
    ts: '<path d="M3 3h18v18H3V3m10.71 14.86c.5.98 1.51 1.73 3.09 1.73 1.6 0 2.8-.83 2.8-2.36 0-1.41-.81-2.04-2.25-2.66l-.42-.18c-.73-.31-1.04-.52-1.04-1.02 0-.41.31-.73.81-.73.48 0 .8.21 1.09.73l1.31-.87c-.55-.96-1.33-1.33-2.4-1.33-1.51 0-2.48.96-2.48 2.23 0 1.38.81 2.03 2.03 2.55l.42.18c.78.34 1.24.55 1.24 1.13 0 .48-.45.83-1.15.83-.83 0-1.31-.43-1.67-1.03l-1.38.8M10 17V9H6v8"/>',
    python: '<path d="M12 2C9.2 2 7.5 3.2 7.5 5.5v2.3H12v.7H5.5C3.4 8.5 2 10.4 2 12.8c0 2.4 1.4 4.3 3.5 4.3H7v-2.5c0-2.3 1.9-4.3 4.2-4.3h4.6c1.9 0 3.5-1.6 3.5-3.5V5.5C19.3 3.2 17.6 2 14.8 2h-2.8zM9 3.8c.6 0 1 .5 1 1s-.4 1-1 1-1-.5-1-1 .4-1 1-1z"/><path d="M12 22c2.8 0 4.5-1.2 4.5-3.5v-2.3H12v-.7h6.5c2.1 0 3.5-1.9 3.5-4.3 0-2.4-1.4-4.3-3.5-4.3H17v2.5c0 2.3-1.9 4.3-4.2 4.3H8.2c-1.9 0-3.5 1.6-3.5 3.5v1.3c0 2.3 1.7 3.5 4.5 3.5h2.8zm3-1.8c-.6 0-1-.5-1-1s.4-1 1-1 1 .5 1 1-.4 1-1 1z"/>',
    py: '<path d="M12 2C9.2 2 7.5 3.2 7.5 5.5v2.3H12v.7H5.5C3.4 8.5 2 10.4 2 12.8c0 2.4 1.4 4.3 3.5 4.3H7v-2.5c0-2.3 1.9-4.3 4.2-4.3h4.6c1.9 0 3.5-1.6 3.5-3.5V5.5C19.3 3.2 17.6 2 14.8 2h-2.8zM9 3.8c.6 0 1 .5 1 1s-.4 1-1 1-1-.5-1-1 .4-1 1-1z"/><path d="M12 22c2.8 0 4.5-1.2 4.5-3.5v-2.3H12v-.7h6.5c2.1 0 3.5-1.9 3.5-4.3 0-2.4-1.4-4.3-3.5-4.3H17v2.5c0 2.3-1.9 4.3-4.2 4.3H8.2c-1.9 0-3.5 1.6-3.5 3.5v1.3c0 2.3 1.7 3.5 4.5 3.5h2.8zm3-1.8c-.6 0-1-.5-1-1s.4-1 1-1 1 .5 1 1-.4 1-1 1z"/>',
    vue: '<path d="M2 3h3.5L12 14.5 18.5 3H22L12 21 2 3m4.5 0h3L12 7.58 14.5 3h3L12 13.08 6.5 3z"/>',
    jsx: '<circle cx="12" cy="12" r="2.5"/><ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" stroke-width="1"/><ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" stroke-width="1" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" stroke-width="1" transform="rotate(120 12 12)"/>',
    tsx: '<circle cx="12" cy="12" r="2.5"/><ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" stroke-width="1"/><ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" stroke-width="1" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" stroke-width="1" transform="rotate(120 12 12)"/>',
    json: '<path d="M5 3h2v2H5v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5h2v2H5c-1.07-.27-2-.9-2-2v-4a2 2 0 0 0-2-2H0v-2h1a2 2 0 0 0 2-2V5a2 2 0 0 1 2-2m14 0a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2h1v2h-1a2 2 0 0 0-2 2v4a2 2 0 0 1-2 2h-2v-2h2v-5a2 2 0 0 1 2-2 2 2 0 0 1-2-2V5h-2V3h2m-7 12a1 1 0 0 1 1 1 1 1 0 0 1-1 1 1 1 0 0 1-1-1 1 1 0 0 1 1-1m-4 0a1 1 0 0 1 1 1 1 1 0 0 1-1 1 1 1 0 0 1-1-1 1 1 0 0 1 1-1m8 0a1 1 0 0 1 1 1 1 1 0 0 1-1 1 1 1 0 0 1-1-1 1 1 0 0 1 1-1z"/>',
    markdown: '<path d="M2 4h20v16H2V4m2 2v12h16V6H4m2 2h3l1.5 3 1.5-3h3v8h-2v-5l-2.5 4-2.5-4v5H6V8m11 0h2v4h2l-3 4-3-4h2V8z"/>',
    md: '<path d="M2 4h20v16H2V4m2 2v12h16V6H4m2 2h3l1.5 3 1.5-3h3v8h-2v-5l-2.5 4-2.5-4v5H6V8m11 0h2v4h2l-3 4-3-4h2V8z"/>',
    svg: '<path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2m0 2v14h14V5H5m3 4a2 2 0 0 1 2 2 2 2 0 0 1-2 2 2 2 0 0 1-2-2 2 2 0 0 1 2-2m8 0l3 8h-2l-.5-1.5h-3L13 17h-2l3-8h2m-.5 2.5l-1 3h2l-1-3z"/>',
    bash: '<path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2m0 2v12h16V6H4m2 2l4 3-4 3V8m5 5h5v2h-5v-2z"/>',
    shell: '<path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2m0 2v12h16V6H4m2 2l4 3-4 3V8m5 5h5v2h-5v-2z"/>',
    sh: '<path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2m0 2v12h16V6H4m2 2l4 3-4 3V8m5 5h5v2h-5v-2z"/>',
    sql: '<path d="M12 3C7.58 3 4 4.79 4 7v10c0 2.21 3.58 4 8 4s8-1.79 8-4V7c0-2.21-3.58-4-8-4m0 2c3.87 0 6 1.5 6 2s-2.13 2-6 2-6-1.5-6-2 2.13-2 6-2M6 17v-2.7c1.56.84 3.67 1.36 6 1.36s4.44-.52 6-1.36V17c0 .5-2.13 2-6 2s-6-1.5-6-2m0-5v-2.7c1.56.84 3.67 1.36 6 1.36s4.44-.52 6-1.36V12c0 .5-2.13 2-6 2s-6-1.5-6-2z"/>',
    diff: '<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>',
    patch: '<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>',
    canvas: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>',
    whiteboard: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>',
    drawing: '<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/>',
    video: '<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>',
    videoeditor: '<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>',
    timeline: '<line x1="2" y1="12" x2="22" y2="12"/><circle cx="6" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="18" cy="12" r="2"/>',
    form: '<path d="M4 4h16v2H4V4zm0 4h10v2H4V8zm0 4h16v2H4v-2zm0 4h10v2H4v-2z"/><rect x="16" y="8" width="4" height="4" rx="1"/><rect x="16" y="16" width="4" height="4" rx="1"/>',
    social: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
  };
  
  const defaultIcon = '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>';
  return icons[language?.toLowerCase()] || defaultIcon;
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Decode HTML entities
 */
export function decodeHtml(encoded) {
  return encoded
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&#10;/g, '\n')
    .replace(/&#13;/g, '\r')
    .replace(/&#9;/g, '\t')
    .replace(/&nbsp;/g, ' ');
}

/**
 * Encode HTML for safe embedding
 */
export function encodeHtml(code) {
  return code
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Encode JSON for safe embedding in HTML attributes using Base64
 */
export function encodeJsonForAttribute(obj) {
  const json = JSON.stringify(obj);
  if (typeof btoa === 'function') {
    return btoa(unescape(encodeURIComponent(json)));
  } else if (typeof Buffer !== 'undefined') {
    return Buffer.from(json, 'utf-8').toString('base64');
  }
  return json
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Decode JSON from a Base64-encoded HTML attribute value
 */
export function decodeJsonFromAttribute(encoded) {
  if (!encoded) return null;
  try {
    let json;
    if (typeof atob === 'function') {
      json = decodeURIComponent(escape(atob(encoded)));
    } else if (typeof Buffer !== 'undefined') {
      json = Buffer.from(encoded, 'base64').toString('utf-8');
    } else {
      json = decodeHtml(encoded);
    }
    return JSON.parse(json);
  } catch (e) {
    try {
      const decoded = decodeHtml(encoded);
      return JSON.parse(decoded);
    } catch (e2) {
      console.error('Failed to decode JSON from attribute:', e);
      return null;
    }
  }
}

/**
 * Extract title from code content
 */
export function extractArtifactTitle(code, language) {
  const langLower = language?.toLowerCase();
  
  // For form/social, try to extract title from JSON
  if (langLower === 'form' || langLower === 'social') {
    try {
      const json = JSON.parse(code);
      if (langLower === 'form') {
        return json.title || 'Form';
      }
      if (langLower === 'social') {
        const platform = json.platform || 'twitter';
        return `Social Preview - ${platform}`;
      }
    } catch {
      // Fall through to default
    }
  }
  
  // Check for explicit filename comment
  const filenameMatch = code.match(/(?:\/\/|\/\*|<!--)\s*(?:filename|file):\s*([^\n*\->\s]+)/i);
  if (filenameMatch) return filenameMatch[1].trim();

  // Check for shebang
  const shebangMatch = code.match(/^#!.*\/(node|python|bash|sh|ruby|perl)/);
  if (shebangMatch) {
    const interpreters = { node: 'Node', python: 'Python', bash: 'Bash', sh: 'Shell', ruby: 'Ruby', perl: 'Perl' };
    return `${interpreters[shebangMatch[1]] || shebangMatch[1]} Script`;
  }

  // Vue component name
  const vueNameMatch = code.match(/name:\s*['"]([^'"]+)['"]/);
  if (vueNameMatch) return vueNameMatch[1];

  // React/JS component or function name
  const componentMatch = code.match(/(?:export\s+default\s+)?(?:function|class)\s+([A-Z][a-zA-Z0-9]+)/);
  if (componentMatch) return componentMatch[1];

  // Const arrow function component
  const constComponentMatch = code.match(/(?:export\s+)?const\s+([A-Z][a-zA-Z0-9]+)\s*=\s*(?:\([^)]*\)|[a-zA-Z]+)\s*=>/);
  if (constComponentMatch) return constComponentMatch[1];

  // Python class or main function
  if (langLower === 'python' || langLower === 'py') {
    const pyClassMatch = code.match(/class\s+([A-Z][a-zA-Z0-9_]+)/);
    if (pyClassMatch) return pyClassMatch[1];
    
    const pyFuncMatch = code.match(/def\s+([a-z_][a-zA-Z0-9_]+)\s*\(/);
    if (pyFuncMatch && pyFuncMatch[1] !== 'main') return pyFuncMatch[1];
  }

  // HTML title tag
  const titleMatch = code.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch) return titleMatch[1].trim();

  // Detect common patterns
  if (code.includes('<template>') && code.includes('<script>')) return 'Vue Component';
  if (code.includes('import React') || code.includes('from "react"')) return 'React Component';
  if (code.includes('<!DOCTYPE html>') || code.includes('<html')) return 'HTML Document';
  if (code.includes('@app.route') || code.includes('Flask')) return 'Flask App';
  if (code.includes('express()')) return 'Express Server';
  if (code.includes('CREATE TABLE')) return 'SQL Schema';
  if (code.includes('SELECT') && code.includes('FROM')) return 'SQL Query';

  return `${getLanguageDisplayName(language)} Code`;
}

/**
 * Compute a simple line-by-line diff for inline preview display
 * Produces +/- prefixed lines that Prism highlights with language-diff
 */
function computeSimpleDiff(oldCode, newCode) {
  const oldLines = (oldCode || '').split('\n');
  const newLines = (newCode || '').split('\n');
  const result = [];
  const max = Math.max(oldLines.length, newLines.length);
  for (let i = 0; i < max; i++) {
    const oldLine = i < oldLines.length ? oldLines[i] : undefined;
    const newLine = i < newLines.length ? newLines[i] : undefined;
    if (oldLine === newLine) {
      result.push(' ' + oldLine);
    } else {
      if (oldLine !== undefined) result.push('-' + oldLine);
      if (newLine !== undefined) result.push('+' + newLine);
    }
  }
  return result.join('\n');
}

/**
 * Create inline preview HTML for an artifact
 * Shows truncated code with fade overlay for long content
 */
function createInlinePreview(artifact, code, langLower, inlinePreview) {
  const maxLines = inlinePreview.maxLines || 15;
  let previewCode, previewLang;

  if (langLower === 'diff' || langLower === 'patch') {
    // Diff artifacts store JSON {oldCode, newCode, language}.
    // Compute a human-readable unified diff for the inline preview.
    try {
      const diffData = JSON.parse(code);
      previewCode = computeSimpleDiff(diffData.oldCode, diffData.newCode);
      previewLang = 'diff';
    } catch {
      previewCode = code;
      previewLang = langLower;
    }
  } else {
    previewCode = code;
    previewLang = langLower;
  }

  const lines = previewCode.split('\n');
  const truncated = lines.slice(0, maxLines).join('\n');
  const encoded = encodeHtml(truncated);
  const isTruncated = lines.length > maxLines;
  const label = langLower === 'diff' || langLower === 'patch' ? 'diff' : 'code';

  return `<div class="artifactuse-inline-preview${isTruncated ? ' artifactuse-inline-preview--truncated' : ''}" data-artifact-id="${artifact.id}">`
    + `<pre class="artifactuse-inline-preview__pre"><code class="language-${previewLang}">${encoded}</code></pre>`
    + (isTruncated ? `<div class="artifactuse-inline-preview__fade"><span class="artifactuse-inline-preview__action">View full ${label} (${lines.length} lines)</span></div>` : '')
    + `</div>`;
}

/**
 * Create artifact placeholder HTML
 */
function createArtifactPlaceholder(artifact, placeholderType = 'panel') {
  const encodedData = encodeJsonForAttribute(artifact);
  const className = `artifactuse-placeholder artifactuse-${placeholderType}`;
  return `<div class="${className}" data-artifact-id="${artifact.id}" data-artifact-type="${artifact.type}" data-artifact="${encodedData}"></div>`;
}

/**
 * Try to parse JSON from code block content
 */
function tryParseJson(code) {
  try {
    return JSON.parse(code);
  } catch {
    return null;
  }
}

/**
 * Determine if form should render inline or in panel
 * Parses JSON from code to check complexity
 */
export function shouldFormBeInline(code) {
  const json = tryParseJson(code);
  if (!json) return true; // Default to inline if can't parse
  
  // Explicit display setting
  if (json.display === 'inline') return true;
  if (json.display === 'panel') return false;
  
  // Auto-detect based on complexity
  if (json.variant === 'wizard') return false;
  if (json.variant === 'buttons') return true;
  
  const fields = json.data?.fields || [];
  
  // File uploads always go to panel
  if (fields.some(f => f.type === 'file')) return false;
  
  // Complex field types go to panel
  const complexTypes = ['multiselect', 'rating', 'color', 'range'];
  if (fields.some(f => complexTypes.includes(f.type))) return false;
  
  // More than 4 fields go to panel
  if (fields.filter(f => f.type !== 'buttons' && f.type !== 'divider' && f.type !== 'heading').length > 4) return false;
  
  // Textarea with many rows goes to panel
  if (fields.some(f => f.type === 'textarea' && (f.rows || 3) > 4)) return false;
  
  return true;
}

/**
 * Determine if artifact should be inline based on language
 */
export function getIsInline(language, code) {
  const langLower = language?.toLowerCase();
  
  // Social is always inline
  if (langLower === 'social') return true;
  
  // Form depends on complexity
  if (langLower === 'form') return shouldFormBeInline(code);
  
  // Everything else defaults to panel
  return false;
}

/**
 * Get artifact type from language
 */
function getArtifactType(language) {
  const langLower = language?.toLowerCase();
  
  if (langLower === 'form') return ARTIFACT_TYPES.FORM;
  if (langLower === 'social') return ARTIFACT_TYPES.SOCIAL;
  
  return ARTIFACT_TYPES.CODE;
}

/**
 * Create artifact from code block
 * Unified method for all artifact types (code, form, social)
 * 
 * @param {string} code - Code/JSON content
 * @param {string} language - Language identifier (js, html, form, social, etc.)
 * @param {string} messageId - Message ID
 * @param {number} blockIndex - Block index
 */
export function createArtifact(code, language, messageId, blockIndex) {
  const langLower = language?.toLowerCase();
  const type = getArtifactType(langLower);
  const isInline = getIsInline(langLower, code);
  
  return {
    id: `${messageId}-${type}-${blockIndex}`,
    messageId,
    type,
    language: langLower,
    title: extractArtifactTitle(code, langLower),
    code,
    isInline,
    isPreviewable: isPreviewable(langLower),
    isPanelArtifact: isPanelArtifact(langLower),
    size: code.length,
    lineCount: code.split('\n').length,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Parse artifacts from rendered HTML (simple detection, no replacement)
 */
export function parseArtifacts(html, messageId) {
  const artifacts = [];
  const codeBlockRegex = /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/gi;
  let match;
  let blockIndex = 0;
  
  while ((match = codeBlockRegex.exec(html)) !== null) {
    const language = match[1];
    const code = decodeHtml(match[2]);
    let langLower = language.toLowerCase();

    // Detect SVG in XML/HTML
    if (['xml', 'markup', 'html', 'htm'].includes(langLower) || !langLower) {
      if (code.trim().startsWith('<svg') || code.includes('<svg ') || code.includes('<svg>')) {
        langLower = 'svg';
      }
    }
    
    // Validate JSON for form/social
    if (langLower === 'form' || langLower === 'social') {
      const json = tryParseJson(code);
      if (!json) {
        // Invalid JSON, treat as regular code
        artifacts.push(createArtifact(code, 'json', messageId, blockIndex));
        blockIndex++;
        continue;
      }
    }
    artifacts.push(createArtifact(code, langLower, messageId, blockIndex));
    blockIndex++;
  }
  
  return artifacts;
}

/**
 * Extract code blocks and replace with placeholders
 * Handles all artifact types: code, form, social
 */
export function extractCodeBlockArtifacts(html, messageId, options = {}) {
  const {
    minLines = 3,
    minLength = 50,
    extractAll = false,
    inlinePreview = null,
  } = options;

  function shouldShowPreview(lang) {
    if (!inlinePreview) return false;
    if (inlinePreview.languages === true) return true;
    if (Array.isArray(inlinePreview.languages)) return inlinePreview.languages.includes(lang);
    return false;
  }
  
  const artifacts = [];
  const codeBlockRegex = /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/gi;
  
  let blockIndex = 0;
  
  const modifiedHtml = html.replace(codeBlockRegex, (match, language, encodedCode) => {
    const code = decodeHtml(encodedCode).trim();
    const lineCount = code.split('\n').length;
    let langLower = language.toLowerCase();

    // Detect SVG in XML/HTML
    if (['xml', 'markup', 'html', 'htm'].includes(langLower) || !langLower) {
      if (code.trim().startsWith('<svg')) {
        langLower = 'svg';
      }
    }

    // Artifact extraction logic
    const isPreviewableLang = isPreviewable(langLower);
    
    let shouldExtract = false;
    
    if (extractAll) {
      shouldExtract = true;
    } else if (langLower === 'diff' || langLower === 'patch') {
      shouldExtract = lineCount > 10;
    } else if (isPreviewableLang) {
      shouldExtract = true;
    } else {
      shouldExtract = code.length >= minLength && lineCount >= minLines;
    }

    // Force extraction when inline preview is configured for this language
    if (!shouldExtract && shouldShowPreview(langLower)) {
      shouldExtract = true;
    }

    if (shouldExtract) {
      const artifact = createArtifact(code, langLower, messageId, blockIndex);
      blockIndex++;
      artifacts.push(artifact);

      // Inline preview mode: show truncated code instead of card
      if (shouldShowPreview(langLower)) {
        return createInlinePreview(artifact, code, langLower, inlinePreview);
      }

      // Determine placeholder type based on artifact
      let placeholderType = 'panel';
      if (artifact.isInline) {
        placeholderType = artifact.type === 'social' ? 'inline-social' : 'inline-form';
      }

      return createArtifactPlaceholder(artifact, placeholderType);
    }
    
    blockIndex++;
    return match;
  });
  
  return {
    artifacts,
    html: modifiedHtml,
  };
}

export default {
  ARTIFACT_TYPES,
  PREVIEWABLE_LANGUAGES,
  PANEL_LANGUAGES,
  SOCIAL_PLATFORMS,
  generateArtifactId,
  isPreviewable,
  isPanelArtifact,
  isSupportedSocialPlatform,
  getLanguageDisplayName,
  getFileExtension,
  getLanguageIcon,
  getIsInline,
  formatBytes,
  decodeHtml,
  encodeHtml,
  encodeJsonForAttribute,
  decodeJsonFromAttribute,
  extractArtifactTitle,
  parseArtifacts,
  extractCodeBlockArtifacts,
  shouldFormBeInline,
};
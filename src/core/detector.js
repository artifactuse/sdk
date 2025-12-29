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
 * Inline artifact types (rendered in message, not panel)
 */
export const INLINE_ARTIFACT_TYPES = ['form', 'social'];

/**
 * Supported social platforms
 */
export const SOCIAL_PLATFORMS = [
  'twitter', 'linkedin', 'instagram', 
  'facebook', 'threads', 'tiktok', 'youtube'
];

/**
 * Languages that support live preview in panel
 */
export const PREVIEWABLE_LANGUAGES = [
  'html', 'htm', 'svg', 'markdown', 'md', 'jsx', 'vue',
  'diff', 'patch',
  'json',
  'javascript', 'js',
  'python', 'py',
  'canvas', 'whiteboard', 'drawing',
  'video', 'videoeditor', 'timeline',
];

/**
 * Languages that open in panel (vs inline preview)
 */
export const PANEL_LANGUAGES = [
  'video', 'videoeditor', 'timeline',
  'canvas', 'whiteboard', 'drawing',
  'json',
  'svg',
  'diff', 'patch',
  'javascript', 'js',
  'python', 'py',
  'jsx', 'vue', 'html', 'htm',
];

/**
 * Generate unique artifact ID
 */
export function generateArtifactId(prefix = 'artifact') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if language supports preview
 */
export function isPreviewable(language) {
  return PREVIEWABLE_LANGUAGES.includes(language?.toLowerCase());
}

/**
 * Check if language should open in panel
 */
export function isPanelArtifact(language) {
  return PANEL_LANGUAGES.includes(language?.toLowerCase());
}

/**
 * Check if artifact type renders inline
 */
export function isInlineArtifact(type) {
  return INLINE_ARTIFACT_TYPES.includes(type?.toLowerCase());
}

/**
 * Check if platform is supported for social previews
 */
export function isSupportedSocialPlatform(platform) {
  return SOCIAL_PLATFORMS.includes(platform?.toLowerCase());
}

/**
 * Get display name for language
 */
export function getLanguageDisplayName(language) {
  const names = {
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
    canvas: 'Canvas',
    video: 'Video Editor',
    videoeditor: 'Video Editor',
    timeline: 'Timeline',
    whiteboard: 'Whiteboard',
    drawing: 'Drawing',
  };
  return names[language?.toLowerCase()] || language?.toUpperCase() || 'Code';
}

/**
 * Get file extension for language
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
  };
  return extensions[language?.toLowerCase()] || 'txt';
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
 * Extract title from code content
 */
export function extractArtifactTitle(code, language) {
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
  if (language === 'python' || language === 'py') {
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

  // Fallback to language display name
  return `${getLanguageDisplayName(language)} Code`;
}

/**
 * Create artifact placeholder HTML
 * @param {Object} artifact - The artifact object
 * @param {string} placeholderType - Type of placeholder: 'panel' | 'inline-form' | 'inline-social'
 */
function createArtifactPlaceholder(artifact, placeholderType = 'panel') {
  const encodedData = encodeHtml(JSON.stringify(artifact));
  const className = `artifactuse-placeholder artifactuse-${placeholderType}`;
  return `<div class="${className}" data-artifact-id="${artifact.id}" data-artifact-type="${artifact.type}" data-artifact='${encodedData}'></div>`;
}

/**
 * Try to parse JSON from code block content
 * Returns parsed object or null if not valid JSON
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
 */
export function shouldFormBeInline(form) {
  // Explicit display setting
  if (form.display === 'inline') return true;
  if (form.display === 'panel') return false;
  
  // Auto-detect based on complexity
  if (form.variant === 'wizard') return false;
  if (form.variant === 'buttons') return true;
  
  const fields = form.data?.fields || [];
  
  // File uploads always go to panel
  if (fields.some(f => f.type === 'file')) return false;
  
  // Complex field types go to panel
  const complexTypes = ['multiselect', 'rating', 'color', 'range'];
  if (fields.some(f => complexTypes.includes(f.type))) return false;
  
  // More than 3 fields go to panel
  if (fields.length > 3) return false;
  
  // Textarea with many rows goes to panel
  if (fields.some(f => f.type === 'textarea' && (f.rows || 3) > 3)) return false;
  
  return true;
}

/**
 * Detect artifact type from JSON content
 * Returns { type, artifact } or null
 */
function detectJsonArtifactType(json, code, messageId, blockIndex) {
  if (!json || typeof json !== 'object') return null;
  
  // Form artifact
  if (json.type === 'form') {
    return {
      type: ARTIFACT_TYPES.FORM,
      artifact: {
        id: json.id || `${messageId}-form-${blockIndex}`,
        messageId,
        type: ARTIFACT_TYPES.FORM,
        variant: json.variant || 'fields',
        title: json.title,
        description: json.description,
        submitLabel: json.submitLabel,
        cancelLabel: json.cancelLabel,
        data: json.data || {},
        display: json.display || 'auto',
        isInline: shouldFormBeInline(json),
        code,
        createdAt: new Date().toISOString(),
      }
    };
  }
  
  // Social preview artifact
  if (json.type === 'social') {
    return {
      type: ARTIFACT_TYPES.SOCIAL,
      artifact: {
        id: `${messageId}-social-${blockIndex}`,
        messageId,
        type: ARTIFACT_TYPES.SOCIAL,
        platform: json.platform || 'twitter',
        variant: json.variant || 'post',
        data: json.data || {},
        code,
        isInline: true, // Social previews are always inline
        createdAt: new Date().toISOString(),
      }
    };
  }
  
  return null;
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
    
    // Check for JSON-based artifacts (form, social)
    if (langLower === 'json') {
      const json = tryParseJson(code);
      const detected = detectJsonArtifactType(json, code, messageId, blockIndex);
      if (detected) {
        artifacts.push(detected.artifact);
        blockIndex++;
        continue;
      }
    }
    
    // Regular code artifact
    artifacts.push({
      id: generateArtifactId('code'),
      messageId,
      type: ARTIFACT_TYPES.CODE,
      language: langLower,
      code,
      title: extractArtifactTitle(code, langLower),
      size: code.length,
      lineCount: code.split('\n').length,
      isPreviewable: isPreviewable(langLower),
      isPanelArtifact: isPanelArtifact(langLower),
      isInline: false,
      createdAt: new Date().toISOString(),
    });
    
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
  } = options;
  
  const artifacts = [];
  const codeBlockRegex = /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/gi;
  
  let blockIndex = 0;
  
  const modifiedHtml = html.replace(codeBlockRegex, (match, language, encodedCode) => {
    const code = decodeHtml(encodedCode).trim();
    const lineCount = code.split('\n').length;
    let langLower = language.toLowerCase();

    // Detect SVG in XML/HTML
    if (['xml', 'markup', 'html', 'htm'].includes(langLower) || !langLower) {
      if (code.trim().startsWith('<svg') || code.includes('<svg ') || code.includes('<svg>')) {
        langLower = 'svg';
      }
    }
    
    // Check for JSON-based artifacts (form, social)
    if (langLower === 'json') {
      const json = tryParseJson(code);
      const detected = detectJsonArtifactType(json, code, messageId, blockIndex);
      
      if (detected) {
        blockIndex++;
        artifacts.push(detected.artifact);
        
        // Determine placeholder type
        const placeholderType = detected.artifact.isInline 
          ? `inline-${detected.type}` 
          : 'panel';
        
        return createArtifactPlaceholder(detected.artifact, placeholderType);
      }
    }
    
    // Regular code artifact extraction logic
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
    
    if (shouldExtract) {
      const artifact = {
        id: `${messageId}-code-${blockIndex}`,
        messageId,
        type: ARTIFACT_TYPES.CODE,
        language: langLower,
        code,
        title: extractArtifactTitle(code, langLower),
        size: code.length,
        lineCount,
        isPreviewable: isPreviewable(langLower),
        isPanelArtifact: isPanelArtifact(langLower),
        isInline: false,
        createdAt: new Date().toISOString(),
        autoOpen: false,
      };
      
      blockIndex++;
      artifacts.push(artifact);
      
      return createArtifactPlaceholder(artifact, 'panel');
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
  INLINE_ARTIFACT_TYPES,
  PREVIEWABLE_LANGUAGES,
  PANEL_LANGUAGES,
  SOCIAL_PLATFORMS,
  generateArtifactId,
  isPreviewable,
  isPanelArtifact,
  isInlineArtifact,
  isSupportedSocialPlatform,
  getLanguageDisplayName,
  getFileExtension,
  decodeHtml,
  encodeHtml,
  extractArtifactTitle,
  parseArtifacts,
  extractCodeBlockArtifacts,
  shouldFormBeInline,
};

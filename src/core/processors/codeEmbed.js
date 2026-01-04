// processors/codeEmbed.js
// Handles code platform embeds: GitHub Gist, CodePen, CodeSandbox, JSFiddle, StackBlitz, Replit

/**
 * Generate a unique ID for embeds
 */
function generateEmbedId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Process all code platform URLs in HTML
 * @param {string} html - HTML content to process
 * @param {object} options - Processing options
 * @param {string} options.theme - Theme: 'dark' | 'light'
 */
export function processCodeEmbeds(html, options = {}) {
  const theme = options.theme || 'dark';
  
  // GitHub Gist (linkified)
  const gistLinkRegex = /<a[^>]*href="(https?:\/\/gist\.github\.com\/([a-zA-Z0-9_-]+)\/([a-f0-9]+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(gistLinkRegex, (match, url, user, gistId) => {
    return createGistEmbed(user, gistId);
  });

  // GitHub Gist (raw)
  const gistRegex = /(?<!["'=])(https?:\/\/gist\.github\.com\/([a-zA-Z0-9_-]+)\/([a-f0-9]+))(?!["'])/gi;
  html = html.replace(gistRegex, (match, url, user, gistId) => {
    return createGistEmbed(user, gistId);
  });

  // CodePen (linkified)
  const codepenLinkRegex = /<a[^>]*href="(https?:\/\/codepen\.io\/([a-zA-Z0-9_-]+)\/(?:pen|full|details)\/([a-zA-Z0-9]+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(codepenLinkRegex, (match, url, user, penId) => {
    return createCodePenEmbed(user, penId, theme);
  });

  // CodePen (raw)
  const codepenRegex = /(?<!["'=])(https?:\/\/codepen\.io\/([a-zA-Z0-9_-]+)\/(?:pen|full|details)\/([a-zA-Z0-9]+))(?!["'])/gi;
  html = html.replace(codepenRegex, (match, url, user, penId) => {
    return createCodePenEmbed(user, penId, theme);
  });

  // CodeSandbox (linkified)
  const codesandboxLinkRegex = /<a[^>]*href="(https?:\/\/codesandbox\.io\/(?:s|embed)\/([a-zA-Z0-9-]+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(codesandboxLinkRegex, (match, url, sandboxId) => {
    return createCodeSandboxEmbed(sandboxId, theme);
  });

  // CodeSandbox (raw)
  const codesandboxRegex = /(?<!["'=])(https?:\/\/codesandbox\.io\/(?:s|embed)\/([a-zA-Z0-9-]+))(?!["'])/gi;
  html = html.replace(codesandboxRegex, (match, url, sandboxId) => {
    return createCodeSandboxEmbed(sandboxId, theme);
  });

  // JSFiddle (linkified)
  const jsfiddleLinkRegex = /<a[^>]*href="(https?:\/\/jsfiddle\.net\/([a-zA-Z0-9_]+)\/([a-zA-Z0-9]+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(jsfiddleLinkRegex, (match, url, user, fiddleId) => {
    return createJSFiddleEmbed(user, fiddleId, theme);
  });

  // JSFiddle (raw)
  const jsfiddleRegex = /(?<!["'=])(https?:\/\/jsfiddle\.net\/([a-zA-Z0-9_]+)\/([a-zA-Z0-9]+))(?!["'])/gi;
  html = html.replace(jsfiddleRegex, (match, url, user, fiddleId) => {
    return createJSFiddleEmbed(user, fiddleId, theme);
  });

  // StackBlitz (linkified)
  const stackblitzLinkRegex = /<a[^>]*href="(https?:\/\/stackblitz\.com\/(?:edit|embed)\/([a-zA-Z0-9-]+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(stackblitzLinkRegex, (match, url, projectId) => {
    return createStackBlitzEmbed(projectId, theme);
  });

  // StackBlitz (raw)
  const stackblitzRegex = /(?<!["'=])(https?:\/\/stackblitz\.com\/(?:edit|embed)\/([a-zA-Z0-9-]+))(?!["'])/gi;
  html = html.replace(stackblitzRegex, (match, url, projectId) => {
    return createStackBlitzEmbed(projectId, theme);
  });

  // Replit (linkified)
  const replitLinkRegex = /<a[^>]*href="(https?:\/\/replit\.com\/@([a-zA-Z0-9_]+)\/([a-zA-Z0-9_-]+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(replitLinkRegex, (match, url, user, replName) => {
    return createReplitEmbed(user, replName, theme);
  });

  // Replit (raw)
  const replitRegex = /(?<!["'=])(https?:\/\/replit\.com\/@([a-zA-Z0-9_]+)\/([a-zA-Z0-9_-]+))(?!["'])/gi;
  html = html.replace(replitRegex, (match, url, user, replName) => {
    return createReplitEmbed(user, replName, theme);
  });

  return html;
}

/**
 * Create GitHub Gist embed
 * Note: Gist doesn't support theme parameter, it uses user's GitHub preference
 */
export function createGistEmbed(user, gistId) {
  const uniqueId = generateEmbedId('gist');
  return `
    <div class="artifactuse-gist-wrapper" id="${uniqueId}">
      <script src="https://gist.github.com/${user}/${gistId}.js"></script>
    </div>
  `;
}

/**
 * Create CodePen embed
 * @param {string} user - CodePen username
 * @param {string} penId - Pen ID
 * @param {string} theme - 'dark' | 'light'
 */
export function createCodePenEmbed(user, penId, theme = 'dark') {
  return `
    <div class="artifactuse-codepen-wrapper">
      <iframe 
        height="400" 
        style="width: 100%;" 
        scrolling="no" 
        src="https://codepen.io/${user}/embed/${penId}?default-tab=html%2Cresult&theme-id=${theme}" 
        frameborder="no" 
        loading="lazy" 
        allowtransparency="true" 
        allowfullscreen="true" 
        class="artifactuse-codepen-embed">
      </iframe>
    </div>
  `;
}

/**
 * Create CodeSandbox embed
 * @param {string} sandboxId - Sandbox ID
 * @param {string} theme - 'dark' | 'light'
 */
export function createCodeSandboxEmbed(sandboxId, theme = 'dark') {
  return `
    <div class="artifactuse-codesandbox-wrapper">
      <iframe 
        src="https://codesandbox.io/embed/${sandboxId}?fontsize=14&hidenavigation=1&theme=${theme}" 
        style="width:100%; height:500px; border:0; border-radius:8px; overflow:hidden;" 
        allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking" 
        sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts" 
        loading="lazy" 
        class="artifactuse-codesandbox-embed">
      </iframe>
    </div>
  `;
}

/**
 * Create JSFiddle embed
 * @param {string} user - JSFiddle username
 * @param {string} fiddleId - Fiddle ID
 * @param {string} theme - 'dark' | 'light'
 */
export function createJSFiddleEmbed(user, fiddleId, theme = 'dark') {
  return `
    <div class="artifactuse-jsfiddle-wrapper">
      <iframe 
        width="100%" 
        height="400" 
        src="https://jsfiddle.net/${user}/${fiddleId}/embedded/result,js,html,css/${theme}/" 
        allowfullscreen="allowfullscreen" 
        frameborder="0" 
        loading="lazy" 
        class="artifactuse-jsfiddle-embed">
      </iframe>
    </div>
  `;
}

/**
 * Create StackBlitz embed
 * @param {string} projectId - Project ID
 * @param {string} theme - 'dark' | 'light'
 */
export function createStackBlitzEmbed(projectId, theme = 'dark') {
  return `
    <div class="artifactuse-stackblitz-wrapper">
      <iframe 
        src="https://stackblitz.com/edit/${projectId}?embed=1&file=index.js&theme=${theme}" 
        style="width:100%; height:500px; border:0; border-radius:8px; overflow:hidden;" 
        loading="lazy" 
        class="artifactuse-stackblitz-embed">
      </iframe>
    </div>
  `;
}

/**
 * Create Replit embed
 * Note: Replit uses system/user preference for theme, parameter included for consistency
 * @param {string} user - Replit username
 * @param {string} replName - Repl name
 * @param {string} theme - 'dark' | 'light' (may not be honored by Replit)
 */
export function createReplitEmbed(user, replName, theme = 'dark') {
  return `
    <div class="artifactuse-replit-wrapper">
      <iframe 
        src="https://replit.com/@${user}/${replName}?embed=true&theme=${theme}" 
        style="width:100%; height:500px; border:0; border-radius:8px; overflow:hidden;" 
        loading="lazy" 
        class="artifactuse-replit-embed">
      </iframe>
    </div>
  `;
}

export default {
  processCodeEmbeds,
  createGistEmbed,
  createCodePenEmbed,
  createCodeSandboxEmbed,
  createJSFiddleEmbed,
  createStackBlitzEmbed,
  createReplitEmbed,
};
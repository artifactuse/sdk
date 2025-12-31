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
 */
export function processCodeEmbeds(html) {
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
    return createCodePenEmbed(user, penId);
  });

  // CodePen (raw)
  const codepenRegex = /(?<!["'=])(https?:\/\/codepen\.io\/([a-zA-Z0-9_-]+)\/(?:pen|full|details)\/([a-zA-Z0-9]+))(?!["'])/gi;
  html = html.replace(codepenRegex, (match, url, user, penId) => {
    return createCodePenEmbed(user, penId);
  });

  // CodeSandbox (linkified)
  const codesandboxLinkRegex = /<a[^>]*href="(https?:\/\/codesandbox\.io\/(?:s|embed)\/([a-zA-Z0-9-]+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(codesandboxLinkRegex, (match, url, sandboxId) => {
    return createCodeSandboxEmbed(sandboxId);
  });

  // CodeSandbox (raw)
  const codesandboxRegex = /(?<!["'=])(https?:\/\/codesandbox\.io\/(?:s|embed)\/([a-zA-Z0-9-]+))(?!["'])/gi;
  html = html.replace(codesandboxRegex, (match, url, sandboxId) => {
    return createCodeSandboxEmbed(sandboxId);
  });

  // JSFiddle (linkified)
  const jsfiddleLinkRegex = /<a[^>]*href="(https?:\/\/jsfiddle\.net\/([a-zA-Z0-9_]+)\/([a-zA-Z0-9]+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(jsfiddleLinkRegex, (match, url, user, fiddleId) => {
    return createJSFiddleEmbed(user, fiddleId);
  });

  // JSFiddle (raw)
  const jsfiddleRegex = /(?<!["'=])(https?:\/\/jsfiddle\.net\/([a-zA-Z0-9_]+)\/([a-zA-Z0-9]+))(?!["'])/gi;
  html = html.replace(jsfiddleRegex, (match, url, user, fiddleId) => {
    return createJSFiddleEmbed(user, fiddleId);
  });

  // StackBlitz (linkified)
  const stackblitzLinkRegex = /<a[^>]*href="(https?:\/\/stackblitz\.com\/(?:edit|embed)\/([a-zA-Z0-9-]+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(stackblitzLinkRegex, (match, url, projectId) => {
    return createStackBlitzEmbed(projectId);
  });

  // StackBlitz (raw)
  const stackblitzRegex = /(?<!["'=])(https?:\/\/stackblitz\.com\/(?:edit|embed)\/([a-zA-Z0-9-]+))(?!["'])/gi;
  html = html.replace(stackblitzRegex, (match, url, projectId) => {
    return createStackBlitzEmbed(projectId);
  });

  // Replit (linkified)
  const replitLinkRegex = /<a[^>]*href="(https?:\/\/replit\.com\/@([a-zA-Z0-9_]+)\/([a-zA-Z0-9_-]+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(replitLinkRegex, (match, url, user, replName) => {
    return createReplitEmbed(user, replName);
  });

  // Replit (raw)
  const replitRegex = /(?<!["'=])(https?:\/\/replit\.com\/@([a-zA-Z0-9_]+)\/([a-zA-Z0-9_-]+))(?!["'])/gi;
  html = html.replace(replitRegex, (match, url, user, replName) => {
    return createReplitEmbed(user, replName);
  });

  return html;
}

/**
 * Create GitHub Gist embed
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
 */
export function createCodePenEmbed(user, penId) {
  return `
    <div class="artifactuse-codepen-wrapper">
      <iframe 
        height="400" 
        style="width: 100%;" 
        scrolling="no" 
        src="https://codepen.io/${user}/embed/${penId}?default-tab=html%2Cresult&theme-id=dark" 
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
 */
export function createCodeSandboxEmbed(sandboxId) {
  return `
    <div class="artifactuse-codesandbox-wrapper">
      <iframe 
        src="https://codesandbox.io/embed/${sandboxId}?fontsize=14&hidenavigation=1&theme=dark" 
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
 */
export function createJSFiddleEmbed(user, fiddleId) {
  return `
    <div class="artifactuse-jsfiddle-wrapper">
      <iframe 
        width="100%" 
        height="400" 
        src="https://jsfiddle.net/${user}/${fiddleId}/embedded/result,js,html,css/dark/" 
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
 */
export function createStackBlitzEmbed(projectId) {
  return `
    <div class="artifactuse-stackblitz-wrapper">
      <iframe 
        src="https://stackblitz.com/edit/${projectId}?embed=1&file=index.js&theme=dark" 
        style="width:100%; height:500px; border:0; border-radius:8px; overflow:hidden;" 
        loading="lazy" 
        class="artifactuse-stackblitz-embed">
      </iframe>
    </div>
  `;
}

/**
 * Create Replit embed
 */
export function createReplitEmbed(user, replName) {
  return `
    <div class="artifactuse-replit-wrapper">
      <iframe 
        src="https://replit.com/@${user}/${replName}?embed=true" 
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
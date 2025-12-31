// processors/design.js
// Handles 3D and design embeds: Sketchfab, Figma, Canva, Dribbble, Behance

/**
 * Process all 3D and design URLs in HTML
 */
export function process3DEmbeds(html) {
  // Sketchfab (linkified)
  const sketchfabLinkRegex = /<a[^>]*href="(https?:\/\/sketchfab\.com\/(?:3d-)?models\/([a-zA-Z0-9-]+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(sketchfabLinkRegex, (match, url, modelId) => {
    return createSketchfabEmbed(modelId);
  });

  // Sketchfab (raw)
  const sketchfabRegex = /(?<!["'=])(https?:\/\/sketchfab\.com\/(?:3d-)?models\/([a-zA-Z0-9-]+))(?!["'])/gi;
  html = html.replace(sketchfabRegex, (match, url, modelId) => {
    return createSketchfabEmbed(modelId);
  });

  // Figma file (linkified)
  const figmaFileLinkRegex = /<a[^>]*href="(https?:\/\/(?:www\.)?figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)(?:\/[^?\s"]*)?(?:\?node-id=([^&\s"]+))?[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(figmaFileLinkRegex, (match, url, fileKey, nodeId) => {
    return createFigmaEmbed(fileKey, nodeId);
  });

  // Figma file (raw)
  const figmaFileRegex = /(?<!["'=])(https?:\/\/(?:www\.)?figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)(?:\/[^?\s]*)?(?:\?node-id=([^&\s]+))?)(?!["'])/gi;
  html = html.replace(figmaFileRegex, (match, url, fileKey, nodeId) => {
    return createFigmaEmbed(fileKey, nodeId);
  });

  // Figma prototype (linkified)
  const figmaProtoLinkRegex = /<a[^>]*href="(https?:\/\/(?:www\.)?figma\.com\/proto\/([a-zA-Z0-9]+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(figmaProtoLinkRegex, (match, url, fileKey) => {
    return createFigmaPrototypeEmbed(fileKey, url);
  });

  // Figma prototype (raw)
  const figmaProtoRegex = /(?<!["'=])(https?:\/\/(?:www\.)?figma\.com\/proto\/([a-zA-Z0-9]+)[^\s]*)(?!["'])/gi;
  html = html.replace(figmaProtoRegex, (match, url, fileKey) => {
    return createFigmaPrototypeEmbed(fileKey, url);
  });

  // Canva (linkified)
  const canvaLinkRegex = /<a[^>]*href="(https?:\/\/(?:www\.)?canva\.com\/design\/([a-zA-Z0-9_-]+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(canvaLinkRegex, (match, url, designId) => {
    return createCanvaEmbed(designId, url);
  });

  // Canva (raw)
  const canvaRegex = /(?<!["'=])(https?:\/\/(?:www\.)?canva\.com\/design\/([a-zA-Z0-9_-]+)[^\s]*)(?!["'])/gi;
  html = html.replace(canvaRegex, (match, url, designId) => {
    return createCanvaEmbed(designId, url);
  });

  // Dribbble (linkified)
  const dribbbleLinkRegex = /<a[^>]*href="(https?:\/\/dribbble\.com\/shots\/(\d+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(dribbbleLinkRegex, (match, url, shotId) => {
    return createDribbbleEmbed(shotId);
  });

  // Dribbble (raw)
  const dribbbleRegex = /(?<!["'=])(https?:\/\/dribbble\.com\/shots\/(\d+))(?!["'])/gi;
  html = html.replace(dribbbleRegex, (match, url, shotId) => {
    return createDribbbleEmbed(shotId);
  });

  // Behance (linkified)
  const behanceLinkRegex = /<a[^>]*href="(https?:\/\/(?:www\.)?behance\.net\/gallery\/(\d+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(behanceLinkRegex, (match, url, projectId) => {
    return createBehanceEmbed(projectId, url);
  });

  // Behance (raw)
  const behanceRegex = /(?<!["'=])(https?:\/\/(?:www\.)?behance\.net\/gallery\/(\d+)[^\s]*)(?!["'])/gi;
  html = html.replace(behanceRegex, (match, url, projectId) => {
    return createBehanceEmbed(projectId, url);
  });

  return html;
}

/**
 * Create Sketchfab 3D model embed
 */
export function createSketchfabEmbed(modelId) {
  return `
    <div class="artifactuse-sketchfab-wrapper">
      <iframe 
        src="https://sketchfab.com/models/${modelId}/embed?autostart=1&ui_theme=dark" 
        frameborder="0" 
        allow="autoplay; fullscreen; xr-spatial-tracking" 
        mozallowfullscreen="true" 
        webkitallowfullscreen="true" 
        class="artifactuse-sketchfab-iframe" 
        loading="lazy">
      </iframe>
    </div>
  `;
}

/**
 * Create Figma file embed
 */
export function createFigmaEmbed(fileKey, nodeId) {
  const nodeParam = nodeId ? `&node-id=${nodeId}` : '';
  return `
    <div class="artifactuse-figma-wrapper">
      <iframe 
        src="https://www.figma.com/embed?embed_host=share&url=https://www.figma.com/file/${fileKey}${nodeParam}" 
        class="artifactuse-figma-iframe" 
        allowfullscreen 
        loading="lazy">
      </iframe>
    </div>
  `;
}

/**
 * Create Figma prototype embed
 */
export function createFigmaPrototypeEmbed(fileKey, originalUrl) {
  const encodedUrl = encodeURIComponent(originalUrl);
  return `
    <div class="artifactuse-figma-wrapper">
      <iframe 
        src="https://www.figma.com/embed?embed_host=share&url=${encodedUrl}" 
        class="artifactuse-figma-iframe" 
        allowfullscreen 
        loading="lazy">
      </iframe>
    </div>
  `;
}

/**
 * Create Canva embed (placeholder with link - Canva doesn't support direct embeds)
 */
export function createCanvaEmbed(designId, originalUrl) {
  return `
    <div class="artifactuse-canva-wrapper">
      <div class="artifactuse-canva-preview">
        <div class="artifactuse-canva-placeholder">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="artifactuse-canva-icon">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
          <p>Canva Design</p>
          <a href="${originalUrl}" target="_blank" rel="noopener" class="artifactuse-canva-link">View on Canva</a>
        </div>
      </div>
    </div>
  `;
}

/**
 * Create Dribbble shot embed
 */
export function createDribbbleEmbed(shotId) {
  return `
    <div class="artifactuse-dribbble-wrapper">
      <iframe 
        src="https://dribbble.com/shots/${shotId}/embed" 
        class="artifactuse-dribbble-iframe" 
        allowfullscreen 
        loading="lazy">
      </iframe>
    </div>
  `;
}

/**
 * Create Behance project embed
 */
export function createBehanceEmbed(projectId, originalUrl) {
  return `
    <div class="artifactuse-behance-wrapper">
      <iframe 
        src="https://www.behance.net/embed/project/${projectId}?ilo0=1" 
        class="artifactuse-behance-iframe" 
        allowfullscreen 
        loading="lazy">
      </iframe>
      <div class="artifactuse-embed-fallback">
        <a href="${originalUrl}" target="_blank" rel="noopener">View on Behance</a>
      </div>
    </div>
  `;
}

export default {
  process3DEmbeds,
  createSketchfabEmbed,
  createFigmaEmbed,
  createFigmaPrototypeEmbed,
  createCanvaEmbed,
  createDribbbleEmbed,
  createBehanceEmbed,
};
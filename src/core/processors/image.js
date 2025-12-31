// processors/image.js
// Handles image rendering and gallery creation

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif'];

/**
 * Process all image URLs in HTML (linkified and raw)
 */
export function processImages(html) {
  const protectedContent = [];
  
  // Protect <pre>...</pre> blocks
  html = html.replace(/<pre[^>]*>[\s\S]*?<\/pre>/gi, (match) => {
    const placeholder = `__IMG_PROTECTED_${protectedContent.length}__`;
    protectedContent.push(match);
    return placeholder;
  });
  
  // Protect inline <code>...</code> tags
  html = html.replace(/<code[^>]*>[\s\S]*?<\/code>/gi, (match) => {
    const placeholder = `__IMG_PROTECTED_${protectedContent.length}__`;
    protectedContent.push(match);
    return placeholder;
  });
  
  // Protect existing <img> tags
  html = html.replace(/<img[^>]*>/gi, (match) => {
    const placeholder = `__IMG_PROTECTED_${protectedContent.length}__`;
    protectedContent.push(match);
    return placeholder;
  });

  // Protect existing image containers (already processed images)
  html = html.replace(/<div class="(?:artifactuse-)?image-container">[\s\S]*?<\/div>\s*<\/div>/gi, (match) => {
    const placeholder = `__IMG_PROTECTED_${protectedContent.length}__`;
    protectedContent.push(match);
    return placeholder;
  });

  const extPattern = IMAGE_EXTENSIONS.join('|');
  
  // Process linkified image URLs: <a href="image.jpg">text</a>
  const imageLinkRegex = new RegExp(
    `<a[^>]*href="(https?:\\/\\/[^"]+\\.(?:${extPattern})(?:\\?[^"]*)?)"[^>]*>([^<]*)<\\/a>`,
    'gi'
  );
  html = html.replace(imageLinkRegex, (match, imageUrl, linkText) => {
    const meaningfulText = linkText && !linkText.match(/^(view|see|open|click|image|photo|picture)$/i) 
      ? linkText 
      : '';
    return renderImageHtml(imageUrl, meaningfulText, meaningfulText);
  });

  // Process raw image URLs (not already in tags)
  const rawImageRegex = new RegExp(
    `(?<!["'=])(https?:\\/\\/[^\\s<>"]+\\.(?:${extPattern})(\\?[^\\s<>"]*)?)(?!["'])`,
    'gi'
  );
  html = html.replace(rawImageRegex, (match, imageUrl) => {
    return renderImageHtml(imageUrl, '', '');
  });

  // Restore all protected content
  for (let i = protectedContent.length - 1; i >= 0; i--) {
    html = html.replace(`__IMG_PROTECTED_${i}__`, protectedContent[i]);
  }

  return html;
}

/**
 * Render a single image with lightbox support
 */
export function renderImageHtml(src, title, alt) {
  const caption = title || alt || '';
  let imageClass = 'artifactuse-image';
  
  // Detect image type for styling hints
  if (src.includes('large2x') || src.includes('large') || alt?.toLowerCase().includes('hero')) {
    imageClass = 'artifactuse-hero-image';
  } else if (src.includes('small') || src.includes('tiny')) {
    imageClass = 'artifactuse-inline-image';
  } else if (alt?.toLowerCase().includes('aerial') || alt?.toLowerCase().includes('view')) {
    imageClass = 'artifactuse-hero-image';
  }
  
  let html = `<div class="artifactuse-image-container">`;
  html += `<img src="${src}" alt="${alt || ''}" class="${imageClass}" data-lightbox="true" data-caption="${caption}" loading="lazy" />`;
  
  if (caption) {
    html += `<div class="artifactuse-image-caption">${caption}</div>`;
  }
  html += '</div>';
  
  return html;
}

/**
 * Process HTML to group consecutive images into galleries
 */
export function processImageGalleries(html) {
  const lines = html.split('\n');
  const processedLines = [];
  let currentImageGroup = [];
  let inImageSequence = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.includes('<div class="artifactuse-image-container">')) {
      if (!inImageSequence) {
        inImageSequence = true;
        currentImageGroup = [];
      }
      
      // Collect the full image container (may span multiple lines)
      let imageHtml = '';
      let j = i;
      let openDivs = 0;
      
      while (j < lines.length) {
        const currentLine = lines[j];
        imageHtml += currentLine + '\n';
        openDivs += (currentLine.match(/<div/g) || []).length;
        openDivs -= (currentLine.match(/<\/div>/g) || []).length;
        if (openDivs === 0) break;
        j++;
      }
      
      currentImageGroup.push(imageHtml.trim());
      i = j;
      
    } else if (line === '' || line.match(/^\s*$/)) {
      // Empty lines - continue sequence if we're in one
      if (inImageSequence) continue;
      else processedLines.push(lines[i]);
      
    } else {
      // Non-image content - flush any pending images
      if (inImageSequence && currentImageGroup.length >= 2) {
        const galleryHtml = createImageGallery(currentImageGroup);
        processedLines.push(galleryHtml);
      } else if (inImageSequence && currentImageGroup.length === 1) {
        processedLines.push(currentImageGroup[0]);
      }
      
      inImageSequence = false;
      currentImageGroup = [];
      processedLines.push(lines[i]);
    }
  }
  
  // Handle remaining images at end
  if (inImageSequence && currentImageGroup.length >= 2) {
    const galleryHtml = createImageGallery(currentImageGroup);
    processedLines.push(galleryHtml);
  } else if (inImageSequence && currentImageGroup.length === 1) {
    processedLines.push(currentImageGroup[0]);
  }
  
  return processedLines.join('\n');
}

/**
 * Create a gallery wrapper for multiple images
 */
export function createImageGallery(imageContainers) {
  const galleryItems = imageContainers.map(container => {
    return container
      .replace('artifactuse-image-container', 'artifactuse-gallery-item')
      .replace('artifactuse-image-caption', 'artifactuse-gallery-caption')
      .replace('artifactuse-image', 'artifactuse-gallery-image')
      .replace('artifactuse-hero-image', 'artifactuse-gallery-image')
      .replace('artifactuse-inline-image', 'artifactuse-gallery-image');
  }).join('\n');
  
  return `<div class="artifactuse-image-gallery">\n${galleryItems}\n</div>`;
}

export default {
  processImages,
  renderImageHtml,
  processImageGalleries,
  createImageGallery,
};
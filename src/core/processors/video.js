// processors/video.js
// Handles video embeds: direct files, YouTube, Vimeo, Loom, Dailymotion, Pexels

/**
 * Video file extensions
 */
const VIDEO_EXTENSIONS = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'wmv', 'm4v'];

/**
 * Check if a URL is a video URL (direct file or platform embed)
 * @param {string} url - URL to check
 * @returns {boolean} - True if URL is a video
 */
export function isVideoUrl(url) {
  if (!url) return false;
  
  // Direct video files
  const extPattern = VIDEO_EXTENSIONS.join('|');
  const directVideoRegex = new RegExp(`\\.(${extPattern})(\\?.*)?$`, 'i');
  if (directVideoRegex.test(url)) return true;
  
  // YouTube
  if (/(?:youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]+/.test(url)) return true;
  
  // Vimeo
  if (/vimeo\.com\/\d+/.test(url)) return true;
  
  // Loom
  if (/loom\.com\/share\/[a-zA-Z0-9]+/.test(url)) return true;
  
  // Dailymotion
  if (/dailymotion\.com\/video\/[a-zA-Z0-9]+/.test(url)) return true;
  
  return false;
}

/**
 * Parse video URL and return type and ID
 * @param {string} url - Video URL
 * @returns {object} - { type: string, id: string } or null
 */
function parseVideoUrl(url) {
  if (!url) return null;
  
  // YouTube
  let match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (match) return { type: 'youtube', id: match[1] };
  
  // Vimeo
  match = url.match(/vimeo\.com\/(\d+)/);
  if (match) return { type: 'vimeo', id: match[1] };
  
  // Loom
  match = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
  if (match) return { type: 'loom', id: match[1] };
  
  // Dailymotion
  match = url.match(/dailymotion\.com\/video\/([a-zA-Z0-9]+)/);
  if (match) return { type: 'dailymotion', id: match[1] };
  
  // Direct video files
  const extPattern = VIDEO_EXTENSIONS.join('|');
  const directVideoRegex = new RegExp(`\\.(${extPattern})(\\?.*)?$`, 'i');
  if (directVideoRegex.test(url)) return { type: 'direct', id: url };
  
  return null;
}

/**
 * Render video HTML from URL (used by marked renderer)
 * Similar to renderImageHtml for images
 * @param {string} url - Video URL
 * @returns {string} - HTML string
 */
export function renderVideoHtml(url) {
  const parsed = parseVideoUrl(url);
  if (!parsed) return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
  
  switch (parsed.type) {
    case 'youtube':
      return createYouTubeEmbed(parsed.id);
    case 'vimeo':
      return createVimeoEmbed(parsed.id);
    case 'loom':
      return createLoomEmbed(parsed.id);
    case 'dailymotion':
      return createDailymotionEmbed(parsed.id);
    case 'direct':
      return createVideoPlayer(parsed.id);
    default:
      return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
  }
}

/**
 * Process all video URLs in HTML
 */
export function processVideos(html) {
  const protectedContent = [];
  
  // Protect <pre>...</pre> blocks
  html = html.replace(/<pre[^>]*>[\s\S]*?<\/pre>/gi, (match) => {
    const placeholder = `__PROTECTED_${protectedContent.length}__`;
    protectedContent.push(match);
    return placeholder;
  });
  
  // Protect inline <code>...</code> tags
  html = html.replace(/<code[^>]*>[\s\S]*?<\/code>/gi, (match) => {
    const placeholder = `__PROTECTED_${protectedContent.length}__`;
    protectedContent.push(match);
    return placeholder;
  });
  
  // Protect existing video/audio/iframe tags
  html = html.replace(/<(video|audio|iframe)[^>]*>[\s\S]*?<\/\1>/gi, (match) => {
    const placeholder = `__PROTECTED_${protectedContent.length}__`;
    protectedContent.push(match);
    return placeholder;
  });

  // Pexels video with preview image pattern
  const pexelsVideoPattern = /\[([^\]]+)\]\((https:\/\/www\.pexels\.com\/video\/[^)]+)\)\s*(?:<\/p>)?\s*(?:<p>)?\s*(?:Preview image:\s*)?!\[([^\]]*)\]\((https:\/\/images\.pexels\.com\/videos\/[^)]+)\)/gi;
  html = html.replace(pexelsVideoPattern, (match, linkText, videoUrl, imageAlt, previewImage) => {
    return createVideoWithPreview(linkText, videoUrl, previewImage, imageAlt);
  });

  // Direct video files (linkified)
  const videoFileLinkRegex = /<a[^>]*href="(https?:\/\/[^"]+\.(mp4|webm|mov|avi|mkv|flv|wmv|m4v)(?:\?[^"]*)?)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(videoFileLinkRegex, (match, videoUrl) => {
    return createVideoPlayer(videoUrl);
  });

  // Direct video files (raw)
  const videoFileRegex = /(?<!["'=])(https?:\/\/[^\s<>"]+\.(mp4|webm|mov|avi|mkv|flv|wmv|m4v)(\?[^\s<>"]*)?)(?!["'])/gi;
  html = html.replace(videoFileRegex, (match, videoUrl) => {
    return createVideoPlayer(videoUrl);
  });

  // YouTube (linkified)
  const youtubeLinkRegex = /<a[^>]*href="(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(youtubeLinkRegex, (match, url, videoId) => {
    return createYouTubeEmbed(videoId);
  });

  // YouTube (raw)
  const youtubeRegex = /(?<!["'=])(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+))(?!["'])/gi;
  html = html.replace(youtubeRegex, (match, url, videoId) => {
    return createYouTubeEmbed(videoId);
  });

  // Vimeo (linkified)
  const vimeoLinkRegex = /<a[^>]*href="(https?:\/\/(?:www\.)?vimeo\.com\/(\d+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(vimeoLinkRegex, (match, url, videoId) => {
    return createVimeoEmbed(videoId);
  });

  // Vimeo (raw)
  const vimeoRegex = /(?<!["'=])(https?:\/\/(?:www\.)?vimeo\.com\/(\d+))(?!["'])/gi;
  html = html.replace(vimeoRegex, (match, url, videoId) => {
    return createVimeoEmbed(videoId);
  });

  // Loom (linkified)
  const loomLinkRegex = /<a[^>]*href="(https?:\/\/(?:www\.)?loom\.com\/share\/([a-zA-Z0-9]+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(loomLinkRegex, (match, url, videoId) => {
    return createLoomEmbed(videoId);
  });

  // Loom (raw)
  const loomRegex = /(?<!["'=])(https?:\/\/(?:www\.)?loom\.com\/share\/([a-zA-Z0-9]+))(?!["'])/gi;
  html = html.replace(loomRegex, (match, url, videoId) => {
    return createLoomEmbed(videoId);
  });

  // Dailymotion (linkified)
  const dailymotionLinkRegex = /<a[^>]*href="(https?:\/\/(?:www\.)?dailymotion\.com\/video\/([a-zA-Z0-9]+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(dailymotionLinkRegex, (match, url, videoId) => {
    return createDailymotionEmbed(videoId);
  });

  // Dailymotion (raw)
  const dailymotionRegex = /(?<!["'=])(https?:\/\/(?:www\.)?dailymotion\.com\/video\/([a-zA-Z0-9]+))(?!["'])/gi;
  html = html.replace(dailymotionRegex, (match, url, videoId) => {
    return createDailymotionEmbed(videoId);
  });

  // Restore all protected content
  for (let i = protectedContent.length - 1; i >= 0; i--) {
    html = html.replace(`__PROTECTED_${i}__`, protectedContent[i]);
  }

  return html;
}

/**
 * Get MIME type from video URL
 */
function getVideoMimeType(url) {
  const extension = url.split('?')[0].split('.').pop().toLowerCase();
  const mimeTypes = {
    'mp4': 'video/mp4',
    'm4v': 'video/mp4',
    'webm': 'video/webm',
    'mov': 'video/quicktime',
    'avi': 'video/x-msvideo',
    'mkv': 'video/x-matroska',
    'flv': 'video/x-flv',
    'wmv': 'video/x-ms-wmv',
  };
  return mimeTypes[extension] || 'video/mp4';
}

/**
 * Create HTML5 video player
 */
export function createVideoPlayer(videoUrl) {
  const mimeType = getVideoMimeType(videoUrl);
  return `<div class="artifactuse-video-wrapper"><video controls preload="metadata" class="artifactuse-video"><source src="${videoUrl}" type="${mimeType}">Your browser does not support the video tag.</video></div>`;
}

/**
 * Create video with preview image (Pexels style)
 */
export function createVideoWithPreview(title, videoUrl, previewImage, alt) {
  return `<div class="artifactuse-video-preview-container"><div class="artifactuse-video-preview-wrapper" data-video-url="${videoUrl}"><img src="${previewImage}" alt="${alt}" class="artifactuse-video-preview-image" loading="lazy" /><div class="artifactuse-video-play-overlay"><svg class="artifactuse-play-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></div><div class="artifactuse-video-info-overlay"><h4 class="artifactuse-video-title">${title}</h4><p class="artifactuse-video-alt">${alt}</p></div></div><div class="artifactuse-video-actions"><a href="${videoUrl}" target="_blank" rel="noopener" class="artifactuse-video-link">Watch on Pexels</a></div></div>`;
}

/**
 * Create lazy-loaded YouTube embed with thumbnail preview
 */
export function createYouTubeEmbed(videoId) {
  const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  const onclickHandler = `this.parentElement.innerHTML='<iframe src=\\'${embedUrl}\\' frameborder=\\'0\\' allow=\\'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture\\' allowfullscreen class=\\'artifactuse-video-iframe\\'></iframe>'`;
  
  return `<div class="artifactuse-video-wrapper artifactuse-video-lazy" data-video-type="youtube" data-video-id="${videoId}"><button type="button" class="artifactuse-video-facade" aria-label="Play YouTube video" onclick="${onclickHandler}"><img src="${thumbnailUrl}" alt="YouTube video thumbnail" class="artifactuse-video-thumbnail" loading="lazy" /><div class="artifactuse-video-play-button artifactuse-youtube-play"><svg viewBox="0 0 68 48" width="68" height="48"><path class="artifactuse-youtube-play-bg" d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55 C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z" fill="#f00"/><path d="M 45,24 27,14 27,34" fill="#fff"/></svg></div></button></div>`;
}

/**
 * Create lazy-loaded Vimeo embed with thumbnail preview
 */
export function createVimeoEmbed(videoId) {
  const embedUrl = `https://player.vimeo.com/video/${videoId}?autoplay=1`;
  const thumbnailUrl = `https://vumbnail.com/${videoId}.jpg`;
  const onclickHandler = `this.parentElement.innerHTML='<iframe src=\\'${embedUrl}\\' frameborder=\\'0\\' allow=\\'autoplay; fullscreen; picture-in-picture\\' allowfullscreen class=\\'artifactuse-video-iframe\\'></iframe>'`;
  
  return `<div class="artifactuse-video-wrapper artifactuse-video-lazy" data-video-type="vimeo" data-video-id="${videoId}"><button type="button" class="artifactuse-video-facade" aria-label="Play Vimeo video" onclick="${onclickHandler}"><img src="${thumbnailUrl}" alt="Vimeo video thumbnail" class="artifactuse-video-thumbnail" loading="lazy" onerror="this.style.display='none'" /><div class="artifactuse-video-play-button artifactuse-vimeo-play"><svg viewBox="0 0 64 64" width="64" height="64"><circle cx="32" cy="32" r="31" fill="#1ab7ea"/><path d="M26 20 L26 44 L46 32 Z" fill="#fff"/></svg></div></button></div>`;
}

/**
 * Create lazy-loaded Loom embed with thumbnail preview
 */
export function createLoomEmbed(videoId) {
  const embedUrl = `https://www.loom.com/embed/${videoId}?autoplay=1`;
  const thumbnailUrl = `https://cdn.loom.com/sessions/thumbnails/${videoId}-with-play.gif`;
  const onclickHandler = `this.parentElement.innerHTML='<iframe src=\\'${embedUrl}\\' frameborder=\\'0\\' allowfullscreen class=\\'artifactuse-video-iframe\\'></iframe>'`;
  
  return `<div class="artifactuse-video-wrapper artifactuse-video-lazy" data-video-type="loom" data-video-id="${videoId}"><button type="button" class="artifactuse-video-facade" aria-label="Play Loom video" onclick="${onclickHandler}"><img src="${thumbnailUrl}" alt="Loom video thumbnail" class="artifactuse-video-thumbnail" loading="lazy" onerror="this.style.display='none'" /><div class="artifactuse-video-play-button artifactuse-loom-play"><svg viewBox="0 0 64 64" width="64" height="64"><circle cx="32" cy="32" r="31" fill="#625df5"/><path d="M26 20 L26 44 L46 32 Z" fill="#fff"/></svg></div></button></div>`;
}

/**
 * Create lazy-loaded Dailymotion embed with thumbnail preview
 */
export function createDailymotionEmbed(videoId) {
  const embedUrl = `https://www.dailymotion.com/embed/video/${videoId}?autoplay=1`;
  const thumbnailUrl = `https://www.dailymotion.com/thumbnail/video/${videoId}`;
  const onclickHandler = `this.parentElement.innerHTML='<iframe src=\\'${embedUrl}\\' frameborder=\\'0\\' allow=\\'autoplay; fullscreen; picture-in-picture\\' allowfullscreen class=\\'artifactuse-video-iframe\\'></iframe>'`;
  
  return `<div class="artifactuse-video-wrapper artifactuse-video-lazy" data-video-type="dailymotion" data-video-id="${videoId}"><button type="button" class="artifactuse-video-facade" aria-label="Play Dailymotion video" onclick="${onclickHandler}"><img src="${thumbnailUrl}" alt="Dailymotion video thumbnail" class="artifactuse-video-thumbnail" loading="lazy" onerror="this.style.display='none'" /><div class="artifactuse-video-play-button artifactuse-dailymotion-play"><svg viewBox="0 0 64 64" width="64" height="64"><circle cx="32" cy="32" r="31" fill="#0066dc"/><path d="M26 20 L26 44 L46 32 Z" fill="#fff"/></svg></div></button></div>`;
}

/**
 * Check if content between videos is "empty" (whitespace, empty p tags, br tags, or caption paragraphs)
 * Handles cases like: "</p>\n<p>Caption text:<br>" where tags are split across video boundaries
 */
function isEmptyOrCaptionContent(content) {
  let cleaned = content
    // Remove closing </p> tags (from previous elements)
    .replace(/<\/p>/g, '')
    // Remove opening <p> tags
    .replace(/<p>/g, '')
    // Remove <br> tags
    .replace(/<br\s*\/?>/g, '')
    // Remove inline formatting tags and their content for checking purposes
    .replace(/<strong>.*?<\/strong>/g, '')
    .replace(/<em>.*?<\/em>/g, '')
    .replace(/<b>.*?<\/b>/g, '')
    .replace(/<i>.*?<\/i>/g, '')
    // Remove newlines
    .replace(/\n/g, '')
    // Remove all whitespace
    .replace(/\s+/g, '')
    .trim();
  
  // After removing tags, check if only text content remains
  // Text content (like "HBO GO now works with Chromecast:") is allowed as caption
  // We consider it "empty" if it's just caption text (less than 200 chars, no complex HTML)
  
  // Check for any remaining HTML tags that aren't simple formatting
  const hasComplexHtml = /<(?!\/)[^>]+>/.test(cleaned);
  
  // If there's complex HTML left, it's not empty
  if (hasComplexHtml) {
    return false;
  }
  
  // If only plain text remains (caption), consider it empty/passable
  // This allows captions like "HBO GO now works with Chromecast:" between videos
  return cleaned.length < 200;
}

/**
 * Extract caption from content before a video
 * Handles cases like: "</p>\n<p>Caption text:<br>" 
 */
function extractCaptionBefore(content) {
  // Try to match <p>content</p> or <p>content<br></p> patterns
  let match = content.match(/<p>((?:[^<]|<(?!\/p>))*?)(?:<br\s*\/?>)?\s*<\/p>\s*$/);
  if (match) {
    const captionContent = match[1].trim();
    const textOnly = captionContent.replace(/<[^>]*>/g, '').trim();
    if (textOnly.length > 0 && textOnly.length < 200) {
      return captionContent;
    }
  }
  
  // Handle case where </p> is at start and <p>content<br> at end (no closing </p>)
  // This is the pattern: "</p>\n<p>Caption text:<br>"
  match = content.match(/<p>((?:[^<]|<(?!\/p>|p>))*?)(?:<br\s*\/?>)?\s*$/);
  if (match) {
    const captionContent = match[1].trim();
    const textOnly = captionContent.replace(/<[^>]*>/g, '').trim();
    if (textOnly.length > 0 && textOnly.length < 200) {
      return captionContent;
    }
  }
  
  return '';
}

/**
 * Process HTML to group consecutive videos into galleries
 * Uses regex-based approach to handle single-line HTML
 */
export function processVideoGalleries(html) {
  // Step 1: Find all video divs with their positions
  const videoRegex = /<div class="artifactuse-video-(wrapper|preview-container)/g;
  const videos = [];
  let match;
  
  while ((match = videoRegex.exec(html)) !== null) {
    const startIndex = match.index;
    
    // Find the complete div by counting open/close div tags
    let depth = 0;
    let endIndex = startIndex;
    
    for (let i = startIndex; i < html.length; i++) {
      if (html.substring(i, i + 4) === '<div') {
        depth++;
      } else if (html.substring(i, i + 6) === '</div>') {
        depth--;
        if (depth === 0) {
          endIndex = i + 6;
          break;
        }
      }
    }
    
    videos.push({
      start: startIndex,
      end: endIndex,
      html: html.substring(startIndex, endIndex)
    });
  }
  
  if (videos.length < 2) {
    // Not enough videos for a gallery, just clean up empty p tags
    return html.replace(/<p>\s*<\/p>/g, '');
  }
  
  // Step 2: Group consecutive videos
  const groups = [];
  let currentGroup = [{
    ...videos[0],
    caption: extractCaptionBefore(html.substring(0, videos[0].start))
  }];
  
  for (let i = 1; i < videos.length; i++) {
    const prevVideo = videos[i - 1];
    const currVideo = videos[i];
    const between = html.substring(prevVideo.end, currVideo.start);
    
    if (isEmptyOrCaptionContent(between)) {
      // Videos are consecutive - add to current group
      currentGroup.push({
        ...currVideo,
        caption: extractCaptionBefore(between)
      });
    } else {
      // Not consecutive - save current group, start new one
      groups.push([...currentGroup]);
      currentGroup = [{
        ...currVideo,
        caption: extractCaptionBefore(html.substring(prevVideo.end, currVideo.start))
      }];
    }
  }
  groups.push(currentGroup);
  
  // Step 3: Build output
  let result = '';
  let lastEnd = 0;
  
  for (const group of groups) {
    if (group.length === 0) continue;
    
    // Find where this group starts (before first video's caption)
    const firstVideo = group[0];
    let groupStart = firstVideo.start;
    
    // Look for caption before first video
    const beforeFirst = html.substring(lastEnd, firstVideo.start);
    const captionMatch = beforeFirst.match(/<p>((?:[^<]|<(?!\/p>))*?)(?:<br\s*\/?>)?\s*<\/p>\s*$/);
    if (captionMatch) {
      groupStart = firstVideo.start - captionMatch[0].length;
      group[0].caption = captionMatch[1].trim();
    }
    
    // Add content before this group
    result += html.substring(lastEnd, groupStart);
    
    if (group.length >= 2) {
      // Create gallery
      result += createVideoGallery(group);
    } else {
      // Single video - output as-is with optional caption
      const v = group[0];
      if (v.caption) {
        result += `<div class="artifactuse-video-container">${v.html}<div class="artifactuse-video-caption">${v.caption}</div></div>`;
      } else {
        result += v.html;
      }
    }
    
    lastEnd = group[group.length - 1].end;
  }
  
  // Add remaining content
  result += html.substring(lastEnd);
  
  // Clean up empty paragraphs
  result = result.replace(/<p>\s*<\/p>/g, '');
  
  return result;
}

/**
 * Create a gallery wrapper for multiple videos with captions
 */
export function createVideoGallery(videoDataArray) {
  const galleryItems = videoDataArray.map(({ html: video, caption }) => {
    // Add gallery item class
    let modified = video.replace(
      /class="artifactuse-video-wrapper/g,
      'class="artifactuse-video-gallery-item artifactuse-video-wrapper'
    );
    modified = modified.replace(
      /class="artifactuse-video-preview-container/g,
      'class="artifactuse-video-gallery-item artifactuse-video-preview-container'
    );
    
    // Add caption if present
    if (caption) {
      return `<div class="artifactuse-video-item-container">${modified}<div class="artifactuse-video-caption">${caption}</div></div>`;
    }
    
    return modified;
  }).join('\n');
  
  return `<div class="artifactuse-video-gallery">\n${galleryItems}\n</div>`;
}

/**
 * Initialize video facades - attach click handlers for lazy loading
 */
export function initializeVideoFacades(container = document) {
  const facades = container.querySelectorAll('.artifactuse-video-facade:not([data-initialized])');
  
  facades.forEach(facade => {
    facade.setAttribute('data-initialized', 'true');
    
    facade.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        facade.click();
      }
    });
  });
}

export default {
  isVideoUrl,
  renderVideoHtml,
  processVideos,
  processVideoGalleries,
  createVideoPlayer,
  createVideoWithPreview,
  createVideoGallery,
  createYouTubeEmbed,
  createVimeoEmbed,
  createLoomEmbed,
  createDailymotionEmbed,
  initializeVideoFacades,
};
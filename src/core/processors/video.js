// processors/video.js
// Handles video embeds: direct files, YouTube, Vimeo, Loom, Dailymotion, Pexels

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
  return `
    <div class="artifactuse-video-wrapper">
      <video controls preload="metadata" class="artifactuse-video">
        <source src="${videoUrl}" type="${mimeType}">
        Your browser does not support the video tag.
      </video>
    </div>
  `;
}

/**
 * Create video with preview image (Pexels style)
 */
export function createVideoWithPreview(title, videoUrl, previewImage, alt) {
  return `
    <div class="artifactuse-video-preview-container">
      <div class="artifactuse-video-preview-wrapper" data-video-url="${videoUrl}">
        <img src="${previewImage}" alt="${alt}" class="artifactuse-video-preview-image" loading="lazy" />
        <div class="artifactuse-video-play-overlay">
          <svg class="artifactuse-play-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
        <div class="artifactuse-video-info-overlay">
          <h4 class="artifactuse-video-title">${title}</h4>
          <p class="artifactuse-video-alt">${alt}</p>
        </div>
      </div>
      <div class="artifactuse-video-actions">
        <a href="${videoUrl}" target="_blank" rel="noopener" class="artifactuse-video-link">Watch on Pexels</a>
      </div>
    </div>
  `;
}

/**
 * Create lazy-loaded YouTube embed with thumbnail preview
 * Only loads iframe when user clicks play
 */
export function createYouTubeEmbed(videoId) {
  // YouTube provides multiple thumbnail qualities:
  // maxresdefault.jpg (1280x720) - may not exist for all videos
  // sddefault.jpg (640x480)
  // hqdefault.jpg (480x360)
  // mqdefault.jpg (320x180)
  const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  
  return `
    <div class="artifactuse-video-wrapper artifactuse-video-lazy" data-video-type="youtube" data-video-id="${videoId}">
      <button 
        type="button" 
        class="artifactuse-video-facade" 
        aria-label="Play YouTube video"
        onclick="this.parentElement.innerHTML='<iframe src=\\'${embedUrl}\\' frameborder=\\'0\\' allow=\\'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture\\' allowfullscreen class=\\'artifactuse-video-iframe\\'></iframe>'"
      >
        <img 
          src="${thumbnailUrl}" 
          alt="YouTube video thumbnail" 
          class="artifactuse-video-thumbnail" 
          loading="lazy"
        />
        <div class="artifactuse-video-play-button artifactuse-youtube-play">
          <svg viewBox="0 0 68 48" width="68" height="48">
            <path class="artifactuse-youtube-play-bg" d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55 C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z" fill="#f00"/>
            <path d="M 45,24 27,14 27,34" fill="#fff"/>
          </svg>
        </div>
      </button>
    </div>
  `;
}

/**
 * Create lazy-loaded Vimeo embed with thumbnail preview
 * Only loads iframe when user clicks play
 * Note: Vimeo thumbnails require an API call, so we use a placeholder initially
 */
export function createVimeoEmbed(videoId) {
  const embedUrl = `https://player.vimeo.com/video/${videoId}?autoplay=1`;
  // Vimeo doesn't have a simple thumbnail URL like YouTube
  // We use vumbnail.com service or show a placeholder
  const thumbnailUrl = `https://vumbnail.com/${videoId}.jpg`;
  
  return `
    <div class="artifactuse-video-wrapper artifactuse-video-lazy" data-video-type="vimeo" data-video-id="${videoId}">
      <button 
        type="button" 
        class="artifactuse-video-facade" 
        aria-label="Play Vimeo video"
        onclick="this.parentElement.innerHTML='<iframe src=\\'${embedUrl}\\' frameborder=\\'0\\' allow=\\'autoplay; fullscreen; picture-in-picture\\' allowfullscreen class=\\'artifactuse-video-iframe\\'></iframe>'"
      >
        <img 
          src="${thumbnailUrl}" 
          alt="Vimeo video thumbnail" 
          class="artifactuse-video-thumbnail" 
          loading="lazy"
          onerror="this.style.display='none'"
        />
        <div class="artifactuse-video-play-button artifactuse-vimeo-play">
          <svg viewBox="0 0 64 64" width="64" height="64">
            <circle cx="32" cy="32" r="31" fill="#1ab7ea"/>
            <path d="M26 20 L26 44 L46 32 Z" fill="#fff"/>
          </svg>
        </div>
      </button>
    </div>
  `;
}

/**
 * Create lazy-loaded Loom embed with thumbnail preview
 */
export function createLoomEmbed(videoId) {
  const embedUrl = `https://www.loom.com/embed/${videoId}?autoplay=1`;
  // Loom provides thumbnails at this URL pattern
  const thumbnailUrl = `https://cdn.loom.com/sessions/thumbnails/${videoId}-with-play.gif`;
  
  return `
    <div class="artifactuse-video-wrapper artifactuse-video-lazy" data-video-type="loom" data-video-id="${videoId}">
      <button 
        type="button" 
        class="artifactuse-video-facade" 
        aria-label="Play Loom video"
        onclick="this.parentElement.innerHTML='<iframe src=\\'${embedUrl}\\' frameborder=\\'0\\' allowfullscreen class=\\'artifactuse-video-iframe\\'></iframe>'"
      >
        <img 
          src="${thumbnailUrl}" 
          alt="Loom video thumbnail" 
          class="artifactuse-video-thumbnail" 
          loading="lazy"
          onerror="this.style.display='none'"
        />
        <div class="artifactuse-video-play-button artifactuse-loom-play">
          <svg viewBox="0 0 64 64" width="64" height="64">
            <circle cx="32" cy="32" r="31" fill="#625df5"/>
            <path d="M26 20 L26 44 L46 32 Z" fill="#fff"/>
          </svg>
        </div>
      </button>
    </div>
  `;
}

/**
 * Create lazy-loaded Dailymotion embed with thumbnail preview
 */
export function createDailymotionEmbed(videoId) {
  const embedUrl = `https://www.dailymotion.com/embed/video/${videoId}?autoplay=1`;
  // Dailymotion provides thumbnails at this URL pattern
  const thumbnailUrl = `https://www.dailymotion.com/thumbnail/video/${videoId}`;
  
  return `
    <div class="artifactuse-video-wrapper artifactuse-video-lazy" data-video-type="dailymotion" data-video-id="${videoId}">
      <button 
        type="button" 
        class="artifactuse-video-facade" 
        aria-label="Play Dailymotion video"
        onclick="this.parentElement.innerHTML='<iframe src=\\'${embedUrl}\\' frameborder=\\'0\\' allow=\\'autoplay; fullscreen; picture-in-picture\\' allowfullscreen class=\\'artifactuse-video-iframe\\'></iframe>'"
      >
        <img 
          src="${thumbnailUrl}" 
          alt="Dailymotion video thumbnail" 
          class="artifactuse-video-thumbnail" 
          loading="lazy"
          onerror="this.style.display='none'"
        />
        <div class="artifactuse-video-play-button artifactuse-dailymotion-play">
          <svg viewBox="0 0 64 64" width="64" height="64">
            <circle cx="32" cy="32" r="31" fill="#0066dc"/>
            <path d="M26 20 L26 44 L46 32 Z" fill="#fff"/>
          </svg>
        </div>
      </button>
    </div>
  `;
}

/**
 * Initialize video facades - attach click handlers for lazy loading
 * Call this after DOM is ready if you need programmatic control
 */
export function initializeVideoFacades(container = document) {
  const facades = container.querySelectorAll('.artifactuse-video-facade:not([data-initialized])');
  
  facades.forEach(facade => {
    facade.setAttribute('data-initialized', 'true');
    
    // The onclick is already in the HTML, but we can add keyboard support
    facade.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        facade.click();
      }
    });
  });
}

export default {
  processVideos,
  createVideoPlayer,
  createVideoWithPreview,
  createYouTubeEmbed,
  createVimeoEmbed,
  createLoomEmbed,
  createDailymotionEmbed,
  initializeVideoFacades,
};
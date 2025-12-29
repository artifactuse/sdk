// artifactuse/core/processors.js
// Combined content processors for Artifactuse

// ============================================================
// IMAGE PROCESSOR
// ============================================================

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif'];

export function processImages(html) {
  const protectedContent = [];
  
  html = html.replace(/<pre[^>]*>[\s\S]*?<\/pre>/gi, (match) => {
    const placeholder = `__IMG_PROTECTED_${protectedContent.length}__`;
    protectedContent.push(match);
    return placeholder;
  });
  
  html = html.replace(/<code[^>]*>[\s\S]*?<\/code>/gi, (match) => {
    const placeholder = `__IMG_PROTECTED_${protectedContent.length}__`;
    protectedContent.push(match);
    return placeholder;
  });
  
  html = html.replace(/<img[^>]*>/gi, (match) => {
    const placeholder = `__IMG_PROTECTED_${protectedContent.length}__`;
    protectedContent.push(match);
    return placeholder;
  });

  const extPattern = IMAGE_EXTENSIONS.join('|');
  
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

  const rawImageRegex = new RegExp(
    `(?<!["'=])(https?:\\/\\/[^\\s<>"]+\\.(?:${extPattern})(\\?[^\\s<>"]*)?)(?!["'])`,
    'gi'
  );
  html = html.replace(rawImageRegex, (match, imageUrl) => {
    return renderImageHtml(imageUrl, '', '');
  });

  for (let i = protectedContent.length - 1; i >= 0; i--) {
    html = html.replace(`__IMG_PROTECTED_${i}__`, protectedContent[i]);
  }

  return html;
}

function renderImageHtml(src, title, alt) {
  const caption = title || alt || '';
  return `
    <div class="artifactuse-image-container">
      <img src="${src}" alt="${alt || ''}" class="artifactuse-image" data-lightbox="true" data-caption="${caption}" loading="lazy" />
      ${caption ? `<div class="artifactuse-image-caption">${caption}</div>` : ''}
    </div>
  `;
}

// ============================================================
// VIDEO PROCESSOR
// ============================================================

export function processVideos(html) {
  const protectedContent = [];
  
  html = html.replace(/<pre[^>]*>[\s\S]*?<\/pre>/gi, (match) => {
    const placeholder = `__PROTECTED_${protectedContent.length}__`;
    protectedContent.push(match);
    return placeholder;
  });
  
  html = html.replace(/<code[^>]*>[\s\S]*?<\/code>/gi, (match) => {
    const placeholder = `__PROTECTED_${protectedContent.length}__`;
    protectedContent.push(match);
    return placeholder;
  });
  
  html = html.replace(/<(video|audio|iframe)[^>]*>[\s\S]*?<\/\1>/gi, (match) => {
    const placeholder = `__PROTECTED_${protectedContent.length}__`;
    protectedContent.push(match);
    return placeholder;
  });

  // Direct video files
  const videoFileLinkRegex = /<a[^>]*href="(https?:\/\/[^"]+\.(mp4|webm|mov|avi|mkv|flv|wmv|m4v)(?:\?[^"]*)?)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(videoFileLinkRegex, (match, videoUrl) => createVideoPlayer(videoUrl));

  const videoFileRegex = /(?<!["'=])(https?:\/\/[^\s<>"]+\.(mp4|webm|mov|avi|mkv|flv|wmv|m4v)(\?[^\s<>"]*)?)(?!["'])/gi;
  html = html.replace(videoFileRegex, (match, videoUrl) => createVideoPlayer(videoUrl));

  // YouTube
  const youtubeLinkRegex = /<a[^>]*href="(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(youtubeLinkRegex, (match, url, videoId) => createYouTubeEmbed(videoId));

  const youtubeRegex = /(?<!["'=])(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+))(?!["'])/gi;
  html = html.replace(youtubeRegex, (match, url, videoId) => createYouTubeEmbed(videoId));

  // Vimeo
  const vimeoLinkRegex = /<a[^>]*href="(https?:\/\/(?:www\.)?vimeo\.com\/(\d+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(vimeoLinkRegex, (match, url, videoId) => createVimeoEmbed(videoId));

  const vimeoRegex = /(?<!["'=])(https?:\/\/(?:www\.)?vimeo\.com\/(\d+))(?!["'])/gi;
  html = html.replace(vimeoRegex, (match, url, videoId) => createVimeoEmbed(videoId));

  // Loom
  const loomLinkRegex = /<a[^>]*href="(https?:\/\/(?:www\.)?loom\.com\/share\/([a-zA-Z0-9]+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(loomLinkRegex, (match, url, videoId) => createLoomEmbed(videoId));

  const loomRegex = /(?<!["'=])(https?:\/\/(?:www\.)?loom\.com\/share\/([a-zA-Z0-9]+))(?!["'])/gi;
  html = html.replace(loomRegex, (match, url, videoId) => createLoomEmbed(videoId));

  for (let i = protectedContent.length - 1; i >= 0; i--) {
    html = html.replace(`__PROTECTED_${i}__`, protectedContent[i]);
  }

  return html;
}

function createVideoPlayer(videoUrl) {
  const extension = videoUrl.split('?')[0].split('.').pop().toLowerCase();
  const mimeTypes = { 'mp4': 'video/mp4', 'webm': 'video/webm', 'mov': 'video/quicktime' };
  const mimeType = mimeTypes[extension] || 'video/mp4';
  
  return `
    <div class="artifactuse-video-wrapper">
      <video controls preload="metadata" class="artifactuse-video">
        <source src="${videoUrl}" type="${mimeType}">
      </video>
    </div>
  `;
}

function createYouTubeEmbed(videoId) {
  return `
    <div class="artifactuse-video-wrapper">
      <iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen class="artifactuse-video-iframe" loading="lazy"></iframe>
    </div>
  `;
}

function createVimeoEmbed(videoId) {
  return `
    <div class="artifactuse-video-wrapper">
      <iframe src="https://player.vimeo.com/video/${videoId}" frameborder="0" allowfullscreen class="artifactuse-video-iframe" loading="lazy"></iframe>
    </div>
  `;
}

function createLoomEmbed(videoId) {
  return `
    <div class="artifactuse-video-wrapper">
      <iframe src="https://www.loom.com/embed/${videoId}" frameborder="0" allowfullscreen class="artifactuse-video-iframe" loading="lazy"></iframe>
    </div>
  `;
}

// ============================================================
// AUDIO PROCESSOR
// ============================================================

export function processAudio(html) {
  const protectedContent = [];
  
  html = html.replace(/<pre[^>]*>[\s\S]*?<\/pre>/gi, (match) => {
    const placeholder = `__PROTECTED_${protectedContent.length}__`;
    protectedContent.push(match);
    return placeholder;
  });
  
  html = html.replace(/<code[^>]*>[\s\S]*?<\/code>/gi, (match) => {
    const placeholder = `__PROTECTED_${protectedContent.length}__`;
    protectedContent.push(match);
    return placeholder;
  });
  
  html = html.replace(/<(video|audio|iframe)[^>]*>[\s\S]*?<\/\1>/gi, (match) => {
    const placeholder = `__PROTECTED_${protectedContent.length}__`;
    protectedContent.push(match);
    return placeholder;
  });

  // Direct audio files
  const audioFileLinkRegex = /<a[^>]*href="(https?:\/\/[^"]+\.(mp3|wav|flac|aac|ogg|m4a|wma)(?:\?[^"]*)?)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(audioFileLinkRegex, (match, audioUrl) => createAudioPlayer(audioUrl));

  const audioFileRegex = /(?<!["'=])(https?:\/\/[^\s<>"]+\.(mp3|wav|flac|aac|ogg|m4a|wma)(\?[^\s<>"]*)?)(?!["'])/gi;
  html = html.replace(audioFileRegex, (match, audioUrl) => createAudioPlayer(audioUrl));

  // Spotify
  const spotifyTrackRegex = /(?<!["'=])(https?:\/\/open\.spotify\.com\/track\/([a-zA-Z0-9]+))(?!["'])/gi;
  html = html.replace(spotifyTrackRegex, (match, url, trackId) => createSpotifyEmbed('track', trackId));

  const spotifyAlbumRegex = /(?<!["'=])(https?:\/\/open\.spotify\.com\/album\/([a-zA-Z0-9]+))(?!["'])/gi;
  html = html.replace(spotifyAlbumRegex, (match, url, albumId) => createSpotifyEmbed('album', albumId));

  const spotifyPlaylistRegex = /(?<!["'=])(https?:\/\/open\.spotify\.com\/playlist\/([a-zA-Z0-9]+))(?!["'])/gi;
  html = html.replace(spotifyPlaylistRegex, (match, url, playlistId) => createSpotifyEmbed('playlist', playlistId));

  // SoundCloud
  const soundcloudRegex = /(?<!["'=])(https?:\/\/(?:www\.)?soundcloud\.com\/[^\s<>"]+)(?!["'])/gi;
  html = html.replace(soundcloudRegex, (match, url) => createSoundCloudEmbed(url));

  for (let i = protectedContent.length - 1; i >= 0; i--) {
    html = html.replace(`__PROTECTED_${i}__`, protectedContent[i]);
  }

  return html;
}

function createAudioPlayer(audioUrl) {
  const fileName = audioUrl.split('/').pop().split('?')[0];
  return `
    <div class="artifactuse-audio-wrapper">
      <audio controls preload="metadata" class="artifactuse-audio">
        <source src="${audioUrl}" type="audio/mpeg">
      </audio>
      <div class="artifactuse-audio-info">${fileName}</div>
    </div>
  `;
}

function createSpotifyEmbed(type, id) {
  const heights = { track: 152, album: 352, playlist: 352, artist: 352 };
  const height = heights[type] || 152;
  
  return `
    <div class="artifactuse-audio-wrapper">
      <iframe src="https://open.spotify.com/embed/${type}/${id}?theme=0" frameborder="0" allowfullscreen allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" class="artifactuse-spotify-embed" style="height: ${height}px;" loading="lazy"></iframe>
    </div>
  `;
}

function createSoundCloudEmbed(url) {
  const encodedUrl = encodeURIComponent(url);
  return `
    <div class="artifactuse-audio-wrapper">
      <iframe src="https://w.soundcloud.com/player/?url=${encodedUrl}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true" frameborder="0" class="artifactuse-soundcloud-embed" style="height: 166px;" loading="lazy"></iframe>
    </div>
  `;
}

// ============================================================
// MAP PROCESSOR
// ============================================================

export function processMaps(html) {
  const protectedContent = [];
  
  html = html.replace(/<pre[^>]*>[\s\S]*?<\/pre>/gi, (match) => {
    const placeholder = `__PROTECTED_MAP_${protectedContent.length}__`;
    protectedContent.push(match);
    return placeholder;
  });
  
  html = html.replace(/<code[^>]*>[\s\S]*?<\/code>/gi, (match) => {
    const placeholder = `__PROTECTED_MAP_${protectedContent.length}__`;
    protectedContent.push(match);
    return placeholder;
  });
  
  html = html.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, (match) => {
    const placeholder = `__PROTECTED_MAP_${protectedContent.length}__`;
    protectedContent.push(match);
    return placeholder;
  });

  // Google Maps place
  const googleMapsPlaceLinkRegex = /<a[^>]*href="(https?:\/\/(?:www\.)?google\.com\/maps\/place\/([^\/\?"]+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(googleMapsPlaceLinkRegex, (match, url, place) => {
    return createGoogleMapEmbed(decodeURIComponent(place.replace(/\+/g, ' ')));
  });

  const googleMapsPlaceRegex = /(?<!["'=])(https?:\/\/(?:www\.)?google\.com\/maps\/place\/([^\/\?\s]+))(?!["'])/gi;
  html = html.replace(googleMapsPlaceRegex, (match, url, place) => {
    return createGoogleMapEmbed(decodeURIComponent(place.replace(/\+/g, ' ')));
  });

  // Google Maps search
  const googleMapsSearchRegex = /(?<!["'=])(https?:\/\/(?:www\.)?google\.com\/maps\/search\/([^\/\?\s]+))(?!["'])/gi;
  html = html.replace(googleMapsSearchRegex, (match, url, query) => {
    return createGoogleMapEmbed(decodeURIComponent(query.replace(/\+/g, ' ')));
  });

  for (let i = protectedContent.length - 1; i >= 0; i--) {
    html = html.replace(`__PROTECTED_MAP_${i}__`, protectedContent[i]);
  }

  return html;
}

function createGoogleMapEmbed(query) {
  const encoded = encodeURIComponent(query);
  return `
    <div class="artifactuse-map-wrapper">
      <iframe src="https://www.google.com/maps?q=${encoded}&output=embed" frameborder="0" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade" class="artifactuse-map-iframe"></iframe>
      <div class="artifactuse-map-actions">
        <a href="https://www.google.com/maps/search/${encoded}" target="_blank" rel="noopener" class="artifactuse-map-link">Open in Google Maps</a>
      </div>
    </div>
  `;
}

// ============================================================
// SOCIAL PROCESSOR
// ============================================================

export function processSocialEmbeds(html) {
  // Twitter/X
  const twitterLinkRegex = /<a[^>]*href="(https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)\/status\/(\d+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(twitterLinkRegex, (match, url, username, tweetId) => createTwitterEmbed(username, tweetId));

  const twitterRegex = /(?<!["'=])(https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)\/status\/(\d+))(?!["'])/gi;
  html = html.replace(twitterRegex, (match, url, username, tweetId) => createTwitterEmbed(username, tweetId));

  // Instagram
  const instagramPostRegex = /(?<!["'=])(https?:\/\/(?:www\.)?instagram\.com\/p\/([a-zA-Z0-9_-]+))(?!["'])/gi;
  html = html.replace(instagramPostRegex, (match, url, postId) => createInstagramEmbed(postId));

  const instagramReelRegex = /(?<!["'=])(https?:\/\/(?:www\.)?instagram\.com\/reel\/([a-zA-Z0-9_-]+))(?!["'])/gi;
  html = html.replace(instagramReelRegex, (match, url, reelId) => createInstagramReelEmbed(reelId));

  // TikTok
  const tiktokRegex = /(?<!["'=])(https?:\/\/(?:www\.)?tiktok\.com\/@([a-zA-Z0-9_.]+)\/video\/(\d+))(?!["'])/gi;
  html = html.replace(tiktokRegex, (match, url, username, videoId) => createTikTokEmbed(videoId));

  return html;
}

function createTwitterEmbed(username, tweetId) {
  return `
    <div class="artifactuse-twitter-wrapper">
      <blockquote class="twitter-tweet" data-dnt="true" data-theme="light">
        <a href="https://twitter.com/${username}/status/${tweetId}">Loading tweet...</a>
      </blockquote>
      <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
    </div>
  `;
}

function createInstagramEmbed(postId) {
  return `
    <div class="artifactuse-instagram-wrapper">
      <iframe src="https://www.instagram.com/p/${postId}/embed" frameborder="0" scrolling="no" allowtransparency="true" class="artifactuse-instagram-embed" loading="lazy"></iframe>
    </div>
  `;
}

function createInstagramReelEmbed(reelId) {
  return `
    <div class="artifactuse-instagram-wrapper">
      <iframe src="https://www.instagram.com/reel/${reelId}/embed" frameborder="0" scrolling="no" allowtransparency="true" class="artifactuse-instagram-embed artifactuse-instagram-reel" loading="lazy"></iframe>
    </div>
  `;
}

function createTikTokEmbed(videoId) {
  return `
    <div class="artifactuse-tiktok-wrapper">
      <iframe src="https://www.tiktok.com/embed/v2/${videoId}" frameborder="0" allowfullscreen class="artifactuse-tiktok-embed" loading="lazy"></iframe>
    </div>
  `;
}

// ============================================================
// DOCUMENT PROCESSOR
// ============================================================

export function processPdfs(html) {
  const pdfLinkRegex = /<a[^>]*href="(https?:\/\/[^"]+\.pdf(?:\?[^"]*)?)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(pdfLinkRegex, (match, url) => createPdfEmbed(url));

  const pdfRegex = /(?<!["'=])(https?:\/\/[^\s<>"]+\.pdf(?:\?[^\s<>"]*)?)(?!["'])/gi;
  html = html.replace(pdfRegex, (match, url) => createPdfEmbed(url));

  return html;
}

function createPdfEmbed(url) {
  const fileName = url.split('/').pop().split('?')[0];
  return `
    <div class="artifactuse-pdf-wrapper">
      <div class="artifactuse-pdf-header">
        <span class="artifactuse-pdf-filename">${fileName}</span>
        <a href="${url}" target="_blank" class="artifactuse-pdf-download" title="Download PDF">Download</a>
      </div>
      <iframe src="${url}#view=FitH&toolbar=1" class="artifactuse-pdf-iframe" loading="lazy"></iframe>
    </div>
  `;
}

export function processGoogleDocs(html) {
  // Google Docs
  const docsRegex = /(?<!["'=])(https?:\/\/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+))(?!["'])/gi;
  html = html.replace(docsRegex, (match, url, docId) => createGoogleDocEmbed(docId, 'document'));

  // Google Sheets
  const sheetsRegex = /(?<!["'=])(https?:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+))(?!["'])/gi;
  html = html.replace(sheetsRegex, (match, url, docId) => createGoogleDocEmbed(docId, 'spreadsheets'));

  // Google Slides
  const slidesRegex = /(?<!["'=])(https?:\/\/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+))(?!["'])/gi;
  html = html.replace(slidesRegex, (match, url, docId) => createGoogleDocEmbed(docId, 'presentation'));

  return html;
}

function createGoogleDocEmbed(docId, type) {
  const typeLabels = { document: 'Google Doc', spreadsheets: 'Google Sheet', presentation: 'Google Slides' };
  const embedUrls = {
    document: `https://docs.google.com/document/d/${docId}/preview`,
    spreadsheets: `https://docs.google.com/spreadsheets/d/${docId}/preview`,
    presentation: `https://docs.google.com/presentation/d/${docId}/embed?start=false&loop=false&delayms=3000`
  };

  return `
    <div class="artifactuse-google-doc-wrapper">
      <div class="artifactuse-google-doc-header">
        <span class="artifactuse-google-doc-type">${typeLabels[type]}</span>
        <a href="https://docs.google.com/${type === 'presentation' ? 'presentation' : type}/d/${docId}" target="_blank" class="artifactuse-google-doc-link">Open in new tab</a>
      </div>
      <iframe src="${embedUrls[type]}" class="artifactuse-google-doc-iframe" loading="lazy" allowfullscreen></iframe>
    </div>
  `;
}

export function processOfficeDocuments(html) {
  const officeLinkRegex = /<a[^>]*href="(https?:\/\/[^"]+\.(docx?|xlsx?|pptx?)(?:\?[^"]*)?)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(officeLinkRegex, (match, url) => createOfficeEmbed(url));

  const officeRegex = /(?<!["'=])(https?:\/\/[^\s<>"]+\.(docx?|xlsx?|pptx?)(?:\?[^\s<>"]*)?)(?!["'])/gi;
  html = html.replace(officeRegex, (match, url) => createOfficeEmbed(url));

  return html;
}

function createOfficeEmbed(fileUrl) {
  const encoded = encodeURIComponent(fileUrl);
  const fileName = fileUrl.split('/').pop().split('?')[0];

  return `
    <div class="artifactuse-office-wrapper">
      <div class="artifactuse-office-header">
        <span class="artifactuse-office-filename">${fileName}</span>
        <a href="${fileUrl}" target="_blank" class="artifactuse-office-download" title="Download">Download</a>
      </div>
      <iframe src="https://view.officeapps.live.com/op/embed.aspx?src=${encoded}" class="artifactuse-office-iframe" loading="lazy"></iframe>
    </div>
  `;
}

// ============================================================
// CODE EMBED PROCESSOR
// ============================================================

export function processCodeEmbeds(html) {
  // CodePen
  const codepenRegex = /(?<!["'=])(https?:\/\/codepen\.io\/([a-zA-Z0-9_-]+)\/(?:pen|full|details)\/([a-zA-Z0-9]+))(?!["'])/gi;
  html = html.replace(codepenRegex, (match, url, user, penId) => createCodePenEmbed(user, penId));

  // CodeSandbox
  const codesandboxRegex = /(?<!["'=])(https?:\/\/codesandbox\.io\/(?:s|embed)\/([a-zA-Z0-9-]+))(?!["'])/gi;
  html = html.replace(codesandboxRegex, (match, url, sandboxId) => createCodeSandboxEmbed(sandboxId));

  // JSFiddle
  const jsfiddleRegex = /(?<!["'=])(https?:\/\/jsfiddle\.net\/([a-zA-Z0-9_]+)\/([a-zA-Z0-9]+))(?!["'])/gi;
  html = html.replace(jsfiddleRegex, (match, url, user, fiddleId) => createJSFiddleEmbed(user, fiddleId));

  // StackBlitz
  const stackblitzRegex = /(?<!["'=])(https?:\/\/stackblitz\.com\/(?:edit|embed)\/([a-zA-Z0-9-]+))(?!["'])/gi;
  html = html.replace(stackblitzRegex, (match, url, projectId) => createStackBlitzEmbed(projectId));

  // GitHub Gist
  const gistRegex = /(?<!["'=])(https?:\/\/gist\.github\.com\/([a-zA-Z0-9_-]+)\/([a-f0-9]+))(?!["'])/gi;
  html = html.replace(gistRegex, (match, url, user, gistId) => createGistEmbed(user, gistId));

  return html;
}

function createCodePenEmbed(user, penId) {
  return `
    <div class="artifactuse-codepen-wrapper">
      <iframe height="400" style="width: 100%;" scrolling="no" src="https://codepen.io/${user}/embed/${penId}?default-tab=html%2Cresult&theme-id=dark" frameborder="no" loading="lazy" allowtransparency="true" allowfullscreen="true" class="artifactuse-codepen-embed"></iframe>
    </div>
  `;
}

function createCodeSandboxEmbed(sandboxId) {
  return `
    <div class="artifactuse-codesandbox-wrapper">
      <iframe src="https://codesandbox.io/embed/${sandboxId}?fontsize=14&hidenavigation=1&theme=dark" style="width:100%; height:500px; border:0; border-radius:8px; overflow:hidden;" allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking" sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts" loading="lazy" class="artifactuse-codesandbox-embed"></iframe>
    </div>
  `;
}

function createJSFiddleEmbed(user, fiddleId) {
  return `
    <div class="artifactuse-jsfiddle-wrapper">
      <iframe width="100%" height="400" src="https://jsfiddle.net/${user}/${fiddleId}/embedded/result,js,html,css/dark/" allowfullscreen="allowfullscreen" frameborder="0" loading="lazy" class="artifactuse-jsfiddle-embed"></iframe>
    </div>
  `;
}

function createStackBlitzEmbed(projectId) {
  return `
    <div class="artifactuse-stackblitz-wrapper">
      <iframe src="https://stackblitz.com/edit/${projectId}?embed=1&file=index.js&theme=dark" style="width:100%; height:500px; border:0; border-radius:8px; overflow:hidden;" loading="lazy" class="artifactuse-stackblitz-embed"></iframe>
    </div>
  `;
}

function createGistEmbed(user, gistId) {
  return `
    <div class="artifactuse-gist-wrapper">
      <script src="https://gist.github.com/${user}/${gistId}.js"></script>
    </div>
  `;
}

// ============================================================
// DATA VIZ PROCESSOR
// ============================================================

export function processDataViz(html) {
  // Flourish
  const flourishRegex = /(?<!["'=])(https?:\/\/(?:public\.)?flourish\.studio\/visualisation\/(\d+))(?!["'])/gi;
  html = html.replace(flourishRegex, (match, url, vizId) => createFlourishEmbed(vizId));

  // Datawrapper
  const datawrapperRegex = /(?<!["'=])(https?:\/\/datawrapper\.dwcdn\.net\/([a-zA-Z0-9]+))(?!["'])/gi;
  html = html.replace(datawrapperRegex, (match, url, chartId) => createDatawrapperEmbed(chartId));

  return html;
}

function createFlourishEmbed(vizId) {
  return `
    <div class="artifactuse-flourish-wrapper">
      <iframe src="https://flo.uri.sh/visualisation/${vizId}/embed" class="artifactuse-flourish-iframe" sandbox="allow-same-origin allow-forms allow-scripts allow-downloads allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation" loading="lazy"></iframe>
    </div>
  `;
}

function createDatawrapperEmbed(chartId) {
  return `
    <div class="artifactuse-datawrapper-wrapper">
      <iframe src="https://datawrapper.dwcdn.net/${chartId}/" class="artifactuse-datawrapper-iframe" scrolling="no" loading="lazy"></iframe>
    </div>
  `;
}

// ============================================================
// 3D/DESIGN PROCESSOR
// ============================================================

export function process3DEmbeds(html) {
  // Figma
  const figmaFileRegex = /(?<!["'=])(https?:\/\/(?:www\.)?figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)(?:\/[^?\s]*)?(?:\?node-id=([^&\s]+))?)(?!["'])/gi;
  html = html.replace(figmaFileRegex, (match, url, fileKey, nodeId) => createFigmaEmbed(fileKey, nodeId));

  // Sketchfab
  const sketchfabRegex = /(?<!["'=])(https?:\/\/sketchfab\.com\/(?:3d-)?models\/([a-zA-Z0-9-]+))(?!["'])/gi;
  html = html.replace(sketchfabRegex, (match, url, modelId) => createSketchfabEmbed(modelId));

  return html;
}

function createFigmaEmbed(fileKey, nodeId) {
  const nodeParam = nodeId ? `&node-id=${nodeId}` : '';
  return `
    <div class="artifactuse-figma-wrapper">
      <iframe src="https://www.figma.com/embed?embed_host=share&url=https://www.figma.com/file/${fileKey}${nodeParam}" class="artifactuse-figma-iframe" allowfullscreen loading="lazy"></iframe>
    </div>
  `;
}

function createSketchfabEmbed(modelId) {
  return `
    <div class="artifactuse-sketchfab-wrapper">
      <iframe src="https://sketchfab.com/models/${modelId}/embed?autostart=1&ui_theme=dark" frameborder="0" allow="autoplay; fullscreen; xr-spatial-tracking" mozallowfullscreen="true" webkitallowfullscreen="true" class="artifactuse-sketchfab-iframe" loading="lazy"></iframe>
    </div>
  `;
}

// ============================================================
// INTERACTIVE PROCESSOR
// ============================================================

export function processInteractiveEmbeds(html) {
  // Typeform
  const typeformRegex = /(?<!["'=])(https?:\/\/(?:[a-zA-Z0-9-]+\.)?typeform\.com\/to\/([a-zA-Z0-9]+))(?!["'])/gi;
  html = html.replace(typeformRegex, (match, url, formId) => createTypeformEmbed(formId));

  // Calendly
  const calendlyRegex = /(?<!["'=])(https?:\/\/calendly\.com\/([a-zA-Z0-9_-]+)(?:\/([a-zA-Z0-9_-]+))?)(?!["'])/gi;
  html = html.replace(calendlyRegex, (match, url, username, eventType) => createCalendlyEmbed(username, eventType));

  // Airtable
  const airtableRegex = /(?<!["'=])(https?:\/\/airtable\.com\/(?:embed\/)?([a-zA-Z0-9]+)(?:\/([a-zA-Z0-9]+))?)(?!["'])/gi;
  html = html.replace(airtableRegex, (match, url, baseId, viewId) => createAirtableEmbed(baseId, viewId));

  // Miro
  const miroRegex = /(?<!["'=])(https?:\/\/miro\.com\/app\/board\/([a-zA-Z0-9_=-]+))(?!["'])/gi;
  html = html.replace(miroRegex, (match, url, boardId) => createMiroEmbed(boardId));

  return html;
}

function createTypeformEmbed(formId) {
  return `
    <div class="artifactuse-typeform-wrapper">
      <iframe src="https://form.typeform.com/to/${formId}" class="artifactuse-typeform-iframe" loading="lazy"></iframe>
    </div>
  `;
}

function createCalendlyEmbed(username, eventType = '') {
  const url = eventType ? `https://calendly.com/${username}/${eventType}` : `https://calendly.com/${username}`;
  return `
    <div class="artifactuse-calendly-wrapper">
      <iframe src="${url}?embed_domain=localhost&embed_type=Inline" class="artifactuse-calendly-iframe" loading="lazy"></iframe>
    </div>
  `;
}

function createAirtableEmbed(baseId, viewId) {
  const url = viewId ? `https://airtable.com/embed/${baseId}/${viewId}` : `https://airtable.com/embed/${baseId}`;
  return `
    <div class="artifactuse-airtable-wrapper">
      <iframe src="${url}?backgroundColor=purple" class="artifactuse-airtable-iframe" loading="lazy"></iframe>
    </div>
  `;
}

function createMiroEmbed(boardId) {
  return `
    <div class="artifactuse-miro-wrapper">
      <iframe src="https://miro.com/app/embed/${boardId}/?autoplay=yep" class="artifactuse-miro-iframe" allowfullscreen loading="lazy"></iframe>
    </div>
  `;
}

// ============================================================
// TABLE PROCESSOR
// ============================================================

export function processTables(html) {
  const tableRegex = /<table([^>]*)>([\s\S]*?)<\/table>/gi;
  let tableIndex = 0;
  
  html = html.replace(tableRegex, (match, attrs, content) => {
    const tableId = `artifactuse-table-${tableIndex++}`;
    const hasHeader = /<thead/i.test(content) || /<th/i.test(content);
    const rowCount = (content.match(/<tr/gi) || []).length;
    
    if (!hasHeader || rowCount < 3) {
      return `<table${attrs} class="artifactuse-table">${content}</table>`;
    }
    
    return createEnhancedTable(tableId, attrs, content);
  });
  
  return html;
}

function createEnhancedTable(tableId, attrs, content) {
  let headerIndex = 0;
  content = content.replace(/<th(\s[^>]*)?>([\s\S]*?)<\/th>/gi, (match, attrs, text) => {
    const colIndex = headerIndex++;
    attrs = attrs || '';
    return `<th${attrs} class="artifactuse-sortable-header" data-sort-col="${colIndex}">${text}</th>`;
  });
  
  return `
    <div class="artifactuse-table-container" data-table-id="${tableId}">
      <div class="artifactuse-table-controls">
        <input type="text" placeholder="Search table..." class="artifactuse-table-search" data-table-search="${tableId}" />
        <button class="artifactuse-table-export" data-table-export="${tableId}">Export CSV</button>
      </div>
      <div class="artifactuse-table-wrapper">
        <table${attrs} class="artifactuse-table artifactuse-enhanced-table" id="${tableId}">${content}</table>
      </div>
    </div>
  `;
}

// ============================================================
// MATH PROCESSOR
// ============================================================

export function processMath(html) {
  // Display math: $$ ... $$
  html = html.replace(/\$\$([\s\S]*?)\$\$/g, (match, tex) => {
    return createMathBlock(tex.trim(), true);
  });
  
  // Display math: \[ ... \]
  html = html.replace(/\\\[([\s\S]*?)\\\]/g, (match, tex) => {
    return createMathBlock(tex.trim(), true);
  });
  
  // Inline math: $ ... $ (not $$)
  html = html.replace(/(?<!\$)\$(?!\$)((?:[^$\\]|\\.)+?)\$(?!\$)/g, (match, tex) => {
    return createMathBlock(tex.trim(), false);
  });
  
  // Inline math: \( ... \)
  html = html.replace(/\\\(([\s\S]*?)\\\)/g, (match, tex) => {
    return createMathBlock(tex.trim(), false);
  });
  
  return html;
}

function createMathBlock(tex, isDisplay = false) {
  const escapedTex = tex
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  const displayClass = isDisplay ? 'artifactuse-math-display' : 'artifactuse-math-inline';
  const displayMode = isDisplay ? 'true' : 'false';
  
  return `<span class="artifactuse-math-container ${displayClass}" data-tex="${escapedTex}" data-display="${displayMode}"></span>`;
}

/**
 * Initialize math rendering (call after DOM ready)
 */
export function initializeMath() {
  if (typeof katex === 'undefined') {
    loadKaTeX().then(() => renderAllMath()).catch(console.error);
    return;
  }
  renderAllMath();
}

function renderAllMath() {
  if (typeof katex === 'undefined') return;
  
  document.querySelectorAll('.artifactuse-math-container').forEach(container => {
    if (container.dataset.rendered === 'true') return;
    
    const tex = container.dataset.tex
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&');
    
    const displayMode = container.dataset.display === 'true';
    
    try {
      katex.render(tex, container, {
        displayMode,
        throwOnError: false,
        errorColor: '#dc2626',
      });
      container.dataset.rendered = 'true';
    } catch (error) {
      container.innerHTML = `<span class="artifactuse-math-error">${tex}</span>`;
      container.dataset.rendered = 'true';
    }
  });
}

function loadKaTeX() {
  if (typeof katex !== 'undefined') return Promise.resolve();
  
  return new Promise((resolve, reject) => {
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css';
    document.head.appendChild(cssLink);
    
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// ============================================================
// TABLE INITIALIZATION
// ============================================================

/**
 * Initialize enhanced tables (call after DOM ready)
 */
export function initializeTables() {
  // Search functionality
  document.querySelectorAll('[data-table-search]').forEach(input => {
    const tableId = input.dataset.tableSearch;
    const table = document.getElementById(tableId);
    
    if (table) {
      input.addEventListener('input', (e) => {
        filterTable(table, e.target.value);
      });
    }
  });
  
  // Sort functionality
  document.querySelectorAll('.artifactuse-sortable-header').forEach(header => {
    header.addEventListener('click', () => {
      const table = header.closest('table');
      const colIndex = parseInt(header.dataset.sortCol);
      const ascending = header.dataset.sortDir !== 'asc';
      
      // Reset all headers
      table.querySelectorAll('.artifactuse-sortable-header').forEach(h => {
        h.dataset.sortDir = '';
        h.classList.remove('sort-asc', 'sort-desc');
      });
      
      header.dataset.sortDir = ascending ? 'asc' : 'desc';
      header.classList.add(ascending ? 'sort-asc' : 'sort-desc');
      
      sortTable(table, colIndex, ascending);
    });
  });
  
  // Export functionality
  document.querySelectorAll('[data-table-export]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tableId = btn.dataset.tableExport;
      const table = document.getElementById(tableId);
      if (table) {
        const csv = tableToCSV(table);
        downloadCSV(csv, `${tableId}.csv`);
      }
    });
  });
}

function filterTable(table, searchTerm) {
  const rows = table.querySelectorAll('tbody tr, tr:not(:first-child)');
  const term = searchTerm.toLowerCase().trim();
  
  rows.forEach(row => {
    if (row.querySelector('th')) return;
    const text = row.textContent.toLowerCase();
    row.style.display = !term || text.includes(term) ? '' : 'none';
  });
}

function sortTable(table, colIndex, ascending) {
  const tbody = table.querySelector('tbody') || table;
  const rows = Array.from(tbody.querySelectorAll('tr')).filter(row => !row.querySelector('th'));
  
  rows.sort((a, b) => {
    const aCell = a.cells[colIndex];
    const bCell = b.cells[colIndex];
    if (!aCell || !bCell) return 0;
    
    let aVal = aCell.textContent.trim();
    let bVal = bCell.textContent.trim();
    
    const aNum = parseFloat(aVal.replace(/[,$%]/g, ''));
    const bNum = parseFloat(bVal.replace(/[,$%]/g, ''));
    
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return ascending ? aNum - bNum : bNum - aNum;
    }
    
    return ascending ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
  });
  
  rows.forEach(row => tbody.appendChild(row));
}

function tableToCSV(table) {
  const rows = table.querySelectorAll('tr');
  const csv = [];
  
  rows.forEach(row => {
    const cells = row.querySelectorAll('th, td');
    const rowData = [];
    
    cells.forEach(cell => {
      let text = cell.textContent.trim().replace(/"/g, '""');
      if (text.includes(',') || text.includes('\n') || text.includes('"')) {
        text = `"${text}"`;
      }
      rowData.push(text);
    });
    
    csv.push(rowData.join(','));
  });
  
  return csv.join('\n');
}

function downloadCSV(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Media
  processImages,
  processVideos,
  processAudio,
  
  // Maps
  processMaps,
  
  // Social
  processSocialEmbeds,
  
  // Documents
  processPdfs,
  processGoogleDocs,
  processOfficeDocuments,
  
  // Code platforms
  processCodeEmbeds,
  
  // Data visualization
  processDataViz,
  
  // Design/3D
  process3DEmbeds,
  
  // Interactive
  processInteractiveEmbeds,
  
  // Tables
  processTables,
  initializeTables,
  
  // Math
  processMath,
  initializeMath,
};

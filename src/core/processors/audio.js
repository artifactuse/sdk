// processors/audio.js
// Handles audio embeds: direct files, SoundCloud, Spotify, Apple Music

/**
 * Generate a unique ID for audio players
 */
function generatePlayerId() {
  return `audio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Process all audio URLs in HTML
 * @param {string} html - HTML content to process
 * @param {object} options - Processing options
 * @param {string} options.theme - Theme: 'dark' | 'light'
 */
export function processAudio(html, options = {}) {
  const theme = options.theme || 'dark';
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

  // Direct audio files (linkified)
  const audioFileLinkRegex = /<a[^>]*href="(https?:\/\/[^"]+\.(mp3|wav|flac|aac|ogg|m4a|wma)(?:\?[^"]*)?)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(audioFileLinkRegex, (match, audioUrl) => {
    return createAudioPlayer(audioUrl);
  });

  // Direct audio files (raw)
  const audioFileRegex = /(?<!["'=])(https?:\/\/[^\s<>"]+\.(mp3|wav|flac|aac|ogg|m4a|wma)(\?[^\s<>"]*)?)(?!["'])/gi;
  html = html.replace(audioFileRegex, (match, audioUrl) => {
    return createAudioPlayer(audioUrl);
  });

  // SoundCloud (linkified)
  const soundcloudLinkRegex = /<a[^>]*href="(https?:\/\/(?:www\.)?soundcloud\.com\/[^"]+)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(soundcloudLinkRegex, (match, url) => {
    return createSoundCloudEmbed(url);
  });

  // SoundCloud (raw)
  const soundcloudRegex = /(?<!["'=])(https?:\/\/(?:www\.)?soundcloud\.com\/[^\s<>"]+)(?!["'])/gi;
  html = html.replace(soundcloudRegex, (match, url) => {
    return createSoundCloudEmbed(url);
  });

  // Spotify Track (linkified)
  const spotifyTrackLinkRegex = /<a[^>]*href="(https?:\/\/open\.spotify\.com\/track\/([a-zA-Z0-9]+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(spotifyTrackLinkRegex, (match, url, trackId) => {
    return createSpotifyEmbed('track', trackId, theme);
  });

  // Spotify Track (raw)
  const spotifyTrackRegex = /(?<!["'=])(https?:\/\/open\.spotify\.com\/track\/([a-zA-Z0-9]+))(?!["'])/gi;
  html = html.replace(spotifyTrackRegex, (match, url, trackId) => {
    return createSpotifyEmbed('track', trackId, theme);
  });

  // Spotify Album (linkified)
  const spotifyAlbumLinkRegex = /<a[^>]*href="(https?:\/\/open\.spotify\.com\/album\/([a-zA-Z0-9]+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(spotifyAlbumLinkRegex, (match, url, albumId) => {
    return createSpotifyEmbed('album', albumId, theme);
  });

  // Spotify Album (raw)
  const spotifyAlbumRegex = /(?<!["'=])(https?:\/\/open\.spotify\.com\/album\/([a-zA-Z0-9]+))(?!["'])/gi;
  html = html.replace(spotifyAlbumRegex, (match, url, albumId) => {
    return createSpotifyEmbed('album', albumId, theme);
  });

  // Spotify Playlist (linkified)
  const spotifyPlaylistLinkRegex = /<a[^>]*href="(https?:\/\/open\.spotify\.com\/playlist\/([a-zA-Z0-9]+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(spotifyPlaylistLinkRegex, (match, url, playlistId) => {
    return createSpotifyEmbed('playlist', playlistId, theme);
  });

  // Spotify Playlist (raw)
  const spotifyPlaylistRegex = /(?<!["'=])(https?:\/\/open\.spotify\.com\/playlist\/([a-zA-Z0-9]+))(?!["'])/gi;
  html = html.replace(spotifyPlaylistRegex, (match, url, playlistId) => {
    return createSpotifyEmbed('playlist', playlistId, theme);
  });

  // Spotify Artist (linkified)
  const spotifyArtistLinkRegex = /<a[^>]*href="(https?:\/\/open\.spotify\.com\/artist\/([a-zA-Z0-9]+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(spotifyArtistLinkRegex, (match, url, artistId) => {
    return createSpotifyEmbed('artist', artistId, theme);
  });

  // Spotify Artist (raw)
  const spotifyArtistRegex = /(?<!["'=])(https?:\/\/open\.spotify\.com\/artist\/([a-zA-Z0-9]+))(?!["'])/gi;
  html = html.replace(spotifyArtistRegex, (match, url, artistId) => {
    return createSpotifyEmbed('artist', artistId, theme);
  });

  // Spotify Episode (linkified)
  const spotifyEpisodeLinkRegex = /<a[^>]*href="(https?:\/\/open\.spotify\.com\/episode\/([a-zA-Z0-9]+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(spotifyEpisodeLinkRegex, (match, url, episodeId) => {
    return createSpotifyEmbed('episode', episodeId, theme);
  });

  // Spotify Episode (raw)
  const spotifyEpisodeRegex = /(?<!["'=])(https?:\/\/open\.spotify\.com\/episode\/([a-zA-Z0-9]+))(?!["'])/gi;
  html = html.replace(spotifyEpisodeRegex, (match, url, episodeId) => {
    return createSpotifyEmbed('episode', episodeId, theme);
  });

  // Spotify Show (linkified)
  const spotifyShowLinkRegex = /<a[^>]*href="(https?:\/\/open\.spotify\.com\/show\/([a-zA-Z0-9]+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(spotifyShowLinkRegex, (match, url, showId) => {
    return createSpotifyEmbed('show', showId, theme);
  });

  // Spotify Show (raw)
  const spotifyShowRegex = /(?<!["'=])(https?:\/\/open\.spotify\.com\/show\/([a-zA-Z0-9]+))(?!["'])/gi;
  html = html.replace(spotifyShowRegex, (match, url, showId) => {
    return createSpotifyEmbed('show', showId, theme);
  });

  // Apple Music (linkified)
  const appleMusicLinkRegex = /<a[^>]*href="(https?:\/\/music\.apple\.com\/([a-z]{2})\/([a-z-]+)\/[^\/]+\/(\d+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(appleMusicLinkRegex, (match, url, country, type, id) => {
    return createAppleMusicEmbed(country, type, id);
  });

  // Apple Music (raw)
  const appleMusicRegex = /(?<!["'=])(https?:\/\/music\.apple\.com\/([a-z]{2})\/([a-z-]+)\/[^\/\s]+\/(\d+))(?!["'])/gi;
  html = html.replace(appleMusicRegex, (match, url, country, type, id) => {
    return createAppleMusicEmbed(country, type, id);
  });

  // Restore all protected content
  for (let i = protectedContent.length - 1; i >= 0; i--) {
    html = html.replace(`__PROTECTED_${i}__`, protectedContent[i]);
  }

  return html;
}

/**
 * Get file extension from URL
 */
function getFileExtension(url) {
  const match = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  return match ? match[1].toUpperCase() : 'AUDIO';
}

/**
 * Escape HTML for safe attribute insertion
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Create custom waveform audio player
 */
export function createAudioPlayer(audioUrl) {
  const playerId = generatePlayerId();
  const fileName = decodeURIComponent(audioUrl.split('/').pop().split('?')[0]);
  const fileExt = getFileExtension(audioUrl);
  
  return `
    <div class="artifactuse-audio-player" data-player-id="${playerId}" data-audio-src="${escapeHtml(audioUrl)}">
      <!-- Hidden audio element -->
      <audio preload="metadata" class="artifactuse-audio-element">
        <source src="${escapeHtml(audioUrl)}" type="audio/mpeg">
      </audio>
      
      <!-- Header -->
      <div class="artifactuse-audio-header">
        <div class="artifactuse-audio-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 18V5l12-2v13"></path>
            <circle cx="6" cy="18" r="3"></circle>
            <circle cx="18" cy="16" r="3"></circle>
          </svg>
        </div>
        <div class="artifactuse-audio-meta">
          <span class="artifactuse-audio-filename" title="${escapeHtml(fileName)}">${escapeHtml(fileName)}</span>
          <span class="artifactuse-audio-format">${fileExt}</span>
        </div>
        <span class="artifactuse-audio-duration">--:--</span>
      </div>
      
      <!-- Waveform -->
      <div class="artifactuse-audio-waveform-container">
        <div class="artifactuse-audio-waveform">
          <canvas class="artifactuse-audio-waveform-canvas"></canvas>
          <div class="artifactuse-audio-waveform-progress"></div>
          <div class="artifactuse-audio-waveform-hover"></div>
        </div>
      </div>
      
      <!-- Controls -->
      <div class="artifactuse-audio-controls">
        <div class="artifactuse-audio-controls-left">
          <!-- Play/Pause -->
          <button class="artifactuse-audio-btn artifactuse-audio-play-btn" aria-label="Play">
            <svg class="artifactuse-audio-icon-play" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            <svg class="artifactuse-audio-icon-pause" viewBox="0 0 24 24" fill="currentColor" style="display: none;">
              <rect x="6" y="4" width="4" height="16"></rect>
              <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
          </button>
          
          <!-- Time -->
          <div class="artifactuse-audio-time">
            <span class="artifactuse-audio-current">0:00</span>
          </div>
        </div>
        
        <div class="artifactuse-audio-controls-right">
          <!-- Playback Speed -->
          <button class="artifactuse-audio-btn artifactuse-audio-speed-btn" aria-label="Playback speed">
            <span>1x</span>
          </button>
          
          <!-- Volume -->
          <div class="artifactuse-audio-volume">
            <button class="artifactuse-audio-btn artifactuse-audio-mute-btn" aria-label="Mute">
              <svg class="artifactuse-audio-icon-volume" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
              </svg>
              <svg class="artifactuse-audio-icon-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: none;">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <line x1="23" y1="9" x2="17" y2="15"></line>
                <line x1="17" y1="9" x2="23" y2="15"></line>
              </svg>
            </button>
            <div class="artifactuse-audio-volume-slider-container">
              <input type="range" class="artifactuse-audio-volume-slider" min="0" max="100" value="100" aria-label="Volume">
            </div>
          </div>
          
          <!-- Download -->
          <a href="${escapeHtml(audioUrl)}" download class="artifactuse-audio-btn artifactuse-audio-download-btn" aria-label="Download">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </a>
        </div>
      </div>
    </div>
  `;
}

/**
 * Create SoundCloud embed
 */
export function createSoundCloudEmbed(url) {
  const encodedUrl = encodeURIComponent(url);
  return `
    <div class="artifactuse-soundcloud-wrapper">
      <iframe 
        src="https://w.soundcloud.com/player/?url=${encodedUrl}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true"
        frameborder="0"
        class="artifactuse-soundcloud-embed"
        loading="lazy">
      </iframe>
    </div>
  `;
}

/**
 * Create Spotify embed
 * @param {string} type - track, album, playlist, artist, episode, show
 * @param {string} id - Spotify ID
 * @param {string} theme - 'dark' | 'light'
 */
export function createSpotifyEmbed(type, id, theme = 'dark') {
  const heights = {
    track: 152,
    album: 352,
    playlist: 352,
    artist: 352,
    episode: 152,
    show: 352,
  };
  
  const height = heights[type] || 152;
  
  // Spotify theme: 0 = dark, 1 = light
  const spotifyTheme = theme === 'light' ? '1' : '0';
  
  return `
    <div class="artifactuse-spotify-wrapper">
      <iframe 
        src="https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=${spotifyTheme}"
        frameborder="0"
        allowfullscreen
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        class="artifactuse-spotify-embed"
        style="height: ${height}px;"
        loading="lazy">
      </iframe>
    </div>
  `;
}

/**
 * Create Apple Music embed
 */
export function createAppleMusicEmbed(country, type, id) {
  return `
    <div class="artifactuse-apple-music-wrapper">
      <iframe 
        src="https://embed.music.apple.com/${country}/${type}/${id}"
        frameborder="0"
        allow="autoplay *; encrypted-media *; fullscreen *"
        class="artifactuse-apple-music-embed"
        sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
        loading="lazy">
      </iframe>
    </div>
  `;
}

export default {
  processAudio,
  createAudioPlayer,
  createSoundCloudEmbed,
  createSpotifyEmbed,
  createAppleMusicEmbed,
};
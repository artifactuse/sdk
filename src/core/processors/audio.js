// processors/audio.js
// Handles audio embeds: direct files, SoundCloud, Spotify, Apple Music

/**
 * Process all audio URLs in HTML
 */
export function processAudio(html) {
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
    return createSpotifyEmbed('track', trackId);
  });

  // Spotify Track (raw)
  const spotifyTrackRegex = /(?<!["'=])(https?:\/\/open\.spotify\.com\/track\/([a-zA-Z0-9]+))(?!["'])/gi;
  html = html.replace(spotifyTrackRegex, (match, url, trackId) => {
    return createSpotifyEmbed('track', trackId);
  });

  // Spotify Album (linkified)
  const spotifyAlbumLinkRegex = /<a[^>]*href="(https?:\/\/open\.spotify\.com\/album\/([a-zA-Z0-9]+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(spotifyAlbumLinkRegex, (match, url, albumId) => {
    return createSpotifyEmbed('album', albumId);
  });

  // Spotify Album (raw)
  const spotifyAlbumRegex = /(?<!["'=])(https?:\/\/open\.spotify\.com\/album\/([a-zA-Z0-9]+))(?!["'])/gi;
  html = html.replace(spotifyAlbumRegex, (match, url, albumId) => {
    return createSpotifyEmbed('album', albumId);
  });

  // Spotify Playlist (linkified)
  const spotifyPlaylistLinkRegex = /<a[^>]*href="(https?:\/\/open\.spotify\.com\/playlist\/([a-zA-Z0-9]+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(spotifyPlaylistLinkRegex, (match, url, playlistId) => {
    return createSpotifyEmbed('playlist', playlistId);
  });

  // Spotify Playlist (raw)
  const spotifyPlaylistRegex = /(?<!["'=])(https?:\/\/open\.spotify\.com\/playlist\/([a-zA-Z0-9]+))(?!["'])/gi;
  html = html.replace(spotifyPlaylistRegex, (match, url, playlistId) => {
    return createSpotifyEmbed('playlist', playlistId);
  });

  // Spotify Artist (linkified)
  const spotifyArtistLinkRegex = /<a[^>]*href="(https?:\/\/open\.spotify\.com\/artist\/([a-zA-Z0-9]+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(spotifyArtistLinkRegex, (match, url, artistId) => {
    return createSpotifyEmbed('artist', artistId);
  });

  // Spotify Artist (raw)
  const spotifyArtistRegex = /(?<!["'=])(https?:\/\/open\.spotify\.com\/artist\/([a-zA-Z0-9]+))(?!["'])/gi;
  html = html.replace(spotifyArtistRegex, (match, url, artistId) => {
    return createSpotifyEmbed('artist', artistId);
  });

  // Spotify Episode (linkified)
  const spotifyEpisodeLinkRegex = /<a[^>]*href="(https?:\/\/open\.spotify\.com\/episode\/([a-zA-Z0-9]+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(spotifyEpisodeLinkRegex, (match, url, episodeId) => {
    return createSpotifyEmbed('episode', episodeId);
  });

  // Spotify Episode (raw)
  const spotifyEpisodeRegex = /(?<!["'=])(https?:\/\/open\.spotify\.com\/episode\/([a-zA-Z0-9]+))(?!["'])/gi;
  html = html.replace(spotifyEpisodeRegex, (match, url, episodeId) => {
    return createSpotifyEmbed('episode', episodeId);
  });

  // Spotify Show (linkified)
  const spotifyShowLinkRegex = /<a[^>]*href="(https?:\/\/open\.spotify\.com\/show\/([a-zA-Z0-9]+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(spotifyShowLinkRegex, (match, url, showId) => {
    return createSpotifyEmbed('show', showId);
  });

  // Spotify Show (raw)
  const spotifyShowRegex = /(?<!["'=])(https?:\/\/open\.spotify\.com\/show\/([a-zA-Z0-9]+))(?!["'])/gi;
  html = html.replace(spotifyShowRegex, (match, url, showId) => {
    return createSpotifyEmbed('show', showId);
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
 * Create HTML5 audio player
 */
export function createAudioPlayer(audioUrl) {
  const fileName = audioUrl.split('/').pop().split('?')[0];
  return `
    <div class="artifactuse-audio-wrapper">
      <div class="artifactuse-audio-player">
        <audio controls preload="metadata" class="artifactuse-audio">
          <source src="${audioUrl}" type="audio/mpeg">
          Your browser does not support the audio element.
        </audio>
        <div class="artifactuse-audio-info">
          <span class="artifactuse-audio-filename">${fileName}</span>
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
    <div>
      <iframe 
        src="https://w.soundcloud.com/player/?url=${encodedUrl}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true"
        frameborder="0"
        class="artifactuse-soundcloud-embed"
        style="height: 166px;"
        loading="lazy">
      </iframe>
    </div>
  `;
}

/**
 * Create Spotify embed
 * @param {string} type - track, album, playlist, artist, episode, show
 * @param {string} id - Spotify ID
 */
export function createSpotifyEmbed(type, id) {
  const heights = {
    track: 152,
    album: 352,
    playlist: 352,
    artist: 352,
    episode: 152,
    show: 352,
  };
  
  const height = heights[type] || 152;
  
  return `
    <div>
      <iframe 
        src="https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0"
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
    <div>
      <iframe 
        src="https://embed.music.apple.com/${country}/${type}/${id}"
        frameborder="0"
        allow="autoplay *; encrypted-media *; fullscreen *"
        class="artifactuse-apple-music-embed"
        style="height: 175px;"
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
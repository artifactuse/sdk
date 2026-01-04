// Runtime controller for custom waveform audio player

/**
 * Store for active player instances
 */
const players = new Map();

/**
 * Playback speed options
 */
const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

/**
 * Initialize all audio players in the document
 * Call this after DOM is ready
 */
export function initializeAudioPlayers(container = document) {
  const playerElements = container.querySelectorAll('.artifactuse-audio-player:not([data-initialized])');
  
  playerElements.forEach(playerEl => {
    initializePlayer(playerEl);
  });
}

/**
 * Initialize a single audio player
 */
function initializePlayer(playerEl) {
  const playerId = playerEl.dataset.playerId;
  const audioSrc = playerEl.dataset.audioSrc;
  
  if (!playerId || !audioSrc) return;
  
  // Get DOM elements
  const audio = playerEl.querySelector('.artifactuse-audio-element');
  const playBtn = playerEl.querySelector('.artifactuse-audio-play-btn');
  const playIcon = playerEl.querySelector('.artifactuse-audio-icon-play');
  const pauseIcon = playerEl.querySelector('.artifactuse-audio-icon-pause');
  const currentTimeEl = playerEl.querySelector('.artifactuse-audio-current');
  const durationEl = playerEl.querySelector('.artifactuse-audio-duration');
  const waveformContainer = playerEl.querySelector('.artifactuse-audio-waveform');
  const waveformCanvas = playerEl.querySelector('.artifactuse-audio-waveform-canvas');
  const waveformProgress = playerEl.querySelector('.artifactuse-audio-waveform-progress');
  const waveformHover = playerEl.querySelector('.artifactuse-audio-waveform-hover');
  const muteBtn = playerEl.querySelector('.artifactuse-audio-mute-btn');
  const volumeIcon = playerEl.querySelector('.artifactuse-audio-icon-volume');
  const mutedIcon = playerEl.querySelector('.artifactuse-audio-icon-muted');
  const volumeSlider = playerEl.querySelector('.artifactuse-audio-volume-slider');
  const speedBtn = playerEl.querySelector('.artifactuse-audio-speed-btn');
  
  if (!audio) return;
  
  // Player state
  const state = {
    isPlaying: false,
    isMuted: false,
    volume: 1,
    playbackRate: 1,
    duration: 0,
    currentTime: 0,
    waveformData: null,
  };
  
  // Store player instance
  players.set(playerId, { playerEl, audio, state });
  
  // Generate waveform
  generateWaveform(waveformCanvas, playerId);
  
  // Event Listeners
  
  // Play/Pause
  playBtn?.addEventListener('click', () => {
    if (state.isPlaying) {
      pauseAudio(playerId);
    } else {
      playAudio(playerId);
    }
  });
  
  // Audio events
  audio.addEventListener('loadedmetadata', () => {
    state.duration = audio.duration;
    durationEl.textContent = formatTime(audio.duration);
  });
  
  audio.addEventListener('timeupdate', () => {
    state.currentTime = audio.currentTime;
    currentTimeEl.textContent = formatTime(audio.currentTime);
    
    // Update progress
    const progress = (audio.currentTime / audio.duration) * 100;
    waveformProgress.style.width = `${progress}%`;
  });
  
  audio.addEventListener('ended', () => {
    state.isPlaying = false;
    playIcon.style.display = '';
    pauseIcon.style.display = 'none';
    playerEl.classList.remove('is-playing');
    waveformProgress.style.width = '0%';
  });
  
  audio.addEventListener('play', () => {
    state.isPlaying = true;
    playIcon.style.display = 'none';
    pauseIcon.style.display = '';
    playerEl.classList.add('is-playing');
    
    // Pause other players
    pauseOtherPlayers(playerId);
  });
  
  audio.addEventListener('pause', () => {
    state.isPlaying = false;
    playIcon.style.display = '';
    pauseIcon.style.display = 'none';
    playerEl.classList.remove('is-playing');
  });
  
  // Waveform click to seek
  waveformContainer?.addEventListener('click', (e) => {
    const rect = waveformContainer.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const seekTime = percentage * audio.duration;
    
    if (!isNaN(seekTime)) {
      audio.currentTime = seekTime;
    }
  });
  
  // Waveform hover preview
  waveformContainer?.addEventListener('mousemove', (e) => {
    const rect = waveformContainer.getBoundingClientRect();
    const hoverX = e.clientX - rect.left;
    const percentage = (hoverX / rect.width) * 100;
    waveformHover.style.width = `${percentage}%`;
  });
  
  waveformContainer?.addEventListener('mouseleave', () => {
    waveformHover.style.width = '0%';
  });
  
  // Mute toggle
  muteBtn?.addEventListener('click', () => {
    state.isMuted = !state.isMuted;
    audio.muted = state.isMuted;
    
    volumeIcon.style.display = state.isMuted ? 'none' : '';
    mutedIcon.style.display = state.isMuted ? '' : 'none';
    
    if (state.isMuted) {
      volumeSlider.value = 0;
    } else {
      volumeSlider.value = state.volume * 100;
    }
  });
  
  // Volume slider
  volumeSlider?.addEventListener('input', (e) => {
    const value = parseInt(e.target.value, 10) / 100;
    state.volume = value;
    audio.volume = value;
    
    if (value === 0) {
      state.isMuted = true;
      volumeIcon.style.display = 'none';
      mutedIcon.style.display = '';
    } else {
      state.isMuted = false;
      audio.muted = false;
      volumeIcon.style.display = '';
      mutedIcon.style.display = 'none';
    }
  });
  
  // Playback speed
  speedBtn?.addEventListener('click', () => {
    const currentIndex = PLAYBACK_SPEEDS.indexOf(state.playbackRate);
    const nextIndex = (currentIndex + 1) % PLAYBACK_SPEEDS.length;
    state.playbackRate = PLAYBACK_SPEEDS[nextIndex];
    audio.playbackRate = state.playbackRate;
    speedBtn.querySelector('span').textContent = `${state.playbackRate}x`;
  });
  
  // Keyboard controls
  playerEl.addEventListener('keydown', (e) => {
    switch (e.key) {
      case ' ':
      case 'k':
        e.preventDefault();
        if (state.isPlaying) {
          pauseAudio(playerId);
        } else {
          playAudio(playerId);
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        audio.currentTime = Math.max(0, audio.currentTime - 5);
        break;
      case 'ArrowRight':
        e.preventDefault();
        audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
        break;
      case 'ArrowUp':
        e.preventDefault();
        state.volume = Math.min(1, state.volume + 0.1);
        audio.volume = state.volume;
        volumeSlider.value = state.volume * 100;
        break;
      case 'ArrowDown':
        e.preventDefault();
        state.volume = Math.max(0, state.volume - 0.1);
        audio.volume = state.volume;
        volumeSlider.value = state.volume * 100;
        break;
      case 'm':
        e.preventDefault();
        muteBtn?.click();
        break;
    }
  });
  
  // Mark as initialized
  playerEl.setAttribute('data-initialized', 'true');
  playerEl.setAttribute('tabindex', '0');
}

/**
 * Generate waveform visualization
 */
function generateWaveform(canvas, playerId) {
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  
  // Set canvas size
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  ctx.scale(dpr, dpr);
  
  const width = rect.width;
  const height = rect.height;
  
  // Generate pseudo-random waveform data based on playerId
  const barCount = Math.floor(width / 4); // ~4px per bar including gap
  const waveformData = generateWaveformData(barCount, playerId);
  
  // Draw waveform
  drawWaveform(ctx, waveformData, width, height);
  
  // Handle resize
  const resizeObserver = new ResizeObserver(() => {
    const newRect = canvas.parentElement.getBoundingClientRect();
    canvas.width = newRect.width * dpr;
    canvas.height = newRect.height * dpr;
    canvas.style.width = `${newRect.width}px`;
    canvas.style.height = `${newRect.height}px`;
    ctx.scale(dpr, dpr);
    
    const newBarCount = Math.floor(newRect.width / 4);
    const newData = generateWaveformData(newBarCount, playerId);
    drawWaveform(ctx, newData, newRect.width, newRect.height);
  });
  
  resizeObserver.observe(canvas.parentElement);
}

/**
 * Generate pseudo-random waveform data
 * Uses a seeded random based on playerId for consistency
 */
function generateWaveformData(barCount, seed) {
  const data = [];
  
  // Simple seeded random number generator
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  const seededRandom = () => {
    hash = (hash * 9301 + 49297) % 233280;
    return hash / 233280;
  };
  
  // Generate waveform pattern that looks natural
  // Use multiple sine waves with different frequencies
  for (let i = 0; i < barCount; i++) {
    const t = i / barCount;
    
    // Base wave
    let value = 0.3 + 
      0.2 * Math.sin(t * Math.PI * 4 + seededRandom() * Math.PI) +
      0.15 * Math.sin(t * Math.PI * 8 + seededRandom() * Math.PI) +
      0.1 * Math.sin(t * Math.PI * 16 + seededRandom() * Math.PI);
    
    // Add randomness
    value += (seededRandom() - 0.5) * 0.3;
    
    // Envelope - fade in/out at edges
    const envelope = Math.sin(t * Math.PI);
    value *= 0.5 + 0.5 * envelope;
    
    // Clamp
    value = Math.max(0.1, Math.min(1, value));
    
    data.push(value);
  }
  
  return data;
}

/**
 * Draw waveform bars on canvas
 */
function drawWaveform(ctx, data, width, height) {
  ctx.clearRect(0, 0, width, height);
  
  const barWidth = 2;
  const gap = 2;
  const totalBarWidth = barWidth + gap;
  const centerY = height / 2;
  
  // Get CSS custom property for color
  const computedStyle = getComputedStyle(document.documentElement);
  const textMuted = computedStyle.getPropertyValue('--artifactuse-text-muted').trim() || '107, 114, 128';
  
  ctx.fillStyle = `rgba(${textMuted}, 0.4)`;
  
  data.forEach((value, i) => {
    const x = i * totalBarWidth;
    const barHeight = value * (height * 0.8);
    
    // Draw mirrored bar (top and bottom from center)
    const halfHeight = barHeight / 2;
    
    // Rounded rectangle
    const radius = barWidth / 2;
    
    ctx.beginPath();
    ctx.roundRect(x, centerY - halfHeight, barWidth, barHeight, radius);
    ctx.fill();
  });
}

/**
 * Format time in mm:ss or hh:mm:ss
 */
function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Play audio
 */
export function playAudio(playerId) {
  const player = players.get(playerId);
  if (player) {
    player.audio.play();
  }
}

/**
 * Pause audio
 */
export function pauseAudio(playerId) {
  const player = players.get(playerId);
  if (player) {
    player.audio.pause();
  }
}

/**
 * Pause all other players except the specified one
 */
function pauseOtherPlayers(currentPlayerId) {
  players.forEach((player, playerId) => {
    if (playerId !== currentPlayerId && player.state.isPlaying) {
      player.audio.pause();
    }
  });
}

/**
 * Stop all players
 */
export function stopAllPlayers() {
  players.forEach((player) => {
    player.audio.pause();
    player.audio.currentTime = 0;
  });
}

/**
 * Get player state
 */
export function getPlayerState(playerId) {
  const player = players.get(playerId);
  return player ? { ...player.state } : null;
}

/**
 * Destroy a player instance
 */
export function destroyPlayer(playerId) {
  const player = players.get(playerId);
  if (player) {
    player.audio.pause();
    player.audio.src = '';
    players.delete(playerId);
  }
}

/**
 * Destroy all players
 */
export function destroyAllPlayers() {
  players.forEach((_, playerId) => {
    destroyPlayer(playerId);
  });
}

export default {
  initializeAudioPlayers,
  playAudio,
  pauseAudio,
  stopAllPlayers,
  getPlayerState,
  destroyPlayer,
  destroyAllPlayers,
};
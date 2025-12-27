<script>
  // artifactuse/svelte/ArtifactuseSocialPreview.svelte
  import { createEventDispatcher, onMount } from 'svelte';
  
  export let social = {};
  export let theme = 'dark';
  
  const dispatch = createEventDispatcher();
  
  const defaultAvatar = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23888"><circle cx="12" cy="8" r="4"/><path d="M12 14c-6 0-8 3-8 6v2h16v-2c0-3-2-6-8-6z"/></svg>';
  
  const charLimits = {
    twitter: 280, linkedin: 3000, instagram: 2200,
    facebook: 63206, threads: 500, tiktok: 2200, youtube: 100
  };
  
  const platformNames = {
    twitter: 'X', linkedin: 'LinkedIn', instagram: 'Instagram',
    facebook: 'Facebook', threads: 'Threads', tiktok: 'TikTok', youtube: 'YouTube'
  };
  
  let copyLabel = 'Copy';
  
  $: platform = social?.platform || 'twitter';
  $: data = social?.data || {};
  $: author = data.author || {};
  $: content = data.content || {};
  $: engagement = data.engagement || {};
  $: meta = data.meta || {};
  
  $: charLimit = charLimits[platform] || 280;
  $: charCount = (content.text || '').length;
  $: charCountClass = charCount > charLimit ? 'error' : charCount > charLimit * 0.9 ? 'warning' : '';
  
  $: showEngagement = engagement.likes || engagement.comments || engagement.shares || engagement.retweets || engagement.replies || engagement.views;
  
  $: totalReactions = (() => {
    const reactions = engagement.reactions || {};
    return Object.values(reactions).reduce((sum, val) => sum + (val || 0), 0) || engagement.likes || 0;
  })();
  
  function formatNumber(num) {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  }
  
  function getDomain(url) {
    try { return new URL(url).hostname.replace('www.', ''); }
    catch { return url; }
  }
  
  function formatText(text) {
    if (!text) return '';
    let formatted = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    formatted = formatted.replace(/#(\w+)/g, '<span class="hashtag">#$1</span>');
    formatted = formatted.replace(/@(\w+)/g, '<span class="mention">@$1</span>');
    return formatted;
  }
  
  function handleAvatarError(e) {
    e.target.src = defaultAvatar;
  }
  
  function handleCopy() {
    const text = content.text || '';
    navigator.clipboard.writeText(text).then(() => {
      copyLabel = 'Copied!';
      setTimeout(() => { copyLabel = 'Copy'; }, 2000);
      dispatch('copy', { platform, text });
    });
  }
</script>

<div class="artifactuse-social social-{platform}" data-theme={theme}>
  {#if platform === 'twitter'}
    <!-- Twitter -->
    <div class="social-header">
      <img src={author.avatar || defaultAvatar} alt={author.name} class="social-avatar" on:error={handleAvatarError} />
      <div class="social-author">
        <div class="social-author-name">
          <span>{author.name}</span>
          {#if author.verified}
            <svg class="social-verified social-verified-{author.verifiedType || 'blue'}" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.34 2.19c-1.39-.46-2.9-.2-3.91.81s-1.27 2.52-.81 3.91C2.63 9.33 1.75 10.57 1.75 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81c.66 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z"/>
            </svg>
          {/if}
        </div>
        <div class="flex items-center gap-1">
          <span class="social-author-handle">{author.handle}</span>
          <span class="social-timestamp">· {meta.timestamp || 'Just now'}</span>
        </div>
      </div>
    </div>
    
    <div class="social-content">
      <p class="social-text">{@html formatText(content.text)}</p>
      
      {#if content.media?.length}
        <div class="social-media">
          <div class="social-media-grid" class:social-media-single={content.media.length === 1} data-count={content.media.length}>
            {#each content.media.slice(0, 4) as media, idx}
              <img src={media.url} alt={media.alt || ''} />
            {/each}
          </div>
        </div>
      {/if}
      
      {#if content.link && !content.media?.length}
        <div class="social-link-card">
          {#if content.link.image}
            <img src={content.link.image} alt={content.link.title} class="social-link-image" />
          {/if}
          <div class="social-link-info">
            <div class="social-link-domain">🔗 {content.link.domain || getDomain(content.link.url)}</div>
            <div class="social-link-title">{content.link.title}</div>
            {#if content.link.description}
              <div class="social-link-description">{content.link.description}</div>
            {/if}
          </div>
        </div>
      {/if}
      
      {#if content.poll}
        <div class="social-poll">
          {#each content.poll.options as option, idx}
            <div class="social-poll-option">
              <div class="social-poll-bar" style="width: {content.poll.votes?.[idx] || 0}%"></div>
              <div class="social-poll-label">
                <span>{option}</span>
                <span class="font-medium">{content.poll.votes?.[idx] || 0}%</span>
              </div>
            </div>
          {/each}
          <div class="social-poll-meta">
            {formatNumber(content.poll.totalVotes || 0)} votes · {content.poll.duration || 'Poll ended'}
          </div>
        </div>
      {/if}
    </div>
    
    {#if showEngagement}
      <div class="social-engagement">
        <div class="social-stat">💬 {formatNumber(engagement.replies || 0)}</div>
        <div class="social-stat">🔁 {formatNumber(engagement.retweets || 0)}</div>
        <div class="social-stat">❤️ {formatNumber(engagement.likes || 0)}</div>
        <div class="social-stat">👁️ {formatNumber(engagement.views || 0)}</div>
      </div>
    {/if}
  {:else if platform === 'linkedin'}
    <!-- LinkedIn -->
    <div class="social-header">
      <img src={author.avatar || defaultAvatar} alt={author.name} class="social-avatar" on:error={handleAvatarError} />
      <div class="flex-1">
        <div class="social-author-name">{author.name}</div>
        <div class="social-author-headline">{author.headline}</div>
        <div class="social-timestamp">{meta.timestamp || 'Just now'} · 🌐</div>
      </div>
    </div>
    <div class="social-content">
      <p class="social-text">{@html formatText(content.text)}</p>
      {#if content.link}
        <div class="social-link-card">
          {#if content.link.image}
            <img src={content.link.image} alt={content.link.title} class="social-link-image" />
          {/if}
          <div class="social-link-info">
            <div class="social-link-title">{content.link.title}</div>
            <div class="social-link-domain">{content.link.domain || getDomain(content.link.url)}</div>
          </div>
        </div>
      {/if}
    </div>
    {#if showEngagement}
      <div class="social-engagement">
        <div>👍❤️👏 {formatNumber(engagement.likes || 0)}</div>
        <div>{formatNumber(engagement.comments || 0)} comments · {formatNumber(engagement.reposts || 0)} reposts</div>
      </div>
    {/if}
  {:else if platform === 'instagram'}
    <!-- Instagram -->
    <div class="social-header">
      <img src={author.avatar || defaultAvatar} alt={author.name} class="social-avatar" on:error={handleAvatarError} />
      <div class="flex-1">
        <div class="social-author-name">{author.name}</div>
      </div>
      <span>•••</span>
    </div>
    <div class="social-media">
      {#if content.media?.[0]}
        <img src={content.media[0].url} alt={content.media[0].alt || ''} />
      {:else}
        <div class="w-full aspect-square bg-gradient-to-br from-purple-500 to-pink-500"></div>
      {/if}
    </div>
    <div class="social-actions">
      <span>❤️</span> <span>💬</span> <span>📤</span>
      <div class="flex-1"></div>
      <span>🔖</span>
    </div>
    <div class="social-likes">{formatNumber(engagement.likes || 0)} likes</div>
    <div class="social-caption">
      <span class="social-caption-author">{author.name}</span>
      <span class="social-caption-text">{@html formatText(content.text)}</span>
    </div>
    <div class="social-timestamp">{meta.timestamp || 'JUST NOW'}</div>
  {:else if platform === 'facebook'}
    <!-- Facebook -->
    <div class="social-header">
      <img src={author.avatar || defaultAvatar} alt={author.name} class="social-avatar" on:error={handleAvatarError} />
      <div class="flex-1">
        <div class="social-author-name">{author.name}</div>
        <div class="social-timestamp">{meta.timestamp || 'Just now'} · 🌐</div>
      </div>
    </div>
    <div class="social-content">
      <p class="social-text">{@html formatText(content.text)}</p>
      {#if content.link}
        <div class="social-link-card">
          {#if content.link.image}
            <img src={content.link.image} alt={content.link.title} class="social-link-image" />
          {/if}
          <div class="social-link-info">
            <div class="social-link-domain">{content.link.domain || getDomain(content.link.url)}</div>
            <div class="social-link-title">{content.link.title}</div>
            {#if content.link.description}
              <div class="social-link-description">{content.link.description}</div>
            {/if}
          </div>
        </div>
      {/if}
    </div>
    {#if showEngagement}
      <div class="social-engagement">
        <div>👍❤️😮 {formatNumber(totalReactions)}</div>
        <div>{formatNumber(engagement.comments || 0)} comments · {formatNumber(engagement.shares || 0)} shares</div>
      </div>
    {/if}
  {:else if platform === 'threads'}
    <!-- Threads -->
    <div class="social-header">
      <img src={author.avatar || defaultAvatar} alt={author.name} class="social-avatar" on:error={handleAvatarError} />
      <div class="flex-1">
        <div class="social-author-name">{author.name}</div>
      </div>
      <span class="social-timestamp">{meta.timestamp || 'Just now'}</span>
    </div>
    <div class="social-content">
      <p class="social-text">{@html formatText(content.text)}</p>
    </div>
    {#if showEngagement}
      <div class="social-engagement">
        <div class="social-stat">❤️ {formatNumber(engagement.likes || 0)}</div>
        <div class="social-stat">💬 {formatNumber(engagement.replies || 0)}</div>
        <div class="social-stat">🔁 {formatNumber(engagement.reposts || 0)}</div>
      </div>
    {/if}
  {:else if platform === 'tiktok'}
    <!-- TikTok -->
    <div class="social-thumbnail">
      {#if content.thumbnail}
        <img src={content.thumbnail} alt="Video thumbnail" />
      {:else}
        <div class="w-full h-full bg-gradient-to-br from-cyan-500 to-pink-500"></div>
      {/if}
      <div class="social-play-button">
        <div class="social-play-icon">▶</div>
      </div>
      {#if content.duration}
        <div class="social-duration">{content.duration}</div>
      {/if}
    </div>
    <div class="social-info">
      <div class="social-header">
        <img src={author.avatar || defaultAvatar} alt={author.name} class="social-avatar" on:error={handleAvatarError} />
        <span class="social-author-name">@{author.name}</span>
      </div>
      <p class="social-text">{@html formatText(content.text)}</p>
      {#if content.sound}
        <div class="social-sound">🎵 {content.sound}</div>
      {/if}
      {#if showEngagement}
        <div class="social-engagement">
          <span>{formatNumber(engagement.likes || 0)} likes</span>
          <span>{formatNumber(engagement.comments || 0)} comments</span>
        </div>
      {/if}
    </div>
  {:else if platform === 'youtube'}
    <!-- YouTube -->
    <div class="social-thumbnail">
      {#if content.thumbnail}
        <img src={content.thumbnail} alt="Video thumbnail" />
      {:else}
        <div class="w-full h-full bg-gradient-to-br from-red-600 to-red-800"></div>
      {/if}
      {#if content.duration}
        <div class="social-duration">{content.duration}</div>
      {/if}
    </div>
    <div class="social-info">
      <img src={author.avatar || defaultAvatar} alt={author.name} class="social-avatar" on:error={handleAvatarError} />
      <div class="flex-1 min-w-0">
        <div class="social-title">{content.title}</div>
        <div class="social-channel">{author.name}</div>
        <div class="social-meta">{formatNumber(engagement.views || 0)} views · {meta.timestamp || 'Just now'}</div>
      </div>
    </div>
  {/if}
  
  <!-- Actions Bar -->
  <div class="social-actions-bar">
    <div class="social-platform-badge">
      <span>{platformNames[platform] || platform}</span>
    </div>
    <div class="flex items-center gap-2">
      <span class="social-char-counter {charCountClass}">{charCount}/{charLimit}</span>
      <button class="social-copy-btn" on:click={handleCopy}>
        📋 {copyLabel}
      </button>
    </div>
  </div>
</div>

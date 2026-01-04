<script>
  // artifactuse/svelte/ArtifactuseSocialPreview.svelte
  import { createEventDispatcher } from 'svelte';
  
  export let artifact;
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
  
  // Parse social data from artifact.code
  function parseSocial(code) {
    try {
      return JSON.parse(code);
    } catch {
      return { platform: 'twitter', data: {} };
    }
  }
  
  $: social = parseSocial(artifact?.code);
  $: platform = social?.platform || 'twitter';
  $: data = social?.data || {};
  $: author = data.author || {};
  $: content = data.content || {};
  $: engagement = data.engagement || {};
  $: meta = data.meta || {};
  $: contentMedia = content.media || [];
  
  $: charLimit = charLimits[platform] || 280;
  $: charCount = (content.text || '').length;
  $: charCountClass = charCount > charLimit ? 'error' : charCount > charLimit * 0.9 ? 'warning' : '';
  
  $: showEngagement = engagement.likes || engagement.comments || engagement.shares || engagement.retweets || engagement.replies || engagement.views || engagement.reposts;
  
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
    formatted = formatted.replace(/\n/g, '<br>');
    formatted = formatted.replace(/#(\w+)/g, '<span class="artifactuse-social-hashtag">#$1</span>');
    formatted = formatted.replace(/@(\w+)/g, '<span class="artifactuse-social-mention">@$1</span>');
    return formatted;
  }
  
  function handleAvatarError(e) {
    e.target.src = defaultAvatar;
  }
  
  function handleMediaError(e) {
    e.target.style.display = 'none';
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

<div class="artifactuse-social artifactuse-social-{platform}" data-artifactuse-theme={theme}>
  {#if platform === 'twitter'}
    <!-- Twitter -->
    <div class="artifactuse-social-header">
      <img src={author.avatar || defaultAvatar} alt={author.name} class="artifactuse-social-avatar" on:error={handleAvatarError} />
      <div class="artifactuse-social-author">
        <div class="artifactuse-social-author-name">
          <span>{author.name}</span>
          {#if author.verified}
            <svg class="artifactuse-social-verified artifactuse-social-verified-{author.verifiedType || 'blue'}" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.34 2.19c-1.39-.46-2.9-.2-3.91.81s-1.27 2.52-.81 3.91C2.63 9.33 1.75 10.57 1.75 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81c.66 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z"/>
            </svg>
          {/if}
        </div>
        <div class="artifactuse-social-author-meta">
          <span class="artifactuse-social-author-handle">{author.handle}</span>
          <span class="artifactuse-social-timestamp">· {meta.timestamp || 'Just now'}</span>
        </div>
      </div>
    </div>
    
    <div class="artifactuse-social-content">
      <p class="artifactuse-social-text">{@html formatText(content.text)}</p>
      
      {#if contentMedia.length}
        <div class="artifactuse-social-media">
          <div class="artifactuse-social-media-grid" class:artifactuse-social-media-single={contentMedia.length === 1} data-count={contentMedia.length}>
            {#each contentMedia.slice(0, 4) as media, idx}
              <img src={media.url} alt={media.alt || ''} on:error={handleMediaError} />
            {/each}
          </div>
        </div>
      {/if}
      
      {#if content.link && !contentMedia.length}
        <div class="artifactuse-social-link-card">
          {#if content.link.image}
            <img src={content.link.image} alt={content.link.title} class="artifactuse-social-link-image" on:error={handleMediaError} />
          {/if}
          <div class="artifactuse-social-link-info">
            <div class="artifactuse-social-link-domain">{content.link.domain || getDomain(content.link.url)}</div>
            <div class="artifactuse-social-link-title">{content.link.title}</div>
            {#if content.link.description}
              <div class="artifactuse-social-link-description">{content.link.description}</div>
            {/if}
          </div>
        </div>
      {/if}
      
      {#if content.poll}
        <div class="artifactuse-social-poll">
          {#each content.poll.options as option, idx}
            <div class="artifactuse-social-poll-option">
              <div class="artifactuse-social-poll-bar" style="width: {content.poll.votes?.[idx] || 0}%"></div>
              <div class="artifactuse-social-poll-label">
                <span>{option}</span>
                <span class="artifactuse-social-poll-percent">{content.poll.votes?.[idx] || 0}%</span>
              </div>
            </div>
          {/each}
          <div class="artifactuse-social-poll-meta">
            {formatNumber(content.poll.totalVotes || 0)} votes · {content.poll.duration || 'Poll ended'}
          </div>
        </div>
      {/if}
      
      {#if content.quote}
        <div class="artifactuse-social-quote">
          <div class="artifactuse-social-quote-header">
            <img src={content.quote.author?.avatar || defaultAvatar} class="artifactuse-social-quote-avatar" alt="" />
            <span class="artifactuse-social-quote-author">{content.quote.author?.name}</span>
            <span class="artifactuse-social-quote-handle">{content.quote.author?.handle}</span>
          </div>
          <p class="artifactuse-social-quote-text">{content.quote.text}</p>
        </div>
      {/if}
    </div>
    
    {#if showEngagement}
      <div class="artifactuse-social-engagement">
        <span>{formatNumber(engagement.replies || 0)} replies</span>
        <span>{formatNumber(engagement.retweets || 0)} reposts</span>
        <span>{formatNumber(engagement.likes || 0)} likes</span>
        <span>{formatNumber(engagement.views || 0)} views</span>
      </div>
    {/if}
    
  {:else if platform === 'linkedin'}
    <!-- LinkedIn -->
    <div class="artifactuse-social-header">
      <img src={author.avatar || defaultAvatar} alt={author.name} class="artifactuse-social-avatar" on:error={handleAvatarError} />
      <div class="artifactuse-social-author-info">
        <div class="artifactuse-social-author-name">
          {author.name}
          {#if author.connection}
            <span class="artifactuse-social-author-connection">· {author.connection}</span>
          {/if}
        </div>
        <div class="artifactuse-social-author-headline">{author.headline}</div>
        <div class="artifactuse-social-timestamp">{meta.timestamp || 'Just now'} · 🌐</div>
      </div>
    </div>
    <div class="artifactuse-social-content">
      <p class="artifactuse-social-text">{@html formatText(content.text)}</p>
      {#if content.link}
        <div class="artifactuse-social-link-card">
          {#if content.link.image}
            <img src={content.link.image} alt={content.link.title} class="artifactuse-social-link-image" on:error={handleMediaError} />
          {/if}
          <div class="artifactuse-social-link-info">
            <div class="artifactuse-social-link-title">{content.link.title}</div>
            <div class="artifactuse-social-link-domain">{content.link.domain || getDomain(content.link.url)}</div>
          </div>
        </div>
      {/if}
    </div>
    {#if showEngagement}
      <div class="artifactuse-social-engagement">
        <span>{formatNumber(engagement.likes || 0)} reactions</span>
        <span>{formatNumber(engagement.comments || 0)} comments</span>
        <span>{formatNumber(engagement.shares || engagement.reposts || 0)} reposts</span>
      </div>
    {/if}
    
  {:else if platform === 'instagram'}
    <!-- Instagram -->
    <div class="artifactuse-social-header">
      <img src={author.avatar || defaultAvatar} alt={author.name} class="artifactuse-social-avatar" on:error={handleAvatarError} />
      <div class="artifactuse-social-author">
        <div class="artifactuse-social-author-name">
          {author.name}
          {#if author.verified}
            <svg class="artifactuse-social-verified" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          {/if}
        </div>
        {#if meta.location}
          <div class="artifactuse-social-location">{meta.location}</div>
        {/if}
      </div>
    </div>
    <div class="artifactuse-social-media">
      {#if contentMedia[0]}
        <img src={contentMedia[0].url} alt={contentMedia[0].alt || ''} on:error={handleMediaError} />
      {:else}
        <div class="artifactuse-social-media-placeholder"></div>
      {/if}
    </div>
    <div class="artifactuse-social-likes">{formatNumber(engagement.likes || 0)} likes</div>
    <div class="artifactuse-social-caption">
      <span class="artifactuse-social-caption-author">{author.name}</span>
      <span class="artifactuse-social-caption-text">{@html formatText(content.text)}</span>
    </div>
    <div class="artifactuse-social-timestamp">{meta.timestamp || 'JUST NOW'}</div>
    
  {:else if platform === 'facebook'}
    <!-- Facebook -->
    <div class="artifactuse-social-header">
      <img src={author.avatar || defaultAvatar} alt={author.name} class="artifactuse-social-avatar" on:error={handleAvatarError} />
      <div class="artifactuse-social-author">
        <div class="artifactuse-social-author-name">{author.name}</div>
        <div class="artifactuse-social-timestamp">{meta.timestamp || 'Just now'} · 🌐</div>
      </div>
    </div>
    <div class="artifactuse-social-content">
      <p class="artifactuse-social-text">{@html formatText(content.text)}</p>
      {#if contentMedia.length}
        <div class="artifactuse-social-media">
          <div class="artifactuse-social-media-grid" data-count={contentMedia.length}>
            {#each contentMedia.slice(0, 4) as media, idx}
              <img src={media.url} alt={media.alt || ''} on:error={handleMediaError} />
            {/each}
          </div>
        </div>
      {/if}
      {#if content.link && !contentMedia.length}
        <div class="artifactuse-social-link-card">
          {#if content.link.image}
            <img src={content.link.image} alt={content.link.title} class="artifactuse-social-link-image" on:error={handleMediaError} />
          {/if}
          <div class="artifactuse-social-link-info">
            <div class="artifactuse-social-link-domain">{content.link.domain || getDomain(content.link.url)}</div>
            <div class="artifactuse-social-link-title">{content.link.title}</div>
          </div>
        </div>
      {/if}
    </div>
    {#if showEngagement}
      <div class="artifactuse-social-engagement">
        <span>👍❤️ {formatNumber(totalReactions)}</span>
        <span>{formatNumber(engagement.comments || 0)} comments · {formatNumber(engagement.shares || 0)} shares</span>
      </div>
    {/if}
    
  {:else if platform === 'threads'}
    <!-- Threads -->
    <div class="artifactuse-social-header">
      <img src={author.avatar || defaultAvatar} alt={author.name} class="artifactuse-social-avatar" on:error={handleAvatarError} />
      <div class="artifactuse-social-author">
        <div class="artifactuse-social-author-name">
          {author.name}
          {#if author.verified}
            <svg class="artifactuse-social-verified" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          {/if}
        </div>
      </div>
      <span class="artifactuse-social-timestamp">{meta.timestamp || 'Just now'}</span>
    </div>
    <div class="artifactuse-social-content">
      <p class="artifactuse-social-text">{@html formatText(content.text)}</p>
    </div>
    {#if showEngagement}
      <div class="artifactuse-social-engagement">
        <span>{formatNumber(engagement.likes || 0)} likes</span>
        <span>{formatNumber(engagement.replies || 0)} replies</span>
        <span>{formatNumber(engagement.reposts || 0)} reposts</span>
      </div>
    {/if}
    
  {:else if platform === 'tiktok'}
    <!-- TikTok -->
    <div class="artifactuse-social-thumbnail">
      {#if contentMedia[0]}
        <img src={contentMedia[0].url} alt="Video thumbnail" on:error={handleMediaError} />
      {:else}
        <div class="artifactuse-social-thumbnail-placeholder"></div>
      {/if}
      {#if content.duration}
        <div class="artifactuse-social-duration">{content.duration}</div>
      {/if}
    </div>
    <div class="artifactuse-social-info">
      <div class="artifactuse-social-header">
        <img src={author.avatar || defaultAvatar} alt={author.name} class="artifactuse-social-avatar" on:error={handleAvatarError} />
        <span class="artifactuse-social-author-name">@{author.name}</span>
      </div>
      <p class="artifactuse-social-text">{@html formatText(content.text)}</p>
      {#if content.sound}
        <div class="artifactuse-social-sound">🎵 {content.sound}</div>
      {/if}
    </div>
    {#if showEngagement}
      <div class="artifactuse-social-engagement">
        <span>{formatNumber(engagement.likes || 0)} likes</span>
        <span>{formatNumber(engagement.comments || 0)} comments</span>
        <span>{formatNumber(engagement.shares || 0)} shares</span>
      </div>
    {/if}
    
  {:else if platform === 'youtube'}
    <!-- YouTube -->
    <div class="artifactuse-social-thumbnail">
      {#if contentMedia[0]}
        <img src={contentMedia[0].url} alt="Video thumbnail" on:error={handleMediaError} />
      {:else}
        <div class="artifactuse-social-thumbnail-placeholder"></div>
      {/if}
      {#if content.duration}
        <div class="artifactuse-social-duration">{content.duration}</div>
      {/if}
    </div>
    <div class="artifactuse-social-info">
      <img src={author.avatar || defaultAvatar} alt={author.name} class="artifactuse-social-avatar" on:error={handleAvatarError} />
      <div class="artifactuse-social-details">
        <div class="artifactuse-social-title">{content.title}</div>
        <div class="artifactuse-social-channel">{author.name}</div>
        <div class="artifactuse-social-meta">{formatNumber(engagement.views || 0)} views · {meta.timestamp || 'Just now'}</div>
      </div>
    </div>
  {/if}
  
  <!-- Actions Bar -->
  <div class="artifactuse-social-actions-bar">
    <div class="artifactuse-social-platform-badge">
      <span>{platformNames[platform] || platform}</span>
    </div>
    <div class="artifactuse-social-actions-right">
      <span class="artifactuse-social-char-counter {charCountClass}">{charCount}/{charLimit}</span>
      <button class="artifactuse-social-copy-btn" on:click={handleCopy}>
        {copyLabel}
      </button>
    </div>
  </div>
</div>
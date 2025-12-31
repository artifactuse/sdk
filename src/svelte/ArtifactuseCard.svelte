<script>
  import { createEventDispatcher } from 'svelte';
  import { getLanguageDisplayName, getFileExtension, getLanguageIcon, formatBytes } from '../core/detector.js';
  
  export let artifact;
  export let isActive = false;
  
  const dispatch = createEventDispatcher();
  
  let copied = false;
  
  $: displayType = getLanguageDisplayName(artifact.language);
  $: formattedSize = formatBytes(artifact.size || artifact.code?.length || 0);
  $: iconPath = getLanguageIcon(artifact.language);
  
  function handleClick(event) {
    event.stopPropagation();
    dispatch('open', artifact);
  }
  
  async function handleCopy(event) {
    event.stopPropagation();
    
    try {
      await navigator.clipboard.writeText(artifact.code);
      copied = true;
      dispatch('copy', artifact);
      
      setTimeout(() => {
        copied = false;
      }, 2000);
    } catch (error) {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = artifact.code;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        copied = true;
        dispatch('copy', artifact);
        setTimeout(() => {
          copied = false;
        }, 2000);
      } catch (e) {
        console.error('Failed to copy:', e);
      }
      document.body.removeChild(textarea);
    }
  }
  
  function handleDownload(event) {
    event.stopPropagation();
    
    const blob = new Blob([artifact.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const extension = getFileExtension(artifact.language);
    const filename = artifact.title?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'code';
    a.href = url;
    a.download = `${filename}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    dispatch('download', artifact);
  }
</script>

<div 
  class="artifactuse-card"
  class:artifactuse-card--active={isActive}
  on:click={handleClick}
  on:keypress={(e) => e.key === 'Enter' && handleClick(e)}
  role="button"
  tabindex="0"
>
  <!-- Icon -->
  <div class="artifactuse-card__icon">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      {@html iconPath}
    </svg>
  </div>
  
  <!-- Content -->
  <div class="artifactuse-card__content">
    <div class="artifactuse-card__title">{artifact.title}</div>
    <div class="artifactuse-card__meta">
      <span class="artifactuse-card__type">{displayType}</span>
      <span class="artifactuse-card__separator">•</span>
      <span class="artifactuse-card__size">{formattedSize}</span>
    </div>
  </div>
  
  <!-- Actions -->
  <div class="artifactuse-card__actions">
    <button 
      class="artifactuse-card__action"
      title={copied ? 'Copied!' : 'Copy code'}
      on:click={handleCopy}
    >
      {#if !copied}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      {:else}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      {/if}
    </button>
    
    <button 
      class="artifactuse-card__action"
      title="Download file"
      on:click={handleDownload}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
    </button>
  </div>
  
  <!-- Arrow -->
  <div class="artifactuse-card__arrow">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  </div>
</div>
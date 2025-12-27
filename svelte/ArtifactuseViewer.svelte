<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  
  export let isOpen = false;
  export let type = 'image';
  export let src = '';
  export let alt = '';
  export let caption = '';
  
  const dispatch = createEventDispatcher();
  
  let overlayRef;
  let isZoomed = false;
  
  function close() {
    isZoomed = false;
    dispatch('close');
  }
  
  function toggleZoom() {
    if (type === 'image') {
      isZoomed = !isZoomed;
    }
  }
  
  function download() {
    const link = document.createElement('a');
    link.href = src;
    link.download = alt || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  function handleKeydown(e) {
    if (e.key === 'Escape' && isOpen) {
      close();
    }
  }
  
  function handleOverlayClick(e) {
    if (e.target === overlayRef) {
      close();
    }
  }
  
  $: if (isOpen) {
    document.body.style.overflow = 'hidden';
    setTimeout(() => overlayRef?.focus(), 0);
  } else {
    document.body.style.overflow = '';
    isZoomed = false;
  }
  
  onMount(() => {
    document.addEventListener('keydown', handleKeydown);
  });
  
  onDestroy(() => {
    document.removeEventListener('keydown', handleKeydown);
    document.body.style.overflow = '';
  });
</script>

{#if isOpen}
  <div 
    bind:this={overlayRef}
    class="artifactuse-viewer-overlay"
    on:click={handleOverlayClick}
    on:keydown={handleKeydown}
    tabindex="-1"
    role="dialog"
    aria-modal="true"
    transition:fade={{ duration: 200 }}
  >
    <div class="artifactuse-viewer-content" transition:scale={{ duration: 200, start: 0.95 }}>
      <!-- Image -->
      {#if type === 'image'}
        <img 
          {src} 
          {alt}
          class="artifactuse-viewer-image"
          class:artifactuse-viewer-image--zoomed={isZoomed}
          on:click={toggleZoom}
        />
      {/if}
      
      <!-- PDF -->
      {#if type === 'pdf'}
        <iframe
          {src}
          class="artifactuse-viewer-pdf"
          title={alt || 'PDF Viewer'}
        ></iframe>
      {/if}
      
      <!-- Close button -->
      <button 
        class="artifactuse-viewer-close"
        on:click={close}
        title="Close (Esc)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      
      <!-- Zoom controls (images only) -->
      {#if type === 'image'}
        <div class="artifactuse-viewer-controls">
          <button 
            class="artifactuse-viewer-control"
            on:click|stopPropagation={toggleZoom}
            title={isZoomed ? 'Zoom out' : 'Zoom in'}
          >
            {#if !isZoomed}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                <line x1="11" y1="8" x2="11" y2="14"></line>
                <line x1="8" y1="11" x2="14" y2="11"></line>
              </svg>
            {:else}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                <line x1="8" y1="11" x2="14" y2="11"></line>
              </svg>
            {/if}
          </button>
          
          <button 
            class="artifactuse-viewer-control"
            on:click|stopPropagation={download}
            title="Download"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </button>
        </div>
      {/if}
      
      <!-- Caption -->
      {#if caption}
        <div class="artifactuse-viewer-caption">
          {caption}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .artifactuse-viewer-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.9);
    backdrop-filter: blur(4px);
    cursor: zoom-out;
  }

  .artifactuse-viewer-content {
    position: relative;
    max-width: 90vw;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .artifactuse-viewer-image {
    max-width: 90vw;
    max-height: 85vh;
    object-fit: contain;
    border-radius: 4px;
    cursor: zoom-in;
    transition: transform 0.3s ease;
  }

  .artifactuse-viewer-image--zoomed {
    max-width: none;
    max-height: none;
    cursor: zoom-out;
    transform: scale(1.5);
  }

  .artifactuse-viewer-pdf {
    width: 90vw;
    height: 85vh;
    border: none;
    border-radius: 4px;
    background: white;
  }

  .artifactuse-viewer-close {
    position: absolute;
    top: -48px;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 8px;
    color: white;
    cursor: pointer;
    transition: background 0.2s;
  }

  .artifactuse-viewer-close:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .artifactuse-viewer-close svg {
    width: 24px;
    height: 24px;
  }

  .artifactuse-viewer-controls {
    position: absolute;
    bottom: -48px;
    display: flex;
    gap: 8px;
  }

  .artifactuse-viewer-control {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 8px;
    color: white;
    cursor: pointer;
    transition: background 0.2s;
  }

  .artifactuse-viewer-control:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .artifactuse-viewer-control svg {
    width: 20px;
    height: 20px;
  }

  .artifactuse-viewer-caption {
    margin-top: 16px;
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: white;
    font-size: 14px;
    text-align: center;
    max-width: 600px;
  }
</style>

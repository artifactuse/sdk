<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { getArtifactuseContext } from './index.js';
  import { getLanguageDisplayName, getFileExtension } from '../core/detector.js';
  
  const dispatch = createEventDispatcher();
  
  const { 
    isPanelOpen, 
    activeArtifact, 
    viewMode: viewModeStore,
    isFullscreen: isFullscreenStore,
    closePanel, 
    toggleFullscreen, 
    setViewMode,
    getPanelUrl,
    instance,
  } = getArtifactuseContext();
  
  let iframeRef;
  let copied = false;
  let mounted = false;
  
  $: artifact = $activeArtifact;
  $: panelOpen = $isPanelOpen;
  $: viewMode = $viewModeStore;
  $: isFullscreen = $isFullscreenStore;
  
  $: languageDisplay = artifact ? getLanguageDisplayName(artifact.language) : '';
  $: panelUrl = artifact ? getPanelUrl(artifact) : null;
  
  $: panelClass = [
    'artifactuse-panel',
    isFullscreen && 'artifactuse-panel--fullscreen',
  ].filter(Boolean).join(' ');
  
  $: contentClass = `artifactuse-panel-content artifactuse-panel-content--${viewMode}`;
  
  onMount(() => {
    mounted = true;
    
    // Listen for events from iframe
    const unsubscribeAI = instance.on('ai:request', (data) => {
      dispatch('aiRequest', data);
    });
    
    const unsubscribeSave = instance.on('save:request', (data) => {
      dispatch('save', data);
    });
    
    const unsubscribeExport = instance.on('export:complete', (data) => {
      dispatch('export', data);
    });
    
    return () => {
      unsubscribeAI();
      unsubscribeSave();
      unsubscribeExport();
    };
  });
  
  function handleIframeLoad() {
    if (iframeRef && artifact) {
      instance.bridge.setIframe(iframeRef);
      instance.bridge.loadArtifact(artifact);
    }
  }
  
  // Send artifact to iframe when it changes
  $: if (artifact && iframeRef && mounted) {
    instance.bridge.loadArtifact(artifact);
  }
  
  async function handleCopy() {
    if (!artifact) return;
    
    try {
      await navigator.clipboard.writeText(artifact.code);
      copied = true;
      setTimeout(() => { copied = false; }, 2000);
    } catch (error) {
      const textarea = document.createElement('textarea');
      textarea.value = artifact.code;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        copied = true;
        setTimeout(() => { copied = false; }, 2000);
      } catch (e) {
        console.error('Failed to copy:', e);
      }
      document.body.removeChild(textarea);
    }
  }
  
  function handleDownload() {
    if (!artifact) return;
    
    const { code, language, title } = artifact;
    const extension = getFileExtension(language);
    const filename = `${title.toLowerCase().replace(/\s+/g, '-')}.${extension}`;
    
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }
  
  function handleViewMode(mode) {
    setViewMode(mode);
  }
</script>

<svelte:window />

{#if panelOpen && artifact}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div class="artifactuse-panel-wrapper">
    <div class={panelClass}>
      <!-- Panel header -->
      <div class="artifactuse-panel-header">
        <div class="artifactuse-panel-title">
          <span class="artifactuse-panel-language">{languageDisplay}</span>
          <span class="artifactuse-panel-name">{artifact.title}</span>
        </div>
        
        <div class="artifactuse-panel-tabs">
          <button 
            class="artifactuse-panel-tab"
            class:active={viewMode === 'preview'}
            on:click={() => handleViewMode('preview')}
            disabled={!artifact.isPreviewable}
          >
            Preview
          </button>
          <button 
            class="artifactuse-panel-tab"
            class:active={viewMode === 'code'}
            on:click={() => handleViewMode('code')}
          >
            Code
          </button>
          <button 
            class="artifactuse-panel-tab"
            class:active={viewMode === 'split'}
            on:click={() => handleViewMode('split')}
            disabled={!artifact.isPreviewable}
          >
            Split
          </button>
        </div>
        
        <div class="artifactuse-panel-actions">
          <button 
            class="artifactuse-panel-action"
            title="Copy code"
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
            class="artifactuse-panel-action"
            title="Download"
            on:click={handleDownload}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </button>
          
          <button 
            class="artifactuse-panel-action"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            on:click={toggleFullscreen}
          >
            {#if !isFullscreen}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 3 21 3 21 9"></polyline>
                <polyline points="9 21 3 21 3 15"></polyline>
                <line x1="21" y1="3" x2="14" y2="10"></line>
                <line x1="3" y1="21" x2="10" y2="14"></line>
              </svg>
            {:else}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="4 14 10 14 10 20"></polyline>
                <polyline points="20 10 14 10 14 4"></polyline>
                <line x1="14" y1="10" x2="21" y2="3"></line>
                <line x1="3" y1="21" x2="10" y2="14"></line>
              </svg>
            {/if}
          </button>
          
          <button 
            class="artifactuse-panel-action artifactuse-panel-close"
            title="Close"
            on:click={closePanel}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
      
      <!-- Panel content -->
      <div class={contentClass}>
        <!-- Preview pane -->
        {#if viewMode === 'preview' || viewMode === 'split'}
          <div class="artifactuse-panel-preview">
            {#if panelUrl}
              <iframe
                bind:this={iframeRef}
                src={panelUrl}
                class="artifactuse-panel-iframe"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                on:load={handleIframeLoad}
                title="Artifact Preview"
              ></iframe>
            {:else}
              <div class="artifactuse-panel-no-preview">
                <p>Preview not available for this artifact type.</p>
              </div>
            {/if}
          </div>
        {/if}
        
        <!-- Code pane -->
        {#if viewMode === 'code' || viewMode === 'split'}
          <div class="artifactuse-panel-code">
            <pre><code>{artifact.code}</code></pre>
          </div>
        {/if}
      </div>
    </div>
    
    <!-- Backdrop -->
    {#if isFullscreen}
      <div 
        class="artifactuse-panel-backdrop"
        on:click={closePanel}
        role="button"
        tabindex="-1"
      ></div>
    {/if}
  </div>
{/if}

<style>
  .artifactuse-panel-wrapper {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 999;
    pointer-events: none;
  }
  
  .artifactuse-panel {
    position: fixed;
    top: 0;
    right: 0;
    width: 50%;
    min-width: 400px;
    max-width: 800px;
    height: 100vh;
    background: rgb(var(--artifactuse-background));
    border-left: 1px solid rgb(var(--artifactuse-border));
    display: flex;
    flex-direction: column;
    z-index: 1000;
    box-shadow: -4px 0 24px rgba(0, 0, 0, 0.2);
    pointer-events: auto;
  }

  .artifactuse-panel--fullscreen {
    width: 100%;
    max-width: none;
    border-left: none;
  }

  .artifactuse-panel-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 16px;
    border-bottom: 1px solid rgb(var(--artifactuse-border));
    background: rgb(var(--artifactuse-surface));
  }

  .artifactuse-panel-title {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .artifactuse-panel-language {
    padding: 4px 8px;
    background: rgba(var(--artifactuse-primary), 0.15);
    color: rgb(var(--artifactuse-primary));
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
  }

  .artifactuse-panel-name {
    font-weight: 600;
    font-size: 14px;
    color: rgb(var(--artifactuse-text));
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .artifactuse-panel-tabs {
    display: flex;
    gap: 4px;
    background: rgba(var(--artifactuse-background), 0.5);
    padding: 4px;
    border-radius: 8px;
  }

  .artifactuse-panel-tab {
    padding: 6px 12px;
    background: transparent;
    border: none;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    color: rgb(var(--artifactuse-text-secondary));
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }

  .artifactuse-panel-tab:hover:not(:disabled) {
    background: rgba(var(--artifactuse-text), 0.1);
    color: rgb(var(--artifactuse-text));
  }

  .artifactuse-panel-tab.active {
    background: rgb(var(--artifactuse-primary));
    color: white;
  }

  .artifactuse-panel-tab:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .artifactuse-panel-actions {
    display: flex;
    gap: 4px;
  }

  .artifactuse-panel-action {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: transparent;
    border: none;
    border-radius: 8px;
    color: rgb(var(--artifactuse-text-secondary));
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }

  .artifactuse-panel-action:hover {
    background: rgba(var(--artifactuse-text), 0.1);
    color: rgb(var(--artifactuse-text));
  }

  .artifactuse-panel-action svg {
    width: 18px;
    height: 18px;
  }

  .artifactuse-panel-close:hover {
    background: rgba(239, 68, 68, 0.15);
    color: rgb(239, 68, 68);
  }

  .artifactuse-panel-content {
    flex: 1;
    display: flex;
    overflow: hidden;
  }

  .artifactuse-panel-content--preview .artifactuse-panel-preview,
  .artifactuse-panel-content--code .artifactuse-panel-code {
    width: 100%;
  }

  .artifactuse-panel-content--split {
    flex-direction: row;
  }

  .artifactuse-panel-content--split .artifactuse-panel-preview,
  .artifactuse-panel-content--split .artifactuse-panel-code {
    width: 50%;
  }

  .artifactuse-panel-content--split .artifactuse-panel-code {
    border-left: 1px solid rgb(var(--artifactuse-border));
  }

  .artifactuse-panel-preview {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .artifactuse-panel-iframe {
    width: 100%;
    height: 100%;
    border: none;
    background: white;
  }

  .artifactuse-panel-no-preview {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: rgb(var(--artifactuse-text-muted));
  }

  .artifactuse-panel-code {
    overflow: auto;
    background: rgb(var(--artifactuse-surface));
  }

  .artifactuse-panel-code pre {
    margin: 0;
    padding: 16px;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
    font-size: 13px;
    line-height: 1.5;
    color: rgb(var(--artifactuse-text));
    white-space: pre-wrap;
    word-break: break-word;
  }

  .artifactuse-panel-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
    pointer-events: auto;
  }

  @media (max-width: 768px) {
    .artifactuse-panel {
      width: 100%;
      min-width: 0;
      max-width: none;
    }
    
    .artifactuse-panel-tabs {
      display: none;
    }
  }
</style>

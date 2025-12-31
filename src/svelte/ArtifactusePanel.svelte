<script>
  import { onMount, onDestroy, createEventDispatcher, tick } from 'svelte';
  import { getArtifactuseContext } from './index.js';
  import { getLanguageDisplayName, getFileExtension, getLanguageIcon, formatBytes } from '../core/detector.js';
  import { normalizeLanguage as normalizeLang, isPrismAvailable } from '../core/highlight.js';
  
  const dispatch = createEventDispatcher();
  
  export let className = '';
  
  const { 
    state,
    activeArtifact, 
    artifactCount,
    closePanel, 
    toggleFullscreen, 
    setViewMode,
    getPanelUrl,
    openArtifact,
    instance,
  } = getArtifactuseContext();
  
  // Refs
  let iframeRef;
  let codeRef;
  let contentRef;
  let lineNumbersRef;
  let codeScrollRef;
  
  // State
  let copied = false;
  let showArtifactList = false;
  let iframeLoading = true;
  let isStreaming = false;
  
  // Panel/split resize state
  let panelWidth = 50;
  let splitPosition = 50;
  let panelResizeState = null;
  let splitResizeState = null;
  
  // Timers
  let updateTimer = null;
  let streamEndTimer = null;
  let iframeLoadTimer = null;
  
  // Reactive declarations
  $: artifact = $activeArtifact;
  $: artifacts = $state.artifacts;
  $: panelOpen = $state.isPanelOpen;
  $: viewMode = $state.viewMode;
  $: isFullscreen = $state.isFullscreen;
  $: count = $artifactCount;
  
  $: languageDisplay = artifact ? getLanguageDisplayName(artifact.language) : '';
  $: languageIcon = artifact ? getLanguageIcon(artifact.language) : '';
  $: panelUrl = artifact ? getPanelUrl(artifact) : null;
  $: normalizedLanguage = artifact ? normalizeLang(artifact.language) : 'plaintext';
  
  $: currentArtifactIndex = artifact && artifacts.length 
    ? artifacts.findIndex(a => a.id === artifact.id) 
    : -1;
  
  $: showBranding = instance?.config?.branding !== false;
  
  $: panelClass = [
    'artifactuse-panel',
    isFullscreen && 'artifactuse-panel--fullscreen',
    className,
  ].filter(Boolean).join(' ');
  
  $: contentClass = `artifactuse-panel__content artifactuse-panel__content--${viewMode}`;
  
  // Watch for artifact changes
  $: if (artifact) {
    handleArtifactChange(artifact);
  }
  
  // Watch for viewMode changes
  $: if (viewMode === 'code' || viewMode === 'split') {
    tick().then(() => updateCodeView());
  }
  
  let prevArtifactId = null;
  let prevArtifactCode = null;
  
  function handleArtifactChange(newArtifact) {
    if (!newArtifact) return;
    
    // Set iframe loading when artifact changes
    if (prevArtifactId !== newArtifact.id) {
      iframeLoading = true;
      startIframeLoadTimeout();
    }
    
    // Check if code changed
    if (prevArtifactCode !== newArtifact.code) {
      isStreaming = true;
      
      // Debounce updates during streaming
      clearTimeout(updateTimer);
      updateTimer = setTimeout(() => {
        generateLineNumbers();
      }, 100);
      
      // Debounce end-of-streaming detection
      clearTimeout(streamEndTimer);
      streamEndTimer = setTimeout(() => {
        isStreaming = false;
        tick().then(() => {
          highlightCode();
          
          if (iframeRef && newArtifact.isPreviewable) {
            iframeLoading = true;
            startIframeLoadTimeout();
            instance.bridge.loadArtifact(newArtifact);
          }
        });
      }, 500);
    }
    
    prevArtifactId = newArtifact.id;
    prevArtifactCode = newArtifact.code;
  }
  
  // Generate line numbers
  function generateLineNumbers() {
    if (!lineNumbersRef || !artifact?.code) return;
    
    const lines = artifact.code.split('\n').length;
    const html = Array.from({ length: lines }, (_, i) => `<div>${i + 1}</div>`).join('');
    lineNumbersRef.innerHTML = html;
  }
  
  // Highlight code with Prism
  function highlightCode() {
    if (codeRef && isPrismAvailable()) {
      window.Prism.highlightElement(codeRef);
      
      tick().then(() => {
        syncPrismBackground();
      });
    }
  }
  
  // Sync Prism theme background to code containers
  function syncPrismBackground() {
    const pre = codeRef?.closest('pre');
    if (pre && codeScrollRef && lineNumbersRef) {
      const computedStyle = window.getComputedStyle(pre);
      const bgColor = computedStyle.backgroundColor;
      if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
        codeScrollRef.style.backgroundColor = bgColor;
        lineNumbersRef.style.backgroundColor = bgColor;
      }
    }
  }
  
  // Update code view
  function updateCodeView() {
    generateLineNumbers();
    if (!isStreaming) {
      highlightCode();
    }
  }
  
  // Handle iframe load
  function handleIframeLoad() {
    clearTimeout(iframeLoadTimer);
    iframeLoading = false;
    if (iframeRef && artifact) {
      instance.bridge.setIframe(iframeRef);
      instance.bridge.loadArtifact(artifact);
    }
  }
  
  // Handle iframe error
  function handleIframeError() {
    clearTimeout(iframeLoadTimer);
    iframeLoading = false;
  }
  
  // Start iframe load timeout
  function startIframeLoadTimeout() {
    clearTimeout(iframeLoadTimer);
    iframeLoadTimer = setTimeout(() => {
      iframeLoading = false;
    }, 10000);
  }
  
  // Handle copy
  async function handleCopy() {
    if (!artifact) return;
    
    try {
      await navigator.clipboard.writeText(artifact.code);
      copied = true;
      setTimeout(() => { copied = false; }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }
  
  // Handle download
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
  
  // Navigate artifacts
  function navigatePrev() {
    if (currentArtifactIndex > 0) {
      openArtifact(artifacts[currentArtifactIndex - 1].id);
    }
  }
  
  function navigateNext() {
    if (currentArtifactIndex < artifacts.length - 1) {
      openArtifact(artifacts[currentArtifactIndex + 1].id);
    }
  }
  
  // Panel resize handlers
  function startPanelResize(e) {
    panelResizeState = {
      startX: e.clientX,
      startWidth: panelWidth,
    };
    
    document.addEventListener('mousemove', handlePanelResize);
    document.addEventListener('mouseup', stopPanelResize);
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
    
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => iframe.style.pointerEvents = 'none');
  }
  
  function handlePanelResize(e) {
    if (!panelResizeState) return;
    
    const windowWidth = window.innerWidth;
    const deltaX = panelResizeState.startX - e.clientX;
    const deltaPercent = (deltaX / windowWidth) * 100;
    const newWidth = panelResizeState.startWidth + deltaPercent;
    
    panelWidth = Math.min(Math.max(newWidth, 25), 75);
  }
  
  function stopPanelResize() {
    panelResizeState = null;
    
    document.removeEventListener('mousemove', handlePanelResize);
    document.removeEventListener('mouseup', stopPanelResize);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => iframe.style.pointerEvents = '');
  }
  
  // Split resize handlers
  function startSplitResize(e) {
    if (!contentRef) return;
    
    const rect = contentRef.getBoundingClientRect();
    splitResizeState = {
      startX: e.clientX,
      containerLeft: rect.left,
      containerWidth: rect.width,
    };
    
    document.addEventListener('mousemove', handleSplitResize);
    document.addEventListener('mouseup', stopSplitResize);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => iframe.style.pointerEvents = 'none');
  }
  
  function handleSplitResize(e) {
    if (!splitResizeState) return;
    
    const { containerLeft, containerWidth } = splitResizeState;
    const relativeX = e.clientX - containerLeft;
    const newPosition = (relativeX / containerWidth) * 100;
    
    splitPosition = Math.min(Math.max(newPosition, 20), 80);
  }
  
  function stopSplitResize() {
    splitResizeState = null;
    
    document.removeEventListener('mousemove', handleSplitResize);
    document.removeEventListener('mouseup', stopSplitResize);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => iframe.style.pointerEvents = '');
  }
  
  // Handle click outside artifact list
  function handleClickOutside(e) {
    if (showArtifactList && !e.target.closest('.artifactuse-panel__nav')) {
      showArtifactList = false;
    }
  }
  
  onMount(() => {
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
    
    document.addEventListener('click', handleClickOutside);
    
    // Initial code view update
    if (panelOpen && artifact) {
      tick().then(() => updateCodeView());
    }
    
    return () => {
      unsubscribeAI();
      unsubscribeSave();
      unsubscribeExport();
      document.removeEventListener('click', handleClickOutside);
      stopPanelResize();
      stopSplitResize();
      clearTimeout(updateTimer);
      clearTimeout(streamEndTimer);
      clearTimeout(iframeLoadTimer);
    };
  });
</script>

{#if panelOpen && artifact}
  <div 
    class={panelClass}
    style={!isFullscreen ? `width: ${panelWidth}%` : undefined}
  >
    <!-- Resize handle -->
    {#if !isFullscreen}
      <button 
        class="artifactuse-panel__resize-handle"
        on:mousedown|preventDefault={startPanelResize}
        aria-label="Resize panel"
      >
        <div class="artifactuse-panel__resize-handle-line"></div>
      </button>
    {/if}
    
    <!-- Header -->
    <header class="artifactuse-panel__header">
      <div class="artifactuse-panel__title">
        <span 
          class="artifactuse-panel__icon"
        >
          {#if languageIcon}
            <svg viewBox="0 0 24 24" fill="currentColor">
              {@html languageIcon}
            </svg>
          {/if}
        </span>
        <div class="artifactuse-panel__title-content">
          <span class="artifactuse-panel__name">{artifact.title || 'Untitled'}</span>
          <span class="artifactuse-panel__meta">
            {languageDisplay}
            {#if artifact.lineCount}
              • {artifact.lineCount} lines
            {/if}
          </span>
        </div>
      </div>
      
      <!-- View mode tabs -->
      <div class="artifactuse-panel__tabs">
        <button 
          class="artifactuse-panel__tab"
          class:artifactuse-panel__tab--active={viewMode === 'preview'}
          disabled={!artifact.isPreviewable}
          title="Preview"
          on:click={() => setViewMode('preview')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </button>
        <button 
          class="artifactuse-panel__tab"
          class:artifactuse-panel__tab--active={viewMode === 'code'}
          title="Code"
          on:click={() => setViewMode('code')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
          </svg>
        </button>
        <button 
          class="artifactuse-panel__tab"
          class:artifactuse-panel__tab--active={viewMode === 'split'}
          disabled={!artifact.isPreviewable}
          title="Split view"
          on:click={() => setViewMode('split')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2"></rect>
            <line x1="12" y1="3" x2="12" y2="21"></line>
          </svg>
        </button>
      </div>
      
      <!-- Actions -->
      <div class="artifactuse-panel__actions">
        <button 
          class="artifactuse-panel__action"
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
          class="artifactuse-panel__action artifactuse-panel__action--close"
          title="Close"
          on:click={closePanel}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </header>
    
    <!-- Content -->
    <div class={contentClass} bind:this={contentRef}>
      <!-- Preview pane -->
      {#if viewMode === 'preview' || viewMode === 'split'}
        <div 
          class="artifactuse-panel__preview"
          style={viewMode === 'split' ? `width: ${splitPosition}%` : undefined}
        >
          <!-- Loading spinner -->
          {#if iframeLoading && panelUrl}
            <div class="artifactuse-panel__loading">
              <div class="artifactuse-panel__spinner"></div>
            </div>
          {/if}
          
          {#if panelUrl}
            <iframe
              bind:this={iframeRef}
              src={panelUrl}
              class="artifactuse-panel__iframe"
              class:artifactuse-panel__iframe--loading={iframeLoading}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
              on:load={handleIframeLoad}
              on:error={handleIframeError}
              title="Artifact Preview"
            ></iframe>
          {:else}
            <div class="artifactuse-panel__no-preview">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M9 17H7A5 5 0 0 1 7 7h2"></path>
                <path d="M15 7h2a5 5 0 1 1 0 10h-2"></path>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
              <p>Preview not available for {languageDisplay}</p>
            </div>
          {/if}
        </div>
      {/if}
      
      <!-- Code pane -->
      {#if viewMode === 'code' || viewMode === 'split'}
        <div 
          class="artifactuse-panel__code"
          style={viewMode === 'split' ? `width: ${100 - splitPosition}%` : undefined}
        >
          <!-- Split resize handle -->
          {#if viewMode === 'split'}
            <button 
              class="artifactuse-panel__split-handle"
              on:mousedown|preventDefault={startSplitResize}
              aria-label="Split Resize"
            >
              <div class="artifactuse-panel__split-handle-line"></div>
            </button>
          {/if}
          
          <div class="artifactuse-panel__code-scroll" bind:this={codeScrollRef}>
            <div class="artifactuse-panel__line-numbers" bind:this={lineNumbersRef}></div>
            <pre class="artifactuse-panel__code-block"><code 
              bind:this={codeRef}
              class="language-{normalizedLanguage}"
            >{artifact.code}</code></pre>
          </div>
        </div>
      {/if}
    </div>
    
    <!-- Footer -->
    <footer class="artifactuse-panel__footer">
      <div class="artifactuse-panel__footer-left">
        <!-- Branding -->
        {#if showBranding}
          <a 
            href="https://artifactuse.com"
            target="_blank"
            rel="noopener noreferrer"
            class="artifactuse-panel__branding"
            title="Powered by Artifactuse"
          >
            <svg width="16" height="16" viewBox="0 0 32 32" fill="currentColor">
              <path d="M16 2L2 9l14 7 14-7-14-7zM2 23l14 7 14-7M2 16l14 7 14-7"></path>
            </svg>
            <span>Artifactuse</span>
          </a>
        {/if}
        
        <!-- Size badge -->
        {#if artifact.code}
          <span class="artifactuse-panel__badge artifactuse-panel__badge--secondary">
            {formatBytes(new Blob([artifact.code]).size)}
          </span>
        {/if}
      </div>
      
      <div class="artifactuse-panel__footer-right">
        <!-- Copy button -->
        <button 
          class="artifactuse-panel__footer-action"
          class:artifactuse-panel__footer-action--success={copied}
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
        
        <!-- Download button -->
        <button 
          class="artifactuse-panel__footer-action"
          title="Download"
          on:click={handleDownload}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
        </button>
        
        <!-- Navigation -->
        {#if count > 1}
          <div class="artifactuse-panel__nav">
            <button 
              class="artifactuse-panel__nav-btn"
              disabled={currentArtifactIndex <= 0}
              title="Previous artifact"
              on:click={navigatePrev}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            
            <button 
              class="artifactuse-panel__nav-trigger"
              on:click={() => showArtifactList = !showArtifactList}
            >
              <span>{currentArtifactIndex + 1} / {count}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            
            <button 
              class="artifactuse-panel__nav-btn"
              disabled={currentArtifactIndex >= artifacts.length - 1}
              title="Next artifact"
              on:click={navigateNext}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
            
            <!-- Artifact list popup -->
            {#if showArtifactList}
              <div class="artifactuse-panel__artifact-list">
                <div class="artifactuse-panel__artifact-list-header">
                  <span>All Artifacts ({count})</span>
                  <button 
                    class="artifactuse-panel__artifact-list-close"
                    on:click={() => showArtifactList = false}
                    aria-label="Close artifact list"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
                <div class="artifactuse-panel__artifact-list-items">
                  {#each artifacts as art, index}
                    <button 
                      class="artifactuse-panel__artifact-item"
                      class:artifactuse-panel__artifact-item--active={art.id === artifact.id}
                      on:click={() => {
                        openArtifact(art.id);
                        showArtifactList = false;
                      }}
                    >
                      <span class="artifactuse-panel__artifact-item-icon">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          {@html getLanguageIcon(art.language) || ''}
                        </svg>
                      </span>
                      <div class="artifactuse-panel__artifact-item-content">
                        <span class="artifactuse-panel__artifact-item-title">
                          {art.title || 'Untitled'}
                        </span>
                        <span class="artifactuse-panel__artifact-item-meta">
                          {getLanguageDisplayName(art.language)}
                          {#if art.lineCount}
                            • {art.lineCount} lines
                          {/if}
                        </span>
                      </div>
                      <span class="artifactuse-panel__artifact-item-index">
                        {index + 1}
                      </span>
                    </button>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </footer>
  </div>
  
  <!-- Backdrop (fullscreen only) -->
  {#if isFullscreen}
    <div 
      class="artifactuse-panel__backdrop"
      on:click={closePanel}
      on:keydown={(e) => e.key === 'Escape' && closePanel()}
      role="button"
      tabindex="-1"
      aria-label="Close panel"
    ></div>
  {/if}
{/if}
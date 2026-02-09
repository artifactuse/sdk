<script>
  import { onMount, onDestroy, createEventDispatcher, tick } from 'svelte';
  import { fade } from 'svelte/transition';
  import { getArtifactuseContext } from './index.js';
  import { getLanguageDisplayName, getFileExtension, getLanguageIcon, formatBytes } from '../core/detector.js';
  import { normalizeLanguage as normalizeLang, isPrismAvailable } from '../core/highlight.js';
  import JSZip from 'jszip';
  
  const dispatch = createEventDispatcher();
  
  export let className = '';
  
  const { 
    state,
    activeArtifact, 
    artifactCount,
    hasArtifacts,
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
  let cameFromList = false;
  let isDownloadingAll = false;
  let isTransitioning = false;

  // Share modal state
  let showShareModal = false;
  let shareModalState = 'options'; // 'options' | 'email' | 'loading' | 'success' | 'verify' | 'error'
  let shareUrl = '';
  let shareExpiresAt = null;
  let shareError = '';
  let shareLinkCopied = false;
  let shareIsSaved = false;
  let savedArtifacts = [];
  let savedArtifactsLoading = false;
  let updatedArtifactName = '';

  // Panel/split resize state
  let panelWidth = 65;
  let splitPosition = 50;
  let panelResizeState = null;
  let splitResizeState = null;

  // Timers
  let streamEndTimer = null;
  let iframeLoadTimer = null;
  
  // Reactive declarations
  $: artifact = $activeArtifact;
  $: artifacts = $state.artifacts;
  $: panelOpen = $state.isPanelOpen;
  $: viewMode = $state.viewMode;
  $: isFullscreen = $state.isFullscreen;
  $: count = $artifactCount;
  $: hasArtifactsValue = $hasArtifacts;
  
  $: languageDisplay = artifact ? getLanguageDisplayName(artifact.language) : '';
  $: languageIcon = artifact ? getLanguageIcon(artifact.language) : '';
  $: panelUrl = artifact ? getPanelUrl(artifact) : null;
  $: normalizedLanguage = artifact ? normalizeLang(artifact.language) : 'plaintext';
  
  $: nonInlineArtifacts = artifacts.filter(a => !a.isInline);
  
  $: currentNonInlineIndex = artifact && nonInlineArtifacts.length 
    ? nonInlineArtifacts.findIndex(a => a.id === artifact.id) 
    : -1;
  
  $: showBranding = instance?.config?.branding !== false;
  $: sharingEnabled = instance?.share?.enabled !== false;
  $: isAuthenticated = instance?.share?.isAuthenticated() || false;

  // Effective panel width - smaller for list/empty views
  $: effectivePanelWidth = !artifact ? Math.min(panelWidth, 30) : panelWidth;
  
  $: panelClass = [
    'artifactuse-panel',
    isFullscreen && 'artifactuse-panel--fullscreen',
    !artifact && hasArtifactsValue && 'artifactuse-panel--list',
    !hasArtifactsValue && 'artifactuse-panel--empty',
    className,
  ].filter(Boolean).join(' ');
  
  $: contentClass = `artifactuse-panel__content artifactuse-panel__content--${viewMode}${isTransitioning ? ' artifactuse-panel__content--transitioning' : ''}`;
  
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
  let prevIsPreviewable = null;

  function handleArtifactChange(newArtifact) {
    if (!newArtifact) return;

    // Check if we're transitioning between different previewability types
    if (prevIsPreviewable !== null && prevIsPreviewable !== newArtifact.isPreviewable) {
      isTransitioning = true;
      setTimeout(() => {
        isTransitioning = false;
      }, 150);
    }
    prevIsPreviewable = newArtifact.isPreviewable;

    // Set iframe loading when artifact changes
    if (prevArtifactId !== newArtifact.id) {
      resetCodeContainerStyles();
      iframeLoading = true;
      startIframeLoadTimeout();
    }

    // Check if code changed
    if (prevArtifactCode !== newArtifact.code) {
      // Update code view immediately on each change
      tick().then(() => updateCodeView());

      // Debounce iframe updates only
      clearTimeout(streamEndTimer);
      streamEndTimer = setTimeout(() => {
        if (iframeRef && newArtifact.isPreviewable) {
          instance.bridge.loadArtifact(newArtifact);
        }
      }, 500);
    }

    prevArtifactId = newArtifact.id;
    prevArtifactCode = newArtifact.code;
  }
  
  // Helper function to get artifact icon
  function getArtifactIconHtml(language) {
    const iconPath = getLanguageIcon(language);
    if (!iconPath) return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>';
    return `<svg viewBox="0 0 24 24" fill="currentColor">${iconPath}</svg>`;
  }
  
  // Go back to list view
  function goBackToList() {
    cameFromList = false;
    instance.state.clearActiveArtifact();
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
    if (codeRef && isPrismAvailable() && artifact?.code) {
      const grammar = window.Prism.languages[normalizedLanguage];
      if (grammar) {
        codeRef.innerHTML = window.Prism.highlight(
          artifact.code,
          grammar,
          normalizedLanguage
        );
      } else {
        // Fallback: set as text if no grammar available
        codeRef.textContent = artifact.code;
      }
      codeRef.dataset.highlighted = 'true';

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

  // Reset code container inline styles
  function resetCodeContainerStyles() {
    if (codeScrollRef) {
      codeScrollRef.style.backgroundColor = '';
    }
    if (lineNumbersRef) {
      lineNumbersRef.style.backgroundColor = '';
    }
  }

  // Update code view
  function updateCodeView() {
    generateLineNumbers();
    highlightCode();
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
    }, 1000);
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
  
  // Handle download all as ZIP
  async function handleDownloadAll() {
    if (isDownloadingAll || nonInlineArtifacts.length === 0) return;
    
    isDownloadingAll = true;
    
    try {
      const zip = new JSZip();
      const usedFilenames = new Map();
      
      for (const art of nonInlineArtifacts) {
        if (!art.code) continue;
        
        const extension = getFileExtension(art.language);
        let baseFilename = (art.title || 'untitled')
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-_]/g, '');
        
        let filename = `${baseFilename}.${extension}`;
        const count = usedFilenames.get(filename) || 0;
        if (count > 0) {
          filename = `${baseFilename}-${count}.${extension}`;
        }
        usedFilenames.set(`${baseFilename}.${extension}`, count + 1);
        
        zip.file(filename, art.code);
      }
      
      const blob = await zip.generateAsync({ type: 'blob' });
      const timestamp = new Date().toISOString().slice(0, 10);
      const zipFilename = `artifacts-${timestamp}.zip`;
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = zipFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to create ZIP:', error);
    } finally {
      isDownloadingAll = false;
    }
  }

  // Share methods
  function formatExpiryDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function toggleSharePopup() {
    if (showShareModal) {
      showShareModal = false;
      return;
    }

    if (!artifact) return;

    shareModalState = 'options';
    shareUrl = '';
    shareExpiresAt = null;
    shareError = '';
    shareLinkCopied = false;
    shareIsSaved = false;
    savedArtifacts = [];
    savedArtifactsLoading = false;
    updatedArtifactName = '';

    showShareModal = true;
  }

  function closeShareModal() {
    showShareModal = false;
  }

  async function handleQuickShare() {
    if (!artifact || !instance?.share) return;

    shareModalState = 'loading';
    shareError = '';

    try {
      const result = await instance.share.share(artifact);
      shareUrl = result.url;
      shareExpiresAt = result.expiresAt;
      shareIsSaved = false;
      shareModalState = 'success';
    } catch (error) {
      shareError = error.message || 'Failed to create share link';
      shareModalState = 'error';
    }
  }

  async function handleSaveOption() {
    if (isAuthenticated) {
      handleSave();
    } else {
      // Open auth popup
      shareModalState = 'loading';
      try {
        await instance.share.openAuthPopup();
        // Auth successful, now save
        handleSave();
      } catch (error) {
        if (error.message === 'Authentication cancelled') {
          shareModalState = 'options';
        } else {
          shareError = error.message || 'Authentication failed';
          shareModalState = 'error';
        }
      }
    }
  }

  async function handleSave() {
    if (!artifact || !instance?.share) return;

    shareModalState = 'loading';
    shareError = '';

    try {
      const result = await instance.share.save(artifact);
      shareUrl = result.url;
      shareExpiresAt = null;
      shareIsSaved = true;
      shareModalState = 'success';
    } catch (error) {
      shareError = error.message || 'Failed to save artifact';
      shareModalState = 'error';
    }
  }

  function retryShare() {
    if (shareIsSaved) {
      handleSave();
    } else {
      handleQuickShare();
    }
  }

  async function handleUpdateOption() {
    if (!instance?.share) return;

    if (!isAuthenticated) {
      shareModalState = 'loading';
      try {
        await instance.share.openAuthPopup();
      } catch (error) {
        if (error.message === 'Authentication cancelled') {
          shareModalState = 'options';
        } else {
          shareError = error.message || 'Authentication failed';
          shareModalState = 'error';
        }
        return;
      }
    }

    shareModalState = 'update-list';
    savedArtifactsLoading = true;

    try {
      const lang = artifact?.language || null;
      const result = await instance.share.listArtifacts(lang);
      savedArtifacts = result.projects || [];
    } catch (error) {
      shareError = error.message || 'Failed to load artifacts';
      shareModalState = 'error';
    } finally {
      savedArtifactsLoading = false;
    }
  }

  async function handleUpdateArtifact(art) {
    if (!artifact || !instance?.share) return;

    const projectUuid = art.project?.uuid;
    if (!projectUuid) return;

    shareModalState = 'loading';
    shareError = '';

    try {
      const result = await instance.share.updateArtifact(projectUuid, artifact);
      shareUrl = result.url || '';
      shareExpiresAt = null;
      shareIsSaved = true;
      updatedArtifactName = art.project?.name || 'Untitled';
      shareModalState = 'success';
    } catch (error) {
      shareError = error.message || 'Failed to update artifact';
      shareModalState = 'error';
    }
  }

  async function copyShareLink() {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      shareLinkCopied = true;
      setTimeout(() => { shareLinkCopied = false; }, 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  }

  // Select artifact from list
  function selectArtifact(art) {
    cameFromList = true;
    openArtifact(art);
    showArtifactList = false;
  }
  
  // Navigate artifacts
  function navigatePrev() {
    if (currentNonInlineIndex > 0) {
      openArtifact(nonInlineArtifacts[currentNonInlineIndex - 1]);
    }
  }
  
  function navigateNext() {
    if (currentNonInlineIndex < nonInlineArtifacts.length - 1) {
      openArtifact(nonInlineArtifacts[currentNonInlineIndex + 1]);
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
    
    document.querySelectorAll('iframe').forEach(iframe => {
      iframe.style.pointerEvents = 'none';
    });
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
    
    document.querySelectorAll('iframe').forEach(iframe => {
      iframe.style.pointerEvents = '';
    });
  }
  
  // Split resize handlers
  function startSplitResize(e) {
    if (!contentRef) return;
    
    const rect = contentRef.getBoundingClientRect();
    splitResizeState = {
      startX: e.clientX,
      startPosition: splitPosition,
      contentLeft: rect.left,
      contentWidth: rect.width,
    };
    
    document.addEventListener('mousemove', handleSplitResize);
    document.addEventListener('mouseup', stopSplitResize);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    
    document.querySelectorAll('iframe').forEach(iframe => {
      iframe.style.pointerEvents = 'none';
    });
  }
  
  function handleSplitResize(e) {
    if (!splitResizeState) return;
    
    const relativeX = e.clientX - splitResizeState.contentLeft;
    const newPosition = (relativeX / splitResizeState.contentWidth) * 100;
    
    splitPosition = Math.min(Math.max(newPosition, 20), 80);
  }
  
  function stopSplitResize() {
    splitResizeState = null;
    
    document.removeEventListener('mousemove', handleSplitResize);
    document.removeEventListener('mouseup', stopSplitResize);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    
    document.querySelectorAll('iframe').forEach(iframe => {
      iframe.style.pointerEvents = '';
    });
  }
  
  onMount(() => {
    instance.on('ai:request', (data) => dispatch('ai-request', data));
    instance.on('save:request', (data) => dispatch('save', data));
    instance.on('export:complete', (data) => dispatch('export', data));
  });
  
  onDestroy(() => {
    stopPanelResize();
    stopSplitResize();
    clearTimeout(streamEndTimer);
    clearTimeout(iframeLoadTimer);
  });
</script>

{#if panelOpen}
  <!-- ============================================ -->
  <!-- EMPTY STATE: No artifacts -->
  <!-- ============================================ -->
  {#if !hasArtifactsValue}
    <div 
      class={panelClass}
      style={!isFullscreen ? `width: ${effectivePanelWidth}%` : undefined}
    >
      {#if !isFullscreen}
        <button 
          class="artifactuse-panel__resize-handle"
          on:mousedown|preventDefault={startPanelResize}
          aria-label="Resize panel"
        >
          <div class="artifactuse-panel__resize-handle-line"></div>
        </button>
      {/if}
      
      <header class="artifactuse-panel__header artifactuse-panel__header--simple">
        <div class="artifactuse-panel__title">
          <span class="artifactuse-panel__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="16 18 22 12 16 6"></polyline>
              <polyline points="8 6 2 12 8 18"></polyline>
            </svg>
          </span>
          <div class="artifactuse-panel__title-content">
            <span class="artifactuse-panel__name">Artifacts</span>
          </div>
        </div>
        <div class="artifactuse-panel__actions">
          <button 
            class="artifactuse-panel__action artifactuse-panel__action--close"
            title="Close panel"
            on:click={closePanel}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </header>
      
      <div class="artifactuse-panel__empty">
        <div class="artifactuse-panel__empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
        </div>
        <h3 class="artifactuse-panel__empty-title">No artifacts yet</h3>
        <p class="artifactuse-panel__empty-text">
          Code blocks, forms, and other interactive content will appear here as the AI generates them.
        </p>
      </div>
      
      <footer class="artifactuse-panel__footer artifactuse-panel__footer--simple">
        {#if showBranding}
          <a 
            href="https://artifactuse.com"
            target="_blank"
            rel="noopener noreferrer"
            class="artifactuse-panel__branding"
          >
            <svg width="16" height="16" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16.6667 41.6673V10.4173C16.6667 9.86478 16.4472 9.33488 16.0565 8.94418C15.6658 8.55348 15.1359 8.33398 14.5833 8.33398H4.16667C3.0616 8.33398 2.00179 8.77297 1.22039 9.55437C0.438987 10.3358 0 11.3956 0 12.5007V37.5006C0 38.6057 0.438987 39.6655 1.22039 40.4469C2.00179 41.2283 3.0616 41.6673 4.16667 41.6673H29.1667C30.2717 41.6673 31.3315 41.2283 32.1129 40.4469C32.8943 39.6655 33.3333 38.6057 33.3333 37.5006V27.084C33.3333 26.5314 33.1138 26.0015 32.7231 25.6108C32.3324 25.2201 31.8025 25.0007 31.25 25.0007H0" fill="#5F51C8"/>
              <path d="M39.5833 0H27.0833C25.9327 0 25 0.93274 25 2.08333V14.5833C25 15.7339 25.9327 16.6667 27.0833 16.6667H39.5833C40.7339 16.6667 41.6667 15.7339 41.6667 14.5833V2.08333C41.6667 0.93274 40.7339 0 39.5833 0Z" fill="#695AE0"/>
            </svg>
            <span>Artifactuse</span>
          </a>
        {/if}
      </footer>
    </div>
  
  <!-- ============================================ -->
  <!-- LIST VIEW: Has artifacts but none selected -->
  <!-- ============================================ -->
  {:else if !artifact}
    <div 
      class={panelClass}
      style={!isFullscreen ? `width: ${effectivePanelWidth}%` : undefined}
    >
      {#if !isFullscreen}
        <button 
          class="artifactuse-panel__resize-handle"
          on:mousedown|preventDefault={startPanelResize}
          aria-label="Resize panel"
        >
          <div class="artifactuse-panel__resize-handle-line"></div>
        </button>
      {/if}
      
      <header class="artifactuse-panel__header artifactuse-panel__header--simple">
        <div class="artifactuse-panel__title">
          <span class="artifactuse-panel__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="16 18 22 12 16 6"></polyline>
              <polyline points="8 6 2 12 8 18"></polyline>
            </svg>
          </span>
          <div class="artifactuse-panel__title-content">
            <span class="artifactuse-panel__name">Artifacts</span>
            <span class="artifactuse-panel__meta">{nonInlineArtifacts.length} available</span>
          </div>
        </div>
        <div class="artifactuse-panel__actions">
          <!-- Download All button -->
          <button 
            class="artifactuse-panel__action"
            class:artifactuse-panel__action--loading={isDownloadingAll}
            disabled={isDownloadingAll}
            title="Download all as ZIP"
            on:click={handleDownloadAll}
          >
            {#if !isDownloadingAll}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            {:else}
              <svg class="artifactuse-panel__spinner-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="32"></circle>
              </svg>
            {/if}
          </button>
          
          <button 
            class="artifactuse-panel__action artifactuse-panel__action--close"
            title="Close panel"
            on:click={closePanel}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </header>
      
      <div class="artifactuse-panel__list">
        <div class="artifactuse-panel__list-items">
          {#each nonInlineArtifacts as art, index (art.id)}
            <button
              class="artifactuse-panel__list-item"
              on:click={() => selectArtifact(art)}
            >
              <span 
                class="artifactuse-panel__list-item-icon"
              >
                {@html getArtifactIconHtml(art.language)}
              </span>
              <div class="artifactuse-panel__list-item-content">
                <span class="artifactuse-panel__list-item-title">
                  {art.title || 'Untitled'}
                </span>
                <span class="artifactuse-panel__list-item-meta">
                  {getLanguageDisplayName(art.language)}
                  {#if art.lineCount}
                    • {art.lineCount} lines
                  {/if}
                </span>
              </div>
              <span class="artifactuse-panel__list-item-arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </span>
            </button>
          {/each}
        </div>
      </div>
      
      <footer class="artifactuse-panel__footer artifactuse-panel__footer--simple">
        {#if showBranding}
          <a 
            href="https://artifactuse.com"
            target="_blank"
            rel="noopener noreferrer"
            class="artifactuse-panel__branding"
          >
            <svg width="16" height="16" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16.6667 41.6673V10.4173C16.6667 9.86478 16.4472 9.33488 16.0565 8.94418C15.6658 8.55348 15.1359 8.33398 14.5833 8.33398H4.16667C3.0616 8.33398 2.00179 8.77297 1.22039 9.55437C0.438987 10.3358 0 11.3956 0 12.5007V37.5006C0 38.6057 0.438987 39.6655 1.22039 40.4469C2.00179 41.2283 3.0616 41.6673 4.16667 41.6673H29.1667C30.2717 41.6673 31.3315 41.2283 32.1129 40.4469C32.8943 39.6655 33.3333 38.6057 33.3333 37.5006V27.084C33.3333 26.5314 33.1138 26.0015 32.7231 25.6108C32.3324 25.2201 31.8025 25.0007 31.25 25.0007H0" fill="#5F51C8"/>
              <path d="M39.5833 0H27.0833C25.9327 0 25 0.93274 25 2.08333V14.5833C25 15.7339 25.9327 16.6667 27.0833 16.6667H39.5833C40.7339 16.6667 41.6667 15.7339 41.6667 14.5833V2.08333C41.6667 0.93274 40.7339 0 39.5833 0Z" fill="#695AE0"/>
            </svg>
            <span>Artifactuse</span>
          </a>
        {/if}
      </footer>
    </div>
  
  <!-- ============================================ -->
  <!-- DETAIL VIEW: Active artifact selected -->
  <!-- ============================================ -->
  {:else}
    <div 
      class={panelClass}
      style={!isFullscreen ? `width: ${panelWidth}%` : undefined}
    >
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
        <!-- Back button (only when navigated from list view) -->
        {#if cameFromList}
          <button 
            class="artifactuse-panel__back"
            title="Back to list"
            on:click={goBackToList}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
        {/if}
        
        <div class="artifactuse-panel__title">
          <span class="artifactuse-panel__icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              {@html languageIcon || ''}
            </svg>
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
        
        <!-- Tabs -->
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
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
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
        <!-- Transition overlay -->
        {#if isTransitioning}
          <div class="artifactuse-panel__loading">
            <div class="artifactuse-panel__spinner"></div>
          </div>
        {/if}

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
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads allow-top-navigation-by-user-activation"
                allow="camera; microphone; fullscreen; geolocation; display-capture; autoplay; clipboard-write"
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
        
        <!-- Code pane - always mounted, shown/hidden via style -->
        <div
          class="artifactuse-panel__code"
          style={viewMode === 'split' ? `width: ${100 - splitPosition}%` : (viewMode === 'code' ? '' : 'display: none')}
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
            <pre class="artifactuse-panel__code-block language-{normalizedLanguage}"><code
              bind:this={codeRef}
              class="language-{normalizedLanguage}"
            ></code></pre>
          </div>
        </div>
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
              <svg width="16" height="16" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.6667 41.6673V10.4173C16.6667 9.86478 16.4472 9.33488 16.0565 8.94418C15.6658 8.55348 15.1359 8.33398 14.5833 8.33398H4.16667C3.0616 8.33398 2.00179 8.77297 1.22039 9.55437C0.438987 10.3358 0 11.3956 0 12.5007V37.5006C0 38.6057 0.438987 39.6655 1.22039 40.4469C2.00179 41.2283 3.0616 41.6673 4.16667 41.6673H29.1667C30.2717 41.6673 31.3315 41.2283 32.1129 40.4469C32.8943 39.6655 33.3333 38.6057 33.3333 37.5006V27.084C33.3333 26.5314 33.1138 26.0015 32.7231 25.6108C32.3324 25.2201 31.8025 25.0007 31.25 25.0007H0" fill="#5F51C8"/>
                <path d="M39.5833 0H27.0833C25.9327 0 25 0.93274 25 2.08333V14.5833C25 15.7339 25.9327 16.6667 27.0833 16.6667H39.5833C40.7339 16.6667 41.6667 15.7339 41.6667 14.5833V2.08333C41.6667 0.93274 40.7339 0 39.5833 0Z" fill="#695AE0"/>
              </svg>
              <span>Artifactuse</span>
            </a>
          {/if}
          
          <!-- Size badge -->
          {#if artifact.code}
            <span class="artifactuse-panel__badge artifactuse-panel__badge--secondary">
              {formatBytes(artifact.size)}
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

          <!-- Share button + popup -->
          {#if sharingEnabled}
            <div style="position: relative;">
              <button
                class="artifactuse-panel__footer-action"
                title="Share"
                on:click={toggleSharePopup}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="18" cy="5" r="3"></circle>
                  <circle cx="6" cy="12" r="3"></circle>
                  <circle cx="18" cy="19" r="3"></circle>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
              </button>

              <!-- Share popup -->
              {#if showShareModal}
                <div class="artifactuse-share-popup" transition:fade={{ duration: 150 }}>
                  <div class="artifactuse-share-popup__header">
                    <span class="artifactuse-share-popup__title">
                      {shareModalState === 'success' ? (updatedArtifactName ? 'Artifact updated!' : 'Link created!') : shareModalState === 'update-list' ? 'Update saved artifact' : 'Share Artifact'}
                    </span>
                    <button
                    aria-label="share"
                    class="artifactuse-share-popup__close" on:click={closeShareModal}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                  <div class="artifactuse-share-popup__body">
                    <!-- Loading state -->
                    {#if shareModalState === 'loading'}
                      <div class="artifactuse-share-popup__loading">
                        <div class="artifactuse-share-popup__spinner"></div>
                        <p class="artifactuse-share-popup__loading-text">Creating link...</p>
                      </div>

                    <!-- Error state -->
                    {:else if shareModalState === 'error'}
                      <div>
                        <div class="artifactuse-share-popup__error">
                          <p class="artifactuse-share-popup__error-text">{shareError}</p>
                        </div>
                        <div class="artifactuse-share-popup__actions">
                          <button class="artifactuse-share-popup__btn artifactuse-share-popup__btn--secondary" on:click={() => shareModalState = 'options'}>
                            Back
                          </button>
                          <button class="artifactuse-share-popup__btn artifactuse-share-popup__btn--primary" on:click={retryShare}>
                            Retry
                          </button>
                        </div>
                      </div>

                    <!-- Options state -->
                    {:else if shareModalState === 'options'}
                      <div class="artifactuse-share-popup__options">
                        <button class="artifactuse-share-popup__option" on:click={handleQuickShare}>
                          <div class="artifactuse-share-popup__option-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                            </svg>
                          </div>
                          <div class="artifactuse-share-popup__option-content">
                            <p class="artifactuse-share-popup__option-title">Share link</p>
                            <p class="artifactuse-share-popup__option-desc">Expires in 30 days</p>
                          </div>
                        </button>
                        <button class="artifactuse-share-popup__option" on:click={handleSaveOption}>
                          <div class="artifactuse-share-popup__option-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                              <polyline points="17 21 17 13 7 13 7 21"></polyline>
                              <polyline points="7 3 7 8 15 8"></polyline>
                            </svg>
                          </div>
                          <div class="artifactuse-share-popup__option-content">
                            <p class="artifactuse-share-popup__option-title">Save to account</p>
                            <p class="artifactuse-share-popup__option-desc">Permanent, manageable</p>
                          </div>
                        </button>
                        <button class="artifactuse-share-popup__option" on:click={handleUpdateOption}>
                          <div class="artifactuse-share-popup__option-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <polyline points="23 4 23 10 17 10"></polyline>
                              <polyline points="1 20 1 14 7 14"></polyline>
                              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                            </svg>
                          </div>
                          <div class="artifactuse-share-popup__option-content">
                            <p class="artifactuse-share-popup__option-title">Update saved</p>
                            <p class="artifactuse-share-popup__option-desc">Replace an existing artifact</p>
                          </div>
                        </button>
                      </div>

                    <!-- Update list state -->
                    {:else if shareModalState === 'update-list'}
                      <div>
                        {#if savedArtifactsLoading}
                          <div class="artifactuse-share-popup__loading">
                            <div class="artifactuse-share-popup__spinner"></div>
                            <p class="artifactuse-share-popup__loading-text">Loading artifacts...</p>
                          </div>
                        {:else if savedArtifacts.length === 0}
                          <div class="artifactuse-share-popup__empty">
                            No saved artifacts of this type
                          </div>
                        {:else}
                          <div class="artifactuse-share-popup__artifact-list">
                            {#each savedArtifacts as art (art.project?.uuid || art.id)}
                              <button
                                class="artifactuse-share-popup__artifact-item"
                                on:click={() => handleUpdateArtifact(art)}
                              >
                                <span class="artifactuse-share-popup__artifact-name">{art.project?.name || 'Untitled'}</span>
                                <span class="artifactuse-share-popup__artifact-date">{formatExpiryDate(art.project?.created_at)}</span>
                              </button>
                            {/each}
                          </div>
                        {/if}
                        <button class="artifactuse-share-popup__back-btn" on:click={() => shareModalState = 'options'}>Back</button>
                      </div>

                    <!-- Success state -->
                    {:else if shareModalState === 'success'}
                      <div class="artifactuse-share-popup__success">
                        <div class="artifactuse-share-popup__success-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </div>
                        <div class="artifactuse-share-popup__link-wrapper">
                          <input
                            type="text"
                            class="artifactuse-share-popup__link"
                            value={shareUrl}
                            readonly
                            on:click={(e) => e.target.select()}
                          />
                          <button
                            class="artifactuse-share-popup__copy-btn"
                            class:artifactuse-share-popup__copy-btn--copied={shareLinkCopied}
                            on:click={copyShareLink}
                          >
                            {shareLinkCopied ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                        {#if shareExpiresAt && !shareIsSaved}
                          <div class="artifactuse-share-popup__expiry">
                            <span class="artifactuse-share-popup__expiry-icon">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                              </svg>
                            </span>
                            <span class="artifactuse-share-popup__expiry-text">
                              Expires {formatExpiryDate(shareExpiresAt)}
                            </span>
                          </div>
                        {/if}
                        {#if !shareIsSaved}
                          <div class="artifactuse-share-popup__save-prompt">
                            <p class="artifactuse-share-popup__save-prompt-text">Keep it permanently?</p>
                            <button class="artifactuse-share-popup__save-prompt-btn" on:click={handleSaveOption}>
                              Save to account
                            </button>
                          </div>
                        {/if}
                      </div>
                    {/if}
                  </div>
                  <div class="artifactuse-share-popup__footer">
                    <a href="https://artifactuse.com" target="_blank" rel="noopener noreferrer" class="artifactuse-share-popup__branding">
                      <svg width="12" height="12" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16.6667 41.6673V10.4173C16.6667 9.86478 16.4472 9.33488 16.0565 8.94418C15.6658 8.55348 15.1359 8.33398 14.5833 8.33398H4.16667C3.0616 8.33398 2.00179 8.77297 1.22039 9.55437C0.438987 10.3358 0 11.3956 0 12.5007V37.5006C0 38.6057 0.438987 39.6655 1.22039 40.4469C2.00179 41.2283 3.0616 41.6673 4.16667 41.6673H29.1667C30.2717 41.6673 31.3315 41.2283 32.1129 40.4469C32.8943 39.6655 33.3333 38.6057 33.3333 37.5006V27.084C33.3333 26.5314 33.1138 26.0015 32.7231 25.6108C32.3324 25.2201 31.8025 25.0007 31.25 25.0007H0" fill="#5F51C8"/>
                        <path d="M39.5833 0H27.0833C25.9327 0 25 0.93274 25 2.08333V14.5833C25 15.7339 25.9327 16.6667 27.0833 16.6667H39.5833C40.7339 16.6667 41.6667 15.7339 41.6667 14.5833V2.08333C41.6667 0.93274 40.7339 0 39.5833 0Z" fill="#695AE0"/>
                      </svg>
                      <span>Powered by Artifactuse</span>
                    </a>
                  </div>
                </div>
              {/if}
            </div>
          {/if}

          <!-- Navigation -->
          {#if nonInlineArtifacts.length > 1}
            <div class="artifactuse-panel__nav">
              <button 
                class="artifactuse-panel__nav-btn"
                disabled={currentNonInlineIndex <= 0}
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
                <span>{currentNonInlineIndex + 1} / {nonInlineArtifacts.length}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              
              <button 
                class="artifactuse-panel__nav-btn"
                disabled={currentNonInlineIndex >= nonInlineArtifacts.length - 1}
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
                    <span>All Artifacts ({nonInlineArtifacts.length})</span>
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
                    {#each nonInlineArtifacts as art, index (art.id)}
                      <button 
                        class="artifactuse-panel__artifact-item"
                        class:artifactuse-panel__artifact-item--active={art.id === artifact.id}
                        on:click={() => selectArtifact(art)}
                      >
                        <span class="artifactuse-panel__artifact-item-icon">
                          {@html getArtifactIconHtml(art.language)}
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

  {/if}
{/if}
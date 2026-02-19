<script>
  import { onMount, onDestroy } from 'svelte';
  import { getArtifactuseContext } from './index.js';
  import ArtifactuseCard from './ArtifactuseCard.svelte';
  import ArtifactuseInlineForm from './ArtifactuseInlineForm.svelte';
  import ArtifactuseSocialPreview from './ArtifactuseSocialPreview.svelte';
  import ArtifactuseViewer from './ArtifactuseViewer.svelte';
  import { createEventDispatcher } from 'svelte';
  
  // Props
  export let content = '';
  export let messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  export let inlineCards = true;
  export let typing = false;
  export let isLastMessage = false; // Whether this is the last/most recent message
  export let inlinePreview = null;
  export let inlineCode = null;
  export let tabs = null;
  export let viewMode = null;
  
  const dispatch = createEventDispatcher();
  
  // Get Artifactuse context
  const { 
    processMessage, 
    openArtifact, 
    getTheme,
    instance,
    activeArtifactId: activeArtifactIdProp
  } = getArtifactuseContext();
  
  // Local state
  let messageRef;
  let contentRef;
  let processedHtml = '';
  let messageArtifacts = [];
  let contentSegments = [];
  let initTimeout = null;
  let prevTyping = typing;
  
  // Track if this message was ever "live" (typed/streamed) in this session
  let wasLiveInSession = false;
  
  // Viewer state
  let viewerOpen = false;
  let viewerType = 'image';
  let viewerSrc = '';
  let viewerAlt = '';
  let viewerCaption = '';
  
  // Reactive theme
  $: theme = typeof getTheme === 'function' ? getTheme() : 'dark';
  
  // Reactive active artifact ID
  $: activeArtifactId = activeArtifactIdProp || null;

  // Resolve inlineCards: component prop → global config → default (true)
  $: effectiveInlineCards = inlineCards ?? instance?.config?.inlineCards ?? true;
  
  // Determine form initial state
  // - 'active' if this message was typed/streamed in current session
  // - 'active' if this is the last message (allows interaction after page reload)
  // - 'inactive' if this message was loaded from history (page refresh)
  $: formInitialState = wasLiveInSession || isLastMessage ? 'active' : 'inactive';
  
  // Track typing to determine if message was live
  $: {
    if (typing) {
      wasLiveInSession = true;
    }
  }
  
  /**
   * Decode Base64 string to JSON object
   * Falls back to HTML entity decoding for legacy data
   */
  function decodeArtifactData(encoded) {
    if (!encoded) return null;
    
    // Try Base64 decoding first
    try {
      const json = decodeURIComponent(escape(atob(encoded)));
      return JSON.parse(json);
    } catch (e) {
      // Fallback: try HTML entity decoding for legacy data
      try {
        const decoded = encoded
          .replace(/&#10;/g, '\n')
          .replace(/&#13;/g, '\r')
          .replace(/&#9;/g, '\t')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&');
        return JSON.parse(decoded);
      } catch (e2) {
        console.error('Failed to parse artifact data:', e2);
        return null;
      }
    }
  }
  
  /**
   * Parse HTML and extract segments (HTML + artifact placeholders)
   */
  function parseContentSegments(html) {
    const segments = [];
    
    if (!html) return segments;
    
    // Regex to match artifact placeholders with Base64 or HTML-encoded data
    const placeholderRegex = /<div\s+class="artifactuse-placeholder[^"]*"[^>]*data-artifact-id="([^"]+)"[^>]*data-artifact-type="([^"]+)"[^>]*data-artifact=["']([^"']*)["'][^>]*><\/div>/gi;
    
    let lastIndex = 0;
    let match;
    
    while ((match = placeholderRegex.exec(html)) !== null) {
      // Add HTML before this placeholder
      if (match.index > lastIndex) {
        const htmlContent = html.slice(lastIndex, match.index);
        if (htmlContent.trim()) {
          segments.push({ type: 'html', content: htmlContent });
        }
      }
      
      // Parse artifact data using Base64 decoding
      const artifactData = decodeArtifactData(match[3]);
      const artifactType = match[2];
      
      if (artifactData) {
        if (artifactType === 'form' && artifactData.isInline) {
          segments.push({ type: 'form', artifact: artifactData });
        } else if (artifactType === 'social') {
          segments.push({ type: 'social', artifact: artifactData });
        } else {
          // Panel artifact (code, non-inline form)
          segments.push({ type: 'panel', artifact: artifactData });
        }
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining HTML after last placeholder
    if (lastIndex < html.length) {
      const htmlContent = html.slice(lastIndex);
      if (htmlContent.trim()) {
        segments.push({ type: 'html', content: htmlContent });
      }
    }
    
    // If no placeholders found, return whole HTML as single segment
    if (segments.length === 0 && html.trim()) {
      segments.push({ type: 'html', content: html });
    }
    
    return segments;
  }
  
  /**
   * Open the media viewer
   */
  function openViewer(data) {
    viewerType = data.type || 'image';
    viewerSrc = data.src || '';
    viewerAlt = data.alt || '';
    viewerCaption = data.caption || '';
    viewerOpen = true;
    
    dispatch('media-open', data);
  }
  
  /**
   * Close the media viewer
   */
  function closeViewer() {
    viewerOpen = false;
    viewerSrc = '';
    viewerAlt = '';
    viewerCaption = '';
  }
  
  /**
   * Attach click listeners to interactive media elements
   */
  function attachMediaListeners() {
    if (!contentRef) return;
    
    // Image lightbox listeners
    const images = contentRef.querySelectorAll('img[data-lightbox="true"]');
    images.forEach(img => {
      if (img._lightboxHandler) {
        img.removeEventListener('click', img._lightboxHandler);
      }
      
      img._lightboxHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        openViewer({
          type: 'image',
          src: img.src,
          alt: img.alt || '',
          caption: img.dataset.caption || img.alt || '',
        });
      };
      
      img.addEventListener('click', img._lightboxHandler);
      img.style.cursor = 'zoom-in';
    });
    
    // Images in containers
    const imageContainers = contentRef.querySelectorAll('.artifactuse-image-container img');
    imageContainers.forEach(img => {
      if (img._lightboxHandler) return;
      
      img._lightboxHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const container = img.closest('.artifactuse-image-container');
        const captionEl = container?.querySelector('.artifactuse-image-caption');
        const caption = captionEl?.textContent || img.dataset.caption || img.alt || '';
        
        openViewer({
          type: 'image',
          src: img.src,
          alt: img.alt || '',
          caption: caption,
        });
      };
      
      img.addEventListener('click', img._lightboxHandler);
      img.style.cursor = 'zoom-in';
    });
    
    // Gallery images
    const galleryImages = contentRef.querySelectorAll('.artifactuse-gallery-item img, .artifactuse-image-gallery img');
    galleryImages.forEach(img => {
      if (img._lightboxHandler) return;
      
      img._lightboxHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const container = img.closest('.artifactuse-gallery-item');
        const captionEl = container?.querySelector('.artifactuse-gallery-caption');
        const caption = captionEl?.textContent || img.dataset.caption || img.alt || '';
        
        openViewer({
          type: 'image',
          src: img.src,
          alt: img.alt || '',
          caption: caption,
        });
      };
      
      img.addEventListener('click', img._lightboxHandler);
      img.style.cursor = 'zoom-in';
    });
    
    // PDF links
    const pdfLinks = contentRef.querySelectorAll('a[href$=".pdf"], a[data-type="pdf"]');
    pdfLinks.forEach(link => {
      if (link._pdfHandler) {
        link.removeEventListener('click', link._pdfHandler);
      }
      
      link._pdfHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        openViewer({
          type: 'pdf',
          src: link.href,
          alt: link.textContent || 'PDF Document',
          caption: link.title || link.textContent || '',
        });
      };
      
      link.addEventListener('click', link._pdfHandler);
    });
    
    // PDF embeds
    const pdfEmbeds = contentRef.querySelectorAll('.artifactuse-pdf-container, [data-pdf-viewer]');
    pdfEmbeds.forEach(embed => {
      if (embed._pdfHandler) {
        embed.removeEventListener('click', embed._pdfHandler);
      }
      
      const pdfSrc = embed.dataset.pdfSrc || embed.querySelector('iframe')?.src || '';
      if (!pdfSrc) return;
      
      embed._pdfHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        openViewer({
          type: 'pdf',
          src: pdfSrc,
          alt: 'PDF Document',
          caption: embed.dataset.caption || '',
        });
      };
      
      embed.addEventListener('click', embed._pdfHandler);
      embed.style.cursor = 'pointer';
    });
    
    // Video previews
    const videoPreviews = contentRef.querySelectorAll('.artifactuse-video-preview-wrapper, .video-preview-wrapper');
    videoPreviews.forEach(preview => {
      if (preview._clickHandler) {
        preview.removeEventListener('click', preview._clickHandler);
      }
      
      preview._clickHandler = (e) => {
        if (e.target.closest('.artifactuse-video-play-button')) return;
        
        const videoUrl = preview.dataset.videoUrl || preview.dataset.url;
        if (videoUrl) {
          window.open(videoUrl, '_blank', 'noopener,noreferrer');
        }
      };
      
      preview.addEventListener('click', preview._clickHandler);
    });
  }
  
  /**
   * Remove media listeners
   */
  function removeMediaListeners() {
    if (!contentRef) return;
    
    const images = contentRef.querySelectorAll('img');
    images.forEach(img => {
      if (img._lightboxHandler) {
        img.removeEventListener('click', img._lightboxHandler);
        delete img._lightboxHandler;
      }
    });
    
    const pdfLinks = contentRef.querySelectorAll('a[href$=".pdf"], a[data-type="pdf"]');
    pdfLinks.forEach(link => {
      if (link._pdfHandler) {
        link.removeEventListener('click', link._pdfHandler);
        delete link._pdfHandler;
      }
    });
    
    const pdfEmbeds = contentRef.querySelectorAll('.artifactuse-pdf-container, [data-pdf-viewer]');
    pdfEmbeds.forEach(embed => {
      if (embed._pdfHandler) {
        embed.removeEventListener('click', embed._pdfHandler);
        delete embed._pdfHandler;
      }
    });
    
    const videoPreviews = contentRef.querySelectorAll('.artifactuse-video-preview-wrapper, .video-preview-wrapper');
    videoPreviews.forEach(preview => {
      if (preview._clickHandler) {
        preview.removeEventListener('click', preview._clickHandler);
        delete preview._clickHandler;
      }
    });
  }
  
  /**
   * Initialize interactive content (math, mermaid, tables, syntax highlighting)
   * Debounced to prevent multiple rapid calls during streaming
   */
  function initializeContent() {
    if (initTimeout) {
      clearTimeout(initTimeout);
    }
    
    initTimeout = setTimeout(async () => {
      if (instance?.initializeContent && contentRef) {
        try {
          await instance.initializeContent(contentRef);
        } catch (error) {
          console.error('Failed to initialize content:', error);
        }
      }
      
      // Attach media listeners after content is initialized
      attachMediaListeners();
    }, 100);
  }
  
  // Process content when it changes
  $: if (content) {
    const result = processMessage(content, messageId, {
      inlinePreview, inlineCode, tabs, viewMode,
    });
    processedHtml = result.html;
    messageArtifacts = result.artifacts;
    contentSegments = parseContentSegments(processedHtml);
    
    // Emit detected artifacts
    if (result.artifacts.length > 0) {
      dispatch('artifact-detected', result.artifacts);
    }
    
    // Initialize content after render (debounced)
    // Skip during typing for better performance
    if (!typing) {
      initializeContent();
    }
  }
  
  // Watch for typing changes
  $: {
    if (prevTyping === true && typing === false) {
      // Typing just finished - initialize content
      initializeContent();
    }
    prevTyping = typing;
  }
  
  // Event handlers
  function handleContentClick(e) {
    const preview = e.target.closest('.artifactuse-inline-preview');
    if (preview) {
      if (preview.dataset.nonClickable) return;
      const artifactId = preview.dataset.artifactId;
      if (artifactId) {
        const artifact = instance?.state?.getArtifact(artifactId);
        if (artifact) {
          handleOpenArtifact(artifact);
        }
      }
    }
  }

  function handleOpenArtifact(artifact) {
    openArtifact(artifact);
    dispatch('artifact-open', artifact);
  }
  
  function handleArtifactCopy(event) {
    dispatch('artifact-copy', event.detail);
  }
  
  function handleArtifactDownload(event) {
    dispatch('artifact-download', event.detail);
  }
  
  function handleFormSubmit(event) {
    dispatch('form-submit', event.detail);
  }
  
  function handleFormCancel(event) {
    dispatch('form-cancel', event.detail);
  }
  
  function handleFormButtonClick(event) {
    dispatch('form-button-click', event.detail);
  }
  
  function handleSocialCopy(event) {
    dispatch('social-copy', event.detail);
  }
  
  // Initialize on mount
  onMount(() => {
    // If typing when mounted, mark as live
    if (typing) {
      wasLiveInSession = true;
    }
    
    if (!typing) {
      initializeContent();
    }
  });
  
  // Cleanup
  onDestroy(() => {
    if (initTimeout) {
      clearTimeout(initTimeout);
    }
    removeMediaListeners();
  });
</script>

<div class="artifactuse-agent-message" bind:this={messageRef}>
  <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
  <div class="artifactuse-message-content" bind:this={contentRef} on:click={handleContentClick} on:keydown={handleContentClick} role="presentation">
    {#each contentSegments as segment, index (segment.type === 'html' ? `html-${index}` : `${segment.type}-${segment.artifact?.id}`)}
      {#if segment.type === 'html'}
        <div>{@html segment.content}</div>
      {:else if segment.type === 'form' && segment.artifact.isInline}
        <ArtifactuseInlineForm
          artifact={segment.artifact}
          {theme}
          initialState={formInitialState}
          on:submit={handleFormSubmit}
          on:cancel={handleFormCancel}
          on:button-click={handleFormButtonClick}
        />
      {:else if segment.type === 'social'}
        <ArtifactuseSocialPreview
          artifact={segment.artifact}
          {theme}
          on:copy={handleSocialCopy}
        />
      {:else if segment.type === 'panel' && effectiveInlineCards}
        <ArtifactuseCard
          artifact={segment.artifact}
          isActive={activeArtifactId === segment.artifact.id}
          on:open={(e) => handleOpenArtifact(e.detail)}
          on:copy={handleArtifactCopy}
          on:download={handleArtifactDownload}
        />
      {/if}
    {/each}
  </div>
  
  <!-- Media Viewer -->
  <ArtifactuseViewer
    isOpen={viewerOpen}
    type={viewerType}
    src={viewerSrc}
    alt={viewerAlt}
    caption={viewerCaption}
    on:close={closeViewer}
  />
</div>
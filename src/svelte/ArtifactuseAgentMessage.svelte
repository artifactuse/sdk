<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import { getArtifactuseContext } from './index.js';
  import ArtifactuseCard from './ArtifactuseCard.svelte';
  import ArtifactuseInlineForm from './ArtifactuseInlineForm.svelte';
  import ArtifactuseSocialPreview from './ArtifactuseSocialPreview.svelte';
  
  export let content = '';
  export let messageId = null;
  export let inlineCards = true;
  
  const dispatch = createEventDispatcher();
  const { processMessage, openArtifact, getTheme } = getArtifactuseContext();
  
  // Get current theme
  $: theme = getTheme?.() || 'dark';
  
  // Generate message ID if not provided
  $: resolvedMessageId = messageId || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Process message content
  $: result = content ? processMessage(content, resolvedMessageId) : { html: '', artifacts: [] };
  $: html = result.html;
  $: artifacts = result.artifacts;
  
  // Parse content into segments
  $: segments = parseContentSegments(html);
  
  // Emit detected artifacts
  $: if (artifacts.length > 0) {
    dispatch('artifactDetected', artifacts);
  }
  
  /**
   * Parse HTML and extract content segments with artifact placeholders
   */
  function parseContentSegments(html) {
    const segments = [];
    
    if (!html) return segments;
    
    // Find all artifact placeholders
    const placeholderRegex = /<div class="artifactuse-placeholder[^"]*"[^>]*data-artifact-id="([^"]+)"[^>]*data-artifact-type="([^"]+)"[^>]*data-artifact='([^']*)'[^>]*><\/div>/g;
    
    let lastIndex = 0;
    let match;
    
    while ((match = placeholderRegex.exec(html)) !== null) {
      // Add HTML before this placeholder
      if (match.index > lastIndex) {
        const htmlContent = html.slice(lastIndex, match.index);
        if (htmlContent.trim()) {
          segments.push({ type: 'html', content: htmlContent, key: `html-${lastIndex}` });
        }
      }
      
      // Parse artifact data
      try {
        const artifactData = JSON.parse(
          match[3]
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
        );
        const artifactType = match[2];
        
        if (artifactType === 'form' && artifactData.isInline) {
          segments.push({ type: 'form', artifact: artifactData, key: `form-${artifactData.id}` });
        } else if (artifactType === 'social') {
          segments.push({ type: 'social', artifact: artifactData, key: `social-${artifactData.id}` });
        } else {
          // Panel artifact (code, non-inline form)
          segments.push({ type: 'panel', artifact: artifactData, key: `panel-${artifactData.id}` });
        }
      } catch (e) {
        console.error('Failed to parse artifact data:', e);
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining HTML after last placeholder
    if (lastIndex < html.length) {
      const htmlContent = html.slice(lastIndex);
      if (htmlContent.trim()) {
        segments.push({ type: 'html', content: htmlContent, key: `html-${lastIndex}` });
      }
    }
    
    // If no placeholders found, return whole HTML as single segment
    if (segments.length === 0 && html.trim()) {
      segments.push({ type: 'html', content: html, key: 'html-full' });
    }
    
    return segments;
  }
  
  function handleOpenArtifact(event) {
    const artifact = event.detail || event;
    openArtifact(artifact);
    dispatch('artifactOpen', artifact);
  }
  
  function handleFormSubmit(event) {
    dispatch('formSubmit', event.detail || event);
  }
  
  function handleFormCancel(event) {
    dispatch('formCancel', event.detail || event);
  }
  
  function handleSocialCopy(event) {
    dispatch('socialCopy', event.detail || event);
  }
</script>

<div class="artifactuse-agent-message">
  <div class="artifactuse-message-content">
    {#each segments as segment (segment.key)}
      {#if segment.type === 'html'}
        {@html segment.content}
      {:else if segment.type === 'form' && segment.artifact.isInline}
        <ArtifactuseInlineForm 
          form={segment.artifact} 
          {theme}
          on:submit={handleFormSubmit}
          on:cancel={handleFormCancel}
        />
      {:else if segment.type === 'social'}
        <ArtifactuseSocialPreview 
          social={segment.artifact} 
          {theme}
          on:copy={handleSocialCopy}
        />
      {:else if segment.type === 'panel' && inlineCards}
        <ArtifactuseCard 
          artifact={segment.artifact} 
          on:open={handleOpenArtifact}
        />
      {/if}
    {/each}
  </div>
</div>

<style>
  .artifactuse-agent-message {
    width: 100%;
  }

  .artifactuse-message-content {
    line-height: 1.6;
  }

  /* Inline artifacts spacing */
  .artifactuse-message-content :global(.artifactuse-social),
  .artifactuse-message-content :global(.artifactuse-inline-form) {
    margin: 1em 0;
  }

  .artifactuse-message-content :global(p) {
    margin: 0 0 1em 0;
  }

  .artifactuse-message-content :global(p:last-child) {
    margin-bottom: 0;
  }

  .artifactuse-message-content :global(h1),
  .artifactuse-message-content :global(h2),
  .artifactuse-message-content :global(h3),
  .artifactuse-message-content :global(h4),
  .artifactuse-message-content :global(h5),
  .artifactuse-message-content :global(h6) {
    margin: 1.5em 0 0.5em 0;
    font-weight: 600;
    line-height: 1.3;
  }

  .artifactuse-message-content :global(h1:first-child),
  .artifactuse-message-content :global(h2:first-child),
  .artifactuse-message-content :global(h3:first-child) {
    margin-top: 0;
  }

  .artifactuse-message-content :global(ul),
  .artifactuse-message-content :global(ol) {
    margin: 0 0 1em 0;
    padding-left: 1.5em;
  }

  .artifactuse-message-content :global(li) {
    margin: 0.25em 0;
  }

  .artifactuse-message-content :global(code) {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
    font-size: 0.9em;
    padding: 0.15em 0.4em;
    background: rgba(var(--artifactuse-surface), 0.5);
    border-radius: 4px;
  }

  .artifactuse-message-content :global(pre) {
    margin: 1em 0;
    padding: 1em;
    background: rgb(var(--artifactuse-surface));
    border-radius: 8px;
    overflow-x: auto;
  }

  .artifactuse-message-content :global(pre code) {
    padding: 0;
    background: none;
  }

  .artifactuse-message-content :global(a) {
    color: rgb(var(--artifactuse-primary));
    text-decoration: none;
  }

  .artifactuse-message-content :global(a:hover) {
    text-decoration: underline;
  }

  .artifactuse-message-content :global(blockquote) {
    margin: 1em 0;
    padding: 0.5em 1em;
    border-left: 4px solid rgb(var(--artifactuse-border));
    background: rgba(var(--artifactuse-surface), 0.3);
  }

  .artifactuse-message-content :global(hr) {
    margin: 1.5em 0;
    border: none;
    border-top: 1px solid rgb(var(--artifactuse-border));
  }

  .artifactuse-message-content :global(table) {
    width: 100%;
    margin: 1em 0;
    border-collapse: collapse;
  }

  .artifactuse-message-content :global(th),
  .artifactuse-message-content :global(td) {
    padding: 0.5em 0.75em;
    border: 1px solid rgb(var(--artifactuse-border));
    text-align: left;
  }

  .artifactuse-message-content :global(th) {
    background: rgba(var(--artifactuse-surface), 0.5);
    font-weight: 600;
  }

  .artifactuse-message-content :global(img) {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
  }
</style>

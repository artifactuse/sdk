// ArtifactuseAgentMessage.jsx
// React component for rendering AI agent messages with artifact support

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useArtifactuse } from './index';
import ArtifactuseCard from './ArtifactuseCard';
import ArtifactuseInlineForm from './ArtifactuseInlineForm';
import ArtifactuseInlineWidget from './ArtifactuseInlineWidget';
import ArtifactuseSocialPreview from './ArtifactuseSocialPreview';
import ArtifactuseViewer from './ArtifactuseViewer';

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
      } else if (artifactType === 'widget') {
        segments.push({ type: 'widget', artifact: artifactData });
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
 * Generate unique message ID
 */
function generateMessageId() {
  return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * ArtifactuseAgentMessage Component
 * Renders AI agent message content with inline artifacts
 */
export default function ArtifactuseAgentMessage({
  content,
  messageId = generateMessageId(),
  inlineCards = true,
  typing = false,
  isLastMessage = false, // Whether this is the last/most recent message
  inlinePreview = null,
  inlineCode = null,
  tabs = null,
  viewMode = null,
  onArtifactDetected,
  onArtifactOpen,
  onArtifactCopy,
  onArtifactDownload,
  onFormSubmit,
  onFormCancel,
  onFormButtonClick,
  onWidgetAction,
  onWidgetStateChange,
  onWidgetHeightChange,
  onWidgetFollowUp,
  onSocialCopy,
  onMediaOpen,
  className = '',
}) {
  const {
    processMessage,
    openArtifact,
    state,
    getTheme,
    instance,
  } = useArtifactuse();
  
  const messageRef = useRef(null);
  const contentRef = useRef(null);
  const initTimeoutRef = useRef(null);
  const prevTypingRef = useRef(typing);
  
  const [processedHtml, setProcessedHtml] = useState('');
  const [messageArtifacts, setMessageArtifacts] = useState([]);
  
  // Track if this message was ever "live" (typed/streamed) in this session
  const [wasLiveInSession, setWasLiveInSession] = useState(false);
  
  // Viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerType, setViewerType] = useState('image');
  const [viewerSrc, setViewerSrc] = useState('');
  const [viewerAlt, setViewerAlt] = useState('');
  const [viewerCaption, setViewerCaption] = useState('');
  
  // Get current theme
  const theme = useMemo(() => {
    return typeof getTheme === 'function' ? getTheme() : 'dark';
  }, [getTheme]);
  
  // Get active artifact ID from state
  const activeArtifactId = state?.activeArtifactId || null;

  // Resolve inlineCards: component prop → global config → default (true)
  const effectiveInlineCards = inlineCards ?? instance?.config?.inlineCards ?? true;

  // Parse content segments
  const contentSegments = useMemo(() => {
    return parseContentSegments(processedHtml);
  }, [processedHtml]);
  
  /**
   * Determine form initial state
   * - 'active' if this message was typed/streamed in current session
   * - 'active' if this is the last message (allows interaction after page reload)
   * - 'inactive' if this message was loaded from history (page refresh)
   */
  const formInitialState = useMemo(() => {
    if (wasLiveInSession) return 'active';
    if (isLastMessage) return 'active';
    return 'inactive';
  }, [wasLiveInSession, isLastMessage]);
  
  // Track typing to determine if message was live
  useEffect(() => {
    if (typing) {
      setWasLiveInSession(true);
    }
  }, [typing]);
  
  /**
   * Open the media viewer
   */
  const openViewer = useCallback((data) => {
    setViewerType(data.type || 'image');
    setViewerSrc(data.src || '');
    setViewerAlt(data.alt || '');
    setViewerCaption(data.caption || '');
    setViewerOpen(true);
    
    if (onMediaOpen) {
      onMediaOpen(data);
    }
  }, [onMediaOpen]);
  
  /**
   * Close the media viewer
   */
  const closeViewer = useCallback(() => {
    setViewerOpen(false);
    setViewerSrc('');
    setViewerAlt('');
    setViewerCaption('');
  }, []);
  
  /**
   * Attach click listeners to interactive media elements
   */
  const attachMediaListeners = useCallback(() => {
    if (!contentRef.current) return;
    
    // Image lightbox listeners
    const images = contentRef.current.querySelectorAll('img[data-lightbox="true"]');
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
    const imageContainers = contentRef.current.querySelectorAll('.artifactuse-image-container img');
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
    const galleryImages = contentRef.current.querySelectorAll('.artifactuse-gallery-item img, .artifactuse-image-gallery img');
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
    const pdfLinks = contentRef.current.querySelectorAll('a[href$=".pdf"], a[data-type="pdf"]');
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
    const pdfEmbeds = contentRef.current.querySelectorAll('.artifactuse-pdf-container, [data-pdf-viewer]');
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
    const videoPreviews = contentRef.current.querySelectorAll('.artifactuse-video-preview-wrapper, .video-preview-wrapper');
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
  }, [openViewer]);
  
  /**
   * Remove media listeners
   */
  const removeMediaListeners = useCallback(() => {
    if (!contentRef.current) return;
    
    const images = contentRef.current.querySelectorAll('img');
    images.forEach(img => {
      if (img._lightboxHandler) {
        img.removeEventListener('click', img._lightboxHandler);
        delete img._lightboxHandler;
      }
    });
    
    const pdfLinks = contentRef.current.querySelectorAll('a[href$=".pdf"], a[data-type="pdf"]');
    pdfLinks.forEach(link => {
      if (link._pdfHandler) {
        link.removeEventListener('click', link._pdfHandler);
        delete link._pdfHandler;
      }
    });
    
    const pdfEmbeds = contentRef.current.querySelectorAll('.artifactuse-pdf-container, [data-pdf-viewer]');
    pdfEmbeds.forEach(embed => {
      if (embed._pdfHandler) {
        embed.removeEventListener('click', embed._pdfHandler);
        delete embed._pdfHandler;
      }
    });
    
    const videoPreviews = contentRef.current.querySelectorAll('.artifactuse-video-preview-wrapper, .video-preview-wrapper');
    videoPreviews.forEach(preview => {
      if (preview._clickHandler) {
        preview.removeEventListener('click', preview._clickHandler);
        delete preview._clickHandler;
      }
    });
  }, []);
  
  /**
   * Initialize interactive content (math, mermaid, tables, syntax highlighting)
   * Debounced to prevent multiple rapid calls during streaming
   */
  const initializeContent = useCallback(() => {
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current);
    }
    
    initTimeoutRef.current = setTimeout(async () => {
      if (instance?.initializeContent && contentRef.current) {
        try {
          await instance.initializeContent(contentRef.current);
        } catch (error) {
          console.error('Failed to initialize content:', error);
        }
      }
      
      // Attach media listeners after content is initialized
      attachMediaListeners();
    }, 100);
  }, [instance, attachMediaListeners]);
  
  // Process message when content changes
  useEffect(() => {
    if (content) {
      const result = processMessage(content, messageId, {
        inlinePreview, inlineCode, tabs, viewMode,
      });
      setProcessedHtml(result.html);
      setMessageArtifacts(result.artifacts);
      
      // Emit detected artifacts
      if (result.artifacts.length > 0 && onArtifactDetected) {
        onArtifactDetected(result.artifacts);
      }
      
      // Initialize content after render (debounced)
      // Skip during typing for better performance
      if (!typing) {
        initializeContent();
      }
    }
  }, [content, messageId, processMessage, typing, initializeContent, onArtifactDetected]);
  
  // When typing stops, initialize content
  useEffect(() => {
    if (prevTypingRef.current === true && typing === false) {
      // Typing just finished - initialize content
      initializeContent();
    }
    prevTypingRef.current = typing;
  }, [typing, initializeContent]);
  
  // Initialize on mount
  useEffect(() => {
    // If typing when mounted, mark as live
    if (typing) {
      setWasLiveInSession(true);
    }
    
    if (!typing) {
      initializeContent();
    }
    
    // Cleanup
    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
      removeMediaListeners();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Event handlers
  const handleContentClick = useCallback((e) => {
    const preview = e.target.closest('.artifactuse-inline-preview');
    if (preview) {
      if (preview.dataset.nonClickable) return;
      const artifactId = preview.dataset.artifactId;
      if (artifactId) {
        const artifact = state.artifacts.find(a => a.id === artifactId);
        if (artifact) {
          openArtifact(artifact);
          if (onArtifactOpen) {
            onArtifactOpen(artifact);
          }
        }
      }
    }
  }, [state, openArtifact, onArtifactOpen]);

  const handleOpenArtifact = useCallback((artifact) => {
    openArtifact(artifact);
    if (onArtifactOpen) {
      onArtifactOpen(artifact);
    }
  }, [openArtifact, onArtifactOpen]);
  
  const handleArtifactCopy = useCallback((artifact) => {
    if (onArtifactCopy) {
      onArtifactCopy(artifact);
    }
  }, [onArtifactCopy]);
  
  const handleArtifactDownload = useCallback((artifact) => {
    if (onArtifactDownload) {
      onArtifactDownload(artifact);
    }
  }, [onArtifactDownload]);
  
  const handleFormSubmit = useCallback((data) => {
    if (onFormSubmit) {
      onFormSubmit(data);
    }
  }, [onFormSubmit]);
  
  const handleFormCancel = useCallback((data) => {
    if (onFormCancel) {
      onFormCancel(data);
    }
  }, [onFormCancel]);
  
  const handleFormButtonClick = useCallback((data) => {
    if (onFormButtonClick) {
      onFormButtonClick(data);
    }
  }, [onFormButtonClick]);
  
  const handleSocialCopy = useCallback((data) => {
    if (onSocialCopy) {
      onSocialCopy(data);
    }
  }, [onSocialCopy]);
  
  // Render segments
  const renderSegment = (segment, index) => {
    switch (segment.type) {
      case 'html':
        return (
          <div
            key={`html-${index}`}
            dangerouslySetInnerHTML={{ __html: segment.content }}
          />
        );
      
      case 'form':
        if (segment.artifact.isInline) {
          return (
            <ArtifactuseInlineForm
              key={`form-${segment.artifact.id}`}
              artifact={segment.artifact}
              theme={theme}
              initialState={formInitialState}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
              onButtonClick={handleFormButtonClick}
            />
          );
        }
        return null;

      case 'widget':
        return (
          <ArtifactuseInlineWidget
            key={`widget-${segment.artifact.id}`}
            artifact={segment.artifact}
            theme={theme}
            pending={typing}
            onAction={onWidgetAction}
            onStateChange={onWidgetStateChange}
            onHeightChange={onWidgetHeightChange}
            onFollowUp={onWidgetFollowUp}
          />
        );
      
      case 'social':
        return (
          <ArtifactuseSocialPreview
            key={`social-${segment.artifact.id}`}
            artifact={segment.artifact}
            theme={theme}
            onCopy={handleSocialCopy}
          />
        );
      
      case 'panel':
        if (effectiveInlineCards) {
          return (
            <ArtifactuseCard
              key={`panel-${segment.artifact.id}`}
              artifact={segment.artifact}
              isActive={activeArtifactId === segment.artifact.id}
              onOpen={handleOpenArtifact}
              onCopy={handleArtifactCopy}
              onDownload={handleArtifactDownload}
            />
          );
        }
        return null;
      
      default:
        return null;
    }
  };
  
  return (
    <div 
      ref={messageRef}
      className={`artifactuse-agent-message ${className}`.trim()}
    >
      <div ref={contentRef} className="artifactuse-message-content" onClick={handleContentClick}>
        {contentSegments.map(renderSegment)}
      </div>
      
      {/* Media Viewer */}
      <ArtifactuseViewer
        isOpen={viewerOpen}
        type={viewerType}
        src={viewerSrc}
        alt={viewerAlt}
        caption={viewerCaption}
        onClose={closeViewer}
      />
    </div>
  );
}

// PropTypes (optional, for documentation)
ArtifactuseAgentMessage.propTypes = {
  /** The raw message content (markdown/HTML from AI) */
  content: (props, propName) => {
    if (typeof props[propName] !== 'string') {
      return new Error(`${propName} must be a string`);
    }
  },
  /** Unique message ID */
  messageId: (props, propName) => {
    if (props[propName] !== undefined && typeof props[propName] !== 'string') {
      return new Error(`${propName} must be a string`);
    }
  },
  /** Whether to show artifact cards inline */
  inlineCards: (props, propName) => {
    if (props[propName] !== undefined && typeof props[propName] !== 'boolean') {
      return new Error(`${propName} must be a boolean`);
    }
  },
  /** Whether the message is still being typed/streamed */
  typing: (props, propName) => {
    if (props[propName] !== undefined && typeof props[propName] !== 'boolean') {
      return new Error(`${propName} must be a boolean`);
    }
  },
  /** Whether this is the last/most recent message in the conversation */
  isLastMessage: (props, propName) => {
    if (props[propName] !== undefined && typeof props[propName] !== 'boolean') {
      return new Error(`${propName} must be a boolean`);
    }
  },
  /** Override global inlinePreview config for this message */
  inlinePreview: (props, propName) => {
    if (props[propName] !== undefined && props[propName] !== null && typeof props[propName] !== 'object') {
      return new Error(`${propName} must be an object or null`);
    }
  },
  /** Show full inline code (no extraction) for listed languages */
  inlineCode: (props, propName) => {
    if (props[propName] !== undefined && props[propName] !== null && typeof props[propName] !== 'object') {
      return new Error(`${propName} must be an object or null`);
    }
  },
  /** Override visible panel tabs for artifacts from this message */
  tabs: (props, propName) => {
    if (props[propName] !== undefined && props[propName] !== null && !Array.isArray(props[propName])) {
      return new Error(`${propName} must be an array or null`);
    }
  },
  /** Override initial panel view mode for artifacts from this message */
  viewMode: (props, propName) => {
    if (props[propName] !== undefined && props[propName] !== null && typeof props[propName] !== 'string') {
      return new Error(`${propName} must be a string or null`);
    }
  },
};

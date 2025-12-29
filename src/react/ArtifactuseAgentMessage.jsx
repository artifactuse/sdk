// artifactuse/react/ArtifactuseAgentMessage.jsx
// React component for rendering AI agent messages with artifact detection

import React, { useMemo, useEffect, useCallback } from 'react';
import { useArtifactuse } from './index.jsx';
import ArtifactuseCard from './ArtifactuseCard.jsx';
import { ArtifactuseInlineForm } from './ArtifactuseInlineForm.jsx';
import { ArtifactuseSocialPreview } from './ArtifactuseSocialPreview.jsx';

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

/**
 * ArtifactuseAgentMessage Component
 * 
 * Renders AI agent messages with automatic artifact detection
 * Inline artifacts (forms, social previews) are rendered directly in the message
 */
export default function ArtifactuseAgentMessage({
  content,
  messageId,
  inlineCards = true,
  onArtifactDetected,
  onArtifactOpen,
  onFormSubmit,
  onFormCancel,
  onSocialCopy,
  className = '',
}) {
  const { processMessage, openArtifact, getTheme } = useArtifactuse();
  
  // Get current theme
  const theme = getTheme?.() || 'dark';
  
  // Generate message ID if not provided
  const resolvedMessageId = useMemo(() => {
    return messageId || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, [messageId]);
  
  // Process message content
  const { html, artifacts } = useMemo(() => {
    if (!content) return { html: '', artifacts: [] };
    return processMessage(content, resolvedMessageId);
  }, [content, resolvedMessageId, processMessage]);
  
  // Parse content into segments
  const segments = useMemo(() => parseContentSegments(html), [html]);
  
  // Emit detected artifacts
  useEffect(() => {
    if (artifacts.length > 0 && onArtifactDetected) {
      onArtifactDetected(artifacts);
    }
  }, [artifacts, onArtifactDetected]);
  
  // Handle artifact open
  const handleOpenArtifact = useCallback((artifact) => {
    openArtifact(artifact);
    onArtifactOpen?.(artifact);
  }, [openArtifact, onArtifactOpen]);
  
  // Handle form submit
  const handleFormSubmit = useCallback((data) => {
    onFormSubmit?.(data);
  }, [onFormSubmit]);
  
  // Handle form cancel
  const handleFormCancel = useCallback((data) => {
    onFormCancel?.(data);
  }, [onFormCancel]);
  
  // Handle social copy
  const handleSocialCopy = useCallback((data) => {
    onSocialCopy?.(data);
  }, [onSocialCopy]);
  
  return (
    <div className={`artifactuse-agent-message ${className}`}>
      <div className="artifactuse-message-content">
        {segments.map((segment) => {
          switch (segment.type) {
            case 'html':
              return (
                <div 
                  key={segment.key}
                  dangerouslySetInnerHTML={{ __html: segment.content }}
                />
              );
            
            case 'form':
              return (
                <ArtifactuseInlineForm
                  key={segment.key}
                  form={segment.artifact}
                  theme={theme}
                  onSubmit={handleFormSubmit}
                  onCancel={handleFormCancel}
                />
              );
            
            case 'social':
              return (
                <ArtifactuseSocialPreview
                  key={segment.key}
                  social={segment.artifact}
                  theme={theme}
                  onCopy={handleSocialCopy}
                />
              );
            
            case 'panel':
              return inlineCards ? (
                <ArtifactuseCard
                  key={segment.key}
                  artifact={segment.artifact}
                  onOpen={handleOpenArtifact}
                />
              ) : null;
            
            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}

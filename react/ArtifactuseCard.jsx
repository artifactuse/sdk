// artifactuse/react/ArtifactuseCard.jsx
// React component for artifact card display

import React, { useState, useMemo, useCallback } from 'react';
import { getLanguageDisplayName } from '../core/detector.js';

/**
 * ArtifactuseCard Component
 * 
 * Displays an artifact as an interactive card
 */
export default function ArtifactuseCard({
  artifact,
  showPreview = true,
  previewLines = 4,
  isActive = false,
  onOpen,
  onCopy,
  className = '',
}) {
  const [copied, setCopied] = useState(false);
  
  const languageDisplay = useMemo(() => {
    return getLanguageDisplayName(artifact.language);
  }, [artifact.language]);
  
  const codePreview = useMemo(() => {
    const lines = artifact.code.split('\n');
    const preview = lines.slice(0, previewLines);
    
    if (lines.length > previewLines) {
      return preview.join('\n') + '\n...';
    }
    
    return preview.join('\n');
  }, [artifact.code, previewLines]);
  
  const handleClick = useCallback(() => {
    if (artifact.isPreviewable && onOpen) {
      onOpen(artifact);
    }
  }, [artifact, onOpen]);
  
  const handleOpen = useCallback((e) => {
    e.stopPropagation();
    if (onOpen) {
      onOpen(artifact);
    }
  }, [artifact, onOpen]);
  
  const handleCopy = useCallback(async (e) => {
    e.stopPropagation();
    
    try {
      await navigator.clipboard.writeText(artifact.code);
      setCopied(true);
      if (onCopy) {
        onCopy(artifact);
      }
      
      setTimeout(() => {
        setCopied(false);
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
        setCopied(true);
        if (onCopy) {
          onCopy(artifact);
        }
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      } catch (e) {
        console.error('Failed to copy:', e);
      }
      document.body.removeChild(textarea);
    }
  }, [artifact, onCopy]);
  
  const formatSize = useCallback((bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }, []);
  
  const cardClasses = [
    'artifactuse-card',
    artifact.isPreviewable && 'artifactuse-card--previewable',
    isActive && 'artifactuse-card--active',
    className,
  ].filter(Boolean).join(' ');
  
  return (
    <div className={cardClasses} onClick={handleClick}>
      {/* Card header */}
      <div className="artifactuse-card-header">
        {/* Language icon */}
        <div className="artifactuse-card-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
          </svg>
        </div>
        
        {/* Title and language */}
        <div className="artifactuse-card-info">
          <span className="artifactuse-card-title">{artifact.title}</span>
          <span className="artifactuse-card-language">{languageDisplay}</span>
        </div>
        
        {/* Actions */}
        <div className="artifactuse-card-actions">
          {artifact.isPreviewable && (
            <button 
              className="artifactuse-card-action"
              title="Open in panel"
              onClick={handleOpen}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </button>
          )}
          
          <button 
            className="artifactuse-card-action"
            title="Copy code"
            onClick={handleCopy}
          >
            {!copied ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            )}
          </button>
        </div>
      </div>
      
      {/* Code preview */}
      {showPreview && (
        <div className="artifactuse-card-preview">
          <pre><code>{codePreview}</code></pre>
        </div>
      )}
      
      {/* Footer with stats */}
      <div className="artifactuse-card-footer">
        <span className="artifactuse-card-stat">{artifact.lineCount} lines</span>
        <span className="artifactuse-card-stat">{formatSize(artifact.size)}</span>
      </div>
    </div>
  );
}

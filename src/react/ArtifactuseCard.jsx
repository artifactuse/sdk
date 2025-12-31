// artifactuse/react/ArtifactuseCard.jsx
// React component for artifact card display

import React, { useState, useMemo, useCallback } from 'react';
import { getLanguageDisplayName, getFileExtension, getLanguageIcon, formatBytes } from '../core/detector.js';

/**
 * ArtifactuseCard Component
 * 
 * Displays an artifact as a sleek, compact card
 */
export default function ArtifactuseCard({
  artifact,
  isActive = false,
  onOpen,
  onCopy,
  onDownload,
  className = '',
}) {
  const [copied, setCopied] = useState(false);
  
  const displayType = useMemo(() => {
    return getLanguageDisplayName(artifact.language);
  }, [artifact.language]);
  
  const formattedSize = useMemo(() => {
    return formatBytes(artifact.size || artifact.code?.length || 0);
  }, [artifact.size, artifact.code]);
  
  const iconPath = useMemo(() => {
    return getLanguageIcon(artifact.language);
  }, [artifact.language]);
  
  const handleClick = useCallback((e) => {
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
  
  const handleDownload = useCallback((e) => {
    e.stopPropagation();
    
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
    
    if (onDownload) {
      onDownload(artifact);
    }
  }, [artifact, onDownload]);
  
  const cardClasses = [
    'artifactuse-card',
    isActive && 'artifactuse-card--active',
    className,
  ].filter(Boolean).join(' ');
  
  return (
    <div className={cardClasses} onClick={handleClick}>
      {/* Icon */}
      <div className="artifactuse-card__icon">
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1.5"
          dangerouslySetInnerHTML={{ __html: iconPath }}
        />
      </div>
      
      {/* Content */}
      <div className="artifactuse-card__content">
        <div className="artifactuse-card__title">{artifact.title}</div>
        <div className="artifactuse-card__meta">
          <span className="artifactuse-card__type">{displayType}</span>
          <span className="artifactuse-card__separator">•</span>
          <span className="artifactuse-card__size">{formattedSize}</span>
        </div>
      </div>
      
      {/* Actions */}
      <div className="artifactuse-card__actions">
        <button 
          className="artifactuse-card__action"
          title={copied ? 'Copied!' : 'Copy code'}
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
        
        <button 
          className="artifactuse-card__action"
          title="Download file"
          onClick={handleDownload}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
        </button>
      </div>
      
      {/* Arrow */}
      <div className="artifactuse-card__arrow">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </div>
    </div>
  );
}
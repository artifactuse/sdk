// artifactuse/react/ArtifactuseViewer.jsx
// React component for viewing images, PDFs, and other media

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

/**
 * ArtifactuseViewer Component
 * 
 * Fullscreen viewer for images and PDFs with zoom and download
 */
export default function ArtifactuseViewer({
  isOpen = false,
  type = 'image',
  src = '',
  alt = '',
  caption = '',
  onClose,
  className = '',
}) {
  const overlayRef = useRef(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Ensure we're mounted before creating portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  // Handle body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      overlayRef.current?.focus();
    } else {
      document.body.style.overflow = '';
      setIsZoomed(false);
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  // Handle escape key
  useEffect(() => {
    function handleKeydown(e) {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    }
    
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [isOpen, onClose]);
  
  const handleClose = useCallback(() => {
    setIsZoomed(false);
    if (onClose) onClose();
  }, [onClose]);
  
  const toggleZoom = useCallback(() => {
    if (type === 'image') {
      setIsZoomed(prev => !prev);
    }
  }, [type]);
  
  const handleDownload = useCallback(() => {
    const link = document.createElement('a');
    link.href = src;
    link.download = alt || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [src, alt]);
  
  if (!isOpen || !mounted) {
    return null;
  }
  
  const content = (
    <div 
      ref={overlayRef}
      className={`artifactuse-viewer-overlay ${className}`}
      onClick={handleClose}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
    >
      <div className="artifactuse-viewer-content" onClick={(e) => e.stopPropagation()}>
        {/* Image */}
        {type === 'image' && (
          <img 
            src={src} 
            alt={alt}
            className={`artifactuse-viewer-image ${isZoomed ? 'artifactuse-viewer-image--zoomed' : ''}`}
            onClick={toggleZoom}
          />
        )}
        
        {/* PDF */}
        {type === 'pdf' && (
          <iframe
            src={src}
            className="artifactuse-viewer-pdf"
            title={alt || 'PDF Viewer'}
          />
        )}
        
        {/* Close button */}
        <button 
          className="artifactuse-viewer-close"
          onClick={handleClose}
          title="Close (Esc)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        
        {/* Zoom controls (images only) */}
        {type === 'image' && (
          <div className="artifactuse-viewer-controls">
            <button 
              className="artifactuse-viewer-control"
              onClick={toggleZoom}
              title={isZoomed ? 'Zoom out' : 'Zoom in'}
            >
              {!isZoomed ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  <line x1="11" y1="8" x2="11" y2="14"></line>
                  <line x1="8" y1="11" x2="14" y2="11"></line>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  <line x1="8" y1="11" x2="14" y2="11"></line>
                </svg>
              )}
            </button>
            
            <button 
              className="artifactuse-viewer-control"
              onClick={handleDownload}
              title="Download"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </button>
          </div>
        )}
        
        {/* Caption */}
        {caption && (
          <div className="artifactuse-viewer-caption">
            {caption}
          </div>
        )}
      </div>
    </div>
  );
  
  return createPortal(content, document.body);
}

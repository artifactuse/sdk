// artifactuse/react/ArtifactusePanel.jsx
// React component for artifact panel viewer

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useArtifactuse } from './index.jsx';
import { getLanguageDisplayName, getFileExtension } from '../core/detector.js';

/**
 * ArtifactusePanel Component
 * 
 * Side panel for viewing artifact previews and code
 */
export default function ArtifactusePanel({
  onAIRequest,
  onSave,
  onExport,
  className = '',
}) {
  const { 
    state, 
    activeArtifact, 
    closePanel, 
    toggleFullscreen, 
    setViewMode,
    getPanelUrl,
    instance,
  } = useArtifactuse();
  
  const iframeRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Ensure we're mounted before creating portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  const languageDisplay = useMemo(() => {
    if (!activeArtifact) return '';
    return getLanguageDisplayName(activeArtifact.language);
  }, [activeArtifact]);
  
  const panelUrl = useMemo(() => {
    if (!activeArtifact) return null;
    return getPanelUrl(activeArtifact);
  }, [activeArtifact, getPanelUrl]);
  
  // Handle iframe load
  const handleIframeLoad = useCallback(() => {
    if (iframeRef.current && activeArtifact) {
      instance.bridge.setIframe(iframeRef.current);
      instance.bridge.loadArtifact(activeArtifact);
    }
  }, [activeArtifact, instance]);
  
  // Send artifact to iframe when it changes
  useEffect(() => {
    if (activeArtifact && iframeRef.current) {
      instance.bridge.loadArtifact(activeArtifact);
    }
  }, [activeArtifact, instance]);
  
  // Listen for events from iframe
  useEffect(() => {
    const unsubscribeAI = instance.on('ai:request', (data) => {
      if (onAIRequest) onAIRequest(data);
    });
    
    const unsubscribeSave = instance.on('save:request', (data) => {
      if (onSave) onSave(data);
    });
    
    const unsubscribeExport = instance.on('export:complete', (data) => {
      if (onExport) onExport(data);
    });
    
    return () => {
      unsubscribeAI();
      unsubscribeSave();
      unsubscribeExport();
    };
  }, [instance, onAIRequest, onSave, onExport]);
  
  // Handle copy
  const handleCopy = useCallback(async () => {
    if (!activeArtifact) return;
    
    try {
      await navigator.clipboard.writeText(activeArtifact.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      const textarea = document.createElement('textarea');
      textarea.value = activeArtifact.code;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (e) {
        console.error('Failed to copy:', e);
      }
      document.body.removeChild(textarea);
    }
  }, [activeArtifact]);
  
  // Handle download
  const handleDownload = useCallback(() => {
    if (!activeArtifact) return;
    
    const { code, language, title } = activeArtifact;
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
  }, [activeArtifact]);
  
  // Handle view mode change
  const handleViewMode = useCallback((mode) => {
    setViewMode(mode);
  }, [setViewMode]);
  
  // Don't render if not open or no artifact
  if (!state.isPanelOpen || !activeArtifact) {
    return null;
  }
  
  const panelClasses = [
    'artifactuse-panel',
    state.isFullscreen && 'artifactuse-panel--fullscreen',
    className,
  ].filter(Boolean).join(' ');
  
  const contentClasses = [
    'artifactuse-panel-content',
    `artifactuse-panel-content--${state.viewMode}`,
  ].join(' ');
  
  const panelContent = (
    <>
      <div className={panelClasses}>
        {/* Panel header */}
        <div className="artifactuse-panel-header">
          <div className="artifactuse-panel-title">
            <span className="artifactuse-panel-language">{languageDisplay}</span>
            <span className="artifactuse-panel-name">{activeArtifact.title}</span>
          </div>
          
          <div className="artifactuse-panel-tabs">
            <button 
              className={`artifactuse-panel-tab ${state.viewMode === 'preview' ? 'active' : ''}`}
              onClick={() => handleViewMode('preview')}
              disabled={!activeArtifact.isPreviewable}
            >
              Preview
            </button>
            <button 
              className={`artifactuse-panel-tab ${state.viewMode === 'code' ? 'active' : ''}`}
              onClick={() => handleViewMode('code')}
            >
              Code
            </button>
            <button 
              className={`artifactuse-panel-tab ${state.viewMode === 'split' ? 'active' : ''}`}
              onClick={() => handleViewMode('split')}
              disabled={!activeArtifact.isPreviewable}
            >
              Split
            </button>
          </div>
          
          <div className="artifactuse-panel-actions">
            <button 
              className="artifactuse-panel-action"
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
            
            <button 
              className="artifactuse-panel-action"
              title="Download"
              onClick={handleDownload}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </button>
            
            <button 
              className="artifactuse-panel-action"
              title={state.isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              onClick={toggleFullscreen}
            >
              {!state.isFullscreen ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <polyline points="9 21 3 21 3 15"></polyline>
                  <line x1="21" y1="3" x2="14" y2="10"></line>
                  <line x1="3" y1="21" x2="10" y2="14"></line>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="4 14 10 14 10 20"></polyline>
                  <polyline points="20 10 14 10 14 4"></polyline>
                  <line x1="14" y1="10" x2="21" y2="3"></line>
                  <line x1="3" y1="21" x2="10" y2="14"></line>
                </svg>
              )}
            </button>
            
            <button 
              className="artifactuse-panel-action artifactuse-panel-close"
              title="Close"
              onClick={closePanel}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
        
        {/* Panel content */}
        <div className={contentClasses}>
          {/* Preview pane */}
          {(state.viewMode === 'preview' || state.viewMode === 'split') && (
            <div className="artifactuse-panel-preview">
              {panelUrl ? (
                <iframe
                  ref={iframeRef}
                  src={panelUrl}
                  className="artifactuse-panel-iframe"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                  onLoad={handleIframeLoad}
                />
              ) : (
                <div className="artifactuse-panel-no-preview">
                  <p>Preview not available for this artifact type.</p>
                </div>
              )}
            </div>
          )}
          
          {/* Code pane */}
          {(state.viewMode === 'code' || state.viewMode === 'split') && (
            <div className="artifactuse-panel-code">
              <pre><code>{activeArtifact.code}</code></pre>
            </div>
          )}
        </div>
      </div>
      
      {/* Backdrop */}
      {state.isFullscreen && (
        <div 
          className="artifactuse-panel-backdrop"
          onClick={closePanel}
        />
      )}
    </>
  );
  
  // Use portal to render at body level
  if (!mounted) return null;
  
  return createPortal(panelContent, document.body);
}

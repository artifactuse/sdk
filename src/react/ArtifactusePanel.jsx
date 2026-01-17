// artifactuse/react/ArtifactusePanel.jsx
// React component for artifact panel viewer

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useArtifactuse } from './index.jsx';
import { getLanguageDisplayName, getFileExtension, getLanguageIcon, formatBytes } from '../core/detector.js';
import { normalizeLanguage as normalizeLang, isPrismAvailable } from '../core/highlight.js';
import JSZip from 'jszip';

/**
 * ArtifactusePanel Component
 * 
 * Side panel for viewing artifact previews and code
 * Flex-based layout - should be a sibling to main content area
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
    artifactCount,
    hasArtifacts,
    closePanel, 
    toggleFullscreen, 
    setViewMode,
    getPanelUrl,
    openArtifact,
    instance,
  } = useArtifactuse();
  
  // Refs
  const iframeRef = useRef(null);
  const codeRef = useRef(null);
  const contentRef = useRef(null);
  const lineNumbersRef = useRef(null);
  const codeScrollRef = useRef(null);
  
  // State
  const [copied, setCopied] = useState(false);
  const [showArtifactList, setShowArtifactList] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [cameFromList, setCameFromList] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  
  // Panel/split resize state
  const [panelWidth, setPanelWidth] = useState(50);
  const [splitPosition, setSplitPosition] = useState(50);
  const panelResizeStateRef = useRef(null);
  const splitResizeStateRef = useRef(null);
  
  // Timers
  const updateTimerRef = useRef(null);
  const streamEndTimerRef = useRef(null);
  const iframeLoadTimerRef = useRef(null);
  
  // Computed values
  const languageDisplay = useMemo(() => {
    if (!activeArtifact) return '';
    return getLanguageDisplayName(activeArtifact.language);
  }, [activeArtifact]);
  
  const languageIcon = useMemo(() => {
    if (!activeArtifact) return '';
    const iconPath = getLanguageIcon(activeArtifact.language);
    if (!iconPath) return '';
    return iconPath;
  }, [activeArtifact]);
  
  const panelUrl = useMemo(() => {
    if (!activeArtifact) return null;
    return getPanelUrl(activeArtifact);
  }, [activeArtifact, getPanelUrl]);
  
  const normalizedLanguage = useMemo(() => {
    if (!activeArtifact) return 'plaintext';
    return normalizeLang(activeArtifact.language);
  }, [activeArtifact]);
  
  const nonInlineArtifacts = useMemo(() => {
    return state.artifacts.filter(a => !a.isInline);
  }, [state.artifacts]);
  
  const currentNonInlineIndex = useMemo(() => {
    if (!activeArtifact) return -1;
    return nonInlineArtifacts.findIndex(a => a.id === activeArtifact.id);
  }, [activeArtifact, nonInlineArtifacts]);
  
  const showBranding = useMemo(() => {
    return instance?.config?.branding !== false;
  }, [instance]);
  
  // Effective panel width - smaller for list/empty views
  const effectivePanelWidth = useMemo(() => {
    if (!activeArtifact) {
      return Math.min(panelWidth, 30);
    }
    return panelWidth;
  }, [activeArtifact, panelWidth]);
  
  // Helper function to get artifact icon HTML
  const getArtifactIconHtml = useCallback((language) => {
    const iconPath = getLanguageIcon(language);
    if (!iconPath) return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>';
    return `<svg viewBox="0 0 24 24" fill="currentColor">${iconPath}</svg>`;
  }, []);
  
  // Go back to list view
  const goBackToList = useCallback(() => {
    setCameFromList(false);
    instance.state.clearActiveArtifact();
  }, [instance]);
  
  // Generate line numbers
  const generateLineNumbers = useCallback(() => {
    if (!lineNumbersRef.current || !activeArtifact?.code) return;
    
    const lines = activeArtifact.code.split('\n').length;
    const html = Array.from({ length: lines }, (_, i) => `<div>${i + 1}</div>`).join('');
    lineNumbersRef.current.innerHTML = html;
  }, [activeArtifact]);
  
  // Highlight code with Prism
  const highlightCode = useCallback(() => {
    if (codeRef.current && isPrismAvailable()) {
      window.Prism.highlightElement(codeRef.current);
      
      // Sync Prism background to containers
      setTimeout(() => {
        syncPrismBackground();
      }, 0);
    }
  }, []);
  
  // Sync Prism theme background to code containers
  const syncPrismBackground = useCallback(() => {
    const pre = codeRef.current?.closest('pre');
    if (pre && codeScrollRef.current && lineNumbersRef.current) {
      const computedStyle = window.getComputedStyle(pre);
      const bgColor = computedStyle.backgroundColor;
      if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
        codeScrollRef.current.style.backgroundColor = bgColor;
        lineNumbersRef.current.style.backgroundColor = bgColor;
      }
    }
  }, []);
  
  // Update code view
  const updateCodeView = useCallback(() => {
    generateLineNumbers();
    if (!isStreaming) {
      highlightCode();
    }
  }, [generateLineNumbers, highlightCode, isStreaming]);
  
  // Handle iframe load
  const handleIframeLoad = useCallback(() => {
    clearTimeout(iframeLoadTimerRef.current);
    setIframeLoading(false);
    if (iframeRef.current && activeArtifact) {
      instance.bridge.setIframe(iframeRef.current);
      instance.bridge.loadArtifact(activeArtifact);
    }
  }, [activeArtifact, instance]);
  
  // Handle iframe error
  const handleIframeError = useCallback(() => {
    clearTimeout(iframeLoadTimerRef.current);
    setIframeLoading(false);
  }, []);
  
  // Start iframe load timeout
  const startIframeLoadTimeout = useCallback(() => {
    clearTimeout(iframeLoadTimerRef.current);
    iframeLoadTimerRef.current = setTimeout(() => {
      setIframeLoading(false);
    }, 10000);
  }, []);
  
  // Handle copy
  const handleCopy = useCallback(async () => {
    if (!activeArtifact) return;
    
    try {
      await navigator.clipboard.writeText(activeArtifact.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
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
  
  // Handle download all as ZIP
  const handleDownloadAll = useCallback(async () => {
    if (isDownloadingAll || nonInlineArtifacts.length === 0) return;
    
    setIsDownloadingAll(true);
    
    try {
      const zip = new JSZip();
      const usedFilenames = new Map();
      
      for (const artifact of nonInlineArtifacts) {
        if (!artifact.code) continue;
        
        const extension = getFileExtension(artifact.language);
        let baseFilename = (artifact.title || 'untitled')
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-_]/g, '');
        
        let filename = `${baseFilename}.${extension}`;
        const count = usedFilenames.get(filename) || 0;
        if (count > 0) {
          filename = `${baseFilename}-${count}.${extension}`;
        }
        usedFilenames.set(`${baseFilename}.${extension}`, count + 1);
        
        zip.file(filename, artifact.code);
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
      setIsDownloadingAll(false);
    }
  }, [isDownloadingAll, nonInlineArtifacts]);
  
  // Navigate artifacts
  const navigatePrev = useCallback(() => {
    if (currentNonInlineIndex > 0) {
      openArtifact(nonInlineArtifacts[currentNonInlineIndex - 1]);
    }
  }, [currentNonInlineIndex, openArtifact, nonInlineArtifacts]);
  
  const navigateNext = useCallback(() => {
    if (currentNonInlineIndex < nonInlineArtifacts.length - 1) {
      openArtifact(nonInlineArtifacts[currentNonInlineIndex + 1]);
    }
  }, [currentNonInlineIndex, openArtifact, nonInlineArtifacts]);
  
  // Select artifact from list
  const selectArtifact = useCallback((artifact) => {
    setCameFromList(true);
    openArtifact(artifact);
    setShowArtifactList(false);
  }, [openArtifact]);
  
  // Panel resize handlers
  const startPanelResize = useCallback((e) => {
    panelResizeStateRef.current = {
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
  }, [panelWidth]);
  
  const handlePanelResize = useCallback((e) => {
    if (!panelResizeStateRef.current) return;
    
    const windowWidth = window.innerWidth;
    const deltaX = panelResizeStateRef.current.startX - e.clientX;
    const deltaPercent = (deltaX / windowWidth) * 100;
    const newWidth = panelResizeStateRef.current.startWidth + deltaPercent;
    
    setPanelWidth(Math.min(Math.max(newWidth, 25), 75));
  }, []);
  
  const stopPanelResize = useCallback(() => {
    panelResizeStateRef.current = null;
    
    document.removeEventListener('mousemove', handlePanelResize);
    document.removeEventListener('mouseup', stopPanelResize);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    
    document.querySelectorAll('iframe').forEach(iframe => {
      iframe.style.pointerEvents = '';
    });
  }, [handlePanelResize]);
  
  // Split resize handlers
  const startSplitResize = useCallback((e) => {
    if (!contentRef.current) return;
    
    const rect = contentRef.current.getBoundingClientRect();
    splitResizeStateRef.current = {
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
  }, [splitPosition]);
  
  const handleSplitResize = useCallback((e) => {
    if (!splitResizeStateRef.current) return;
    
    const relativeX = e.clientX - splitResizeStateRef.current.contentLeft;
    const newPosition = (relativeX / splitResizeStateRef.current.contentWidth) * 100;
    
    setSplitPosition(Math.min(Math.max(newPosition, 20), 80));
  }, []);
  
  const stopSplitResize = useCallback(() => {
    splitResizeStateRef.current = null;
    
    document.removeEventListener('mousemove', handleSplitResize);
    document.removeEventListener('mouseup', stopSplitResize);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    
    document.querySelectorAll('iframe').forEach(iframe => {
      iframe.style.pointerEvents = '';
    });
  }, [handleSplitResize]);
  
  // Effect: Watch for artifact changes
  useEffect(() => {
    if (activeArtifact) {
      setIframeLoading(true);
      startIframeLoadTimeout();
      updateCodeView();
    }
  }, [activeArtifact?.id]);
  
  // Effect: Update code view when viewMode changes
  useEffect(() => {
    if (state.viewMode === 'code' || state.viewMode === 'split') {
      updateCodeView();
    }
  }, [state.viewMode, updateCodeView]);
  
  // Effect: Event subscriptions
  useEffect(() => {
    if (onAIRequest) instance.on('ai:request', onAIRequest);
    if (onSave) instance.on('save:request', onSave);
    if (onExport) instance.on('export:complete', onExport);
    
    return () => {
      if (onAIRequest) instance.off('ai:request', onAIRequest);
      if (onSave) instance.off('save:request', onSave);
      if (onExport) instance.off('export:complete', onExport);
    };
  }, [instance, onAIRequest, onSave, onExport]);
  
  // Effect: Cleanup
  useEffect(() => {
    return () => {
      stopPanelResize();
      stopSplitResize();
      clearTimeout(updateTimerRef.current);
      clearTimeout(streamEndTimerRef.current);
      clearTimeout(iframeLoadTimerRef.current);
    };
  }, [stopPanelResize, stopSplitResize]);
  
  // Don't render if panel is closed
  if (!state.isPanelOpen) return null;
  
  const panelClasses = [
    'artifactuse-panel',
    state.isFullscreen && 'artifactuse-panel--fullscreen',
    !activeArtifact && hasArtifacts && 'artifactuse-panel--list',
    !hasArtifacts && 'artifactuse-panel--empty',
    className,
  ].filter(Boolean).join(' ');
  
  const contentClasses = [
    'artifactuse-panel__content',
    `artifactuse-panel__content--${state.viewMode}`,
  ].join(' ');
  
  // ============================================
  // EMPTY STATE: No artifacts
  // ============================================
  if (!hasArtifacts) {
    return (
      <div className={panelClasses} style={!state.isFullscreen ? { width: `${effectivePanelWidth}%` } : undefined}>
        {!state.isFullscreen && (
          <div className="artifactuse-panel__resize-handle" onMouseDown={startPanelResize}>
            <div className="artifactuse-panel__resize-handle-line" />
          </div>
        )}
        
        <header className="artifactuse-panel__header artifactuse-panel__header--simple">
          <div className="artifactuse-panel__title">
            <span className="artifactuse-panel__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </span>
            <div className="artifactuse-panel__title-content">
              <span className="artifactuse-panel__name">Artifacts</span>
            </div>
          </div>
          <div className="artifactuse-panel__actions">
            <button 
              className="artifactuse-panel__action artifactuse-panel__action--close"
              title="Close panel"
              onClick={closePanel}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </header>
        
        <div className="artifactuse-panel__empty">
          <div className="artifactuse-panel__empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <h3 className="artifactuse-panel__empty-title">No artifacts yet</h3>
          <p className="artifactuse-panel__empty-text">
            Code blocks, forms, and other interactive content will appear here as the AI generates them.
          </p>
        </div>
        
        <footer className="artifactuse-panel__footer artifactuse-panel__footer--simple">
          {showBranding && (
            <a 
              href="https://artifactuse.com"
              target="_blank"
              rel="noopener noreferrer"
              className="artifactuse-panel__branding"
            >
              <svg width="16" height="16" viewBox="0 0 32 32" fill="currentColor">
                <path d="M16 2L2 9l14 7 14-7-14-7zM2 23l14 7 14-7M2 16l14 7 14-7" />
              </svg>
              <span>Artifactuse</span>
            </a>
          )}
        </footer>
      </div>
    );
  }
  
  // ============================================
  // LIST VIEW: Has artifacts but none selected
  // ============================================
  if (!activeArtifact) {
    return (
      <div className={panelClasses} style={!state.isFullscreen ? { width: `${effectivePanelWidth}%` } : undefined}>
        {!state.isFullscreen && (
          <div className="artifactuse-panel__resize-handle" onMouseDown={startPanelResize}>
            <div className="artifactuse-panel__resize-handle-line" />
          </div>
        )}
        
        <header className="artifactuse-panel__header artifactuse-panel__header--simple">
          <div className="artifactuse-panel__title">
            <span className="artifactuse-panel__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </span>
            <div className="artifactuse-panel__title-content">
              <span className="artifactuse-panel__name">Artifacts</span>
              <span className="artifactuse-panel__meta">{nonInlineArtifacts.length} available</span>
            </div>
          </div>
          <div className="artifactuse-panel__actions">
            {/* Download All button */}
            <button 
              className={`artifactuse-panel__action ${isDownloadingAll ? 'artifactuse-panel__action--loading' : ''}`}
              disabled={isDownloadingAll}
              title="Download all as ZIP"
              onClick={handleDownloadAll}
            >
              {!isDownloadingAll ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              ) : (
                <svg className="artifactuse-panel__spinner-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="32" />
                </svg>
              )}
            </button>
            
            <button 
              className="artifactuse-panel__action artifactuse-panel__action--close"
              title="Close panel"
              onClick={closePanel}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </header>
        
        <div className="artifactuse-panel__list">
          <div className="artifactuse-panel__list-items">
            {nonInlineArtifacts.map((artifact, index) => (
              <button
                key={artifact.id}
                className="artifactuse-panel__list-item"
                onClick={() => selectArtifact(artifact)}
              >
                <span 
                  className="artifactuse-panel__list-item-icon"
                  dangerouslySetInnerHTML={{ __html: getArtifactIconHtml(artifact.language) }}
                />
                <div className="artifactuse-panel__list-item-content">
                  <span className="artifactuse-panel__list-item-title">
                    {artifact.title || 'Untitled'}
                  </span>
                  <span className="artifactuse-panel__list-item-meta">
                    {getLanguageDisplayName(artifact.language)}
                    {artifact.lineCount && ` • ${artifact.lineCount} lines`}
                  </span>
                </div>
                <span className="artifactuse-panel__list-item-arrow">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </span>
              </button>
            ))}
          </div>
        </div>
        
        <footer className="artifactuse-panel__footer artifactuse-panel__footer--simple">
          {showBranding && (
            <a 
              href="https://artifactuse.com"
              target="_blank"
              rel="noopener noreferrer"
              className="artifactuse-panel__branding"
            >
              <svg width="16" height="16" viewBox="0 0 32 32" fill="currentColor">
                <path d="M16 2L2 9l14 7 14-7-14-7zM2 23l14 7 14-7M2 16l14 7 14-7" />
              </svg>
              <span>Artifactuse</span>
            </a>
          )}
        </footer>
      </div>
    );
  }
  
  // ============================================
  // DETAIL VIEW: Active artifact selected
  // ============================================
  return (
    <>
      <div 
        className={panelClasses}
        style={!state.isFullscreen ? { width: `${panelWidth}%` } : undefined}
      >
        {/* Resize handle */}
        {!state.isFullscreen && (
          <div 
            className="artifactuse-panel__resize-handle"
            onMouseDown={startPanelResize}
          >
            <div className="artifactuse-panel__resize-handle-line" />
          </div>
        )}
        
        {/* Header */}
        <header className="artifactuse-panel__header">
          {/* Back button (only when navigated from list view) */}
          {cameFromList && (
            <button 
              className="artifactuse-panel__back"
              title="Back to list"
              onClick={goBackToList}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}
          
          <div className="artifactuse-panel__title">
            <span 
              className="artifactuse-panel__icon"
              dangerouslySetInnerHTML={{ __html: `<svg viewBox="0 0 24 24" fill="currentColor">${languageIcon}</svg>` }}
            />
            <div className="artifactuse-panel__title-content">
              <span className="artifactuse-panel__name">{activeArtifact.title || 'Untitled'}</span>
              <span className="artifactuse-panel__meta">
                {languageDisplay}
                {activeArtifact.lineCount && ` • ${activeArtifact.lineCount} lines`}
              </span>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="artifactuse-panel__tabs">
            <button 
              className={`artifactuse-panel__tab ${state.viewMode === 'preview' ? 'artifactuse-panel__tab--active' : ''}`}
              disabled={!activeArtifact.isPreviewable}
              title="Preview"
              onClick={() => setViewMode('preview')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
            <button 
              className={`artifactuse-panel__tab ${state.viewMode === 'code' ? 'artifactuse-panel__tab--active' : ''}`}
              title="Code"
              onClick={() => setViewMode('code')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </button>
            <button 
              className={`artifactuse-panel__tab ${state.viewMode === 'split' ? 'artifactuse-panel__tab--active' : ''}`}
              disabled={!activeArtifact.isPreviewable}
              title="Split view"
              onClick={() => setViewMode('split')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="12" y1="3" x2="12" y2="21" />
              </svg>
            </button>
          </div>
          
          {/* Actions */}
          <div className="artifactuse-panel__actions">
            <button 
              className="artifactuse-panel__action"
              title={state.isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              onClick={toggleFullscreen}
            >
              {!state.isFullscreen ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="4 14 10 14 10 20" />
                  <polyline points="20 10 14 10 14 4" />
                  <line x1="14" y1="10" x2="21" y2="3" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
              )}
            </button>
            <button 
              className="artifactuse-panel__action artifactuse-panel__action--close"
              title="Close"
              onClick={closePanel}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </header>
        
        {/* Content */}
        <div className={contentClasses} ref={contentRef}>
          {/* Preview pane */}
          {(state.viewMode === 'preview' || state.viewMode === 'split') && (
            <div 
              className="artifactuse-panel__preview"
              style={state.viewMode === 'split' ? { width: `${splitPosition}%` } : undefined}
            >
              {/* Loading spinner */}
              {iframeLoading && panelUrl && (
                <div className="artifactuse-panel__loading">
                  <div className="artifactuse-panel__spinner" />
                </div>
              )}
              
              {panelUrl ? (
                <iframe
                  ref={iframeRef}
                  src={panelUrl}
                  className={`artifactuse-panel__iframe ${iframeLoading ? 'artifactuse-panel__iframe--loading' : ''}`}
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                  onLoad={handleIframeLoad}
                  onError={handleIframeError}
                />
              ) : (
                <div className="artifactuse-panel__no-preview">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9 17H7A5 5 0 0 1 7 7h2" />
                    <path d="M15 7h2a5 5 0 1 1 0 10h-2" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                  <p>Preview not available for {languageDisplay}</p>
                </div>
              )}
            </div>
          )}
          
          {/* Code pane */}
          {(state.viewMode === 'code' || state.viewMode === 'split') && (
            <div 
              className="artifactuse-panel__code"
              style={state.viewMode === 'split' ? { width: `${100 - splitPosition}%` } : undefined}
            >
              {/* Split resize handle */}
              {state.viewMode === 'split' && (
                <div 
                  className="artifactuse-panel__split-handle"
                  onMouseDown={startSplitResize}
                >
                  <div className="artifactuse-panel__split-handle-line" />
                </div>
              )}
              
              <div className="artifactuse-panel__code-scroll" ref={codeScrollRef}>
                <div className="artifactuse-panel__line-numbers" ref={lineNumbersRef} />
                <pre className="artifactuse-panel__code-block">
                  <code 
                    ref={codeRef}
                    className={`language-${normalizedLanguage}`}
                  >
                    {activeArtifact.code}
                  </code>
                </pre>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <footer className="artifactuse-panel__footer">
          <div className="artifactuse-panel__footer-left">
            {/* Branding */}
            {showBranding && (
              <a 
                href="https://artifactuse.com"
                target="_blank"
                rel="noopener noreferrer"
                className="artifactuse-panel__branding"
                title="Powered by Artifactuse"
              >
                <svg width="16" height="16" viewBox="0 0 32 32" fill="currentColor">
                  <path d="M16 2L2 9l14 7 14-7-14-7zM2 23l14 7 14-7M2 16l14 7 14-7" />
                </svg>
                <span>Artifactuse</span>
              </a>
            )}
            
            {/* Size badge */}
            {activeArtifact.code && (
              <span className="artifactuse-panel__badge artifactuse-panel__badge--secondary">
                {formatBytes(activeArtifact.size)}
              </span>
            )}
          </div>
          
          <div className="artifactuse-panel__footer-right">
            {/* Copy button */}
            <button 
              className={`artifactuse-panel__footer-action ${copied ? 'artifactuse-panel__footer-action--success' : ''}`}
              title={copied ? 'Copied!' : 'Copy code'}
              onClick={handleCopy}
            >
              {!copied ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
            
            {/* Download button */}
            <button 
              className="artifactuse-panel__footer-action"
              title="Download"
              onClick={handleDownload}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
            
            {/* Navigation */}
            {nonInlineArtifacts.length > 1 && (
              <div className="artifactuse-panel__nav">
                <button 
                  className="artifactuse-panel__nav-btn"
                  disabled={currentNonInlineIndex <= 0}
                  title="Previous artifact"
                  onClick={navigatePrev}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                
                <button 
                  className="artifactuse-panel__nav-trigger"
                  onClick={() => setShowArtifactList(!showArtifactList)}
                >
                  <span>{currentNonInlineIndex + 1} / {nonInlineArtifacts.length}</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                
                <button 
                  className="artifactuse-panel__nav-btn"
                  disabled={currentNonInlineIndex >= nonInlineArtifacts.length - 1}
                  title="Next artifact"
                  onClick={navigateNext}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
                
                {/* Artifact list popup */}
                {showArtifactList && (
                  <div className="artifactuse-panel__artifact-list">
                    <div className="artifactuse-panel__artifact-list-header">
                      <span>All Artifacts ({nonInlineArtifacts.length})</span>
                      <button 
                        className="artifactuse-panel__artifact-list-close"
                        onClick={() => setShowArtifactList(false)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                    <div className="artifactuse-panel__artifact-list-items">
                      {nonInlineArtifacts.map((artifact, index) => (
                        <button 
                          key={artifact.id}
                          className={`artifactuse-panel__artifact-item ${artifact.id === activeArtifact.id ? 'artifactuse-panel__artifact-item--active' : ''}`}
                          onClick={() => selectArtifact(artifact)}
                        >
                          <span 
                            className="artifactuse-panel__artifact-item-icon"
                            dangerouslySetInnerHTML={{ __html: getArtifactIconHtml(artifact.language) }}
                          />
                          <div className="artifactuse-panel__artifact-item-content">
                            <span className="artifactuse-panel__artifact-item-title">
                              {artifact.title || 'Untitled'}
                            </span>
                            <span className="artifactuse-panel__artifact-item-meta">
                              {getLanguageDisplayName(artifact.language)}
                              {artifact.lineCount && ` • ${artifact.lineCount} lines`}
                            </span>
                          </div>
                          <span className="artifactuse-panel__artifact-item-index">
                            {index + 1}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </footer>
      </div>
      
      {/* Backdrop (fullscreen only) */}
      {state.isFullscreen && (
        <div 
          className="artifactuse-panel__backdrop"
          onClick={closePanel}
        />
      )}
    </>
  );
}
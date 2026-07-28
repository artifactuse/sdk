// artifactuse/react/ArtifactusePanel.jsx
// React component for artifact panel viewer

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useArtifactuse } from './index.jsx';
import { getLanguageDisplayName, getFileExtension, getLanguageIcon, formatBytes, computeSimpleDiff } from '../core/detector.js';
import { normalizeLanguage as normalizeLang, isPrismAvailable } from '../core/highlight.js';
import { base64ToObjectUrl, getMimeType, revokeBlobUrl } from '../core/binaryPreview.js';
import JSZip from 'jszip';

const BINARY_CATEGORIES = ['image', 'audio', 'video', 'pdf', 'font', 'binary'];

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
  panelWidth: panelWidthProp,
  splitPosition: splitPositionProp,
  externalPreview: externalPreviewProp,
  consolePanel: consolePanelProp,
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
  const editorContainerRef = useRef(null);
  const editorInstanceRef = useRef(null);
  
  // State
  const [copied, setCopied] = useState(false);
  const [showArtifactList, setShowArtifactList] = useState(false);
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareModalState, setShareModalState] = useState('options');
  const [shareUrl, setShareUrl] = useState('');
  const [shareExpiresAt, setShareExpiresAt] = useState(null);
  const [shareError, setShareError] = useState('');
  const [shareLinkCopied, setShareLinkCopied] = useState(false);
  const [shareIsSaved, setShareIsSaved] = useState(false);
  const [savedArtifacts, setSavedArtifacts] = useState([]);
  const [savedArtifactsLoading, setSavedArtifactsLoading] = useState(false);
  const [updatedArtifactName, setUpdatedArtifactName] = useState('');

  // Console state
  const [consoleEntries, setConsoleEntries] = useState([]);
  const [consoleExpanded, setConsoleExpanded] = useState(false);
  const [consoleFilter, setConsoleFilter] = useState(new Set(['log', 'warn', 'error', 'info']));
  const consoleEntriesRef = useRef(null);

  // Panel/split resize state
  const [panelWidth, setPanelWidth] = useState(
    () => Math.min(Math.max(panelWidthProp ?? instance?.config?.panelWidth ?? 65, 25), 75)
  );
  const [splitPosition, setSplitPosition] = useState(
    () => Math.min(Math.max(splitPositionProp ?? instance?.config?.splitPosition ?? 50, 20), 80)
  );
  const panelResizeStateRef = useRef(null);
  const splitResizeStateRef = useRef(null);

  // Sync prop changes
  useEffect(() => {
    if (panelWidthProp !== undefined) {
      setPanelWidth(Math.min(Math.max(panelWidthProp, 25), 75));
    }
  }, [panelWidthProp]);

  useEffect(() => {
    if (splitPositionProp !== undefined) {
      setSplitPosition(Math.min(Math.max(splitPositionProp, 20), 80));
    }
  }, [splitPositionProp]);

  // Timers
  const streamEndTimerRef = useRef(null);
  const iframeLoadTimerRef = useRef(null);
  const prevArtifactRef = useRef(null);

  // Binary preview
  const blobUrlCache = useRef({});
  const fontStyleEl = useRef(null);

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
    let url = getPanelUrl(activeArtifact);
    if (url && activeArtifact._refreshToken) {
      url += (url.includes('?') ? '&' : '?') + '_t=' + activeArtifact._refreshToken;
    }
    return url;
  }, [activeArtifact, getPanelUrl]);
  
  const normalizedLanguage = useMemo(() => {
    if (!activeArtifact) return 'plaintext';
    return normalizeLang(activeArtifact.language);
  }, [activeArtifact]);

  const isBinaryArtifact = useMemo(() => {
    return BINARY_CATEGORIES.includes(activeArtifact?.language) && !!activeArtifact?.fileExtension;
  }, [activeArtifact]);

  const binaryCategory = useMemo(() => {
    return isBinaryArtifact ? activeArtifact.language : null;
  }, [isBinaryArtifact, activeArtifact]);

  const fontPreviewName = useMemo(() => {
    if (binaryCategory !== 'font' || !activeArtifact) return null;
    return 'apfont_' + activeArtifact.id;
  }, [binaryCategory, activeArtifact]);

  const hexDump = useMemo(() => {
    if (binaryCategory !== 'binary' || !activeArtifact?.code) return '';
    try {
      const raw = atob(activeArtifact.code.slice(0, 684));
      const bytes = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
      const lines = [];
      for (let i = 0; i < Math.min(bytes.length, 512); i += 16) {
        const chunk = bytes.slice(i, i + 16);
        const hex = Array.from(chunk).map(b => b.toString(16).padStart(2, '0')).join(' ');
        const ascii = Array.from(chunk).map(b => (b >= 32 && b < 127) ? String.fromCharCode(b) : '.').join('');
        lines.push(`${i.toString(16).padStart(8, '0')}  ${hex.padEnd(47)}  |${ascii}|`);
      }
      return lines.join('\n');
    } catch { return ''; }
  }, [binaryCategory, activeArtifact]);

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

  const showExternalPreview = useMemo(() => {
    if (!panelUrl) return false;
    if (activeArtifact?.externalPreview !== undefined) return activeArtifact.externalPreview;
    if (externalPreviewProp !== undefined) return externalPreviewProp;
    return instance?.config?.externalPreview ?? false;
  }, [activeArtifact, externalPreviewProp, instance, panelUrl]);

  // Console computed values
  const consoleErrorCount = useMemo(
    () => consoleEntries.filter(e => e.type === 'error').length,
    [consoleEntries]
  );
  const consoleWarnCount = useMemo(
    () => consoleEntries.filter(e => e.type === 'warn').length,
    [consoleEntries]
  );
  const consoleInfoCount = useMemo(
    () => consoleEntries.filter(e => e.type === 'info').length,
    [consoleEntries]
  );
  const consoleLogCount = useMemo(
    () => consoleEntries.filter(e => e.type === 'log').length,
    [consoleEntries]
  );
  const filteredConsoleEntries = useMemo(
    () => consoleEntries.filter(e => consoleFilter.has(e.type)),
    [consoleEntries, consoleFilter]
  );
  const showConsolePanel = (consolePanelProp ?? instance?.config?.consolePanel) !== false
    && consoleEntries.length > 0;

  const getBlobUrl = useCallback((artifact) => {
    if (!artifact || !artifact.code) return null;
    if (blobUrlCache.current[artifact.id]) return blobUrlCache.current[artifact.id];
    const url = base64ToObjectUrl(artifact.code, getMimeType(artifact.fileExtension || artifact.language));
    blobUrlCache.current[artifact.id] = url;
    return url;
  }, []);

  const releaseBlobUrl = useCallback((artifactId) => {
    if (blobUrlCache.current[artifactId]) {
      revokeBlobUrl(blobUrlCache.current[artifactId]);
      delete blobUrlCache.current[artifactId];
    }
  }, []);

  function toggleConsoleFilter(type) {
    setConsoleFilter(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  // Subscribe to console:log events from bridge
  useEffect(() => {
    if (!instance) return;
    const unsub = instance.on('console:log', ({ entry }) => {
      setConsoleEntries(prev => {
        const next = [...prev, entry];
        return next.length > 500 ? next.slice(-500) : next;
      });
      if (entry.type === 'error') {
        setConsoleExpanded(true);
      }
    });
    return unsub;
  }, [instance]);

  // Clear console when artifact changes
  useEffect(() => {
    setConsoleEntries([]);
    setConsoleExpanded(false);
  }, [activeArtifact?.id]);

  // Auto-scroll console to bottom
  useEffect(() => {
    if (consoleEntriesRef.current && consoleExpanded) {
      consoleEntriesRef.current.scrollTop = consoleEntriesRef.current.scrollHeight;
    }
  }, [consoleEntries, consoleExpanded]);

  const sharingEnabled = useMemo(() => {
    return instance?.share?.enabled !== false;
  }, [instance]);

  const isAuthenticated = useMemo(() => {
    return instance?.share?.isAuthenticated() || false;
  }, [instance]);

  const effectivePanelWidth = panelWidth;

  // Empty state also covers "artifacts exist but none is selected" — there is
  // no list view to fall back to any more.
  const showEmptyState = !hasArtifacts || state.forceEmptyView || !activeArtifact;

  // Multi-tab
  const isMultiTab = useMemo(() => instance?.config?.multiTab === true, [instance]);

  const openTabArtifacts = useMemo(() => {
    if (!isMultiTab) return [];
    return state.openTabs
      .map(id => state.artifacts.find(a => a.id === id))
      .filter(Boolean);
  }, [isMultiTab, state.openTabs, state.artifacts]);

  // Helper function to get artifact icon HTML
  const getArtifactIconHtml = useCallback((language) => {
    const iconPath = getLanguageIcon(language);
    if (!iconPath) return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>';
    return `<svg viewBox="0 0 24 24" fill="currentColor">${iconPath}</svg>`;
  }, []);
  
  // Smartdiff: per-line language-aware highlighting
  const highlightSmartDiff = useCallback((artifact) => {
    if (artifact.language !== 'smartdiff') return null;
    try {
      const data = JSON.parse(artifact.code);
      if (data.oldCode === undefined || data.newCode === undefined) return null;
      const lang = data.language || 'plaintext';
      const grammar = isPrismAvailable() && window.Prism.languages[lang];
      const diffLines = computeSimpleDiff(data.oldCode, data.newCode).split('\n');

      const highlighted = diffLines.map(line => {
        const prefix = line[0];
        const content = line.slice(1);
        const hl = grammar ? window.Prism.highlight(content, grammar, lang) : content;
        if (prefix === '-') return `<span class="token deleted">${hl}</span>`;
        if (prefix === '+') return `<span class="token inserted">${hl}</span>`;
        return hl;
      }).join('\n');

      return { html: highlighted, lineCount: diffLines.length };
    } catch { return null; }
  }, []);

  // Generate line numbers
  const generateLineNumbers = useCallback(() => {
    if (!lineNumbersRef.current || !activeArtifact?.code) return;
    const sd = highlightSmartDiff(activeArtifact);
    const lines = sd ? sd.lineCount : activeArtifact.code.split('\n').length;
    const html = Array.from({ length: lines }, (_, i) => `<div>${i + 1}</div>`).join('');
    lineNumbersRef.current.innerHTML = html;
  }, [activeArtifact, highlightSmartDiff]);

  // Highlight code with Prism
  const highlightCode = useCallback(() => {
    if (codeRef.current && isPrismAvailable() && activeArtifact?.code) {
      const sd = highlightSmartDiff(activeArtifact);
      if (sd) {
        codeRef.current.innerHTML = sd.html;
      } else {
        const grammar = window.Prism.languages[normalizedLanguage];
        if (grammar) {
          codeRef.current.innerHTML = window.Prism.highlight(
            activeArtifact.code,
            grammar,
            normalizedLanguage
          );
        } else {
          codeRef.current.textContent = activeArtifact.code;
        }
      }
      codeRef.current.dataset.highlighted = 'true';

      // Sync Prism background to containers
      setTimeout(() => {
        syncPrismBackground();
      }, 0);
    }
  }, [activeArtifact?.code, normalizedLanguage, highlightSmartDiff]);
  
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

  // Reset code container inline styles
  const resetCodeContainerStyles = useCallback(() => {
    if (codeScrollRef.current) {
      codeScrollRef.current.style.backgroundColor = '';
    }
    if (lineNumbersRef.current) {
      lineNumbersRef.current.style.backgroundColor = '';
    }
  }, []);

  // Update code view
  const updateCodeView = useCallback(() => {
    generateLineNumbers();
    highlightCode();
  }, [generateLineNumbers, highlightCode]);

  // Editor availability
  const isEditorAvailable = instance.editor?.isAvailable() || false;

  // Editor functions
  const initEditor = useCallback(() => {
    if (!isEditorAvailable || !editorContainerRef.current || !activeArtifact) return;
    if (editorInstanceRef.current) {
      editorInstanceRef.current.destroy();
      editorInstanceRef.current = null;
    }
    editorInstanceRef.current = instance.editor.create(editorContainerRef.current, {
      code: activeArtifact.code || '',
      language: activeArtifact.editorLanguage || activeArtifact.language || 'plaintext',
      sdkTheme: instance.getTheme(),
    });
  }, [isEditorAvailable, activeArtifact, instance]);

  const handleEditorSave = useCallback(() => {
    if (!editorInstanceRef.current || !activeArtifact) return;
    const code = editorInstanceRef.current.getCode();
    instance.emit('edit:save', {
      artifactId: activeArtifact.id,
      artifact: activeArtifact,
      code,
    });
  }, [activeArtifact, instance]);

  const handleExternalPreview = useCallback(() => {
    setShowOverflowMenu(false);
    if (panelUrl) window.open(panelUrl, '_blank', 'noopener,noreferrer');
  }, [panelUrl]);

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
    }, 1000);
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

    setShowOverflowMenu(false);
    
    const { code, language, editorLanguage, title } = activeArtifact;
    const extension = getFileExtension(editorLanguage || language);
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
        
        const extension = getFileExtension(artifact.editorLanguage || artifact.language);
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

  // Share methods
  const formatExpiryDate = useCallback((dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, []);

  const toggleSharePopup = useCallback(() => {
    if (showShareModal) {
      setShowShareModal(false);
      return;
    }

    if (!activeArtifact) return;

    setShareModalState('options');
    setShareUrl('');
    setShareExpiresAt(null);
    setShareError('');
    setShareLinkCopied(false);
    setShareIsSaved(false);
    setSavedArtifacts([]);
    setSavedArtifactsLoading(false);
    setUpdatedArtifactName('');

    setShowShareModal(true);
  }, [activeArtifact, instance, showShareModal]);

  const closeShareModal = useCallback(() => {
    setShowShareModal(false);
  }, []);

  const handleQuickShare = useCallback(async () => {
    if (!activeArtifact || !instance?.share) return;

    setShareModalState('loading');
    setShareError('');

    try {
      const result = await instance.share.share(activeArtifact);
      setShareUrl(result.url);
      setShareExpiresAt(result.expiresAt);
      setShareIsSaved(false);
      setShareModalState('success');
    } catch (error) {
      setShareError(error.message || 'Failed to create share link');
      setShareModalState('error');
    }
  }, [activeArtifact, instance]);

  const handleSaveOption = useCallback(async () => {
    if (isAuthenticated) {
      handleSave();
    } else {
      // Open auth popup
      setShareModalState('loading');
      try {
        await instance.share.openAuthPopup();
        // Auth successful, now save
        handleSave();
      } catch (error) {
        if (error.message === 'Authentication cancelled') {
          setShareModalState('options');
        } else {
          setShareError(error.message || 'Authentication failed');
          setShareModalState('error');
        }
      }
    }
  }, [isAuthenticated, instance]);

  const handleSave = useCallback(async () => {
    if (!activeArtifact || !instance?.share) return;

    setShareModalState('loading');
    setShareError('');

    try {
      const result = await instance.share.save(activeArtifact);
      setShareUrl(result.url);
      setShareExpiresAt(null);
      setShareIsSaved(true);
      setShareModalState('success');
    } catch (error) {
      setShareError(error.message || 'Failed to save artifact');
      setShareModalState('error');
    }
  }, [activeArtifact, instance]);

  const retryShare = useCallback(() => {
    if (shareIsSaved) {
      handleSave();
    } else {
      handleQuickShare();
    }
  }, [shareIsSaved, handleSave, handleQuickShare]);

  const handleUpdateOption = useCallback(async () => {
    if (!instance?.share) return;

    if (!isAuthenticated) {
      setShareModalState('loading');
      try {
        await instance.share.openAuthPopup();
      } catch (error) {
        if (error.message === 'Authentication cancelled') {
          setShareModalState('options');
        } else {
          setShareError(error.message || 'Authentication failed');
          setShareModalState('error');
        }
        return;
      }
    }

    setShareModalState('update-list');
    setSavedArtifactsLoading(true);

    try {
      const lang = activeArtifact?.language || null;
      const result = await instance.share.listArtifacts(lang);
      setSavedArtifacts(result.projects || []);
    } catch (error) {
      setShareError(error.message || 'Failed to load artifacts');
      setShareModalState('error');
    } finally {
      setSavedArtifactsLoading(false);
    }
  }, [activeArtifact, instance, isAuthenticated]);

  const handleUpdateArtifact = useCallback(async (artifact) => {
    if (!activeArtifact || !instance?.share) return;

    const projectUuid = artifact.project?.uuid;
    if (!projectUuid) return;

    setShareModalState('loading');
    setShareError('');

    try {
      const result = await instance.share.updateArtifact(projectUuid, activeArtifact);
      setShareUrl(result.url || '');
      setShareExpiresAt(null);
      setShareIsSaved(true);
      setUpdatedArtifactName(artifact.project?.name || 'Untitled');
      setShareModalState('success');
    } catch (error) {
      setShareError(error.message || 'Failed to update artifact');
      setShareModalState('error');
    }
  }, [activeArtifact, instance]);

  const copyShareLink = useCallback(async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareLinkCopied(true);
      setTimeout(() => setShareLinkCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  }, [shareUrl]);

  // Multi-tab methods
  const selectTab = useCallback((artifact) => {
    openArtifact(artifact);
  }, [openArtifact]);

  const handleCloseTab = useCallback((artifactId) => {
    releaseBlobUrl(artifactId);
    instance.closeTab(artifactId);
  }, [instance, releaseBlobUrl]);

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
    openArtifact(artifact);
    setShowArtifactList(false);
  }, [openArtifact]);

  const handleShareFromMenu = useCallback(() => {
    setShowOverflowMenu(false);
    toggleSharePopup();
  }, [toggleSharePopup]);
  
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
      // Check if transitioning between different previewability types
      if (prevArtifactRef.current && prevArtifactRef.current.isPreviewable !== activeArtifact.isPreviewable) {
        setIsTransitioning(true);
        setTimeout(() => setIsTransitioning(false), 150);
      }
      prevArtifactRef.current = activeArtifact;

      if (BINARY_CATEGORIES.includes(activeArtifact.language) && activeArtifact.fileExtension) {
        setViewMode('preview');
      }

      resetCodeContainerStyles();
      setIframeLoading(true);
      startIframeLoadTimeout();
      updateCodeView();
    }
  }, [activeArtifact?.id, resetCodeContainerStyles]);

  // Effect: Font face injection for font binary artifacts
  useEffect(() => {
    if (binaryCategory === 'font' && fontPreviewName && activeArtifact?.code) {
      const css = `@font-face { font-family: "${fontPreviewName}"; src: url("data:${getMimeType(activeArtifact.fileExtension || 'woff2')};base64,${activeArtifact.code}"); }`;
      if (!fontStyleEl.current) {
        fontStyleEl.current = document.createElement('style');
        document.head.appendChild(fontStyleEl.current);
      }
      fontStyleEl.current.textContent = css;
    } else if (fontStyleEl.current) {
      fontStyleEl.current.textContent = '';
    }
  }, [binaryCategory, fontPreviewName, activeArtifact]);
  
  // Effect: Update code view when viewMode changes
  useEffect(() => {
    if (state.viewMode === 'code' || state.viewMode === 'split') {
      updateCodeView();
    }
    if (state.viewMode === 'edit') {
      initEditor();
    }
  }, [state.viewMode, updateCodeView, initEditor]);
  
  // Effect: close the artifact dropdown / overflow menu on an outside click
  useEffect(() => {
    if (!showArtifactList && !showOverflowMenu) return;

    const handleClickOutside = (e) => {
      if (showArtifactList && !e.target.closest('.artifactuse-panel__nav')) {
        setShowArtifactList(false);
      }
      if (showOverflowMenu && !e.target.closest('.artifactuse-panel__overflow')) {
        setShowOverflowMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showArtifactList, showOverflowMenu]);

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
      if (editorInstanceRef.current) {
        editorInstanceRef.current.destroy();
        editorInstanceRef.current = null;
      }
      clearTimeout(streamEndTimerRef.current);
      clearTimeout(iframeLoadTimerRef.current);
      Object.keys(blobUrlCache.current).forEach(id => revokeBlobUrl(blobUrlCache.current[id]));
      blobUrlCache.current = {};
      if (fontStyleEl.current) {
        fontStyleEl.current.remove();
        fontStyleEl.current = null;
      }
    };
  }, [stopPanelResize, stopSplitResize]);
  
  // Don't render if panel is closed
  if (!state.isPanelOpen) return null;
  
  const panelClasses = [
    'artifactuse-panel',
    state.isFullscreen && 'artifactuse-panel--fullscreen',
    showEmptyState && 'artifactuse-panel--empty',
    className,
  ].filter(Boolean).join(' ');
  
  const contentClasses = [
    'artifactuse-panel__content',
    `artifactuse-panel__content--${state.viewMode}`,
    isTransitioning && 'artifactuse-panel__content--transitioning',
  ].filter(Boolean).join(' ');
  
  // ============================================
  // EMPTY STATE: No artifacts, or none selected
  // ============================================
  if (showEmptyState) {
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
              {hasArtifacts ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
              )}
            </span>
            <div className="artifactuse-panel__title-content">
              <span className="artifactuse-panel__name">{hasArtifacts ? 'Artifact Viewer' : 'Artifacts'}</span>
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
          <h3 className="artifactuse-panel__empty-title">{hasArtifacts ? 'No artifact selected' : 'No artifacts yet'}</h3>
          <p className="artifactuse-panel__empty-text">
            {hasArtifacts ? 'Open an artifact to have it appear here' : 'Code blocks, forms, and other interactive content will appear here as the AI generates them.'}
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
              <svg width="16" height="16" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.6667 41.6673V10.4173C16.6667 9.86478 16.4472 9.33488 16.0565 8.94418C15.6658 8.55348 15.1359 8.33398 14.5833 8.33398H4.16667C3.0616 8.33398 2.00179 8.77297 1.22039 9.55437C0.438987 10.3358 0 11.3956 0 12.5007V37.5006C0 38.6057 0.438987 39.6655 1.22039 40.4469C2.00179 41.2283 3.0616 41.6673 4.16667 41.6673H29.1667C30.2717 41.6673 31.3315 41.2283 32.1129 40.4469C32.8943 39.6655 33.3333 38.6057 33.3333 37.5006V27.084C33.3333 26.5314 33.1138 26.0015 32.7231 25.6108C32.3324 25.2201 31.8025 25.0007 31.25 25.0007H0" fill="#5F51C8"/>
                <path d="M39.5833 0H27.0833C25.9327 0 25 0.93274 25 2.08333V14.5833C25 15.7339 25.9327 16.6667 27.0833 16.6667H39.5833C40.7339 16.6667 41.6667 15.7339 41.6667 14.5833V2.08333C41.6667 0.93274 40.7339 0 39.5833 0Z" fill="#695AE0"/>
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
        
        {/* Unified bar: tabs / title on the left, view modes + actions on the right */}
        <div className="artifactuse-panel__bar">
          <div className="artifactuse-panel__bar-left">
            {isMultiTab && openTabArtifacts.length > 0 ? (
              <div className="artifactuse-panel__file-tabs">
                <div className="artifactuse-panel__file-tabs-scroll">
                  {openTabArtifacts.map((tab) => (
                    <button
                      key={tab.id}
                      className={`artifactuse-panel__file-tab ${tab.id === activeArtifact.id ? 'artifactuse-panel__file-tab--active' : ''}`}
                      onClick={() => selectTab(tab)}
                    >
                      <span
                        className="artifactuse-panel__file-tab-icon"
                        dangerouslySetInnerHTML={{ __html: getArtifactIconHtml(tab.language) }}
                      />
                      <span className="artifactuse-panel__file-tab-title">{tab.title || 'Untitled'}</span>
                      <span
                        className="artifactuse-panel__file-tab-close"
                        title="Close tab"
                        role="button"
                        tabIndex={0}
                        onClick={(e) => { e.stopPropagation(); handleCloseTab(tab.id); }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="artifactuse-panel__bar-chip">
                  <span
                    className="artifactuse-panel__bar-chip-icon"
                    dangerouslySetInnerHTML={{ __html: `<svg viewBox="0 0 24 24" fill="currentColor">${languageIcon}</svg>` }}
                  />
                  <span className="artifactuse-panel__bar-chip-title">{activeArtifact.title || 'Untitled'}</span>
                  <span className="artifactuse-panel__bar-chip-meta">
                    {languageDisplay}
                    {activeArtifact.lineCount ? ` • ${activeArtifact.lineCount} lines` : ''}
                  </span>
                </div>

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
              </>
            )}
          </div>

          <div className="artifactuse-panel__bar-right">
            {/* Tabs */}
            <div className="artifactuse-panel__tabs">
              {(!activeArtifact.tabs || activeArtifact.tabs.includes('preview')) && (
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
              )}
              {(!activeArtifact.tabs || activeArtifact.tabs.includes('code')) && !isBinaryArtifact && (
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
              )}
              {(!activeArtifact.tabs || activeArtifact.tabs.includes('split')) && !isBinaryArtifact && (
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
              )}
              {activeArtifact.tabs && activeArtifact.tabs.includes('edit') && isEditorAvailable && (
              <button
                className={`artifactuse-panel__tab ${state.viewMode === 'edit' ? 'artifactuse-panel__tab--active' : ''}`}
                title="Edit"
                onClick={() => setViewMode('edit')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              )}
            </div>

            {state.viewMode === 'edit' && (
              <button
                className="artifactuse-panel__action artifactuse-panel__action--save"
                title="Save"
                onClick={handleEditorSave}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
              </button>
            )}

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

            {/* Overflow menu */}
            <div className="artifactuse-panel__overflow">
              <button
                className="artifactuse-panel__action"
                title="More actions"
                onClick={() => setShowOverflowMenu(!showOverflowMenu)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="19" cy="12" r="1" />
                  <circle cx="5" cy="12" r="1" />
                </svg>
              </button>

              {showOverflowMenu && (
                <div className="artifactuse-panel__overflow-menu">
                  <button
                    className={`artifactuse-panel__overflow-item ${copied ? 'artifactuse-panel__overflow-item--success' : ''}`}
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
                    <span>{copied ? 'Copied!' : 'Copy code'}</span>
                  </button>

                  <button className="artifactuse-panel__overflow-item" onClick={handleDownload}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <span>Download</span>
                  </button>

                  {nonInlineArtifacts.length > 1 && (
                    <button
                      className={`artifactuse-panel__overflow-item ${isDownloadingAll ? 'artifactuse-panel__overflow-item--disabled' : ''}`}
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
                      <span>{isDownloadingAll ? 'Preparing ZIP...' : 'Download all as ZIP'}</span>
                    </button>
                  )}

                  {sharingEnabled && (
                    <button className="artifactuse-panel__overflow-item" onClick={handleShareFromMenu}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="18" cy="5" r="3" />
                        <circle cx="6" cy="12" r="3" />
                        <circle cx="18" cy="19" r="3" />
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                      </svg>
                      <span>Share</span>
                    </button>
                  )}

                  {showExternalPreview && (
                    <button className="artifactuse-panel__overflow-item" onClick={handleExternalPreview}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                      <span>Open in new tab</span>
                    </button>
                  )}

                  <div className="artifactuse-panel__overflow-divider" />

                  {activeArtifact.code && (
                    <div className="artifactuse-panel__overflow-meta">
                      {languageDisplay} &bull; {formatBytes(activeArtifact.size)}
                    </div>
                  )}

                  {showBranding && (
                    <a
                      href="https://artifactuse.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="artifactuse-panel__overflow-branding"
                    >
                      <svg width="14" height="14" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16.6667 41.6673V10.4173C16.6667 9.86478 16.4472 9.33488 16.0565 8.94418C15.6658 8.55348 15.1359 8.33398 14.5833 8.33398H4.16667C3.0616 8.33398 2.00179 8.77297 1.22039 9.55437C0.438987 10.3358 0 11.3956 0 12.5007V37.5006C0 38.6057 0.438987 39.6655 1.22039 40.4469C2.00179 41.2283 3.0616 41.6673 4.16667 41.6673H29.1667C30.2717 41.6673 31.3315 41.2283 32.1129 40.4469C32.8943 39.6655 33.3333 38.6057 33.3333 37.5006V27.084C33.3333 26.5314 33.1138 26.0015 32.7231 25.6108C32.3324 25.2201 31.8025 25.0007 31.25 25.0007H0" fill="#5F51C8"/>
                        <path d="M39.5833 0H27.0833C25.9327 0 25 0.93274 25 2.08333V14.5833C25 15.7339 25.9327 16.6667 27.0833 16.6667H39.5833C40.7339 16.6667 41.6667 15.7339 41.6667 14.5833V2.08333C41.6667 0.93274 40.7339 0 39.5833 0Z" fill="#695AE0"/>
                      </svg>
                      <span>Powered by Artifactuse</span>
                    </a>
                  )}
                </div>
              )}

              {/* Share popup */}
              {showShareModal && (
                <div className="artifactuse-share-popup">
                  <div className="artifactuse-share-popup__header">
                    <span className="artifactuse-share-popup__title">
                      {shareModalState === 'success' ? (updatedArtifactName ? 'Artifact updated!' : 'Link created!') : shareModalState === 'update-list' ? 'Update saved artifact' : 'Share Artifact'}
                    </span>
                    <button className="artifactuse-share-popup__close" onClick={closeShareModal}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                  <div className="artifactuse-share-popup__body">
                    {/* Loading state */}
                    {shareModalState === 'loading' && (
                      <div className="artifactuse-share-popup__loading">
                        <div className="artifactuse-share-popup__spinner" />
                        <p className="artifactuse-share-popup__loading-text">Creating link...</p>
                      </div>
                    )}

                    {/* Error state */}
                    {shareModalState === 'error' && (
                      <div>
                        <div className="artifactuse-share-popup__error">
                          <p className="artifactuse-share-popup__error-text">{shareError}</p>
                        </div>
                        <div className="artifactuse-share-popup__actions">
                          <button className="artifactuse-share-popup__btn artifactuse-share-popup__btn--secondary" onClick={() => setShareModalState('options')}>
                            Back
                          </button>
                          <button className="artifactuse-share-popup__btn artifactuse-share-popup__btn--primary" onClick={retryShare}>
                            Retry
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Options state */}
                    {shareModalState === 'options' && (
                      <div className="artifactuse-share-popup__options">
                        <button className="artifactuse-share-popup__option" onClick={handleQuickShare}>
                          <div className="artifactuse-share-popup__option-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                            </svg>
                          </div>
                          <div className="artifactuse-share-popup__option-content">
                            <p className="artifactuse-share-popup__option-title">Share link</p>
                            <p className="artifactuse-share-popup__option-desc">Expires in 30 days</p>
                          </div>
                        </button>
                        <button className="artifactuse-share-popup__option" onClick={handleSaveOption}>
                          <div className="artifactuse-share-popup__option-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                              <polyline points="17 21 17 13 7 13 7 21" />
                              <polyline points="7 3 7 8 15 8" />
                            </svg>
                          </div>
                          <div className="artifactuse-share-popup__option-content">
                            <p className="artifactuse-share-popup__option-title">Save to account</p>
                            <p className="artifactuse-share-popup__option-desc">Permanent, manageable</p>
                          </div>
                        </button>
                        <button className="artifactuse-share-popup__option" onClick={handleUpdateOption}>
                          <div className="artifactuse-share-popup__option-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="23 4 23 10 17 10" />
                              <polyline points="1 20 1 14 7 14" />
                              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                            </svg>
                          </div>
                          <div className="artifactuse-share-popup__option-content">
                            <p className="artifactuse-share-popup__option-title">Update saved</p>
                            <p className="artifactuse-share-popup__option-desc">Replace an existing artifact</p>
                          </div>
                        </button>
                      </div>
                    )}

                    {/* Update list state */}
                    {shareModalState === 'update-list' && (
                      <div>
                        {savedArtifactsLoading ? (
                          <div className="artifactuse-share-popup__loading">
                            <div className="artifactuse-share-popup__spinner" />
                            <p className="artifactuse-share-popup__loading-text">Loading artifacts...</p>
                          </div>
                        ) : savedArtifacts.length === 0 ? (
                          <div className="artifactuse-share-popup__empty">
                            No saved artifacts of this type
                          </div>
                        ) : (
                          <div className="artifactuse-share-popup__artifact-list">
                            {savedArtifacts.map((artifact) => (
                              <button
                                key={artifact.project?.uuid || artifact.id}
                                className="artifactuse-share-popup__artifact-item"
                                onClick={() => handleUpdateArtifact(artifact)}
                              >
                                <span className="artifactuse-share-popup__artifact-name">{artifact.project?.name || 'Untitled'}</span>
                                <span className="artifactuse-share-popup__artifact-date">{formatExpiryDate(artifact.project?.created_at)}</span>
                              </button>
                            ))}
                          </div>
                        )}
                        <button className="artifactuse-share-popup__back-btn" onClick={() => setShareModalState('options')}>Back</button>
                      </div>
                    )}

                    {/* Success state */}
                    {shareModalState === 'success' && (
                      <div className="artifactuse-share-popup__success">
                        <div className="artifactuse-share-popup__success-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                        <div className="artifactuse-share-popup__link-wrapper">
                          <input
                            type="text"
                            className="artifactuse-share-popup__link"
                            value={shareUrl}
                            readOnly
                            onClick={(e) => e.target.select()}
                          />
                          <button
                            className={`artifactuse-share-popup__copy-btn ${shareLinkCopied ? 'artifactuse-share-popup__copy-btn--copied' : ''}`}
                            onClick={copyShareLink}
                          >
                            {shareLinkCopied ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                        {shareExpiresAt && !shareIsSaved && (
                          <div className="artifactuse-share-popup__expiry">
                            <span className="artifactuse-share-popup__expiry-icon">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                              </svg>
                            </span>
                            <span className="artifactuse-share-popup__expiry-text">
                              Expires {formatExpiryDate(shareExpiresAt)}
                            </span>
                          </div>
                        )}
                        {!shareIsSaved && (
                          <div className="artifactuse-share-popup__save-prompt">
                            <p className="artifactuse-share-popup__save-prompt-text">Keep it permanently?</p>
                            <button className="artifactuse-share-popup__save-prompt-btn" onClick={handleSaveOption}>
                              Save to account
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                <div className="artifactuse-share-popup__footer">
                  <a href="https://artifactuse.com" target="_blank" rel="noopener noreferrer" className="artifactuse-share-popup__branding">
                    <svg width="12" height="12" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16.6667 41.6673V10.4173C16.6667 9.86478 16.4472 9.33488 16.0565 8.94418C15.6658 8.55348 15.1359 8.33398 14.5833 8.33398H4.16667C3.0616 8.33398 2.00179 8.77297 1.22039 9.55437C0.438987 10.3358 0 11.3956 0 12.5007V37.5006C0 38.6057 0.438987 39.6655 1.22039 40.4469C2.00179 41.2283 3.0616 41.6673 4.16667 41.6673H29.1667C30.2717 41.6673 31.3315 41.2283 32.1129 40.4469C32.8943 39.6655 33.3333 38.6057 33.3333 37.5006V27.084C33.3333 26.5314 33.1138 26.0015 32.7231 25.6108C32.3324 25.2201 31.8025 25.0007 31.25 25.0007H0" fill="#5F51C8"/>
                      <path d="M39.5833 0H27.0833C25.9327 0 25 0.93274 25 2.08333V14.5833C25 15.7339 25.9327 16.6667 27.0833 16.6667H39.5833C40.7339 16.6667 41.6667 15.7339 41.6667 14.5833V2.08333C41.6667 0.93274 40.7339 0 39.5833 0Z" fill="#695AE0"/>
                    </svg>
                    <span>Powered by Artifactuse</span>
                  </a>
                </div>
                </div>
              )}
            </div>

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
        </div>

        {/* Content */}
        <div className={contentClasses} ref={contentRef}>
          {/* Transition overlay */}
          {isTransitioning && (
            <div className="artifactuse-panel__loading">
              <div className="artifactuse-panel__spinner" />
            </div>
          )}

          {/* Preview pane */}
          {(state.viewMode === 'preview' || state.viewMode === 'split') && (
            <div
              className="artifactuse-panel__preview"
              style={state.viewMode === 'split' ? { width: `${splitPosition}%` } : undefined}
            >
              {/* Loading spinner */}
              {iframeLoading && panelUrl && !isBinaryArtifact && (
                <div className="artifactuse-panel__loading">
                  <div className="artifactuse-panel__spinner" />
                </div>
              )}

              {isBinaryArtifact ? (
                <>
                  {binaryCategory === 'image' && (
                    <div className="artifactuse-panel__binary artifactuse-panel__binary--image">
                      <img src={getBlobUrl(activeArtifact)} alt={activeArtifact.title || 'image'} />
                    </div>
                  )}
                  {binaryCategory === 'audio' && (
                    <div className="artifactuse-panel__binary artifactuse-panel__binary--audio">
                      <audio controls src={getBlobUrl(activeArtifact)} />
                    </div>
                  )}
                  {binaryCategory === 'video' && (
                    <div className="artifactuse-panel__binary artifactuse-panel__binary--video">
                      <video controls src={getBlobUrl(activeArtifact)} />
                    </div>
                  )}
                  {binaryCategory === 'pdf' && (
                    <div className="artifactuse-panel__binary artifactuse-panel__binary--pdf">
                      <iframe src={getBlobUrl(activeArtifact) + '#toolbar=1'} title={activeArtifact.title || 'PDF'} />
                    </div>
                  )}
                  {binaryCategory === 'font' && (
                    <div className="artifactuse-panel__binary artifactuse-panel__binary--font">
                      <div className="artifactuse-panel__font-sample" style={{ fontFamily: fontPreviewName }}>
                        AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz
                      </div>
                      <div className="artifactuse-panel__font-sample artifactuse-panel__font-sample--sm" style={{ fontFamily: fontPreviewName }}>
                        0123456789 !@#$%^&*()
                      </div>
                    </div>
                  )}
                  {binaryCategory === 'binary' && (
                    <div className="artifactuse-panel__binary artifactuse-panel__binary--hex">
                      <pre className="artifactuse-panel__hex-dump">{hexDump}</pre>
                    </div>
                  )}
                </>
              ) : panelUrl ? (
                <iframe
                  ref={iframeRef}
                  src={panelUrl}
                  className={`artifactuse-panel__iframe ${iframeLoading ? 'artifactuse-panel__iframe--loading' : ''}`}
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads allow-top-navigation-by-user-activation"
                  allow="camera; microphone; fullscreen; geolocation; display-capture; autoplay; clipboard-write; encrypted-media; gyroscope; accelerometer; picture-in-picture"
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
          
          {/* Code pane - always mounted, shown/hidden via style */}
          <div
            className="artifactuse-panel__code"
            style={{
              ...(state.viewMode === 'split' ? { width: `${100 - splitPosition}%` } : {}),
              display: (state.viewMode === 'code' || state.viewMode === 'split') ? undefined : 'none',
            }}
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
              <pre className={`artifactuse-panel__code-block language-${normalizedLanguage}`}>
                <code
                  ref={codeRef}
                  className={`language-${normalizedLanguage}`}
                />
              </pre>
            </div>
          </div>

          {/* Edit pane (CodeMirror) */}
          <div
            className="artifactuse-panel__edit"
            style={{ display: state.viewMode === 'edit' ? undefined : 'none' }}
          >
            <div ref={editorContainerRef} className="artifactuse-panel__editor-container" />
          </div>
        </div>

        {/* Console footer */}
        {showConsolePanel && (
          <div className={`artifactuse-panel__console ${consoleExpanded ? 'artifactuse-panel__console--expanded' : ''}`}>
            <div
              className="artifactuse-panel__console-header"
              onClick={() => setConsoleExpanded(e => !e)}
            >
              <svg className="artifactuse-panel__console-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="18 15 12 9 6 15" />
              </svg>
              <span>Console</span>
              <div className="artifactuse-panel__console-filters" onClick={(e) => e.stopPropagation()}>
                {consoleErrorCount > 0 && (
                  <button className={`artifactuse-panel__console-filter artifactuse-panel__console-filter--error${consoleFilter.has('error') ? '' : ' artifactuse-panel__console-filter--inactive'}`} onClick={() => toggleConsoleFilter('error')}>
                    {consoleErrorCount} error{consoleErrorCount !== 1 ? 's' : ''}
                  </button>
                )}
                {consoleWarnCount > 0 && (
                  <button className={`artifactuse-panel__console-filter artifactuse-panel__console-filter--warn${consoleFilter.has('warn') ? '' : ' artifactuse-panel__console-filter--inactive'}`} onClick={() => toggleConsoleFilter('warn')}>
                    {consoleWarnCount} warn
                  </button>
                )}
                {consoleInfoCount > 0 && (
                  <button className={`artifactuse-panel__console-filter artifactuse-panel__console-filter--info${consoleFilter.has('info') ? '' : ' artifactuse-panel__console-filter--inactive'}`} onClick={() => toggleConsoleFilter('info')}>
                    {consoleInfoCount} info
                  </button>
                )}
                {consoleLogCount > 0 && (
                  <button className={`artifactuse-panel__console-filter artifactuse-panel__console-filter--log${consoleFilter.has('log') ? '' : ' artifactuse-panel__console-filter--inactive'}`} onClick={() => toggleConsoleFilter('log')}>
                    {consoleLogCount} log
                  </button>
                )}
              </div>
              <button
                className="artifactuse-panel__console-clear"
                onClick={(e) => { e.stopPropagation(); setConsoleEntries([]); }}
              >
                Clear
              </button>
            </div>
            {consoleExpanded && (
              <div className="artifactuse-panel__console-entries" ref={consoleEntriesRef}>
                {filteredConsoleEntries.map((entry, i) => (
                  <div key={i} className={`artifactuse-panel__console-entry artifactuse-panel__console-entry--${entry.type}`}>
                    <span className="artifactuse-panel__console-type">[{entry.type}]</span>
                    <span className="artifactuse-panel__console-content">{entry.content}</span>
                    <span className="artifactuse-panel__console-timestamp">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

    </>
  );
}